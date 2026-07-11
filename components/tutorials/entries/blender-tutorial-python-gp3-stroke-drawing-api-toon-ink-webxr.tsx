import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Grease Pencil 3.0 — shipped as the default GP type in Blender 5.1 —
        swapped the old per-layer stroke list for a compact attribute-array
        architecture called{" "}
        <code>GreasePencilDrawing</code>. Each frame in a GP layer owns one
        Drawing, and that Drawing owns a flat C-level buffer of point positions,
        radii, and opacities. Python touches that buffer through the same{" "}
        <code>foreach_set</code> pattern used by{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr"
          className={lk}
        >
          image pixel buffers
        </Link>{" "}
        and mesh attribute arrays — one call, one memcopy, no per-point Python
        allocations. The UI-based approach is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-3-stroke-drawing-fill-taper-export"
          className={lk}
        >
          GP3 stroke drawing tutorial
        </Link>
        ; the Geometry Nodes approach (driving strokes from a field) lives in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-gp3-noise-stroke-wave"
          className={lk}
        >
          GN noise stroke wave tutorial
        </Link>
        . This tutorial takes the Python scripting route: create the data block
        from scratch, write three keyed frames of a phase-shifting sine wave,
        apply non-destructive thickness and smooth modifiers, then bake to a
        triangulated mesh GLB for WebXR — because Three.js and Babylon.js cannot
        consume raw GP data at runtime.
      </p>
      <p>
        The critical GP3 gotcha is material initialisation.{" "}
        <code>bpy.data.materials.new(name)</code> produces a plain PBR material;
        the <code>.grease_pencil</code> sub-block does not exist until you call{" "}
        <code>bpy.data.materials.create_gpencil_data(mat)</code>. Assigning
        colour before that call raises <code>AttributeError: 'NoneType'</code>.
        The second gotcha is the modifier type string prefix:{" "}
        <code>GREASE_PENCIL_THICKNESS</code>, not <code>GP_THICKNESS</code> —
        the old prefix was changed in 4.3 alongside the data model rewrite.
        Context injection via{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          <code>bpy.context.temp_override()</code>
        </Link>{" "}
        is required for the GLB export operator when running headless; without
        it the exporter cannot resolve the active scene and raises{" "}
        <code>RuntimeError: Operator bpy.ops.export_scene.gltf.poll() failed</code>
        .
      </p>
      <p>
        For the toon aesthetic, <code>layer.use_lights = False</code> bypasses
        the EEVEE GP lighting pass and renders strokes as flat ink — the correct
        starting point for cel work destined for a WebXR scene where Three.js
        controls illumination. The shader pipeline for the baked mesh continues
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
          className={lk}
        >
          cel-shade WebXR tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Create the GP3 data block and object",
        body: `"""
bpy.data.grease_pencils.new() allocates a GreasePencil v3 data block.
In Blender 5.1 the legacy GP2 type was retired — every entry in
bpy.data.grease_pencils is GreasePencilv3 internally.

Do NOT use bpy.ops.object.grease_pencil_add() for scripted pipelines:
the operator picks a template type via a modal dialogue that is absent
headless, and it leaves a default 'Stroke' layer you have to purge.
Direct data creation is deterministic; operator creation is not.
"""
import bpy, math, json, mathutils

SLUG     = "gp3_ink_wave"
OUT      = "//gp3_toon_ink/"

def purge():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

purge()

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 12

gp_data = bpy.data.grease_pencils.new(SLUG)
gp_obj  = bpy.data.objects.new(SLUG, gp_data)
sc.collection.objects.link(gp_obj)
bpy.context.view_layer.objects.active = gp_obj`,
      },
      {
        title: "Build GP3 materials (line colour + fill)",
        body: `"""
create_gpencil_data() is the mandatory bootstrap for GP materials.
Without it mat.grease_pencil is None and any colour assignment
raises AttributeError.  Call it immediately after materials.new().

MaterialGPencilSettings exposes:
  .color          — ink line RGBA
  .fill_color     — fill RGBA (only used when show_fill=True)
  .stroke_style   — 'SOLID' | 'DOTS' | 'SQUARES' | 'TEXTURE'
  .fill_style     — 'SOLID' | 'GRADIENT' | 'TEXTURE'

The fill alpha is kept low (0.15) for a translucent watercolour feel;
the ink line is fully opaque charcoal.  A second material, GP_Highlight,
carries the ochre accent line with show_fill=False — it draws no fill
polygon, only the stroke tube, which keeps polygon count down.
"""
FILL_ALPHA = 0.15

def make_gp_mat(name, line_rgba, fill_rgba, show_fill=True):
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    gps = mat.grease_pencil
    gps.color        = line_rgba
    gps.fill_color   = fill_rgba
    gps.show_stroke  = True
    gps.show_fill    = show_fill
    gps.stroke_style = "SOLID"
    gps.fill_style   = "SOLID"
    return mat

mat_ink = make_gp_mat("GP_Ink",
    line_rgba = (0.06, 0.04, 0.08, 1.0),
    fill_rgba = (0.95, 0.82, 0.45, FILL_ALPHA))

mat_hi = make_gp_mat("GP_Highlight",
    line_rgba = (0.95, 0.70, 0.20, 1.0),
    fill_rgba = (0.0,  0.0,  0.0,  0.0),
    show_fill = False)

gp_data.materials.append(mat_ink)
gp_data.materials.append(mat_hi)`,
      },
      {
        title: "Add a layer and write three keyed frames",
        body: `"""
GP3 layer hierarchy:
  GreasePencilLayer
    └─ GreasePencilFrame  (one per keyframe)
         └─ GreasePencilDrawing  (owns the attribute arrays)
              └─ GreasePencilStroke[]
                   └─ GreasePencilPoints (position, radius, opacity)

layer.frames.new(frame_number) inserts a keyframe at that scene frame.
frame.drawing is the GreasePencilDrawing — guaranteed non-None after
frames.new(); no extra initialisation required.

drawing.add_strokes([N]) appends one stroke with N points.  The argument
is a list so you can batch-add multiple strokes in one call:
  drawing.add_strokes([8, 12, 5])  →  three strokes with different point counts

foreach_set("position", flat) writes 3N floats (x,y,z interleaved).
This is the only correct way to write into the packed attribute buffer;
assigning individual point.position in a Python loop triggers an array
rebuild on every assignment and is O(n²) for large point counts.

layer.use_lights = False renders the strokes as flat ink regardless of
scene illumination — correct for toon output destined for WebXR where
the Three.js scene controls lighting independently.
"""
STROKE_PTS = 24
AMP        = 0.6
FREQ       = 2.0
THICKNESS  = 0.08

layer = gp_data.layers.new("Ink", set_active=True)
layer.use_lights = False

def sine_pts(phase):
    return [mathutils.Vector((
        (i / (STROKE_PTS - 1) - 0.5) * 2.8,
        AMP * math.sin(FREQ * math.tau * i / (STROKE_PTS - 1) + phase),
        0.0)) for i in range(STROKE_PTS)]

def write_stroke(drawing, pts, radius, opacity, mat_index=0):
    drawing.add_strokes([len(pts)])
    stroke = drawing.strokes[-1]
    stroke.material_index = mat_index
    flat = [c for p in pts for c in (p.x, p.y, p.z)]
    stroke.points.foreach_set("position", flat)
    stroke.points.foreach_set("radius",   [radius]  * len(pts))
    stroke.points.foreach_set("opacity",  [opacity] * len(pts))

for frame_num, phase in zip([1, 5, 10], [0.0, math.pi*0.5, math.pi]):
    frm     = layer.frames.new(frame_num)
    drawing = frm.drawing
    write_stroke(drawing, sine_pts(phase), THICKNESS, 1.0, mat_index=0)
    hi_pts = [p + mathutils.Vector((0.0, 0.12, 0.25)) for p in sine_pts(phase)]
    write_stroke(drawing, hi_pts, THICKNESS * 0.4, 0.85, mat_index=1)`,
      },
      {
        title: "Apply GP3 modifiers (Thickness + Smooth)",
        body: `"""
GP3 modifiers live on gp_obj.grease_pencil_modifiers, not
gp_obj.modifiers (which is the mesh modifier stack).  The type string
prefix changed from 'GP_' (GP2 era) to 'GREASE_PENCIL_' in 4.3.

Common GP3 modifier types:
  GREASE_PENCIL_THICKNESS    — scale or offset stroke radius
  GREASE_PENCIL_SMOOTH       — positional smoothing along the stroke
  GREASE_PENCIL_NOISE        — positional jitter
  GREASE_PENCIL_SIMPLIFY     — Ramer-Douglas-Peucker point reduction
  GREASE_PENCIL_LINEART      — source-mesh edge extraction (replaces LineArt GN)
  GREASE_PENCIL_ARRAY        — instance along a curve

Smooth.use_main_axis=True smooths along the stroke tangent direction and
leaves cross-stroke (Z) positions untouched — prevents strokes from
drifting off the drawing plane while still removing sampling jitter.
"""
thick = gp_obj.grease_pencil_modifiers.new("Thickness", "GREASE_PENCIL_THICKNESS")
thick.value            = 0.0   # additive delta: 0 = use authored radius exactly
thick.use_weight_factor = False

smooth = gp_obj.grease_pencil_modifiers.new("Smooth", "GREASE_PENCIL_SMOOTH")
smooth.factor         = 0.4
smooth.iterations     = 2
smooth.use_main_axis  = True`,
      },
      {
        title: "Bake to mesh GLB for WebXR export",
        body: `"""
WebXR runtimes — Three.js, Babylon.js, PlayCanvas — have no GP3 parser.
The standard export path is:

  Duplicate GP object  →  bpy.ops.object.convert(target='MESH')
                       →  bpy.ops.export_scene.gltf(...)

convert() evaluates the GP modifier stack (Thickness, Smooth) at the
current frame, triangulates stroke extrusions and fill polygons, and
replaces the GP data block with a plain bpy.types.Mesh.  The conversion
is destructive, so we duplicate the object first to preserve the source.

The resulting GLB represents ONE frame of the animation (the rest pose).
For a multi-frame animated toon export, run this block once per keyframe
and vary the filename, or use the Vertex Animation Texture approach from:
  /tutorials/blender-tutorial-python-cloth-modifier-sim-bake-vertex-animation-texture-webxr

temp_override(scene, view_layer) is mandatory for the GLB operator in
headless mode; without an explicit scene context the exporter cannot
locate the active render settings and raises a poll() failure.
"""
import bpy

sc = bpy.context.scene
sc.frame_set(1)

bpy.ops.object.select_all(action="DESELECT")
gp_obj = bpy.data.objects[SLUG]
gp_obj.select_set(True)
bpy.context.view_layer.objects.active = gp_obj
bpy.ops.object.duplicate(linked=False)
bake_obj = bpy.context.view_layer.objects.active

with bpy.context.temp_override(
    scene=sc, view_layer=sc.view_layer,
    active_object=bake_obj, selected_objects=[bake_obj]):
    bpy.ops.object.convert(target="MESH")

bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

bake_obj.select_set(True)
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT + "gp3_toon_wave.glb"),
        export_format="GLB",
        export_apply=True,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_normals=True,
        use_selection=True,
    )

bpy.data.objects.remove(bake_obj, do_unlink=True)

import json
meta = {
    "slug": SLUG, "frame_keys": [1, 5, 10],
    "stroke_pts": STROKE_PTS, "blender_version": "5.1",
    "gp_version": "3", "glb": "gp3_toon_wave.glb",
}
with open(bpy.path.abspath(OUT + "gp3_meta.json"), "w") as fh:
    json.dump(meta, fh, indent=2)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT + SLUG + ".blend"))
print("[gp3] done")`,
      },
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'NoneType' object has no attribute 'color'",
        cause:
          "mat.grease_pencil is None — create_gpencil_data(mat) was not called before the assignment.",
        fix: "Call bpy.data.materials.create_gpencil_data(mat) immediately after bpy.data.materials.new().",
      },
      {
        symptom: "TypeError: grease_pencil_modifiers.new() — type not found",
        cause:
          "Old GP2 modifier type string used — prefix changed from 'GP_' to 'GREASE_PENCIL_' in Blender 4.3.",
        fix: "Rename the type string: 'GP_THICKNESS' → 'GREASE_PENCIL_THICKNESS', etc.",
      },
      {
        symptom: "drawing.add_strokes() raises AttributeError",
        cause: "frame.drawing is None — the frame was not created via layer.frames.new().",
        fix: "Always create the frame with layer.frames.new(frame_number) before accessing frame.drawing.",
      },
      {
        symptom: "GLB exports but strokes are invisible in Three.js",
        cause:
          "The GP object was exported directly without convert(target='MESH'). Three.js has no GP parser.",
        fix: "Duplicate the object, run convert(target='MESH') on the duplicate, export the mesh copy, then delete the duplicate.",
      },
      {
        symptom: "Smooth modifier flattens the wave amplitude",
        cause: "use_main_axis=False smooths in all directions, including the wave's Y amplitude.",
        fix: "Set smooth.use_main_axis = True to restrict smoothing to the stroke tangent direction.",
      },
      {
        symptom: "foreach_set raises ValueError: sequences mismatch",
        cause: "Flat position list has wrong length — must be 3 × point_count.",
        fix: "Generate with: flat = [c for p in pts for c in (p.x, p.y, p.z)] — 3 floats per point.",
      },
    ],
    outsideSources: [
      {
        title: "bpy.types.GreasePencil API Reference (Blender 5.1)",
        author: "Blender Foundation",
        licence: "CC-BY-4.0",
        url: "https://docs.blender.org/api/5.1/bpy.types.GreasePencil.html",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://projects.blender.org/blender/blender-extensions",
        ],
      },
      {
        title: "Grease Pencil 3.0 Developer Notes",
        author: "Blender Foundation",
        licence: "CC0",
        url: "https://developer.blender.org/docs/features/grease_pencil/",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/handbook/",
        ],
      },
    ],
  },
  {
    slug: "python-gp3-stroke-drawing-api-toon-ink-webxr",
    title:
      "Python bpy.types.GreasePencil (GP3) — Procedural Stroke Drawing, Layer Keying & Toon Ink Export for WebXR (Blender 5.1)",
    description:
      "Author Grease Pencil 3.0 strokes entirely from Python using the new GreasePencilDrawing attribute-array API — foreach_set for positions/radii/opacity, GP3 material bootstrap, non-destructive modifiers — then bake to a triangulated mesh GLB for Three.js WebXR consumption.",
    image: null,
    body: <Body />,
    tags: [
      "blender",
      "python",
      "scripting",
      "grease-pencil",
      "gp3",
      "toon",
      "cel-shading",
      "webxr",
      "animation",
    ],
  }
);
