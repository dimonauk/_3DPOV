import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Möbius strip is a surface with exactly one side and one boundary
        component. Constructed by taking a rectangular ribbon, applying one
        half-twist, and gluing the short ends, it cannot be given a consistent
        orientation — walking along the surface, you return to your starting
        point on the "other side" without ever crossing an edge. This is
        non-orientability made physical, and it has measurable consequences in
        Blender: the{" "}
        <code>recalc_face_normals</code> operator cannot resolve a consistent
        outward-normal field across the whole thin surface, and the Geometry
        node's <em>Backfacing</em> output toggles even when the viewer has not
        moved — because the local frame has silently flipped.
      </p>
      <p>
        The N-twist generalisation controls how many half-twists are applied
        before closing. Odd N gives the Möbius family (non-orientable, one
        boundary loop); even N gives cylinders (orientable, two boundary loops).
        The entire non-orientability is encoded in a single j-index reversal at
        the closing seam — no special geometry required.
      </p>

      <h2>The parametrisation</h2>
      <p>
        Map (θ, t) ∈ [0, 2π) × [−1, 1] into ℝ³:
      </p>
      <pre>{`x(θ, t) = (R + W·t·cos(N·θ/2)) · cos(θ)
y(θ, t) = (R + W·t·cos(N·θ/2)) · sin(θ)
z(θ, t) = W·t·sin(N·θ/2)`}</pre>
      <p>
        R is the ring radius, W the strip half-width, N the half-twist count.
        The factor <code>N·θ/2</code> is the half-angle: at θ=0 the local frame
        is upright; at θ=2π (one full loop) the frame has rotated by Nπ. For
        N=1 that is 180° — the frame is upside-down, so the strip's far edge
        at t=+1 has returned to where t=−1 was. The mesh seam must reflect this:
      </p>
      <pre>{`# Seam face: row last → row 0, j reversed (for odd N only)
c = 0 * cols + (T_SEGS - j - 1)
d = 0 * cols + (T_SEGS - j)`}</pre>
      <p>
        This is the only line that distinguishes a Möbius strip from a plain
        torus-strip (cylinder). The mesh is identical in all other respects; the
        topology differs entirely in connectivity.
      </p>
      <p>
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf fibration
        </Link>
        , which also uses a parametric map into 3-space (via stereographic
        projection from S³) — the difference being that the Hopf fibration is
        orientable (its fibres are circles, globally consistently oriented by the
        projection map), whereas the Möbius strip is not.
      </p>

      <h2>Boundary loop topology</h2>
      <pre>{`N_TWISTS  Orientable?  Boundary loops  Cut along centreline gives…
────────  ───────────  ──────────────  ───────────────────────────
1 (Möbius)   No       1               A single longer strip (2 twists)
2 (cylinder) Yes      2               Two separate untwisted rings
3            No       1               A single strip with 4 twists
4            Yes      2               Two rings, each with 1 twist
Pattern: odd N → 1 boundary loop; even N → 2 boundary loops`}</pre>
      <p>
        The blueprint verifies this at runtime by counting boundary-edge
        connected components via a BFS walk on{" "}
        <code>bmesh.edges</code>. The console should print:
      </p>
      <pre>{`[HF] boundary loops = 1  (expected 1 for N=1)  ✓`}</pre>
      <p>
        This is the same Euler characteristic reasoning used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
          className={lk}
        >
          geodesic sphere blueprint
        </Link>
        , where χ = V − E + F = 2 is verified to confirm topological closure of
        the icosphere. For the thin Möbius strip χ = 0 (genus-1 surface with one
        boundary); for the solidified solid χ = 0 as well (closed non-orientable
        shell embedded in ℝ³ as a Klein-bottle-like body).
      </p>

      <h2>The two-tone material: backface as topology proof</h2>
      <p>
        The shader uses{" "}
        <code>ShaderNodeNewGeometry → Backfacing</code> to mix between gold
        (front) and navy (back). On a cylinder this produces a clean inner/outer
        split. On the thin Möbius strip (THICKNESS = 0) it produces alternating
        bands — because as you orbit the strip, the normal of successive faces
        has reversed relative to the camera, toggling the Backfacing signal.
        This is not a rendering artefact; it is non-orientability made visible.
        Compare this to the cel-shading approach in{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
          className={lk}
        >
          Shader-to-RGB halftone cel shade
        </Link>
        {" "}which uses a different geometry signal (dot product with light
        direction) to drive colour bands.
      </p>
      <p>
        After <code>bmesh.ops.solidify</code>, the surface becomes an orientable
        closed shell (two distinct manifold sides) and the gold/navy split
        behaves like a normal double-skinned object. The solidified version is
        the WebXR GLB target; the thin version is the topology demonstration.
      </p>

      <h2>WebXR and Three.js</h2>
      <p>
        The exported GLB (Draco level 6, WebP textures) loads in Three.js via{" "}
        <code>GLTFLoader</code>. The Principled BSDF maps to{" "}
        <code>MeshStandardMaterial</code> in the glTF PBR model, as documented
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF → glTF PBR export
        </Link>
        {" "}tutorial. The Backfacing-driven mix colour does not survive in the
        GLB (glTF has no backface-switching material node); instead the solidified
        mesh naturally shows gold on the outer hull and navy on the inner hull
        because the two shells have opposite normals and are assigned separate
        material slots by solidify.
      </p>
    </>
  );
}

