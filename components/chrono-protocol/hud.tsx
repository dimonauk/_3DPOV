"use client";

import { getMode, type ChronoModeSlug } from "lib/chrono-protocol";

/**
 * Top-bar HUD for the Chrono-Protocol run scene.
 *
 * Renders four columns: zone name + phase, health bar, combo + score,
 * current mode chip. Presentational — the parent wires it to
 * PlayerTelemetry from lib/chrono-protocol/state.ts.
 *
 * Visual register: ISA-style tape with chrome-label uppercase tracking,
 * a chrome-rule line on the bottom border. Drops into the run page as
 * a fixed top bar; degrades to a static block on the landing page when
 * used for preview.
 */

export type HudProps = {
  zoneName: string;
  phase: number;
  totalPhases: number;
  health: number;
  maxHealth: number;
  combo: number;
  score: number;
  currentMode: ChronoModeSlug;
  /** Optional render mode: 'overlay' for absolute positioning inside the
   * canvas, 'inline' for sitting in regular document flow. */
  variant?: "overlay" | "inline";
};

export function Hud({
  zoneName,
  phase,
  totalPhases,
  health,
  maxHealth,
  combo,
  score,
  currentMode,
  variant = "inline",
}: HudProps) {
  const healthRatio = Math.max(0, Math.min(1, health / Math.max(1, maxHealth)));
  const mode = getMode(currentMode);
  const modeName = mode?.name ?? currentMode.toUpperCase();
  const modeColor = mode?.hexColor ?? "#ffffff";

  const wrapClass =
    variant === "overlay"
      ? "pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-3"
      : "w-full";

  return (
    <div className={wrapClass}>
      <div className="w-full max-w-5xl rounded-sm border border-warm-black-800 bg-warm-black-950/80 px-4 py-3 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="chrome-label text-chrome-500">Zone</div>
            <div className="mt-1 truncate text-sm text-chrome-100">
              {zoneName}
            </div>
            <div className="chrome-label mt-1 text-chrome-500">
              Phase {phase} / {totalPhases}
            </div>
          </div>

          <div>
            <div className="chrome-label text-chrome-500">Health</div>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-900">
              <div
                className="h-full transition-[width] duration-150"
                style={{
                  width: `${healthRatio * 100}%`,
                  background:
                    healthRatio < 0.25
                      ? "#ff3344"
                      : healthRatio < 0.6
                        ? "#ffcc00"
                        : "#00cc66",
                }}
              />
            </div>
            <div className="chrome-label mt-1 text-chrome-500">
              {Math.round(health)} / {maxHealth}
            </div>
          </div>

          <div>
            <div className="chrome-label text-chrome-500">Combo</div>
            <div className="mt-1 font-mono text-2xl tracking-tight text-chrome-100">
              x{combo}
            </div>
            <div className="chrome-label mt-1 text-chrome-500">
              Score: {score.toString().padStart(6, "0")}
            </div>
          </div>

          <div>
            <div className="chrome-label text-chrome-500">Mode</div>
            <div
              className="mt-1 inline-flex items-center gap-2 rounded-sm border px-2 py-1 font-mono text-xs"
              style={{
                borderColor: modeColor,
                color: modeColor,
                background: `${modeColor}1f`,
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: modeColor }}
              />
              {modeName}
            </div>
            <div className="chrome-label mt-1 text-chrome-500">
              {mode?.function ?? "&mdash;"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
