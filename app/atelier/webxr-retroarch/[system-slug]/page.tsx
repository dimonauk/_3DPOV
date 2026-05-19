/**
 * app/atelier/webxr-retroarch/[system-slug]/page.tsx — Per-system entry.
 *
 * Pre-selects one console on the toolbar. Useful for codex / tutorial
 * deep-links — e.g. `/atelier/webxr-retroarch/snes` lands the visitor
 * in the room with SNES already chosen.
 *
 * 404s if the slug doesn't match any system in lib/emulator/systems.ts.
 */

import { notFound } from "next/navigation";
import Link from "next/link";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";
import { getSystem, SYSTEMS } from "lib/emulator/systems";

import RetroArchClient from "../retroarch-client";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return SYSTEMS.map((s) => ({ "system-slug": s.slug }));
}

type Props = {
  params: Promise<{ "system-slug": string }>;
};

export async function generateMetadata({ params }: Props) {
  const { "system-slug": slug } = await params;
  const system = getSystem(slug);
  if (!system) return {};
  return {
    title: `WebXR RetroArch · ${system.label} — Holoflow Studio`,
    description: `A virtual game room with the ${system.label} on the side table. Bring your own ROM; the libretro core runs locally; nothing uploads.`,
  };
}

export default async function PerSystemPage({ params }: Props) {
  const { "system-slug": slug } = await params;
  const system = getSystem(slug);
  if (!system) notFound();

  return (
    <>
      <IssueBand
        label="ATELIER"
        issue="ISSUE 06"
        date="MAY 2026"
        publisher={`WEBXR RETROARCH · ${system.label.toUpperCase()}`}
      />

      <article className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="chrome-label">
          Atelier &middot; WebXR RetroArch &middot; {system.label}
        </div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The {system.label}
          <br />
          on the side table.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          {system.manufacturer}. Bring a ROM that runs on the original
          hardware; the libretro core boots in this tab and the picture
          lands on the virtual CRT. Nothing uploads.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/webxr-retroarch"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; all systems
          </Link>
          <Link
            href={`/emulator/${system.slug}`}
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            2D version (/emulator/{system.slug})
          </Link>
        </div>

        <div className="mt-12">
          <RetroArchClient defaultSystemSlug={system.slug} />
        </div>
      </article>
      <Footer />
    </>
  );
}
