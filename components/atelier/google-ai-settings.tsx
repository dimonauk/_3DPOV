"use client";

/**
 * components/atelier/google-ai-settings.tsx — modal dialog that lets
 * a visitor paste their own Google AI Studio API key, or stay on the
 * studio's quota (default).
 *
 * Reusable across any AI generation chamber. The chamber owns the
 * open/closed state via a local `useState<boolean>` and renders this
 * component conditionally; this component does not own the gear-icon
 * button — the chamber renders that next to its primary action.
 *
 * # Honesty contract
 *
 * The key the visitor pastes is held in localStorage in their browser
 * only (via `lib/state/google-ai-key`). The studio's server never
 * sees it during steady-state; when the visitor triggers a
 * generation, the chamber sends the key in an `X-Visitor-Google-Key`
 * request header which the route forwards to Google and discards.
 * Copy in this dialog is the same copy the route enforces.
 */

import { useId, useState } from "react";

import { useGoogleAiKeyStore } from "lib/state/google-ai-key";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function GoogleAiSettings({ open, onClose }: Props) {
  const storedKey = useGoogleAiKeyStore((s) => s.key);
  const mode = useGoogleAiKeyStore((s) => s.mode);
  const setKey = useGoogleAiKeyStore((s) => s.setKey);
  const setMode = useGoogleAiKeyStore((s) => s.setMode);
  const clearKey = useGoogleAiKeyStore((s) => s.clearKey);

  const [draft, setDraft] = useState<string>(storedKey);
  const titleId = useId();

  if (!open) return null;

  const onSave = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      clearKey();
    } else {
      setKey(trimmed);
      setMode("byo");
    }
    onClose();
  };

  const onClear = () => {
    setDraft("");
    clearKey();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-warm-black-950/80 backdrop-blur-sm"
      onClick={(e) => {
        // click on backdrop closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-12 w-full max-w-lg rounded-sm border border-warm-black-700 bg-warm-black-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2
            id={titleId}
            className="text-lg text-chrome-100"
          >
            Google AI &middot; quota settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400 hover:text-pink-200"
            aria-label="Close settings"
          >
            Close
          </button>
        </div>

        <p className="mb-4 text-sm text-chrome-300">
          These chambers call Google&rsquo;s Imagen and Gemini models.
          By default the studio eats the cost on a small free-tier
          allowance. If you want unlimited generations &mdash; or
          you&rsquo;re hitting the studio cap &mdash; paste your own
          AI Studio key and the call goes browser &rarr; Google
          directly, on your quota.
        </p>

        <fieldset className="mb-4 flex flex-col gap-3">
          <legend className="chrome-label mb-1 text-chrome-400">
            Source of the API key
          </legend>

          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 hover:border-warm-black-700">
            <input
              type="radio"
              name="google-ai-mode"
              value="studio"
              checked={mode === "studio"}
              onChange={() => setMode("studio")}
              className="mt-1 accent-pink-200"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-chrome-100">
                Studio quota{" "}
                <span className="text-chrome-400">(default)</span>
              </span>
              <span className="text-xs text-chrome-400">
                Uses the studio&rsquo;s server key. Capped at a
                handful of calls per IP per hour to keep the free
                tier from being eaten by abuse.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 hover:border-warm-black-700">
            <input
              type="radio"
              name="google-ai-mode"
              value="byo"
              checked={mode === "byo"}
              onChange={() => setMode("byo")}
              className="mt-1 accent-pink-200"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-chrome-100">
                Use my AI Studio key
              </span>
              <span className="text-xs text-chrome-400">
                The call goes browser &rarr; Google directly. No cap
                from this site. Your key is stored in your browser
                only; the studio&rsquo;s server never sees it
                in steady state, and it&rsquo;s never logged.
              </span>
            </span>
          </label>
        </fieldset>

        <label className="mb-1 flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Your AI Studio key
          </span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="AIza..."
            rows={2}
            spellCheck={false}
            autoComplete="off"
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-100 focus:border-pink-200 focus:outline-none"
          />
        </label>
        <p className="mb-4 text-xs text-chrome-500">
          Don&rsquo;t have one?{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
          >
            Get a free AI Studio key &rarr;
          </a>{" "}
          Free tier is generous; no card required.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-pink-200/40 hover:text-pink-200"
          >
            Clear key
          </button>
          <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
            {storedKey
              ? "Key stored in this browser"
              : "No key stored"}
          </span>
        </div>
      </div>
    </div>
  );
}
