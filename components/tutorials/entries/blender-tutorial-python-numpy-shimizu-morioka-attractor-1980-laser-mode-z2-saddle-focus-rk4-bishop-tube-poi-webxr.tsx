import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Shimizu–Morioka Attractor (1980): ẋ=y ẏ=x−ay−xz ż=−bz+x² " +
  "Two-Mode Laser Z₂-Symmetric Butterfly, Constant Divergence ∇·F=−(a+b)=−1.175, " +
  "Saddle-Focus Wings P±=(±√b,0,1), λ₁≈+0.115 D_KY≈2.089, " +
  "Basis(a=0.375,b=0.800)/SK_LowA(a=0.200)/SK_HiA(a=0.600)/SK_LowB(b=0.500) " +
  "Shape Keys & Cobalt–Amber SM_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1980 Shimizu and Morioka distilled the physics of a two-mode semiconductor " +
  "laser into a five-term ODE: only three unknowns, one quadratic term, and yet a " +
  "full Lorenz-type butterfly with exact Z₂ symmetry — a pair of saddle-focus wings " +
  "joined at an unstable saddle at the origin.  This blueprint integrates 80 000 " +
  "RK4 steps at dt=0.015, carries a Bishop parallel-transport frame through " +
  "~3 000 thinned waypoints, and morphs four shape keys across the (a, b) " +
  "parameter family, from the canonical attractor to the threshold of the " +
  "Hopf bifurcation that stabilises the wings.";

