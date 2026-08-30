import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>Order from chemistry: the Brusselator</h2>
      <p>
        In 1968 Ilya Prigogine and René Lefever at the Université Libre de
        Bruxelles published a deceptively simple pair of ordinary differential
        equations and called the spatial extension of their model the
        &ldquo;Brusselator.&rdquo; The equations described a trimolecular
        chemical oscillator — a reaction that spontaneously breaks spatial
        uniformity and forms stable, repeating structures. Prigogine received
        the Nobel Prize in Chemistry nine years later, specifically for the
        theory of <em>dissipative structures</em>: patterns maintained far
        from thermodynamic equilibrium by a steady throughput of energy and
        matter. The Brusselator is the paradigm.
      </p>
      <p>
        This tutorial integrates those equations numerically on an 80&times;80
        periodic grid in Blender 5.1&rsquo;s Python scripting workspace, then
        lifts the activator concentration into a stage-floor height field and
        paints it with a cobalt&ndash;amber vertex colour. Four shape keys walk
        through the phase diagram: labyrinthine Turing stripes, a hexagonal
        spot array, a Hopf temporal oscillation frozen mid-cycle, and a
        shorter-wavelength dense labyrinth.
      </p>

      <h2>The Brusselator equations</h2>
      <p>
        The two variables U (activator, slow diffuser) and V (inhibitor, fast
        diffuser) satisfy:
      </p>
      <pre>{`∂U/∂t = D_u·∇²U  +  A  −  (B+1)U  +  U²V
∂V/∂t = D_v·∇²V  +  BU  −  U²V`}</pre>
      <p>
        Each term has a transparent chemical origin. In the U equation:
        A is a constant source (&ldquo;feed&rdquo;); −(B+1)U covers first-order
        decay and the step B+U→V+C that removes U while creating V; +U²V is the
        trimolecular autocatalytic step 2U+V→3U that creates a third U molecule
        from every U²V collision. In the V equation: +BU generates V from U at
        rate B; −U²V is the same autocatalytic step consuming V. The
        &ldquo;U²V&rdquo; term distinguishes the Brusselator from Gray-Scott
        (which uses UV²): the trimolecular form requires three-body collisions,
        which are kinetically unusual but mathematically tractable.
      </p>

      <h2>Steady state and the Jacobian</h2>
      <p>
        The spatially uniform steady state is U* = A, V* = B/A. Linearising
        around it gives the Jacobian:
      </p>
      <pre>{`J = [[B−1,   A²],
     [−B,   −A²]]`}</pre>
      <p>
        The trace tr(J) = B − 1 − A² is negative when B &lt; 1 + A² (the
        steady state is stable without diffusion). When B crosses 1 + A², the
        trace goes positive and a limit cycle appears — a <em>Hopf
        bifurcation</em>. The determinant det(J) = A² is always positive, so
        the bifurcation is always a Hopf (never a saddle-node). The
        SK_Hopf shape key uses B = 2.5 with A = 1, so B &gt; 1 + A² = 2 and
        the system is already past the Hopf threshold; frozen at the end of
        integration it captures a snapshot of the oscillation cycle.
      </p>

      <h2>Turing instability conditions</h2>
      <p>
        Turing instability (spatial pattern) requires diffusion to
        destabilise a homogeneous state that is stable without diffusion.
        Three simultaneous conditions must hold:
      </p>
      <pre>{`1.  B < 1 + A²                              ← SS stable (tr J < 0)
2.  D_v(B−1) − D_u·A² > 0                  ← fast inhibitor breaks symmetry
3.  (D_v(B−1) − D_u·A²)² > 4·D_u·D_v·A²  ← discriminant → h(k²) < 0`}</pre>
      <p>
        When condition 3 holds, there exists a band of wavenumbers k² ∈
        [k²₋, k²₊] for which perturbations grow. The fastest-growing
        wavenumber is:
      </p>
      <pre>{`k²_c = (D_v(B−1) − D_u·A²) / (2·D_u·D_v)`}</pre>
      <p>
        Pattern wavelength Λ_c = 2π/√k²_c sets the characteristic scale of
        the emerging spots or stripes. The four shape keys explore the (A, B,
        D_u, D_v) space:
      </p>
      <pre>{`Basis      A=2  B=3.8  D_u=1  D_v=8  k²_c≈1.15  Λ≈5.9 units  labyrinthine
SK_Spots   A=3  B=5.5  D_u=1  D_v=8  k²_c≈1.69  Λ≈4.8 units  hexagonal
SK_Hopf    A=1  B=2.5  D_u=1  D_v=1  B>1+A²=2   no Turing    temporal osc
SK_Dense   A=2  B=4.5  D_u=.5 D_v=8  k²_c≈3.25  Λ≈3.5 units  dense`}</pre>

      <h2>Why U²V, not UV²?</h2>
      <p>
        Gray-Scott uses UV² (an autocatalytic step U + 2V → 3V), so V
        autocatalyses itself. The Brusselator uses U²V (step 2U + V → 3U),
        so U autocatalyses itself by consuming V. Both produce Turing
        instability when D_v &gt; D_u, but the roles of activator and inhibitor
        are swapped, the steady state depends on A differently, and the Hopf
        threshold is B = 1 + A² rather than a feed-rate condition. A practical
        consequence: in the Brusselator you can tune the Hopf and Turing
        thresholds almost independently by choosing A and B separately, whereas
        Gray-Scott couples them tightly through the feed/kill ratio.
      </p>

      <h2>Numerical integration in Blender</h2>
      <p>
        The blueprint uses explicit Euler with a five-point finite-difference
        Laplacian on a periodic grid:
      </p>
      <pre>{`lU = (np.roll(U, 1, 0) + np.roll(U, -1, 0)
    + np.roll(U, 1, 1) + np.roll(U, -1, 1) - 4.0 * U)
U2V   = U * U * V                           # ← trimolecular, not UV²
U_new = U + DT * (D_u * lU + A - (B+1)*U + U2V)
V_new = V + DT * (D_v * lV + B*U - U2V)
U, V  = U_new.clip(0, None), V_new.clip(0, None)`}</pre>
      <p>
        Stability bound: DT &lt; DX² / (4·D_v). With DX = 1 (normalised),
        D_v = 8, limit ≈ 0.031. The blueprint uses DT = 0.002, giving a
        15× safety margin. 2 000 burn-in steps spread the initial random
        perturbation across the whole 80×80 grid; 5 000 main steps fully
        crystallise the pattern. Total wall-clock: roughly 15–40 s per shape
        key on a modern CPU (no SciPy required).
      </p>

      <h2>Height field and shape keys</h2>
      <p>
        Each pattern is normalised to [0, 1] independently before being
        written into vertex positions. This ensures consistent visual height
        across shape keys whose absolute U ranges differ (U* = A varies from
        1.0 to 3.0 across the four parameter sets). Shape keys are written
        via <code>foreach_set</code>, the bulk C-side bulk-write path that
        avoids the ~100× overhead of a Python vertex loop:
      </p>
      <pre>{`sk = ob.shape_key_add(name="SK_Spots", from_mix=False)
pos = np.column_stack([GX.ravel(), GY.ravel(), z_sk]).astype(np.float32)
sk.data.foreach_set("co", pos.ravel())   # float32 — Blender internal type`}</pre>

      <h2>Vertex colour and emission</h2>
      <p>
        The <code>FLOAT_COLOR POINT</code> attribute <code>Brussel_U</code>
        maps activator peaks (U high, cobalt 0.04,&thinsp;0.14,&thinsp;0.72)
        to troughs (amber 0.90,&thinsp;0.54,&thinsp;0.06). In the Principled
        BSDF material a <code>ShaderNodeAttribute</code> node feeds both
        Base&nbsp;Color and Emission&nbsp;Color at strength 1.6, so pattern
        ridges bloom cobalt against an amber ground in EEVEE&rsquo;s bloom
        pass.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr" className={lk}>
            Gray-Scott Reaction-Diffusion
          </Link>{" "}
          — the other canonical two-variable Turing system; uses UV² instead
          of U²V and a poi disc mesh rather than a stage floor.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr" className={lk}>
            Cahn-Hilliard Phase Separation
          </Link>{" "}
          — spinodal decomposition via a conserved-order-parameter PDE;
          shares the periodic Laplacian technique.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing" className={lk}>
            Geometry Nodes Reaction-Diffusion
          </Link>{" "}
          — the same Turing instability built inside a GN Simulation Zone
          node tree instead of a Python script.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr" className={lk}>
            Barkley Excitable Medium
          </Link>{" "}
          — spiral reentry waves on a sphere; Barkley&rsquo;s model shares
          the two-variable structure with the Brusselator.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Prigogine I &amp; Lefever R (1968)</strong>{" "}
          &ldquo;Symmetry Breaking Instabilities in Dissipative Systems.&rdquo;{" "}
          <em>J Chem Phys</em> <strong>48</strong>(4):1695–1700.{" "}
          <a
            href="https://doi.org/10.1063/1.1668896"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            doi:10.1063/1.1668896
          </a>
          . The founding Brusselator paper; equations are Public Domain.
          Related: Nicolis G &amp; Prigogine I (1977){" "}
          <em>Self-Organization in Non-Equilibrium Systems</em> (Wiley);
          Turing A M (1952) Proc R Soc B 237:37 (Public Domain) — the
          underlying instability mechanism.
        </li>
        <li>
          <strong>NumPy Developers</strong> — BSD-3-Clause —{" "}
          <a
            href="https://numpy.org/doc/stable/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            numpy.org/doc/stable
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            github.com/numpy/numpy
          </a>
          . Related: SciPy (BSD-3-Clause){" "}
          <a
            href="https://scipy.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            scipy.org
          </a>
          — <code>scipy.ndimage.laplace</code> is the scipy path for the
          same Laplacian stencil used in this blueprint.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Brusselator: Prigogine & Lefever 1968 J Chem Phys 48(4):1695 " +
    "∂U/∂t=D_u∇²U+A−(B+1)U+U²V ∂V/∂t=D_v∇²V+BU−U²V " +
    "Hopf B=1+A² Turing k²_c=(D_v(B−1)−D_u·A²)/(2D_uD_v) " +
    "Nobel Chemistry 1977 Dissipative Structures, " +
    "Basis(Labyrinthine)/SK_Spots(Hexagonal)/SK_Hopf(Temporal)/SK_Dense(Fine) " +
    "Shape Keys & Cobalt-Amber Brussel_U FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)",
  tags: [
    "blender", "scripting", "python", "numpy", "physics",
    "reaction-diffusion", "stage-floor", "webxr", "prigogine",
  ],
  date: "2026-08-30",
  blends: [
    {
      label: "blueprint",
      path: `public/library/blends/scripting/${SLUG.replace("blender-tutorial-", "")}/blueprint.py`,
    },
  ],
  body: Body,
});
