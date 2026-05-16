/**
 * app/stage/page.tsx — server-component shell for the VRM-world Stage.
 *
 * The Stage is the studio's "VRM character in a good-looking world"
 * primitive: HDRI environment + ContactShadows + ACES tone mapping +
 * post-processing, all wrapped around the dimona.vrm avatar. Same scene
 * runs in flat-screen and inside a WebXR session — that's the whole
 * point of the design.
 *
 * The actual scene is client-only (three.js + R3F + WebGL). This file
 * just supplies the route, metadata, and a thin gate around the client
 * component.
 *
 * See lib/stage/types.ts + lib/stage/rooms.ts for the room registry.
 * See components/stage/Stage.tsx for the composer.
 */

import type { Metadata } from "next";

import StageClient from "./stage-client";

export const metadata: Metadata = {
  title: "Stage — Holoflow",
  description:
    "VRM-world reference scene. HDRI lighting, contact shadows, post-processing, WebXR-ready. The studio's template for putting characters in worlds that look correct.",
  robots: { index: false, follow: false },
};

export default function StagePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  return <StageClient searchParamsPromise={searchParams} />;
}
