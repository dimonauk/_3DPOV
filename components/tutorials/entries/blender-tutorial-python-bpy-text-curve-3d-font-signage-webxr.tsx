import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.TextCurve</code> is the data-block Blender assigns when
        you call{" "}
        <code>bpy.data.curves.new(name, type=&apos;FONT&apos;)</code> — the same
        C struct that powers the Text Object in the viewport, but writable
        without any operator or active-object context. It lives in{" "}
        <code>bpy.data.curves</code> alongside the CURVE and SURFACE sub-types;
        the Python type of the returned object depends entirely on the{" "}
        <code>type</code> argument at creation time. A TextCurve extends the
        base Curve data model with a <code>body</code> string, a{" "}
        <code>font</code> reference to a loaded{" "}
        <code>bpy.types.VFont</code> data-block, per-character formatting
        through <code>body_format</code>, and all the extrusion/bevel controls
        from the parent Curve type — the same controls that the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-curve-data-bezier-nurbs-spline-api"
          className={lk}
        >
          Bézier &amp; NURBS Spline API tutorial
        </Link>{" "}
        covers at the spline level. The contrast with the Geometry Nodes
        approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-string-to-curves-3d-text"
          className={lk}
        >
          GN String to Curves tutorial
        </Link>{" "}
        is meaningful: GN String to Curves is a real-time procedural modifier
        with parametric control; TextCurve scripting produces a static
        data-block with full per-character formatting and a convert-to-mesh
        pipeline at the end — what you want when the GLB is the deliverable.
      </p>
      <p>
        Converting a TextCurve to Mesh is a one-way trip.{" "}
        <code>bpy.ops.object.convert(target=&apos;MESH&apos;)</code> replaces{" "}
        <code>obj.data</code> in place and orphans the TextCurve data-block.
        The technique here sets <code>view_layer.objects.active</code>{" "}
        explicitly before each call — the same context requirement that the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          Context Override &amp; Mesh Repair tutorial
        </Link>{" "}
        covers for batch pipelines using <code>temp_override</code>. After
        conversion, Smart UV Project resolves the three face-normal families
        of an extruded glyph mesh (front caps, back caps, side quads) cleanly
        and treats each glyph as its own UV island. A bmesh backing panel uses
        the converted mesh&rsquo;s vertex extents for exact sizing — the same
        extrude-region approach as the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
          className={lk}
        >
          BMesh Ops hard-surface prop tutorial
        </Link>.
      </p>
      <p>
        The output is a GLB suited to WebXR environment signage: three named
        mesh nodes (SignMain, SignSub, SignPlate), two Principled BSDF
        materials, Draco-compressed geometry, and WebP textures.{" "}
        <code>holoflow:facet = False</code> on all three objects ensures smooth
        normals — the rounded bevel highlight on extruded text edges requires
        smooth shading; flat (faceted) normals would alias it into a harsh band.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bpy-text-curve-3d-font-signage-webxr",
  title:
    "Python bpy.types.TextCurve — 3D Font Object Scripting, Custom Font Loading & Mesh Conversion for WebXR Signage (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial" as const,
  excerpt:
    "bpy.data.curves.new(name, 'FONT') returns a bpy.types.TextCurve without operator context. Covers body / font / size / extrude / bevel_depth / bevel_resolution / align / space_character, per-character material_index via body_format, bpy.data.fonts.load() with Bfont fallback, convert-to-mesh with explicit view_layer assignment, Smart UV Project on the glyph mesh, and GLB export for WebXR signage.",
  tags: [
    "blender",
    "python",
    "scripting",
    "text",
    "font",
    "typography",
    "textcurve",
    "webxr",
    "glb",
    "signage",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-text-curve-3d-font-signage-webxr",
    time: "forty-five minutes to one hour",
    difficulty: "intermediate" as const,
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts in the Scripting workspace",
      "Understands bpy.data vs bpy.ops creation — see the Bézier & NURBS Spline API tutorial",
      "Familiar with GLB export settings for WebXR projects",
    ],
    steps: [
      {
        title: "Create a TextCurve via the data API — no bpy.ops",
        body: "bpy.data.curves.new(name, type='FONT') returns bpy.types.TextCurve directly:\n\n  tc = bpy.data.curves.new('sign_main', type='FONT')\n  obj = bpy.data.objects.new('SignMain', tc)\n  bpy.context.scene.collection.objects.link(obj)\n\nThe type argument distinguishes three sub-types stored in bpy.data.curves:\n  type='CURVE'   → bpy.types.Curve          (splines, paths)\n  type='SURFACE' → bpy.types.SurfaceCurve   (NURBS patches)\n  type='FONT'    → bpy.types.TextCurve      (3D text)\n\nAll three share the same bpy.data.curves registry. You cannot change type after creation; delete the data-block and recreate it. The object is linked manually — no operator context or active-object requirement at this stage.",
      },
      {
        title: "Typography: size, extrude, bevel, alignment, spacing",
        body: "All controls live on the TextCurve data-block:\n\n  tc.body             = 'HOLOFLOW'\n  tc.font             = font            # bpy.types.VFont\n  tc.size             = 0.5             # character height in Blender units\n  tc.extrude          = 0.07            # depth behind the face plane\n  tc.bevel_mode       = 'ROUND'         # explicit; 'ROUND' is default\n  tc.bevel_depth      = 0.010           # bevel edge radius\n  tc.bevel_resolution = 2              # 0=flat chamfer, 2=smooth arc\n  tc.align_x          = 'CENTER'        # LEFT / CENTER / RIGHT / JUSTIFY / FLUSH\n  tc.align_y          = 'CENTER'        # TOP / TOP_BASELINE / CENTER / BOTTOM\n  tc.space_character  = 1.0            # tracking (1.0 = default)\n  tc.shear            = 0.0            # oblique slant: 0.2 ≈ synthetic italic\n\nbevel_resolution controls arc quality:\n  0  → one flat chamfer face per original edge\n  1  → two faces (visible highlight arc)\n  2  → three faces (smooth at typical WebXR viewing distances ≥ 0.5 m)\n\ntc.extrude = 0 and tc.bevel_depth = 0 together produce a flat outline that converts to a mesh with no fill faces — only the outline edges. Set extrude > 0 to generate cap geometry.\n\ntc.align_y = 'CENTER' places the text block centred on the object origin, making the origin the natural pivot for world placement. 'TOP_BASELINE' aligns to the cap-height baseline — useful when stacking multiple text objects at a known Y position.",
      },
      {
        title: "Load a custom font; manage VFont data-blocks",
        body: "bpy.data.fonts.load(filepath) returns the VFont data-block:\n\n  from pathlib import Path\n  fp = bpy.path.abspath('//fonts/Nunito-Bold.ttf')   # // = .blend-relative\n  font = bpy.data.fonts.load(fp) if Path(fp).exists() else bpy.data.fonts['Bfont']\n  tc.font = font\n\nbpy.data.fonts.load() deduplicates by path — calling it twice with the same file returns the existing VFont rather than creating a second copy. 'Bfont' is the built-in font, permanently resident regardless of file state.\n\nFour font slots cover typographic variants:\n  tc.font             — Normal (required; all text falls back here)\n  tc.font_bold        — Bold variant (used when body_format[i].bold = True)\n  tc.font_italic      — Italic variant\n  tc.font_bold_italic — Bold + Italic combined\n\nWhen a style slot is None, Blender synthesises the variant: thickened outlines for bold, a shear transform for italic. Assigning an actual typeface-designed .ttf to font_bold produces correct glyph construction — essential for display fonts where bold weight changes letterform proportions, not just stroke width.\n\nOpen-licence font recommendation: Nunito by Vernon Adams (OFL, github.com/googlefonts/Nunito). Download Nunito-Bold.ttf and place it next to your .blend file.",
      },
      {
        title: "Per-character formatting via body_format",
        body: "tc.body_format is a collection of TextCharacterFormat, one entry per character:\n\n  for fmt in tc.body_format:\n      fmt.material_index = 0     # all glyph cap faces → slot 0\n\n  # Highlight one character with bold and italic\n  tc.body_format[3].bold   = True\n  tc.body_format[3].italic = True\n\nTextCharacterFormat fields:\n  material_index — which material slot renders this glyph's CAP face\n  bold, italic, underline, small_caps\n\nTwo-slot material assignment splits rendering:\n  slot 0 (tc.materials[0]) → front and back cap faces\n                              (controlled by body_format[i].material_index)\n  slot 1 (tc.materials[1]) → the extruded side band (ring of quads)\n                              always uses the LAST slot when two slots present\n\nThere is no per-face extrusion material control on the TextCurve pre-conversion — after convert(), face material indices survive on the Mesh and can be reassigned individually in Edit Mode. body_format length always equals len(tc.body); re-iterate after any reassignment of tc.body to avoid stale index errors.",
      },
      {
        title: "Convert to Mesh, Smart UV Project, build backing panel",
        body: "convert() requires active_object — set it explicitly:\n\n  for o in bpy.context.scene.objects:\n      o.select_set(False)\n  obj.select_set(True)\n  bpy.context.view_layer.objects.active = obj\n  bpy.ops.object.convert(target='MESH')\n  # obj.type is now 'MESH'; obj.data is now bpy.types.Mesh\n\nFor addons / headless batch code, wrap in bpy.context.temp_override — see the Context Override tutorial. After conversion, obj.data is the Mesh; the original TextCurve data-block is orphaned.\n\nSmart UV Project on the converted glyph mesh:\n\n  bpy.context.view_layer.objects.active = obj\n  bpy.ops.object.mode_set(mode='EDIT')\n  bpy.ops.mesh.select_all(action='SELECT')\n  bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)\n  bpy.ops.object.mode_set(mode='OBJECT')\n\nEach glyph becomes its own UV island. Add pack_islands() for a shared atlas:\n  bpy.ops.uv.pack_islands(margin=0.02)\n\nBacking panel — size from converted mesh vertex extents:\n  xs = [v.co.x for v in obj.data.vertices]\n  ys = [v.co.y for v in obj.data.vertices]\n  pw = max(xs) - min(xs) + 0.44    # 0.22 padding each side\n  ph = max(ys) - min(ys) + 0.44\n\nBuild the panel slab with bmesh.verts.new() + bmesh.ops.extrude_face_region().",
      },
      {
        title: "Export GLB for WebXR",
        body: "Tag objects and export:\n\n  for obj in [obj_main, obj_sub, obj_plate]:\n      obj['holoflow:facet'] = False   # smooth normals\n\n  bpy.ops.export_scene.gltf(\n      filepath=bpy.path.abspath('//holoflow_sign.glb'),\n      use_selection=True,\n      export_format='GLB',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_apply=True,      # bakes transforms — critical for text meshes\n      export_normals=True,\n      export_materials='EXPORT',\n  )\n\nexport_apply=True is critical for text-derived meshes: the exporter applies all remaining scale/rotation/location before writing vertex data. Text objects created via bpy.data.curves.new() often carry a non-identity scale from the font size parameter — without export_apply, GLB viewers may display the mesh at the wrong size.\n\nThe resulting GLB has three named Mesh nodes: SignMain, SignSub, SignPlate. Material names (hf_sign_face, hf_sign_bevel, hf_sign_plate) survive as glTF material entries and can be swapped at WebXR runtime via THREE.MeshStandardMaterial without re-exporting.",
      },
    ],
    finalResult:
      "A three-object GLB — extruded main title, extruded subtitle, fitted backing panel — built entirely via the Python data API with no operator context dependency at creation time. Fonts loaded from .ttf with Bfont fallback. Per-character material index via body_format. Converted to mesh, Smart-UV-projected, and exported as holoflow_sign.glb with Draco 6 compression and WebP textures.",
    variations: [
      "Multiline body: insert '\\n' anywhere in tc.body. Add a TextBox via tc.text_boxes.add() and set tc.text_boxes[0].width to constrain line wrapping — Blender word-wraps within the box. Set tc.text_boxes[0].height = 0 for unlimited vertical extent.",
      "Outline-only (no fill): set tc.use_fill_caps = False before converting. The result is a hollow tube following the glyph outline — useful for neon-tube sign effects. Pair with an Emission material and the Wireframe modifier or a GN Curve to Mesh node for further shaping.",
      "Batch sign generation: loop over a list of (body, location) tuples, call make_text_obj() + convert_to_mesh() for each, then batch-export all as separate GLBs or as a single multi-mesh GLB. Each bpy.data.curves.new() call creates an independent data-block.",
      "Build modifier reveal: after converting to mesh, add bpy.ops.object.modifier_add(type='BUILD'). mod.frame_start = 1; mod.frame_duration = 60; mod.use_random_order = False. Vertices reveal in strip order — for text this produces an approximate left-to-right glyph sweep.",
      "Small caps style: set tc.small_caps_scale = 0.65 (default 0.75) and tc.body_format[i].small_caps = True for any lower-case characters. The glyph is rendered at small_caps_scale × size — achieving traditional small-capitals typography without a separate font file.",
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'Curve' object has no attribute 'body'",
        cause:
          "bpy.data.curves.new() was called with type='CURVE' instead of type='FONT'. The returned object is bpy.types.Curve, which has no body attribute.",
        fix: "Delete the data-block: bpy.data.curves.remove(tc). Recreate with type='FONT'. The Python type returned depends entirely on the type argument at creation time.",
      },
      {
        symptom: "convert() produces a mesh with no faces — empty geometry",
        cause:
          "tc.extrude = 0 AND tc.bevel_depth = 0. A flat TextCurve with no extrusion converts to a mesh containing only the outline edges — no faces.",
        fix: "Set tc.extrude to any positive value (0.001 is sufficient) before calling convert(). Alternatively, set tc.fill_mode = 'FRONT' (it is the default); the fill requires non-zero extrude to generate solid cap geometry.",
      },
      {
        symptom: "bpy.data.fonts.load() raises FileNotFoundError or OSError",
        cause:
          "The path is .blend-relative ('//fonts/...') but bpy.path.abspath() was not called, so Blender resolves it relative to the OS process working directory rather than the .blend file location.",
        fix: "Always call bpy.path.abspath(FONT_PATH) before passing to fonts.load(). Guard with Path(bpy.path.abspath(FONT_PATH)).exists() to fall back to Bfont silently.",
      },
      {
        symptom: "body_format[i] IndexError after changing tc.body",
        cause:
          "body_format length always equals len(tc.body) at the time of access. Reassigning tc.body to a longer string auto-extends it; to a shorter string it truncates. Cached indices from before the reassignment go out of range.",
        fix: "Always re-iterate body_format immediately after assigning tc.body. Never cache body_format indices across body string changes.",
      },
    ],
  },
  base,
);
