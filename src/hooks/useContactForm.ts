"use client";

import { useCallback, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface FieldState {
  value: string;
  touched: boolean;
  error: string | null;
}

export type FormStatus = "idle" | "submitting" | "success" | "error";

export type FieldKey = "name" | "email" | "subject" | "message";

export interface ContactFormState {
  fields: Record<FieldKey, FieldState>;
  status: FormStatus;
  errorMsg: string | null;
  turnstileToken: string | null;
  honeypot: string;
}

type SubmitEvent = { preventDefault: () => void };

export interface ContactFormActions {
  bind: (key: FieldKey) => {
    value: string;
    onBlur: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };
  setTurnstileToken: (token: string | null) => void;
  setHoneypot: (value: string) => void;
  submit: (e: SubmitEvent) => Promise<void>;
}

// ─── Validation ─────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RULES: Record<FieldKey, (value: string) => string | null> = {
  name: (v) => (!v ? "This field is required." : null),
  email: (v) => {
    if (!v) return "This field is required.";
    if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
    return null;
  },
  subject: () => null, // optional
  message: (v) => {
    if (!v) return "This field is required.";
    if (v.length < 10) return "Tell me a little more — at least 10 characters.";
    return null;
  },
};

function validate(key: FieldKey, value: string): string | null {
  return RULES[key](value.trim());
}

// ─── Constants ──────────────────────────────────────────────────────────────
const EMPTY_FIELD: FieldState = { value: "", touched: false, error: null };

const INITIAL_FIELDS: Record<FieldKey, FieldState> = {
  name: EMPTY_FIELD,
  email: EMPTY_FIELD,
  subject: EMPTY_FIELD,
  message: EMPTY_FIELD,
};

const FIELD_KEYS: FieldKey[] = ["name", "email", "subject", "message"];
const STATUS_RESET_DELAY = 4500;

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useContactForm(): [ContactFormState, ContactFormActions] {
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  // Ref to avoid stale closure issues with the status reset timer.
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReset = useCallback((delay = STATUS_RESET_DELAY) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), delay);
  }, []);

  // ─── Field binding (input props) ───────────────────────────────────────
  const updateField = useCallback((key: FieldKey, partial: Partial<FieldState>) => {
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
  }, []);

  const bind = useCallback(
    (key: FieldKey) => ({
      value: fields[key].value,
      onBlur: () => {
        updateField(key, { touched: true, error: validate(key, fields[key].value) });
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        const error = fields[key].touched ? validate(key, value) : null;
        updateField(key, { value, error });
      },
    }),
    [fields, updateField],
  );

  // ─── Submit ────────────────────────────────────────────────────────────
  const submit = useCallback(
    async (e: SubmitEvent) => {
      e.preventDefault();

      // Touch all fields and collect validation errors.
      let hasError = false;
      const nextFields = { ...fields };

      for (const key of FIELD_KEYS) {
        const error = validate(key, nextFields[key].value);
        nextFields[key] = { ...nextFields[key], touched: true, error };
        if (error) hasError = true;
      }
      setFields(nextFields);
      if (hasError) return;

      // Turnstile gate
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (siteKey && !turnstileToken) {
        setErrorMsg("Please complete the captcha below.");
        setStatus("error");
        scheduleReset();
        return;
      }

      // Send
      setStatus("submitting");
      setErrorMsg(null);

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fields.name.value,
            email: fields.email.value,
            subject: fields.subject.value,
            message: fields.message.value,
            company: honeypot,
            turnstileToken,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };

        if (!res.ok || !data.ok) {
          setErrorMsg(data.error ?? "Something went wrong. Please try again.");
          setStatus("error");
          window.turnstile?.reset();
          setTurnstileToken(null);
          scheduleReset(5000);
          return;
        }

        // Success — reset everything.
        setStatus("success");
        setFields(INITIAL_FIELDS);
        setHoneypot("");
        window.turnstile?.reset();
        setTurnstileToken(null);
        scheduleReset();
      } catch {
        setErrorMsg("Network error — please try again.");
        setStatus("error");
        scheduleReset(5000);
      }
    },
    [fields, honeypot, turnstileToken, scheduleReset],
  );

  const state: ContactFormState = { fields, status, errorMsg, turnstileToken, honeypot };
  const actions: ContactFormActions = { bind, setTurnstileToken, setHoneypot, submit };

  return [state, actions];
}
