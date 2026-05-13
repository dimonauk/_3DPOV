"use client";

import { useEffect, useState } from "react";

import {
  CONSTRUCT_LABEL,
  CONSTRUCT_TINT,
  type Construct,
} from "lib/chrono-protocol/dialogue";

/**
 * Bottom-left dialogue panel for the Chrono-Protocol run scene.
 *
 * Slides in when a line lands; slides out after a configurable
 * duration. Renders speaker label + tinted side-bar + the line text.
 * Presentational — the parent (RunPage or GameCanvas) passes the
 * current line and the component handles the transition lifecycle.
 *
 * The current line is keyed on the line id so consecutive different
 * lines from the same speaker re-trigger the entry transition.
 */

export type DialogueOverlayProps = {
  /** Current dialogue line; null when nothing should be visible. */
  line: { id: string; speaker: Construct; text: string } | null;
  /** Milliseconds before the line dismisses itself. Default 4500. */
  durationMs?: number;
  /** Overlay positioning. */
  variant?: "overlay" | "inline";
};

export function DialogueOverlay({
  line,
  durationMs = 4500,
  variant = "overlay",
}: DialogueOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    if (line && line.id !== currentId) {
      setCurrentId(line.id);
      setVisible(true);
      const timer = window.setTimeout(() => setVisible(false), durationMs);
      return () => window.clearTimeout(timer);
    }
    if (!line) setVisible(false);
    return undefined;
  }, [line, currentId, durationMs]);

  const wrapClass =
    variant === "overlay"
      ? "pointer-events-none absolute bottom-6 left-6 z-20 max-w-lg"
      : "w-full max-w-lg";

  if (!line) return null;
  const tint = CONSTRUCT_TINT[line.speaker];
  const label = CONSTRUCT_LABEL[line.speaker];

  return (
    <div className={wrapClass}>
      <div
        className={`rounded-sm border bg-warm-black-950/85 px-4 py-3 backdrop-blur-sm transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
        style={{ borderColor: tint, boxShadow: `0 0 18px ${tint}33` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-1 h-full w-1 rounded-full"
            style={{ background: tint, minHeight: 28 }}
          />
          <div className="flex-1">
            <div
              className="chrome-label font-mono"
              style={{ color: tint }}
            >
              {label}
            </div>
            <p
              className="mt-1 text-sm text-chrome-100"
              // The line text uses &mdash; and &rsquo; entities already
              // expanded by JSX serialisation; we render via
              // dangerouslySetInnerHTML so the HTML entities in the
              // canon text render correctly rather than as literal
              // ampersand sequences.
              dangerouslySetInnerHTML={{ __html: line.text }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
