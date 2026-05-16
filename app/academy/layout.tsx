/**
 * app/academy/layout.tsx — Academy chrome-bypass layout.
 *
 * One-line role: bypasses the site's outer Navbar/footer so the
 * Charming Academy owns the full viewport (mirrors app/edit/layout.tsx
 * and app/studio/layout.tsx). The Academy is a narrative space — the
 * shell uses its own header, footer link, and palette and would clash
 * with the standard chrome.
 *
 * Inherits the root `<html>` / `<body>` from `app/layout.tsx`.
 */

export const metadata = {
  title: "The Charming Academy — DollyOS narrative space",
  robots: { index: false, follow: false },
};

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <>{children}</>;
}
