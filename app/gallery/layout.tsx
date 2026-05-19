/**
 * app/gallery/layout.tsx — Minimal segment layout for /gallery and
 * /gallery/[id]. Acts as the shared metadata + title-template anchor
 * for the photo-archive surface; renders children straight through.
 *
 * The root layout (app/layout.tsx) supplies the navbar, workshop
 * shell, and fonts — this segment only contributes the title-template
 * suffix so detail pages show as "<album> — Gallery | Holo-Flow
 * Studio" without each page repeating the suffix.
 */

import type { ReactNode } from "react";

export const metadata = {
  title: {
    default: "Gallery — Holo-Flow Studio",
    template: "%s | Gallery",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
