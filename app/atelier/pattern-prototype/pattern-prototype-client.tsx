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
 * - The original Gemini calls referenced `process.env.API_KEY`
 *   which never resolves in a Next.js client bundle. The chamber
 *   now uses the visitor's BYO AI Studio key (already wired into
 *   the imagen chamber via `lib/state/google-ai-key`); if absent
 *   the page surfaces a settings prompt.
 * - The mock FreeSewing executor (Point/Path classes inside a
 *   `new Function(...)` sandbox) is inlined verbatim — it's tiny
 *   and load-bearing for the demo.
 * - Tailwind classes are the original "rose / cyan / slate" set;
 *   the chamber sits inside the page chrome but doesn't try to
 *   adopt the site palette (the prototype's whole point is that
 *   it's a vivid mode-switching demo).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { GoogleGenAI } from "@google/genai";

import GoogleAiSettings from "components/atelier/google-ai-settings";
import { createLogger } from "lib/log";
import { useActiveChamber, pushAtelierOutput } from "lib/state/atelier-hooks";
import {
  useGoogleAiKeyStore,
  activeVisitorKey,
} from "lib/state/google-ai-key";

const log = createLogger("atelier:pattern-prototype");

// ---------------- Types ----------------

type AppMode = "editorial" | "blueprint" | "playroom" | "archive";

type MeasurementSet = {
  bust: number;
  waist: number;
  hips: number;
  height: number;
};

type OutfitState = {
  jacket: string;
  bottom: string;
  accessories: string[];
  color: string;
  pattern: "solid" | "dots" | "floral";
};

type PatternGenerationResult = {
  code: string;
  garmentType: string;
  baseDesign: string;
};

type ChatMessage = { role: "user" | "model"; text: string };

// ---------------- Mock FreeSewing ----------------
//
// Sandboxed pattern executor. AI returns a draftPattern(measurements,
// options) function as a raw JS string; we instantiate it inside a
// `new Function(...)` and hand it Point + Path classes. The output
// is an SVG path-data string the editor renders.

class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
  shift(angle: number, distance: number): Point {
    const rad = (angle * Math.PI) / 180;
    return new Point(
      this.x + Math.cos(rad) * distance,
      this.y + Math.sin(rad) * distance,
    );
  }
}

class Path {
  private ops: string[] = [];
  move(p: Point): Path {
    this.ops.push(`M ${p.x} ${p.y}`);
    return this;
  }
  line(p: Point): Path {
    this.ops.push(`L ${p.x} ${p.y}`);
    return this;
  }
  curve(cp1: Point, cp2: Point, p: Point): Path {
    this.ops.push(`C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p.x} ${p.y}`);
    return this;
  }
  close(): Path {
    this.ops.push("Z");
    return this;
  }
  asPathstring(): string {
    return this.ops.join(" ");
  }
}

function executePatternLogic(
  code: string,
  measurements: MeasurementSet,
  options: Record<string, number>,
): string {
  if (!code) return "";
  try {
    const fullCode = `
      ${code}
      if (typeof draftPattern === 'function') {
        return draftPattern(measurements, options);
      }
      return "";
    `;
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function(
      "measurements",
      "options",
      "Point",
      "Path",
      fullCode,
    );
    const out = fn(measurements, options, Point, Path);
    return typeof out === "string" ? out : "";
  } catch (err) {
    log.warn("pattern execution failed", { err: String(err) });
    return "";
  }
}

// ---------------- Gemini ----------------

const PATTERN_SYSTEM_INSTRUCTION = `ROLE: You are the Pattern Logic Engine.
OBJECTIVE: Translate user inputs into executable pattern logic using a simplified FreeSewing mock.
OUTPUT FORMAT: Output ONLY raw JavaScript. No markdown. One function named draftPattern(measurements, options).
CLASSES AVAILABLE:
- Point(x, y) with method .shift(angle, distance)
- Path() with methods .move(Point), .line(Point), .curve(cp1, cp2, p), .close(), .asPathstring()
TEMPLATE:
function draftPattern(measurements, options) {
  const part = { points: {}, paths: {} };
  const waistRadius = (measurements.waist / (2 * Math.PI)) * (options.waistFit || 1.0);
  part.points.center = new Point(0, 0);
  part.points.waist = part.points.center.shift(90, waistRadius);
  part.points.hem = part.points.waist.shift(90, 100 * (options.length || 0.5));
  part.paths.seam = new Path().move(part.points.waist).line(part.points.hem).close();
  return part.paths.seam.asPathstring();
}
CONSTRAINTS: Valid ES6. No markdown fences. Tailor curves to the garment type.`;

