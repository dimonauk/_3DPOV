"""
bpy.types.Lattice — Python Lattice Deformer
Control Point Scripting, Cage Morphing & Pre-Export Bake for WebXR
Blender 5.1 · Holoflow Studio scripting tutorial · CC0

Technique in brief
------------------
A Lattice is a volumetric cage whose U×V×W control points deform any mesh
enclosed within it via the LATTICE modifier.  The cage never touches vertex
data directly; Blender evaluates each mesh vertex position inside the cage
using trilinear or tricubic interpolation of control-point displacements.
This indirection means multiple lattices can be applied sequentially, and
swapping mod.object to a different lattice object swaps the whole deformation
without duplicating mesh data — useful for shape-variant generation at scale.

Control point index formula (row-major, 0-based):
    idx = u + v * U + w * U * V
where U = lattice.points_u, V = lattice.points_v, W = lattice.points_w.

Each LatticePoint exposes:
  .co          — rest-grid position (read-only after creation)
  .co_deform   — deformed position (writable)

Export path: apply LATTICE modifier → recalculate normals → GLB.
"""

import bpy
import bmesh
from mathutils import Vector
import math

# ── parameters ─────────────────────────────────────────────────────────────
MESH_NAME   = "holoflow_lattice_base"
LAT_NAME    = "holoflow_lattice_cage"
GLB_PATH    = "//holoflow_lattice_baked.glb"   # // = relative to .blend
GRID_SEGS   = 32          # mesh grid subdivisions per axis (more = smoother bake)
LAT_U       = 4           # lattice resolution U (X axis)
LAT_V       = 4           # lattice resolution V (Y axis)
LAT_W       = 3           # lattice resolution W (Z axis)
PINCH_SCALE = 0.35        # XY contraction factor at lattice-top peak
WAVE_FREQ   = 2.0         # radial sine wave cycles across lattice face
WAVE_AMP    = 0.28        # Z displacement amplitude (metres)
DRACO_LVL   = 6


def build_base_mesh(sc):
    """
    32×32 subdivided grid plane, extruded 0.5 m in Z to give the cage volume
    to work on.  A completely flat plane would make the top-layer deformation
    trivial and the side-pinch invisible.

    create_grid() centres at world origin spanning [−0.5, +0.5] XY at Z=0.
    extrude_face_region() + translate() lifts the top face to Z=0.5, filling
    the interior with loop geometry the deformer can push.
    """
    me = bpy.data.meshes.new(MESH_NAME)
    ob = bpy.data.objects.new(MESH_NAME, me)
    sc.collection.objects.link(ob)

    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm, x_segments=GRID_SEGS, y_segments=GRID_SEGS,
        size=0.5, calc_uvs=True,
    )
    res = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    top = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=Vector((0, 0, 0.5)))
    bm.to_mesh(me)
    bm.free()
    me.update()
    print(f"[holoflow] mesh '{MESH_NAME}' — {len(me.vertices)} verts")
    return ob


def build_lattice(sc):
    """
    Lattice data block with 4×4×3 control points.

    interpolation_type_*  controls inter-point blending:
      KEY_LINEAR  — linear between adjacent points (C0, predictable, WebXR-safe)
      CARDINAL    — Catmull-Rom (C1, smooth, can overshoot on sharp displacements)
      BSPLINE     — B-spline (C2, very smooth, attenuates large moves)

    KEY_LINEAR is the correct default for production bakes — BSPLINE can
    inflate the cage boundaries beyond the intended deformation envelope.

    Scale and location on the Object override the internal [−0.5, +0.5]³ unit
    cube so it encloses the mesh at Z=[0, 0.5] with a small margin.
    """
    lat    = bpy.data.lattices.new(LAT_NAME)
    lat_ob = bpy.data.objects.new(LAT_NAME, lat)
    sc.collection.objects.link(lat_ob)

    lat.points_u = LAT_U
    lat.points_v = LAT_V
    lat.points_w = LAT_W
    lat.interpolation_type_u = 'KEY_LINEAR'
    lat.interpolation_type_v = 'KEY_LINEAR'
    lat.interpolation_type_w = 'KEY_LINEAR'

    # Cage spans [−0.52, +0.52] XY and [−0.03, +0.53] Z — 0.02 m margin
    lat_ob.scale    = Vector((1.04, 1.04, 0.56))
    lat_ob.location = Vector((0.0, 0.0, 0.25))

    print(f"[holoflow] lattice '{LAT_NAME}' — {len(lat.points)} control pts "
          f"({LAT_U}×{LAT_V}×{LAT_W})")
    return lat_ob, lat


