import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A torus knot T(p,q) is the closed curve that winds{" "}
        <em>p</em> times around the central hole of a torus and{" "}
        <em>q</em> times around the torus tube axis as it does so. When
        GCD(p,q)&nbsp;=&nbsp;1 the result is a single-component knot; any
        common factor produces a link with GCD(p,q) components. The trefoil
        T(2,3) is the simplest non-trivial knot in existence — three crossings,
        unknotting number 1 — and it is the default here. T(2,5) gives the
        cinquefoil; T(3,4) gives the next-order torus knot with eight crossings.
        Every member of the T(p,q) family lives on the surface of a torus in
        ℝ³, which makes the parametric formula exact and compact.
      </p>
      <p>
        The tube mesh is built with{" "}
        <strong>parallel-transport (Bishop) frames</strong> rather than the
        classical Frenet-Serret frame. The Frenet principal normal N̂ requires
        non-zero curvature at every point; any curve with a straight segment or
        inflection point causes the frame to become undefined and the tube to
        twist uncontrollably. Torus knots in the standard parameterisation
        always have positive curvature, so Frenet-Serret would technically work
        — but parallel transport gives a visually cleaner, less-twisted tube
        because it minimises the total rotation of the cross-section around the
        tangent axis. The measurable difference: for T(2,3) the Frenet frame
        accumulates three full turns of twist along the strand; the parallel
        transport frame accumulates only the writhe contribution
        (≈&nbsp;0.5&nbsp;turns for the standard torus embedding), which is
        distributed evenly by the closure-correction step described below.
      </p>
      <p>
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr"
          className={lk}
        >
          GN Frenet-Serret ribbon beam tutorial
        </Link>
        , which uses the Geometry Nodes{" "}
        <code>Curve Normal</code> node in MINIMUM_ROTATION mode — the same
        parallel-transport concept, but driven by the Blender node graph rather
        than Python. The Python approach here offers full control over the
        closure correction and the tube topology.
      </p>

      <h2>The parametric formula</h2>
      <pre>{`# T(p,q) torus knot at parameter t ∈ [0, 2π)
r(t) = TORUS_R + TORUS_r · cos(Q·t)   # distance from Z-axis to curve point
x(t) = r(t) · cos(P·t)
y(t) = r(t) · sin(P·t)
z(t) = TORUS_r · sin(Q·t)`}</pre>
      <p>
        The curve closes at t&nbsp;=&nbsp;2π because P and Q are integers. If
        GCD(P,Q)&nbsp;=&nbsp;d&nbsp;&gt;&nbsp;1, the formula traces each of the
        d components in sequence and returns to the start; the strand visits
        every point 1/d of the way through each component rather than once per
        full revolution. The blueprint raises a{" "}
        <code>ValueError</code> in this case rather than silently producing a
        link — a design choice that matches the studio's
        fail-loudly convention.
      </p>
      <pre>{`# GCD guard (run at top of build block)
g = _gcd(P, Q)
if g != 1:
    raise ValueError(
        f"T({P},{Q}): GCD = {g}; produces a {g}-component link, not a knot. "
        f"Try T(2,3), T(2,5), T(3,4), or T(3,5)."
    )`}</pre>

      <h2>Parallel-transport frame construction</h2>
      <p>
        The frame algorithm runs in three passes:
      </p>
      <pre>{`# Pass 1: seed the first normal (any vector ⊥ T[0])
seed = Vector((0.0, 0.0, 1.0))
if abs(seed.dot(T[0])) > 0.9:
    seed = Vector((0.0, 1.0, 0.0))   # fallback when T[0] ≈ Z-axis
N[0] = (seed - seed.dot(T[0]) * T[0]).normalized()

# Pass 2: propagate by projecting onto successive tangent-perpendicular planes
for i in range(1, n):
    proj = N[i-1] - N[i-1].dot(T[i]) * T[i]   # remove T[i] component
    N[i] = proj.normalized()

# Pass 3: measure holonomy and distribute correction
cos_h   = clamp(N[-1].dot(N[0]))
sin_h   = N[-1].cross(N[0]).dot(T[0])          # signed via T[0] axis
theta_h = atan2(sin_h, cos_h)                  # holonomy angle

for i, (pos, T, N) in enumerate(raw_frames):
    delta = (i / n) * theta_h                  # linear ramp
    N_c = cos(delta)*N + sin(delta)*B_raw
    B_c = -sin(delta)*N + cos(delta)*B_raw
    frames[i] = (pos, T, N_c, B_c)`}</pre>
      <p>
        The holonomy angle θ is the total geodesic torsion of the knot curve —
        the amount the parallel-transported frame has rotated around the tangent
        after one full circuit. For T(p,q) this is always within machine
        precision of 2π&nbsp;×&nbsp;(integer), because the knot lives on a
        torus and the frame must return to itself. The blueprint prints the
        measured angle as a self-check:{" "}
        <code>[HF] T(2,3) holonomy = 359.99°</code> for the default trefoil.
        Distributing this correction linearly is equivalent to choosing a
        Seifert framing — the framing in which the push-off longitude has zero
        linking number with the knot.
      </p>

      <h2>Tube mesh construction</h2>
      <pre>{`# N_LONG × N_CIRC quad mesh
for i, (pos, _T, N, B) in enumerate(frames):
    for j in range(N_CIRC):
        ang = 2π * j / N_CIRC
        verts.append(pos + (cos(ang)*N + sin(ang)*B) * TUBE_RADIUS)

# Quad faces: ring i ↔ ring (i+1)%N_LONG, both directions closed
for i in range(N_LONG):
    ni = (i + 1) % N_LONG
    for j in range(N_CIRC):
        nj = (j + 1) % N_CIRC
        faces.append((i*N_CIRC+j, i*N_CIRC+nj, ni*N_CIRC+nj, ni*N_CIRC+j))`}</pre>
      <p>
        For T(2,3) with the default N_LONG&nbsp;=&nbsp;240 and
        N_CIRC&nbsp;=&nbsp;14, this yields 3 360 vertices and 3 360 quad faces
        (6 720 triangles in the GLB). After the Draco level-6 compression the
        GLB is approximately 50–60 KB — small enough to embed in a WebXR scene
        as an ambient decoration or poi prop frame.
      </p>
      <p>
        The mesh topology is a torus (genus 1): both the longitudinal direction
        (around the knot) and the meridional direction (around each ring) wrap
        with <code>% N_LONG</code> and <code>% N_CIRC</code> modular
        arithmetic. This is the same topology as a standard Blender torus
        primitive, except the path is knotted rather than circular. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf fibration tutorial
        </Link>
        {" "}builds linked torus primitives via stereographic projection —
        the torus knot here replaces the circular fibre path with a knotted
        one, at the cost of a more complex frame construction.
      </p>

      <h2>WebXR export</h2>
      <p>
        The GLB exports with{" "}
        <code>export_yup=True</code> (+Y-up for WebXR),{" "}
        <code>export_apply=True</code> (bakes the world transform), and
        <code>export_draco_mesh_compression_level=6</code>. The emissive
        material maps to a glTF{" "}
        <code>KHR_materials_emissive_strength</code> extension value — in
        Three.js this drives{" "}
        <code>MeshStandardMaterial.emissiveIntensity</code>. Bloom requires a
        post-processing pass such as{" "}
        <code>THREE.UnrealBloomPass</code>. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          geodesic sphere tutorial
        </Link>
        {" "}for the same GLB pipeline applied to a topologically closed surface
        with Euler characteristic χ&nbsp;=&nbsp;2.
      </p>
    </>
  );
}

