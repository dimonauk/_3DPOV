import Footer from "components/layout/footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  algorithms,
  algorithmFamilies,
  type AlgorithmCatalogueEntry,
  getAlgorithm,
} from "lib/assets/algorithms";
import { isPorted, portedAlgorithms } from "lib/algorithms";
import AlgorithmPreview from "components/atelier/algorithm-preview-client";

export function generateStaticParams() {
  return algorithms.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const algo = getAlgorithm(slug);
  if (!algo) return { title: "Algorithm — not found" };
  return {
    title: `${algo.name} — algorithm cabinet`,
    description: algo.notes,
  };
}

function familyMeta(family: AlgorithmCatalogueEntry["family"]) {
  return algorithmFamilies.find((f) => f.id === family);
}

/**
 * Two short paragraphs of description per algorithm. The metadata's
 * `notes` field is one sentence; the second sentence here is a brief
 * expansion the migration agent wrote from the source comments and
 * the algorithm's family-level dna.
 */
const EXPANDED_NOTES: Record<string, string> = {
  spiral:
    "A CatmullRom curve swept into a tapered tube. Three knobs &mdash; growth rate, vertical climb, revolution count &mdash; produce everything from a tight nautilus to a wide phyllotactic disc.",
  gyroid:
    "Schoen&rsquo;s 1970 triply-periodic minimal surface, sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0, sampled as a height-field patch. The geometry SLA-prints with no internal supports because every point already has a neighbour.",
  lsystem:
    "The algorithm runs space colonisation (Runions, Lane &amp; Prusinkiewicz 2007) rather than a strict Lindenmayer grammar &mdash; the cabinet labels them the same because both produce branched tube networks at scale.",
  auxetic:
    "The re-entrant V cell that, when stretched, expands sideways instead of necking. Inspired by the dragonfly wing&rsquo;s auxetic venation; SLA-printed in resin, the lattice retains the geometric property.",
  "fermat-spiral":
    "Vogel&rsquo;s 1979 phyllotaxis formulation. N seeds at the golden angle 137.508° pack a disc with every neighbour pair at near-uniform distance &mdash; the densest single-rule tessellation in two dimensions.",
  dla: "Diffusion-limited aggregation. Random walkers stick on contact to a seed cluster; the resulting fractal aggregate has dimension ~1.71 in 2D. Frost on glass, lichen on stone, the dendrite under the microscope.",
  voronoi:
    "Each cell wall is the perpendicular bisector between two seed points. Lloyd-relaxed for a couple of passes to even out the cells; the boundary network is the dual mesh of the Delaunay triangulation.",
  "lsystem-tube":
    "An L-system whose successor strings draw tube primitives instead of line primitives. The output reads as roots, veins, or capillary networks depending on the branching angle and step length.",
  "geodesic-spines":
    "An icosphere body with cones rising from each vertex along the surface normal. The radiolarian formal: a tiny single-celled marine organism's silica armour, modelled here at jewellery scale.",
  "celtic-knot":
    "Two to five strands wound on a torus, each phase-offset and Z-oscillated to fake the over-under weave at the resolution of the .glb preview. The Irish-monastic Book-of-Kells idiom formalised.",
  "swept-sinuous":
    "Multiple tapered tubes oscillate along sine carriers and end in optional petal caps. The Art Nouveau idiom &mdash; Mucha&rsquo;s tendril vocabulary &mdash; addressed by parameters.",
  "pcb-trace":
    "Right-angled traces between named nodes on a rectangular grid, with via cylinders at every corner. The retrofuturist family&rsquo;s circuit-board citation, executed as a 3D printable extrusion.",
  gear: "Involute tooth profile around an outer / pitch / root radius, extruded with a small bevel and pierced by spoke ellipses. The classical machine-element parametrisation, jewellery-scaled.",
  "skull-sdf":
    "Sphere-union of cranium, cheekbones, eye torii, nasal capsule, teeth row. The name carries over from the original&rsquo;s ambition; the realisation here is sphere-boolean rather than true signed-distance marching cubes.",
  "wing-venation":
    "Costal leading-edge spine, N radiating main veins, occasional cross-veins, an eyespot of concentric torii at the tip. Murray&rsquo;s-law geometry &mdash; the same branching law that runs blood vessels &mdash; applied to insect wings.",
  "penrose-tiling":
    "Two-tile aperiodic tessellation via rhombus deflation. Each iteration splits the thick / thin tiles into smaller copies according to Penrose&rsquo;s subdivision rules; after three to five passes the tiling resolves to a recognisable kite-and-dart field.",
  "reaction-diffusion":
    "Turing&rsquo;s 1952 reaction-diffusion system &mdash; the Gray-Scott formulation. Two chemicals diffuse and react over a grid for 800-1400 timesteps; the resulting concentration field is read as a heightmap. Spots, stripes, and coral patterns emerge from the same equations at different (f, k) presets.",
  tensegrity:
    "Buckminster Fuller&rsquo;s and Kenneth Snelson&rsquo;s structural idiom: rigid struts suspended in a network of tension cables. Random endpoint pairs on a sphere surface define the struts; each endpoint connects to its two nearest neighbours as cables.",
  sigil:
    "Outer ring, optional inner rings, a star polygon defined by chord step on a circle, radial spokes to the centre, and a sphere-eye at the origin. The Austin Osman Spare line-art tradition, addressed by parameters.",
  "torus-knot":
    "(p, q) parametric knot wrapping a torus, then tubed and bevelled. The (p, q) pair is drawn from a small canonical pool &mdash; (2,3), (3,4), (3,5), (5,3), (2,7) &mdash; so every output is a recognisable named knot.",
  "step-fret":
    "The Mesoamerican Xicalcoliuhqui motif: four box segments arranged around a corner, then recursing into smaller copies offset by a right-angle rotation. The same logic as the Greek key, rotated through Mixtec and Aztec frieze geometry.",
  interlace:
    "Concentric star-polygon layers with an over-under Z oscillation and radial connectors. The Byzantine tradition formalised &mdash; the same idiom that runs through Islamic geometric design and Coptic manuscript borders.",
  mon: "Edo-period Japanese family-crest generator: radial symmetry of order 5-8, multiple concentric layers, each node bearing one of a petal / rhombus / spoke primitive. Heritage typography meets parametric geometry.",
  "clash-compositor":
    "Memphis-Milano clashing-geometry compositor: a random sample from a pool of zigzags, dots, torii, bars, spheres, and rods scattered across a disc. The 1980s clash idiom &mdash; deliberate visual collision &mdash; executed by parameter rather than by hand.",
  "non-euclidean":
    "Poincaré disk mapping. A regular Euclidean grid of spokes and rings is run through the conformal map P(x, y) = (x, y) / (1 + s(x&sup2; + y&sup2;)) so the geometry compresses near the boundary the way hyperbolic space does.",
  "wigner-seitz":
    "Crystallographic Wigner-Seitz cells &mdash; the primitive cell of a Bravais lattice &mdash; constructed as the intersection of perpendicular bisector planes between a lattice point and its neighbours. A gemstone-cut surface derived from solid-state physics.",
  spinodal:
    "Spinodal-decomposition pattern: the bicontinuous foam that forms when two immiscible liquids unmix below their miscibility gap. Modelled as a thresholded sum-of-sines field; SLA-printable as a self-supporting open scaffold.",
  "ribbon-helix":
    "Protein-style alpha helix as a pleated ribbon. One to three strands, each a sequence of small box segments oriented along a CatmullRom backbone, with periodic side-chain nubs that mark the hydrogen-bond positions.",
  enneper:
    "Alfred Enneper&rsquo;s 1864 self-intersecting minimal surface, generalised to higher order n. Parametric form: a thickened shell with a border tube; the surface folds back on itself in a way no embedded surface can.",
  "diatom-hex":
    "Diatom-frustule pattern: hexagonal pore lattice on a circular disc with central raphe groove and outer striae. The single-celled marine algae&rsquo;s silica geometry &mdash; nature&rsquo;s hexagonal-lattice waveguide &mdash; modelled at jewellery scale.",
};

