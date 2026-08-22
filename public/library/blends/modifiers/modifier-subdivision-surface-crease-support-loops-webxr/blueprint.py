"""
Modifier: Subdivision Surface — Crease Weights vs Bevel+Subsurf Stack (Blender 5.1)
public/library/blends/modifiers/modifier-subdivision-surface-crease-support-loops-webxr/

Builds two sci-fi console panels side by side for direct comparison:
  Panel_A_Crease       — edge crease weight 0.9 on the inset seam
  Panel_B_BevelSubsurf — Bevel modifier (support loops) before Subsurf

The fundamental choice at every hard edge:
  Crease:  fast, but violates Catmull-Clark C2 continuity → shading kink under
           glancing light where the derivative of the normal field steps discontinuously.
  Support: Bevel adds narrow parallel edges that cluster vertices near the hard
           edge; the limit surface converges close to it without any continuity
           break. Cleaner normals at the cost of extra geometry.

Run: blender --python blueprint.py
"""

import bpy
import bmesh
import math
import mathutils

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
PANEL_W         = 0.60   # width  (X, metres)
PANEL_H         = 0.40   # height (Z, metres)
PANEL_D         = 0.08   # depth  (Y, metres)
INSET_MARGIN    = 0.06   # frame band width around the recessed screen face
INSET_DEPTH     = 0.010  # how far the screen recesses into the body (along -Y)
CREASE_WEIGHT   = 0.90   # 1.0 = fully sharp; < 1.0 softens the limit-surface pull
BEVEL_WIDTH     = 0.018  # support-loop bevel width (m) — halve for a tighter radius
BEVEL_SEGS      = 2      # bevel segments: 2 gives a rounder arc than 1
BEVEL_ANGLE_DEG = 30.0   # only edges sharper than this threshold get bevelled
SUBSURF_VIEW    = 2      # viewport level while editing (keep ≤ 2 for editing speed)
SUBSURF_RENDER  = 3      # Cycles / EEVEE render level
APPLY_LEVEL     = 2      # subdivision level baked into the exported GLB geometry
PANEL_SEP       = 0.85   # X-distance between the two comparison panels
OUTPUT_BLEND    = "//subsurf_console_panel.blend"
OUTPUT_GLB_A    = "//subsurf_console_panel_crease.glb"
OUTPUT_GLB_B    = "//subsurf_console_panel_bevel_subsurf.glb"

# ─── SCENE RESET ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    for item in list(blk):
        blk.remove(item, do_unlink=True)

