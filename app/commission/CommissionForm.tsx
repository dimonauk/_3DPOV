"use client";

/**
 * CommissionForm — client component for the commission enquiry page.
 *
 * POSTs to /api/contact with intent: "commission".
 * All fields are optional except name + email + project type.
 */

import { useState } from "react";

const PROJECT_TYPES = [
  {
    value: "heritage",
    label: "Heritage Documentation",
    hint: "Photogrammetry, 3D archive, WebXR delivery, Heritage England-compliant.",
  },
  {
    value: "vr",
    label: "VR Development",
    hint: "VRM character, WebXR scene, soul server, KokoroTTS voice integration.",
  },
  {
    value: "parametric",
    label: "Parametric Manufacturing",
    hint: "Waveguide jewellery, sculpture, desktop art — generative geometry → print farm.",
  },
  {
    value: "performance",
    label: "Live Performance",
    hint: "Poi + laser + evolving resin sculpture. Neo London / AntiGravity — booked as a live act.",
  },
  {
    value: "other",
    label: "Something else",
    hint: "Describe it below.",
  },
] as const;

const BUDGET_RANGES = [
  "Under £500",
  "£500 – £1,500",
  "£1,500 – £5,000",
  "£5,000 – £15,000",
  "£15,000+",
  "TBD / Let's discuss",
] as const;

type State = "idle" | "sending" | "sent" | "error";

export function CommissionForm({ initialType = "" }: { initialType?: string }) {
  const [projectType, setProjectType] = useState(initialType);
  const [budget, setBudget] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      intent: "commission",
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      projectType,
      budget,
      timeline: fd.get("timeline") as string,
      message: fd.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setState("sent");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded border border-[var(--color-border,rgba(6,182,212,0.35))] p-8 text-center">
        <p className="text-lg font-medium">Enquiry received.</p>
        <p className="mt-2 text-sm text-[var(--color-muted,#64748b)]">
          I'll read it and reply within two working days with a quote and intake call link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name + Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
            Name
          </span>
          <input
            name="name"
            required
            className="w-full rounded border border-[var(--color-border,rgba(6,182,212,0.35))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary,#7ff0d4)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-[var(--color-border,rgba(6,182,212,0.35))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary,#7ff0d4)]"
          />
        </label>
      </div>

      {/* Project type */}
      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
          Project type
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => setProjectType(pt.value)}
              className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                projectType === pt.value
                  ? "border-[var(--color-primary,#7ff0d4)] bg-[rgba(127,240,212,0.08)]"
                  : "border-[var(--color-border,rgba(6,182,212,0.35))]"
              }`}
            >
              <span className="font-medium">{pt.label}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-muted,#64748b)]">
                {pt.hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Budget + Timeline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
            Indicative budget
          </span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded border border-[var(--color-border,rgba(6,182,212,0.35))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary,#7ff0d4)]"
          >
            <option value="">— select —</option>
            {BUDGET_RANGES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
            Timeline
          </span>
          <input
            name="timeline"
            placeholder="e.g. 'before December', 'flexible'"
            className="w-full rounded border border-[var(--color-border,rgba(6,182,212,0.35))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary,#7ff0d4)]"
          />
        </label>
      </div>

      {/* Brief */}
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
          Brief
        </span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="What are you trying to make? Reference images, links, or rough spec all help."
          className="w-full rounded border border-[var(--color-border,rgba(6,182,212,0.35))] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-primary,#7ff0d4)]"
        />
      </label>

      {state === "error" && (
        <p className="text-xs text-red-400">
          Send failed ({errorMsg}). Try emailing studio@holoflow.co.uk directly.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending" || !projectType}
        className="rounded border border-[var(--color-primary,#7ff0d4)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary,#7ff0d4)] transition-colors hover:bg-[rgba(127,240,212,0.08)] disabled:opacity-40"
      >
        {state === "sending" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
