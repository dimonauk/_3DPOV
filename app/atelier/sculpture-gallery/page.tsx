/**
 * app/atelier/sculpture-gallery/page.tsx — The studio's editioned
 * pieces, walkable in WebXR.
 *
 * The Princess curates a small wing of the atelier: a rotunda of
 * plinths under tinted spots, wall reliefs on the back wall, a placard
 * over each piece. Step in on a monitor and orbit; step in from a
 * headset and walk through.
 *
 * Server component. The R3F scene is in
 * `components/sculpture-gallery/SculptureGalleryScene.tsx` (client) and
 * carries the WebXR session button + dual-mode camera rigs via
 * `SceneStage`. The list of works below the scene is `SculptureCard`,
 * also server-rendered, so the page hydrates only the scene.
 *
 * Sister surface: the bench-side workshop (marching-cubes,
 * image-to-Hunyuan3D) lives at `/atelier/sculpture-gallery/workshop`.
 */
import Link from "next/link";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";
import { SculptureCard } from "components/sculpture-gallery/SculptureCard";
import { SculptureGalleryScene } from "components/sculpture-gallery/SculptureGalleryScene";
import { listCatalogue } from "lib/sculpture-gallery/catalogue";

export const metadata = {
  title: "Sculpture gallery — walk the editioned pieces in WebXR",
  description:
    "The studio's editioned waveguide sculptures, light-painting pieces, and belt-printed wall reliefs, arranged on plinths in a small WebXR rotunda. Orbit on a monitor or walk through in a headset.",
};

const issueLabel = () => {
  const now = new Date();
  const month = now
    .toLocaleString("en-GB", { month: "long" })
    .toUpperCase();
  return `${month} ${now.getUTCFullYear()}`;
};

export default function SculptureGalleryPage() {
  const catalogue = listCatalogue();
  const issue = issueLabel();

  return (
    <>
      <article className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <IssueBand
          label="ATELIER"
          issue="WING 01"
          date={issue}
          publisher="HOLOFLOW STUDIO"
        />

        <header className="mt-8 mb-10 flex flex-col gap-4">
          <div className="chrome-label">Atelier &middot; Sculpture gallery</div>
          <h1 className="font-display text-5xl leading-[0.95] md:text-6xl">
            A small wing of editioned pieces.
          </h1>
          <p className="max-w-2xl text-lg text-chrome-200 italic">
            The Princess curates a small wing of the atelier &mdash; waveguide
            blooms, lattice knots, frozen poi curves, and belt-printed wall
            reliefs. Orbit it on a monitor; walk it in a headset.
          </p>
          <p className="max-w-2xl text-sm text-chrome-400">
            Tap a piece to step closer. The toolbar over the canvas opens a
            WebXR session if your device supports it &mdash; teleport with the
            controller ray, point at a piece for the placard. Reduced-motion
            users keep teleport; smooth locomotion stays off.
          </p>
        </header>

        <section className="w-full">
          <SculptureGalleryScene height="78vh" />
        </section>

        <section className="mt-20">
          <h2 className="font-display text-3xl">The catalogue</h2>
          <p className="mt-2 max-w-2xl text-sm text-chrome-400">
            Every piece in the gallery, in card form. Tap a title to
            recentre the gallery on it; the workshop bench sits at{" "}
            <Link
              href="/atelier/sculpture-gallery/workshop"
              className="text-pink-200 underline underline-offset-4"
            >
              /atelier/sculpture-gallery/workshop
            </Link>
            .
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {catalogue.map((entry) => (
              <SculptureCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What sits behind the wall</div>
          <p className="mt-3">
            The scene is React Three Fiber under our WebXR-first
            SceneStage wrapper &mdash; WebGPU when the device offers it,
            WebGL 2 otherwise, the same scene graph in both. Plinths,
            spots, and placards are pure R3F; the catalogue is a plain
            data file at{" "}
            <code className="text-pink-200">
              lib/sculpture-gallery/catalogue.ts
            </code>
            ; the layout is a pure function in{" "}
            <code className="text-pink-200">
              lib/sculpture-gallery/gallery-layout.ts
            </code>{" "}
            (circle for six pieces or fewer, corridor beyond). Drop a
            new edition in the catalogue and the gallery picks it up on
            the next reload.
          </p>
          <p className="mt-3">
            Notes on building, voice, and adding a piece live in{" "}
            <Link
              href="/docs/sculpture-gallery"
              className="text-pink-200 underline underline-offset-4"
            >
              docs/SCULPTURE-GALLERY.md
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
