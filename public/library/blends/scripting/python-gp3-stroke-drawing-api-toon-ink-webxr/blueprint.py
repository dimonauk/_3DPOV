"""
Python bpy.types.GreasePencil (GP3) — Procedural Stroke Drawing,
Layer Keying & Toon Ink Export for WebXR  (Blender 5.1)

Blender 5.1 ships the third-generation Grease Pencil data model.  The internal
representation flipped from a per-layer stroke list (GP2) to a per-frame
GreasePencilDrawing that owns a compact attribute array — the same foreach_set
pattern used by bpy.types.Mesh.  Every stroke is just a contiguous span in
that array; there are no Python-level stroke objects allocated at call time.

This script builds a three-frame animated ink wave, applies a Thickness
modifier (non-destructive line weight), exports a viewport-render preview to
WEBP, then bakes the visible strokes to a triangulated mesh GLB for WebXR
runtime — because raw GP data cannot be consumed by Three.js or Babylon.js.

Run in Blender 5.1 via:
  blender --background --python blueprint.py
or paste into the Scripting workspace Text editor and press Run Script.
"""

import math
import json
import bpy
import mathutils

# ─── parameters ──────────────────────────────────────────────────────────────

OUT          = "//gp3_toon_ink/"   # relative to .blend; create before running
SLUG         = "gp3_ink_wave"
FRAME_COUNT  = 3                   # keyframes: 1, 5, 10
DRACO_LVL    = 6
STROKE_PTS   = 24                  # points per sine stroke
AMP          = 0.6                 # sine wave amplitude
FREQ         = 2.0                 # complete cycles across the stroke width
THICKNESS    = 0.08                # GP3 stroke radius in world units
FILL_ALPHA   = 0.15                # fill is nearly transparent

# ─── helpers ─────────────────────────────────────────────────────────────────

def purge():
    """Remove every object in the default scene — clean slate."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def make_gp_material(name: str, line_rgba, fill_rgba, show_fill: bool = True):
    """
    Create a GP3 material.  bpy.data.materials.create_gpencil_data() populates
    the MaterialGPencilSettings sub-block; without it .grease_pencil is None
    and assigning colour raises AttributeError.
    """
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    gps = mat.grease_pencil
    gps.color           = line_rgba          # ink line colour (RGBA)
    gps.fill_color      = fill_rgba          # fill colour (RGBA)
    gps.show_stroke     = True
    gps.show_fill       = show_fill
    gps.stroke_style    = "SOLID"
    gps.fill_style      = "SOLID"
    return mat


def write_stroke(drawing, pts_world, radius: float, opacity: float,
                 mat_index: int = 0):
    """
    Write one stroke into a GreasePencilDrawing.

    drawing.add_strokes([N]) appends one stroke with N points to the drawing's
    attribute arrays and returns the new stroke count (not the stroke itself).
    The stroke is always at index [-1] after the call.

    foreach_set("position", flat_list) writes 3-float tuples in one C-level
    memcopy — far faster than assigning point.position in a loop, and the only
    safe way to write into the packed attribute buffer without triggering a
    Python-side array rebuild on each assignment.
    """
    n = len(pts_world)
    drawing.add_strokes([n])
    stroke = drawing.strokes[-1]
    stroke.material_index = mat_index

    flat_pos = [c for pt in pts_world for c in (pt.x, pt.y, pt.z)]
    stroke.points.foreach_set("position", flat_pos)
    stroke.points.foreach_set("radius",   [radius]  * n)
    stroke.points.foreach_set("opacity",  [opacity] * n)


def sine_wave_pts(phase_offset: float) -> list:
    """
    Return STROKE_PTS points along a sine wave centred on the origin.
    phase_offset shifts the wave to create motion across frames.
    """
    pts = []
    for i in range(STROKE_PTS):
        t   = i / (STROKE_PTS - 1)          # 0.0 → 1.0
        x   = (t - 0.5) * 2.8               # span ≈ −1.4 … +1.4 m
        y   = AMP * math.sin(FREQ * math.tau * t + phase_offset)
        pts.append(mathutils.Vector((x, y, 0.0)))
    return pts


# ─── scene setup ─────────────────────────────────────────────────────────────

purge()

sc          = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 12

# GP3 data block — bpy.data.grease_pencils holds the new v3 data blocks.
# In Blender 5.1 the legacy GP2 type was removed; all grease_pencils entries
# are GreasePencilv3 internally.
gp_data = bpy.data.grease_pencils.new(SLUG)
gp_obj  = bpy.data.objects.new(SLUG, gp_data)
sc.collection.objects.link(gp_obj)
bpy.context.view_layer.objects.active = gp_obj

# ─── materials ───────────────────────────────────────────────────────────────

# Ink line: deep charcoal.  Fill: soft warm amber at low alpha for toon look.
mat_ink = make_gp_material(
    "GP_Ink",
    line_rgba  = (0.06, 0.04, 0.08, 1.0),
    fill_rgba  = (0.95, 0.82, 0.45, FILL_ALPHA),
    show_fill  = True,
)
# Second material: accent highlight stroke — no fill, ochre line.
mat_hi = make_gp_material(
    "GP_Highlight",
    line_rgba  = (0.95, 0.70, 0.20, 1.0),
    fill_rgba  = (0.0, 0.0, 0.0, 0.0),
    show_fill  = False,
)
gp_data.materials.append(mat_ink)
gp_data.materials.append(mat_hi)

# ─── layer ───────────────────────────────────────────────────────────────────

# GreasePencilLayer.use_lights = False disables the EEVEE GP lighting pass so
# the ink reads as flat cel output regardless of scene illumination — this is
# the correct default for toon rendering exported to WebXR where you control
# lighting in the Three.js scene, not in Blender.
layer = gp_data.layers.new("Ink", set_active=True)
layer.use_lights = False

# ─── keyframes ───────────────────────────────────────────────────────────────

FRAME_KEYS = [1, 5, 10]   # start, middle, end

for frame_num, phase in zip(FRAME_KEYS, [0.0, math.pi * 0.5, math.pi]):
    frm     = layer.frames.new(frame_num)
    drawing = frm.drawing

    # Primary sine wave — mat 0 (ink + fill)
    write_stroke(drawing, sine_wave_pts(phase), THICKNESS, 1.0, mat_index=0)

    # A second, thinner highlight stroke offset +0.25 m in Z (toward camera)
    # Uses mat 1 (highlight line only, no fill).  This shows multi-stroke,
    # multi-material composition inside a single drawing.
    hi_pts = [p + mathutils.Vector((0.0, 0.12, 0.25)) for p in sine_wave_pts(phase)]
    write_stroke(drawing, hi_pts, THICKNESS * 0.4, 0.85, mat_index=1)

# ─── modifiers ───────────────────────────────────────────────────────────────

# Thickness modifier scales line radius procedurally — no need to rewrite
# stroke point radii manually.  strength > 1 fattens, < 1 thins.
# In GP3 the modifier stack uses the same bpy.types.Modifier API as mesh mods
# but the type string prefix is "GREASE_PENCIL_" not "GP_".
thick_mod = gp_obj.grease_pencil_modifiers.new("Thickness", "GREASE_PENCIL_THICKNESS")
thick_mod.value  = 0.0   # additive delta (0 = keep authored radius)
thick_mod.use_weight_factor = False

# Smooth modifier: applies one iteration of point-position smoothing per frame
# to prevent the jagged sampling artefact when STROKE_PTS is low.
smooth_mod = gp_obj.grease_pencil_modifiers.new("Smooth", "GREASE_PENCIL_SMOOTH")
smooth_mod.factor       = 0.4
smooth_mod.iterations   = 2
smooth_mod.use_main_axis = True   # smooth along stroke direction (not across)

# ─── camera & render ─────────────────────────────────────────────────────────

cam_data = bpy.data.cameras.new("Cam")
cam_data.type        = "ORTHO"
cam_data.ortho_scale = 4.0

cam_obj = bpy.data.objects.new("Cam", cam_data)
sc.collection.objects.link(cam_obj)
cam_obj.location = mathutils.Vector((0.0, 0.0, 5.0))
cam_obj.rotation_euler = (0.0, 0.0, 0.0)
sc.camera = cam_obj

sc.render.engine              = "BLENDER_WORKBENCH"
sc.display.shading.show_object_outline = False
sc.render.resolution_x        = 1920
sc.render.resolution_y        = 720
sc.render.film_transparent    = True
sc.render.image_settings.file_format = "WEBP"
sc.render.image_settings.quality     = 90
sc.render.filepath = OUT + "gp3_preview_####.webp"

# ─── GLB mesh bake ───────────────────────────────────────────────────────────

"""
WebXR runtimes (Three.js, Babylon.js, PlayCanvas) cannot consume raw GP data.
The canonical export path is:

  GP3 Object → Convert to Mesh → GLB export

