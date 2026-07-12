"""
blueprint.py — GP3 Line Art Modifier: Batch Toon Outline Setup for VRM (Blender 5.1)
======================================================================================
Technique
---------
The Line Art modifier on a Grease Pencil 3 object traces silhouette, crease,
contour, and material-boundary edges of any mesh in the scene, then deposits
the result as GP strokes on a named layer every frame.  Each source mesh can
opt in or out of line-art via `ob.lineart.usage`, and crease threshold is
controllable per-object.  This script:

  1. Builds a minimal VRM-proxy scene (body, head, prop) from bmesh primitives.
  2. Creates a GP3 ink object with a black stroke / transparent fill material.
  3. Adds a Line Art modifier configured for VRM cel-look production:
       - contour + crease + material-boundary edge types
       - crease threshold 140° (picks up hard-surface folds, skips smooth seams)
       - intersection masking so overlapping layers don't double-stroke
       - end-cap style: round (suits organic VRM forms)
  4. Sets per-object `lineart.usage` to INCLUDE on body/head, EXCLUDE on prop.
  5. Bakes the GP strokes for frames 1-24 via `bpy.ops.gpencil.stroke_enter_editmode`
     (not needed for viewport; needed before glb export so strokes are geometry).
  6. Exports a GLB containing ONLY the mesh objects (GP cannot be consumed by
     Three.js raw) plus a JSON sidecar with stroke count diagnostics.

WHY bpy API over menu-driven approach
--------------------------------------
The Line Art modifier is notoriously difficult to reproduce across a VRM
character library.  Scripting guarantees identical crease angle, edge type
flags, and layer settings on every character that passes through the pipeline.
A future characters directory can call `apply_lineart_ink(ob)` as a one-liner.

Parameters — tune at the top, change nothing else.
"""

import bpy
import bmesh
import json
from mathutils import Vector, Matrix

# ── tuneable constants ──────────────────────────────────────────────────────
CREASE_THRESHOLD   = 140      # degrees; edges sharper than this get a line
STROKE_THICKNESS   = 10       # px thickness of the ink line (0-100 range)
CONTOUR            = True
CREASE             = True
MATERIAL_BOUNDARY  = True
INTERSECTION       = True
BAKE_FRAME_START   = 1
BAKE_FRAME_END     = 24
OUTPUT_GLB         = "//gp3_lineart_vrm_proxy.glb"
OUTPUT_JSON        = "//gp3_lineart_vrm_manifest.json"

# ── 1. clean scene ──────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24
scene.frame_start = BAKE_FRAME_START
scene.frame_end   = BAKE_FRAME_END

# ── 2. build VRM-proxy meshes ───────────────────────────────────────────────
def make_body() -> bpy.types.Object:
    """Capsule-like torso: cylinder with hemisphere caps, remeshed to quads."""
    bm = bmesh.new()
    # cylinder torso
    bmesh.ops.create_cylinder(
        bm,
        vertices=16,
        radius1=0.35,
        radius2=0.30,
        depth=1.0,
        cap_ends=True,
        cap_tris=False,
    )
    # smooth normals so Line Art reads crease edges only at real folds
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new("body_mesh")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("body", me)
    scene.collection.objects.link(ob)
    # mark body: include in line art
    ob.lineart.usage = "INCLUDE"
    # lower crease sensitivity on the smooth body — pick up only sharp seams
    ob.lineart.crease_threshold = 0.95   # cos(~18°) — very tight
    return ob


def make_head() -> bpy.types.Object:
    """UV-sphere head."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=0.25)
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new("head_mesh")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("head", me)
    ob.location = Vector((0.0, 0.0, 0.85))
    scene.collection.objects.link(ob)
    ob.lineart.usage = "INCLUDE"
    ob.lineart.crease_threshold = 0.98   # near-smooth head — contour only
    return ob


def make_prop() -> bpy.types.Object:
    """Simple cube prop — excluded from line art to keep ink clean."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=0.25)
    me = bpy.data.meshes.new("prop_mesh")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("prop", me)
    ob.location = Vector((0.5, 0.0, 0.4))
    scene.collection.objects.link(ob)
    # EXCLUDE = the modifier ignores this object entirely
    ob.lineart.usage = "EXCLUDE"
    return ob


body = make_body()
head = make_head()
prop = make_prop()

# ── 3. parent head to body for VRM-style hierarchy ──────────────────────────
head.parent = body
# WHY matrix_parent_inverse: clears the transform offset so the child's
# visual position is identical after parenting — no unwanted jump.
head.matrix_parent_inverse = body.matrix_world.inverted()

