/**
 * TwoCol / ThreeCol — bare grid wrappers used inside sections.
 *
 * Match .two-col / .three-col from the source HTML. Card stacks at
 * the breakpoint, opens up to N columns on md+.
 */

import type { ReactNode } from "react";

export function TwoCol({
  children,
  gap = "gap-4",
}: {
  children: ReactNode;
  gap?: string;
}) {
  return <div className={`grid grid-cols-1 md:grid-cols-2 ${gap}`}>{children}</div>;
}

export function ThreeCol({
  children,
  gap = "gap-4",
}: {
  children: ReactNode;
  gap?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap}`}>
      {children}
    </div>
  );
}
