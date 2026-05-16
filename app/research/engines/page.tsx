import Link from "next/link";

import Footer from "components/layout/footer";

export const metadata = {
  title: "Engines — Research",
  description:
    "The Python engines behind the studio's research surface — splat360, sharp-onnx, mesh-to-sdf. What each does, what math it relies on, and which codex entries fill in the underlying concepts.",
};

type Engine = {
  name: string;
  path: string;
  oneLiner: string;
  body: string;
  mathRefs: { slug: string; label: string }[];
  status: string;
  licence: string;
};

const ENGINES: Engine[] = [
  {
    name: "splat360",
    path: "The_Hangar/engines/splat360",
    oneLiner:
      "360-camera-first Gaussian Splat service.",
    body: `Takes capture from spherical cameras — DJI Avata 360, DJI Osmo 360,
Insta360 X-series, GoPro Max, Ricoh Theta — and produces a 3D
gaussian splat. The wedge is honest handling of the dual-fisheye
sensor pair rather than pretending it's a pinhole rig after
stitching. Three input paths: pre-stitch DNG pair, equirect MP4,
cubemap reprojection. The load-bearing decision is which one to
take for which trainer; the rest is COLMAP / GLOMAP / gsplat /
Brush plumbing. All providers are commerce-safe (BSD / Apache /
MIT). DJI Terra Flagship handles splats but only for pinhole rigs;
this engine targets the gap consumer 360 drones leave behind.`,
    mathRefs: [
      {
        slug: "equirectangular-projection",
        label: "Equirectangular projection",
      },
      { slug: "gaussian-splatting", label: "Gaussian splatting" },
    ],
    status: "Foundation-phase skeleton. Pipeline stages unimplemented; provider wiring queued.",
    licence: "Outputs land on the commerce track (no apple-amlr contamination).",
  },
  {
    name: "sharp-onnx",
    path: "The_Hangar/engines/sharp-onnx",
    oneLiner:
      "Apple SHARP via ONNX — single image to gaussian splat.",
    body: `Loads the FP16-quantised SHARP graph through onnxruntime, hands it
a 1536×1536 RGB image, and gets back the gaussian-splat tensors —
positions, scales, rotations, opacities, the DC spherical harmonic
colour term — for roughly 1.18 million gaussians. A second script
rewrites SHARP's native PLY (which carries SHARP-specific metadata
elements after the vertex block) into the standard INRIA-3DGS
layout that Postshot, SuperSplat, Spark, and splat.js all accept.
About ninety seconds per still on the studio bench's RTX 4090.
This is what produced the splats at /research/cctv-3d-archive.`,
    mathRefs: [
      { slug: "onnx-runtime", label: "ONNX Runtime" },
      { slug: "gaussian-splatting", label: "Gaussian splatting" },
    ],
    status: "Operational. Batch-running the CCTV London archive.",
    licence:
      "Apple SHARP weights are research-only (apple-amlr); outputs cannot enter the commerce track.",
  },
  {
    name: "mesh-to-sdf",
    path: "The_Hangar/tools/mesh-to-sdf",
    oneLiner:
      "Mesh → signed distance field binary for browser shaders.",
    body: `Loads a GLB / OBJ / STL through trimesh, voxelises at the chosen
resolution along the longest axis, runs the SciPy Euclidean
distance transform on the binary occupancy grid in both directions,
signs the result, and writes a single Float32 .bin file with a
small header. The browser uploads it as a THREE.Data3DTexture; the
fragment shader samples it directly. 128³ for wearable-scale
objects, 256³ for wall reliefs. This is the bridge between any
volumetric representation and a shader that wants to ray-march
through it.`,
    mathRefs: [
      { slug: "signed-distance-fields", label: "Signed distance fields" },
      { slug: "marching-cubes", label: "Marching cubes" },
    ],
    status: "Operational. In use by the waveguide-object pipeline.",
    licence: "BSD / Apache stack. Outputs land on the commerce track.",
  },
];

export default function EnginesPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Link
          href="/research"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Research
        </Link>

        <header className="mt-10">
          <div className="chrome-label">Research &middot; Engines</div>
          <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05] text-chrome-100">
            The Python under the bench.
          </h1>
          <p className="mt-6 max-w-xl text-chrome-200">
            The studio runs three working Python engines on the bench
            and one in the workshop&rsquo;s shader toolchain. Below is
            each engine, what it does, the math it relies on (with a
            link to the codex entry that explains it), and the licence
            track each one feeds into. Source for everything below
            lives in The Hangar; this page documents it so the
            references in articles and journal entries land in the
            right place.
          </p>
        </header>

        <section className="mt-16 space-y-16">
          {ENGINES.map((engine) => (
            <div key={engine.name} className="border-t border-warm-black-800 pt-10">
              <div className="chrome-label text-pink-200">{engine.name}</div>
              <h2 className="mt-2 text-2xl text-chrome-100">
                {engine.oneLiner}
              </h2>
              <p className="mt-1 font-mono text-xs text-chrome-500">
                {engine.path}
              </p>
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-chrome-300">
                {engine.body}
              </p>

              <div className="mt-6">
                <div className="chrome-label text-chrome-500 mb-2">
                  Math behind it
                </div>
                <div className="flex flex-wrap gap-2">
                  {engine.mathRefs.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/codex/${m.slug}`}
                      className="rounded-full border border-pink-200/30 px-3 py-1 text-xs text-pink-200/90 hover:border-pink-200/60 hover:text-pink-100"
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
                <div>
                  <dt className="chrome-label text-chrome-500">Status</dt>
                  <dd className="mt-1 text-chrome-300">{engine.status}</dd>
                </div>
                <div>
                  <dt className="chrome-label text-chrome-500">Licence track</dt>
                  <dd className="mt-1 text-chrome-300">{engine.licence}</dd>
                </div>
              </dl>
            </div>
          ))}
        </section>

        <section className="mt-20 border-t border-warm-black-800 pt-10">
          <div className="chrome-label text-chrome-500 mb-3">
            How the studio uses Python
          </div>
          <p className="text-sm text-chrome-300">
            The split is consistent. TypeScript on the website where
            visitors see things; Python on the bench where models
            run, distance transforms get computed, and PLYs get
            rewritten. The two halves connect through the studio&rsquo;s{" "}
            <Link href="/codex" className="underline text-pink-200">
              codex
            </Link>
            , which is the canonical record of what the math actually
            is &mdash; not in code, but in language anyone can read.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