def deform_control_points(lat):
    """
    Procedural displacement on the top layer (w == W-1):
      • Radial sine wave in Z — creates a crown-like wave across the top face.
      • XY pinch toward centre — tapers the mesh like a vase neck.

    Mid layer (0 < w < W-1) gets a gentle outward bulge so the side walls
    stay plump rather than collapsing inward where the cage transitions.

    WHY write .co_deform and not .co:
      .co is the rest-grid position assigned at lattice creation; it is
      read-only at runtime.  .co_deform is the deformed offset — Blender
      computes vertex displacements as (co_deform − co) in cage-local space
      and blends them into the mesh via the interpolation kernel.
    """
    U, V, W = LAT_U, LAT_V, LAT_W
    pts = lat.points

    for w in range(W):
        t_w = w / (W - 1)
        for v in range(V):
            for u in range(U):
                idx = u + v * U + w * U * V
                pt  = pts[idx]

                lx = (u / (U - 1)) - 0.5   # rest X in [-0.5, 0.5]
                ly = (v / (V - 1)) - 0.5   # rest Y in [-0.5, 0.5]
                r  = math.sqrt(lx * lx + ly * ly)

                if w == W - 1:
                    # top layer: sine wave on Z + radial pinch on XY
                    dz    = math.sin(r * math.pi * WAVE_FREQ * 2.0) * WAVE_AMP
                    scale = 1.0 - PINCH_SCALE * (1.0 - math.cos(r * math.pi))
                    pt.co_deform.x = lx * scale
                    pt.co_deform.y = ly * scale
                    pt.co_deform.z = 0.5 + dz
                elif w > 0:
                    # mid layer: gentle outward bulge, no Z shift
                    bulge = 1.0 + 0.07 * math.sin(t_w * math.pi)
                    pt.co_deform.x = lx * bulge
                    pt.co_deform.y = ly * bulge

    print("[holoflow] control points deformed")


def apply_modifier(sc, mesh_ob, lat_ob):
    """
    Attach LATTICE modifier, force depsgraph evaluation, then bake via
    modifier_apply().

    mod.object must be the lattice Object — setting it to the Lattice data
    block (bpy.data.lattices[name]) silently does nothing; Blender expects
    an Object wrapper, not a raw data block.

    modifier_apply() polls for OBJECT mode with the object active and
    visible; temp_override() satisfies both conditions headlessly.

    After apply the mesh data contains the baked vertex positions.  The
    lattice object can then be deleted — it is no longer referenced.
    Custom split normals set before the modifier are preserved through apply
    (see /tutorials/blender-tutorial-python-mesh-custom-split-normals-*).
    """
    sc.view_layer.objects.active = mesh_ob
    mesh_ob.select_set(True)

    mod        = mesh_ob.modifiers.new(name="Lattice", type='LATTICE')
    mod.object = lat_ob

    bpy.context.view_layer.update()

    with bpy.context.temp_override(
        active_object=mesh_ob,
        selected_objects=[mesh_ob],
        object=mesh_ob,
    ):
        bpy.ops.object.modifier_apply(modifier=mod.name)

    print("[holoflow] modifier applied — vertex positions baked")


def assign_material(mesh_ob):
    """
    Metallic blue PBR — low roughness to show specular highlights that
    reveal the surface curvature of the deformed cage wave.
    """
    mat = bpy.data.materials.new("holoflow_lattice_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.06, 0.22, 0.70, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.82
    bsdf.inputs["Roughness"].default_value  = 0.10
    mesh_ob.data.materials.append(mat)


def export_glb(sc, mesh_ob):
    """
    Only the mesh is selected for export; the lattice cage is excluded.
    export_apply=False is correct here — the modifier was already applied
    in apply_modifier().  Passing True would error (no modifier to apply).
    """
    for ob in sc.collection.objects:
        ob.select_set(False)
    mesh_ob.select_set(True)
    sc.view_layer.objects.active = mesh_ob

    with bpy.context.temp_override(
        active_object=mesh_ob,
        selected_objects=[mesh_ob],
    ):
        bpy.ops.export_scene.gltf(
            filepath=bpy.path.abspath(GLB_PATH),
            use_selection=True,
            export_apply=False,
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=DRACO_LVL,
            export_image_format='WEBP',
            export_yup=True,
        )
    print(f"[holoflow] GLB exported → {GLB_PATH}")


# ── main ────────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc      = bpy.context.scene
sc.name = "holoflow_lattice"

mesh_ob         = build_base_mesh(sc)
lat_ob, lat     = build_lattice(sc)
deform_control_points(lat)
apply_modifier(sc, mesh_ob, lat_ob)
assign_material(mesh_ob)
export_glb(sc, mesh_ob)

print("[holoflow] lattice tutorial complete")
