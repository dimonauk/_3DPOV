"""
Blender 5.1  —  Surface Deform: Bind Accessories & Cloth to a VRM Character Mesh
Slug    : modifier-surface-deform-vrm-cloth-binding
Topic   : modifiers
Licence : CC0 — no rights reserved

Technique ─────────────────────────────────────────────────────────────────────
  Surface Deform is a binding modifier: at bind time it projects each vertex of
  the bound mesh (the garment) onto the surface of a target mesh (the body),
  recording the exact triangle and barycentric coordinates of the hit.
  Thereafter, as the body deforms through armature pose or physics, every
  garment vertex rides the same triangle — the barycentric position is fixed.

  This is fundamentally different from Shrinkwrap, which re-projects to the
  nearest surface every frame and causes garment vertices to slide across body
  seams.  Surface Deform preserves the topological relationship: a vertex
  that started near the shoulder stays near the shoulder regardless of pose.

  The body mesh resolution is the bind resolution ceiling.  Each garment vertex
  influences ~ 4 target triangles within a `falloff` radius.  Too few tris on
  the body → visible faceting on tight accessories.  This blueprint uses a
  Subdivision Surface applied to the body (level 2 → 768 quads) before binding.

Pipeline ───────────────────────────────────────────────────────────────────────
  1. Build body torso (subdivided cylinder).
  2. Build open-ended tunic mesh (slightly larger cylinder, no caps).
  3. Add Surface Deform to tunic, set target=body, bind.
  4. Add Armature with a single spine bone, parent body to it.
  5. Animate spine leaning forward — garment follows automatically.
  6. Duplicate tunic, apply modifier, export body+garment_applied as GLB.

Outside sources ────────────────────────────────────────────────────────────────
  Blender Manual — Surface Deform (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/surface_deform.html

  Blender Python API — SurfaceDeformModifier (CC-BY-SA 4.0, Blender Docs Team)
  https://docs.blender.org/api/5.1/bpy.types.SurfaceDeformModifier.html
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Vector

# ── parameters ─────────────────────────────────────────────────────────────────
BODY_RADIUS    = 0.22    # torso cylinder radius (metres)
BODY_HEIGHT    = 0.55    # torso height (hip to shoulder)
BODY_SEGS      = 12      # radial vertex count on body cylinder
BODY_RINGS     = 1       # cylinder rings before subdivision
BODY_SUBD      = 2       # subdivision level — gives 48-ring × 48-vert grid
GARMENT_INSET  = 0.008   # garment radius = body radius + this offset (metres)
GARMENT_HEIGHT = 0.50    # tunic height (slightly shorter than body)
ARM_HEIGHT     = BODY_HEIGHT * 0.5   # spine bone reaches mid-torso
SPINE_ROT_DEG  = 28.0    # spine lean angle at peak pose
ANIM_FRAMES    = 60      # total animation length
OUT_DIR        = pathlib.Path(__file__).parent

# ── 0. reset ────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for col in (bpy.data.armatures, bpy.data.meshes, bpy.data.materials,
            bpy.data.actions, bpy.data.cameras, bpy.data.lights):
    for item in list(col):
        col.remove(item)

# ── 1. body torso ───────────────────────────────────────────────────────────────
# Add a cylinder in REST pose with no armature yet.
# Enough vertical rings so subdivision produces a smooth surface.
bpy.ops.mesh.primitive_cylinder_add(
    vertices=BODY_SEGS,
    depth=BODY_HEIGHT,
    radius=BODY_RADIUS,
    end_fill_type="NGON",          # cap faces — needed for manifold surface
    location=(0, 0, BODY_HEIGHT / 2),
)
body = bpy.context.active_object
body.name = "body_torso"

# Light waist pinch so the bind has something topologically interesting to track
bm = bmesh.new()
bm.from_mesh(body.data)
bm.verts.ensure_lookup_table()
waist_z = BODY_HEIGHT * 0.45
for v in bm.verts:
    t = 1.0 - abs(v.co.z - waist_z) / (BODY_HEIGHT * 0.30)
    if 0.0 < t < 1.0:
        v.co.x *= 1.0 - 0.12 * t
        v.co.y *= 1.0 - 0.12 * t
bm.to_mesh(body.data)
bm.free()

# Apply Subdivision Surface — denser topology = smoother bind seams on garment.
# Surface Deform searches for the nearest triangle on the target; more triangles
# = smaller maximum search gap = higher bind fidelity around curved areas.
subd = body.modifiers.new("Subd", "SUBSURF")
subd.levels           = BODY_SUBD
subd.render_levels    = BODY_SUBD
subd.subdivision_type = "CATMULL_CLARK"
bpy.ops.object.modifier_apply(modifier="Subd")
print(f"Body mesh after SubD: {len(body.data.vertices)} verts, "
      f"{len(body.data.polygons)} polys")

# ── 2. tunic garment ───────────────────────────────────────────────────────────
# Open-ended cylinder slightly larger than the body.  NO end caps (NOTHING) so
# the hem and collar are open loops — more realistic garment topology.
bpy.ops.mesh.primitive_cylinder_add(
    vertices=BODY_SEGS * 2,       # double vertex count for cleaner bind
    depth=GARMENT_HEIGHT,
    radius=BODY_RADIUS + GARMENT_INSET,
    end_fill_type="NOTHING",
    location=(0, 0, GARMENT_HEIGHT / 2 + 0.025),   # sits slightly above hips
)
garment = bpy.context.active_object
garment.name = "tunic"

# Nudge garment verts outward along their normals for a consistent air gap.
# This prevents z-fighting where the meshes are very close.
bm = bmesh.new()
bm.from_mesh(garment.data)
bm.normal_update()
for v in bm.verts:
    v.co += v.normal * 0.003
bm.to_mesh(garment.data)
bm.free()
garment.data.update()

# ── 3. Surface Deform on garment ───────────────────────────────────────────────
# Steps:  add modifier → set target → bind → verify
#
# CRITICAL: the bind must happen with the body in its REST position (no pose).
# Binding in a non-rest pose records the wrong barycentric coordinates and the
# garment will drift when the body returns to rest.
#
# `falloff` exponent controls the influence weight falloff with distance from
# the bound triangle.  Higher falloff → sharper cutoff → less blending across
# topology seams (useful for hard accessories).  Lower falloff → smoother
# blending (better for soft cloth).  Default 4.0 is appropriate for fabric.

mod = garment.modifiers.new("SurfaceDeform", "SURFACE_DEFORM")
mod.target   = body
mod.strength = 1.0     # 1.0 = garment fully follows body
mod.falloff  = 4.0     # influence falloff exponent

bpy.context.view_layer.objects.active = garment
garment.select_set(True)
body.select_set(False)

# `surfacedeform_bind` requires `active_object` to be the object that has the
# modifier.  temp_override redirects the operator context without affecting
# the global scene context — available in Blender 3.2+.
with bpy.context.temp_override(active_object=garment, object=garment):
    result = bpy.ops.object.surfacedeform_bind(modifier=mod.name)

# Binding can fail if the target has no polygons or is not manifold.
# result is {'FINISHED'} on success.
if "FINISHED" not in result:
    raise RuntimeError("surfacedeform_bind failed — check body mesh is manifold")
print(f"Surface Deform bound: is_bound={mod.is_bound}")

# ── 4. armature — single spine bone ────────────────────────────────────────────
# The spine bone runs from the hip (z=0) to mid-torso (z=ARM_HEIGHT).
# We deliberately use a simple single-bone rig so the tutorial focuses on
# Surface Deform rather than armature complexity.
arm_data = bpy.data.armatures.new("VRM_Spine")
arm_data.display_type = "STICK"
arm_obj  = bpy.data.objects.new("VRM_Spine", arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.object.mode_set(mode="EDIT")
spine = arm_data.edit_bones.new("spine")
spine.head = Vector((0, 0, 0))
spine.tail = Vector((0, 0, ARM_HEIGHT))
bpy.ops.object.mode_set(mode="OBJECT")

# ── 5. parent body to armature (with Automatic Weights) ────────────────────────
# Automatic Weights runs a distance-based envelope weighting pass.  For this
# single-bone setup every vertex gets weight 1.0 on "spine" — good enough
# for the Surface Deform demonstration.
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
print("Body parented to armature with Automatic Weights")

# ── 6. animate body lean — garment follows via Surface Deform ─────────────────
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = ANIM_FRAMES
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="POSE")

pb = arm_obj.pose.bones["spine"]
peak_rot = math.radians(SPINE_ROT_DEG)

for frame, rx in ((1, 0.0), (ANIM_FRAMES // 2, peak_rot), (ANIM_FRAMES, 0.0)):
    bpy.context.scene.frame_set(frame)
    pb.rotation_euler = (rx, 0, 0)
    pb.rotation_mode  = "XYZ"
    pb.keyframe_insert("rotation_euler", frame=frame)

bpy.ops.object.mode_set(mode="OBJECT")
print(f"Animation: spine leans {SPINE_ROT_DEG}° over {ANIM_FRAMES} frames.")
print("Surface Deform on tunic needs no extra keyframes — it follows passively.")

# ── 7. export GLB snapshot (rest pose) ─────────────────────────────────────────
# GLB requires the Surface Deform modifier to be APPLIED before export.
# `export_apply=True` in the glTF operator applies all modifiers on the
# exported copies without destroying the live modifier stack in the .blend.
# This produces a static garment mesh shaped to the rest pose.
#
# For a RIGGED garment export (garment moves with skeleton in Three.js):
#   Apply the Surface Deform to bake rest-pose vertex positions, then add an
#   Armature modifier to the garment and transfer the body's vertex group
#   weights using the Data Transfer modifier.  See the weight paint tutorial
#   (/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope) for
#   the vertex group pipeline.
bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
garment.select_set(True)
bpy.context.view_layer.objects.active = body

bpy.ops.export_scene.gltf(
    filepath=str(OUT_DIR / "vrm_cloth_binding.glb"),
    use_selection=True,
    export_format="GLB",
    export_apply=True,             # applies Surface Deform on garment export copy
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_yup=True,
)
print("Exported → vrm_cloth_binding.glb  (rest-pose snapshot)")
print("Save this .blend to preserve the live Surface Deform modifier stack.")