async function generatePattern(
  prompt: string,
  apiKey: string,
): Promise<PatternGenerationResult> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: PATTERN_SYSTEM_INSTRUCTION,
      temperature: 0.1,
    },
  });
  let code = response.text ?? "";
  code = code.replace(/```javascript|```js|```/g, "").trim();
  return { code, baseDesign: "Custom", garmentType: "Ensemble" };
}

// ---------------- Inline icons ----------------
// (lucide-react isn't installed on the site; these match the
// originals at 14-20px stroke=2 line-cap=round.)

function Icon({
  d,
  size = 14,
}: {
  d: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICON_WAND = "M15 4V2 M15 16v-2 M8 9h2 M20 9h2 M17.8 11.8 19 13 M15 9h0 M17.8 6.2 19 5 M3 21l9-9 M12.2 6.2 11 5";
const ICON_SHIRT = "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z";
const ICON_RULER = "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z M14.5 12.5 12 15 M11 9.5 8.5 12 M7.5 6.5 5 9 M18 16l-2 2";
const ICON_ARCHIVE = "M20 9v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9 M22 5H2v4h20V5 M10 13h4";
const ICON_SPARKLES = "M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z";
const ICON_PRINTER = "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z";
const ICON_PALETTE = "M12 22a1 1 0 0 1-1-1v-3a1 1 0 0 0-2 0v3a1 1 0 0 1-1 1 9 9 0 1 1 9-9 4 4 0 0 1-4 4h-2.5a.5.5 0 0 0-.5.5v.5a2 2 0 0 1-2 2z M13.5 6.5h.01 M17.5 10.5h.01 M6.5 12.5h.01 M8.5 7.5h.01";
const ICON_LAYERS = "m12 2 8 4-8 4-8-4 8-4z m-8 10 8 4 8-4 m-16 4 8 4 8-4";
const ICON_CHAT = "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z";
const ICON_X = "M18 6 6 18 M6 6l12 12";
const ICON_SEND = "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z M22 2 11 13";
const ICON_HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z";

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

  const mode_key = useGoogleAiKeyStore((s) => s.mode);
  const hasKey = useGoogleAiKeyStore((s) => s.key.trim().length > 0);

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
                  : "bg-[#fff1f2] text-rose-950"
          }`}
        >
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg ${
                  mode === "blueprint"
                    ? "bg-cyan-500 text-slate-900"
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
              </div>
              <div>
                <h2
                  className={`text-2xl leading-none tracking-tight ${
                    mode === "blueprint" ? "text-white" : "text-rose-900"
                  }`}
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {mode === "editorial"
                    ? "Le Grand Salon"
                    : mode === "playroom"
                      ? "Petit Playroom"
                      : mode === "blueprint"
                        ? "Logic Terminal"
                        : "Historical Archive"}
                </h2>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.4em] opacity-60">
                  Dimension: {mode} // Engine: ThreadLogic v2.0
                </p>
              </div>
            </div>

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
          className={`grid grid-cols-4 gap-1 rounded-2xl border p-1 ${
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

// ---------------- ChatBot ----------------

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Bonjour. ask me for design advice — fabric pairings, silhouette notes, anything atelier-shaped.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const userMessage = input.trim();
    if (!userMessage || isTyping) return;

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    if (!visitorKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "no key set. paste an AI Studio key in settings to enable chat.",
        },
      ]);
      return;
    }

    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "model", text: "" }]);
    try {
      const ai = new GoogleGenAI({ apiKey: visitorKey });
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: userMessage,
        config: {
          systemInstruction:
            "ROLE: Master Atelier Assistant for ThreadLogic. Expert in fashion design, historical 1950s styles, computational tailoring. TONE: elegant, encouraging, sophisticated. Light French fashion terms (très chic). Concise.",
          temperature: 0.7,
        },
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (text) {
          fullResponse += text;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            return [...prev.slice(0, -1), { ...last, text: fullResponse }];
          });
        }
      }
    } catch (err) {
      log.error("chat failed", { err: String(err) });
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "pardon, the chat engine stalled. retry.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="mb-3 flex h-[440px] w-80 flex-col overflow-hidden rounded-3xl border border-rose-200 bg-white/80 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between bg-rose-500 p-4 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Icon d={ICON_SPARKLES} size={14} />
              </div>
              <div>
                <h4
                  className="text-base font-bold leading-none"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Atelier AI
                </h4>
                <p className="mt-1 text-[8px] font-black uppercase tracking-widest opacity-70">
                  Design Consultant
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="close chat"
              className="transition-transform hover:rotate-90"
            >
              <Icon d={ICON_X} size={16} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-white/30 p-4"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-none bg-rose-500 text-white"
                      : "rounded-tl-none border border-rose-50 bg-white text-rose-900"
                  }`}
                >
                  {msg.text ||
                    (isTyping && idx === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-rose-100 bg-white/60 p-3">
            <div className="relative flex items-center">
              <label htmlFor={inputId} className="sr-only">
                ask the atelier
              </label>
              <input
                id={inputId}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="ask for design advice…"
                className="w-full rounded-2xl border border-rose-100 bg-white py-2 pl-3 pr-10 text-xs text-rose-900 placeholder:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="send"
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500 text-white transition-all hover:bg-rose-600 disabled:opacity-30"
              >
                <Icon d={ICON_SEND} size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "close chat" : "open chat"}
        className={`flex h-12 w-12 items-center justify-center rounded-3xl shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? "bg-white text-rose-500" : "bg-rose-500 text-white"
        }`}
      >
        {isOpen ? <Icon d={ICON_X} size={20} /> : <Icon d={ICON_CHAT} size={20} />}
      </button>
    </div>
  );
}
