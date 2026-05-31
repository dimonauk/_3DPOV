/**
 * components/holoflow/Specs.tsx — key/value technical specs table.
 *
 * Two-column "Runtime · apps/aura-vrm · The Hangar" rows. Mono small-
 * caps key, mono body value. Use it to document the architecture under
 * the demo canvas in every vertical's deep-dive section.
 */

import type { ReactNode } from "react";

export function Specs({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-warm-black-700${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export function Spec({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[105px_1fr] border-b border-warm-black-700 px-3 py-2.5 last:border-b-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-chrome-500">
        {k}
      </div>
      <div className="font-mono text-[10px] text-chrome-100">{v}</div>
    </div>
  );
}
