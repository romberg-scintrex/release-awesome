"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";

import { Turnstile } from "@/components/Elements/Turnstile";
import { Field } from "@/components/Elements/Field";
import { useContactForm } from "@/hooks/useContactForm";
import { cn, inputClasses } from "@/lib/utils";

export function ContactForm() {
  const [state, actions] = useContactForm();
  const { fields, status, errorMsg } = state;

  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <form
      onSubmit={actions.submit}
      noValidate
      className="relative rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-ink-900 p-6 sm:p-8"
    >
      <div className="grid gap-5">
        <Field label="Your name" htmlFor="name" error={fields.name.error}>
          <input
            id="name"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Release Awesome"
            aria-invalid={!!fields.name.error}
            aria-describedby={fields.name.error ? "name-error" : undefined}
            {...actions.bind("name")}
            className={inputClasses(fields.name.error)}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={fields.email.error}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            aria-invalid={!!fields.email.error}
            aria-describedby={fields.email.error ? "email-error" : undefined}
            {...actions.bind("email")}
            className={inputClasses(fields.email.error)}
          />
        </Field>

        <Field label="Subject (optional)" htmlFor="subject" error={fields.subject.error}>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="Quick hello, role inquiry, project idea…"
            aria-invalid={!!fields.subject.error}
            aria-describedby={fields.subject.error ? "subject-error" : undefined}
            {...actions.bind("subject")}
            className={inputClasses(fields.subject.error)}
          />
        </Field>

        <Field label="Message" htmlFor="message" error={fields.message.error}>
          <textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Tell me what you're working on…"
            aria-invalid={!!fields.message.error}
            aria-describedby={fields.message.error ? "message-error" : undefined}
            {...actions.bind("message")}
            className={cn(inputClasses(fields.message.error), "min-h-[140px] resize-y")}
          />
        </Field>

        {/* Honeypot — off-screen; real users never see or fill it. */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={state.honeypot}
            onChange={(e) => actions.setHoneypot(e.target.value)}
          />
        </div>

        {TURNSTILE_SITE_KEY && (
          <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={actions.setTurnstileToken} />
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-ink-400">
            Submitting sends a friendly email — no marketing, no spam.
          </p>
          <button
            type="submit"
            disabled={status === "submitting"}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 dark:bg-white px-5 text-sm font-medium text-white dark:text-ink-950",
              "transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0",
              "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]",
            )}
          >
            {status === "submitting" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Send message
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status toast */}
      <AnimatePresence>
        {(status === "success" || status === "error") && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "mt-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
              status === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            )}
          >
            {status === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {status === "success"
              ? "Message sent. I'll reply within a day."
              : (errorMsg ?? "Something went wrong. Please try again.")}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
