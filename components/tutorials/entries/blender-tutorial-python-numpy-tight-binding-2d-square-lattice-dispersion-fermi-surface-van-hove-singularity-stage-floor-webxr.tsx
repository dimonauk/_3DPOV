import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-tight-binding-2d-square-lattice-dispersion-fermi-surface-van-hove-singularity-stage-floor-webxr";

const TITLE =
  "Python numpy — 2-D Tight-Binding Band Dispersion Square Lattice: " +
  "E(k)=−2t[cos kx+cos ky]−4t′cos(kx)cos(ky) " +
  "First Brillouin Zone [−π,π]² 128×128 Height Field " +
  "Van Hove Singularity X=(π,0) Log-Divergent DOS " +
  "Basis(t=1,t′=0)/SK_NNN(t′=−0.3 Cuprate)/SK_TriLattice(Hexagonal FS)/SK_DWave(|cos kx−cos ky|) " +
  "Shape Keys BandE FLOAT_COLOR Cobalt–Amber 16384V 16129Q " +
  "Bloch 1929 Slater-Koster 1954 Stage Floor WebXR (Blender 5.1)";

const LEDE =
  "The tight-binding model reduces an infinite crystal to a single cosine: " +
  "E(kx,ky)=−2t[cos kx+cos ky], evaluated over the first Brillouin zone [−π,π]². " +
  "This blueprint bakes four chemically distinct band structures — square lattice, " +
  "cuprate next-nearest-neighbour model, triangular lattice, and d-wave superconducting " +
  "gap — as shape-key morphs on a faceted 128×128 stage-floor height field. " +
  "The flat basin at E=0 in the Basis shape is the Fermi surface of a half-filled " +
  "square lattice; the four-fold saddle at X=(π,0) is the Van Hove singularity " +
  "where the density of states diverges logarithmically.";

