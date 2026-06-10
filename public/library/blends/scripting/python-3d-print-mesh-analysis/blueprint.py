"""
bpy + bmesh — 3D Print Prep: Manifold Validation, Overhang Analysis & STL Export
(Blender 5.1)

Builds a chess-pawn shape by revolving a profile curve via bmesh, then performs
a full print-readiness audit without the 3D Print Toolbox extension:
  · non-manifold edge detection  (edge.is_manifold — each edge must touch exactly 2 faces)
  · volume sign check            (bm.calc_volume() > 0 confirms outward-consistent normals)
  · per-face overhang severity   (stored as named float attribute, heat-mapped in material)
  · minimum face area            (sliver detection — slicers choke on near-zero triangles)

Stores overhang_severity [0–1] on every face for real-time heat-map visualisation,
exports a Draco GLB showing the colour map, and writes an STL file ready for
FDM or SLA slicing software.

Run: Scripting workspace → Open blueprint.py → Run Script
Outputs: pawn_print_ready.blend  ·  pawn_print_ready.glb  ·  pawn_print_ready.stl
"""

import math
import os
import bpy
import bmesh
from mathutils import Vector

# ── parameters ───────────────────────────────────────────────────────────────
N_SEGS       = 32      # radial segments in the revolution (32 = smooth at this scale)
OVERHANG_DEG = 45.0    # FDM self-support threshold; steeper faces need slicer support
ANIM_FRAMES  = 361     # 1–360 = 15 s @ 24 fps, one complete spin
FPS          = 24

# pawn profile: (equatorial_radius, z) from bottom pole to top pole
# total height ≈ 1.08 Blender units; midpoint at z = 0
PROFILE = [
    (0.000, -0.540),   # bottom pole
    (0.400, -0.490),   # base outer rim
    (0.360, -0.310),   # base shoulder
    (0.130, -0.060),   # neck (tightest cross-section)
    (0.125,  0.180),   # shaft rising
    (0.270,  0.360),   # ball equator
    (0.160,  0.500),   # ball taper
    (0.000,  0.540),   # top pole
]

_DIR       = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(_DIR, "pawn_print_ready.blend")
GLB_PATH   = os.path.join(_DIR, "pawn_print_ready.glb")
STL_PATH   = os.path.join(_DIR, "pawn_print_ready.stl")

# ─────────────────────────────────────────────────────────────────────────────


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.meshes):    bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials): bpy.data.materials.remove(m)


