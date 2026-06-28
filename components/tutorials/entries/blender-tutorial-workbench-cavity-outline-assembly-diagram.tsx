import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function WorkbenchCavityOutlineAssemblyDiagramBody() {
  return (
    <>
      <p>
        Blender ships three render engines. Cycles and EEVEE get most of the
        tutorials. <strong>Workbench</strong> — the engine that powers Solid
        viewport mode — can be promoted to a full render engine with a single
        line:{" "}
        <code>scene.render.engine = &apos;WORKBENCH&apos;</code>. No lighting
        rig. No material nodes. Per-object colour from{" "}
        <code>obj.color</code>, cavity gradient from a screen-space AO pass,
        and a Sobel depth-buffer edge outline that fires on every silhouette
        regardless of mesh topology. The result is a technical assembly
        illustration in sub-second viewport preview time — exactly the read you
        want for exploded-part documentation, WebXR UI wireframes, and
        print-ready blueprint sheets.
      </p>
      <p className="mt-3">
        This technique is the opposite end of the quality spectrum from the
        full PBR pipeline in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
          Principled BSDF v2 → glTF PBR tutorial
        </Link>
        . Where that pipeline bakes lighting intent into material parameters,
        Workbench strips everything back to <em>shape and colour</em>. Compare
        it also with{" "}
        <Link href="/tutorials/blender-tutorial-freestyle-npr-line-rendering" className={lk}>
          Freestyle NPR Line Rendering
        </Link>
        , which draws topology-aware lines in a post-process pass. Workbench
        outline is cheaper and fires on depth breaks, not edge angle — a different
        tool for a different read. The explode animation itself uses the same
        per-object offset logic as the{" "}
        <Link href="/tutorials/blender-tutorial-gn-separate-geometry-exploded-view" className={lk}>
          GN Separate Geometry — Exploded View tutorial
        </Link>
        , but driven by keyframes here rather than a Geometry Nodes group.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why Object Color, not materials?
      </h2>
      <p>
        <code>obj.color</code> is an RGBA property on every Blender object that
        almost nobody touches because Cycles and EEVEE shaders ignore it by
        default (you have to pipe it in via an Object Info → Color node). In
        Workbench with{" "}
        <code>scene.display.shading.color_type = &apos;OBJECT&apos;</code> it
        becomes the sole colour source. This means you can assign five distinct
        colours to five parts of an assembly with five lines of Python — no
        material creation, no node editing — and change any colour later
        without touching the shader graph. The same .blend can render as a
        flat blueprint in Workbench and as a fully lit PBR prop in EEVEE Next
        simply by swapping the engine.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`# Assign unique colours to each part
parts = {"housing": housing_obj, "lens": lens_obj, ...}
colours = {
    "housing": (0.20, 0.40, 0.82, 1.0),  # slate-blue
    "lens":    (0.92, 0.68, 0.08, 1.0),  # amber
    ...
}
for name, obj in parts.items():
    obj.color = colours[name]

# Workbench reads obj.color when color_type = 'OBJECT'
scene.display.shading.color_type = "OBJECT"`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Cavity shading — two modes
      </h2>
      <p>
        <code>show_cavity = True</code> enables a gradient that darkens
        concavities and brightens ridges, giving the flat colour render its
        sense of depth without any light source.{" "}
        <code>cavity_type</code> has three values:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>
          <strong>SCREEN</strong> — fast screen-space AO. Cheap, good for
          viewport work. Misses recesses that face away from the camera.
        </li>
        <li>
          <strong>WORLD</strong> — curvature-map. Derives cavity from mesh
          normals, not the depth buffer. Captures the underside of a dome even
          when it faces away from camera. More expensive.
        </li>
        <li>
          <strong>BOTH</strong> — runs both passes, composites them. Highest
          quality; roughly 2× the SCREEN cost. Use for final print renders.
        </li>
      </ul>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`sh = scene.display.shading
sh.show_cavity             = True
sh.cavity_type             = "SCREEN"   # or "WORLD" or "BOTH"
sh.curvature_ridge_factor  = 1.0        # brighten ridges
sh.curvature_valley_factor = 0.8        # darken valleys (0.8 = soft)`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Edge outline — depth-buffer Sobel
      </h2>
      <p>
        <code>show_object_outline = True</code> runs a Sobel operator over the
        depth buffer on every redraw. Any pixel where depth changes sharply
        (object silhouette or part-to-part junction) receives the outline
        colour. This is <em>not</em> topology-aware — it is purely a depth
        discontinuity detector — so it fires on the seam between two touching
        parts just as it does on a mesh silhouette. For an assembly diagram
        this is exactly right: each part reads as a distinct body. The
        trade-off is that you cannot suppress specific edges (e.g. a hidden
        seam line inside a solid). That control belongs to Freestyle.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`sh.show_object_outline  = True
sh.object_outline_color = (0.95, 0.95, 0.95)  # near-white on dark background
# No alpha channel — the outline blends with the render internally`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Explode animation — keyframed offsets
      </h2>
      <p>
        Each part has a pre-calculated world-space explode vector stored as a
        Python constant. The animation is created by inserting two location
        keyframes per object — assembled at frame 1, offset at frame 60 —
        then setting <code>BEZIER / AUTO</code> easing for a mechanical ease-in-out.
        No rigging, no GN group, no constraints: this approach is the fastest
        to author and the easiest to edit (just move the frame-60 location).
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-2 overflow-x-auto">
{`EXPLODE_OFFSETS = {
    "base_plate":   Vector(( 0.0,  0.0, -1.4)),
    "housing":      Vector(( 0.0,  0.0,  0.4)),
    "emitter_ring": Vector(( 1.4,  0.0,  0.0)),
    "lens":         Vector(( 0.0,  0.0,  1.6)),
    "support_arm":  Vector((-1.6,  0.0,  0.0)),
}

for name, obj in parts.items():
    base = assembled_locs[name]
    scene.frame_set(1)
    obj.location = base
    obj.keyframe_insert("location", frame=1)
    scene.frame_set(60)
    obj.location = base + EXPLODE_OFFSETS[name]
    obj.keyframe_insert("location", frame=60)
    # Ease via fcurve interpolation
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path == "location":
            for kf in fc.keyframe_points:
                kf.interpolation = "BEZIER"
                kf.easing        = "AUTO"`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export — flat Emission materials
      </h2>
      <p>
        Workbench colours do not survive a GLB export — the engine bypasses
        the glTF material system entirely. To ship the pod to WebXR, the
        blueprint creates a flat Emission material per part (strength 1.0, so
        no KHR_materials_emissive_strength extension needed) matching each
        part&apos;s Object Color, assigns it, then exports. This is the nearest
        glTF equivalent of Workbench flat shading; the formal glTF concept is
        the{" "}
        <a
          href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          KHR_materials_unlit extension
        </a>{" "}
        (CC-BY-4.0, Khronos Group), which marks a material to be rendered
        without lighting in any compliant viewer. Blender&apos;s glTF-Blender-IO
        exporter does not yet emit KHR_materials_unlit automatically from
        Emission nodes; it must be toggled via
        &nbsp;<code>material.surface_render_method = &apos;BLENDED&apos;</code>&nbsp;
        in the material panel when that support lands.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <strong>Render looks grey, not coloured.</strong> Confirm{" "}
          <code>sh.color_type = &apos;OBJECT&apos;</code> and that{" "}
          <code>obj.color</code> is set (default is white, so all parts look
          the same shade of grey if unset).
        </li>
        <li>
          <strong>No cavity visible.</strong>{" "}
          <code>show_cavity</code> only activates in Solid shading mode (not
          Material Preview). Ensure viewport shading is Solid or the engine is
          WORKBENCH.
        </li>
        <li>
          <strong>No edge outline on render.</strong> Outline is a viewport
          feature; it renders when engine = WORKBENCH. If you accidentally
          switched to EEVEE for a final render, re-set the engine.
        </li>
        <li>
          <strong>Explode keyframes missing.</strong> Verify{" "}
          <code>obj.animation_data</code> is not None after the first
          keyframe insert — it is created on first call. If running blueprint.py
          twice, existing keyframes may stack; call <code>reset_scene()</code>{" "}
          at the top of the script to clear all previous data.
        </li>
        <li>
          <strong>GLB looks dark in Three.js.</strong> Emission materials at
          strength 1.0 export as{" "}
          <code>emissiveFactor: [r, g, b]</code> with no
          KHR_materials_emissive_strength, so values above 1.0 aren&apos;t
          needed. Ensure Three.js tone mapping is set to{" "}
          <code>THREE.NoToneMapping</code> for unlit flat-colour assets, or the
          tone-map compresses the flat whites.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/render/workbench/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Workbench Renderer
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation). Full reference for all Workbench
          shading modes, lighting types, and cavity settings. Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KHR_materials_unlit — Khronos Group
          </a>{" "}
          (CC-BY-4.0). The glTF specification for flat, unlit materials —
          the runtime-side counterpart of Workbench flat shading. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>
          .
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
        body: "Open Blender 5.1, Scripting workspace. Open blueprint.py → Run Script. A 5-part sensor pod appears: base plate, housing, emitter ring, dome lens, support arm — each a different colour.",
      },
      {
        title: "Confirm Workbench engine",
        body: "Render Properties (camera icon) → Engine = Workbench. In the 3D viewport, shading should be Solid. The pod shows flat colour per part with cavity shading darkening the grooves around the emitter ring.",
      },
      {
        title: "Toggle cavity type live",
        body: "N panel → Viewport Shading. Toggle Cavity off: parts look flat, no depth gradient. Toggle back on. Switch Cavity Type from SCREEN to WORLD: the underside of the lens dome darkens even when facing away from camera.",
      },
      {
        title: "Inspect edge outline",
        body: "In Viewport Shading tick Object Outline. A near-white edge fires on every part silhouette and the seam between adjacent parts. Untick: the parts merge visually. This is the Sobel depth-buffer pass — not mesh topology.",
      },
      {
        title: "Play explode animation",
        body: "Numpad 0 → camera view. Press Space. Over 60 frames the five parts separate — lens rises, housing lifts, emitter ring slides right, support arm exits left, base drops. Ease-in-out on each part. Scrub back to frame 1 to inspect assembled state.",
      },
      {
        title: "Check object colours in Properties",
        body: "Select any part → Object Properties (orange square) → Visibility → Object Color. Each part has a unique RGBA. Change a colour: it updates instantly in the viewport (Workbench reads obj.color live). This is the source that the Workbench OBJECT colour mode uses.",
      },
      {
        title: "Inspect the GLB flat emission",
        body: "In a terminal: python -c \"import json,zipfile; z=zipfile.ZipFile('workbench_sensor_pod.glb'); d=json.loads(z.read('model.gltf')); print([m['name'] for m in d['materials']])\". Confirm 5 emit_ materials, one per part.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Scripting workspace → Open record.py → Run Script. Renders 60 PNG frames via Workbench then encodes to public/library/videos/rendering/workbench-cavity-outline-assembly-diagram/viewport.mp4 via ffmpeg.",
      },
      {
        title: "Record screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Four takes: engine comparison, cavity demo, outline demo, explode playback. Save to public/library/videos/rendering/workbench-cavity-outline-assembly-diagram/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-workbench-cavity-outline-assembly-diagram",
    title:
      "Workbench Renderer — Technical Blueprint: Cavity Shading, Edge Outline & Colour-by-Object Exploded Assembly Diagram (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "The Workbench engine (scene.render.engine='WORKBENCH') renders flat obj.color with screen-space cavity shading and a Sobel depth-buffer edge outline — no lights, no material nodes. Build a 5-part sensor pod, assign per-part colours, drive a 60-frame ease-in-out explode animation with keyframed offsets, and export flat Emission GLB for WebXR. Ideal for assembly diagrams, technical blueprints, and WebXR UI wireframes.",
    Body: WorkbenchCavityOutlineAssemblyDiagramBody,
  },
);
