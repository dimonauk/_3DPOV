"use client";

/**
 * app/atelier/pattern-prototype/pattern-prototype-client.tsx
 *
 * Ported from D:/The_Hangar/apps/prototypes/threadlogic-ai-pattern-prototyper/
 * Original was a Vite/React-19 app with four "modes" (Style / Dolly /
 * Draft / Archive), a sidebar of garment controls, a Gemini pattern-
 * draft call, a sandboxed Function-constructor pattern executor, and
 * a floating chat bot.
 *
 * Orchestrator only. Defaults in defaults.ts; sidebar nav + controls
 * in sidebar-panel.tsx; mannequin SVG in studio-view.tsx;
 * Flux-textile prompt + previews in textile-view.tsx; live pattern
 * SVG + topology JSON + style sliders in pattern-editor.tsx; types
 * in types.ts; icons in icons.tsx; engine helpers in
 * pattern-logic.ts; floating chat in chat-bot.tsx. Per
 * ARCHITECTURE.md Rule 1.
 *
 * Port notes:
 *
 * - The original Hangar prototype made Gemini calls direct from the
 *   browser using `process.env.API_KEY` baked into the Vite build —
 *   that pattern never resolves in a Next.js client bundle (which
 *   ignores non-NEXT_PUBLIC env vars on the client side) and would
 *   leak the key if it did. This port uses the visitor's BYO AI
 *   Studio key (already wired into the imagen chamber via
 *   `lib/state/google-ai-key`) for the Gemini-direct path, and a
 *   server-side admin-gated route (`/api/atelier/pattern-prototype/
 *   generate-textile`) for the bench-backed Flux1-dev path. No env
 *   var is read on the client. If neither key is configured the
 *   page surfaces a settings prompt.
 * - The mock FreeSewing executor (Point/Path classes inside a
 *   `new Function(...)` sandbox) lives in `pattern-logic.ts` — tiny
 *   and load-bearing for the demo.
 * - Tailwind classes are the original "rose / cyan / slate" set;
 *   the chamber sits inside the page chrome but doesn't try to
 *   adopt the site palette (the prototype's whole point is that
 *   it's a vivid mode-switching demo).
 */

