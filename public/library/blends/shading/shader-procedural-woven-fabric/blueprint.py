"""
Procedural Woven Fabric — Wave Interlace + Principled BSDF v2 Sheen
====================================================================
Blender 5.1  ·  Category: shading  ·  Engine: EEVEE Next

Plain weave is the simplest textile structure: warp threads run along Y,
weft threads run along X, and each crossing alternates which is "on top"
— a checkerboard of over/under interlacements.  This blueprint implements
that structure entirely in shader nodes, with no image textures and no UV
seams beyond the one flat map that ships automatically on a grid mesh.

Two ShaderNodeTexWave nodes (one per axis) supply the thread cross-section
profile — a sinusoidal bell from 0 (gap) to 1 (thread centre).  A Math
chain based on floor(U·N) + floor(V·N) mod 2 produces the alternating
gate: 0 = weft on top, 1 = warp on top.  Multiplying each profile by its
gate gives the correct over/under height for the Bump node.

The Sheen lobe in Principled BSDF v2 (Blender 4.0+) simulates the
Ashikhmin cloth micro-fibre retroreflection model: maximum sheen occurs
when the light grazes the surface nearly parallel to it, which is exactly
when real cloth fibers scatter light back toward the camera.  Without
Sheen the shader reads as textured plastic; with it, the fabric reads as
linen.

Node graph overview
  [TexCoord.UV]──[SeparateXYZ]──[MathChain → gate]─────────────────────┐
        │                                                                 │
        ├──► Wave_warp (BANDS X) ──[fac × gate]──────┐                  │
        │                                             ├──[ADD height]──► [Bump]
        └──► Wave_weft (BANDS Y) ──[fac × (1-gate)]──┘                  │
                                                  [MixRGB(gate)]──► [PBSDF Base]
                                                                    [PBSDF Sheen]
  Camera: 3.2 m away at 35° elevation.  Area key light + fill.

Sources
  Blender Manual — Wave Texture Node (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/wave.html

  KhronosGroup/glTF — KHR_materials_sheen extension (Apache-2.0, Khronos Group)
  https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
"""

import bpy
import bmesh
import math
from pathlib import Path

# ── OUTPUT PATHS ──────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
BLEND_OUT = _HERE / "woven_fabric.blend"
GLB_OUT   = (
    _HERE.parents[2]
    / "glbs" / "shading" / "shader-procedural-woven-fabric"
    / "woven_fabric.glb"
)

# ── PARAMETERS ────────────────────────────────────────────────────────────────
# Thread geometry
THREAD_COUNT    = 20     # thread pairs across the full UV [0,1] range
DISTORTION      = 0.08   # slight irregularity — handwoven imperfection
DETAIL          = 2.0    # fractal octaves on the wave profile
DETAIL_SCALE    = 2.0
DETAIL_ROUGHNESS = 0.5

# Fold displacement (baked into mesh geometry)
GRID_DIVISIONS  = 16     # 16 × 16 = 256 quads
GRID_SIZE       = 2.0    # world-space side length in metres
FOLD_AMP        = 0.14   # max Z deviation in metres
FOLD_FREQ_X     = 1.2    # sinusoidal fold frequency along X
FOLD_FREQ_Y     = 0.8    # lower frequency along Y → diagonal drape

# Thread colours — linen palette
WARP_COLOUR = (0.822, 0.776, 0.623)   # bleached linen warp (off-white)
WEFT_COLOUR = (0.604, 0.512, 0.370)   # raw-linen weft (warm tan)

# Principled BSDF v2
ROUGHNESS        = 0.74
SHEEN_WEIGHT     = 0.88   # high — linen has prominent micro-fibre sheen
SHEEN_ROUGHNESS  = 0.28   # tight sheen lobe → fine fibre diameter
SPECULAR_IOR_LVL = 0.04   # cloth has very low specular reflection

# Bump
BUMP_STRENGTH = 0.70
BUMP_DISTANCE = 0.004     # 4 mm physical thread height


# ── SCENE RESET ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'

col = bpy.data.collections.new("woven_fabric")
scene.collection.children.link(col)


# ── MESH: DRAPED CLOTH PANEL ──────────────────────────────────────────────────
mesh_data = bpy.data.meshes.new("woven_fabric")
obj = bpy.data.objects.new("woven_fabric", mesh_data)
col.objects.link(obj)

