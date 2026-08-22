import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Hard-surface props need two tiers of surface information on the same
        polygon: a low-frequency base normal (panel bow, weld seam) and a
        high-frequency detail normal (rivets, machined grooves). The naive
        fix — a Mix Color node between the two Normal Map outputs — is
        mathematically wrong. Decoded normals are unit vectors; lerping two
        gives a result shorter than 1 that points in the wrong direction at
        45°, creating a flat specular band visible at typical viewing distances.{" "}
        <strong>Reoriented Normal Mapping (RNM)</strong>, introduced by Ben
        Golus in 2017, solves this with six extra nodes and one counter-intuitive
        rule: <em>add</em> XY, <em>multiply</em> Z.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-4">{`T = base Bump output    D = detail Bump output    (both unit vectors)

Rx = Tx + Dx    Ry = Ty + Dy    Rz = Tz × Dz   ← multiply Z, not add
R  = normalize(Rx, Ry, Rz)`}</pre>
      <p className="mt-3">
        When both normals point straight up (<code>Tz = Dz = 1</code>){" "}
        <code>Rz = 1</code> with no spurious tilt. When one normal is strongly
        tilted its low Z attenuates the product, keeping the composite inside
        the reachable hemisphere. Simple Z-addition overshoots — producing
        values above 1 before normalization — and creates the exact artefact
        Mix Color exhibits.
      </p>
      <p className="mt-3">
        The node chain in blueprint.py wires the base branch as{" "}
        <code className="bg-zinc-800 px-1 rounded">
          Noise(Scale=2.5) → Bump(0.80)
        </code>{" "}
        and the detail branch as{" "}
        <code className="bg-zinc-800 px-1 rounded">
          Voronoi(DISTANCE_TO_EDGE, R=0) → Math(1−x) → Bump(0.35)
        </code>
        . The Voronoi inversion (1 − distance) makes cell edges — which sit at
        distance ≈ 0 — the high-value region that Bump reads as raised geometry:
        the rivet-ring pattern. The same inversion trick appears in{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel"
          className={lk}
        >
          Shader — Holographic Panel
        </Link>{" "}
        where it drives emission rather than displacement.
      </p>
      <p className="mt-3">
        The glTF 2.0 specification supports only a single{" "}
        <code className="bg-zinc-800 px-1 rounded">normalTexture</code> per
        material, so the RNM graph cannot run in a WebXR viewer directly. The
        production path is to bake the composite: add a blank Image Texture node
        as the active bake target, run Cycles ▸ Bake ▸ Normal ▸ Tangent, and
        export the resulting single map. The bake pipeline is covered in detail
        in{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking — Normal Map + AO
        </Link>
        . For real-time RNM in Three.js, the same six-node formula maps
        directly onto{" "}
        <code className="bg-zinc-800 px-1 rounded">NodeMaterial</code> TSL nodes
        — the runtime alternative to the bake path.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open blueprint.py in the Text Editor and press Run Script. It builds the RNM_Panel material, applies it to a subdivided 1.6×0.9 m plane, and exports output/rnm_panel.glb. Confirm '[holoflow] rnm_panel complete' in the System Console.",
      },
      {
        title: "Trace the RNM chain",
        body: "In the Shader Editor, follow the two SeparateXYZ nodes. Confirm T.z → Math(MULTIPLY) ← D.z, and that CombineXYZ Z input comes from Multiply not Add. This is the single structural difference from a broken simple-mix approach.",
      },
      {
        title: "Compare: Mix node vs RNM",
        body: "Temporarily wire a Mix Color(Factor=0.5) directly between the two Bump Normal outputs and into Principled BSDF Normal. Orbit to a 45° camera angle — observe highlight flattening. Reconnect the RNM chain. The highlight recovers. This is the visual proof of why the formula matters.",
      },
      {
        title: "Bake for GLB",
        body: "Add a blank 2048×2048 Image Texture node (Non-Colour, not wired). Click its header to make it active (turns orange). Render Properties ▸ Bake ▸ Normal ▸ Tangent ▸ Bake. Wire the baked image through a Normal Map node into Principled BSDF Normal, removing the RNM chain, and re-export GLB.",
      },
      {
        title: "Record viewport.mp4",
        body: "Save the .blend, then run record.py. Frames 1–30: 90° camera orbit showing surface curvature. Frames 31–60: detail Bump Strength ramps 0 → 0.35 so rivet edges materialise live. Output: public/library/videos/…/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Surface looks flat after wiring the RNM chain",
        cause: "VectorMath node is not set to NORMALIZE, or its output feeds the wrong BSDF socket.",
        fix: "Select the VectorMath node → confirm Operation = NORMALIZE. Output socket label reads 'Vector' (not 'Value', which indicates DOT_PRODUCT). In Principled BSDF the target is 'Normal', not 'Tangent' or 'Clearcoat Normal'.",
      },
      {
        symptom: "Rivet detail appears as grooves not bumps",
        cause: "The Math(SUBTRACT) inputs are swapped: computing dist − 1 instead of 1 − dist.",
        fix: "Select the SUBTRACT node. Input 0 = constant 1.0; Input 1 = Voronoi Distance. Swap if reversed.",
      },
      {
        symptom: "Baked normal map has visible UV seams in GLB",
        cause: "Island margin too narrow; edge texels bleed into void rather than adjacent island padding.",
        fix: "Re-unwrap: Smart UV Project, Island Margin = 0.01. Increase bake resolution to 2048+. The RNM blend itself is seamless — seams are a bake-padding issue.",
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-detail-normal-rnm-overlay-hard-surface",
    title:
      "Shader — Reoriented Normal Mapping (RNM): Detail Normal Overlay on a Hard-Surface Panel (Blender 5.1)",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "Composites two Bump-node normal layers — a low-frequency panel undulation and a tiling Voronoi rivet detail — using the RNM formula (add XY, multiply Z, re-normalise). Explains why simple Mix fails at 45°, walks the six-node chain, and covers baking the composite to a single normalTexture for glTF 2.0 / WebXR export.",
    tags: ["blender", "shading", "normal-map", "rnm", "bump", "hard-surface", "webxr", "glb", "baking"],
    Body,
    related: [
      {
        href: "/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr",
        label: "Tutorial — Principled BSDF v2: Full glTF PBR Parameter Map",
        note: "The Normal socket wired in this tutorial feeds the Principled BSDF exactly as described in the full parameter map. Consult it for Roughness, Metallic, and Alpha interaction with the Normal layer.",
      },
      {
        href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
        label: "Tutorial — Texture Baking: Normal Map + AO",
        note: "The production path after RNM: bake the composite to a single tangent-space image for GLB export. Covers the mandatory active-node selection, colour-space setting, and cage-extrusion pitfalls.",
      },
      {
        href: "/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight",
        label: "Tutorial — Shader: AO + Pointiness Edge Highlight",
        note: "Add a third layer on top of RNM: multiply AO and Pointiness into Base Color to darken crevices. The Normal socket stays on the RNM output independently.",
      },
      {
        href: "/tutorials/blender-tutorial-shader-parallax-occlusion-mapping-wall-tile-webxr",
        label: "Tutorial — Shader: Parallax Occlusion Mapping",
        note: "POM pushes depth further than RNM by shifting UVs with view angle. Same bake-before-export limitation. Compare the two for hard-surface depth fidelity vs runtime cost.",
      },
      {
        href: "/tutorials/blender-tutorial-gn-interpolate-domain-face-normal-vertex-colour-toon",
        label: "Tutorial — GN Interpolate Domain: Toon Vertex Colour",
        note: "Uses the same Voronoi DISTANCE_TO_EDGE pattern to drive a different output — per-face vertex colour in Geometry Nodes rather than shader-space bump.",
      },
      {
        href: "https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a",
        label: "\"Normal Mapping for a Triplanar Shader\" — Ben Golus (2017, educational reference)",
        note: "The original RNM derivation, including the UDN (Unreal) blend variant and hemisphere-constraint analysis. Related: github.com/bgolus.",
      },
      {
        href: "https://docs.blender.org/manual/en/5.1/render/shader_nodes/vector/bump.html",
        label: "Bump Node — Blender Manual (CC BY, Blender Foundation)",
        note: "Blender 5.1 Bump node API: Strength, Distance, and Normal output semantics. Related: blender/blender (GPL-2+) on GitHub.",
      },
    ],
    sources: [
      {
        href: "https://docs.blender.org/manual/en/5.1/render/shader_nodes/vector/bump.html",
        label: "Bump Node — Blender Manual (CC BY, Blender Foundation)",
        note: "Blender 5.1 Bump node: Strength controls blend weight, Distance scales height in world units, Normal output is tangent-space unit vector. Sibling: blender/blender on GitHub.",
      },
      {
        href: "https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a",
        label: "\"Normal Mapping for a Triplanar Shader\" — Ben Golus (2017, educational reference)",
        note: "RNM formula derivation: add XY, multiply Z, re-normalise. UDN variant and hemisphere analysis. Sibling: github.com/bgolus (shader technique articles).",
      },
    ],
  }
);
