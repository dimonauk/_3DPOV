/**
 * app/admin/import/video-to-splat/page.tsx — Operator console for the
 * three-stage video-to-splat ladder.
 *
 * Stage 1 is live: pick a video, scrub, capture frames, each one goes
 * through SHARP on the bench. Stages 2 and 3 are scaffolded on the
 * capability surface but the bench side isn&rsquo;t wired yet, so the
 * UI states that plainly and leaves the submit buttons disabled.
 *
 * The shell is a Server Component; only the live Stage 1 component
 * needs the client runtime.
 */

import VideoFrameSplat from "components/admin/video-frame-splat";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Video → Splat · Operator console",
  description:
    "Three-stage ladder for turning video into gaussian splats: " +
    "single-frame SHARP today, full-clip gsplat training next, " +
    "4D dynamic splats as the aim.",
};

export default function VideoToSplatPage() {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-2 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console / Import / Video → Splat
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Video → Splat
          </h1>
          <p className="text-xs leading-relaxed text-chrome-400">
            Three stages, in order of how real they are today. Stage 1 picks
            a single frame out of a clip and sends it through Apple SHARP &mdash;
            one splat per frame, research-licence only, working on the bench
            right now. Stage 2 is the full-clip gsplat training path: one
            scene splat from the whole camera move; the capability provider
            exists but the bench service isn&rsquo;t wired. Stage 3 is the
            marquee &mdash; 4D dynamic splat you can step through in time &mdash;
            and it&rsquo;s honest scaffolding only.
          </p>
        </header>

        <section
          data-stage="1"
          className="flex flex-col gap-4 border-b border-warm-black-700 pb-10"
        >
          <span className="chrome-label text-pink-200">
            Stage 1 · Single-frame from video (live)
          </span>
          <p className="text-xs leading-relaxed text-chrome-400">
            Pick a local video, scrub to the moment you want, capture one or
            more frames. Each capture is sent to the bench as a JPEG and
            comes back as a 1.18M-gaussian splat on the research surface.
            The video itself never leaves your browser. Each frame costs
            roughly 90s of bench GPU time.
          </p>
          <VideoFrameSplat />
        </section>

        <section
          data-stage="2"
          className="flex flex-col gap-4 border-b border-warm-black-700 pb-10"
        >
          <span className="chrome-label text-chrome-300">
            Stage 2 · Full video → 3D splat (bench-side pending)
          </span>
          <p className="text-xs leading-relaxed text-chrome-400">
            Train a single static gaussian splat from the whole clip&rsquo;s
            camera path &mdash; SfM solves the poses, then gsplat optimises
            the scene. One splat per clip, not one per frame. The web
            surface is ready; the bench service that does the work isn&rsquo;t
            stood up yet.
          </p>
          <button
            type="button"
            disabled
            className="self-start rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-chrome-500 opacity-60"
            title="Bench wiring pending."
          >
            Submit video for training (bench wiring pending)
          </button>
          <pre className="overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3 text-[10px] leading-relaxed text-chrome-500">
{`pending:
  - splat360 service /jobs endpoint for non-360 video
  - SfM (COLMAP/GLOMAP) + gsplat training on bench
  - capability provider="hangar-gsplat" exists in
    lib/capabilities/viz/splat-generate.ts, server throws
    provider-unavailable`}
          </pre>
        </section>

        <section
          data-stage="3"
          className="flex flex-col gap-4 border-b border-warm-black-700 pb-10"
        >
          <span className="chrome-label text-chrome-300">
            Stage 3 · 4D dynamic splat (aim)
          </span>
          <p className="text-xs leading-relaxed text-chrome-400">
            The marquee: monocular video in, time-varying gaussian splat
            out, with a scrubber that lets you step through the motion.
            On the open side that means 4D-GS / Deformable-GS / SC-GS;
            Apple SHARP 4D would be the research-licence path if and when
            an ONNX export ships. Neither the bench service nor the browser
            viewer can do this yet &mdash; the current
            @mkkellogg/gaussian-splats-3d viewer is static-only.
          </p>
          <button
            type="button"
            disabled
            className="self-start rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-chrome-500 opacity-60"
            title="Research-track only."
          >
            Submit video for 4D training (research-track only)
          </button>
          <pre className="overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-3 text-[10px] leading-relaxed text-chrome-500">
{`pending:
  - 4D-aware bench service (4D-GS or similar)
  - 4D-aware browser viewer (current
    @mkkellogg/gaussian-splats-3d is static only)
  - capability provider="hangar-4dgs" exists in
    lib/capabilities/viz/splat-generate.ts, server throws
    provider-unavailable`}
          </pre>
        </section>

        <footer className="flex justify-between border-t border-warm-black-700 pt-4">
          <a
            href="/admin/import/google/connect"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ← Connection
          </a>
          <a
            href="/admin"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            Operator console →
          </a>
        </footer>
      </div>
    </main>
  );
}