bm = bmesh.new()
step = GRID_SIZE / GRID_DIVISIONS
half = GRID_SIZE * 0.5

# Build vertex grid with sinusoidal fold displacement
verts_grid = []
for i in range(GRID_DIVISIONS + 1):
    row = []
    for j in range(GRID_DIVISIONS + 1):
        x = -half + j * step
        y = -half + i * step
        z = (
            FOLD_AMP
            * math.sin(x * FOLD_FREQ_X * math.pi)
            * math.cos(y * FOLD_FREQ_Y * math.pi)
        )
        row.append(bm.verts.new((x, y, z)))
    verts_grid.append(row)

bm.verts.ensure_lookup_table()

# Create quads + assign UV in [0,1]^2
uv_layer = bm.loops.layers.uv.new("UVMap")
faces = []
for i in range(GRID_DIVISIONS):
    for j in range(GRID_DIVISIONS):
        face = bm.faces.new([
            verts_grid[i][j],
            verts_grid[i][j + 1],
            verts_grid[i + 1][j + 1],
            verts_grid[i + 1][j],
        ])
        uvs = [
            (j / GRID_DIVISIONS,       i / GRID_DIVISIONS),
            ((j + 1) / GRID_DIVISIONS, i / GRID_DIVISIONS),
            ((j + 1) / GRID_DIVISIONS, (i + 1) / GRID_DIVISIONS),
            (j / GRID_DIVISIONS,       (i + 1) / GRID_DIVISIONS),
        ]
        for loop, uv in zip(face.loops, uvs):
            loop[uv_layer].uv = uv
        faces.append(face)

bm.normal_update()
bm.to_mesh(mesh_data)
bm.free()
mesh_data.shade_smooth()


# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
col.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0.0, -3.2, 2.0)
cam_obj.rotation_euler = (math.radians(58), 0.0, 0.0)

# ── LIGHTS ────────────────────────────────────────────────────────────────────
def _area_light(name, loc, energy, size=1.0):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy = energy
    d.size   = size
    o = bpy.data.objects.new(name, d)
    col.objects.link(o)
    o.location = loc
    o.rotation_euler = (math.radians(-40), 0.0, math.radians(30))
    return o

_area_light("Key",  (3.0, -1.5, 3.5), energy=400, size=1.2)
_area_light("Fill", (-2.0, -2.0, 1.5), energy=120, size=2.0)


# ── MATERIAL: WOVEN FABRIC ────────────────────────────────────────────────────
mat  = bpy.data.materials.new("woven_fabric")
mat.use_nodes = True
nt   = mat.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

def _n(t, x=0, y=0):
    nd = nodes.new(t)
    nd.location = (x, y)
    return nd

def _math(op, x=0, y=0):
    nd = _n('ShaderNodeMath', x, y)
    nd.operation = op
    return nd

# ── Input: UV coordinates ──────────────────────────────────────────────────────
tc  = _n('ShaderNodeTexCoord', -1400, 0)
sep = _n('ShaderNodeSeparateXYZ', -1200, 0)
links.new(tc.outputs['UV'], sep.inputs['Vector'])

# ── Wave textures (thread cross-section profiles) ──────────────────────────────
def _wave(direction, x, y):
    w = _n('ShaderNodeTexWave', x, y)
    w.wave_type           = 'BANDS'
    w.bands_direction     = direction
    w.wave_profile        = 'SIN'
    w.inputs['Scale'].default_value           = float(THREAD_COUNT)
    w.inputs['Distortion'].default_value      = DISTORTION
    w.inputs['Detail'].default_value          = DETAIL
    w.inputs['Detail Scale'].default_value    = DETAIL_SCALE
    w.inputs['Detail Roughness'].default_value = DETAIL_ROUGHNESS
    links.new(tc.outputs['UV'], w.inputs['Vector'])
    return w

wave_warp = _wave('X', -1000,  220)   # warp threads run along X
wave_weft = _wave('Y', -1000, -220)   # weft threads run along Y

