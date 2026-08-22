import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function POMBody() {
  return (
    <>
      <p>
        Parallax Occlusion Mapping (POM) offsets UV coordinates based on the
        camera view ray projected into tangent space, creating the illusion of
        surface depth on flat polygons. Mortar joints appear recessed and brick
        faces appear raised — no extra geometry required. Unlike a normal map,
        POM shifts what the shader <em>samples</em>, so the silhouette of
        protruding bricks changes as the camera orbits.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Why tangent space</h2>
      <p>
        UV coordinates live in a local frame on the mesh surface: the{" "}
        <strong>T</strong> (tangent) axis points in the U direction, the{" "}
        <strong>B</strong> (bitangent) axis points in the V direction, and the{" "}
        <strong>N</strong> (normal) axis points out of the surface. To know how
        far sideways (in UV space) the view ray travels per unit of depth, you
        project the ray into that frame.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`B = Cross(N, T)                  ← assumes +1 UV winding handedness

view_U = dot(Incoming, T)        ← U component of view ray
view_V = dot(Incoming, B)        ← V component
view_D = dot(Incoming, N)        ← depth component (clamped ≥ 0.001)

uv_offset = (view_U / view_D, view_V / view_D) × HEIGHT_SCALE`}</pre>
      <p className="mt-3">
        Without the tangent-space transform, the offset direction would be
        wrong for any rotation of the object. The three dot products are a
        3×3 matrix-vector multiply expressed in scalar shader nodes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Node graph architecture</h2>
      <p>Build this in the Shader Editor (or run blueprint.py directly):</p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`Geometry.Incoming ─┬─ DotProduct(T) ─ Divide(dot_N) ─ Multiply(HEIGHT_SCALE) → ofs_x
                   ├─ DotProduct(B) ─ Divide(dot_N) ─ Multiply(HEIGHT_SCALE) → ofs_y
                   └─ DotProduct(N) ─ Maximum(0.001) → dot_N  (depth, clamped)

Geometry.Normal ─ CrossProduct ← Tangent(UV_MAP) → Bitangent

For each step i in {0, 0.25, 0.50, 0.75, 1.00}:
  SeparateXYZ(UV) → Add(ofs_x×frac, ofs_y×frac) → CombineXYZ
                  → BrickTexture → h_i, colour_i

GreaterThan(h1, 0.25) → MixRGB(c0, c1)      ← keep or advance
GreaterThan(h2, 0.50) → MixRGB(prev, c2)
GreaterThan(h3, 0.75) → MixRGB(prev, c3)
GreaterThan(h4, 0.99) → MixRGB(prev, c4)    → Principled BSDF Base Color`}</pre>
      <p className="mt-3">
        The <code className="bg-zinc-800 px-1 rounded">Tangent</code> node must
        be set to <strong>UV Map</strong> mode (not Radial). The mesh needs at
        least one UV channel for it to produce a meaningful tangent vector.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        4-step approximation
      </h2>
      <p>
        True steep parallax ray-marches through N depth layers in a loop. Blender
        shader nodes have no iteration primitive, so this unrolls 4 steps at
        node-graph authoring time. The cascade selects the{" "}
        <em>last step where the surface height exceeds its depth layer</em> — that
        is just before the view ray enters the surface.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`Step  UV fraction  Depth layer  Condition to advance
  0       0.00         0.00     always start here
  1       0.25         0.25     if h1 > 0.25 → override with colour at step 1
  2       0.50         0.50     if h2 > 0.50 → override with colour at step 2
  3       0.75         0.75     if h3 > 0.75 → override with colour at step 3
  4       1.00        ≈0.99     if h4 > 0.99 → override with colour at step 4`}</pre>
      <p className="mt-3">
        At shallow viewing angles (&lt;15° incidence), the 4-step staircase
        becomes visible on mortar edges. Copy-paste the{" "}
        <code className="bg-zinc-800 px-1 rounded">uv_at_step</code> pattern
        from blueprint.py and extend the cascade to 8 steps for finer results.
        Three.js TSL supports real loops, so runtime POM there can use 16+
        steps without any duplication.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">WebXR export path</h2>
      <p>
        POM does not transfer through glTF 2.0 — the specification has no
        parallax field. The blueprint bakes the POM-shaded colour into a
        1024×1024 UV image and exports that. For a static wall tile seen
        mostly face-on this is indistinguishable from runtime POM. Bake from
        a 30–45° camera angle to capture the most prominent parallax state.
      </p>
      <ol className="list-decimal pl-6 space-y-1 mt-3">
        <li>
          Run blueprint.py — it smart-projects UVs, bakes Diffuse Colour at
          16 Cycles samples, writes{" "}
          <code className="bg-zinc-800 px-1 rounded">output/pom_colour_baked.png</code>.
        </li>
        <li>Replace the POM graph with a plain Image Texture node wired to Base Color.</li>
        <li>Export GLB with Apply Modifiers, Y-up, Draco level 6, WebP.</li>
        <li>
          For a runtime parallax shader, implement it in Three.js TSL — the{" "}
          <code className="bg-zinc-800 px-1 rounded">Loop()</code> node lets you use
          16–32 steps without manual duplication.
        </li>
      </ol>

      <h2 className="text-xl font-semibold mt-8 mb-3">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Parallax direction is inverted</strong> — bricks appear to
          recede rather than protrude. Negate HEIGHT_SCALE (set to
          &minus;0.06). This happens when the UV winding handedness is &minus;1
          and the bitangent cross-product points the wrong way.
        </li>
        <li>
          <strong>No parallax at all despite HEIGHT_SCALE = 0.06</strong> — the
          Tangent node is in Radial mode instead of UV Map, or the mesh has no
          UV channel. Confirm the mode and check{" "}
          <em>Properties → Data → UV Maps</em>.
        </li>
        <li>
          <strong>Visible staircase on mortar edges at oblique angles</strong>{" "}
          — 4 steps is insufficient. Extend to 8 by duplicating the{" "}
          <code className="bg-zinc-800 px-1 rounded">uv_at_step</code> block with
          fractions 0.125, 0.25, 0.375, 0.50, 0.625, 0.75, 0.875, 1.00.
        </li>
        <li>
          <strong>EEVEE shows correct POM but Cycles bake looks flat</strong> —
          bake type must be <strong>Diffuse</strong> with{" "}
          <em>Direct + Indirect off, Colour on</em>. The bake captures the
          shader colour including the POM UV offset.
        </li>
        <li>
          <strong>dot_N clamp warning: grazing angle artefacts</strong> — at
          exactly 90° incidence (looking parallel to the surface), dot_N
          approaches zero and the offset blows up before clamping. Clamp
          HEIGHT_SCALE to ≤ 0.08 for meshes that can be viewed at very oblique
          angles, or add a per-pixel smooth step that fades HEIGHT_SCALE to
          zero below dot_N = 0.1.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Related studio work</h2>
      <p>
        For view-independent texturing without UVs, see{" "}
        <Link href="/tutorials/blender-tutorial-shader-triplanar-projection-no-uv-hard-surface-webxr" className={lk}>
          Triplanar Projection
        </Link>
        , which uses the geometry normal rather than the view direction. The
        baking pipeline here mirrors{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          Texture Baking: Normal + AO
        </Link>
        — combine both bakes for maximum fidelity in WebXR. For the full set
        of glTF 2.0 parameters that actually export, consult the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
          Principled BSDF v2 full glTF parameter map
        </Link>
        . AOV passes for separating brick and mortar channels are in{" "}
        <Link href="/tutorials/blender-tutorial-shader-aov-custom-render-passes" className={lk}>
          Shader — AOV Custom Render Passes
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/shader_nodes/input/tangent.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Tangent Node — Blender Manual (CC BY, Blender Foundation)
          </a>{" "}
          · related:{" "}
          <a
            href="https://github.com/blender/blender"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            blender/blender (GPL v2+, Blender Foundation)
          </a>
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/shader_nodes/converter/vector_math.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Vector Math Node — Blender Manual (CC BY, Blender Foundation)
          </a>
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/tree/dev/src/nodes"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Three.js NodeMaterial / TSL source (MIT, mrdoob &amp; contributors)
          </a>{" "}
          · related:{" "}
          <a
            href="https://github.com/mrdoob/three.js"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            mrdoob/three.js
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open blueprint.py in the Blender Text Editor and press Alt+P. The script clears the scene, builds a 2m plane with smart-projected UVs, constructs the POM_BrickWall material with its full tangent-space node graph, bakes the POM colour to output/pom_colour_baked.png at 16 Cycles samples, then exports output/wall_tile_pom.glb. Confirm '[holoflow] wall_tile_pom complete' in the System Console.",
      },
      {
        title: "Inspect the tangent-space section",
        body: "Select wall_tile_pom and open the Shader Editor. Find the Geometry node (Incoming, Normal outputs) and the Tangent node (UV Map mode). Trace the three DotProduct Vector Math nodes: dot_T (Incoming · Tangent), dot_B (Incoming · Bitangent via CrossProduct), dot_N (Incoming · Normal). These three scalars are the view ray decomposed into the UV coordinate frame.",
      },
      {
        title: "Follow the offset chain",
        body: "From dot_T and dot_B, follow each through a Math(DIVIDE) node whose denominator is dot_N clamped to 0.001, then through Math(MULTIPLY, HEIGHT_SCALE). The outputs ofs_x and ofs_y are the full parallax UV shift for the deepest possible surface point. Each of the five uv_at_step groups multiplies ofs_x and ofs_y by its step fraction (0, 0.25, 0.50, 0.75, 1.00) before adding to the base UV and sampling the BrickTexture.",
      },
      {
        title: "Live HEIGHT_SCALE tweak",
        body: "In the Shader Editor, locate the two Math(MULTIPLY) nodes that hold the HEIGHT_SCALE value (0.06 each). Select one and change its Value input from 0.06 to 0.01, then 0.12, watching in the EEVEE Next Rendered viewport. At 0.01 the bricks look nearly flat; at 0.12 they over-extrude at oblique angles. Return to 0.06 for the production setting. Change the second MULTIPLY to match.",
      },
      {
        title: "Orbit and observe the cascade",
        body: "With EEVEE Next Rendered shading active, slowly orbit from overhead (Numpad 7) to 30° oblique. At overhead the brick pattern is flat. By 30° oblique the bricks visibly protrude — mortar lines shift correctly. At 60° the staircase artefact from 4 steps may be visible on mortar edges at extreme angles; extend to 8 steps by duplicating the uv_at_step pattern to eliminate it.",
      },
      {
        title: "Record viewport.mp4",
        body: "Save the .blend, then run record.py in a new Text Editor tab. It adds a camera, keyframes an arc from 90° overhead to 30° oblique over 60 frames, and renders 90 frames at 30fps via EEVEE Next to public/library/videos/…/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Bricks appear to recede rather than protrude",
        cause: "The UV winding handedness is −1, so the Bitangent cross-product direction is flipped.",
        fix: "Negate HEIGHT_SCALE — set both MULTIPLY nodes from 0.06 to −0.06. Alternatively, swap the inputs on the CrossProduct node (Tangent into input 0, Normal into input 1) to produce the correct-handed bitangent.",
      },
      {
        symptom: "No parallax visible despite HEIGHT_SCALE set correctly",
        cause: "Tangent node is in Radial mode, or the mesh has no UV channel assigned.",
        fix: "In the Shader Editor, select the Tangent node and confirm Direction Type = UV Map. Check Properties → Object Data Properties → UV Maps; add a UV map if the list is empty, then re-run smart_project.",
      },
      {
        symptom: "Bake renders entirely black",
        cause: "The Image Texture node added for baking is not the active (selected orange) node.",
        fix: "Click the bake_node Image Texture node header so its outline turns orange. Only the active node receives the bake result — being selected (white outline) is not sufficient.",
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-parallax-occlusion-mapping-wall-tile-webxr",
    title:
      "Shader — Parallax Occlusion Mapping: Fake-Depth Brick Wall via Tangent-Space View Decomposition",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "Build a 4-step steep parallax occlusion shader in Blender 5.1 node graph — decompose the view ray into tangent space with three dot products, cascade height comparisons via Mix+GreaterThan nodes, then bake the POM colour for WebXR GLB export.",
    tags: [
      "blender",
      "shading",
      "parallax",
      "pom",
      "tangent-space",
      "brick-wall",
      "hard-surface",
      "webxr",
      "baking",
      "glb",
      "eevee-next",
    ],
    Body: POMBody,
  },
);
