"use client";

/**
 * components/holoflow/StubBoxEgg.tsx
 *
 * Clickable variant of <StubBox> that opens a registered easter-egg
 * overlay on press. The click fires `easter.stub-reveal` into the
 * glitch system via `useEasterEgg.show()` — every reveal credits
 * the visitor's signature so the post effect amplifies the next
 * visual moment.
 *
 * The dashed border is shared with the static <StubBox> for
 * vocabulary continuity. Hover lifts the border to lavender so the
 * interactivity reads.
 *
 * Falls back to a no-op click when:
 *   - the easter-eggs theme axis is "off"
 *   - the `eggKey` isn't registered with an <EasterEggProvider>
 */

import type { ReactNode } from "react";

import { useEasterEgg } from "./EasterEgg";

export function StubBoxEgg({
  title,
  eggKey,
  children,
}: {
  title: string;
  eggKey: string;
  children: ReactNode;
}) {
  const show = useEasterEgg((s) => s.show);
  return (
    <button
      type="button"
      onClick={() => show(eggKey)}
      className="block w-full cursor-pointer rounded-md border border-dashed border-warm-black-700 bg-warm-black-925/40 p-4 text-left transition-colors hover:border-lavender-400"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-lavender-300">
        {title}
      </div>
      <div className="mt-2 text-sm text-chrome-300">{children}</div>
    </button>
  );
}