# ── Interlace gate: (floor(U·N) + floor(V·N)) mod 2 ──────────────────────────
# Each result is 0.0 or 1.0: 0 = weft on top, 1 = warp on top.
mul_u   = _math('MULTIPLY', -800, 520)
mul_u.inputs[1].default_value = float(THREAD_COUNT)
links.new(sep.outputs['X'], mul_u.inputs[0])

floor_u = _math('FLOOR', -640, 520)
links.new(mul_u.outputs['Value'], floor_u.inputs[0])

mul_v   = _math('MULTIPLY', -800, 420)
mul_v.inputs[1].default_value = float(THREAD_COUNT)
links.new(sep.outputs['Y'], mul_v.inputs[0])

floor_v = _math('FLOOR', -640, 420)
links.new(mul_v.outputs['Value'], floor_v.inputs[0])

cell_sum = _math('ADD', -480, 470)
links.new(floor_u.outputs['Value'], cell_sum.inputs[0])
links.new(floor_v.outputs['Value'], cell_sum.inputs[1])

gate = _math('MODULO', -320, 470)
gate.inputs[1].default_value = 2.0
links.new(cell_sum.outputs['Value'], gate.inputs[0])

# 1 − gate (inverse: selects the "other" thread)
inv_gate = _math('SUBTRACT', -160, 400)
inv_gate.inputs[0].default_value = 1.0
links.new(gate.outputs['Value'], inv_gate.inputs[1])

# ── Per-thread bump heights ────────────────────────────────────────────────────
# warp on top in gate=1 cells
warp_h = _math('MULTIPLY', -160, 220)
links.new(wave_warp.outputs['Fac'], warp_h.inputs[0])
links.new(gate.outputs['Value'],    warp_h.inputs[1])

# weft on top in gate=0 cells
weft_h = _math('MULTIPLY', -160, -220)
links.new(wave_weft.outputs['Fac'], weft_h.inputs[0])
links.new(inv_gate.outputs['Value'], weft_h.inputs[1])

height = _math('ADD', 0, 0)
links.new(warp_h.outputs['Value'], height.inputs[0])
links.new(weft_h.outputs['Value'], height.inputs[1])

# ── Thread colour selection (gate drives which yarn is visible) ────────────────
mix_col = _n('ShaderNodeMixRGB', 0, -300)
mix_col.blend_type = 'MIX'
mix_col.inputs['Color1'].default_value = (*WEFT_COLOUR, 1.0)
mix_col.inputs['Color2'].default_value = (*WARP_COLOUR, 1.0)
links.new(gate.outputs['Value'], mix_col.inputs['Fac'])

# ── Bump: thread relief from height field ──────────────────────────────────────
bump = _n('ShaderNodeBump', 200, 0)
bump.inputs['Strength'].default_value = BUMP_STRENGTH
bump.inputs['Distance'].default_value = BUMP_DISTANCE
links.new(height.outputs['Value'], bump.inputs['Height'])

# ── Principled BSDF v2 ────────────────────────────────────────────────────────
pbsdf = _n('ShaderNodeBsdfPrincipled', 400, 0)
pbsdf.inputs['Roughness'].default_value        = ROUGHNESS
pbsdf.inputs['Metallic'].default_value         = 0.0
pbsdf.inputs['Sheen Weight'].default_value     = SHEEN_WEIGHT
pbsdf.inputs['Sheen Roughness'].default_value  = SHEEN_ROUGHNESS
pbsdf.inputs['Specular IOR Level'].default_value = SPECULAR_IOR_LVL
links.new(mix_col.outputs['Color'],   pbsdf.inputs['Base Color'])
links.new(bump.outputs['Normal'],     pbsdf.inputs['Normal'])

out = _n('ShaderNodeOutputMaterial', 640, 0)
links.new(pbsdf.outputs['BSDF'], out.inputs['Surface'])

obj.data.materials.append(mat)

# ── SAVE & EXPORT ─────────────────────────────────────────────────────────────
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
bpy.ops.export_scene.gltf(
    filepath          = str(GLB_OUT),
    export_format     = 'GLB',
    export_apply      = True,
    export_yup        = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_materials  = 'EXPORT',
    export_animations = False,
)
print(f"[woven_fabric] blend → {BLEND_OUT}")
print(f"[woven_fabric] GLB   → {GLB_OUT}")