def build_pawn_mesh() -> bpy.types.Mesh:
    """
    Revolve PROFILE around the Z axis.  Pole entries (radius ≈ 0) collapse
    to a single vertex; adjacent ring pairs become quad bands.

    recalc_face_normals is called after construction because the bottom and
    top triangle fans naturally wind in opposite orientations — the op
    propagates a consistent outward winding across the entire closed shell.
    """
    bm = bmesh.new()

    rings = []
    for radius, z in PROFILE:
        if radius < 1e-6:
            rings.append([bm.verts.new(Vector((0.0, 0.0, z)))])
        else:
            r = []
            for s in range(N_SEGS):
                a = math.tau * s / N_SEGS
                r.append(bm.verts.new(Vector((radius * math.cos(a),
                                              radius * math.sin(a), z))))
            rings.append(r)

    bm.verts.ensure_lookup_table()

    for i in range(len(rings) - 1):
        bot, top = rings[i], rings[i + 1]
        if len(bot) == 1:           # bottom pole: triangle fan outward
            pole = bot[0]
            for s in range(N_SEGS):
                bm.faces.new([pole, top[s], top[(s + 1) % N_SEGS]])
        elif len(top) == 1:         # top pole: triangle fan inward
            pole = top[0]
            for s in range(N_SEGS):
                bm.faces.new([bot[s], bot[(s + 1) % N_SEGS], pole])
        else:
            for s in range(N_SEGS):
                ns = (s + 1) % N_SEGS
                bm.faces.new([bot[s], bot[ns], top[ns], top[s]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    mesh = bpy.data.meshes.new("pawn_print_ready")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return mesh


def analyse_and_tag(mesh: bpy.types.Mesh) -> dict:
    """
    Print-readiness audit using bmesh analysis primitives only — no add-on.

    bm.calc_volume() returns a signed volume: positive means outward normals
    are consistent (watertight + correct), negative means all inverted,
    near-zero means mixed winding or self-intersecting shell.  For the pawn
    (a simple closed revolution) a positive result is the expected confirmation.

    overhang_severity per face = max(0, -face.normal.z):
      0.0  → face points straight up  — no support needed
      0.5  → face is vertical          — borderline (slicer-dependent)
      1.0  → face points straight down — always needs support
    """
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.normal_update()

    non_manifold = [e for e in bm.edges if not e.is_manifold]
    volume       = bm.calc_volume()
    surface_area = sum(f.calc_area() for f in bm.faces)
    min_area     = min(f.calc_area() for f in bm.faces)

    threshold_cos = math.cos(math.radians(OVERHANG_DEG))
    ovh_layer     = bm.faces.layers.float.new("overhang_severity")
    n_overhangs   = 0
    for f in bm.faces:
        sev = max(0.0, -f.normal.z)
        f[ovh_layer] = sev
        if f.normal.z < -abs(threshold_cos):
            n_overhangs += 1

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return {
        "non_manifold_edges": len(non_manifold),
        "overhang_faces"    : n_overhangs,
        "min_face_area_m2"  : min_area,
        "volume_m3"         : volume,
        "surface_area_m2"   : surface_area,
        "print_ready"       : len(non_manifold) == 0 and volume > 0.0,
    }


def make_material() -> bpy.types.Material:
    """
    Heat-map driven by overhang_severity:  green (safe) → yellow (45° boundary) → red (overhang).
    ShaderNodeAttribute reads the named float from the mesh in EEVEE;
    Principled BSDF carries it as Base Colour so the heat map bakes cleanly to a texture.
    """
    mat = bpy.data.materials.new("pawn_overhang_heatmap")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    attr = nt.nodes.new("ShaderNodeAttribute")

    attr.attribute_name = "overhang_severity"
    attr.attribute_type = "GEOMETRY"

    ramp.color_ramp.interpolation = "LINEAR"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = (0.05, 0.65, 0.15, 1.0)  # green = safe
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color    = (0.90, 0.10, 0.05, 1.0)  # red = overhang
    mid = ramp.color_ramp.elements.new(0.45)
    mid.color = (0.90, 0.75, 0.00, 1.0)   # yellow at 45° boundary

    bsdf.inputs["Roughness"].default_value = 0.55

    nt.links.new(attr.outputs["Fac"],   ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    return mat


def setup_scene(obj: bpy.types.Object):
    bpy.ops.object.camera_add(location=(0.0, -2.8, 0.0))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="AREA", location=(-1.5, -2.0, 1.5))
    bpy.context.object.data.energy = 300
    bpy.context.object.data.size   = 2.0

    bpy.ops.object.light_add(type="AREA", location=(2.0, -1.0, 0.5))
    bpy.context.object.data.energy = 100
    bpy.context.object.data.size   = 3.0

    obj.rotation_mode = "XYZ"
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.tau)
    obj.keyframe_insert("rotation_euler", frame=ANIM_FRAMES)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def export_outputs():
    bpy.ops.export_scene.gltf(
        filepath                             = GLB_PATH,
        export_format                        = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
        export_apply                         = True,
        export_animations                    = True,
        export_yup                           = True,
        export_attributes                    = True,   # writes overhang_severity attribute
    )
    # STL for slicer hand-off — bpy.ops.wm.stl_export() added in Blender 4.2
    bpy.ops.wm.stl_export(
        filepath                = STL_PATH,
        ascii_format            = False,
        apply_modifiers         = True,
        export_selected_objects = False,
        forward_axis            = "Y",
        up_axis                 = "Z",
        global_scale            = 1.0,
    )


# ── main ─────────────────────────────────────────────────────────────────────

reset_scene()

mesh   = build_pawn_mesh()
report = analyse_and_tag(mesh)
mat    = make_material()
mesh.materials.append(mat)

obj = bpy.data.objects.new("pawn_print_ready", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
obj["holoflow:facet"]  = False
obj["holoflow:source"] = "bmesh revolution + print-readiness audit"

setup_scene(obj)

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = ANIM_FRAMES - 1
bpy.context.scene.render.fps  = FPS

bpy.ops.wm.save_mainfile(filepath=BLEND_PATH)
export_outputs()

print("\n[holoflow] ── 3D Print Analysis Report ─────────────────────────────")
print(f"  Non-manifold edges : {report['non_manifold_edges']}")
print(f"  Overhang faces >45°: {report['overhang_faces']}")
print(f"  Min face area      : {report['min_face_area_m2']:.2e} m²")
print(f"  Volume             : {report['volume_m3']:.6f} m³")
print(f"  Surface area       : {report['surface_area_m2']:.6f} m²")
print(f"  PRINT READY        : {report['print_ready']}")
print(f"[holoflow] .blend  → {BLEND_PATH}")
print(f"[holoflow] .glb    → {GLB_PATH}")
print(f"[holoflow] .stl    → {STL_PATH}")