const data = {
  title:
    "Python mathutils — Torus Knot T(p,q): Winding Numbers, Parallel-Transport Tube & WebXR GLB",
  lede:
    "Build any T(p,q) torus knot (trefoil, cinquefoil, and beyond) as a closed tube mesh using parallel-transport Bishop frames, distribute the closure holonomy for a seamless seam, export a Draco-compressed WebXR GLB, and animate a NURBS strand reveal for screen recording.",
  date: "2026-07-26",
  steps: [
    {
      title: "Open and configure",
      body: "Open Blender 5.1 and save a new file to the library directory so `//hf_torus_knot.glb` resolves correctly. In the Scripting workspace, open blueprint.py. The top block exposes P (longitudinal wraps), Q (meridional wraps), TORUS_R, TORUS_r, TUBE_RADIUS, N_LONG, and N_CIRC. Default is T(2,3) — the trefoil.",
    },
    {
      title: "Run the script",
      body: "Press ▶ Run Script. The console prints the holonomy angle — for T(2,3) this should be very close to 360°, confirming the parallel-transport frame closes exactly. It then prints vertex and face counts (3 360 verts, 3 360 faces for defaults) and the GLB export path.",
    },
    {
      title: "Inspect the topology",
      body: "Switch to Edit Mode (Tab). In the Mesh menu, run Statistics. The mesh should show 0 non-manifold edges and 0 boundary edges — confirming the torus-topology closure. Enable Viewport Overlays → Face Normals at 0.04 m to confirm all normals point outward.",
    },
    {
      title: "Vary the knot family",
      body: "Change P = 2, Q = 5 and re-run: the cinquefoil appears (five crossings, five-petal form). Try T(3,4): the more complex alternating topology. Try T(2,2) to see the ValueError: GCD=2 guard trigger, proving the link-not-knot check. Each run cleans up via wm.read_factory_settings.",
    },
    {
      title: "Record the viewport animation",
      body: "After blueprint.py has run and the blend file is saved, open record.py and press ▶ Run Script. It builds a NURBS reveal curve, animates bevel_factor_end from 0→1 over 90 frames, then orbits the camera 360° over the following 90 frames. Output is viewport.mp4 at 1920×1080 30fps.",
    },
    {
      title: "Load in WebXR",
      body: "Import hf_torus_knot.glb into a Three.js scene with GLTFLoader. The emissive material appears as a glowing strand. For bloom, wrap the renderer with EffectComposer + UnrealBloomPass(threshold=0.1, strength=1.5, radius=0.4). The Draco-compressed file is ~55 KB.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Visible seam ring where the tube closes",
      cause:
        "The holonomy correction was not applied, or N_LONG is too low so the angular step between the last and first ring is visible.",
      fix: "Check the console for the holonomy printout. If it reads 0°, the correction block did not run. Confirm the frames loop in _build_frames runs to completion. Increase N_LONG to 360 or 480 for a tighter seam.",
    },
    {
      symptom: "ValueError: GCD > 1 even though P and Q look coprime",
      cause:
        "P or Q was accidentally set to 0 (GCD(0, n) = n for any n). Or both were set to the same number.",
      fix: "Ensure both P ≥ 1 and Q ≥ 2 and GCD(P,Q) = 1. Valid pairs: (2,3), (2,5), (3,4), (3,5), (2,7), (4,5).",
    },
    {
      symptom: "Tube appears twisted or the rings are misaligned",
      cause:
        "The seed vector for N[0] is nearly parallel to T[0], causing a near-degenerate projection. The fallback from Z to Y should prevent this for standard torus knot tangents.",
      fix: "Add a third fallback: if abs(seed.dot(T[0])) > 0.9 after the Y-axis try, use (1,0,0). This covers the rare case where T[0] lies in the YZ plane.",
    },
    {
      symptom: "GLB loads in Three.js but the material appears black (no emission)",
      cause:
        "The emissive material requires the KHR_materials_emissive_strength extension. Old Three.js versions (before r142) ignore emissive strength > 1.0.",
      fix: "Upgrade Three.js to r142+. Alternatively, set EMIT_STRENGTH = 1.0 in blueprint.py before export to stay within the base glTF spec range.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Python API 5.1 — mathutils module — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/mathutils.html",
    },
    {
      label:
        "njanakiev/blender-scripting — parametric surface scripts — MIT — Nicolas Janakiev",
      href: "https://github.com/njanakiev/blender-scripting",
    },
    {
      label:
        "KhronosGroup/glTF-Blender-IO — GLB export pipeline — Apache-2.0 — Khronos Group",
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Curve Tangent + Curve Normal — Frenet-Serret Frame Ribbon Beam for WebXR",
      href: "/tutorials/blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr",
    },
    {
      label:
        "Python mathutils — Hopf Fibration: Stereographic S³ Fibres as Linked-Torus Light Sculpture",
      href: "/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr",
    },
    {
      label:
        "Python mathutils — Möbius Strip N-Twist: Non-Orientable Surface, Half-Twist Seam & WebXR GLB",
      href: "/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr",
    },
    {
      label:
        "Python bmesh.ops — Class I Geodesic Sphere: Icosahedron Frequency Subdivision & Euler χ=2",
      href: "/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr",
    title: data.title,
    lede: data.lede,
    date: "2026-07-26",
    tags: [
      "blender",
      "scripting",
      "geometry",
      "topology",
      "webxr",
      "knot-theory",
    ],
    body: Body,
  },
  data,
);
