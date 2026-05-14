"use client";

import { useEffect, useState } from "react";

type Intent =
  | "general"
  | "commission"
  | "bureau"
  | "aerial"
  | "press"
  | "speaking"
  | "collaboration";

const INTENT_OPTIONS: { value: Intent; label: string }[] = [
  { value: "general", label: "General enquiry" },
  { value: "commission", label: "Commission" },
  { value: "bureau", label: "Print bureau" },
  { value: "aerial", label: "Aerial / drone work" },
  { value: "speaking", label: "Speaking or workshops" },
  { value: "press", label: "Editorial / press" },
  { value: "collaboration", label: "Collaboration" },
];

const VALID_INTENTS = new Set<Intent>(INTENT_OPTIONS.map((o) => o.value));

function parseIntentFromQuery(): Intent {
  if (typeof window === "undefined") return "general";
  try {
    const raw = new URLSearchParams(window.location.search).get("intent");
    if (raw && VALID_INTENTS.has(raw as Intent)) return raw as Intent;
  } catch {
    /* fall through */
  }
  return "general";
}

export function ContactForm() {
  const [intent, setIntent] = useState<Intent>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  // Preselect the dropdown from ?intent= when the page loads — the
  // Services page links here with the relevant line preselected.
  useEffect(() => {
    setIntent(parseIntentFromQuery());
  }, []);

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
          Got it. I read every one. Expect a reply within a day or two.
          If it&rsquo;s urgent, put &ldquo;urgent&rdquo; in the subject
          and write directly to{" "}
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
          placeholder={placeholderFor(intent)}
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

function placeholderFor(intent: Intent): string {
  switch (intent) {
    case "commission":
      return "Single-exposure light-painting photograph, a waveguide object, a custom POV rig, or drone capture of a heritage site or worksite — tell me which, the room or location, the rough dimensions, the dates. No need to be exact — that's what the conversation is for.";
    case "bureau":
      return "Paper preference, size, quantity, deadline. Files welcome; rough scans fine.";
    case "aerial":
      return "Site, intent, deliverable, dates. Stills, motion, FPV, 360°, or aerial light painting — tell me which and I'll tell you which airframe.";
    case "speaking":
      return "Event, audience, format (talk, demo, hands-on workshop), date and place, budget if there is one. Topics: flow arts, immersive systems, AI agent orchestration, parametric manufacturing.";
    case "press":
      return "Publication, deadline, angle. The more specific, the faster I can answer usefully.";
    case "collaboration":
      return "What you're building, where it overlaps with the studio (AI, phygital pipelines, immersive media), and what shape you imagine the collaboration taking.";
    case "general":
    default:
      return "Whatever it is. I read every one.";
  }
}
