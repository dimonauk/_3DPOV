/**
 * DemoLayout — 2-column grid wrapper for the canvas-on-left,
 * ladder-on-right rhythm every vertical's deep-dive section uses.
 *
 *   <DemoLayout>
 *     <div>{demo canvas + controls}</div>
 *     <div>{ladder + specs}</div>
 *   </DemoLayout>
 */

import type { ReactNode } from "react";

export function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
      {children}
    </div>
  );
}
