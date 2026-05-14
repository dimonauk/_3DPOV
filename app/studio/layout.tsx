/**
 * app/studio/layout.tsx — Studio-only layout.
 *
 * One-line role: bypasses the site's outer chrome (Navbar, footer) so
 * the embedded Sanity Studio takes over the full viewport. Inherits the
 * root `<html>` / `<body>` from `app/layout.tsx`; this layout is a
 * passthrough by design.
 */

export const metadata = {
  title: "Studio — Holoflow",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <>{children}</>;
}
