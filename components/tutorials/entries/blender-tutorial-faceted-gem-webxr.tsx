import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function Body() {
  return (
    <>
      <p>
        The faceted gem is the studio&rsquo;s reference object for the
        low-poly stylised aesthetic. One mesh, 25 faces, zero texture
        maps — every visual decision is carried by the geometry and the
        shader. Getting the material right means understanding why a
        CONSTANT ColorRamp applied to a Fresnel signal produces hard
        cel bands instead of a gradient, and why flat shading is not a
        simplification but a deliberate signal about face normals.
      </p>

      <p>
        This tutorial builds the gem entirely through the bpy data API
        — no <code>bpy.ops</code> geometry calls. That discipline pays
        off the moment you need to run the script headless, embed it in
        an add-on, or batch-produce a hundred gem variants without
        relaunching Blender. The mesh is a direct translation of how a
        lapidary describes a brilliant cut: table, crown, girdle,
        pavilion, culet. Each ring is a separate vertex loop and each
        zone is a separate face type, so the topology is readable months
        later.
      </p>

      <p>
        The material technique &mdash; <strong>cel refraction</strong>
        &mdash; is EEVEE Next only. It works by taking the
        viewing-angle signal from a Layer Weight node, snapping it to
        three hard colour steps via a CONSTANT ColorRamp, then using
        that stepped value to mix between the full Principled BSDF
        (the glass body) and an emission node (the rim highlight). The
        result reads as stylised glass without requiring ray-traced
        caustics or screen-space refraction at a cost the Quest 3 can
        afford.
      </p>

      <p>
        Cross-references for context:
      </p>
      <ul>
        <li>
          <Link href="/articles/low-poly-high-facet-shading">
            Low-poly high-facet shading
          </Link>{" "}
          — the art-direction rationale behind why faceting reads as
          intentional rather than unfinished.
        </li>
        <li>
          <Link href="/articles/advanced-cell-shading-techniques">
            Advanced cell-shading techniques
          </Link>{" "}
          — the broader Shader-to-RGB toolkit this material draws from.
        </li>
        <li>
          <Link href="/tutorials/blender-to-site-asset-pipeline">
            Blender to site asset pipeline
          </Link>{" "}
          — where the GLB this tutorial exports goes next.
        </li>
        <li>
          <Link href="/atelier/scene-stage-demo">
            Scene Stage demo
          </Link>{" "}
          — the WebXR stage the gem is designed to sit in.
        </li>
        <li>
          <Link href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds">
            Cohesive low-poly cell-shaded VRM worlds
          </Link>{" "}
          — art direction that governs the whole prop language the gem
          belongs to.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug:  "blender-tutorial-faceted-gem-webxr",
  title: "Faceted gem — bmesh construction + cel refraction in Blender 5.1",
  date:  "2026-05-19",
  kind:  "tutorial",
  excerpt:
    "Build a 25-face octagonal brilliant-cut gem through the bpy data API, flat-shade every polygon for the faceted look, and wire a cel-refraction material in EEVEE Next. Export to GLB for the Holoflow WebXR pipeline.",
  Body,
  related: [
    {
      href:  "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note:  "The art-direction case for faceting as an intentional aesthetic choice.",
    },
    {
      href:  "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note:  "The full export pipeline; this tutorial's GLB goes through it.",
    },
    {
      href:  "/articles/advanced-cell-shading-techniques",
      label: "Article — Advanced cell-shading techniques",
      note:  "Deeper coverage of Shader-to-RGB and ColorRamp trickery.",
    },
    {
      href:  "/atelier/scene-stage-demo",
      label: "Atelier — Scene Stage demo",
      note:  "Live WebXR viewer; load the exported GLB here to see it in XR.",
    },
    {
      href:  "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note:  "Art direction for the broader world the gem prop belongs to.",
    },
  ],
  furtherReading: [
    {
      href:  "https://docs.blender.org/api/current/",
      label: "Blender Python API Reference — docs.blender.org",
      note:  "Authoritative bpy / bmesh documentation. Licence: CC BY-SA 4.0, Blender Foundation.",
    },
    {
      href:  "https://github.com/SebLague/Coding-Adventures",
      label: "Sebastian Lague — Coding Adventures (GitHub, MIT)",
      note:  "Crystal and refraction shader research; the light-bending logic this material's IOR choice draws from. Sibling projects: Marching Cubes, Procedural Stochastic Texturing.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time:       "2–3 hours",
    difficulty: "intermediate",
    cost:       "free — Blender is open-source",
    prerequisites: [
      "Blender 5.1 installed. The tutorial uses the EEVEE Next renderer (default since 4.2).",
      "Basic Python literacy: you should be able to read a script and run it from the Text Editor.",
      "Familiarity with Blender's 3D Viewport navigation (orbit, pan, zoom with middle-mouse).",
    ],
    software: [
      {
        name:      "Blender",
        version:   "5.1",
        url:       "https://www.blender.org/download/",
        cost:      "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Understand the gem topology",
        body:
          "A brilliant cut has five zones: table (flat top N-gon), crown (the angled facets above the girdle), girdle (equatorial edge), pavilion (facets below the girdle that converge), and culet (bottom point or small flat).\n\nThis blueprint uses N=8 (octagonal) for a clean radial count that maps well to a single-mesh UV layout and produces 25 faces total: 1 table + 8 crown quads + 8 upper-pavilion quads + 8 lower-pavilion triangles. Every face type is a different loop in the Python, so you can change N and the whole gem scales correctly.",
      },
      {
        title: "Build the mesh via the data API",
        body:
          "Open the blueprint in Blender's Text Editor (Alt+P to run). The script calls `bpy.data.meshes.new()` and `bmesh.new()` rather than `bpy.ops.mesh.primitive_*`. The difference matters: bpy.ops reads the current active context and will silently no-op if the wrong mode is active. The data API is context-blind.\n\nAfter building the face list, the script calls `bmesh.ops.recalc_face_normals()`. This is not optional — the lower pavilion triangles can end up with inward normals depending on the order their vertices were visited. The recalc pass makes all normals point outward without you having to track winding manually.",
      },
      {
        title: "Apply flat shading",
        body:
          "The single most important line in the script:\n\n```python\nfor poly in mesh.polygons:\n    poly.use_smooth = False\n```\n\nSmooth shading interpolates vertex normals across a face, which blurs specular highlights between adjacent facets — the whole gem looks like an amorphous blob. Flat shading locks every face to its geometric face normal. The specular highlight sits precisely on that face and nowhere else. That is what 'faceted' means at the shader level.",
      },
      {
        title: "Wire the cel-refraction material",
        body:
          "The material has six nodes: Principled BSDF (Transmission Weight=1.0, IOR=1.77), Layer Weight, ColorRamp (CONSTANT), Emission, MixShader, Material Output.\n\nLayer Weight [Fresnel output] → ColorRamp [CONSTANT, 3 stops] → MixShader [Fac]\nPrincipled BSDF → MixShader [input 1]\nEmission → MixShader [input 2]\n\nThe Fresnel output is 0.0 when you are looking directly at a face, 1.0 at grazing angles. CONSTANT interpolation on the ColorRamp snaps that continuous signal to 3 discrete colour levels — the cel step. The MixShader blends between the glass BSDF at head-on angles and the emission colour at edges, so rim edges glow rather than darken.\n\nIn EEVEE Next (Blender 4.2+) you must set `mat.surface_render_method = 'FORWARD'` for transmission to render correctly. The old `blend_method = 'BLEND'` attribute was removed in 4.2 alongside EEVEE Legacy.",
      },
      {
        title: "Tune the ColorRamp stops",
        body:
          "The three stops in `CEL_STOPS` control the three colour bands:\n\n- Stop 0 (position 0.0): the dark interior shadow colour. Keep this saturated but dark.\n- Stop 1 (position 0.55): the ambient mid-tone. This should read as the gem's primary colour.\n- Stop 2 (position 0.82): the rim highlight. Desaturate towards white for a glassy peak.\n\nDrag stop positions in the ColorRamp while watching the viewport. Because the interpolation is CONSTANT, the transition is a hard edge — moving a stop changes how much of the gem surface falls in each band.",
      },
      {
        title: "Export to GLB",
        body:
          "File → Export → glTF 2.0 (.glb/.gltf).\n\nStudio settings:\n- Format: GLB (single binary, not .gltf + textures)\n- Mesh Compression: Draco level 6 — roughly 10–15:1 compression on clean faceted geometry with no visible artefacts\n- Images: WebP\n- Apply Transforms: ticked — bakes the object matrix into vertex positions so the GLB arrives at the correct scale in three.js without a manual transform\n- +Y Up: ticked — three.js and WebXR use +Y up; Blender uses +Z up\n\nThe resulting GLB should be under 10 KB. Verify by drag-dropping it into gltf.report (browser viewer).",
      },
    ],
    finalResult:
      "A 25-face octagonal gem GLB, under 10 KB Draco-compressed, with a cel-refraction material that reads as stylised glass in EEVEE Next. Drop it into the Holoflow SceneStage and it renders on Quest 3 at a negligible triangle budget while holding the cobalt-and-rim aesthetic of the low-poly art direction.",
    variations: [
      "Change N from 8 to 6 for a hexagonal gem (emerald cut silhouette) or 12 for a more circular brilliant. The rest of the script requires no edits.",
      "Replace the Layer Weight Fresnel with a Geometry node's Normal output dot-producted against the camera direction for a view-independent cel pattern that doesn't shift as the gem rotates.",
      "Add a second material slot on the culet vertex group and assign a pure emission material there — makes the bottom point glow as if lit from within.",
      "Use the Geometry Nodes modifier's 'Instance on Points' to scatter a hundred gems along a curve for a bracelet or necklace layout; the low poly count makes this essentially free.",
    ],
    troubleshooting: [
      {
        symptom:
          "The gem looks smooth — no facets visible, just a glossy blob",
        cause:
          "`use_smooth` defaulted to True somewhere, or Shade Smooth was applied after running the script.",
        fix:
          "Select the gem in Object Mode, Right-click → Shade Flat. Or re-run the blueprint.py script (it sets use_smooth=False on every polygon during mesh construction).",
      },
      {
        symptom:
          "Pavilion faces appear black / normals pointing inward",
        cause:
          "The `recalc_face_normals` call didn't run, or the bmesh was modified after the recalc.",
        fix:
          "In Edit Mode, Select All (A), then Mesh → Normals → Recalculate Outside (Shift+N). Or add `bmesh.ops.recalc_face_normals(bm, faces=bm.faces)` before `bm.to_mesh(mesh)`.",
      },
      {
        symptom:
          "Transmission renders as solid grey — no glass effect",
        cause:
          "EEVEE Legacy `blend_method` is set instead of the EEVEE Next `surface_render_method`, or the Principled BSDF socket name is wrong for 5.x.",
        fix:
          "In the material's Python: `mat.surface_render_method = 'FORWARD'`. In the node editor: confirm the Transmission Weight socket is connected (not 'Transmission' — that is the 3.x name).",
      },
      {
        symptom:
          "GLB exports but the gem is tiny / wrong size in three.js",
        cause:
          "`Apply Transforms` was not ticked, so the object scale matrix was not baked.",
        fix:
          "In Object Mode, select the gem, press Ctrl+A → Apply → All Transforms, then re-export with Apply Transforms ticked.",
      },
    ],
  },
  base,
);