const PARAM_DESCRIPTIONS: Record<string, string> = {
  seed: "Linear-congruential RNG seed. Two runs with the same seed produce identical geometry; nudging the seed by one walks the cabinet around the algorithm&rsquo;s neighbourhood.",
  complexity:
    "0 to 1. Drives the count of primitives (vein count, tooth count, ring count, recursion depth). Higher values cost more vertices.",
  scale:
    "World-unit scaling factor. 1.0 corresponds to the cabinet&rsquo;s 25 mm reference cell &mdash; the size of a small pendant.",
  density:
    "0 to 1. Drives tube radius / fill weight. Higher values produce a chunkier, more visually-solid output.",
};

export default async function AlgorithmDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const algo = getAlgorithm(slug);
  if (!algo) notFound();

  const ported = isPorted(algo.slug);
  const family = familyMeta(algo.family);
  const expanded = EXPANDED_NOTES[algo.slug];
  const portedDescriptor = ported ? portedAlgorithms[algo.slug] : null;

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="chrome-label">
          Atelier &middot; Algorithms &middot; {algo.slug}
        </div>
        <h1 className="mt-4 text-4xl leading-[0.95] md:text-5xl">
          {algo.name}.
        </h1>
        <div className="mt-3 flex items-center gap-3 text-xs text-chrome-400">
          {family ? (
            <>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-warm-black-700"
                style={{ backgroundColor: family.colorSignal }}
                aria-hidden
              />
              <span>{family.name}</span>
            </>
          ) : null}
          <span className="font-mono text-chrome-500">
            #{algo.id.toString().padStart(2, "0")}
          </span>
          <span className="font-mono text-chrome-600">{algo.sourceFile}</span>
        </div>

        <p className="mt-6 max-w-2xl text-chrome-200">{algo.notes}</p>
        {expanded ? (
          <p
            className="mt-4 max-w-2xl text-chrome-300"
            dangerouslySetInnerHTML={{ __html: expanded }}
          />
        ) : null}

        {/* PREVIEW ---------------------------------------------------- */}
        <section className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="chrome-label text-pink-200 mb-2">
              Live preview
            </div>
            {ported && portedDescriptor ? (
              <AlgorithmPreview
                slug={algo.slug}
                params={portedDescriptor.params}
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6 text-center text-sm text-chrome-400">
                {/* TODO: source-port pending — see lib/algorithms/index.ts to add */}
                Source port pending. The catalogue entry above is
                live; the runnable TypeScript is queued for a later
                migration pass.
              </div>
            )}
          </div>

          {/* PARAMETERS ------------------------------------------------ */}
          <div>
            <div className="chrome-label text-pink-200 mb-2">
              Parameters
            </div>
            <table className="w-full text-left text-sm text-chrome-300">
              <thead>
                <tr className="border-b border-warm-black-800 text-[0.65rem] uppercase tracking-[0.15em] text-chrome-500">
                  <th className="py-2 pr-4">Knob</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2">Range</th>
                </tr>
              </thead>
              <tbody>
                {(portedDescriptor?.params ?? []).map((d) => (
                  <tr
                    key={d.key}
                    className="border-b border-warm-black-900/60"
                  >
                    <td className="py-2 pr-4 font-mono text-chrome-200">
                      {d.key}
                    </td>
                    <td className="py-2 pr-4 text-chrome-500">number</td>
                    <td className="py-2 font-mono text-chrome-500">
                      {d.min} &ndash; {d.max}
                    </td>
                  </tr>
                ))}
                {!ported ? (
                  <>
                    <tr className="border-b border-warm-black-900/60">
                      <td className="py-2 pr-4 font-mono text-chrome-200">
                        seed
                      </td>
                      <td className="py-2 pr-4 text-chrome-500">number</td>
                      <td className="py-2 font-mono text-chrome-500">
                        any int
                      </td>
                    </tr>
                    <tr className="border-b border-warm-black-900/60">
                      <td className="py-2 pr-4 font-mono text-chrome-200">
                        complexity
                      </td>
                      <td className="py-2 pr-4 text-chrome-500">number</td>
                      <td className="py-2 font-mono text-chrome-500">
                        0 &ndash; 1
                      </td>
                    </tr>
                    <tr className="border-b border-warm-black-900/60">
                      <td className="py-2 pr-4 font-mono text-chrome-200">
                        density
                      </td>
                      <td className="py-2 pr-4 text-chrome-500">number</td>
                      <td className="py-2 font-mono text-chrome-500">
                        0 &ndash; 1
                      </td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
            <dl className="mt-4 space-y-3 text-xs text-chrome-400">
              {Object.entries(PARAM_DESCRIPTIONS).map(([key, desc]) => (
                <div key={key}>
                  <dt className="font-mono text-chrome-300">{key}</dt>
                  <dd
                    className="mt-0.5"
                    dangerouslySetInnerHTML={{ __html: desc }}
                  />
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CROSS-REFS ------------------------------------------------- */}
        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Where this drawer is used</div>
          <ul className="mt-3 space-y-2 text-sm text-chrome-300">
            <li>
              The studio&rsquo;s argument for the cabinet:{" "}
              <Link
                href="/articles/the-jewellery-algorithms"
                className="text-pink-200 underline underline-offset-4"
              >
                the jewellery algorithms
              </Link>
              .
            </li>
            <li>
              The kingdom this drawer sits inside:{" "}
              <Link
                href="/articles/the-eight-kingdoms"
                className="text-pink-200 underline underline-offset-4"
              >
                {family?.name ?? algo.family}
              </Link>
              .
            </li>
            <li>
              The breeding engine that strings drawers together into
              lineages:{" "}
              <Link
                href="/atelier/evolution"
                className="text-pink-200 underline underline-offset-4"
              >
                the evolution suite
              </Link>
              .
            </li>
            <li>
              Back to{" "}
              <Link
                href="/atelier/algorithms"
                className="text-pink-200 underline underline-offset-4"
              >
                the algorithm cabinet
              </Link>{" "}
              or{" "}
              <Link
                href="/atelier"
                className="text-pink-200 underline underline-offset-4"
              >
                the atelier
              </Link>
              .
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
