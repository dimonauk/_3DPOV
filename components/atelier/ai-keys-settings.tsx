"use client";

/**
 * components/atelier/ai-keys-settings.tsx — Unified BYO-API-key settings
 * dialog for AI-powered chambers.
 *
 * Supports three providers via a single modal: Google AI Studio (for
 * Imagen / Gemini multimodal), Anthropic (for Claude via the dialogue
 * capability or future text-LLM chambers), and Z.ai (for GLM models).
 *
 * Each chamber that uses an AI provider mounts this with the
 * `providers` prop scoped to what it actually needs. e.g. the Imagen
 * chamber renders `<AiKeysSettings providers={["google"]} />`; a
 * future text-LLM chamber would render
 * `<AiKeysSettings providers={["anthropic", "zai"]} />`.
 *
 * # Storage posture
 *
 * Each provider's slice lives in its own localStorage entry
 * (`holoflow-google-ai-key-v1`, `holoflow-anthropic-key-v1`,
 * `holoflow-zai-key-v1`). Keys never travel to the studio's server;
 * each chamber's API route forwards them via a per-provider header
 * (`X-Visitor-Google-Key`, `X-Visitor-Anthropic-Key`,
 * `X-Visitor-Zai-Key`).
 */

import { useState } from "react";

import { useAnthropicKeyStore } from "lib/state/anthropic-key";
import { useGoogleAiKeyStore } from "lib/state/google-ai-key";
import { useZaiKeyStore } from "lib/state/zai-key";

export type AiKeyProvider = "google" | "anthropic" | "zai";

type ProviderMeta = {
  id: AiKeyProvider;
  label: string;
  mintUrl: string;
  description: string;
};

const PROVIDERS: Record<AiKeyProvider, ProviderMeta> = {
  google: {
    id: "google",
    label: "Google AI Studio",
    mintUrl: "https://aistudio.google.com/app/apikey",
    description:
      "Powers Imagen 4 (text → image) and Gemini multimodal edit. Free tier is generous; pay-as-you-go after.",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    mintUrl: "https://console.anthropic.com/settings/keys",
    description:
      "Powers Aura's chat + any future text-generation chamber. Premium quality, premium price.",
  },
  zai: {
    id: "zai",
    label: "Z.ai (GLM)",
    mintUrl: "https://docs.z.ai/guides/overview/quick-start",
    description:
      "Cheap, fast, capable. Good for bulk drafts; pair with Claude for polish. Hosted in China — review your data-residency posture before sending sensitive content.",
  },
};

type AiKeysSettingsProps = {
  /** Which providers to show. Order is honoured. */
  providers: ReadonlyArray<AiKeyProvider>;
  /** Called when the dialog should close (backdrop click, escape, or
   *  a "Done" button). */
  onClose: () => void;
};

export default function AiKeysSettings({
  providers,
  onClose,
}: AiKeysSettingsProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-black-950/70 px-4 backdrop-blur"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-sm border border-warm-black-700 bg-warm-black-950 p-6"
      >
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base uppercase tracking-[0.18em] text-chrome-100">
            AI provider keys
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500 hover:text-pink-200"
          >
            Done
          </button>
        </header>

        <p className="mb-6 text-xs leading-relaxed text-chrome-400">
          Bring your own API keys. They&rsquo;re stored in your browser
          only &mdash; the studio&rsquo;s server never sees them.
          Each call goes browser &rarr; provider directly (or through
          the studio&rsquo;s Vercel AI Gateway when no visitor key is
          set, in which case the studio pays).
        </p>

        <div className="flex flex-col gap-6">
          {providers.map((p) => (
            <ProviderSection key={p} meta={PROVIDERS[p]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderSection({ meta }: { meta: ProviderMeta }) {
  if (meta.id === "google") return <GoogleSection meta={meta} />;
  if (meta.id === "anthropic") return <AnthropicSection meta={meta} />;
  return <ZaiSection meta={meta} />;
}

function GoogleSection({ meta }: { meta: ProviderMeta }) {
  const key = useGoogleAiKeyStore((s) => s.key);
  const mode = useGoogleAiKeyStore((s) => s.mode);
  const setKey = useGoogleAiKeyStore((s) => s.setKey);
  const setMode = useGoogleAiKeyStore((s) => s.setMode);
  const clearKey = useGoogleAiKeyStore((s) => s.clearKey);
  return (
    <KeyEditor
      meta={meta}
      mode={mode}
      onModeChange={setMode}
      keyValue={key}
      onKeyChange={setKey}
      onClear={clearKey}
    />
  );
}

function AnthropicSection({ meta }: { meta: ProviderMeta }) {
  const key = useAnthropicKeyStore((s) => s.key);
  const mode = useAnthropicKeyStore((s) => s.mode);
  const setKey = useAnthropicKeyStore((s) => s.setKey);
  const setMode = useAnthropicKeyStore((s) => s.setMode);
  const clearKey = useAnthropicKeyStore((s) => s.clearKey);
  return (
    <KeyEditor
      meta={meta}
      mode={mode}
      onModeChange={setMode}
      keyValue={key}
      onKeyChange={setKey}
      onClear={clearKey}
    />
  );
}

function ZaiSection({ meta }: { meta: ProviderMeta }) {
  const key = useZaiKeyStore((s) => s.key);
  const mode = useZaiKeyStore((s) => s.mode);
  const setKey = useZaiKeyStore((s) => s.setKey);
  const setMode = useZaiKeyStore((s) => s.setMode);
  const clearKey = useZaiKeyStore((s) => s.clearKey);
  return (
    <KeyEditor
      meta={meta}
      mode={mode}
      onModeChange={setMode}
      keyValue={key}
      onKeyChange={setKey}
      onClear={clearKey}
    />
  );
}

function KeyEditor({
  meta,
  mode,
  onModeChange,
  keyValue,
  onKeyChange,
  onClear,
}: {
  meta: ProviderMeta;
  mode: "studio" | "byo";
  onModeChange: (m: "studio" | "byo") => void;
  keyValue: string;
  onKeyChange: (v: string) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState(keyValue);
  return (
    <section className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm text-chrome-100">{meta.label}</h3>
        <a
          href={meta.mintUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:text-pink-100"
        >
          Get a key
        </a>
      </header>
      <p className="mb-3 text-xs leading-relaxed text-chrome-400">
        {meta.description}
      </p>

      <div className="mb-3 flex gap-4 font-mono text-[0.65rem] uppercase tracking-[0.15em]">
        <label className="flex items-center gap-2 text-chrome-300">
          <input
            type="radio"
            name={`${meta.id}-mode`}
            checked={mode === "studio"}
            onChange={() => onModeChange("studio")}
          />
          Studio quota
        </label>
        <label className="flex items-center gap-2 text-chrome-300">
          <input
            type="radio"
            name={`${meta.id}-mode`}
            checked={mode === "byo"}
            onChange={() => onModeChange("byo")}
          />
          My own key
        </label>
      </div>

      {mode === "byo" ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your API key"
            rows={2}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1.5 font-mono text-xs text-chrome-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onKeyChange(draft)}
              disabled={draft.trim() === keyValue.trim()}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20 disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                onClear();
                setDraft("");
              }}
              disabled={keyValue.length === 0}
              className="rounded-sm border border-warm-black-700 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500 hover:border-pink-400/40 hover:text-pink-300 disabled:opacity-40"
            >
              Clear
            </button>
            {keyValue.length > 0 ? (
              <span className="self-center font-mono text-[0.6rem] uppercase tracking-[0.15em] text-emerald-300">
                Saved
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
