import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getCard } from "lib/ar/cards";
import { promises as fs } from "node:fs";
import path from "node:path";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * GET /api/cards/[slug]/background.png — branded Zoom/Teams/Meet
 * virtual background. See full docs in this file's previous header
 * (variants, sizes, QR toggle).
 *
 * Every response carries X-Request-Id for log correlation.
 */

type Variant = "minimal" | "gradient" | "bottomBar";
type Params = { params: Promise<{ slug: string }> };

const SIZES = {
  "1080p": { w: 1920, h: 1080 },
  "720p": { w: 1280, h: 720 },
  "4k": { w: 3840, h: 2160 },
} as const;

export const GET = withRouteLogging<Params>(
  "cards.background.png",
  async (req: NextRequest, { params }, log) => {
    const { slug } = await params;
    log.debug("slug", { slug });

    let card;
    try {
      card = await getCard(slug);
    } catch (err) {
      log.error("getCard:threw", { slug, err: errToObject(err) });
      return NextResponse.json(
        { error: "card_lookup_failed", message: (err as Error).message },
        { status: 500 },
      );
    }
    if (!card) {
      log.info("card:not_found", { slug });
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const variant = (url.searchParams.get("variant") ?? "bottomBar") as Variant;
    const sizeKey = (url.searchParams.get("size") ??
      "1080p") as keyof typeof SIZES;
    const showQr = url.searchParams.get("showQr") !== "0";
    const size = SIZES[sizeKey] ?? SIZES["1080p"];
    log.debug("params", { variant, sizeKey, showQr, w: size.w, h: size.h });

    const primary = card.brand.primary;
    const secondary = card.brand.secondary;
    const accent = card.brand.accent;
    const textOnBrand = card.brand.textOnBrand;

    let qrSvg = "";
    if (showQr) {
      try {
        const qrPath = path.join(
          process.cwd(),
          "public",
          "cards",
          slug,
          "qr.svg",
        );
        qrSvg = await fs.readFile(qrPath, "utf8");
      } catch (err) {
        log.debug("qr:not_found_or_unreadable", {
          slug,
          err: errToObject(err),
        });
        qrSvg = "";
      }
    }

    let svg: string;
    try {
      if (variant === "minimal") {
        svg = renderMinimal(size, primary, secondary, accent);
      } else if (variant === "gradient") {
        svg = renderGradient(
          size,
          primary,
          secondary,
          textOnBrand,
          card.studio ?? card.name,
        );
      } else {
        svg = renderBottomBar(
          size,
          primary,
          secondary,
          accent,
          textOnBrand,
          card.name,
          card.role,
          card.studio,
          qrSvg,
        );
      }
    } catch (err) {
      log.error("svg_render:failed", { variant, err: errToObject(err) });
      return NextResponse.json(
        { error: "svg_render_failed", message: (err as Error).message },
        { status: 500 },
      );
    }

    let png: Buffer;
    try {
      png = await sharp(Buffer.from(svg)).png().toBuffer();
    } catch (err) {
      log.error("sharp:failed", { variant, sizeKey, err: errToObject(err) });
      return NextResponse.json(
        { error: "render_failed", message: (err as Error).message },
        { status: 500 },
      );
    }
    log.info("background:ok", {
      slug,
      variant,
      sizeKey,
      pngBytes: png.length,
    });

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${slug}-bg-${variant}-${sizeKey}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
);

function renderMinimal(
  size: { w: number; h: number },
  primary: string,
  secondary: string,
  accent: string,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primary}"/>
        <stop offset="100%" stop-color="${secondary}"/>
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${size.w}" height="${size.h}" fill="url(#bg)"/>
    <rect width="${size.w}" height="${size.h}" fill="url(#glow)"/>
  </svg>`;
}

function renderGradient(
  size: { w: number; h: number },
  primary: string,
  secondary: string,
  textOnBrand: string,
  studio: string,
): string {
  const fontSize = Math.round(size.h * 0.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primary}"/>
        <stop offset="100%" stop-color="${secondary}"/>
      </linearGradient>
    </defs>
    <rect width="${size.w}" height="${size.h}" fill="url(#bg)"/>
    <text x="${size.w / 2}" y="${size.h / 2 + fontSize / 3}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${textOnBrand}" opacity="0.18" text-anchor="middle">${escapeXml(studio.toUpperCase())}</text>
  </svg>`;
}

function renderBottomBar(
  size: { w: number; h: number },
  primary: string,
  secondary: string,
  accent: string,
  textOnBrand: string,
  name: string,
  role: string,
  studio: string | undefined,
  qrSvg: string,
): string {
  const barH = Math.round(size.h * 0.18);
  const barY = size.h - barH;
  const nameSize = Math.round(barH * 0.34);
  const roleSize = Math.round(barH * 0.22);
  const padding = Math.round(size.w * 0.04);

  let qrEl = "";
  if (qrSvg) {
    const inner = qrSvg
      .replace(/<\?xml[^>]*\?>/g, "")
      .replace(/<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "");
    const qrSize = Math.round(barH * 0.85);
    const qrX = size.w - padding - qrSize;
    const qrY = barY + (barH - qrSize) / 2;
    qrEl = `<svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid meet"><rect width="1024" height="1024" fill="white" rx="48"/>${inner}</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primary}"/>
        <stop offset="100%" stop-color="${secondary}"/>
      </linearGradient>
      <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
      </linearGradient>
    </defs>
    <rect width="${size.w}" height="${size.h}" fill="url(#bg)"/>
    <rect x="0" y="${barY}" width="${size.w}" height="${barH}" fill="url(#bar)"/>
    <rect x="0" y="${barY}" width="${Math.round(size.w * 0.005)}" height="${barH}" fill="${accent}"/>
    <text x="${padding}" y="${barY + barH * 0.45}" font-family="Helvetica, Arial, sans-serif" font-size="${nameSize}" font-weight="700" fill="${textOnBrand}">${escapeXml(name)}</text>
    <text x="${padding}" y="${barY + barH * 0.78}" font-family="Helvetica, Arial, sans-serif" font-size="${roleSize}" font-weight="400" fill="${textOnBrand}" opacity="0.85">${escapeXml(role)}${studio ? " · " + escapeXml(studio) : ""}</text>
    ${qrEl}
  </svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
