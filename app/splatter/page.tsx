/**
 * app/splatter/page.tsx — Splatter landing on holoflow.co.uk.
 *
 * The browser-side surface mirrors what we can run without the desktop:
 *
 *   - AI Scout (metadata + LLM enrichment via the BYOK Aura dialogue)
 *   - WebXR splat viewer (drop your own .ply / .splat)
 *   - Preflight, Coverage, AR export, Jobs (bench-backed)
 *   - Install link for the Windows app
 */

import Link from "next/link";

import { benchInfo } from "lib/splatter/bench-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Splatter · Holoflow",
  description:
    "Windows prep tool — 360° footage to Postshot, Brush, and Lichtfeld. Browser-side AI Scout, WebXR viewer, coverage globe.",
};

export default async function SplatterLanding() {
  const info = await benchInfo();
  const benchDesc = info.reachable
    ? `Connected: ${info.base_url} · v${info.version}`
    : "Bench offline — Scout / Viewer still work; everything else needs the desktop app or a reachable bench.";

  return (
    <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="chrome-label">Splatter</div>
      <h1 className="mt-4 text-4xl leading-[0.95] md:text-5xl">
        From 360 camera,
        <br />
        to Gaussian Splat.
      </h1>
      <p className="mt-6 max-w-2xl text-chrome-200">
        One app. Drag and drop. Works out of the box. Multi-camera and batch
        processing. Hands off to Postshot, Brush, and Lichtfeld Studio.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/splatter/download"
          className="rounded-sm bg-chrome-100 px-5 py-3 text-sm font-medium text-warm-black-950 hover:bg-chrome-200"
        >
          Download for Windows
        </Link>
        <Link
          href="/splatter/scout"
          className="rounded-sm border border-warm-black-800 px-5 py-3 text-sm text-chrome-100 hover:border-chrome-400"
        >
          Try AI Scout in your browser →
        </Link>
      </div>

      <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="AI Scout"
          href="/splatter/scout"
          desc="Drop footage in, the app analyses it and writes your pipeline. Browser-side here, full OpenCV pass on the bench."
        />
        <Card
          title="WebXR Viewer"
          href="/splatter/viewer"
          desc="Drop a .ply, .splat, or .ksplat — preview it in your browser, share a link, open on Vision Pro / Quest / phone."
        />
        <Card
          title="Pre-flight scorecard"
          href="/splatter/preflight"
          desc="Score a frame set on SfM-readiness. Refuses doomed runs and tells you which frames are the problem."
        />
        <Card
          title="Coverage globe"
          href="/splatter/coverage"
          desc="Sparse SfM pass → 3D heatmap of view density on a sphere. See exactly where you didn't shoot."
        />
        <Card
          title="AR export"
          href="/splatter/ar-export"
          desc="Splat → USDZ Quick Look, glTF KHR_gaussian_splatting, mind-ar card, WebXR, Looking Glass quilt."
        />
        <Card
          title="Recent jobs"
          href="/splatter/jobs"
          desc="Live view of the bench sidecar's job queue. Mirrors the desktop's Capture tab."
        />
        <Card title="Bench" href="/splatter/bench" desc={benchDesc} />
        <Card
          title="Download desktop"
          href="/splatter/download"
          desc="The full Windows app with bundled sidecar — drag-drop, SAM2 masking, full Postshot/Brush/Lichtfeld handoff."
        />
      </section>

      <footer className="mt-20 text-xs text-chrome-400">
        Built on the <code className="text-chrome-200">splat360</code> engine.
        Sidecar:{" "}
        <code className="text-chrome-200">D:\The_Hangar\engines\splat360</code>{" "}
        · desktop app:{" "}
        <code className="text-chrome-200">D:\The_Hangar\apps\splatter</code>.
      </footer>
    </article>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-5 transition-colors hover:border-chrome-400"
    >
      <h3 className="text-base text-chrome-100">{title}</h3>
      <p className="mt-2 text-sm text-chrome-300">{desc}</p>
    </Link>
  );
}