import { useCallback, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { useAuth } from "components/auth/auth-provider";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";
import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "lib/state/google-ai-key";

import ChatBot from "./chat-bot";
import { DEFAULT_MEASUREMENTS, DEFAULT_OUTFIT } from "./defaults";
import {
  Icon,
  ICON_ARCHIVE,
  ICON_PALETTE,
  ICON_PRINTER,
  ICON_SPARKLES,
  ICON_WAND,
} from "./icons";
import { PatternEditor } from "./pattern-editor";
import {
  executePatternLogic,
  generatePattern,
} from "./pattern-logic";
import { SidebarPanel } from "./sidebar-panel";
import { StudioView } from "./studio-view";
import { TextileView } from "./textile-view";
import type {
  AppMode,
  MeasurementSet,
  OutfitState,
  PatternGenerationResult,
  TextileState,
} from "./types";

const log = createLogger("atelier:pattern-prototype");
const textileLog = createLogger("atelier:pattern-prototype:textile");

export default function PatternPrototypeClient() {
  useActiveChamber("pattern-prototype");

  const [mode, setMode] = useState<AppMode>("editorial");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PatternGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<OutfitState>(DEFAULT_OUTFIT);
  const [measurements, setMeasurements] =
    useState<MeasurementSet>(DEFAULT_MEASUREMENTS);
  const [options, setOptions] = useState<Record<string, number>>({
    length: 0.5,
    waistFit: 1.0,
    fullness: 0.2,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [textilePrompt, setTextilePrompt] = useState("");
  const [textile, setTextile] = useState<TextileState>({ kind: "idle" });

  const mode_key = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);
  const { user } = useAuth();

  const handleDraft = useCallback(async () => {
    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    if (!visitorKey) {
      setError("paste an AI Studio key in settings to draft a pattern.");
      setSettingsOpen(true);
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const prompt = `Draft a FreeSewing pattern function for a 1950s ${outfit.jacket} and ${outfit.bottom}.
Aesthetic: Pink Dreamy Tween, Sears Catalog Style.
Include a function named 'draftPattern(measurements, options)'.
Logic: Extract Bezier curves for a stylized silhouette.`;
      const patternResult = await generatePattern(prompt, visitorKey);
      setResult(patternResult);
      setMode("blueprint");

      // Drop the SVG path string into the recent-outputs drawer as
      // an svg blob so a sibling chamber can pick it up.
      const svgPath = executePatternLogic(
        patternResult.code,
        measurements,
        options,
      );
      if (svgPath) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 200 200"><path d="${svgPath}" fill="none" stroke="#be123c" stroke-width="0.5"/></svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        pushAtelierOutput({
          chamberSlug: "pattern-prototype",
          kind: "image",
          label: `pattern-${Date.now()}.svg`,
          blobUrl: URL.createObjectURL(blob),
          mimeType: "image/svg+xml",
          sizeBytes: blob.size,
        });
      }
    } catch (err) {
      log.error("draft failed", { err: String(err) });
      setError(
        err instanceof Error
          ? err.message
          : "pattern engine refused. retry or change the prompt.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [outfit.jacket, outfit.bottom, measurements, options]);

  const handleGenerateTextile = useCallback(async () => {
    const trimmed = textilePrompt.trim();
    if (!trimmed) {
      setTextile({ kind: "error", message: "type a prompt first." });
      return;
    }
    if (!user) {
      setTextile({
        kind: "error",
        message: "sign in as an operator to generate on the bench.",
      });
      return;
    }
    const startedAt = Date.now();
    setTextile({ kind: "loading", startedAt, prompt: trimmed });
    textileLog.info("generate requested", {
      promptPreview: trimmed.slice(0, 80),
    });
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        "/api/atelier/pattern-prototype/generate-textile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ prompt: trimmed }),
        },
      );
      const data = (await res.json()) as {
        url?: string;
        bytes?: number;
        generatedAt?: string;
        durationMs?: number;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `bench returned HTTP ${res.status}.`);
      }
      const durationMs = data.durationMs ?? Date.now() - startedAt;
      setTextile({
        kind: "ready",
        url: data.url,
        prompt: trimmed,
        bytes: data.bytes ?? 0,
        durationMs,
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      pushAtelierOutput({
        chamberSlug: "pattern-prototype",
        kind: "image",
        label: `textile-${stamp}.png`,
        blobUrl: data.url,
        mimeType: "image/png",
        sizeBytes: data.bytes ?? 0,
      });
      textileLog.info("generate done", {
        durationMs,
        bytes: data.bytes ?? 0,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "unknown generation error.";
      textileLog.error("generate failed", { err });
      setTextile({ kind: "error", message });
    }
  }, [textilePrompt, user]);

  return (
    <div className="flex flex-col gap-6">
      {/* Quota badge + settings */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-3 py-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
          Engine:{" "}
          <span className="text-chrome-100">
            {mode_key === "byo" && hasKey
              ? "your AI Studio key"
              : "byo only — paste a key in settings"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-300 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          aria-label="Open Google AI quota settings"
        >
          settings
        </button>
      </section>

      {/* Embedded studio. Uses the original prototype's palette so the
         mode shifts read as designed (pink/cyan/sepia). */}
      <div className="threadlogic-shell relative flex min-h-[720px] overflow-hidden rounded-sm border border-warm-black-700 font-[Inter,sans-serif]">
        <SidebarPanel
          mode={mode}
          setMode={setMode}
          outfit={outfit}
          setOutfit={setOutfit}
          measurements={measurements}
          setMeasurements={setMeasurements}
          onDraft={handleDraft}
          isGenerating={isGenerating}
        />

        <main
          className={`flex flex-1 flex-col p-6 transition-colors duration-700 ${
            mode === "blueprint"
              ? "bg-slate-900 text-cyan-400"
              : mode === "playroom"
                ? "bg-[#fffcf9] text-rose-950"
                : mode === "archive"
                  ? "bg-[#f4ebe0] text-rose-950"
                  : mode === "textile"
                    ? "bg-warm-black-950 text-chrome-100"
                    : "bg-[#fff1f2] text-rose-950"
          }`}
        >
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg ${
                  mode === "blueprint"
                    ? "bg-cyan-500 text-slate-900"
                    : mode === "textile"
                      ? "bg-pink-200 text-warm-black-950"
                      : "bg-rose-500 text-white"
                }`}
              >
                {mode === "editorial" ? <Icon d={ICON_WAND} size={16} /> : null}
                {mode === "playroom" ? (
                  <Icon d={ICON_SPARKLES} size={16} />
                ) : null}
                {mode === "blueprint" ? (
                  <Icon d={ICON_PRINTER} size={16} />
                ) : null}
                {mode === "archive" ? (
                  <Icon d={ICON_ARCHIVE} size={16} />
                ) : null}
                {mode === "textile" ? (
                  <Icon d={ICON_PALETTE} size={16} />
                ) : null}
              </div>
              <div>
                <h2
                  className={`text-2xl leading-none tracking-tight ${
                    mode === "blueprint"
                      ? "text-white"
                      : mode === "textile"
                        ? "text-chrome-100"
                        : "text-rose-900"
                  }`}
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {mode === "editorial"
                    ? "Le Grand Salon"
                    : mode === "playroom"
                      ? "Petit Playroom"
                      : mode === "blueprint"
                        ? "Logic Terminal"
                        : mode === "textile"
                          ? "Textile (Flux)"
                          : "Historical Archive"}
                </h2>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.4em] opacity-60">
                  Dimension: {mode} // Engine: ThreadLogic v2.0
                </p>
              </div>
            </div>

            {mode === "textile" ? null : (
              <button
                type="button"
                onClick={handleDraft}
                disabled={isGenerating}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
                  mode === "blueprint"
                    ? "bg-cyan-500 text-slate-900"
                    : "bg-rose-900 text-white"
                }`}
              >
                <Icon d={ICON_SPARKLES} size={12} />{" "}
                {isGenerating ? "drafting…" : "Inverse Graph"}
              </button>
            )}
          </header>

          {error ? (
            <div className="mb-4 rounded-sm border border-pink-400/50 bg-pink-900/20 px-4 py-2 text-xs text-pink-200">
              {error}
            </div>
          ) : null}

          <div className="relative flex-1">
            {mode === "blueprint" ? (
              <PatternEditor
                code={result?.code ?? ""}
                measurements={measurements}
                options={options}
                setOptions={setOptions}
              />
            ) : mode === "textile" ? (
              <TextileView
                prompt={textilePrompt}
                setPrompt={setTextilePrompt}
                textile={textile}
                onGenerate={handleGenerateTextile}
                hasUser={Boolean(user)}
              />
            ) : (
              <StudioView outfit={outfit} mode={mode} />
            )}
          </div>

          <ChatBot />

          <footer
            className={`mt-4 flex justify-between text-[9px] font-black uppercase tracking-[0.4em] opacity-40 ${
              mode === "blueprint" ? "text-cyan-200" : "text-rose-400"
            }`}
          >
            <div>© ThreadLogic Studio // System Status: Nominal</div>
            <div className="flex gap-6">
              <span>Latent Space: Connected</span>
              <span>Ref: Tween_Dreamy_Sears_v2</span>
            </div>
          </footer>
        </main>
      </div>

      <GoogleAiSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
