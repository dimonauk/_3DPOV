# ============================================================
# SKIN + VOXEL REMESH — Low-Poly Character Blocking
# Blender 5.1  |  Holoflow Studio Library  |  CC0-1.0
# ============================================================
# Technique: Build a minimal edge skeleton (vertices joined by
# edges only — no faces), apply the Skin modifier to extrude a
# manifold quad shell along each edge with individually tuneable
# per-vertex cross-section radii, then add Voxel Remesh to
# produce a clean isosurface, and Decimate (Planar) to collapse
# coplanar quads into the flat-faceted, low-poly studio aesthetic.
# The result is a GLB-ready character blob in ~30 seconds of
# script execution — fast enough to use as a VRM rigging proxy
# before any sculpting or retopology pass.
#
# WHY SKIN OVER METABALL:
#   Metaballs merge by proximity field, so limb lengths change
#   the torso shape. The Skin modifier is purely topological —
#   each edge becomes an independent swept tube, so changing
#   the head radius leaves the neck untouched. That makes it
#   far easier to iterate blocking proportions via RADII below.
#
# WHY VOXEL REMESH OVER 'SMOOTH' REMESH:
#   'SMOOTH' remesh produces an isotropic triangle mesh with
#   implicit Laplacian smoothing baked in. 'VOXEL' uses an
#   OpenVDB distance field: every voxel that straddles the
#   Skin surface gets a quad; regions with zero adaptivity
#   give a perfectly uniform quad density that Decimate can
#   dissolve cleanly into large flat faces.

import bpy
import bmesh
import math
from mathutils import Vector

# ── PARAMETERS (edit these; everything below derives from them) ──

VOXEL_SIZE    = 0.055  # OpenVDB cell size in metres; 0.04 = fine, 0.08 = coarse
DECIMATE_ANG  = math.radians(5)  # planar dissolve threshold; <5° merges quads
TRUNK_RAD     = 0.16   # cross-section radius for torso and hip vertices
HEAD_RAD      = 0.19   # head is wider than the neck — deliberate asymmetry
LIMB_RAD      = 0.09   # upper-limb radius; lower limbs scale down from this
EXPORT_PATH   = "//character_block.glb"

# ── RESET ──────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in (bpy.data.meshes, bpy.data.materials,
              bpy.data.cameras, bpy.data.lights):
    for item in list(block):
        block.remove(item, do_unlink=True)

# ── EDGE SKELETON ──────────────────────────────────────────────────
# Coordinate system: world +Z = up, X = right.  One unit ≈ 1 metre.
# Joint positions chosen so the model fits a ~2 m bounding box,
# matching a standing humanoid with arms slightly out.

VERTS = [
    Vector(( 0.00, 0.0,  2.00)),   # 0  head crown
    Vector(( 0.00, 0.0,  1.68)),   # 1  neck base / shoulder yoke
    Vector((-0.55, 0.0,  1.52)),   # 2  left  shoulder
    Vector(( 0.55, 0.0,  1.52)),   # 3  right shoulder
    Vector((-0.88, 0.0,  1.02)),   # 4  left  elbow
    Vector(( 0.88, 0.0,  1.02)),   # 5  right elbow
    Vector((-1.08, 0.0,  0.62)),   # 6  left  wrist / hand
    Vector(( 1.08, 0.0,  0.62)),   # 7  right wrist / hand
    Vector(( 0.00, 0.0,  0.98)),   # 8  spine base / pelvis
    Vector((-0.28, 0.0,  0.68)),   # 9  left  hip socket
    Vector(( 0.28, 0.0,  0.68)),   # 10 right hip socket
    Vector((-0.32, 0.0,  0.28)),   # 11 left  knee
    Vector(( 0.32, 0.0,  0.28)),   # 12 right knee
    Vector((-0.36, 0.0, -0.05)),   # 13 left  ankle / foot
    Vector(( 0.36, 0.0, -0.05)),   # 14 right ankle / foot
]

EDGES = [
    (0, 1),            # crown → neck
    (1, 2), (1, 3),    # neck → shoulders
    (2, 4), (3, 5),    # shoulders → elbows
    (4, 6), (5, 7),    # elbows → wrists
    (1, 8),            # neck → spine base  (torso column)
    (8, 9), (8, 10),   # pelvis → hip sockets
    (9, 11), (10, 12), # hip sockets → knees
    (11, 13), (12, 14),# knees → ankles
]

# Per-vertex Skin radii as (rx, ry).
# rx and ry are the X and Z half-widths of the cross-section ellipse.
# Setting rx != ry gives a flattened oval: useful for feet (wide, thin)
# and for the torso (deeper front-to-back than side-to-side).
L  = LIMB_RAD
T  = TRUNK_RAD
H  = HEAD_RAD
RADII = [
    (H,      H     ),  # 0  head
    (T*0.75, T*0.75),  # 1  neck / yoke
    (L,      L     ),  # 2  L shoulder
    (L,      L     ),  # 3  R shoulder
    (L*0.8,  L*0.8 ),  # 4  L elbow
    (L*0.8,  L*0.8 ),  # 5  R elbow
    (L*0.6,  L*0.4 ),  # 6  L wrist (flatter)
    (L*0.6,  L*0.4 ),  # 7  R wrist (flatter)
    (T,      T     ),  # 8  pelvis
    (L,      L     ),  # 9  L hip
    (L,      L     ),  # 10 R hip
    (L*0.85, L*0.85),  # 11 L knee
    (L*0.85, L*0.85),  # 12 R knee
    (L*0.75, L*0.4 ),  # 13 L ankle (tall + narrow)
    (L*0.75, L*0.4 ),  # 14 R ankle
]

