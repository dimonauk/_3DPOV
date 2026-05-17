import { useState } from "react";

import { createLogger } from "lib/log";

import { BridgeOfflineNote, PaletteSwatch } from "../widgets";
import type { SidecarStatus } from "../types";

const log = createLogger("atelier:mesh-studio:pixel-art");

const SIZE_OPTIONS = [8, 12, 16, 24, 32];
const FRAME_OPTIONS = [1, 2, 4, 6, 8, 12, 16, 24, 32];

export function PixelArtTab({ status }: { status: SidecarStatus }) {
  const [subject, setSubject] = useState("");
  const [frames, setFrames] = useState(1);
  const [size, setSize] = useState(16);
  const [paletteName] = useState("holoflow-8");
  const [gifFps, setGifFps] = useState(8);
  const [openInPixelorama, setOpenInPixelorama] = useState(false);
  const [extraStyle, setExtraStyle] = useState("");

  const isAnimation = frames > 1;
  const canGenerate = status.kind === "online" && subject.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-2xl text-chrome-100">Pixel Art generator</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Text in, sprite out. The bench routes the subject through a
          local Ollama model, snaps the result to a fixed palette,
          renders frames as PNG + spritesheet + animated GIF, optional
          hand-off to Pixelorama for touch-ups.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Subject &middot; what to draw
          </span>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="flickering torch flame, cute cyan robot face, witch on a broomstick"
            rows={2}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Frames</span>
            <select
              value={frames}
              onChange={(e) => setFrames(Number(e.target.value))}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
            >
              {FRAME_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "1 (single sprite)" : `${n} frames`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Canvas size</span>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 focus:border-pink-200/60 focus:outline-none"
            >
              {SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} × {n} cells
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              {isAnimation ? `GIF · ${gifFps} fps` : "GIF fps (animation only)"}
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={gifFps}
              onChange={(e) => setGifFps(Number(e.target.value))}
              disabled={!isAnimation}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 disabled:opacity-30 focus:border-pink-200/60 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">
              Palette &middot; {paletteName}
            </span>
            <div className="flex items-center gap-1.5 rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2">
              <PaletteSwatch
                colors={[
                  "#FF66CC",
                  "#FF9966",
                  "#FFCC66",
                  "#66FFAA",
                  "#66CCFF",
                  "#9966FF",
                  "#E4E4EC",
                  "#0E0E14",
                ]}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="chrome-label text-chrome-400">Style hint &middot; optional</span>
            <input
              type="text"
              value={extraStyle}
              onChange={(e) => setExtraStyle(e.target.value)}
              placeholder="chibi, menacing, stained glass"
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200/60 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-chrome-300">
            <input
              type="checkbox"
              checked={openInPixelorama}
              onChange={(e) => setOpenInPixelorama(e.target.checked)}
              className="accent-pink-200"
            />
            Open in Pixelorama when done
          </label>
          <div className="flex-1" />
          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => log.info("pixelart generate requested", { subject, frames, size })}
            className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-50"
            title={status.kind === "online" ? undefined : "sidecar required"}
          >
            {isAnimation
              ? `→ Generate ${frames}-frame animation`
              : "→ Generate sprite"}
          </button>
        </div>

        {status.kind !== "online" ? (
          <BridgeOfflineNote
            what="pixel art bridge"
            mount="/pixelart"
            extra="bench-side path: pixelart_bridge.py mounted in main.py"
          />
        ) : null}
      </div>
    </div>
  );
}