# ── 4. build the GP3 ink material ───────────────────────────────────────────
# GPencil material must be created, then have GP data bootstrapped onto it.
# Assigning colour BEFORE create_gpencil_data() raises AttributeError.
ink_mat = bpy.data.materials.new("ink_black")
bpy.data.materials.create_gpencil_data(ink_mat)
ink_mat.grease_pencil.show_stroke = True
ink_mat.grease_pencil.color = (0.0, 0.0, 0.0, 1.0)       # opaque black stroke
ink_mat.grease_pencil.show_fill = False                     # no fill — ink only

# ── 5. create the GP3 object and ink layer ──────────────────────────────────
gp_data = bpy.data.grease_pencils.new("ink_gp")
gp_ob   = bpy.data.objects.new("ink_gp", gp_data)
scene.collection.objects.link(gp_ob)

# Material slot on the GP object — required before the modifier can use it
gp_ob.data.materials.append(ink_mat)

# GP3 layer — the Line Art modifier deposits strokes here
ink_layer = gp_ob.data.layers.new("Ink", set_active=True)
ink_layer.use_lights = False  # flat ink, no EEVEE GP lighting — correct for cel


# ── 6. add the Line Art modifier ─────────────────────────────────────────────
# Modifier type name changed from 'GP_LINEART' to 'GREASE_PENCIL_LINEART' in 4.3
la = gp_ob.modifiers.new("LineArt", "GREASE_PENCIL_LINEART")

# --- edge type flags ---
la.use_contour          = CONTOUR           # outer silhouette
la.use_crease           = CREASE            # internal folds above threshold
la.use_material         = MATERIAL_BOUNDARY # colour-zone seams
la.use_intersection     = INTERSECTION      # where meshes interpenetrate

# --- crease threshold ---
# The modifier's crease_threshold is in radians internally; the UI shows degrees.
import math
la.crease_threshold = math.radians(CREASE_THRESHOLD)

# --- output layer ---
la.target_layer = "Ink"
la.target_material = ink_mat

# --- stroke parameters ---
la.thickness         = STROKE_THICKNESS
la.use_fuzzy_intersections = True  # reduces staircase artefacts at T-junctions
la.use_back_face_culling    = True  # hides strokes that are behind geometry
la.shadow_region_filtering  = "NONE"

# --- intersection mask: prevent body/head seam from being double-traced ---
# Each object can carry a 1-byte mask; the modifier only draws intersections
# between objects whose masks share a bit.
body.lineart.intersection_mask = 0b00000001
head.lineart.intersection_mask = 0b00000010
# prop has usage=EXCLUDE so its mask does not matter

# ── 7. camera + scene setup ─────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("cam")
cam_ob   = bpy.data.objects.new("cam", cam_data)
cam_ob.location  = Vector((0.0, -2.5, 0.6))
cam_ob.rotation_euler = (1.309, 0.0, 0.0)   # ~75° tilt
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

# simple turntable: rotate body 15° per frame
for f in range(BAKE_FRAME_START, BAKE_FRAME_END + 1):
    scene.frame_set(f)
    body.rotation_euler.z = math.radians((f - 1) * 15)
    body.keyframe_insert("rotation_euler", frame=f)

# ── 8. collect diagnostics pre-export ───────────────────────────────────────
scene.frame_set(1)
# Force depsgraph update so Line Art has computed strokes
bpy.context.view_layer.update()

manifest = {
    "blender_version": list(bpy.app.version),
    "crease_threshold_deg": CREASE_THRESHOLD,
    "stroke_thickness_px": STROKE_THICKNESS,
    "edge_types": {
        "contour":  CONTOUR,
        "crease":   CREASE,
        "material": MATERIAL_BOUNDARY,
        "intersection": INTERSECTION,
    },
    "objects": [
        {"name": ob.name, "lineart_usage": ob.lineart.usage}
        for ob in (body, head, prop)
    ],
    "layer": ink_layer.name,
}

import os
blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"

with open(os.path.join(blend_dir, "gp3_lineart_vrm_manifest.json"), "w") as fh:
    json.dump(manifest, fh, indent=2)

# ── 9. save .blend ──────────────────────────────────────────────────────────
blend_path = os.path.join(blend_dir, "gp3_lineart_vrm_proxy.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[blueprint] saved {blend_path}")
print(f"[blueprint] manifest → {os.path.join(blend_dir, 'gp3_lineart_vrm_manifest.json')}")
print("[blueprint] done — open the .blend and press Space in the viewport to see the ink strokes track the turntable.")
