/**
 * app/edit/layout.tsx — Edit-only layout.
 *
 * One-line role: bypasses the site's outer chrome (Navbar, footer) so
 * the editor takes over the full viewport. Mirrors app/studio/layout.tsx
 * which does the same for the embedded Sanity Studio mount. Inherits
 * the root `<html>` / `<body>` from `app/layout.tsx`; this layout is a
 * passthrough by design.
 */

export const metadata = {
  title: "Edit — Holoflow",
  robots: { index: false, follow: false },
};

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <>{children}</>;
}