function Body() {
  return (
    <>
      <p>
        Two earlier floors in this library approach band structure from the
        symmetry side.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
        >
          The Brillouin-zone tutorial
        </Link>{" "}
        constructs the reciprocal-space cell itself — the Wigner-Seitz cell of
        the reciprocal lattice — using a 3-D Voronoi diagram.  This entry fills
        that cell with physics: the actual electron energies E(kx,ky) that a
        solid-state band-structure calculation would place at every k-point.
      </p>

      <h2>From atoms to cosines: Bloch&apos;s theorem and nearest-neighbour hopping</h2>
      <p>
        Felix Bloch showed in 1929 that an electron in a periodic potential
        has wavefunctions of the form ψ(r)=e^{"{"}ik·r{"}"} u_k(r), where u_k shares
        the crystal periodicity.  Slater and Koster (1954) then gave a
        systematic recipe for evaluating the overlap integrals between
        atomic orbitals on neighbouring sites — the tight-binding method.
        For a single s-orbital on a square lattice with lattice constant a=1,
        only the four nearest neighbours contribute at leading order, and
        their combined overlap integral is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`E(kx, ky) = ε₀ − 2t[cos(kx·a) + cos(ky·a)]`}
      </pre>
      <p>
        Setting ε₀=0 and a=1, this is the Basis shape key.  The hopping
        integral t=1 eV sets the energy scale.  The band runs from −4t at
        Γ=(0,0) to +4t at M=(π,π), with the Fermi level of a half-filled
        band (one electron per site) sitting exactly at E=0.
      </p>

      <h2>Van Hove singularity at X=(π,0)</h2>
      <p>
        The density of states (DOS) is the number of k-states per unit energy:
        g(E)=∫ δ(E−E(k)) d²k/(2π)².  At a saddle point of E(k), where ∇_k E=0
        but the Hessian has one positive and one negative eigenvalue, the
        contours of constant energy switch topology from closed electron-like
        pockets to closed hole-like pockets.  Van Hove (1953) showed that in
        2-D, such a saddle produces a logarithmic divergence in g(E).
      </p>
      <p>
        For the square lattice, ∇_k E = (2t sin kx, 2t sin ky).  This vanishes
        at the four corners of the BZ — Γ, M — and at the two edge-centre
        points X=(π,0) and X′=(0,π).  At X, the second derivatives are
        ∂²E/∂kx²=+2t (bowl, positive curvature) and ∂²E/∂ky²=−2t (ridge,
        negative curvature), confirming a saddle.  The floor shape shows this
        directly: looking at the Basis height field, X and X′ are flat
        inflection points surrounded by a cobalt valley and an amber ridge.
      </p>
      <p>
        The Van Hove singularity at E=0 is the microscopic origin of the
        nesting instability in cuprate superconductors: the square Fermi
        surface can be mapped onto itself by the antiferromagnetic wave
        vector Q=(π,π), connecting the hot spots near X with those near X′.
        This nesting drives the antiferromagnetic order observed at half-filling
        in parent compounds such as La₂CuO₄.
      </p>

      <h2>Shape keys: four band structures</h2>
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-1 pr-4">Key</th>
            <th className="text-left py-1 pr-4">Model</th>
            <th className="text-left py-1">Physics</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">Basis</td>
            <td className="py-1 pr-4">Square NN, t′=0</td>
            <td className="py-1">Particle-hole symmetric; flat E=0 basin; saddle at X</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_NNN</td>
            <td className="py-1 pr-4">Add t′=−0.3t</td>
            <td className="py-1">Next-nearest hopping; breaks PH symmetry; cuprate CuO₂ model</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_TriLattice</td>
            <td className="py-1 pr-4">Triangular NN</td>
            <td className="py-1">Six-fold saddle; geometrical frustration; hexagonal FS</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-mono">SK_DWave</td>
            <td className="py-1 pr-4">|cos kx − cos ky|</td>
            <td className="py-1">d-wave gap function; nodal lines at kx=±ky; four-lobe symmetry</td>
          </tr>
        </tbody>
      </table>

      <h2>Next-nearest-neighbour hopping and the cuprate model</h2>
      <p>
        The SK_NNN key adds −4t′cos(kx)cos(ky) to the dispersion.  For t′=−0.3t,
        this is the minimal model for CuO₂ planes in cuprate superconductors such
        as Bi₂Sr₂CaCu₂O₈.  The effect is to push the band bottom (Γ) down and
        tilt the saddle point away from E=0, breaking particle-hole symmetry.
        The Fermi surface for slight electron doping shifts the square sheet to a
        rounded diamond, removing the perfect nesting of the parent compound.
        This is why overdoped cuprates lose antiferromagnetism but can still
        superconduct — the nesting instability is suppressed before
        superconductivity is.
      </p>

      <h2>Triangular lattice and geometrical frustration</h2>
      <p>
        On a triangular lattice, each site has six nearest neighbours with bond
        vectors (1,0), (½,√3/2), and (−½,√3/2) (and their negatives).  The
        dispersion E=−2t[cos kx+cos ky+cos(kx−ky)] has the periodicity of the
        hexagonal reciprocal lattice.  At half-filling the Fermi surface is a
        regular hexagon, and the six saddle points sit at the M-points of the
        hexagonal BZ.  The resulting floor shape shows six curved ridges
        meeting at the zone boundary rather than the four-corner pattern of the
        square lattice.
      </p>
      <p>
        Geometrical frustration in the triangular-lattice Heisenberg
        antiferromagnet — the inability of all three bonds around a triangular
        plaquette to be simultaneously antiparallel — is visible in this
        dispersion: the band maximum shifts from the BZ corner to the BZ edge
        midpoint compared with the square lattice, reflecting the change from
        bipartite to frustrated topology.  The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr"
        >
          Penrose quasicrystal floor
        </Link>{" "}
        in this library explores the extreme case: a lattice with no translational
        symmetry at all, where conventional Bloch bands do not apply.
      </p>

      <h2>D-wave superconducting gap</h2>
      <p>
        The SK_DWave shape key shows not the dispersion but the amplitude of the
        d_{"{"}x²−y²{"}"} superconducting gap: Δ(k)=Δ₀|cos kx−cos ky|.  This gap
        function has B₁g symmetry under the C₄ group of the square lattice.  It
        vanishes on the nodal lines kx=±ky and reaches its maximum at the
        X-points — exactly where the Van Hove singularity concentrates spectral
        weight.  The four-lobe height field is the momentum-space fingerprint of
        cuprate superconductivity confirmed by ARPES and phase-sensitive
        tunnelling experiments from the 1990s onward.
      </p>

      <h2>Building the height field in Blender 5.1</h2>
      <p>
        The blueprint evaluates all four band functions with NumPy on a
        128×128 grid (16 384 vertices, 16 129 quads) using endpoint=False to
        preserve the periodic boundary — k=−π and k=+π are the same point in
        the BZ.  The Basis energy sets the mesh Z-heights; the other three
        become shape keys whose vertex positions encode their respective Z-arrays.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`k1 = np.linspace(-np.pi, np.pi, 128, endpoint=False)
KX, KY = np.meshgrid(k1, k1, indexing='ij')
E_basis = -2.0*(np.cos(KX) + np.cos(KY))   # Basis
E_nnn   = E_basis - 4.0*(-0.3)*np.cos(KX)*np.cos(KY)  # SK_NNN
E_tri   = -2.0*(np.cos(KX)+np.cos(KY)+np.cos(KX-KY))  # SK_TriLattice
E_dw    = np.abs(np.cos(KX) - np.cos(KY))  # SK_DWave`}
      </pre>
      <p>
        Each energy array is normalised so max|E|=HEIGHT_SCALE=0.55 m, keeping
        all shape keys on the same vertical scale in Blender.  The BandE colour
        attribute is a FLOAT_COLOR on the POINT domain, interpolated linearly
        from cobalt (0.030, 0.200, 0.780) at the band bottom to amber (0.980,
        0.620, 0.050) at the band top using the Basis energy for colour even when
        the shape keys morph.  All polygons are flat-shaded (use_smooth=False)
        for the faceted stage-floor aesthetic.
      </p>

      <h2>Material: BandE attribute driving emission</h2>
      <p>
        The node tree reads the BandE colour attribute and splits it across a
        Principled BSDF (metallic=0.60, roughness=0.18) and an Emission node
        (strength=1.6), blended 35/65 through a Mix Shader.  In Material
        Preview, the floor glows cobalt-to-amber from the band bottom to the
        top; in the WebXR viewer the emission component produces a subtle
        self-illumination that reads clearly at low ambient light levels.  The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
        >
          Bloch sphere tutorial
        </Link>{" "}
        uses the same cobalt-amber palette to encode the quantum state
        amplitude — a deliberate visual consistency across the quantum-mechanics
        entries in this library.
      </p>

      <h2>WebXR export settings</h2>
      <p>
        File → Export → glTF 2.0.  Enable: Draco compression level 6, WebP
        textures, morph targets (shape keys), vertex colours, Up Axis=+Y.  The
        +Y-up transform is applied before export via a π/2 rotation of the mesh
        data in Blender&apos;s X axis:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`import mathutils
rot = mathutils.Matrix.Rotation(1.5707963, 4, 'X')
obj.data.transform(rot)`}
      </pre>
      <p>
        The root object carries custom properties{" "}
        <code>holoflow:facet=True</code> and{" "}
        <code>holoflow:category=stage-floor</code> for the holoflow renderer to
        identify it as a planar surface.
      </p>

      <h2>Sources and attribution</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          Bloch F (1929) &ldquo;Über die Quantenmechanik der Elektronen in
          Kristallgittern.&rdquo; <em>Z. Phys.</em> 52:555-600.{" "}
          <a
            className={lk}
            href="https://link.springer.com/article/10.1007/BF01339455"
            target="_blank"
            rel="noopener noreferrer"
          >
            link.springer.com
          </a>
          .  Bloch&apos;s theorem and the tight-binding energy bands.  Published
          1929, public domain.
        </li>
        <li>
          Slater JC &amp; Koster GF (1954) &ldquo;Simplified LCAO Method for
          the Periodic Potential Problem.&rdquo; <em>Phys. Rev.</em> 94:1498.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1103/PhysRev.94.1498"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi.org/10.1103/PhysRev.94.1498
          </a>
          .  The Slater-Koster two-centre integral tables that underpin
          all empirical tight-binding calculations.  Published 1954, public
          domain.
        </li>
        <li>
          Harris CR et al. (2020) &ldquo;Array programming with NumPy.&rdquo;{" "}
          <em>Nature</em> 585:357-362. BSD-3-Clause.{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
          {" "}·{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
        <li>
          Van Hove L (1953) &ldquo;The Occurrence of Singularities in the
          Elastic Frequency Distribution of a Crystal.&rdquo;{" "}
          <em>Phys. Rev.</em> 89:1189.  Public domain.  Derivation of the
          logarithmic DOS singularity at a 2-D saddle point.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  tags: [
    "blender",
    "python",
    "numpy",
    "tight-binding",
    "band-structure",
    "brillouin-zone",
    "van-hove",
    "fermi-surface",
    "condensed-matter",
    "d-wave",
    "cuprate",
    "stage-floor",
    "shape-keys",
    "scripting",
    "webxr",
  ],
  date: "2026-09-06",
  body: Body,
});
