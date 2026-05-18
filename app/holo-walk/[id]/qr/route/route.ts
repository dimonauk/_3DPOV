/**
 * app/holo-walk/[id]/qr/route.ts — On-demand QR PNG for a sculpture location.
 *
 * Hit `/holo-walk/<id>/qr` to get the PNG QR code that encodes the
 * AR landing URL for the sculpture. Used by:
 *
 *   - the printable signage page (`./page.tsx`) for the operator's
 *     plaque / vinyl handoff to the printer
 *   - `viz.splat-ar-deploy.server` as a stable URL for the deployed QR
 *   - quick visual checks during development
 *
 * The PNG is generated on each request. Caching is handled by Next.js
 * full-route cache (the input — the sculpture id + its UTM cohort —
 * is stable), so generation cost amortises to ~0.
 *
 * Query params:
 *   - `size`: pixel size of the output PNG. Default 1024. Max 2048.
 *   - `ec`:   error correction, one of `L|M|Q|H`. Default `H` (outdoor).
 *   - `dark` / `light`: hex colours. Defaults: chrome-on-midnight.
 */

import { NextRequest, NextResponse } from "next/server";

import { getLocation } from "lib/holo-walk/locations";
import { sculptureQrPng } from "lib/holo-walk/qr";
import { createLogger } from "lib/log";

export const dynamic = "force-static";
export const revalidate = 3600;  // re-generate at most hourly

const log = createLogger("holo-walk.qr-route");

export async function generateStaticParams() {
  const { listLocations } = await import("lib/holo-walk/locations");
  return listLocations().map((l) => ({ id: l.id }));
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const loc = getLocation(id);
  if (!loc) {
    return new NextResponse(`Location not found: ${id}`, { status: 404 });
  }

  const url = new URL(request.url);
  const sizeRaw = url.searchParams.get("size");
  const sizeParam = Number.parseInt(sizeRaw ?? "", 10);
  let pngSize: number;
  if (Number.isFinite(sizeParam) && sizeParam > 0) {
    pngSize = Math.min(Math.max(sizeParam, 128), 2048);
  } else {
    pngSize = 1024;
    // A non-empty but unparseable size param is almost always either a
    // typo in operator tooling or a probe — log so we see it without
    // failing the request.
    if (sizeRaw !== null && sizeRaw.trim() !== "") {
      log.info("invalid size param, using default", { id, sizeRaw });
    }
  }

  const ec = url.searchParams.get("ec");
  const errorCorrection = ec === "L" || ec === "M" || ec === "Q" || ec === "H"
    ? ec
    : "H";

  const dark = url.searchParams.get("dark") ?? undefined;
  const light = url.searchParams.get("light") ?? undefined;

  try {
    const png = await sculptureQrPng(loc, {
      pngSize,
      errorCorrection,
      ...(dark ? { dark } : {}),
      ...(light ? { light } : {}),
    });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": png.byteLength.toString(),
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-HoloWalk-Sculpture": loc.id,
      },
    });
  } catch (err) {
    return new NextResponse(
      `QR generation failed: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    );
  }
}
