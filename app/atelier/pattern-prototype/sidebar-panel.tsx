"use client";

/**
 * app/atelier/pattern-prototype/sidebar-panel.tsx — Left-rail of the
 * pattern-prototype chamber: 5-mode pill nav, construction picker,
 * colour swatches + embellishment toggles (non-blueprint modes), or
 * measurement sliders (blueprint mode). Bottom-pinned draft button.
 *
 * Extracted from pattern-prototype-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import {
  Icon,
  ICON_ARCHIVE,
  ICON_HEART,
  ICON_LAYERS,
  ICON_PALETTE,
  ICON_RULER,
  ICON_SHIRT,
  ICON_SPARKLES,
  ICON_WAND,
} from "./icons";
import type { AppMode, MeasurementSet, OutfitState } from "./types";

export function SidebarPanel({
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
            isDark ? "bg-cyan-500 text-slate-900" : "bg-rose-900 text-white"
          }`}
        >
          <Icon d={ICON_SPARKLES} size={12} />{" "}
          {isGenerating ? "drafting…" : "draft pattern"}
        </button>
      </div>

      <div
        className={`flex items-center justify-between border-t p-4 ${
          isDark ? "border-white/5 bg-black/20" : "border-rose-100 bg-white/20"
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
