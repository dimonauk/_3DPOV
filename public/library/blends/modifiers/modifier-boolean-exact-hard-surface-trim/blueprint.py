"""
Modifier — Boolean: Exact Solver Hard-Surface Trim Sheet (Blender 5.1)
=======================================================================
Technique: stack Object Boolean modifiers (Exact solver) on a base panel mesh to
carve channels, ports, and recesses non-destructively, then add a Bevel modifier
AFTER the booleans so cut edges receive a chamfer automatically.

Why Exact solver over Fast?
  Fast (Carve): CSG via manifold triangulation — fast, good for convex cutters,
    prone to numerical errors on coplanar or near-tangent faces.
  Exact: mesh-boolean via halfedge representation and exact arithmetic.
    Handles non-manifold edge cases, coplanar cutter faces, thin-wall collisions.
    ~3× slower than Fast but deterministic and GLB-safe.
    Rule: any cutter that shares a plane with the base → use Exact.

Modifier stack order MATTERS:
  [0] Solidify  ← gives the base mesh thickness before cutting
  [1] Boolean A  ← channel strip
  [2] Boolean B  ← circular port
  [3] Boolean C  ← rectangular inset
  [4] Bevel      ← chamfer all edges including newly created boolean seams
  [5] Subdivision (optional, for export LOD0)

Artefacts produced (when run inside Blender):
  hard_surface_panel.glb  →  public/library/glbs/modifiers/modifier-boolean-exact-hard-surface-trim/
  hard_surface_panel.blend  (save after running)
"""

import bpy
import math
import os
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
PANEL_W = 4.0           # base panel width  (X)
PANEL_H = 2.5           # base panel height (Y)
PANEL_DEPTH = 0.06      # solidify thickness (Z)

CHANNEL_W = 2.8         # horizontal channel cutter width
CHANNEL_H = 0.18        # channel cutter height
CHANNEL_DEPTH = 0.04    # cut depth (Z-extent of cutter)

PORT_RADIUS = 0.28      # circular port radius
PORT_DEPTH = 0.08       # enough to pierce the solidified panel

INSET_W = 0.9           # rectangular inset width
INSET_H = 0.55          # rectangular inset height
INSET_DEPTH = 0.035     # shallow recess

BEVEL_WIDTH = 0.012     # chamfer width on cut edges
BEVEL_SEGS = 2          # bevel segments (2 = clean highlight)

CUTTER_COLLECTION = "HSP_Cutters"

OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp",
    "hard_surface_panel",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Helpers ───────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def link_to_scene(obj):
    bpy.context.collection.objects.link(obj)


