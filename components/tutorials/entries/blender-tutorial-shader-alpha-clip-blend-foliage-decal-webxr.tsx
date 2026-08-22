import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AlphaClipBlendFoliageBody() {
  return (
    <>
      <p>
        Real-time transparency resolves to exactly two delivery modes:{" "}
        <strong>CLIP</strong> (binary cut-out, no sorting, correct shadows
        possible) and <strong>BLEND</strong> (full semi-transparency,
        painter's algorithm, depth-sort dependent). Choosing wrong causes
        sorting flicker in the browser or opaque shadows on the floor. This
        tutorial builds a leaf cluster in CLIP mode and a holographic decal
        in BLEND mode, wires their EEVEE shadow behaviour, and exports both
        to a GLB with the correct{" "}
        <code className="px-1 bg-zinc-800 rounded">alphaMode</code> on each
        material.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">The three modes</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`blend_method   glTF alphaMode   Shadow (EEVEE)      Sorting needed
─────────────────────────────────────────────────────────────────────
'OPAQUE'       OPAQUE           full opaque         none
'CLIP'         MASK             clipped             none
'BLEND'        BLEND            hashed / none       painter's alg
'HASHED'       BLEND (fallback) hashed approx.      stochastic`}</pre>
      <p className="mt-3">
        <strong>HASHED</strong> has no glTF equivalent — the exporter silently
        maps it to BLEND, discarding the stochastic pattern. Never design a
        WebXR material around HASHED; use CLIP if the edge can be binary.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Key bpy properties</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`mat.blend_method        # 'OPAQUE' | 'CLIP' | 'BLEND' | 'HASHED'
mat.alpha_threshold     # float 0–1  →  alphaCutoff in glTF MASK
mat.shadow_method       # 'NONE' | 'OPAQUE' | 'CLIP' | 'HASHED'
mat.use_backface_culling = False   # → material.doubleSided: true`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">Leaf material: CLIP</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`mat.blend_method    = "CLIP"
mat.alpha_threshold = 0.42   # → alphaCutoff: 0.42
mat.shadow_method   = "CLIP" # EEVEE alpha-clipped shadow

# Procedural leaf-shape (Object space):
# TexCoord(Object) → Mapping(scale X×1.2 Y×2.2)
#   Gradient(SPHERICAL) → ColorRamp(0.40–0.58)  — oval body
#   Noise(scale=14)     → ColorRamp(0.35–0.55)  — serrated edge
# Math(MULTIPLY) → BSDF.Alpha`}</pre>
      <p className="mt-3">
        Threshold at 0.42 keeps the leaf body solid while noise creates edge
        serration. Raising it tightens the cut; below 0.10 the body itself
        starts eroding.
      </p>
      <p className="mt-2">
        The cluster uses three crossed planes (billboarding approximation)
        because{" "}
        <code className="px-1 bg-zinc-800 rounded">use_backface_culling = False</code>{" "}
        makes each plane visible from both sides ({" "}
        <code className="px-1 bg-zinc-800 rounded">doubleSided: true</code> in
        glTF), and crossing three of them produces convincing volume from all
        viewing angles without a full 3D mesh.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Hologram material: BLEND</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`mat.blend_method  = "BLEND"
mat.shadow_method = "NONE"  # hologram casts no shadow

# Radial fade (UV space):
# TexCoord(UV) → Gradient(SPHERICAL)
# Math(SUBTRACT, 1.0, fac) → inverts: centre=1, edge=0
# ColorRamp(0.30–0.85) → BSDF.Alpha
# Emission Strength = 1.8  (SDR-safe, reads as light source)`}</pre>
      <p className="mt-3">
        Values above ~4.0 require{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_emissive_strength</code>{" "}
        support — check the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF v2 export map
        </Link>{" "}
        for viewer compatibility. Overlapping BLEND planes flicker in WebXR
        due to painter's-algorithm depth sorting — keep them non-overlapping
        in world space, or prefer CLIP wherever the silhouette can be binary.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Transparent shadows in Cycles
      </h2>
      <p>
        EEVEE's <code className="px-1 bg-zinc-800 rounded">shadow_method</code>{" "}
        handles this automatically. In Cycles you must wire a{" "}
        <strong>Light Path</strong> bypass:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-2">{`Light Path → Is Shadow Ray → Mix Shader(Fac)
  Shader 1: Principled BSDF   ← camera/reflection rays (fac=0)
  Shader 2: Transparent BSDF  ← shadow rays let light pass (fac=1)`}</pre>
      <p className="mt-3">
        This is Cycles-only and does not export to glTF. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-shadow-catcher-holdout-ar-composite"
          className={lk}
        >
          Shadow Catcher + Holdout for AR
        </Link>{" "}
        tutorial for the compositing counterpart.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Studio cross-references</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
            className={lk}
          >
            Principled BSDF v2 → glTF Export Map
          </Link>{" "}
          — full socket map including Alpha destinations, emission strength
          limits, and KHR_materials_* extension coverage.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-eevee-shadow-catcher-holdout-ar-composite"
            className={lk}
          >
            Shadow Catcher + Holdout for AR Compositing
          </Link>{" "}
          — holds out a floor plane and composites a real shadow over a live
          camera feed; pairs with this tutorial's EEVEE shadow_method setup.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-texture-baking-normal-ao"
            className={lk}
          >
            Texture Baking: Normal + AO
          </Link>{" "}
          — bake a high-poly sculpted alpha into a texture for the CLIP
          material's Alpha socket instead of a procedural mask.
        </li>
        <li>
          <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
            Blender to Site Asset Pipeline
          </Link>{" "}
          — end-to-end GLB → Three.js delivery; castShadow, alphaTest, and
          transparent flags on the runtime side.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO (Apache-2.0)
          </a>{" "}
          · writes <code className="px-1 bg-zinc-800 rounded">alphaMode</code>{" "}
          from <code className="px-1 bg-zinc-800 rounded">blend_method</code>{" "}
          and <code className="px-1 bg-zinc-800 rounded">alphaCutoff</code>{" "}
          from <code className="px-1 bg-zinc-800 rounded">alpha_threshold</code>{" "}
          · siblings:{" "}
          <a href="https://github.com/KhronosGroup/glTF" className={lk} target="_blank" rel="noopener noreferrer">glTF spec</a>,{" "}
          <a href="https://github.com/KhronosGroup/glTF-Sample-Viewer" className={lk} target="_blank" rel="noopener noreferrer">Sample Viewer</a>
        </li>
        <li>
          Don McCurdy —{" "}
          <a
            href="https://github.com/donmccurdy/glTF-Transform"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Transform (MIT)
          </a>{" "}
          · inspect alpha modes post-export:{" "}
          <code className="px-1 bg-zinc-800 rounded">npx gltf-transform inspect model.glb</code>{" "}
          · sibling:{" "}
          <a href="https://github.com/donmccurdy/three-gltf-viewer" className={lk} target="_blank" rel="noopener noreferrer">three-gltf-viewer</a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/shading/shader-alpha-clip-blend-foliage-decal-webxr/",
    time: "one focused session (≈ 30 minutes)",
    difficulty: "intermediate",
    cost: "free — all tools are part of Blender",
    software: [
      { name: "Blender", version: "5.1", url: "https://www.blender.org/download/", cost: "free" },
    ],
    prerequisites: [
      "Familiar with Blender's Shader Editor and material properties panel",
      "Know how to run a Python script in the Scripting workspace",
      "Basic understanding of what glTF/GLB is",
    ],
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace. Paste blueprint.py and press Alt+P. Three leaf planes at origin, hologram decal to their right, dark floor. foliage_decal_alpha.glb is written next to the file.",
      },
      {
        title: "Inspect the CLIP material",
        body: "Select leaf_0. In Material Properties confirm blend_method=CLIP, alpha_threshold=0.42, shadow_method=CLIP. Switch to Rendered view (EEVEE). Orbit around the cluster — the leaf shadow on the floor is shaped by the procedural cut-out.",
      },
      {
        title: "Inspect the BLEND material",
        body: "Select holo_decal. Confirm blend_method=BLEND, shadow_method=NONE. The disc glows but casts no shadow. Move it to partially overlap a leaf and orbit the camera — observe the depth-sort artefact.",
      },
      {
        title: "Verify alpha modes and run record.py",
        body: "Terminal: npx gltf-transform inspect foliage_decal_alpha.glb — confirm hs_leaf_clip→MASK/0.42, hs_holo_blend→BLEND, floor→OPAQUE. Then run record.py (Alt+P) to render viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Leaf shadow is fully opaque rather than cut-out shaped",
        cause: "mat.shadow_method is still 'OPAQUE' (the default) — ignores the alpha mask.",
        fix: "Set bpy.data.materials['hs_leaf_clip'].shadow_method = 'CLIP' and re-render.",
      },
      {
        symptom: "GLB shows alphaMode: BLEND on the leaf, not MASK",
        cause: "blend_method was set to 'BLEND' instead of 'CLIP'.",
        fix: "Confirm mat.blend_method == 'CLIP' before calling export_glb(). Re-export.",
      },
      {
        symptom: "Hologram clips through leaves in WebXR",
        cause: "BLEND sorting artefact — engine sorts by bounding-box centre, not per pixel.",
        fix: "Move holo_decal so its centre is clearly behind the leaf cluster depth-wise.",
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-alpha-clip-blend-foliage-decal-webxr",
    title:
      "Shader — Alpha Clip vs Alpha Blend: Foliage Planes, Decals & Transparent Shadow for WebXR",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "Pick correctly between CLIP and BLEND alpha modes, wire EEVEE transparent shadows, and export a leaf cluster plus hologram decal to GLB with the right alphaMode on each material.",
    tags: ["blender", "shading", "alpha", "transparency", "foliage", "decal", "gltf", "webxr", "glb", "eevee"],
    Body: AlphaClipBlendFoliageBody,
  },
);
