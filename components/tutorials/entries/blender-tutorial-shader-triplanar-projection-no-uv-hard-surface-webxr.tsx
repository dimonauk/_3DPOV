import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function TriplanarBody() {
  return (
    <>
      <p>
        Triplanar projection maps a texture from three axis-aligned planes
        simultaneously and blends the results using the mesh normal as a weight.
        The outcome is seam-free on any topology — no UV layout needed. It is
        the fastest path to a credible rock, concrete or terrain surface when
        UV unwrapping would be impractical or a mesh has no UVs at all.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">How the blend works</h2>
      <p>
        Each of the three projection planes contributes colour in proportion to
        how much the surface normal points toward it. The XY plane
        (&ldquo;top/bottom&rdquo;) dominates when{" "}
        <code className="bg-zinc-800 px-1 rounded">|normal.z| ≈ 1</code>; the
        YZ plane when{" "}
        <code className="bg-zinc-800 px-1 rounded">|normal.x| ≈ 1</code>; the
        XZ plane when{" "}
        <code className="bg-zinc-800 px-1 rounded">|normal.y| ≈ 1</code>.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`w_i   = |n_i| ^ SHARPNESS          (component-wise absolute then power)
sum   = w_x + w_y + w_z
blend = w_i / sum                  (normalise: sum-to-1)
result = col_x·blend_x + col_y·blend_y + col_z·blend_z`}</pre>
      <p className="mt-3">
        The <strong>SHARPNESS</strong> exponent is the key artistic control.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`SHARPNESS  1.0  → smooth blend zone (cloth, organic)
SHARPNESS  4.0  → clean transition  (studio default for hard-surface)
SHARPNESS  8.0  → near-razor seam   (tiled panel, concrete block)`}</pre>
      <p className="mt-3">
        Without the power step, any normal at 45° contributes equally from
        both planes, leaving a visible mid-tone band along diagonal edges.
        Raising to SHARPNESS ≥ 2 squashes those off-axis contributions before
        the sum-normalisation step.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Node architecture</h2>
      <p>Build this in the Shader Editor (or via blueprint.py):</p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`Texture Coordinate → Object
  → Separate XYZ
     ├─ X,Y → Combine XYZ → VectorScale(SCALE) → Noise → ColourRamp   (Z projection)
     ├─ Y,Z → Combine XYZ → VectorScale(SCALE) → Noise → ColourRamp   (X projection)
     └─ X,Z → Combine XYZ → VectorScale(SCALE) → Noise → ColourRamp   (Y projection)

Geometry → Normal
  → Separate XYZ
     ├─ |z|^SHARP → divide(sum) → nw_z ─┐
     ├─ |x|^SHARP → divide(sum) → nw_x  ├─ MixRGB(MIX, A=black) → col×w
     └─ |y|^SHARP → divide(sum) → nw_y ─┘
sum = nw_z + nw_x + nw_y (before normalise)

Three MixRGB(ADD, fac=1.0) cascade → Principled BSDF Base Color`}</pre>
      <p className="mt-3">
        Use <strong>Texture Coordinate → Object</strong> (not Global) for props:
        the texture counter-rotates when the object rotates, which is correct.
        Switch to <strong>Texture Coordinate → Global</strong> for world-aligned
        terrain that should tile across multiple mesh pieces independently.
      </p>
      <p className="mt-3">
        Use <strong>Geometry → Normal</strong>, not a Normal Map node. The
        Geometry normal gives the interpolated shading normal in world space —
        axis-aligned and meaningful for planar weight calculation. A Normal Map
        node outputs a tangent-space perturbation that requires UVs and is
        meaningless here.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Performance trade-off
      </h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`Standard UV mapping : 1 texture sample per pixel
Triplanar           : 3 texture samples per pixel  (+200% sample cost)

Acceptable for:  low-poly WebXR props  (<20k tris),  single mesh terrain
Avoid for:       dense foliage cards,  particle instances,  mobile VR`}</pre>
      <p className="mt-3">
        The extra samples hit both Cycles render time and real-time EEVEE frame
        budget. For assets where UVs are feasible, a properly laid-out UV is
        always cheaper.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Baking for glTF export
      </h2>
      <p>
        Triplanar shaders have no{" "}
        <code className="bg-zinc-800 px-1 rounded">KHR_</code> glTF extension.
        Before GLB export:
      </p>
      <ol className="list-decimal pl-6 space-y-1 mt-3">
        <li>
          Smart UV project the mesh (Edit → UV → Smart UV Project, 70° limit).
        </li>
        <li>
          Add an unlinked <strong>Image Texture</strong> node as the active node
          — Cycles bakes into it.
        </li>
        <li>
          Bake type <strong>Diffuse</strong>, Direct + Indirect off, Colour on.
        </li>
        <li>
          Wire the baked image into{" "}
          <strong>Principled BSDF → Base Color</strong>.
        </li>
        <li>
          Export GLB with <em>Apply Modifiers</em>, Y-up, Draco level 6, WebP.
        </li>
      </ol>
      <p className="mt-3">
        The blueprint.py script handles steps 1–5 automatically with 16 Cycles
        samples (raise to 128+ for production). See{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking: Normal + AO
        </Link>{" "}
        for baking Roughness and Normal channels using the same pattern.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Visible seam band at 45° edges</strong> — SHARPNESS is too
          low. Raise from 1.0 to 4.0 or higher. A faint band at exactly 45°
          is a mathematical artefact of the power method; at SHARPNESS 8 it
          narrows to sub-pixel width.
        </li>
        <li>
          <strong>Texture looks too large / too small</strong> — adjust SCALE.
          Higher SCALE tiles more frequently. Keep proportional to the mesh
          bounding-box size so rock grain appears physically plausible.
        </li>
        <li>
          <strong>Bake renders black</strong> — confirm the Image Texture node
          is both <em>selected</em> and <em>active</em> (click the node
          header; it highlights orange). Only one node is the bake target per
          material.
        </li>
        <li>
          <strong>Normal weight sum goes to zero on flat faces</strong> — rare
          on fully closed meshes; can occur on degenerate geometry. Add{" "}
          <code className="bg-zinc-800 px-1 rounded">Math → Maximum(sum, 0.0001)</code>{" "}
          before the Divide node to prevent division-by-zero artefacts.
        </li>
        <li>
          <strong>GLB viewer shows UV seams despite triplanar</strong> — the
          seams are in the <em>baked UV image</em>, not the shader. Increase
          bake resolution (2048 or 4096) and add a 4-pixel margin in UV
          packing (Smart UV Project → Island Margin 0.01).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Related studio work</h2>
      <p>
        The triplanar pattern extends naturally to the terrain pipeline in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-subdivide-mesh-adaptive-noise-lod"
          className={lk}
        >
          GN Subdivide Mesh — Adaptive Terrain LOD
        </Link>
        . For materials that do export their shader graph to glTF, consult the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF v2 full parameter map
        </Link>
        . The shader node workflow here also supports the AO + Pointiness edge
        highlight technique in{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          Shader — AO + Pointiness Edge Highlight
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/shader_nodes/input/texture_coordinate.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Texture Coordinate Node — Blender Manual (CC BY, Blender
            Foundation)
          </a>{" "}
          · related:{" "}
          <a
            href="https://github.com/blender/blender"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            blender/blender (GNU GPL v2+, Blender Foundation)
          </a>
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/shader_nodes/converter/mix.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Mix Colour Node — Blender Manual (CC BY, Blender Foundation)
          </a>
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/shader_nodes/input/geometry.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            Geometry Node (Shader) — Blender Manual (CC BY, Blender Foundation)
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
        body: "Open blueprint.py in Blender's Text Editor and run it. It clears the scene, builds an irregular boulder (UV sphere + Subdiv + Displace applied), applies the TriplanarRock material, bakes Diffuse to triplanar_baked.png, and exports triplanar_boulder.glb. Confirm '[holoflow] triplanar_boulder complete' in the System Console.",
      },
      {
        title: "Inspect the node graph",
        body: "Select 'boulder' and open the Shader Editor. Follow the flow: Texture Coordinate → Object → Separate XYZ feeds three Combine XYZ nodes (one per projection axis). Each drives a Noise Texture at SCALE×2.0 frequency. Geometry → Normal feeds the weight chain: Separate XYZ → Math(ABSOLUTE) → Math(POWER, 4.0) → ADD → DIVIDE normalise.",
      },
      {
        title: "Adjust SHARPNESS live",
        body: "In the Shader Editor, select any of the three Math(POWER) nodes. Change the Exponent input from 4.0 to 1.0 and watch the seam zone widen in the Rendered viewport. Change to 8.0 and it tightens to near-pixel width. Return to 4.0 for the production setting.",
      },
      {
        title: "Orbit and confirm no seams",
        body: "In Rendered viewport shading (EEVEE Next), slowly orbit the boulder. Inspect the top cap, the equatorial belt, and the underside. No UV seam should be visible at any angle — the triplanar blend is continuous.",
      },
      {
        title: "Switch to Global coords for terrain use",
        body: "In the Shader Editor, select the Texture Coordinate node and change the socket wired into Separate XYZ from 'Object' to 'Global'. Create a second mesh plane alongside the boulder. Both meshes now sample the same world-space texture, tiling seamlessly across the boundary — the terrain use-case.",
      },
      {
        title: "Record viewport.mp4",
        body: "Save the .blend, then run record.py. It keyframes 360° Z-rotation (frames 1–45) and SHARPNESS 4 → 8 (frames 46–90) and renders to public/library/videos/…/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Visible band at 45° diagonal edges",
        cause: "SHARPNESS exponent too low — off-axis contribution not adequately squashed.",
        fix: "Raise SHARPNESS from 1.0 to 4.0 (hard-surface default). A sub-pixel artefact at exactly 45° persists until SHARPNESS ≥ 8; this is mathematically unavoidable with the power method.",
      },
      {
        symptom: "Bake renders entirely black",
        cause: "The Image Texture node is not the active node in the material.",
        fix: "Click the BakeTarget Image Texture node header so it turns orange. Only the active node receives the bake — selected (white outline) is not sufficient.",
      },
      {
        symptom: "Triplanar looks correct in Blender but GLB has UV seams",
        cause: "The baked UV image has insufficient resolution or the UV islands lack padding.",
        fix: "Increase BAKE_RES to 2048 or 4096, and set Island Margin to 0.01 in Smart UV Project to add 4-pixel bleed between islands.",
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-triplanar-projection-no-uv-hard-surface-webxr",
    title:
      "Shader — Triplanar Projection: Seamless No-UV Texturing for Hard-Surface Props & Terrain",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "Build a seamless rock/concrete shader using three axis-aligned projections blended by surface normal, with SHARPNESS-controlled seam width — and bake it to UV images for GLB/WebXR export.",
    tags: [
      "blender",
      "shading",
      "triplanar",
      "no-uv",
      "procedural",
      "hard-surface",
      "terrain",
      "webxr",
      "baking",
      "glb",
      "principled-bsdf",
    ],
    Body: TriplanarBody,
  },
);
