# Infrastructure

Static site on **S3 + CloudFront**, deployed by **GitHub Actions via OIDC**.
Waitlist data lives in **Supabase Postgres**, welcome email goes out through
**Resend**.

```
Browser ──POST──► Supabase Edge Function ──► Postgres (waitlist table)
                            └──────────────► Resend  (welcome email)

Browser ──GET───► CloudFront ──OAC──► S3 (private bucket)
```

**No AWS access keys exist anywhere in this setup.** GitHub presents a
short-lived OIDC token and assumes a role scoped to `main` on one repo.

---

## 0. Use the LanceWise account, not whichever one is default

LanceWise gets its **own AWS account**, isolated from other projects. Blast
radius, billing, and IAM all stay separate.

Configure it as a **named profile** so it is never the ambient default:

```bash
# Preferred: no long-lived keys at all
aws configure sso --profile lancewise
aws sso login --profile lancewise

# Or, with an IAM user in the LanceWise account
aws configure --profile lancewise
```

Then export it for the session, or pass `--profile lancewise` on every command
below:

```bash
export AWS_PROFILE=lancewise      # PowerShell: $env:AWS_PROFILE = 'lancewise'
```

**Check the account before you create anything.** This is the guard rail; run
it every time:

```bash
aws sts get-caller-identity --query Account --output text
```

The LanceWise account, so any mismatch is obvious at a glance:

```
LanceWise AWS account: 386370887118   (alias: umartalpur12)
CLI profile:           lancewise      (IAM user: claude-lancewise)
Region:                us-east-1
```

If that command prints anything else — in particular `986843603823`, which is
a different project on this machine's default profile — stop. You are about to
deploy a CloudFront distribution and an IAM role into the wrong account.

---

## 1. Certificate (do this first)

CloudFront only accepts certificates from **us-east-1**, regardless of where
anything else lives.

```bash
aws acm request-certificate \
  --region us-east-1 \
  --domain-name lancewise.com \
  --subject-alternative-names www.lancewise.com \
  --validation-method DNS \
  --query CertificateArn --output text
```

Then read the validation records and add them in Cloudflare:

```bash
aws acm describe-certificate --region us-east-1 \
  --certificate-arn <ARN> \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'
```

Add each as a **CNAME, DNS-only (grey cloud)**. Proxied records break ACM
validation. Wait for `Status: ISSUED` before moving on — if you run the stack
against a pending certificate it will hang in `CREATE_IN_PROGRESS`.

## 2. Stack

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name lancewise-site \
  --template-file infra/cloudformation.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile lancewise \
  --parameter-overrides \
      DomainName=lancewise.com \
      ProjectName=lancewise \
      CertificateArn=<ARN from step 1> \
      GitHubOrg=mirabdullahdev \
      GitHubRepo=lanceiq \
      CreateOidcProvider=true
```

`ProjectName` names the resources and **must not contain a dot**. A dotted S3
bucket name adds a label to its regional hostname, which the
`*.s3.<region>.amazonaws.com` wildcard certificate does not cover — CloudFront's
origin fetch would then fail TLS verification. Hence `lancewise-site`, not
`lancewise.com-site`.

`CreateOidcProvider=false` if the account already has the GitHub OIDC provider
— an account may only have one, and a duplicate fails the stack. Verified empty
on `386370887118`, so `true` is correct for the first run.

Read the outputs:

```bash
aws cloudformation describe-stacks --region us-east-1 \
  --stack-name lancewise-site \
  --query 'Stacks[0].Outputs' --output table
```

### If the stack fails and rolls back

Two things to know before retrying.

**CloudFront on a new AWS account is gated.** A fresh account gets:

> Your account must be verified before you can add new CloudFront resources.
> To verify your account, please contact AWS Support.

That is an account-level block, not a template problem. Open a **free** Account
and Billing case (Basic Support covers this type) asking for CloudFront to be
enabled, and quote the error. Usually cleared within a few hours.

**The bucket survives a rollback.** `SiteBucket` carries
`DeletionPolicy: Retain`, which protects the live site from a stack deletion —
but it also means a failed first create leaves the bucket orphaned, and the
retry then fails with `BucketAlreadyOwnedByYou`. Clear it first:

```bash
aws s3 rb s3://lancewise-site --force --profile lancewise
aws cloudformation delete-stack --stack-name lancewise-site --region us-east-1 --profile lancewise
```

Only do this while the bucket is still empty — after a real deploy it holds
the live site.

## 3. GitHub configuration

**Settings → Secrets and variables → Actions.**

Secrets (they identify your account, so keep them out of logs):

| Secret | Value |
| --- | --- |
| `AWS_ROLE_ARN` | `DeployRoleArn` output |
| `S3_BUCKET` | `BucketName` output |
| `CLOUDFRONT_DISTRIBUTION_ID` | `DistributionId` output |

Variables (public build config, inlined into the bundle anyway):

| Variable | Value |
| --- | --- |
| `AWS_REGION` | `us-east-1` |
| `VITE_SITE_ORIGIN` | `https://lancewise.com` |
| `VITE_WAITLIST_ENDPOINT` | `https://<project-ref>.supabase.co/functions/v1/subscribe` |
| `VITE_PLAUSIBLE_DOMAIN` | `lancewise.com`, or leave empty for no analytics |

## 4. DNS in Cloudflare

Point both records at the `DistributionDomain` output, **DNS-only (grey
cloud)**. Leave proxying off: CloudFront terminates TLS with the ACM
certificate, and orange-cloud proxying in front of it means two CDNs fighting
over caching for no benefit.

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` | `dxxxxxxxxxxxxx.cloudfront.net` | DNS only |
| CNAME | `www` | `dxxxxxxxxxxxxx.cloudfront.net` | DNS only |

Cloudflare flattens the apex CNAME automatically, which is why this works
without Route 53 alias records.

## 5. Deploy

Push to `main`. The workflow type-checks, lints, builds, uploads in two cache
passes, and waits for the CloudFront invalidation to finish before reporting
success.

---

## Why it is built this way

**Private bucket, not S3 website hosting.** Website-hosting buckets must be
world-readable and only speak HTTP. Origin Access Control keeps the bucket
private and lets only this distribution read it.

**Two upload passes.** Hashed filenames under `/assets/` are immutable and get
a one-year cache. `index.html` keeps its name across every deploy, so it must
revalidate — otherwise a returning visitor holds an old HTML file pointing at
asset filenames that no longer exist, and sees a blank page.

**403 and 404 both map to `/index.html`.** A private S3 origin returns 403, not
404, for a key that does not exist. Without this, a mistyped path shows a raw
S3 XML error.

**`DeletionPolicy: Retain` on the bucket.** Deleting the stack will not delete
the live site.

## Cost

Pennies a month at this traffic. CloudFront's free tier covers 1 TB out and 10
million requests; S3 storage for a ~1 MB site rounds to nothing. The only
fixed cost is the domain. Supabase and Resend free tiers both cover a
pre-launch waitlist comfortably.
