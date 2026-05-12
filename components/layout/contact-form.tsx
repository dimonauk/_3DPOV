"use client";

import { useState } from "react";

type Intent = "general" | "commission" | "bureau" | "aerial" | "press";

const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: "general", label: "General enquiry" },
  { value: "commission", label: "Commission / wall array" },
  { value: "bureau", label: "Print bureau" },
  { value: "aerial", label: "Aerial / drone work" },
  { value: "press", label: "Press / feature" },
];

export function ContactForm() {
  const [intent, setIntent] = useState<Intent>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading") return;
    setErrorText(null);
    setState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, intent }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorText(body.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setErrorText("Network error.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-sm border border-pink-200/30 bg-pink-200/5 p-6">
        <div className="chrome-label text-pink-200">Sent</div>
        <p className="mt-2 text-chrome-200">
          Thanks &mdash; the studio will reply within a day or two. If it's
          urgent you can also reach us directly at{" "}
          <a
            href="mailto:contact@holoflow.co.uk"
            className="text-pink-200 underline underline-offset-4"
          >
            contact@holoflow.co.uk
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-intent" className="chrome-label block mb-2">
          About
        </label>
        <select
          id="contact-intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value as Intent)}
          className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
        >
          {INTENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="chrome-label block mb-2">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="chrome-label block mb-2">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="chrome-label block mb-2">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          placeholder={
            intent === "commission"
              ? "The room, the wall, the rough dimensions, what the space feels like. No need to be exact."
              : intent === "bureau"
                ? "Paper preference, size, quantity, deadline. Files welcome."
                : intent === "aerial"
                  ? "Site, intent, deliverable, dates. Stills, motion, FPV, 360°, or aerial light painting — let me know which."
                  : intent === "press"
                    ? "Publication, deadline, angle."
                    : "Whatever it is. We read every one."
          }
        />
      </div>

      {state === "error" && errorText && (
        <p className="text-xs text-pink-300">{errorText}</p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="chrome-label rounded-sm border border-pink-200/40 bg-pink-200/10 px-6 py-3 text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:opacity-50"
      >
        {state === "loading" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
