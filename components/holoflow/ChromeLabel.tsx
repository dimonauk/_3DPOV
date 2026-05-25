/**
 * components/holoflow/ChromeLabel.tsx — small-caps mono label.
 *
 * The "01 / 03 · DEEP DIVE" style label that prefixes every vertical
 * section in the Holo-Flow landing. Wraps the existing global
 * `.chrome-label` class with optional accent dot + trailing rule.
 */

import type { ReactNode } from "react";

export function ChromeLabel({
  children,
  withRule = false,
  accent = "lavender",
}: {
  children: ReactNode;
  withRule?: boolean;
  accent?: "lavender" | "gold" | "teal" | "coral" | "pink";
}) {
  const dotColor = {
    lavender: "bg-lavender-400",
    gold: "bg-gold-400",
    teal: "bg-teal-400",
    coral: "bg-coral-400",
    pink: "bg-pink-400",
  }[accent];
  return (
    <div className="chrome-label flex items-center gap-2">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {children}
      {withRule && (
        <span className="ml-2 inline-block h-px w-7 bg-chrome-400/40" />
      )}
    </div>
  );
}
