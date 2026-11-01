"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus, MailCheck } from "lucide-react";
import { Field } from "@/components/Elements/Field";
import { Turnstile } from "@/components/Elements/Turnstile";
import { cn, inputClasses } from "@/lib/utils";
import {
  USERNAME_MIN,
  USERNAME_MAX,
  normalizeUsername,
  isValidUsernameFormat,
  USERNAME_ERROR_MESSAGE,
} from "@/lib/username";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function RegisterForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [token, setToken] = useState<string | null>(null);

  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  // Format only, and only once they have left the field. Reserved and taken
  // come back from the server, which is the only place that can know.
  const formatError =
    touched && username.length > 0 && !isValidUsernameFormat(normalizeUsername(username))
      ? USERNAME_ERROR_MESSAGE.format
      : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizeUsername(username),
          email,
          password,
          company,
          turnstileToken: token ?? "",
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        confirmEmail?: boolean;
      };

      if (!data.ok) {
        setError(data.error ?? "Could not create your account.");
        setSubmitting(false);
        return;
      }

      if (data.confirmEmail) {
        setConfirmEmail(true);
        setSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-ink-900">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--accent)/0.12)]">
          <MailCheck size={20} className="text-[rgb(var(--accent))]" />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold">Confirm your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
          We sent a link to <strong>{email}</strong>. Open it to finish signing up,
          then come back and sign in.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-xl border border-black/10 px-4 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink-900"
    >
      <Field label="Username" htmlFor="username" error={formatError}>
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 select-none text-sm text-ink-400">/</span>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setTouched(true)}
            className={inputClasses(formatError)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
            aria-describedby={formatError ? "username-error" : "username-hint"}
            placeholder="your-name"
          />
        </div>
        {!formatError && (
          <p id="username-hint" className="mt-1.5 text-xs text-ink-400">
            Your portfolio will live at <span className="font-mono">/{normalizeUsername(username) || "your-name"}</span>
          </p>
        )}
      </Field>

      <Field label="Email" htmlFor="email" error={null}>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses(null)}
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" error={null}>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClasses(null)}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="mt-1.5 text-xs text-ink-400">At least 8 characters.</p>
      </Field>

      {/* Honeypot — hidden from people, not from bots. Not aria-hidden alone:
          it is also removed from the tab order and from assistive tech. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {SITE_KEY && <Turnstile siteKey={SITE_KEY} onToken={setToken} />}

      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl",
          "bg-ink-950 text-sm font-medium text-white transition-colors",
          "hover:bg-ink-800 disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          "dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100",
        )}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {submitting ? "Creating your account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-ink-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[rgb(var(--fg))] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