# ─── MATERIALS ───────────────────────────────────────────────────────────────
def make_pbr(name: str, hex_rgb: int, roughness: float, metallic: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (
        ((hex_rgb >> 16) & 0xFF) / 255,
        ((hex_rgb >>  8) & 0xFF) / 255,
        ( hex_rgb        & 0xFF) / 255,
        1.0,
    )
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value  = metallic
    return mat

mat_body   = make_pbr("HS_PanelBody",   0x2A3540, 0.28, 0.72)
mat_screen = make_pbr("HS_PanelScreen", 0x0B1520, 0.88, 0.00)

# ─── BASE MESH BUILDER ───────────────────────────────────────────────────────
def build_base_bm():
    """Box + inset front face. Returns (bm, seam_edges, screen_face)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, calc_uvs=False)
    # Scale unit cube to panel proportions; Y is the depth axis
    bmesh.ops.scale(
        bm,
        vec=(PANEL_W, PANEL_D, PANEL_H),
        space=mathutils.Matrix.Identity(4),
        verts=bm.verts,
    )
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # Front face = highest Y centroid after scaling
    front_face = max(bm.faces, key=lambda f: f.calc_center_median().y)

    # Inset creates a frame quad ring + inner screen face.
    # depth < 0: moves the inner face inward along its normal → recessed screen.
    result = bmesh.ops.inset_region(
        bm,
        faces=[front_face],
        thickness=INSET_MARGIN,
        depth=-INSET_DEPTH,
        use_even_offset=True,
        use_relative_offset=False,
        use_interpolate=True,
        inset_individual=False,
    )
    bm.faces.ensure_lookup_table()
    bm.edges.ensure_lookup_table()

    inner = result.get("faces", [])
    screen_face = inner[0] if inner else front_face

    for f in bm.faces:
        f.material_index = 0       # body
    screen_face.material_index = 1 # screen

    # The 4 edges bordering the screen are the seam we control per panel
    seam_edges = list(screen_face.edges)
    return bm, seam_edges, screen_face


# ─── PANEL A — EDGE CREASE ───────────────────────────────────────────────────
bm_a, seam_a, _ = build_base_bm()

# crease_edge is a generic float attribute since Blender 4.1
crease_layer = bm_a.edges.layers.float.get("crease_edge")
if crease_layer is None:
    crease_layer = bm_a.edges.layers.float.new("crease_edge")
for edge in seam_a:
    edge[crease_layer] = CREASE_WEIGHT

me_a = bpy.data.meshes.new("Panel_A_Crease")
bm_a.to_mesh(me_a)
bm_a.free()

obj_a = bpy.data.objects.new("Panel_A_Crease", me_a)
obj_a.location.x = -PANEL_SEP / 2
bpy.context.scene.collection.objects.link(obj_a)
obj_a.data.materials.append(mat_body)
obj_a.data.materials.append(mat_screen)

mod_ss_a = obj_a.modifiers.new("Subsurf", 'SUBSURF')
mod_ss_a.subdivision_type = 'CATMULL_CLARK'
mod_ss_a.levels            = SUBSURF_VIEW
mod_ss_a.render_levels     = SUBSURF_RENDER
# use_limit_surface requests the OpenSubdiv exact limit surface rather than
# iterating subdivision steps — better normal convergence at the same level.
mod_ss_a.use_limit_surface = True


# ─── PANEL B — BEVEL + SUBSURF (SUPPORT-LOOP STACK) ─────────────────────────
bm_b, _, _ = build_base_bm()

me_b = bpy.data.meshes.new("Panel_B_BevelSubsurf")
bm_b.to_mesh(me_b)
bm_b.free()

obj_b = bpy.data.objects.new("Panel_B_BevelSubsurf", me_b)
obj_b.location.x = +PANEL_SEP / 2
bpy.context.scene.collection.objects.link(obj_b)
obj_b.data.materials.append(mat_body)
obj_b.data.materials.append(mat_screen)

# Bevel must be ABOVE Subsurf in the stack so it runs first.
# The narrow bevel edges cluster geometry near hard edges, pulling the
# limit surface tighter without a crease discontinuity.
mod_bev = obj_b.modifiers.new("Bevel", 'BEVEL')
mod_bev.limit_method      = 'ANGLE'
mod_bev.angle_limit       = math.radians(BEVEL_ANGLE_DEG)
mod_bev.width             = BEVEL_WIDTH
mod_bev.segments          = BEVEL_SEGS
mod_bev.profile           = 0.50   # 0 = V-groove, 0.5 = arc, 1 = concave
mod_bev.use_clamp_overlap = True

mod_ss_b = obj_b.modifiers.new("Subsurf", 'SUBSURF')
mod_ss_b.subdivision_type = 'CATMULL_CLARK'
mod_ss_b.levels            = SUBSURF_VIEW
mod_ss_b.render_levels     = SUBSURF_RENDER
mod_ss_b.use_limit_surface = True


# ─── LIGHT + CAMERA ──────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3, 5, 4))
sun = bpy.context.active_object
sun.data.energy = 6.0
# A tight solid angle is critical: it exposes shading kinks that a soft light hides.
sun.data.angle  = math.radians(2)

bpy.ops.object.camera_add(location=(0.0, 2.2, 0.15))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(88), 0.0, math.radians(180))
bpy.context.scene.camera = cam


# ─── SAVE BLEND ──────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))


# ─── GLB EXPORT ──────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object, path: str) -> None:
    """Lower Subsurf to APPLY_LEVEL, export, restore viewport level."""
    saved = {}
    for mod in obj.modifiers:
        if mod.type == 'SUBSURF':
            saved[mod.name] = mod.levels
            mod.levels = APPLY_LEVEL

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(path),
        export_format='GLB',
        export_apply=True,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    for mod in obj.modifiers:
        if mod.name in saved:
            mod.levels = saved[mod.name]


export_glb(obj_a, OUTPUT_GLB_A)
export_glb(obj_b, OUTPUT_GLB_B)
print("blueprint.py complete — blend + two GLBs written.")