def new_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def add_box_cutter(name, x, y, z, sx, sy, sz, col):
    """Create a box cutter mesh, link to col, hide from viewport render."""
    mesh = bpy.data.meshes.new(name + "_mesh")
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)

    verts = []
    faces = []
    hw, hh, hd = sx / 2, sy / 2, sz / 2
    # 8 corner vertices
    for dz in (-hd, hd):
        for dy in (-hh, hh):
            for dx in (-hw, hw):
                verts.append((dx, dy, dz))
    # 6 quad faces (vertex indices)
    faces = [
        (0, 1, 3, 2), (4, 6, 7, 5),  # bottom / top
        (0, 4, 5, 1), (2, 3, 7, 6),  # front / back
        (0, 2, 6, 4), (1, 5, 7, 3),  # left / right
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj.location = (x, y, z)
    # Cutters must be visible objects but can live in a hidden collection.
    # We tag them with a custom property so export scripts can skip them.
    obj["holoflow:is_cutter"] = True
    obj.hide_render = True
    return obj


def add_cylinder_cutter(name, x, y, z, radius, depth, col, verts_count=32):
    """Cylinder cutter via ops (simpler for a circle cross-section)."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts_count,
        radius=radius,
        depth=depth,
        location=(x, y, z),
    )
    obj = bpy.context.active_object
    obj.name = name
    # Move from scene collection to cutter collection
    bpy.context.collection.objects.unlink(obj)
    col.objects.link(obj)
    obj["holoflow:is_cutter"] = True
    obj.hide_render = True
    return obj


def add_boolean(target, cutter, solver="EXACT", operation="DIFFERENCE"):
    mod = target.modifiers.new(name=f"Bool_{cutter.name}", type="BOOLEAN")
    mod.operation = operation
    mod.solver = solver
    mod.object = cutter
    # Hole Tolerant: helps when cutter surface nearly coincides with base
    mod.use_hole_tolerant = True
    return mod


# ── Build scene ───────────────────────────────────────────────────────────────

clear_scene()

# 1. Base panel — thin slab (Solidify adds thickness)
mesh = bpy.data.meshes.new("panel_base_mesh")
import bmesh as _bmesh
bm = _bmesh.new()
# Start as a flat quad that Solidify thickens — gives cleaner crease topology
_bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)
bm.to_mesh(mesh)
bm.free()

panel = bpy.data.objects.new("hard_surface_panel", mesh)
link_to_scene(panel)
panel.scale = (PANEL_W, PANEL_H, 1.0)
bpy.ops.object.select_all(action="DESELECT")
panel.select_set(True)
bpy.context.view_layer.objects.active = panel
bpy.ops.object.transform_apply(scale=True)

# 2. Solidify — add thickness first so booleans cut through full depth
mod_solid = panel.modifiers.new("Solidify", "SOLIDIFY")
mod_solid.thickness = PANEL_DEPTH
mod_solid.offset = 1.0      # grow toward +Z
mod_solid.use_even_offset = True
mod_solid.use_quality_normals = True

# 3. Cutter collection
cutter_col = new_collection(CUTTER_COLLECTION)

# 4. Cutters
#    a. Horizontal channel strip — centred, lower third
channel = add_box_cutter(
    "cutter_channel",
    x=0.0, y=-0.5,
    z=PANEL_DEPTH * 0.5 + 0.01,  # 0.01 offset prevents coplanar top face
    sx=CHANNEL_W, sy=CHANNEL_H, sz=CHANNEL_DEPTH + 0.02,
    col=cutter_col,
)

#    b. Circular port — upper left
port = add_cylinder_cutter(
    "cutter_port",
    x=-1.2, y=0.55,
    z=PANEL_DEPTH * 0.5,
    radius=PORT_RADIUS,
    depth=PORT_DEPTH + 0.02,
    col=cutter_col,
)

#    c. Rectangular inset — upper right
inset = add_box_cutter(
    "cutter_inset",
    x=1.2, y=0.55,
    z=PANEL_DEPTH - INSET_DEPTH * 0.5 + 0.005,  # partial depth only
    sx=INSET_W, sy=INSET_H, sz=INSET_DEPTH + 0.005,
    col=cutter_col,
)

# 5. Boolean modifiers (stacked after Solidify)
bpy.context.view_layer.objects.active = panel
add_boolean(panel, channel, solver="EXACT")
add_boolean(panel, port,    solver="EXACT")
add_boolean(panel, inset,   solver="EXACT")

# 6. Bevel — after all booleans; angles=False, use edge weight for control later
mod_bev = panel.modifiers.new("Bevel", "BEVEL")
mod_bev.width = BEVEL_WIDTH
mod_bev.segments = BEVEL_SEGS
mod_bev.limit_method = "ANGLE"
mod_bev.angle_limit = math.radians(45)  # only sharp edges get chamfered
mod_bev.use_clamp_overlap = True        # prevents bevel runaway on thin panels
mod_bev.miter_outer = "MITER_ARC"      # arc miter at convex corners (cleaner)
mod_bev.harden_normals = True           # custom split normals on bevel faces

# 7. Material — simple flat grey for GLB export
mat = bpy.data.materials.new("M_Panel")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.22, 0.26, 0.30, 1.0)  # dark slate
bsdf.inputs["Metallic"].default_value = 0.6
bsdf.inputs["Roughness"].default_value = 0.35
panel.data.materials.append(mat)

# 8. Lighting (for record.py render)
bpy.ops.object.light_add(type="SUN", location=(3, -3, 6))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(45), 0, math.radians(30))

bpy.ops.object.light_add(type="AREA", location=(-2, 2, 4))
fill = bpy.context.active_object
fill.data.energy = 200
fill.data.size = 3.0

# 9. Camera
bpy.ops.object.camera_add(location=(0, -6, 3))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(65), 0, 0)
bpy.context.scene.camera = cam

# ── GLB Export ────────────────────────────────────────────────────────────────

def export_glb():
    """Apply modifiers to a temporary copy and export."""
    bpy.ops.object.select_all(action="DESELECT")
    panel.select_set(True)
    bpy.context.view_layer.objects.active = panel

    # Duplicate + apply (preserves original non-destructive stack)
    bpy.ops.object.duplicate(linked=False)
    dup = bpy.context.active_object
    dup.name = "hard_surface_panel_export"

    for mod in list(dup.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception:
            dup.modifiers.remove(mod)

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    out = os.path.join(OUTPUT_DIR, "hard_surface_panel.glb")
    bpy.ops.export_scene.gltf(
        filepath=out,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_apply=True,
        export_yup=True,
    )

    bpy.ops.object.delete(use_global=False)
    print(f"[blueprint] GLB exported → {out}")


export_glb()
print("[blueprint] Scene ready. Save as hard_surface_panel.blend.")
