# LanceWise — pre-launch landing page

A single-page waitlist site for LanceWise, a decision engine for Upwork
freelancers. Vite + React + TypeScript on **S3 + CloudFront**, deployed by
GitHub Actions using OIDC. Signups go to a **Supabase edge function** that
writes the row into Postgres and sends the welcome email through **Resend**.

```
Browser ──POST──► Supabase edge function ──► Postgres (waitlist table)
                            └──────────────► Resend  (welcome email)

Browser ──GET───► CloudFront ──OAC──► S3 (private bucket)
```

Infrastructure lives in [`infra/`](infra/README.md), the database and endpoint
in [`supabase/`](supabase/README.md).

```bash
npm install
npm run dev
```

## What's where

```
src/
  config/site.ts         every environment-dependent string, one file
  lib/lattice.ts         the hero's geometry — shared by WebGL and the SVG still
  lib/motion.ts          the page's easing + variant vocabulary
  lib/waitlist.ts        zod schema + the fetch to the worker
  components/
    three/               HeroField (WebGL) and LatticeStill (the fallback)
    demo/steps.tsx       the three walkthrough panels
    features/visuals.tsx one small animation per feature card
    sections/            Hero, Problem, HowItWorks, Features, Trust, Waitlist
supabase/
  migrations/            the waitlist table
  functions/subscribe    signup endpoint, sends the welcome email
infra/
  cloudformation.yml     S3 + CloudFront + the GitHub OIDC deploy role
```

## Configuration

Everything environment-dependent lives in `.env`, and `index.html` reads the
same variables through Vite's `%VITE_*%` substitution. None of it is secret —
it is all inlined into the browser bundle.

| Variable                 | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `VITE_SITE_ORIGIN`       | canonical URL, `og:url`, `og:image`                   |
| `VITE_WAITLIST_ENDPOINT` | Supabase `subscribe` function                         |
| `VITE_PLAUSIBLE_DOMAIN`  | analytics; **leave empty and no script loads at all** |

Changing domain means two files: `.env` and `public/sitemap.xml`.

## Deploying

> **Current status: CloudFront is blocked.** The AWS account is subject to a
> verification hold — `"Your account must be verified before you can add new
> CloudFront resources"` — which applies to the console and the API alike, and
> which upgrading off the Free Plan did **not** clear. It needs an AWS Support
> case. Everything else in the stack builds fine, and the ACM certificate is
> already issued and validated.
>
> **Interim: Cloudflare Pages**, building from this repo. Chosen over making
> the S3 bucket public because it keeps end-to-end TLS and leaves no insecure
> config to remember to undo on switchover.

**Target architecture** (`infra/README.md`): GitHub Actions assumes an AWS role
via OIDC — no stored access keys — builds, uploads in two cache passes, then
invalidates CloudFront.

The workflow is guarded by `if: vars.AWS_DEPLOY_ENABLED == 'true'`, so it stays
dormant until the stack exists rather than failing on every push. Set that
repository variable to `true` once CloudFront is up.

Supabase deploys separately — see [`supabase/README.md`](supabase/README.md).

## Social card

`public/og.png` is generated, not hand-made:

```bash
python scripts/make-og.py
```

Re-run it whenever the headline or the logo changes. It needs only Pillow and
draws the card directly, so there is no headless browser and no display
required. It uses Georgia and Segoe UI, which are the fallbacks `og.html`
already declares for Fraunces and Inter.

`public/og.html` is kept as the reference layout. Screenshotting that at
exactly 1200×630 is the higher-fidelity route if you have a browser to hand,
since it uses the real webfonts.

## Before launch

Verified working: RLS blocks the public anon key from reading, inserting or
deleting on both tables (tested against a seeded row, not assumed); duplicate
signups collapse on a `citext` unique index; CORS holds from a real browser
origin; input is validated and length-capped server side.

Genuinely outstanding:

- [ ] **Rate limiting.** The endpoints are public and unthrottled. `curl`
      ignores the origin allowlist, and the honeypot only catches lazy bots.
      Once Resend is live, flooding the endpoint means real mail from your
      domain to invented addresses — bounces and spam complaints that damage
      sending reputation before launch. This is the highest-priority gap.
- [ ] **Privacy policy and Terms** are `#` placeholders while the form collects
      email addresses. GDPR expects a notice at the point of collection.
- [ ] **`ALLOWED_ORIGINS`** still includes both localhost ports.
- [ ] **The optional "Your name" field** on the closing form is collected, used
      nowhere and stored nowhere. Delete it or store it.
- [ ] **`og.png`** does not exist — link previews will be blank.
- [ ] **Resend** unconfigured. Signups are captured; the success copy adapts
      via the `emailed` flag rather than promising an email that won't arrive.
- [ ] **Test rows** from smoke tests are still in `waitlist`.
- [ ] **No double opt-in** — anyone can enter someone else's address.

## Performance rules

These are not preferences. Breaking them is how the page got slow the first
time, and the symptoms are diffuse and hard to trace back.

**Only `opacity` and `transform` are ever animated.** They are the only two
properties a browser can animate on the compositor. `clip-path`, `filter`,
`height`, `box-shadow` and `background-color` all force a repaint or a reflow
on every frame. The reveal animations used to animate `clip-path` per word —
a nine-word headline meant nine simultaneous repaint loops.

**No `backdrop-filter` on anything `fixed` or `sticky`.** A fixed element with
a backdrop filter re-blurs its region on every scroll frame for the entire
length of the page. The nav bar did this and it was the single most expensive
thing on the site, precisely because it never stopped.

**No layout animations.** No `layoutId`, no `height: auto`. Both make the
browser measure and reflow mid-animation.

**Nothing per-frame on the main thread in the hero.** The WebGL scene uploads
its geometry once; the sweep is computed in the vertex shader from a single
`uTime` uniform. If you find yourself writing a `useFrame` that loops over
instances, put it in the shader instead.

## Design notes

Two decisions worth knowing before editing anything:

**Mint (`#72db97`) is never text on white.** It sits at roughly 1.8:1 contrast,
which fails WCAG AA badly. It's a surface and a mark — buttons, dots, fills.
Green *text* is always `--color-forest` (`#2e7d32`, 5.2:1). Primary buttons are
mint with near-black labels, which clears AA comfortably and looks far less
generic than white-on-green.

**The hero lattice is an argument, not decoration.** A field of job postings,
almost all dim, a handful lit. `lib/lattice.ts` generates it from a fixed seed
so the WebGL scene and the reduced-motion SVG show the *same* arrangement, and
so it doesn't reshuffle on every reload.

WebGL only mounts on wide, fine-pointer, ≥4GB devices with reduced-motion off,
and only after `requestIdleCallback`. Everywhere else gets the SVG — same
picture, several hundred kb less JavaScript.

## Things deliberately left out

- **No testimonials or signup counts.** `WAITLIST_COUNT` in `config/site.ts` is
  `null`, and the counter renders an honest statement instead of a number. Set
  it when there's a real one. Nothing here is invented social proof.
- **No platform logos.** A "trusted by Upwork" logo wall would imply an
  affiliation that doesn't exist. The footer says so explicitly.
- **No hover sounds.** They were in the brief; they're a bounce driver on a page
  people arrive at from a link, and autoplaying audio fails accessibility
  review. Easy to add later if you disagree.
- **No countdown timer.** Fake scarcity is the fastest way to lose this
  audience in particular.

## Accessibility

Keyboard-navigable throughout, visible focus rings, the walkthrough is a proper
ARIA tablist with arrow-key support, and every animation respects
`prefers-reduced-motion`. Colour pairings were checked against AA rather than
eyeballed.
