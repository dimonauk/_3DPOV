"use client";

import { useState } from "react";

/**
 * Newsletter signup. Posts to /api/newsletter, which today accepts any
 * email and returns success — ship the UI now, wire Klaviyo (or
 * whichever ESP) into the route handler later. The form UX is the
 * slow part to get right; swapping the provider is five minutes.
 */
export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="chrome-label text-pink-200">
        Subscribed — watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder="your@email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="chrome-label rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-2 text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:opacity-50"
      >
        {state === "loading" ? "Sending…" : "Subscribe"}
      </button>
      {state === "error" && (
        <p className="text-xs text-pink-300">
          Something failed. Try again in a moment.
        </p>
      )}
    </form>
  );
}
