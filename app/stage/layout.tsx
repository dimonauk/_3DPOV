/**
 * app/stage/layout.tsx — Stage-only chrome-bypass layout.
 *
 * The Stage owns the full viewport (Canvas fills the screen, HTML
 * overlay floats on top). This layout strips the site Navbar /
 * Footer so the scene reads as the page, not as an embed inside
 * the studio's chrome.
 *
 * Mirrors app/edit/layout.tsx and app/studio/layout.tsx — three
 * surfaces that own the viewport.
 */

export const metadata = {
  title: "Stage — Holoflow",
  robots: { index: false, follow: false },
};

export default function StageLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <>{children}</>;
}
