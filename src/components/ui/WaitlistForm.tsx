import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Nudge } from './Button'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { OFFER } from '../../config/site'
import {
  joinWaitlist,
  waitlistSchema,
  WaitlistError,
  type WaitlistInput,
  type WaitlistResult,
} from '../../lib/waitlist'

type Props = {
  /** `inline` is the hero's one-line capture; `full` is the closing section. */
  layout?: 'inline' | 'full'
  className?: string
  submitLabel?: string
}

export function WaitlistForm({ layout = 'inline', className, submitLabel }: Props) {
  const uid = useId()
  const [result, setResult] = useState<WaitlistResult | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (values: WaitlistInput) => {
    setServerError(null)
    try {
      setResult(await joinWaitlist(values))
    } catch (err) {
      setServerError(
        err instanceof WaitlistError ? err.message : 'Something went wrong. Try again?',
      )
    }
  }

  if (result) return <SuccessPanel result={result} layout={layout} className={className} />

  const emailId = `${uid}-email`
  const nameId = `${uid}-name`
  const errorId = `${uid}-email-error`

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn('w-full', className)}
      aria-busy={isSubmitting}
    >
      {/* Honeypot — off-screen rather than display:none, which some bots skip. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input id={`${uid}-company`} tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      {layout === 'full' && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Field label="Your name" hint="optional" htmlFor={nameId}>
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              placeholder="Jordan Ellis"
              className={inputClass}
              {...register('name')}
            />
          </Field>
          <Field label="Email address" htmlFor={emailId}>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@email.com"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? errorId : undefined}
              className={cn(inputClass, errors.email && 'border-ember/60')}
              {...register('email')}
            />
          </Field>
        </div>
      )}

      {layout === 'inline' ? (
        <div
          className={cn(
            'glass-blur flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5',
            'transition-shadow duration-500 [transition-timing-function:var(--ease-out-quint)]',
            'focus-within:shadow-[0_0_0_3px_rgba(114,219,151,0.35)]',
            errors.email && 'shadow-[0_0_0_3px_rgba(194,65,12,0.18)]',
          )}
        >
          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@email.com"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? errorId : undefined}
            className="h-11 min-w-0 flex-1 bg-transparent px-4 text-[0.95rem] text-ink placeholder:text-slate focus:outline-none"
            {...register('email')}
          />
          <Button type="submit" size="md" disabled={isSubmitting} className="shrink-0 sm:px-6">
            <SubmitLabel busy={isSubmitting} label={submitLabel ?? `Secure ${OFFER.discount} off`} />
          </Button>
        </div>
      ) : (
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto sm:px-9">
          <SubmitLabel busy={isSubmitting} label={submitLabel ?? 'Save my spot'} />
        </Button>
      )}

      <AnimatePresence mode="wait">
        {(errors.email ?? serverError) && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE.quint }}
            className="mt-3 flex items-start gap-2 px-1 text-[0.83rem] text-ember"
          >
            <span aria-hidden="true" className="mt-[0.35em] inline-block h-1 w-1 rounded-full bg-ember" />
            {errors.email?.message ?? serverError}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-3 px-1 text-[0.78rem] text-slate">
        Join the waitlist and get up to {OFFER.discount} off!
      </p>
    </form>
  )
}

/* ------------------------------------------------------------------ */

const inputClass =
  'h-12 w-full rounded-xl border border-rule bg-white/70 px-4 text-[0.95rem] text-ink ' +
  'placeholder:text-slate transition-colors duration-300 ' +
  '[transition-timing-function:var(--ease-out-quint)] ' +
  'hover:border-rule-strong focus:border-forest/50 focus:bg-white focus:outline-none'

function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-baseline gap-2 text-[0.8rem] font-medium text-graphite"
      >
        {label}
        {hint && <span className="font-mono text-[0.68rem] tracking-wide text-slate">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function SubmitLabel({ busy, label }: { busy: boolean; label: string }) {
  if (busy) {
    return (
      <>
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
        </span>
        Saving your spot
      </>
    )
  }
  return (
    <>
      {label}
      <Nudge />
    </>
  )
}

/* ------------------------------------------------------------------ */

function SuccessPanel({
  result,
  layout,
  className,
}: {
  result: WaitlistResult
  layout: 'inline' | 'full'
  className?: string
}) {
  const already = result.status === 'already'
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE.quint }}
      className={cn(
        'glass rounded-2xl p-5',
        layout === 'inline' ? 'sm:rounded-3xl' : '',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint/25">
          <motion.svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
            <motion.path
              d="M4.5 12.5 9.5 17.5 19.5 7"
              fill="none"
              stroke="var(--color-forest)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, delay: 0.15, ease: EASE.quint }}
            />
          </motion.svg>
        </span>

        <div>
          <p className="font-display text-[1.15rem] leading-snug font-semibold text-graphite">
            {already ? "You're already on the list." : "You're in."}
          </p>
          {/* Only promises an inbox when one is actually coming. The server
              reports whether email is configured, so this corrects itself the
              day a Resend key is added. */}
          <p className="mt-1 text-[0.88rem] leading-relaxed text-slate">
            {already ? (
              result.emailed ? (
                <>
                  We've got this address down. Your {OFFER.discount} code is in the welcome email.
                  Search your inbox for LanceWise.
                </>
              ) : (
                <>We've got this address down, so you won't lose your place.</>
              )
            ) : (
              <>
                {result.emailed ? (
                  <>
                    Check your inbox. Your {OFFER.discount}-off code for the first {OFFER.months}{' '}
                    months is in there, and it's yours whenever we launch.
                  </>
                ) : (
                  <>
                    Your {OFFER.discount} off for the first {OFFER.months} months is locked in.
                    We'll send the code before launch.
                  </>
                )}
                {result.position !== null && (
                  <>
                    {' '}
                    You're <span className="tabular text-forest">#{result.position}</span> in line.
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Show the code on screen as well as emailing it. Email is not a
          reliable channel — spam folders, typos, bounces — and the visitor
          should never lose their discount to a delivery failure. */}
      {result.status === 'joined' && result.code && (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-rule bg-mist px-4 py-3">
          <span className="font-mono text-[0.62rem] tracking-[0.16em] text-forest uppercase">
            Your code
          </span>
          <code className="tabular text-[1.05rem] font-semibold tracking-[0.14em] text-graphite select-all">
            {result.code}
          </code>
          <span className="text-[0.78rem] text-slate">
            {OFFER.discount} off your first {OFFER.months} months
          </span>
        </div>
      )}

    </motion.div>
  )
}
