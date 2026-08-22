import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Real spherical harmonics Y_l^m(θ,&nbsp;φ) are the angular
        eigenfunctions of the Laplace–Beltrami operator on S² — the same
        functions that describe the angular part of electron wavefunctions in
        quantum chemistry, band-limited lighting in real-time rendering, and
        the gravitational potential of an oblate planet. They form a complete
        orthonormal basis for any smooth function on the unit sphere, which
        means any shape that preserves spherical topology can be decomposed
        into a weighted sum of Y_l^m modes. Here that decomposition runs in
        reverse: we pick a single mode, evaluate it at every ico-sphere
        vertex, and push each vertex radially outward by DISPLACE × Y_l^m.
        The result is a Blender <strong>shape key</strong> that deforms the
        sphere into the corresponding atomic orbital.
      </p>
      <p>
        The integer l is the <em>degree</em> (orbital angular momentum
        quantum number) and m is the <em>order</em> (magnetic quantum number),
        constrained to −l ≤ m ≤ l. l = 1 gives the three p orbitals; l = 2
        gives the five d orbitals; l = 3 gives the seven f orbitals. The
        classic atomic labels — p_z, d_z², d_x²-y², f_z³ — correspond to
        (l=1, m=0), (l=2, m=0), (l=2, m=±2), and (l=3, m=0). Each is stored
        as a separate shape key in the exported GLB so WebXR can animate
        between modes with a morph target weight transition.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          Geodesic Sphere tutorial
        </Link>
        , which also uses{" "}
        <code>bmesh.ops.create_icosphere</code> as the topological foundation.
        The ico-sphere here is unsubdivided at level 4 (642 verts, 1280 faces)
        — coarser than a level-5 geodesic sphere — because the Y_l^m
        displacement is smooth and the extra triangles would add GLB file size
        without improving the silhouette.
      </p>

      <h2>Bonnet recurrence for associated Legendre polynomials</h2>
      <p>
        The normalised spherical harmonic Y_l^m requires P_l^m(cos&nbsp;θ),
        the associated Legendre polynomial evaluated at each vertex. The naive
        textbook formula differentiates a degree-l polynomial m times, which
        is numerically fragile near cos&nbsp;θ = ±1. The <strong>Bonnet
        recurrence</strong> avoids derivatives entirely:
      </p>
      <pre>{`# Seed  P_m^m(x) = (−1)^m (2m−1)!! sqrt(1−x²)^m
pmm = 1.0
for i in range(1, m+1):
    pmm *= -(2*i - 1) * sqrt(1 - x*x)

# One-step P_{m+1}^m
pmmp1 = x * (2*m + 1) * pmm

# General recurrence
for ll in range(m+2, l+1):
    result = ((2*ll - 1)*x*prev1 - (ll+m-1)*prev2) / (ll - m)`}</pre>
      <p>
        Every step is a vectorised numpy operation over the 642-element vertex
        array, so the entire set of 10 SH modes takes milliseconds rather than
        iterating in a Python loop per vertex. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
          className={lk}
        >
          Torus Knot tutorial
        </Link>{" "}
        uses a similar pattern: a mathematically defined curve sampled at
        many parameter values and stored as a mesh, with the expensive
        per-sample computation vectorised through numpy rather than Python
        list comprehensions.
      </p>

      <h2>Normalisation constant K_l^m</h2>
      <pre>{`# K = sqrt( (2l+1)/(4π) · (l−|m|)! / (l+|m|)! )
# Computed via log-factorial to avoid integer overflow:
log_n = sum(log(i) for i in range(1, l - m_abs + 1))
log_d = sum(log(i) for i in range(1, l + m_abs + 1))
K = sqrt((2*l + 1) / (4*pi) * exp(log_n - log_d))`}</pre>
      <p>
        For the modes used here (l ≤ 3) Python integers are large enough for
        the factorial directly, but the log-sum pattern is correct for
        higher-order extensions — notably l = 6 or l = 7 where (l+m)! can
        reach 5040 before squaring. The normalisation guarantees
        ∫∫|Y_l^m|² sinθ dθ dφ = 1, which ensures the displacement amplitude
        DISPLACE is consistent across all modes regardless of l or m.
      </p>

      <h2>Radial displacement and shape keys</h2>
      <pre>{`# Displaced positions
r_hat    = coords / r[:, None]            # unit radial vectors (n, 3)
Y        = real_sh(l, m, theta, phi)      # (n,) scalar field
displaced = coords + DISPLACE * Y[:, None] * r_hat

# Store as shape key
sk = ob.shape_key_add(name=f"Y_{l}_{m:+d}", from_mix=False)
sk.data.foreach_set("co", displaced.ravel().astype(np.float32))`}</pre>
      <p>
        The displacement direction is the radial unit vector r̂ rather than
        the vertex normal. On a perfect sphere those are identical, but after
        one shape key deforms the mesh the normals shift — whereas r̂ stays
        anchored to the original sphere geometry and gives consistent lobe
        proportions for every mode. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
          className={lk}
        >
          Möbius Strip tutorial
        </Link>{" "}
        makes the same choice for its half-twist cross-section vectors.
      </p>

      <h2>Vertex attribute for shader colour</h2>
      <p>
        The d_z² lobe structure (Y_2^0 normalised to [0,&nbsp;1]) is baked
        into a FLOAT POINT attribute called{" "}
        <code>&quot;sh_value&quot;</code>. The material reads it through a
        ShaderNodeAttribute node whose Fac output drives a three-stop
        ColourRamp: blue at 0 (negative lobe), near-black at 0.5 (nodal
        surface), amber at 1 (positive lobe). This mirrors the standard
        quantum-chemistry colouring convention and is compatible with the
        studio&apos;s waveguide light-sculpture aesthetics documented in{" "}
        <Link href="/articles/light-pipe-primer" className={lk}>
          the light pipe primer
        </Link>
        .
      </p>

      <h2>GLB morph targets in Three.js</h2>
      <pre>{`import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('hf_sh_orbitals.glb', (gltf) => {
  const mesh = gltf.scene.getObjectByName('hf_sh_orbital');
  // mesh.morphTargetInfluences[0] = p_z  (Y_1_+0)
  // mesh.morphTargetInfluences[3] = d_z² (Y_2_+0)
  // morph keys are in SH_MODES insertion order (blueprint.py line 22)
  mesh.morphTargetInfluences[3] = 0.8;  // 80% d_z²
});`}</pre>
    </>
  );
}

