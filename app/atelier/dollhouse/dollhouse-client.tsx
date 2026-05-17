"use client";

/**
 * app/atelier/dollhouse/dollhouse-client.tsx — Dollhouse chamber UI.
 *
 * Structured prompt composer over a doll-character bible. The visitor
 * picks a character, an outfit from that character's wardrobe, an
 * action verb, a room, an aesthetic mode and a shot framing. The
 * chamber assembles a single Imagen prompt out of those fields
 * (mode-base + subject + room-lighting + cinematic style block) and
 * POSTs to `/api/ai/google/generate-image` — the same route the
 * Imagen chamber uses.
 *
 * Result is dropped into the atelier recent-outputs drawer so a
 * sibling chamber can pick it up.
 *
 * Orchestrator only. The bible (CHARACTERS, ACTIONS, ROOMS, MODES,
 * SHOTS, STYLE_BLOCK) lives in dollhouse/bible.ts; data-URL helpers
 * in data-url.ts; types in types.ts; state + onGenerate in
 * use-dollhouse.ts. Per ARCHITECTURE.md Rule 1.
 */

import { useId, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { useActiveChamber } from "lib/state/atelier-hooks";
import { useGoogleAiKeyStore } from "lib/state/google-ai-key";

import { ACTIONS, CHARACTERS, MODES, ROOMS, SHOTS, type Mode } from "./dollhouse/bible";
import type { AspectRatio } from "./dollhouse/types";
import { useDollhouse } from "./dollhouse/use-dollhouse";

export default function DollhouseClient() {
  useActiveChamber("dollhouse");

  const d = useDollhouse();
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const quotaMode = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

  const charFieldId = useId();
  const outfitFieldId = useId();
  const actionFieldId = useId();
  const roomFieldId = useId();
  const modeFieldId = useId();
  const shotFieldId = useId();
  const aspectFieldId = useId();

  return (
    <div className="flex flex-col gap-8">
      {/* Header row: quota mode badge + settings gear */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Quota:{" "}
          <span className="text-chrome-100">
            {quotaMode === "byo" && hasKey
              ? "your AI Studio key"
              : "studio (5/hr)"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          aria-label="Open Google AI quota settings"
        >
          ⚙ Settings
        </button>
      </section>

      {/* Composer grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5" htmlFor={charFieldId}>
          <span className="chrome-label text-chrome-400">Character</span>
          <select
            id={charFieldId}
            value={d.charId}
            onChange={(e) => d.setCharId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} &middot; {c.archetype}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={outfitFieldId}>
          <span className="chrome-label text-chrome-400">Outfit</span>
          <select
            id={outfitFieldId}
            value={d.outfit}
            onChange={(e) => d.setOutfit(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {d.character.wardrobe.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={actionFieldId}>
          <span className="chrome-label text-chrome-400">Action</span>
          <select
            id={actionFieldId}
            value={d.actionId}
            onChange={(e) => d.setActionId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={roomFieldId}>
          <span className="chrome-label text-chrome-400">Room</span>
          <select
            id={roomFieldId}
            value={d.roomId}
            onChange={(e) => d.setRoomId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {ROOMS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.floor} &middot; {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={modeFieldId}>
          <span className="chrome-label text-chrome-400">Aesthetic mode</span>
          <select
            id={modeFieldId}
            value={d.modeId}
            onChange={(e) => d.setModeId(e.target.value as Mode["id"])}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor={shotFieldId}>
          <span className="chrome-label text-chrome-400">Shot framing</span>
          <select
            id={shotFieldId}
            value={d.shotId}
            onChange={(e) => d.setShotId(e.target.value)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            {SHOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label
          className="flex flex-col gap-1.5 md:col-span-2"
          htmlFor={aspectFieldId}
        >
          <span className="chrome-label text-chrome-400">Aspect ratio</span>
          <select
            id={aspectFieldId}
            value={d.aspectRatio}
            onChange={(e) => d.setAspectRatio(e.target.value as AspectRatio)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            <option value="16:9">16:9 &middot; cinematic</option>
            <option value="4:3">4:3 &middot; classic</option>
            <option value="1:1">1:1 &middot; square</option>
            <option value="9:16">9:16 &middot; mobile</option>
            <option value="3:4">3:4 &middot; book</option>
          </select>
        </label>
      </section>

      {/* Composed prompt preview */}
      <section className="flex flex-col gap-2">
        <span className="chrome-label text-chrome-400">Composed prompt</span>
        <pre className="overflow-auto rounded-sm border border-warm-black-700 bg-warm-black-950 p-3 text-xs leading-relaxed whitespace-pre-wrap text-chrome-200">
          {d.composedPrompt}
        </pre>
      </section>

      {/* Generate button + state */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void d.onGenerate()}
          disabled={d.output.kind === "running"}
          className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {d.output.kind === "running" ? "Generating…" : "→ Generate frame"}
        </button>

        {d.output.kind === "running" ? (
          <p className="text-xs text-chrome-400">
            Imagen typically returns in 8&ndash;20 seconds.
          </p>
        ) : null}
      </section>

      {/* Errors */}
      {d.output.kind === "error" ? (
        <section className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-sm text-pink-100">
          <p>{d.output.message}</p>
          {d.output.code === "no_key" ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-3 rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
            >
              Open settings
            </button>
          ) : null}
          {d.output.code === "studio_capped" ? (
            <p className="mt-2 text-xs text-pink-200/80">
              Cap resets in roughly{" "}
              {d.output.retryAfterSec
                ? `${Math.ceil(d.output.retryAfterSec / 60)} min`
                : "an hour"}
              . Or open settings and paste your own AI Studio key for
              unbounded use.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Result */}
      {d.output.kind === "ready" ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="chrome-label text-chrome-400">
              Ready &middot; {d.output.images.length} frame &middot;{" "}
              {(d.output.durationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {d.output.images.map((img, i) => (
              <figure
                key={`${img.mimeType}-${i}`}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={`Dollhouse result ${i + 1}`}
                  className="w-full rounded-sm"
                />
                <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                    {img.mimeType}
                  </span>
                  <button
                    type="button"
                    onClick={() => d.onDownload(img.dataUrl, i)}
                    className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:bg-pink-200/20"
                  >
                    Download
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-chrome-500">
            Dropped into the recent-outputs drawer at the bottom-right of the
            page; a sibling chamber that accepts an image input can pick it up.
          </p>
        </section>
      ) : null}

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
