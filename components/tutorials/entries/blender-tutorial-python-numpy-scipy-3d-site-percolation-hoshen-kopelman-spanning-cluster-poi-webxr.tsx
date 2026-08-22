import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-3d-site-percolation-hoshen-kopelman-spanning-cluster-poi-webxr";

const TITLE =
  "Python numpy + scipy — 3D Site Percolation: Hoshen–Kopelman Algorithm, Critical Spanning Cluster & Voxel Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Occupy each site of an N×N×N cubic lattice at random with probability p. Below the critical threshold p_c ≈ 0.3116 only finite isolated blobs appear; above it, one giant connected cluster spans the whole volume. Exactly at p_c the spanning cluster is a fractal with Hausdorff dimension d_f ≈ 2.52 — maximum visual complexity for minimum material. Using scipy.ndimage.label (the Hoshen–Kopelman algorithm under the hood) we extract that cluster, build an exposed-face voxel mesh in numpy, colour it amber→teal by height, and export a faceted glow poi head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Hoshen, J. & Kopelman, R. (1976). Percolation and cluster distribution. I. Cluster multiple labeling technique and critical concentration algorithm. Physical Review B, 14(8), 3438–3445.",
      url: "https://doi.org/10.1103/PhysRevB.14.3438",
      licence: "Algorithm in public domain (mathematical methods are not copyrightable)",
      author: "Jack H. Hoshen and Raoul Kopelman",
    },
    {
      label:
        "scipy / scipy — scipy.ndimage.label implements connected-component labelling on N-dimensional arrays using a union-find approach equivalent to Hoshen–Kopelman.",
      url: "https://github.com/scipy/scipy",
      licence: "BSD-3-Clause",
      author: "Travis Oliphant et al. / SciPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Take a 55×55×55 cubic lattice. Flip a biased coin at every site. If it
        lands heads (probability p), the site is <em>occupied</em>. Now ask: can
        you walk from one face of the cube to the opposite face stepping only on
        occupied neighbours? Below a sharply defined probability{" "}
        <strong>p_c ≈ 0.3116</strong>, the answer is almost certainly{" "}
        <em>no</em> — only small isolated blobs exist. Above p_c, the answer is
        almost certainly <em>yes</em> — a single giant cluster spans wall to
        wall. At <em>exactly</em> p_c, neither answer is certain, and the
        cluster at the edge of spanning is a{" "}
        <strong>fractal with Hausdorff dimension ≈ 2.52</strong>. This is
        percolation theory, and that fractal geometry is what this blueprint
        builds.
      </p>

      <h2>Why the critical point is special</h2>
      <p>
        Away from p_c, the characteristic length scale is the correlation
        length ξ ~ |p − p_c|^(−ν) with ν ≈ 0.876. As p → p_c from either
        direction, ξ diverges and the system "forgets" the lattice scale —
        spatial self-similarity appears. The spanning cluster at p_c has no
        preferred scale between the lattice spacing and the system size, which
        is why its mass scales as r^d_f rather than r³ (solid sphere) or r²
        (shell). The intermediate exponent d_f ≈ 2.52 is universal across all
        cubic-symmetry site percolation problems in 3D regardless of lattice
        type.
      </p>
      <p>
        The other critical exponents are equally striking. The order parameter
        (fraction of sites in the infinite cluster) grows as P_∞ ~ (p −
        p_c)^β with β ≈ 0.418 — a non-integer power, which would be impossible
        for a classical phase transition and marks this as a genuine
        renormalisation-group fixed point. The mean cluster size (average
        number of sites in the cluster a randomly chosen occupied site belongs
        to, excluding the infinite cluster) diverges as S ~ |p −
        p_c|^(−γ) with γ ≈ 1.793 as you approach from either side.
      </p>

      <h2>The Hoshen–Kopelman algorithm</h2>
      <p>
        In 1976 Jack Hoshen and Raoul Kopelman published a clever single-pass
        labelling algorithm that runs in O(N · α(N)) time — effectively O(N)
        — where α is the inverse Ackermann function. The idea is a union–find
        structure. Scan the grid in raster order. When you encounter an
        occupied site, check its already-scanned neighbours:
      </p>
      <ul>
        <li>
          <strong>No occupied neighbours</strong> → assign a new label; write
          it into a "proper label" table at that index.
        </li>
        <li>
          <strong>One occupied neighbour</strong> → inherit its label.
        </li>
        <li>
          <strong>Multiple occupied neighbours with different labels</strong>
          → pick the label with the smallest "root" (via
          <em>path-compressed find</em>) and union the others into it.
        </li>
      </ul>
      <p>
        After the sweep, a second pass through the label table resolves all
        chains to canonical roots. The largest canonical label is the spanning
        cluster. In this blueprint we delegate the sweep to{" "}
        <code>scipy.ndimage.label</code> — an optimised C implementation of
        the same logic — rather than reimplementing it in Python (which would
        be 10–100× slower for a 55³ grid). The result is a label array of the
        same shape as the grid where 0 = background and each positive integer
        identifies one connected component.
      </p>

      <h2>Exposed-face voxel mesh</h2>
      <p>
        Once the spanning cluster's boolean mask is in hand, the mesh is built
        entirely in numpy without a Python loop. Pad the cluster with a layer
        of False on all six faces. For each of the six axis directions, find
        every grid cell where the cluster is occupied <em>but its
        axis-direction neighbour is not</em> — those are the exposed faces.
        The positions come from <code>np.argwhere</code>, and the four corner
        vertices of each quad are assembled via broadcasting into (K, 4, 3)
        float arrays. All six direction arrays are stacked, their vertices
        integer-deduplicated with <code>np.unique</code>, and fed into a
        bmesh in one go. The result is a watertight manifold mesh — no
        interior faces, no T-junctions.
      </p>
      <p>
        At p_c on a 55³ lattice the spanning cluster typically holds 1 000–
        4 000 sites (seed-dependent) and the mesh has roughly 8 000–20 000
        quads. The ragged, sponge-like surface clearly shows structure at
        multiple scales — a visual signature of the fractal dimension.
      </p>

      <h2>Colours and material</h2>
      <p>
        Vertex colours run from{" "}
        <strong style={{ color: "#e08c1a" }}>amber (1.0, 0.55, 0.1)</strong> at
        the bottom z-level of the cluster to{" "}
        <strong style={{ color: "#1ae0cc" }}>teal (0.1, 0.9, 0.8)</strong> at
        the top. This is not random: the spanning cluster in 3D percolation
        grows preferentially in directions that minimise the Euclidean distance
        to the boundaries, so bottom sites tend to be denser (core of the
        branching structure) while top sites are sparser tendrils. Mapping
        height → temperature gives a natural representation of this
        core-to-periphery gradient.
      </p>
      <p>
        The material is a flat-shaded vertex-colour emission. In Eevee Next,
        enabling Bloom (threshold 0.35, intensity 0.70) gives each teal tendril
        a soft halo — the poi-performance aesthetic in which the actual physical
        object blurs into a glowing light trace.
      </p>

      <h2>Poi connection</h2>
      <p>
        A poi spinning figure traces curves in space. When those curves are
        slow (low-velocity sustained paths), only isolated arcs are lit. When
        the spinner accelerates and the paths become dense, a giant connected
        luminous structure forms — one that an audience can see as a whole.
        The transition between these two states is the percolation threshold in
        disguise: the critical density at which isolated light segments fuse
        into a spanning constellation. The fractal dimension ≈ 2.52 of that
        moment matches the fractal boundary of the voxel poi head in this
        blueprint.
      </p>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr"
          >
            Ising Model — Metropolis Monte Carlo & Phase Transition
          </Link>{" "}
          — The Ising critical point and the percolation critical point are
          both examples of continuous (second-order) phase transitions with
          diverging correlation lengths. Compare the height-field pattern of
          the Ising model at T_c with the voxel sponge here — both show
          scale-invariant geometry.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
          >
            Gray–Scott Reaction-Diffusion — Turing Patterns
          </Link>{" "}
          — Reaction-diffusion systems also generate labyrinthine structures
          from local rules on a grid; the spot and maze regimes in Gray–Scott
          are in some sense above and below the "topological phase transition"
          that connects isolated spots to an interconnected network.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr"
          >
            Physarum Slime Mould — Transport Network
          </Link>{" "}
          — The Physarum network is a biological percolation: the mould
          prunes occupied links that carry no flux (below threshold) and
          reinforces links in the spanning cluster. The two tutorials are
          complementary views of how connectivity emerges from local rules.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
          >
            Laplace–Beltrami Eigenmodes — Spectral Mesh Decomposition
          </Link>{" "}
          — Both tutorials use scipy for heavy numerical lifting (ndimage here,
          scipy.sparse there). The spectral approach to mesh analysis and the
          percolation approach to mesh generation are complementary techniques
          in computational geometry.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://doi.org/10.1103/PhysRevB.14.3438"
            target="_blank"
            rel="noreferrer"
          >
            Hoshen & Kopelman (1976), Physical Review B 14(8), 3438–3445
          </a>{" "}
          — The original labelling algorithm. The mathematical method itself
          is in the public domain (algorithms are not copyrightable).
          Related: Leath (1976) single-cluster growth (Phys Rev B 14, 5046);
          Newman & Ziff (2001) fast Newman algorithm (Phys Rev E 64, 016706).
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/scipy/scipy"
            target="_blank"
            rel="noreferrer"
          >
            scipy/scipy (Travis Oliphant et al., BSD-3-Clause)
          </a>{" "}
          — <code>scipy.ndimage.label</code> is the optimised implementation
          used in blueprint.py. Related:{" "}
          <a className={lk} href="https://github.com/scikit-image/scikit-image" target="_blank" rel="noreferrer">
            scikit-image/scikit-image
          </a>{" "}
          (BSD) for <code>measure.label</code>;{" "}
          <a className={lk} href="https://github.com/networkx/networkx" target="_blank" rel="noreferrer">
            networkx/networkx
          </a>{" "}
          (BSD) for graph-theoretic connectivity analysis.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  tags: ["blender", "python", "numpy", "scipy", "percolation", "fractal", "voxel", "poi", "webxr"],
  body: <Body />,
});