const data = {
  title:
    "Python mathutils — Möbius Strip N-Twist: Non-Orientable Surface, Half-Twist Seam & Solidified WebXR GLB",
  lede:
    "Build a Möbius strip (or N-twist generalisation) from a single parametric equation in pure Python, encode non-orientability as a j-index reversal at the closing seam, solidify for 3D printing, drive a two-tone material from the Geometry node's Backfacing output, and export a Draco-compressed WebXR GLB.",
  date: "2026-07-26",
  steps: [
    {
      title: "Open and configure",
      body: "Open Blender 5.1, create a new General file, and save it to the library directory so that GLB_PATH = '//hf_mobius.glb' resolves correctly. In the Scripting workspace, open blueprint.py. The key parameters at the top are N_TWISTS (1 = classic Möbius), THETA_SEGS (120 gives smooth ring with <1° angular error), and THICKNESS (0.022 m for print-ready shell).",
    },
    {
      title: "Run the script",
      body: "Press ▶ Run Script. The console reports vertex/face counts, then the topology check: 'boundary loops = 1  (expected 1 for N=1)  ✓'. If this reads ✗ there is a seam-closure bug — check that N_TWISTS is an integer and that the j-reversal block (the is_seam branch) is intact. GLB exports to the same directory.",
    },
    {
      title: "Inspect non-orientability",
      body: "Switch to Material Preview (Z → Material Preview). Orbit around the strip slowly near θ ≈ 0 (the rightmost intersection with the X axis). Watch how the gold/navy colour transitions — in the thin-surface mode (THICKNESS=0) you will see alternating bands, not a clean split, because the normal has flipped around the Möbius seam. Enable Viewport Overlays → Face Normals at 0.05 m to see the flip directly.",
    },
    {
      title: "Compare N values",
      body: "Change N_TWISTS to 2 and re-run. The result is a cylinder — two independent boundary loops, clean orientable inner/outer colour split. Try N_TWISTS = 3 for a triple-twist strip (still one boundary loop, but longer traversal before return). Each run cleans up the previous hf_mobius object automatically.",
    },
    {
      title: "Solidify for print",
      body: "With THICKNESS = 0.022 m (the default), the strip becomes a closed manifold shell suitable for FDM or resin printing. The seam is the thinnest section of the print — increase THICKNESS to 0.03 m if the slicer reports thin-wall warnings. The outer hull is gold, the inner hull navy, with side walls at the original boundary loops.",
    },
    {
      title: "Record viewport animation",
      body: "With blueprint.py already run, open record.py and press ▶ Run Script. It sets up a three-phase camera arc (orbit → seam zoom → topology reveal), switches to Material Preview shading, and calls bpy.ops.render.opengl(animation=True). Output is viewport.mp4 at 1920×1080 20fps in the videos subdirectory.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Seam is visible as a sharp crease or gap in the mesh",
      cause:
        "THETA_SEGS is too low (< 60), creating a large angular step between the last row and the parametric endpoint. The seam faces are spatially correct but too wide.",
      fix: "Increase THETA_SEGS to 120 or 240. At 120 the angular step is 3°, invisible in Material Preview. Alternatively add an Edge Crease of 0 to the seam edges and use a Subdivision Surface modifier — but this changes the topology.",
    },
    {
      symptom: "Boundary loop count reports 2 when N_TWISTS = 1",
      cause:
        "The j-reversal at the seam is not activating. Either N_TWISTS was set to an even number, or the is_seam condition is wrong.",
      fix: "Confirm N_TWISTS = 1 (odd). Check that the seam face block uses (T_SEGS - j - 1) and (T_SEGS - j) — NOT (j + 1) and j. Accidentally using the cylinder branch on both paths gives two separate boundary loops.",
    },
    {
      symptom: "After solidify, the outer surface appears inside-out in viewport",
      cause:
        "recalc_face_normals converged to an inward-facing orientation on the outer hull. This can happen if most faces happened to be winding CCW when viewed from inside.",
      fix: "After running the script, select all faces in Edit Mode (A) and press Mesh → Normals → Flip. Alternatively add bmesh.ops.reverse_faces before solidify — but verify the boundary loop count first, as reversing normals does not change topology.",
    },
    {
      symptom: "GLB loads in Three.js but both sides are gold (no navy inner hull)",
      cause:
        "The solidify shell was not created (THICKNESS = 0), or the material slot assignment for the inner hull was lost at export.",
      fix: "Check THICKNESS > 0 before running. After solidify, bmesh creates new faces tagged to the inner surface — the blueprint assigns the same material to both; the Backfacing node drives the split. If Three.js shows only gold, the MeshStandardMaterial does not have side = THREE.DoubleSide set. Add: material.side = THREE.DoubleSide.",
    },
  ],
  externalLinks: [
    {
      label: "Paul Bourke — Möbius Strip — Educational freeware",
      href: "http://paulbourke.net/geometry/mobius/",
    },
    {
      label:
        "Wikipedia — Möbius strip — CC BY-SA 4.0 — Wikimedia Foundation",
      href: "https://en.wikipedia.org/wiki/M%C3%B6bius_strip",
    },
    {
      label: "Wikipedia — Non-orientable surface — CC BY-SA 4.0",
      href: "https://en.wikipedia.org/wiki/Non-orientable_surface",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python mathutils — Hopf Fibration: Stereographic S³ Fibres as Linked-Torus Light Sculpture for WebXR",
      href: "/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr",
    },
    {
      label:
        "Python bmesh.ops — Class I Geodesic Sphere: Icosahedron Frequency Subdivision & Euler χ=2 Verification",
      href: "/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr",
    },
    {
      label:
        "Shader-to-RGB Halftone Cel Shade — Backface-driven two-tone shading for WebXR",
      href: "/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr",
    },
    {
      label:
        "Principled BSDF v2 — glTF PBR pipeline and WebXR export",
      href: "/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr",
    title: data.title,
    lede: data.lede,
    date: "2026-07-26",
    tags: [
      "blender",
      "scripting",
      "geometry",
      "topology",
      "webxr",
      "3d-print",
    ],
    body: Body,
  },
  data,
);
