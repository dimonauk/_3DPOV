import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Hopf fibration</strong> η: S³ → S² (Heinz Hopf, 1931) is the
        first example of a fibre bundle that is topologically non-trivial — it
        cannot be continuously deformed into the product S² × S¹. Every point
        on the 2-sphere S² has an entire circle (S¹) as its preimage in the
        3-sphere S³, and any two such circles are either identical or mutually
        linked with linking number ±1. These interlocked circles are
        called <strong>Clifford parallels</strong>: the S³ analogue of parallel
        lines, which wind around each other without ever touching or crossing.
        Under stereographic projection from S³ into ordinary ℝ³, the fibres
        appear as Euclidean circles that fill concentric nested tori — the
        innermost torus near the central z-axis, expanding outward until the
        outermost fibres are very large circles nearly parallel to the XY plane.
      </p>
      <p>
        The blueprint samples <strong>72 base points</strong> on S² with the
        Fibonacci (Vogel) spiral lattice, projects each fibre into ℝ³ via the
        south-pole stereographic map, assigns an emission colour that encodes
        the base-point latitude, and exports the sculpture as a
        Draco-compressed WebXR GLB. The result is a glowing, interlocked
        structure of 60–70 circles that reads immediately as a light-painting
        composition even without prior knowledge of the topology.
      </p>

      <h2>The Hopf map</h2>
      <p>
        Work in ℂ²: write a point of S³ as a pair of complex numbers
        (z₁, z₂) with |z₁|² + |z₂|² = 1. The Hopf map is:
      </p>
      <pre>{`η(z₁, z₂) = (2z₁z̄₂,  |z₁|² − |z₂|²)  ∈  ℝ³`}</pre>
      <p>
        The output lands on S² ⊂ ℝ³ because
        |2z₁z̄₂|² + (|z₁|² − |z₂|²)² = (|z₁|² + |z₂|²)² = 1. To find the
        preimage of a given point n̂ = (sinΦ cosΘ, sinΦ sinΘ, cosΦ) ∈ S²,
        parameterise the fibre by t ∈ [0, 2π):
      </p>
      <pre>{`z₁(t) = cos(Φ/2) · exp(it)
z₂(t) = sin(Φ/2) · exp(i(t + Θ))

# In ℝ⁴ coordinates (a, b, c, d):
a = cos(Φ/2) cos t          b = cos(Φ/2) sin t
c = sin(Φ/2) cos(t + Θ)    d = sin(Φ/2) sin(t + Θ)`}</pre>
      <p>
        Each (a,b,c,d) lies on S³ — verify: a²+b²+c²+d²
        = cos²(Φ/2)(cos²t + sin²t) + sin²(Φ/2)(cos²(t+Θ) + sin²(t+Θ))
        = cos²(Φ/2) + sin²(Φ/2) = 1. ✓
      </p>
      <p>
        This is exactly the computation in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics tutorial
        </Link>{" "}
        in reverse: there we <em>sampled</em> S² to evaluate a function;
        here we use S² as the <em>base space</em> of a bundle and lift each
        point to a circle in a higher-dimensional sphere.
      </p>

      <h2>Stereographic projection from S³ to ℝ³</h2>
      <p>
        Stereographic projection from the south pole (0,0,0,−1) of S³ sends
        each point (a,b,c,d) ∈ S³ \ {"{(0,0,0,−1)}"} to:
      </p>
      <pre>{`π(a, b, c, d) = SCALE · (a, b, c) / (1 + d)`}</pre>
      <p>
        The projected radius satisfies |π| = SCALE · √((1−d)/(1+d)), which
        ranges from 0 (when d = 1, i.e. the north pole of S³ — the fibre over
        n̂ = (0,0,1)) to ∞ (when d → −1). The south-pole singularity of S³
        corresponds to n̂ = (0,0,−1) on S², which is why the blueprint clips
        the base-point sample at z_min = −0.70. For all sampled fibres
        min(1+d) = 1 − sin(Φ/2) ≥ 0.065, keeping the projection bounded.
      </p>
      <pre>{`def hopf_fibre_projected(phi, theta, n_pts, scale, r_clip):
    half_phi = phi / 2.0
    cos_h, sin_h = math.cos(half_phi), math.sin(half_phi)
    pts = []
    for k in range(n_pts):
        t     = math.tau * k / n_pts
        a     = cos_h * math.cos(t)
        b     = cos_h * math.sin(t)
        c     = sin_h * math.cos(t + theta)
        d     = sin_h * math.sin(t + theta)
        denom = 1.0 + d
        if denom < 1e-5:
            return None          # singular — skip this fibre
        x, y, z = scale * a / denom, scale * b / denom, scale * c / denom
        if x*x + y*y + z*z > r_clip * r_clip:
            return None          # too far out — skip for clean GLB
        pts.append(Vector((x, y, z)))
    return pts`}</pre>
      <p>
        The r_clip guard is conservative: it skips the <em>entire</em> fibre
        if any point exceeds the clip radius, rather than silently producing a
        broken circle. This is the same fail-loudly convention used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
          className={lk}
        >
          torus knot GCD guard
        </Link>{" "}
        — a partial result is worse than no result when the goal is a
        closed, topologically correct sculpture.
      </p>

      <h2>Fibonacci sphere lattice</h2>
      <p>
        To distribute N_FIBRES base points uniformly on S², the blueprint uses
        the Vogel/Fibonacci lattice. The key insight is that the golden angle
        φ_g = 2π(1 − 1/φ_gold) ≈ 137.508° is the most irrational rotation
        angle — its continued fraction has no large partial quotients — which
        means consecutive points on the spiral are never nearly coincident,
        regardless of how many points are placed.
      </p>
      <pre>{`PHI_GOLD = (1.0 + math.sqrt(5.0)) / 2.0
PHI_G    = math.tau * (1.0 - 1.0 / PHI_GOLD)   # ≈ 2.3998 rad

for i in range(n):
    zi    = 1.0 - (2.0 * i + 1.0) / n    # uniform z-spacing in [-1, 1]
    ri    = math.sqrt(max(0.0, 1.0 - zi*zi))
    theta = i * PHI_G
    pts.append((ri*cos(theta), ri*sin(theta), zi))`}</pre>
      <p>
        The resulting distribution is not perfectly uniform (it can't be, since
        only the Platonic solids give perfectly uniform S² packings for small
        N) but for N ≥ 40 the Voronoi cells have nearly equal areas — good
        enough for a visual sculpture. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          geodesic sphere tutorial
        </Link>{" "}
        which uses icosahedral frequency subdivision for an <em>exact</em>{" "}
        uniform distribution with Euler-characteristic verification — a heavier
        approach justified when the topology must be provably correct.
      </p>

      <h2>Colour coding by latitude</h2>
      <p>
        Each fibre inherits the latitude of its base point on S². The colour
        is computed in HSV space with a linear hue sweep:
      </p>
      <pre>{`def colour_for_z(z):
    t   = (z + 1.0) / 2.0              # remap [-1,1] → [0,1]
    hue = 0.78 - t * 0.65              # violet(0.78) → gold(0.13)
    r, g, b = colorsys.hsv_to_rgb(hue % 1.0, 1.0, 1.0)
    return (r, g, b, 1.0)`}</pre>
      <p>
        Saturation and value are fixed at 1.0 so every fibre emits at equal
        intensity. The hue sweep (violet → cyan → gold from south to north)
        reads as a latitude gradient that is perceptually unambiguous — unlike
        a red-to-blue sweep which many viewers interpret as hot-to-cold rather
        than a spatial coordinate. The same HSV strategy appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
          className={lk}
        >
          Möbius strip tutorial
        </Link>{" "}
        for encoding twist direction across the non-orientable seam.
      </p>

      <h2>NURBS curve construction</h2>
      <p>
        Each projected fibre is stored as a <strong>NURBS</strong> curve
        (order 4, cyclic) rather than a BEZIER or POLY spline. NURBS order 4
        gives C² continuity everywhere, which produces a smooth tube with no
        visible kinks when <code>bevel_depth</code> is applied. BEZIER would
        require explicit handle placement to match the circle shape; POLY
        would produce facets. For a mathematically smooth input curve, NURBS
        is the correct default.
      </p>
      <pre>{`cu = bpy.data.curves.new(f'hf_fibre_{idx:03d}', 'CURVE')
cu.bevel_depth    = TUBE_BEVEL
cu.bevel_resolution = 4
cu.use_fill_caps  = True

sp = cu.splines.new('NURBS')
sp.use_cyclic_u = True
sp.points.add(N_PTS - 1)        # NURBS starts with 1 point
for k, v in enumerate(pts3d):
    sp.points[k].co = (*v, 1.0) # 4th component is the NURBS weight
sp.order_u = min(4, len(sp.points))`}</pre>

      <h2>WebXR export and Three.js usage</h2>
      <p>
        The GLB export uses <code>export_yup=True</code> (+Y up for WebXR),
        <code>export_apply=True</code> (bakes transforms), and Draco level 6.
        Because NURBS curves are converted to mesh triangles at export time,
        the final GLB contains 60–70 individual torus-section meshes — one
        per surviving fibre. In Three.js, import with GLTFLoader and add an
        <code>UnrealBloomPass</code> for the glow effect:
      </p>
      <pre>{`// threshold=0.05 captures all emissive geometry
const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.8,    // strength
    0.5,    // radius
    0.05    // threshold
);`}</pre>
    </>
  );
}

