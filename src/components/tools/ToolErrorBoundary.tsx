"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Catches a throw from inside one embedded tool.
 *
 * These tools parse untrusted input - arbitrary JSON, arbitrary JWTs,
 * arbitrary files - so a throw is a normal outcome of a hostile paste, not an
 * exceptional event. Without a boundary it would blank the whole route.
 *
 * A class component because React still has no hook equivalent for
 * componentDidCatch.
 */
export class ToolErrorBoundary extends Component<
  { toolName: string; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { toolName: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[tool] crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-medium">{this.props.toolName} stopped working</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
              Something in that input broke the tool. Reload the page to try
              again — the rest of this portfolio is unaffected.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
