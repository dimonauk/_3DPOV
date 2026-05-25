/**
 * components/holoflow/DemoCanvas.tsx — framed demo container with HUD.
 *
 * The "POINT CLOUD RENDERER · ACTIVE" canvas wrapper from the landing.
 * Provides:
 *   - aspect-ratio outer frame with the right border + bg
 *   - top-left HUD lines (typed colour-coded)
 *   - bottom-right status pill with blinking dot
 *   - children renders inside (canvas, R3F, video, anything)
 *
 * Use it for any live preview where the chrome + HUD overlay sells
 * the "this is a real instrument" feeling.
 */

import type { ReactNode } from "react";

export type HudLine = {
  text: string;
  tone?: "teal" | "lavender" | "gold" | "coral" | "pink";
};

const TONE: Record<NonNullable<HudLine["tone"]>, string> = {
  teal: "text-teal-300",
  lavender: "text-lavender-200",
  gold: "text-gold-300",
  coral: "text-coral-300",
  pink: "text-pink-300",
};

export function DemoCanvas({
  hud,
  status,
  statusTone = "teal",
  className = "aspect-[16/10]",
  children,
}: {
  hud?: HudLine[];
  status?: string;
  statusTone?: HudLine["tone"];
  className?: string;
  children: ReactNode;
}) {
  const dotClass = {
    teal: "bg-teal-400 shadow-[0_0_4px_var(--color-teal-400)]",
    lavender: "bg-lavender-400 shadow-[0_0_4px_var(--color-lavender-400)]",
    gold: "bg-gold-400 shadow-[0_0_4px_var(--color-gold-400)]",
    coral: "bg-coral-400 shadow-[0_0_4px_var(--color-coral-400)]",
    pink: "bg-pink-400 shadow-[0_0_4px_var(--color-pink-400)]",
  }[statusTone ?? "teal"];

  return (
    <div className={`relative w-full overflow-hidden border border-warm-black-700 bg-warm-black-925 ${className}`}>
      {children}
      {hud && hud.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 font-mono text-[9px] tracking-[0.12em]">
          {hud.map((line, k) => (
            <span key={k} className={`holoflow-flicker ${TONE[line.tone ?? "teal"]}`}>
              {line.text}
            </span>
          ))}
        </div>
      )}
      {status && (
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-chrome-300">
          <span className={`holoflow-blink inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {status}
        </div>
      )}
    </div>
  );
}