const data = {
  title:
    "Python mathutils — Hopf Fibration: S³→S² Bundle Projection, Clifford Parallels & Linked-Torus Light Sculpture for WebXR",
  lede:
    "Project the Hopf fibre circles from S³ into ℝ³ via stereographic projection, distribute 72 base points with a Fibonacci lattice, colour-code by latitude, and export a linked-torus light sculpture as a Draco-compressed WebXR GLB — with a viewport orbit animation for the screen recording.",
  date: "2026-07-26",
  steps: [
    {
      title: "Open and configure",
      body: "Open Blender 5.1 and save a new file to the library directory so `//hf_hopf_fibration.glb` resolves. In the Scripting workspace, open blueprint.py. The parameter block exposes N_FIBRES (72), N_PTS (96), TUBE_BEVEL (0.018), Z_MIN (−0.70), SCALE (1.5), and R_CLIP (10.0). Leave defaults for the first run.",
    },
    {
      title: "Run the script",
      body: "Press ▶ Run Script. The console prints `N base points sampled on S²` and then the count of created fibres (typically 62–70 — the remainder are clipped). The sculpture appears in the viewport: a nested set of glowing circles colour-coded from violet (outer, near-south) through cyan (mid) to gold (inner, near-north).",
    },
    {
      title: "Inspect the interlocking",
      body: "In the viewport, orbit to a top-down view (Numpad 7). The circles should appear to interlock through each other — none crossing, but none separable without passing through another. This is the linking number ±1 property. Enable View Overlay → Statistics to see the total curve count matches the console printout.",
    },
    {
      title: "Tune parameters",
      body: "Increase N_FIBRES to 120 for a denser sculpture (runtime increases roughly linearly). Decrease Z_MIN toward −0.85 to include more south-latitude fibres — watch R_CLIP catch and drop those whose projections are too large. SCALE controls the overall size: lower values compress the outer fibres inward, hiding the size gradient.",
    },
    {
      title: "Record the viewport animation",
      body: "After the blend file is saved, open record.py and press ▶ Run Script. Phase 1 grows all fibres from bevel_depth=0 via EXPO easing (60 frames, 2 s). Phase 2 orbits the camera 360° over 150 frames (5 s). Output is viewport.mp4 at 1920×1080 30fps in the videos/scripting/<slug>/ directory.",
    },
    {
      title: "Load in WebXR",
      body: "Import hf_hopf_fibration.glb into a Three.js scene via GLTFLoader. Add EffectComposer → UnrealBloomPass(threshold=0.05, strength=1.8, radius=0.5). The scene contains 60–70 mesh objects (one per fibre). For large scenes, use THREE.InstancedMesh or merge geometries with BufferGeometryUtils.mergeBufferGeometries to reduce draw calls.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Fewer than expected fibres in the viewport",
      cause:
        "The R_CLIP guard dropped fibres whose projected control points exceeded the clip radius. This happens when Z_MIN is too low (base points too close to the south pole).",
      fix: "Raise Z_MIN from −0.70 toward −0.55. Alternatively raise R_CLIP to 15.0 if you want the large outer fibres included — but expect the camera framing to need adjustment.",
    },
    {
      symptom: "NURBS spline appears faceted rather than smooth",
      cause:
        "sp.order_u was clamped to less than 4 because N_PTS was set below 4.",
      fix: "Keep N_PTS ≥ 8. Order 4 (cubic B-spline) requires at least 4 control points. The default of 96 is well above this limit.",
    },
    {
      symptom: "Circles appear as straight lines in the viewport",
      cause:
        "The spline type was changed to POLY (use_cyclic_u has no effect on POLY splines opened in certain editing modes).",
      fix: "Confirm each spline is NURBS, not POLY. In the script, check the `cu.splines.new('NURBS')` line has not been changed.",
    },
    {
      symptom: "GLB loads in Three.js but draw calls are very high (60+ objects)",
      cause:
        "Each fibre is a separate mesh object in the GLB, leading to one draw call per fibre without batching.",
      fix: "Use THREE.BufferGeometryUtils.mergeGeometries on all fibre geometries after loading. Group by material (colour zone) first to keep the colour coding. Alternatively, join all curves in Blender before export with Ctrl+J.",
    },
  ],
  externalLinks: [
    {
      label:
        "Heinz Hopf — Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche (1931) — Public Domain — Mathematische Annalen",
      href: "https://link.springer.com/article/10.1007/BF01449962",
    },
    {
      label:
        "njanakiev/blender-scripting — parametric curve and surface scripts — MIT — Nicolas Janakiev",
      href: "https://github.com/njanakiev/blender-scripting",
    },
    {
      label:
        "KhronosGroup/glTF-Blender-IO — GLB export pipeline — Apache-2.0 — Khronos Group",
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
    },
    {
      label:
        "Bauer 2000 — Distributing Points on a Sphere — Comp. Phys. Comm. 120 — Elsevier (free read via ResearchGate)",
      href: "https://www.sciencedirect.com/science/article/pii/S0010465599002660",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python mathutils — Torus Knot T(p,q): Winding Numbers, Parallel-Transport Tube & WebXR GLB",
      href: "/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr",
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
    {
      label:
        "Python numpy — Real Spherical Harmonics: Bonnet Recurrence, Shape Keys & Atomic Orbital WebXR GLB",
      href: "/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr",
    },
    {
      label:
        "GN Curve Tangent + Curve Normal — Frenet-Serret Frame Ribbon Beam for WebXR",
      href: "/tutorials/blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr",
    title: data.title,
    lede: data.lede,
    date: "2026-07-26",
    tags: [
      "blender",
      "scripting",
      "topology",
      "geometry",
      "webxr",
      "light-painting",
    ],
    body: Body,
  },
  data,
);
