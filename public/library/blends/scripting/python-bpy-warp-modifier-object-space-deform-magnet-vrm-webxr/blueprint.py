"""
WarpModifier — Two-Object Space Warp for VRM Sleeve Cuff Drape
Blender 5.1  ·  holoflow_webxr_exporter conventions (Y-up, apply, Draco-6)

WHY WARPMODIFIER INSTEAD OF SCULPTING:
WarpModifier maps vertex positions from one Object transformation space (From)
to another (To). For each vertex near the From empty, the modifier interpolates
between the original position and where that position would land if the From
empty's local space were replaced by the To empty's. Translation, rotation, and
scale differences each contribute independently to the deformation.

The transform is conceptually:
    M = ob_to.matrix_world @ ob_from.matrix_world.inverted()
    factor = strength × falloff(dist(v, ob_from) / radius) × group_weight
    v_warped = lerp(v_original, M @ v_original, factor)

This makes it ideal for VRM clothing:
  • A From/To pair with only a translation offset pulls vertices toward a
    point — cuff forward-drape, collar conform, sleeve gravity sag.
  • A From/To pair with only a rotation difference twists the cuff edge
    around the sleeve axis — natural wrist rotation follow-through.
  • Stacking two WarpModifiers combines both effects non-destructively.

WHAT WE BUILD:
A faceted VRM sleeve — octagonal cross-section (8 segs, studio low-poly),
14 height rings, radius 0.06 m × 0.28 m long.

  [1] Drape  WarpMod: From=origin, To=+0.030X +0.012Y +0.015Z offset
             SMOOTH falloff 0.090 m, strength 0.82, masked to cuff_zone
             → cuff swings slightly forward and outward
  [2] Twist  WarpMod: From=origin, To=same origin rotated +13° around Z
             SPHERE falloff 0.068 m, strength 0.55, masked to cuff_zone
             → cuff edge spirals subtly against the drape direction

Modifiers are applied (baked to mesh) before Solidify (1.8 mm) and GLB export.
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Vector, Matrix, Euler

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG           = "hf_warp_sleeve"
SLEEVE_R       = 0.060          # inner radius (m) — octagonal cross-section
SLEEVE_H       = 0.280          # arm-to-cuff length (m)
SEGS           = 8              # facet count (octagonal = studio low-poly register)
RINGS          = 14             # height divisions; ≥12 needed for smooth falloff
CUFF_FRAC      = 0.22           # bottom fraction → cuff_zone vertex group
SHELL_T        = 0.0018         # Solidify thickness post-bake (m)
VG_CUFF        = "cuff_zone"

DRAPE_OFFSET   = Vector((0.030, 0.012, 0.015))   # To-empty world offset (m)
DRAPE_STR      = 0.82
DRAPE_RADIUS   = 0.090
DRAPE_FALLOFF  = "SMOOTH"   # smooth cubic falloff — avoids hard discontinuity

TWIST_DEG      = 13.0          # rotation around Z (sleeve axis)
TWIST_STR      = 0.55
TWIST_RADIUS   = 0.068
TWIST_FALLOFF  = "SPHERE"   # sphere = sqrt(1 - (d/r)²) — tighter at boundary

OUT_DIR        = pathlib.Path("//public/library/glbs/scripting")
# ──────────────────────────────────────────────────────────────────────────────


# ── CLEANUP ───────────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)


# ── SLEEVE GEOMETRY ───────────────────────────────────────────────────────────
me = bpy.data.meshes.new(SLUG)
ob = bpy.data.objects.new(SLUG, me)
bpy.context.collection.objects.link(ob)

bm = bmesh.new()

# Build octagonal cylinder — bottom ring at Z=0, top ring at Z=SLEEVE_H
# Ring order: index 0 = bottom (cuff), index RINGS = top (shoulder)
verts = []
for ri in range(RINGS + 1):
    z = (ri / RINGS) * SLEEVE_H
    row = []
    for si in range(SEGS):
        angle = (si / SEGS) * math.tau
        x = SLEEVE_R * math.cos(angle)
        y = SLEEVE_R * math.sin(angle)
        row.append(bm.verts.new((x, y, z)))
    verts.append(row)

# Quad faces between each pair of adjacent rings
for ri in range(RINGS):
    for si in range(SEGS):
        sn = (si + 1) % SEGS
        bm.faces.new([verts[ri][si], verts[ri][sn],
                      verts[ri + 1][sn], verts[ri + 1][si]])

# Cap discs (N-gons; triangulated by exporter)
bm.faces.new(verts[0])           # bottom cap (cuff edge)
bm.faces.new(verts[-1])          # top cap (shoulder)

bm.to_mesh(me)
bm.free()
me.update()

# ── VERTEX GROUP — cuff_zone ──────────────────────────────────────────────────
# Ring 0 = full weight (cuff edge), weight falls off toward the cutoff ring.
# Smooth falloff means the Warp doesn't start or stop abruptly at the group boundary.
vg = ob.vertex_groups.new(name=VG_CUFF)
cutoff_ring = int(RINGS * CUFF_FRAC)   # last ring with nonzero weight

for ri in range(cutoff_ring + 1):
    # Linear ramp: ring 0 → weight 1.0, ring cutoff_ring → weight 0.0
    w = 1.0 - (ri / max(cutoff_ring, 1))
    indices = [verts[ri][si].index for si in range(SEGS)]
    vg.add(indices, w, "REPLACE")

# Bottom cap vertices get full weight too (they're the cuff hem)
cap_bot = [i for i in range(len(me.vertices))
           if i not in {v.index for row in verts for v in row}]
if cap_bot:
    vg.add(cap_bot, 1.0, "REPLACE")


# ── EMPTIES ───────────────────────────────────────────────────────────────────
def make_empty(name: str, loc: Vector, rot_z_deg: float = 0.0) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = loc
    e.rotation_euler = Euler((0, 0, math.radians(rot_z_deg)), "XYZ")
    e.empty_display_type = "ARROWS"
    e.empty_display_size = 0.02
    return e

# From-empty shared by both WarpModifiers — sits at wrist centre (Z=0)
from_e = make_empty("warp_from", Vector((0, 0, 0)))

# To-empty #1: offset from wrist centre → creates drape pull
drape_to = make_empty("warp_to_drape", DRAPE_OFFSET)

# To-empty #2: same position, rotated → creates twist
twist_to = make_empty("warp_to_twist", Vector((0, 0, 0)), rot_z_deg=TWIST_DEG)


# ── WARP MODIFIERS ────────────────────────────────────────────────────────────
def add_warp(obj: bpy.types.Object,
             name: str,
             ob_from: bpy.types.Object,
             ob_to: bpy.types.Object,
             strength: float,
             radius: float,
             falloff: str,
             vgroup: str) -> bpy.types.WarpModifier:
    mod = obj.modifiers.new(name, "WARP")
    mod.object_from      = ob_from
    mod.object_to        = ob_to
    mod.strength         = strength
    mod.falloff_radius   = radius
    mod.falloff_type     = falloff   # 'SMOOTH' | 'SPHERE' | 'ROOT' | 'SHARP' | 'LINEAR'
    mod.vertex_group     = vgroup
    # texture_coords defaults to 'LOCAL' — correct for static accessory export
    return mod

add_warp(ob, "Drape", from_e, drape_to,
         DRAPE_STR, DRAPE_RADIUS, DRAPE_FALLOFF, VG_CUFF)
add_warp(ob, "Twist", from_e, twist_to,
         TWIST_STR, TWIST_RADIUS, TWIST_FALLOFF, VG_CUFF)


# ── APPLY MODIFIERS (bake deformation into mesh) ──────────────────────────────
# Must set active object before applying via depsgraph context.
# Applying converts the evaluated mesh back into base mesh data,
# discarding the modifier stack entry. The empties become orphans —
# they are deleted below before export so they don't pollute the GLB.
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

dg = bpy.context.evaluated_depsgraph_get()
ob_ev = ob.evaluated_get(dg)
me_baked = bpy.data.meshes.new_from_object(ob_ev)

old_me = ob.data
ob.data = me_baked
bpy.data.meshes.remove(old_me)
ob.modifiers.clear()

# ── SOLIDIFY (wall thickness) ─────────────────────────────────────────────────
sol = ob.modifiers.new("Shell", "SOLIDIFY")
sol.thickness           = SHELL_T
sol.use_even_offset     = True
sol.use_quality_normals = True
sol.offset              = -1.0   # grow inward to preserve outer silhouette

# Apply Solidify before export as well
dg2 = bpy.context.evaluated_depsgraph_get()
ob_ev2 = ob.evaluated_get(dg2)
me_solid = bpy.data.meshes.new_from_object(ob_ev2)
old_me2 = ob.data
ob.data = me_solid
bpy.data.meshes.remove(old_me2)
ob.modifiers.clear()


# ── CLEANUP EMPTIES FROM SCENE ────────────────────────────────────────────────
for e in [from_e, drape_to, twist_to]:
    bpy.data.objects.remove(e, do_unlink=True)


# ── MATERIAL SLOT ─────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(f"{SLUG}_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value   = (0.12, 0.14, 0.22, 1.0)  # deep navy
    bsdf.inputs["Metallic"].default_value     = 0.0
    bsdf.inputs["Roughness"].default_value    = 0.72
ob.data.materials.append(mat)


# ── GLB EXPORT ────────────────────────────────────────────────────────────────
# holoflow conventions: +Y up (handled by gltf exporter axis setting),
# apply transforms, snake_case root name, Draco compression level 6.
import bpy.ops   # noqa: E402  (ops needed only for export)
ob.name       = SLUG
ob.data.name  = SLUG

OUT_DIR.parent.mkdir(parents=True, exist_ok=True)
out_path = str(OUT_DIR / f"{SLUG}.glb")

bpy.ops.export_scene.gltf(
    filepath            = out_path,
    use_selection       = True,
    export_format       = "GLB",
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format = "WEBP",
    export_apply        = True,
    export_yup          = True,
)

print(f"[holoflow] WarpModifier sleeve exported → {out_path}")