const data = {
  title:
    "Python numpy — Real Spherical Harmonics: Bonnet Recurrence, Orbital Shape Keys & WebXR GLB",
  lede:
    "Evaluate real spherical harmonics Y_l^m on an ico-sphere using the Bonnet recurrence for associated Legendre polynomials (no scipy), store each mode as a Blender shape key, colour the nodal surfaces via a named FLOAT vertex attribute, and export a Draco-compressed WebXR GLB with all morph targets for Three.js animation.",
  date: "2026-07-26",
  steps: [
    {
      title: "Open and configure",
      body: "Open Blender 5.1 and save a new file to the library directory so `//hf_sh_orbitals.glb` resolves correctly. In the Scripting workspace, open blueprint.py. The top block exposes ICO_SUBDIV (4), DISPLACE (0.55), EMIT_STRENGTH (6.0), and the SH_MODES list. The default builds all three p orbitals, all five d orbitals, and two selected f orbitals.",
    },
    {
      title: "Run the script",
      body: "Press ▶ Run Script. The console prints `[hf] GLB → //hf_sh_orbitals.glb` followed by vertex count (642), face count (1280), and shape key count (10). If the blend file was not saved first, the GLB path will fall back to the system temp directory.",
    },
    {
      title: "Inspect the shape keys",
      body: "Switch to the Layout workspace. In Properties → Object Data Properties → Shape Keys, verify Basis plus all Y_l_m entries are listed. In Material Preview mode the sphere glows amber (+lobe) and blue (−lobe), encoding the d_z² nodal surface from the baked sh_value attribute.",
    },
    {
      title: "Explore the orbital modes",
      body: "Drag each shape key value from 0 to 1 to see the deformation. Y_1_+0 gives a p_z dumbbell; Y_2_+0 the d_z² double-dumbbell with torus; Y_2_+2 the four-lobed d_x²-y². Blend two keys simultaneously — for example Y_1_+0 = 0.4 and Y_2_+0 = 0.6 — to visualise hybrid orbitals as used in chemical bonding theory.",
    },
    {
      title: "Record the viewport animation",
      body: "After blueprint.py finishes and the blend is saved, open record.py and press ▶ Run Script. It keys the morph sequence (Basis → p_z → d_z² → d_x²-y²) over 90 frames, then orbits the camera 360° over the next 90 frames. Output is viewport.mp4 at 1920×1080 30fps via bpy.ops.render.opengl.",
    },
    {
      title: "Load in WebXR",
      body: "Import hf_sh_orbitals.glb with GLTFLoader. Access morph targets via mesh.morphTargetInfluences[i] where i maps to the SH_MODES list order (0 = Y_1_-1, 1 = Y_1_+0, …, 7 = Y_2_+2). For bloom in the browser, add UnrealBloomPass(threshold=0.05, strength=1.2, radius=0.5) to an EffectComposer. Draco-compressed GLB is approximately 65 KB.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Shape keys listed but dragging the slider does nothing",
      cause:
        "The shape key relative flag is True but the Basis key's value is 0, which disables relative shape keys from showing any deformation in the viewport.",
      fix: "Ensure Basis key value stays at 1.0 (its default). Check ob.data.shape_keys.use_relative = True (the default). If the mesh was imported rather than built by blueprint.py, verify the vertex count matches — mismatched topology silently zeros the morph delta.",
    },
    {
      symptom: "GLB loads in Three.js but mesh.morphTargetInfluences is undefined",
      cause:
        "The GLB was exported without morph targets, or Three.js r148+ changed the mesh.morphTargetInfluences access pattern.",
      fix: "In Blender export options confirm 'Export Shape Keys' (export_morph=True, the default). In Three.js r148+, access morphs via mesh.morphTargetInfluences directly on the SkinnedMesh or Mesh object returned by getObjectByName. Print gltf.scene.children to verify the mesh exists.",
    },
    {
      symptom: "Colour is uniform amber or uniform blue — no nodal banding",
      cause:
        "The sh_value attribute was not written, or its range is [0, 0] because Y_2^0 evaluated to a near-constant (e.g. all vertices are near the equator).",
      fix: "Confirm `me.attributes['sh_value']` exists after running blueprint.py. The Y_2^0 range on a unit ico-sphere should span approximately [−0.315, 0.630]; print `y20.min(), y20.max()` to verify. If all values cluster near 0, the ico-sphere was not properly re-centred at origin.",
    },
    {
      symptom: "record.py raises RuntimeError: shape keys not found",
      cause:
        "record.py was run in a fresh Blender session before blueprint.py had created the hf_sh_orbital object.",
      fix: "Run blueprint.py first, then immediately run record.py in the same Blender session without closing the file. Alternatively, save the blend file after blueprint.py and open it in a new session before running record.py.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Python API 5.1 — bmesh module — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bmesh.html",
    },
    {
      label:
        "NumPy — Array operations reference — BSD-3-Clause — NumPy Contributors",
      href: "https://numpy.org/doc/stable/reference/",
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
        "Python bmesh.ops — Class I Geodesic Sphere: Icosahedron Frequency Subdivision & Euler χ=2",
      href: "/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr",
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
      label: "Blender Shape Keys & Morph Targets",
      href: "/tutorials/blender-tutorial-shape-keys-morph-targets",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr",
    title: data.title,
    lede: data.lede,
    date: "2026-07-26",
    tags: [
      "blender",
      "scripting",
      "mathematics",
      "geometry",
      "webxr",
      "shape-keys",
      "quantum",
    ],
    body: Body,
  },
  data,
);
