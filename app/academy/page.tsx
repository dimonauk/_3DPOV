/**
 * app/academy/page.tsx — server-component shell for The Charming Academy.
 *
 * One-line role: route entry + metadata. Loads the cast bibles
 * server-side (they're typed data under lib/cast/) and hands them to
 * the client component so the interactive cohort browser can hydrate
 * without a fetch.
 *
 * Why a route at /academy:
 *   The Academy is the studio's narrative space — Aura's school,
 *   the cast's home, the canon source for dialogue + banter. It is
 *   NOT a making-tool (so not /atelier) and not a delivery surface
 *   (so not /holo-walk). It is its own top-level destination,
 *   chrome-bypassed because the page owns its own header and palette.
 *
 * The original Vite app at D:\The_Hangar\apps\charming-academy/ is a
 * planning scaffold (APP_ARCHITECTURE.md + package.json only — no
 * src/). The cohort data + Aura voice + cast bibles already live in
 * this repo, so the route surfaces them rather than waiting for the
 * Vite source to land.
 */

import type { Metadata } from "next";

import { listBibles } from "lib/cast";
import { createLogger } from "lib/log";

import AcademyClient from "./academy-client";

const log = createLogger("route:/academy");

export const metadata: Metadata = {
  title: "The Charming Academy — DollyOS narrative space",
  description:
    "Aura's school. The cast's home. Six students on rotation, ten named agents, one held posture. The studio's narrative substrate — the place where the bibles in lib/cast/ become the voices you actually hear.",
  robots: { index: false, follow: false },
};

export default function AcademyPage() {
  const bibles = listBibles();
  log.info("academy page rendered", { castCount: bibles.length });
  return <AcademyClient bibles={bibles} />;
}