bpy.ops.object.convert(target='MESH') triangulates all visible stroke geometry
(line extrusions + fill polygons) at the current frame into a plain mesh.  The
conversion is destructive: the GP data block is replaced.  For a pipeline that
preserves the GP source, duplicate the object first.

Here we export frame 1 (the rest pose) as the representative GLB.
"""

sc.frame_set(1)

# Duplicate the GP object so we keep the source data block intact in the .blend.
bpy.ops.object.select_all(action="DESELECT")
gp_obj.select_set(True)
bpy.context.view_layer.objects.active = gp_obj
bpy.ops.object.duplicate(linked=False)
bake_obj = bpy.context.view_layer.objects.active

# Convert the duplicate to mesh — modifiers are applied as evaluated geometry.
with bpy.context.temp_override(
    scene           = sc,
    view_layer      = sc.view_layer,
    active_object   = bake_obj,
    selected_objects= [bake_obj],
):
    bpy.ops.object.convert(target="MESH")

# Apply rotation / scale so the GLB root transform is identity.
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# Export.
bake_obj.select_set(True)
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.export_scene.gltf(
        filepath                              = bpy.path.abspath(OUT + "gp3_toon_wave.glb"),
        export_format                         = "GLB",
        export_apply                          = True,
        export_image_format                   = "WEBP",
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = DRACO_LVL,
        export_yup                            = True,
        export_normals                        = True,
        use_selection                         = True,
    )

# Remove the bake duplicate; keep the original GP object in the .blend.
bpy.data.objects.remove(bake_obj, do_unlink=True)

# ─── meta JSON ───────────────────────────────────────────────────────────────

meta = {
    "slug":           SLUG,
    "frame_keys":     FRAME_KEYS,
    "stroke_pts":     STROKE_PTS,
    "layers":         [layer.name],
    "materials":      [mat_ink.name, mat_hi.name],
    "blender_version": "5.1",
    "gp_version":     "3",
    "rest_frame":     1,
    "glb":            "gp3_toon_wave.glb",
}
with open(bpy.path.abspath(OUT + "gp3_meta.json"), "w") as fh:
    json.dump(meta, fh, indent=2)

# Save .blend
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT + SLUG + ".blend"))
print("[gp3] done — gp3_toon_wave.glb + gp3_meta.json saved")
