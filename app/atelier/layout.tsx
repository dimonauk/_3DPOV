/**
 * app/atelier/layout.tsx — Atelier-wide layout shell.
 *
 * Wraps every /atelier/* route with the floating
 * `<RecentOutputsDrawer>`. The drawer reads `lib/state/atelier`'s
 * session-only ring of recent outputs across all chambers and offers
 * click-to-download. Hidden by default; appears only when at least one
 * chamber has pushed something.
 */

import RecentOutputsDrawer from "components/atelier/recent-outputs-drawer";

export default function AtelierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <RecentOutputsDrawer />
    </>
  );
}
