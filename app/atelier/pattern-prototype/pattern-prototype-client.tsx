"use client";

/**
 * app/atelier/pattern-prototype/pattern-prototype-client.tsx
 *
 * Ported from D:/The_Hangar/apps/prototypes/threadlogic-ai-pattern-prototyper/
 * Original was a Vite/React-19 app with four "modes" (Style /
 * Dolly / Draft / Archive), a sidebar of garment controls, a Gemini
 * pattern-draft call, a sandboxed Function-constructor pattern
 * executor, and a floating chat bot.
 *
 * Port notes:
 *
 * - All UI inlined here. The original split into Sidebar /
 *   StudioView / GarmentLayer / PatternEditor / ChatBot — fine for
 *   a standalone app, overkill for one chamber.
 * - lucide-react isn't installed on the site, so the handful of
 *   icons are inline SVGs.
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
 *   `new Function(...)` sandbox) is inlined verbatim — it's tiny
 *   and load-bearing for the demo.
 * - Tailwind classes are the original "rose / cyan / slate" set;
 *   the chamber sits inside the page chrome but doesn't try to
 *   adopt the site palette (the prototype's whole point is that
 *   it's a vivid mode-switching demo).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { useAuth } from "components/auth/auth-provider";
import { createLogger } from "lib/log";
import { useActiveChamber, pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  useGoogleAiKeyStore,
  activeVisitorKey,
} from "lib/state/google-ai-key";

import ChatBot from "./chat-bot";
import {
  Icon,
  ICON_ARCHIVE,
  ICON_CHAT,
  ICON_HEART,
  ICON_LAYERS,
  ICON_PALETTE,
  ICON_PRINTER,
  ICON_RULER,
  ICON_SEND,
  ICON_SHIRT,
  ICON_SPARKLES,
  ICON_WAND,
  ICON_X,
} from "./icons";
import {
  executePatternLogic,
  generatePattern,
} from "./pattern-logic";
import type {
  AppMode,
  ChatMessage,
  MeasurementSet,
  OutfitState,
  PatternGenerationResult,
  TextileState,
} from "./types";

const log = createLogger("atelier:pattern-prototype");
const textileLog = createLogger("atelier:pattern-prototype:textile");

// ---------------- Client root ----------------

const DEFAULT_OUTFIT: OutfitState = {
  jacket: "bolero",
  bottom: "circle_skirt",
  accessories: ["pearls", "bonnet"],
  color: "#fb7185",
  pattern: "solid",
};

const DEFAULT_MEASUREMENTS: MeasurementSet = {
  bust: 88,
  waist: 68,
  hips: 92,
  height: 165,
};

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

// ---------------- Sidebar ----------------

function SidebarPanel({
  mode,
  setMode,
  outfit,
  setOutfit,
  measurements,
  setMeasurements,
  onDraft,
  isGenerating,
}: {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  outfit: OutfitState;
  setOutfit: (o: OutfitState) => void;
  measurements: MeasurementSet;
  setMeasurements: (m: MeasurementSet) => void;
  onDraft: () => void;
  isGenerating: boolean;
}) {
  const isDark = mode === "blueprint";

  const toggleAccessory = (acc: string) =>
    setOutfit({
      ...outfit,
      accessories: outfit.accessories.includes(acc)
        ? outfit.accessories.filter((a) => a !== acc)
        : [...outfit.accessories, acc],
    });

  return (
    <div
      className={`relative z-10 flex h-full w-72 flex-col border-r shadow-2xl transition-all duration-500 ${
        isDark
          ? "border-white/10 bg-slate-900 text-cyan-200"
          : "border-rose-100 bg-white/70 text-rose-900 backdrop-blur"
      }`}
    >
      <div className="px-6 pt-6 pb-3">
        <h3
          className={`text-2xl leading-none ${
            isDark ? "text-white" : "text-rose-900"
          }`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          Atelier
        </h3>
        <p
          className={`mt-1 text-[8px] font-black uppercase tracking-[0.4em] ${
            isDark ? "text-cyan-400" : "text-rose-400"
          }`}
        >
          Generative Pattern Engine
        </p>
      </div>

      <div className="flex flex-1 flex-col space-y-6 px-6 pb-6">
        <div
          className={`grid grid-cols-5 gap-1 rounded-2xl border p-1 ${
            isDark
              ? "border-white/10 bg-black/40"
              : "border-rose-100 bg-rose-50/80"
          }`}
        >
          {(
            [
              { id: "editorial" as AppMode, icon: ICON_WAND, label: "Style" },
              { id: "playroom" as AppMode, icon: ICON_SHIRT, label: "Dolly" },
              { id: "blueprint" as AppMode, icon: ICON_RULER, label: "Draft" },
              {
                id: "textile" as AppMode,
                icon: ICON_PALETTE,
                label: "Textile",
              },
              {
                id: "archive" as AppMode,
                icon: ICON_ARCHIVE,
                label: "History",
              },
            ]
          ).map((nav) => (
            <button
              key={nav.id}
              type="button"
              title={nav.label}
              onClick={() => setMode(nav.id)}
              className={`flex flex-col items-center justify-center rounded-xl py-2 transition-all ${
                mode === nav.id
                  ? isDark
                    ? "bg-cyan-500 text-slate-900 shadow-lg"
                    : "bg-rose-500 text-white shadow"
                  : isDark
                    ? "text-slate-500 hover:text-cyan-400"
                    : "text-rose-300 hover:text-rose-500"
              }`}
            >
              <Icon d={nav.icon} size={14} />
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {mode !== "blueprint" ? (
            <>
              <section>
                <div className="mb-3 flex items-center gap-2 opacity-60">
                  <Icon d={ICON_LAYERS} size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Construction
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "circle_skirt", label: "Circle" },
                    { id: "pencil_skirt", label: "Pencil" },
                    { id: "pleated", label: "Pleated" },
                    { id: "none", label: "Bare" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setOutfit({ ...outfit, bottom: s.id })}
                      className={`rounded-xl border py-2 text-[10px] font-bold uppercase tracking-tighter transition-all ${
                        outfit.bottom === s.id
                          ? "border-rose-400 bg-rose-500 text-white shadow"
                          : "border-rose-50 bg-white/50 text-rose-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2 opacity-60">
                  <Icon d={ICON_PALETTE} size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Latent Color
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-rose-50 bg-white/30 p-3">
                  {[
                    "#fb7185",
                    "#be123c",
                    "#ec4899",
                    "#f472b6",
                    "#fff1f2",
                    "#fda4af",
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Set colour ${c}`}
                      onClick={() => setOutfit({ ...outfit, color: c })}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        outfit.color === c
                          ? "scale-125 border-rose-900 shadow"
                          : "border-white hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2 opacity-60">
                  <Icon d={ICON_SPARKLES} size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Embellishments
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["pearls", "bonnet", "bow", "tabs"].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => toggleAccessory(acc)}
                      className={`rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase transition-all ${
                        outfit.accessories.includes(acc)
                          ? "border-rose-900 bg-rose-900 text-white"
                          : "border-rose-50 bg-white/50 text-rose-300"
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <h4 className="mb-1 text-[11px] font-black uppercase tracking-widest text-cyan-400">
                  Inverse Transformer
                </h4>
                <p className="text-[10px] leading-relaxed text-cyan-200/60">
                  Extracting topology from 2D pixel distribution. Resolution:
                  Sub-millimeter.
                </p>
              </div>

              {(Object.keys(measurements) as (keyof MeasurementSet)[]).map(
                (key) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-cyan-400">
                      <span>{key}</span>
                      <span className="opacity-50">{measurements[key]}MM</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="150"
                      value={measurements[key]}
                      onChange={(e) =>
                        setMeasurements({
                          ...measurements,
                          [key]: parseInt(e.target.value, 10),
                        })
                      }
                      aria-label={key}
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-500"
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDraft}
          disabled={isGenerating}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow transition-all active:scale-95 disabled:opacity-50 ${
            isDark
              ? "bg-cyan-500 text-slate-900"
              : "bg-rose-900 text-white"
          }`}
        >
          <Icon d={ICON_SPARKLES} size={12} />{" "}
          {isGenerating ? "drafting…" : "draft pattern"}
        </button>
      </div>

      <div
        className={`flex items-center justify-between border-t p-4 ${
          isDark
            ? "border-white/5 bg-black/20"
            : "border-rose-100 bg-white/20"
        }`}
      >
        <span
          className={`text-[9px] font-black uppercase tracking-widest ${
            isDark ? "text-cyan-800" : "text-rose-200"
          }`}
        >
          ThreadLogic Orchestrator
        </span>
        <Icon d={ICON_HEART} size={12} />
      </div>
    </div>
  );
}

// ---------------- Studio view ----------------

function StudioView({ outfit, mode }: { outfit: OutfitState; mode: AppMode }) {
  const isPlayroom = mode === "playroom";
  const isEditorial = mode === "editorial";
  const isArchive = mode === "archive";

  const containerClass = isPlayroom
    ? "bg-white rounded-[3rem] border-[14px] border-rose-50/50 p-10 shadow-[inset_0_4px_40px_rgba(0,0,0,0.05)]"
    : isEditorial
      ? "bg-white rounded-3xl p-6 shadow-[0_30px_80px_-20px_rgba(251,113,133,0.3)]"
      : "bg-[#f4ebe0] rounded-lg grayscale-[0.2] sepia-[0.3] brightness-[0.9] contrast-[1.1]";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden transition-all duration-1000 ${containerClass}`}
    >
      <div
        className={`relative flex h-[480px] w-[480px] items-center justify-center transition-transform duration-1000 ${
          isArchive ? "rotate-[-1deg] scale-90" : "scale-105"
        }`}
      >
        <svg
          className="absolute h-full w-full drop-shadow-2xl"
          viewBox="0 0 100 100"
        >
          {/* Mannequin */}
          <path
            d="M50,15 C45,15 42,20 42,25 C42,28 44,30 46,31 L46,35 Q40,40 38,55 L38,85 Q50,90 62,85 L62,55 Q60,40 54,35 L54,31 C56,30 58,28 58,25 C58,20 55,15 50,15"
            fill={isArchive ? "#eaddca" : isEditorial ? "#fffcf9" : "#fff7ed"}
            stroke={isArchive ? "#8b4513" : "#fecdd3"}
            strokeWidth={isArchive ? "0.3" : "0.5"}
          />
          {/* Blouse */}
          <path
            d="M32,22 L68,22 L72,55 L28,55 Z"
            fill="#fffcf2"
            stroke="#fda4af"
            strokeWidth="0.5"
          />
          {/* Bottom */}
          {outfit.bottom === "circle_skirt" ? (
            <path
              d="M25,45 Q50,40 75,45 L85,85 Q50,95 15,85 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : outfit.bottom === "pencil_skirt" ? (
            <path
              d="M30,45 L70,45 L72,85 L28,85 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : outfit.bottom === "pleated" ? (
            <path
              d="M28,45 L72,45 L78,85 L22,85 Z M40,46 L40,85 M50,46 L50,85 M60,46 L60,85"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : null}
          {/* Jacket */}
          <path
            d="M30,22 Q50,18 70,22 L75,48 Q50,42 25,48 Z"
            fill={outfit.color}
            stroke="#be123c"
            strokeWidth="0.5"
          />
          {outfit.accessories.includes("pearls") ? (
            <g fill="#fefce8" stroke="#e2e8f0" strokeWidth="0.05">
              {[38, 42, 46, 50, 54, 58, 62].map((x, i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={28 + Math.sin(i * 0.8) * 1.5}
                  r="1.2"
                />
              ))}
            </g>
          ) : null}
          {outfit.accessories.includes("bonnet") ? (
            <path
              d="M35,10 Q50,0 65,10 L75,25 Q50,15 25,25 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.5"
            />
          ) : null}
          {outfit.accessories.includes("bow") ? (
            <path
              d="M42,52 L58,52 L62,65 L38,65 Z"
              fill={outfit.color}
              stroke="#be123c"
              strokeWidth="0.3"
            />
          ) : null}
        </svg>

        {isPlayroom ? (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
            viewBox="0 0 100 100"
          >
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              fill="none"
              stroke="#4c1d95"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              rx="10"
            />
            <text
              x="4"
              y="6"
              fontSize="2"
              fill="#4c1d95"
              className="font-mono opacity-50"
            >
              CUT HERE (1:1 SCALE)
            </text>
          </svg>
        ) : null}

        {isArchive ? (
          <div className="absolute right-0 top-0 m-6 flex flex-col items-end border border-rose-900/20 bg-white/50 p-3">
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">
              Plate No. 420
            </span>
            <span
              className="text-lg italic text-rose-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Sears Tween Dream
            </span>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-8 right-8 text-right opacity-40">
        <span
          className="text-2xl italic text-rose-900"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {isEditorial
            ? "La Parisienne"
            : isPlayroom
              ? "Little Dolly"
              : "Vintage Engraving"}
        </span>
      </div>
    </div>
  );
}

// ---------------- Textile view ----------------
//
// Second creation mode for the chamber. Visitor types a textile/fabric
// prompt; the page POSTs to `/api/atelier/pattern-prototype/generate-textile`
// which calls `viz.generate-comfyui` with the `flux1-dev-fp8` workflow on
// the studio bench; the resulting raster comes back as a Vercel-Blob URL
// and we render it as both a wall-art preview (full-bleed) and a tile
// preview (CSS `background-size: 25%`) so the visitor sees how the
// pattern repeats across a surface.

function TextileView({
  prompt,
  setPrompt,
  textile,
  onGenerate,
  hasUser,
}: {
  prompt: string;
  setPrompt: (s: string) => void;
  textile: TextileState;
  onGenerate: () => void;
  hasUser: boolean;
}) {
  const isLoading = textile.kind === "loading";
  const buttonLabel = isLoading ? "generating…" : "Generate textile";

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left column: prompt + wall-art preview */}
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-400">
            Textile prompt
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. tessellated honeycomb in copper and ink"
            rows={3}
            className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-xs text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
          />
        </label>

        {hasUser ? null : (
          <p className="rounded-sm border border-warm-black-700 bg-warm-black-900/50 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
            sign in as an operator to generate on the bench.
          </p>
        )}

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading || !prompt.trim()}
          className="flex items-center justify-center gap-2 rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-pink-200 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon d={ICON_SPARKLES} size={12} />
          {buttonLabel}
        </button>

        {textile.kind === "loading" ? (
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
            generating on the bench… ~10-30s
          </p>
        ) : null}

        {textile.kind === "error" ? (
          <p className="rounded-sm border border-pink-400/50 bg-pink-900/20 px-3 py-2 font-mono text-[0.7rem] text-pink-200">
            {textile.message}
          </p>
        ) : null}

        <div className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-400">
            Wall-art preview
          </span>
          <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-900">
            {textile.kind === "ready" ? (
              // The bench-hosted URL is intentionally rendered as a raw
              // <img>; we don't need next/image's optimizer for a
              // generated artefact and `unoptimized` would still go
              // through the loader.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={textile.url}
                alt={textile.prompt}
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                {textile.kind === "loading"
                  ? "waiting on bench…"
                  : "no textile yet."}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right column: tile preview */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-400">
          Tile preview
        </span>
        <div
          className="min-h-[420px] flex-1 rounded-sm border border-warm-black-700 bg-warm-black-900"
          style={
            textile.kind === "ready"
              ? {
                  backgroundImage: `url(${textile.url})`,
                  backgroundSize: "25%",
                  backgroundRepeat: "repeat",
                }
              : undefined
          }
          aria-label="tile preview"
        >
          {textile.kind === "ready" ? null : (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                tile preview appears here.
              </span>
            </div>
          )}
        </div>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-500">
          this is how it repeats
        </span>
        {textile.kind === "ready" ? (
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-500">
            <span>{(textile.bytes / 1024).toFixed(0)} kB</span>
            <span>{(textile.durationMs / 1000).toFixed(1)} s</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------- Pattern editor ----------------

function PatternEditor({
  code,
  measurements,
  options,
  setOptions,
}: {
  code: string;
  measurements: MeasurementSet;
  options: Record<string, number>;
  setOptions: (o: Record<string, number>) => void;
}) {
  const svgPath = useMemo(
    () => executePatternLogic(code, measurements, options),
    [code, measurements, options],
  );

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl">
        <div className="relative flex-1 bg-rose-50/20">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fb7185 1px, transparent 1px), linear-gradient(to bottom, #fb7185 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {svgPath ? (
              <svg
                viewBox="-50 -50 200 200"
                className="h-full w-full drop-shadow-md"
              >
                <path
                  d={svgPath}
                  fill="none"
                  stroke="#be123c"
                  strokeWidth="0.5"
                  strokeDasharray="2,1"
                />
              </svg>
            ) : (
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-rose-300">
                  Awaiting Master Draft
                </p>
              </div>
            )}
          </div>
          <div className="absolute left-4 top-4 flex flex-col gap-1">
            <span className="font-mono text-[10px] text-rose-300">
              PRECISION: 0.001mm
            </span>
            <span className="font-mono text-[10px] text-rose-300">
              LAYER: SEAM_ALLOWANCE
            </span>
          </div>
        </div>

        <div className="border-t border-rose-100 bg-white/70 p-4">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Style Refinement
          </h4>
          <div className="flex gap-5">
            {[
              { label: "Length", key: "length", min: 0.1, max: 1.0 },
              { label: "Waist Ease", key: "waistFit", min: 0.9, max: 1.2 },
              { label: "Fullness", key: "fullness", min: 0, max: 0.5 },
            ].map((opt) => (
              <div key={opt.key} className="flex w-28 flex-col gap-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase text-rose-300">
                  <span>{opt.label}</span>
                  <span>{Math.round((options[opt.key] ?? 0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={opt.min}
                  max={opt.max}
                  step="0.01"
                  value={options[opt.key] ?? 0}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      [opt.key]: parseFloat(e.target.value),
                    })
                  }
                  aria-label={opt.label}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-rose-200 accent-rose-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-3xl border border-white/5 bg-slate-800/50 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-mono text-base uppercase tracking-widest text-cyan-400">
            Topology_Graph.json
          </h3>
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4">
          <pre className="h-full overflow-y-auto font-mono text-[10px] leading-relaxed text-cyan-300/80">
            {code
              ? code
              : `{
  "parts": ["peplum_front", "bodice_back", "waistband"],
  "hallucination_seed": 19541012,
  "inferred_fabric": "heavy_satin",
  "bezier_resolution": "high",
  "seams": [
    { "src": "waist.bottom", "dst": "skirt.top", "type": "darted" }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

