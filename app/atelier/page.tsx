import Footer from "components/layout/footer";
import Link from "next/link";
import { meshes, meshesByCategory, meshCategories } from "lib/assets/meshes";
import {
  brushes,
  brushesByCategory,
  brushCategories,
} from "lib/assets/brushes";
import { labanCorners, kataMoves } from "lib/assets/flow-arts";
import { genomes, sculptureKingdoms } from "lib/assets/genomes";
import { algorithms, algorithmFamilies } from "lib/assets/algorithms";
import MeshCard from "components/atelier/mesh-card";
import BrushCard from "components/atelier/brush-card";
import GenomeCard from "components/atelier/genome-card";
import LabanCorners from "components/atelier/laban-corners";
import KataMoveList from "components/atelier/kata-move-list";
import { portedSlugs } from "lib/algorithms";

export const metadata = {
  title: "The atelier — the studio's working bench, online",
  description:
    "What the bench has made. Meshes, brushes, genomes, kata-moves, jewellery algorithms — the working assets behind the photographs, the bureau, and the services pages, surfaced here as their own browsable layer.",
};

export default function AtelierPage() {
  const populatedMeshCategories = meshCategories.filter(
    (cat) => meshesByCategory(cat).length > 0,
  );
  const populatedBrushCategories = brushCategories.filter(
    (cat) => brushesByCategory(cat).length > 0,
  );

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The atelier</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          What the bench has made.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The studio doesn&rsquo;t hide its working files. Below is the
          stock the bench actually keeps: the meshes that come out of
          the Blender + Python pipeline, the brushes the poi-sculptor
          paints with, the kata-moves the choreographer addresses by
          name, the Laban-effort canon that organises the gestural
          axis, and the genomes the evolution engine has accepted as
          ancestors.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          None of this is the finished work &mdash; that lives in{" "}
          <Link
            href="/photographs"
            className="text-pink-200 underline underline-offset-4"
          >
            photographs
          </Link>
          ,{" "}
          <Link
            href="/bureau"
            className="text-pink-200 underline underline-offset-4"
          >
            the print bureau
          </Link>
          , and{" "}
          <Link
            href="/services"
            className="text-pink-200 underline underline-offset-4"
          >
            services
          </Link>
          . What sits here is the material the studio works <em>in</em>
          . Browse it the way you&rsquo;d browse a paint manufacturer&rsquo;s
          colour chart, or a typefoundry&rsquo;s specimen book.
        </p>

        <nav className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-6">
          {[
            { slug: "chambers", title: "Chambers" },
            { slug: "meshes", title: "Meshes" },
            { slug: "brushes", title: "Brushes" },
            { slug: "flow-arts", title: "Flow-arts" },
            { slug: "genomes", title: "Genomes" },
            { slug: "algorithms", title: "Algorithms" },
          ].map((section) => (
            <a
              key={section.slug}
              href={`#${section.slug}`}
              className="block rounded-sm border border-warm-black-800 bg-warm-black-900/30 px-3 py-2 text-xs text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              {section.title}
            </a>
          ))}
        </nav>

        {/* CHAMBERS ---------------------------------------------------- */}
        <section id="chambers" className="mt-16 scroll-mt-24">
          <div className="chrome-label text-pink-200 mb-2">
            Interactive &mdash; tools the studio uses, that you can use too
          </div>
          <h2 className="text-3xl text-chrome-100">Chambers.</h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Small rooms where one of the studio&rsquo;s bench tools is
            ported into the browser. Drop something in; get something
            out. No sign-up. The browser-only chambers run on your
            machine; the Python-backed ones go through the studio&rsquo;s
            Firebase Functions deployment (no cost to you).
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                slug: "pixelify",
                title: "Pixelify",
                kind: "Browser",
                summary: "Drop an image, get pixel art back. Six dither modes, Lospec palette support.",
              },
              {
                slug: "lithophane",
                title: "Lithophane",
                kind: "Function",
                summary: "Image → printable STL. Backlight the print, the photograph appears.",
              },
              {
                slug: "remove-bg",
                title: "Remove background",
                kind: "Function",
                summary: "U²-Net background removal. PNG with alpha back, three model variants.",
              },
              {
                slug: "pixeldetector",
                title: "Pixel detector",
                kind: "Function",
                summary: "Find the native pixel-art resolution of an upscaled retro image.",
              },
              {
                slug: "probe",
                title: "Probe",
                kind: "Function",
                summary: "Every photograph carries a paperwork trail. EXIF, ICC, GPS, camera, lens.",
              },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/atelier/${c.slug}`}
                className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 transition-colors hover:border-pink-200/60"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base text-chrome-100">{c.title}</h3>
                  <span className="chrome-label text-chrome-500">
                    {c.kind}
                  </span>
                </div>
                <p className="text-sm text-chrome-300">{c.summary}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* MESHES ----------------------------------------------------- */}
        <section id="meshes" className="mt-16 scroll-mt-24">
          <div className="chrome-label text-pink-200 mb-2">
            Geometry &mdash; what the print bureau prints
          </div>
          <h2 className="text-3xl text-chrome-100">Meshes.</h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Every mesh below is published as a downloadable .glb. The
            preview is the file itself, rotating on the page; no
            screenshot stage. {meshes.length} meshes in the first
            migration pass &mdash; the rest of The Hangar&rsquo;s
            catalogue queues for a follow-up run.
          </p>

          {populatedMeshCategories.map((cat) => {
            const items = meshesByCategory(cat);
            return (
              <div key={cat} className="mt-10">
                <h3 className="chrome-label text-chrome-300">
                  {cat.replace(/-/g, " ")} &mdash; {items.length}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((mesh) => (
                    <MeshCard key={mesh.slug} mesh={mesh} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* BRUSHES ---------------------------------------------------- */}
        <section id="brushes" className="mt-20 scroll-mt-24">
          <div className="chrome-label text-pink-200 mb-2">
            Material &mdash; what the poi-sculptor paints with
          </div>
          <h2 className="text-3xl text-chrome-100">Brushes.</h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Twenty brushes the studio paints in 3D space with. Each
            one is a node-material recipe; each one has three named
            parameters at default values. The full WebGPU / TSL
            implementations live in the poi-sculptor&rsquo;s
            brush-engine.html in The Hangar; this page is the
            specimen book.
          </p>

          {populatedBrushCategories.map((cat) => {
            const items = brushesByCategory(cat);
            return (
              <div key={cat} className="mt-10">
                <h3 className="chrome-label text-chrome-300">
                  {cat} &mdash; {items.length}
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((brush) => (
                    <BrushCard key={brush.slug} brush={brush} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* FLOW-ARTS -------------------------------------------------- */}
        <section id="flow-arts" className="mt-20 scroll-mt-24">
          <div className="chrome-label text-pink-200 mb-2">
            Gesture &mdash; the named axes of the moving body
          </div>
          <h2 className="text-3xl text-chrome-100">Flow-arts.</h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Two related catalogues. The Laban canon names the
            corners of a 4D effort cube &mdash; eight Basic Efforts
            that any human gesture falls between. The kata-move
            library names the studio&rsquo;s working moves and tags
            each one with which corner it primarily lives in.
          </p>

          <div className="mt-8">
            <h3 className="chrome-label text-chrome-300">
              Laban Basic Efforts &mdash; {labanCorners.length} corners
            </h3>
            <div className="mt-4">
              <LabanCorners />
            </div>
          </div>

          <div className="mt-10">
            <h3 className="chrome-label text-chrome-300">
              Kata moves &mdash; {kataMoves.length} named gestures
            </h3>
            <p className="mt-2 max-w-prose text-sm text-chrome-400">
              First-pass library. The trajectory data still lives in
              Blender working files; the next migration pass will
              surface those as downloadable JSON paths.
            </p>
            <div className="mt-4">
              <KataMoveList />
            </div>
          </div>
        </section>

        {/* GENOMES ---------------------------------------------------- */}
        <section id="genomes" className="mt-20 scroll-mt-24">
          <div className="chrome-label text-pink-200 mb-2">
            Lineage &mdash; what the evolution engine accepted
          </div>
          <h2 className="text-3xl text-chrome-100">Genomes.</h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            The studio&rsquo;s sculpture-evolution engine works on
            genomes &mdash; vectors of named genes (arm count,
            branching depth, Murray exponent, surface texture, IOR
            target). Below are {genomes.length} canonical specimens
            from the registry; the rest of the lineage (hundreds of
            mutations and crossovers) lives in the working data.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {genomes.map((genome) => (
              <GenomeCard key={genome.slug} genome={genome} />
            ))}
          </div>

          <div className="mt-10">
            <h3 className="chrome-label text-chrome-300">
              Sculpture kingdoms &mdash; {sculptureKingdoms.length}
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {sculptureKingdoms.map((k) => (
                <li
                  key={k.slug}
                  className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 px-3 py-2"
                >
                  <h4 className="text-chrome-100">{k.name}</h4>
                  <p className="text-sm text-chrome-400">{k.notes}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ALGORITHMS ------------------------------------------------- */}
        <section id="algorithms" className="mt-20 scroll-mt-24">
          <div className="chrome-label text-pink-200 mb-2">
            Recipes &mdash; the catalogue of jewellery algorithms
          </div>
          <h2 className="text-3xl text-chrome-100">Algorithms.</h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Thirty named algorithms drive the jewellery-array system:
            from logarithmic spirals to Penrose tilings, from
            wing-venation to spinodal decomposition. The full cabinet
            &mdash; drawer by drawer, with live previews on the
            ported ones &mdash; lives on its own page.
          </p>

          <Link
            href="/atelier/algorithms"
            className="mt-6 block rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 hover:border-pink-200/60 hover:bg-warm-black-900/50"
          >
            <div className="chrome-label text-pink-200">
              View the algorithm cabinet
            </div>
            <h3 className="mt-2 text-2xl text-chrome-100">
              Thirty generators, eight kingdoms.
            </h3>
            <p className="mt-2 text-sm text-chrome-300">
              {algorithms.length} algorithms catalogued.{" "}
              {portedSlugs.length} ported into runnable TypeScript with
              live R3F preview; the rest are queued. Browse the cabinet
              &rarr;
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {algorithmFamilies.map((fam) => (
                <span
                  key={fam.id}
                  className="flex items-center gap-1.5 rounded-sm border border-warm-black-800 px-2 py-1 text-[0.65rem] text-chrome-400"
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: fam.colorSignal }}
                    aria-hidden
                  />
                  {fam.name}
                </span>
              ))}
            </div>
          </Link>
        </section>

        {/* CROSS-REFERENCES ----------------------------------------- */}
        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Where this material is used</div>
          <p className="mt-3 text-chrome-300">
            For the working tools that produced this material, see{" "}
            <Link
              href="/stack"
              className="text-pink-200 underline underline-offset-4"
            >
              the stack
            </Link>
            . The marching-cubes pipeline that turns kata-trajectories
            into printable meshes lives at{" "}
            <Link
              href="/play"
              className="text-pink-200 underline underline-offset-4"
            >
              /play
            </Link>
            . The long-form articles that argue for this architecture
            are queued under{" "}
            <Link
              href="/articles"
              className="text-pink-200 underline underline-offset-4"
            >
              articles
            </Link>{" "}
            (the jewellery-algorithm catalogue, the easing-math notes,
            the genome-breeding writeup). For the daily working log
            see{" "}
            <Link
              href="/journal"
              className="text-pink-200 underline underline-offset-4"
            >
              the journal
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