# ── BUILD MESH FROM EDGES ──────────────────────────────────────────
mesh = bpy.data.meshes.new("skeleton_edges")
obj  = bpy.data.objects.new("character_block", mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

bm = bmesh.new()
bm_verts = [bm.verts.new(v) for v in VERTS]
for a, b in EDGES:
    bm.edges.new((bm_verts[a], bm_verts[b]))
bm.to_mesh(mesh)
bm.free()

# ── SKIN MODIFIER ─────────────────────────────────────────────────
# The Skin modifier auto-creates a MeshSkinVertexLayer on the base
# mesh when it is added.  We read that layer to set per-vertex radii.
skin_mod = obj.modifiers.new("Skin", type='SKIN')
skin_mod.use_smooth_shading = False  # flat-shaded tubes for faceted look

# skin_vertices[0] is the layer index — always 0 for a fresh mesh
sk = obj.data.skin_vertices[0]
for i, (rx, ry) in enumerate(RADII):
    sk.data[i].radius = (rx, ry)

# Marking the head as root tells the Skin solver to propagate the
# Catmull-Clark subdivision direction HEAD → FEET.  Without a root
# mark, the solver picks an arbitrary leaf, which can produce twisted
# joint quads at the hip fork.
sk.data[0].use_root = True

# ── VOXEL REMESH MODIFIER ─────────────────────────────────────────
rem = obj.modifiers.new("Remesh", type='REMESH')
rem.mode            = 'VOXEL'
rem.voxel_size      = VOXEL_SIZE
rem.adaptivity      = 0.0   # uniform density — avoids coarse patches on curved surfaces
rem.use_smooth_shade = False

# ── DECIMATE (PLANAR) MODIFIER ─────────────────────────────────────
# Dissolves edges between coplanar faces up to DECIMATE_ANG.
# At 5° this kills the tiny triangulated cap noise left by Voxel Remesh
# while preserving the silhouette geometry at limb junctions.
dec = obj.modifiers.new("Decimate", type='DECIMATE')
dec.decimate_type          = 'DISSOLVE'
dec.angle_limit            = DECIMATE_ANG
dec.use_dissolve_boundaries = False  # keep hard silhouette edges

# ── MATERIAL ──────────────────────────────────────────────────────
mat = bpy.data.materials.new("CharBlock_Clay")
mat.use_nodes = True
nt  = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)

out  = nt.nodes.new('ShaderNodeOutputMaterial')
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
bsdf.location = (-300, 0)
bsdf.inputs['Base Color'].default_value = (0.72, 0.55, 0.48, 1.0)  # warm clay
bsdf.inputs['Roughness'].default_value  = 0.95
bsdf.inputs['Metallic'].default_value   = 0.0
nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
obj.data.materials.append(mat)

# ── CAMERA ────────────────────────────────────────────────────────
cam_d = bpy.data.cameras.new("Camera")
cam_d.lens = 80.0
cam_o = bpy.data.objects.new("Camera", cam_d)
cam_o.location       = (2.6, -3.2, 1.0)
cam_o.rotation_euler = (math.radians(82), 0, math.radians(39))
bpy.context.scene.collection.objects.link(cam_o)
bpy.context.scene.camera = cam_o

# ── KEY LIGHT ──────────────────────────────────────────────────────
sun_d = bpy.data.lights.new("Sun", type='SUN')
sun_d.energy = 3.5
sun_d.angle  = math.radians(3)  # tight sun = hard edge shadows on flat faces
sun_o = bpy.data.objects.new("Sun", sun_d)
sun_o.rotation_euler = (math.radians(48), 0, math.radians(-32))
bpy.context.scene.collection.objects.link(sun_o)

# ── RENDER SETTINGS ───────────────────────────────────────────────
bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
bpy.context.scene.eevee.taa_render_samples = 32

# ── GLB EXPORT ────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath       = bpy.path.abspath(EXPORT_PATH),
    use_selection  = True,
    export_apply   = True,          # bakes Skin + Remesh + Decimate
    export_format  = 'GLB',
    export_yup     = True,          # Holoflow studio: +Y up
    export_normals = True,
    export_texcoords = True,
    export_materials = 'EXPORT',
    export_image_format              = 'WEBP',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
)

print(f"✓ Exported: {bpy.path.abspath(EXPORT_PATH)}")
print(f"  Voxel size={VOXEL_SIZE}m  |  Decimate angle={math.degrees(DECIMATE_ANG):.1f}°")
