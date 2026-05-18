/**
 * app/edit/page.tsx — server-component shell for the web 360 editor.
 *
 * Lives at /edit because /studio is owned by the embedded Sanity Studio
 * mount (app/studio/[[...tool]]/page.tsx). Both routes share the
 * chrome-bypass layout pattern — Sanity has its own app/studio/layout.tsx,
 * we mirror it at app/edit/layout.tsx.
 *
 * The actual editor is client-only (three.js + WebGL + ffmpeg.wasm).
 * This server file just supplies the route, metadata, and a thin
 * gate around the client component. `next/dynamic({ssr:false})` is
 * forbidden in Server Components in Next.js 15+, so we import the
 * `"use client"`-marked child directly — Next handles the hydration
 * boundary on its own.
 *
 * Milestone 1 of the unified-platform absorption sequence: see
 * D:\The_Hangar\engines\splat360\docs\hosting-platforms-landscape.md
 * for the strategic positioning.
 */

import type { Metadata } from "next";

import EditClient from "./edit-client";

export const metadata: Metadata = {
  title: "Edit — Holoflow",
  description:
    "Browser-native 360 video and Gaussian Splat editor. Drop OSV / INSV / MP4 / DNG — reframe, edit, export. No install. Absorbs DJI Studio + Insta360 Studio + GoPro Quik.",
  robots: { index: false, follow: false }, // gate while in foundation
};

export default function EditPage() {
  return <EditClient />;
}