function Body() {
  return (
    <>
      <p>
        The Lorenz butterfly required seven terms and physical reasoning about
        atmospheric convection.  Shimizu and Morioka asked a more surgical
        question: what is the smallest set of terms that can produce the same
        topological object — two symmetric scrolls connected by a central
        saddle — from the physics of a laser cavity?  The answer was five:
      </p>

      <h2>Equations and physical origin</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ =  y
ẏ =  x − a·y − x·z     (damped restoring force + multiplicative braking)
ż = −b·z + x²           (slow variable: x² drives it up, b relaxes it down)

Canonical: a = 0.375  b = 0.800

Physical reading:
  x  — amplitude difference between the two laser modes
  y  — rate of change of that difference
  z  — population inversion (slow compared to field dynamics)
  a  — cavity damping / loss coefficient
  b  — inversion relaxation rate`}
      </pre>
      <p>
        The term <code>x·z</code> in ẏ is the key coupling: when z is large
        (high inversion), it acts as a braking force that slows the field
        amplitude.  As x grows large and z charges up via <code>x²</code>,
        the braking overcomes the restoring term x, forcing the trajectory
        away from its current wing — exactly the switching mechanism of the
        Lorenz butterfly, but derived from laser optics rather than fluid
        convection.
      </p>

      <h2>Constant divergence</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = 0    ∂ẏ/∂y = −a    ∂ż/∂z = −b
∇·F = −(a + b) = −1.175   (constant — position-independent contraction)

Liouville identity:
  λ₁ + λ₂ + λ₃  ≈  +0.115 + 0.000 − 1.290  =  −1.175  =  ∇·F  ✓
Kaplan–Yorke dimension:  D_KY = 2 + λ₁/|λ₃| ≈ 2.089`}
      </pre>
      <p>
        The ẋ equation contributes nothing to the divergence (ẋ = y has no x
        dependence), so the contraction comes entirely from the linear
        self-damping in ẏ (rate a) and the z-decay in ż (rate b).  This is
        simpler than Lorenz — whose divergence is also constant — but the
        contraction is weaker and the Lyapunov time correspondingly longer.
      </p>

      <h2>Equilibria: the origin saddle and the two saddle-focus wings</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Origin O = (0, 0, 0):
  J|_O  block-diagonal: [[0,1],[1,−a]] ⊕ [−b]
  λ_O1 ≈ +0.830  (unstable — the separatrix that forces wing switching)
  λ_O2 ≈ −1.205  (stable)
  λ_O3  =  −0.800 = −b  (stable)

Symmetric wings P± = (±√b, 0, 1) = (±0.8944, 0, 1):
  Characteristic polynomial: λ³ + (a+b)λ² + ab·λ + 2b = 0
  Roots (a=0.375, b=0.800):
    λ_real    ≈ −1.610           (stable — the wing's contracting manifold)
    λ_complex ≈ +0.2175 ± 0.977i (UNSTABLE saddle-focus pair)

Hopf boundary: P± stabilise when  2 = a(a+b) → a_Hopf ≈ 1.070  (for b=0.8)
Above a_Hopf, the strange attractor disappears and P± become stable foci.`}
      </pre>
      <p>
        The origin is a plain saddle: one positive eigenvalue (+0.830) drives
        trajectories away along the x-axis.  This unstable manifold is what
        connects the two wings — trajectories that get close to the origin are
        flung toward whichever wing their x sign points to.  The wing
        equilibria P± are saddle-foci: the single stable real eigenvalue (−1.61)
        pulls trajectories in along the slow z direction, while the unstable
        complex pair (+0.22 ± 0.98i) makes them spiral outward in the x–y plane.
        The combination forces a continuous outward spiral that eventually passes
        close to the origin and switches wings.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Rössler attractor
        </Link>
        , which has a single scroll and a true Shilnikov homoclinic orbit (σ/|ν| &gt; 1),
        or the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Shaw attractor
        </Link>
        , which shares the two-scroll Z₂ topology but arrives at it from an
        information-theoretic rather than physical derivation.
      </p>

      <h2>Z₂ symmetry</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Symmetry map S: (x, y, z) → (−x, −y, z)

Verify term by term:
  S·ẋ = S·y = −y = ẋ(−x,−y,z)           ✓
  S·ẏ = S·(x−ay−xz) = −x+ay+xz = ẏ(−x,−y,z)  ✓
  S·ż = S·(−bz+x²) = −bz+(−x)² = ż(−x,−y,z)  ✓  (x² is even)`}
      </pre>
      <p>
        The two wings are exact mirror images.  S maps P+ to P− and vice versa.
        The orbit you are building is Z₂-symmetric in the sense that the full
        attractor set (not necessarily any single trajectory) is invariant under S.
        This is the same symmetry as Lorenz, and differs from{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Halvorsen's C₃ cyclic symmetry
        </Link>{" "}
        or the full C₃ of Thomas' labyrinth.
      </p>

      <h2>Bishop parallel-transport framing</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`For each consecutive tangent pair T[i-1], T[i]:
  axis   = cross(T[i-1], T[i])
  sin_a  = |axis|
  cos_a  = clip(dot(T[i-1], T[i]), −1, 1)
  if sin_a < 1e-10:  N[i] = N[i-1]   (straight segment — no rotation)
  else:
    ax   = axis / sin_a
    N[i] = cos_a·N[i-1] + sin_a·cross(ax, N[i-1]) + (1−cos_a)·dot(ax,N[i-1])·ax
  B[i] = cross(T[i], N[i])

Tube vertex at ring i, spoke j:
  v = pts[i] + radius·(cos(θⱼ)·N[i] + sin(θⱼ)·B[i])
  θⱼ = j·2π/8,  j = 0…7`}
      </pre>
      <p>
        This is an open curve (the Shimizu–Morioka attractor is not periodic),
        so no holonomy correction is needed at the end.  The tube is twist-free
        by construction, which matters here: near the origin saddle, the
        trajectory straightens out and then sharply bends as it crosses — a
        Frenet frame would produce a twist spike there, while Bishop propagates
        smoothly through.  The same Bishop frame is described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Chen attractor tutorial
        </Link>
        .
      </p>

      <h2>Shape keys: exploring (a, b) parameter space</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   a=0.375, b=0.800   canonical butterfly attractor
SK_LowA a=0.200, b=0.800   lower damping → wider orbit, slower saddle crossing
SK_HiA  a=0.600, b=0.800   higher damping, approaching Hopf at a≈1.07
SK_LowB a=0.375, b=0.500   slower z-relaxation; P± shift to (±0.707, 0, 1)

Each key is fully reintegrated at the new parameters, then centred, scaled,
and fitted to the same Bishop-tube vertex topology as the Basis mesh.`}
      </pre>
      <p>
        SK_LowA is particularly interesting to scrub slowly: because the
        unstable complex eigenvalues at P± have a smaller real part (closer to
        zero), the trajectory spends longer spiralling around each wing before
        being kicked across — the cobalt slow-speed colour spreads further
        into each wing&apos;s outer loops.  SK_HiA shows the complementary
        effect: stronger damping concentrates the orbit tightly around each
        wing and shortens the switching passages.
      </p>
      <p>
        SK_LowB relocates the equilibria: since P± = (±√b, 0, 1), decreasing b
        from 0.8 to 0.5 moves the wing centres from x = ±0.894 to x = ±0.707,
        making the two wings appear to draw inward.  Simultaneously the weaker
        z-damping allows the z variable to reach higher values before decaying,
        so the orbit extends further upward in z — the poi head elongates.
      </p>

      <h2>Colour attribute: SM_Speed</h2>
      <p>
        Each ring of the tube takes the orbital speed |F(x,y,z)| at its
        corresponding waypoint.  The 1st and 99th percentiles clamp the colour
        range, preventing the dramatic but brief slowdown near the origin
        saddle from washing out the rest of the gradient.  Cobalt (slow) appears
        in the outer wing loops where the trajectory decelerates before each
        crossing; amber (fast) marks the saddle-crossing passages themselves,
        though these are short — visually you will see amber concentrated in the
        narrow corridor at the centre of the butterfly.  Compare with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr"
          className={lk}
        >
          Chua&apos;s circuit
        </Link>
        , where the piecewise-linear nonlinearity creates sharper speed
        discontinuities that make the colour pattern more abrupt.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1. Define the ODE — three lines
def _deriv(xyz, a, b):
    x, y, z = xyz
    return np.array([y, x - a*y - x*z, -b*z + x*x])

# 2. RK4 step — standard four-stage
def _rk4_step(xyz, a, b, dt):
    k1 = _deriv(xyz,            a, b)
    k2 = _deriv(xyz + 0.5*dt*k1, a, b)
    k3 = _deriv(xyz + 0.5*dt*k2, a, b)
    k4 = _deriv(xyz +     dt*k3, a, b)
    return xyz + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)

# 3. Integrate: 3000 burn-in, 80000 steps, keep every 27th → ~2963 pts
pts, speeds = integrate(A_BASIS, B_BASIS)

# 4. Bishop frames — twist-free framing of an open curve
T, N, B = bishop_frames(pts)

# 5. Tube mesh — octagonal cross-section quads
verts, faces = build_tube(pts, N, B, radius=0.042, segs=8)

# 6. FLOAT_COLOR — cobalt→amber speed gradient
colours = make_color_array(speeds, segs=8, cobalt=COBALT, amber=AMBER)

# 7. bpy assembly — bmesh, color_attributes, shape keys, material
# 8. Holoflow metadata + +Y-up rotation + transform_apply`}
      </pre>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Shimizu T &amp; Morioka N (1980)</strong> — &ldquo;On the
          bifurcation of a symmetric limit cycle to an asymmetric one in a simple
          model,&rdquo; <em>Physics Letters A</em> 76(3–4):201–204.{" "}
          <a
            href="https://doi.org/10.1016/0375-9601(80)90466-1"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI 10.1016/0375-9601(80)90466-1
          </a>{" "}
          — equations and physical interpretation in the public domain.  Related:
          the same research group published work on laser instabilities in the
          same journal in subsequent years.
        </li>
        <li>
          <strong>Sprott JC (2010)</strong> — <em>Elegant Chaos: Algebraically
          Simple Chaotic Flows</em>, World Scientific ISBN 978-981-283-881-0.
          MIT companion C code:{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/elegantchaos.htm
          </a>
          . Related:{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott&apos;s chaos taxonomy table
          </a>{" "}
          catalogues the Shimizu–Morioka system alongside other minimal-complexity attractors.
        </li>
        <li>
          <strong>NumPy Developers</strong> — NumPy, BSD-3-Clause.{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          /{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Mesh appears as a single dot or is invisible</strong> — the
          integration diverged.  Check that <code>A_BASIS = 0.375</code> and
          <code>B_BASIS = 0.800</code> are set; the system blows up for b ≤ 0 or
          very large a.
        </li>
        <li>
          <strong>Colour attribute all grey in viewport</strong> — switch the
          Workbench colour mode from &ldquo;Material&rdquo; to &ldquo;Vertex
          Colour&rdquo;, or in the Shader Editor verify that the ShaderNodeAttribute
          node has <code>attribute_name = &quot;SM_Speed&quot;</code>.
        </li>
        <li>
          <strong>Shape keys do not deform the mesh visibly</strong> — each key
          is fully reintegrated; if the parameter is near the canonical value the
          deformation will be subtle.  SK_LowA (a=0.200) gives the most dramatic
          visual change.
        </li>
        <li>
          <strong>GLB export missing morph targets</strong> — ensure
          <code>export_morph_targets=True</code> in the GLB exporter panel.  Also
          verify <code>export_colors=True</code> to include SM_Speed.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  topics: ["blender", "scripting", "chaos", "physics", "webxr"],
  body: Body,
});
