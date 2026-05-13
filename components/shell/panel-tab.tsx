"use client";

import { useShell } from "components/shell/shell-context";
import type { PanelKey } from "lib/state/shell";

type Orientation = "left" | "right" | "bottom";

type PanelTabProps = {
  panel: PanelKey;
  orientation: Orientation;
  /** Label rendered along the tab. Vertical tabs rotate the text. */
  label: string;
  /** Extra className applied to the tab&rsquo;s outer element. */
  className?: string;
};

/**
 * The always-visible handle for a panel. Click toggles the panel.
 *
 * Visual register: chrome-cyan border, chrome-300 label, monospace
 * uppercase &mdash; the &ldquo;TUI on acid&rdquo; voice quietened to v0.1
 * level. A small chevron flips orientation depending on whether the
 * panel is open.
 */
export function PanelTab({
  panel,
  orientation,
  label,
  className = "",
}: PanelTabProps) {
  const { state, toggle } = useShell();
  const open = state.open[panel];

  const isVertical = orientation === "left" || orientation === "right";

  const baseClasses =
    "group relative flex items-center justify-center gap-1 " +
    "border-warm-black-800 bg-warm-black-900/80 text-chrome-300 " +
    "transition-colors duration-200 hover:border-pink-200/60 hover:text-pink-200 " +
    "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-pink-300";

  // Vertical tabs (left/right edge): rotate the label and pin width.
  // Horizontal tab (bottom): full-width strip.
  const orientationClasses = isVertical
    ? "h-full w-8 flex-col border-l border-r " +
      (orientation === "left" ? "border-r-cyan-500/30" : "border-l-cyan-500/30")
    : "h-7 w-full flex-row border-t border-b border-t-cyan-500/30";

  const indicator = open ? "▾" : "▸"; // ▾ / ▸

  // Reorient indicator chevrons for each edge.
  const indicatorForOrientation = (): string => {
    if (orientation === "left") return open ? "◂" : "▸"; // ◂ / ▸
    if (orientation === "right") return open ? "▸" : "◂"; // ▸ / ◂
    return indicator;
  };

  return (
    <button
      type="button"
      onClick={() => toggle(panel)}
      aria-expanded={open}
      aria-controls={`shell-panel-${panel}`}
      className={`${baseClasses} ${orientationClasses} ${className}`}
      title={open ? `Close ${label.toLowerCase()}` : `Open ${label.toLowerCase()}`}
    >
      <span
        className="font-mono uppercase tracking-[0.22em] text-[0.6rem]"
        style={
          isVertical
            ? {
                writingMode: "vertical-rl",
                transform:
                  orientation === "left" ? "rotate(180deg)" : "rotate(0deg)",
              }
            : undefined
        }
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="font-mono text-[0.7rem] text-cyan-400/80 group-hover:text-pink-200"
      >
        {indicatorForOrientation()}
      </span>
    </button>
  );
}
