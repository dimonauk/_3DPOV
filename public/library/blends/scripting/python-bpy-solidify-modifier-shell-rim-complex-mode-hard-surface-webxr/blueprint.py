"""
SolidifyModifier — Simple vs Complex Mode, Even Thickness, Rim Cap & Two-Material
Panel Line for Hard-Surface WebXR
VRM Pauldron Shell · Blender 5.1 · CC0

Technique:
  bpy.types.SolidifyModifier extrudes a surface mesh into a closed 3-D shell.
  SIMPLE mode offsets each vertex along its averaged local normal — fast and
  exact on flat-faced geometry but can self-intersect on convex curves where
  the inner offset pushes vertices past the centre.  Setting use_even_offset=True
  weights each vertex offset by the local curvature so curved regions receive a
  reduced push, keeping thickness visually consistent.

  NON_MANIFOLD (Complex) mode uses a topology-aware offset that traces the
  manifold boundary — better for sculpted or SubD geometry, but slower and
  inappropriate for flat-faced hard-surface meshes.

  use_rim=True generates quad faces that close the open boundary of the base
  surface into a fully closed shell — required for correct WebXR rendering
  (back-face culling would show gaps without it).  material_offset_rim shifts
  the rim faces to a second material slot, enabling a gold-trim panel-line
  look common in VRM character accessories.

Outside sources:
  · https://docs.blender.org/api/5.1/bpy.types.SolidifyModifier.html
    Blender Python API Reference — Blender Foundation — CC BY SA 4.0
  · https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/solidify.html
    Blender Manual: Solidify Modifier — Blender Documentation Team — CC BY SA 4.0

Author: Holoflow Studio · CC0
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RADIUS       = 0.110   # metres — shoulder-cap arc radius
ARC_DEG      = 148     # degrees of arc the pauldron spans
ROWS_V       = 5       # vertical subdivisions (height)
COLS_U       = 7       # radial subdivisions (width)
HEIGHT       = 0.080   # metres — plate height

THICKNESS    = 0.0038  # shell thickness — 3.8 mm, proportionate for VRM scale
OFFSET_DIR   = -1.0    # -1 = inner shell grows inward (correct for armour)

# Materials
CLR_SHELL    = (0.18, 0.24, 0.45, 1.0)  # steel-blue plate
ROUGH_SHELL  = 0.30
METAL_SHELL  = 0.80

CLR_RIM      = (0.82, 0.60, 0.14, 1.0)  # gold trim
ROUGH_RIM    = 0.20
METAL_RIM    = 0.92

EXPORT_GLB   = "//hf_pauldron_shell.glb"
EXPORT_BLEND = "//hf_pauldron_shell.blend"

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in list(bpy.data.meshes) + list(bpy.data.materials):
    if blk.users == 0:
        blk.user_clear()
        bpy.data.batch_remove(ids=[blk])

# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------
mat_shell = bpy.data.materials.new("hf_shell")
mat_shell.use_nodes = True
bsdf = mat_shell.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = CLR_SHELL
bsdf.inputs["Metallic"].default_value   = METAL_SHELL
bsdf.inputs["Roughness"].default_value  = ROUGH_SHELL

mat_rim = bpy.data.materials.new("hf_rim")
mat_rim.use_nodes = True
bsdf2 = mat_rim.node_tree.nodes["Principled BSDF"]
bsdf2.inputs["Base Color"].default_value = CLR_RIM
bsdf2.inputs["Metallic"].default_value   = METAL_RIM
bsdf2.inputs["Roughness"].default_value  = ROUGH_RIM

# ---------------------------------------------------------------------------
# Build base surface — partial cylinder, open edges = solidify boundary
# ---------------------------------------------------------------------------
# A partial cylindrical strip; COLS_U+1 × ROWS_V+1 vertex grid.
# NOT closed at left/right arc ends — Solidify will rim those edges.
bm = bmesh.new()
half_span = math.radians(ARC_DEG / 2)

grid = []
for vi in range(ROWS_V + 1):
    row = []
    t_v = vi / ROWS_V
    z   = HEIGHT * t_v - HEIGHT * 0.5
    for ui in range(COLS_U + 1):
        t_u   = ui / COLS_U
        angle = -half_span + ARC_DEG * math.radians(t_u)
        x = RADIUS * math.cos(angle)
        y = RADIUS * math.sin(angle)
        row.append(bm.verts.new((x, y, z)))
    grid.append(row)

bm.verts.ensure_lookup_table()

# Quad faces — consistent winding so face normals point outward (+radius dir)
for vi in range(ROWS_V):
    for ui in range(COLS_U):
        a = grid[vi    ][ui    ]
        b = grid[vi    ][ui + 1]
        c = grid[vi + 1][ui + 1]
        d = grid[vi + 1][ui    ]
        bm.faces.new((a, b, c, d))

# Assign material slot 0 to all base faces (slot 1 goes to rim via modifier)
bm.faces.ensure_lookup_table()
mat_layer = bm.faces.layers.int.new("material_index")
for f in bm.faces:
    f[mat_layer] = 0

me = bpy.data.meshes.new("hf_pauldron_me")
bm.to_mesh(me)
bm.free()
me.calc_normals()

ob = bpy.data.objects.new("hf_pauldron", me)
bpy.context.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

# Assign both materials — order matters: slot 0 = shell, slot 1 = rim
me.materials.append(mat_shell)
me.materials.append(mat_rim)

# ---------------------------------------------------------------------------
# SolidifyModifier — SIMPLE mode (correct for flat-faced faceted geometry)
# ---------------------------------------------------------------------------
sol = ob.modifiers.new("Solidify", 'SOLIDIFY')

# solidify_mode:
#   'SIMPLE'       — per-vertex averaged-normal offset, fast, ideal for
#                    flat-faced or lightly curved faceted meshes.
#   'NON_MANIFOLD' — topology-aware manifold boundary tracing, better for
#                    sculpted/SubD surfaces; use when SIMPLE self-intersects.
sol.solidify_mode = 'SIMPLE'

sol.thickness     = THICKNESS
sol.offset        = OFFSET_DIR  # -1 = shell grows inward from the base surface

# use_even_offset prevents the inner shell from collapsing at curved concave
# regions. Without it, tight concave curves compress to zero or self-intersect.
sol.use_even_offset = True

# use_rim closes the open boundary of the base surface with quad faces.
# Without this, the pauldron is an open shell — back-face culling makes it
# disappear from the inside, and PBR global illumination leaks through edges.
sol.use_rim      = True
sol.use_rim_only = False  # True suppresses inner shell — use for outline-only effects

# Rim faces receive material slot 0 + material_offset_rim.
# Setting 1 routes them to slot 1 (mat_rim = gold trim) — the panel-line effect.
sol.material_offset_rim = 1
# material_offset shifts the inner shell material (leave at 0 to match outer)
sol.material_offset     = 0

# ---------------------------------------------------------------------------
# WeightedNormalModifier — cleans up rim face normals after solidify
# ---------------------------------------------------------------------------
# SolidifyModifier generates averaged normals at rim corners that can produce
# dark shadowing artefacts. WeightedNormal with FACE_AREA mode reassigns
# corner normals by the adjacent face's area, reducing artefacts on small
# rim quads adjacent to large outer-shell faces.
wn = ob.modifiers.new("WNorm", 'WEIGHTED_NORMAL')
wn.mode   = 'FACE_AREA'
wn.weight = 100
# Keep sharp mark on boundary edges so Smooth by Angle doesn't blur the rim/shell
wn.keep_sharp = True

# ---------------------------------------------------------------------------
# Lighting (3-point quick rig for screenshot)
# ---------------------------------------------------------------------------
def add_light(name, loc, energy, colour=(1, 1, 1)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.color  = colour
    lo = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo)
    lo.location = Vector(loc)
    lo.rotation_euler = (math.radians(45), 0, math.radians(-30))
    return lo

add_light("Key",   ( 0.40,  -0.30, 0.40), 80,  (1.00, 0.97, 0.90))
add_light("Fill",  (-0.30,  -0.20, 0.20), 20,  (0.80, 0.90, 1.00))
add_light("Rim",   ( 0.10,   0.40, 0.30), 45,  (1.00, 0.85, 0.60))

# ---------------------------------------------------------------------------
# Camera
# ---------------------------------------------------------------------------
bpy.ops.object.camera_add(location=(0.18, -0.26, 0.06))
cam = bpy.context.object
cam.name = "Cam"
cam.rotation_euler = (math.radians(82), 0, math.radians(32))
cam.data.lens = 90
bpy.context.scene.camera = cam

# ---------------------------------------------------------------------------
# GLB export
# ---------------------------------------------------------------------------
# export_apply=True evaluates SolidifyModifier + WeightedNormal before writing.
# export_normals=True (default) preserves the custom split normals from WN.
bpy.ops.export_scene.gltf(
    filepath        = bpy.path.abspath(EXPORT_GLB),
    export_format   = 'GLB',
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format = 'WEBP',
    export_apply    = True,
    export_materials = 'EXPORT',
    export_yup      = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(EXPORT_BLEND))

print("✓ hf_pauldron_shell.glb + .blend written")

# ---------------------------------------------------------------------------
# NON_MANIFOLD reference (comment-only — swap solidify_mode to test)
# ---------------------------------------------------------------------------
# sol.solidify_mode = 'NON_MANIFOLD'
# sol.nonmanifold_offset_mode    = 'EVEN'      # FIXED | EVEN | CONSTRAINTS
# sol.nonmanifold_boundary_mode  = 'ROUND'     # NONE  | ROUND | FLAT
# — ROUND rounds open boundary geometry to a smooth cap (good for tubes);
#   FLAT leaves the boundary as-is (correct for hard-surface panels).
# use_even_offset is a SIMPLE-mode property and has no effect in NON_MANIFOLD.
