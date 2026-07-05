# python-mathutils-noise-terrain-heightfield-webxr/blueprint.py
# Blender 5.1 — mathutils.noise: Procedural Terrain Heightfield & Gradient Attributes
#
# TECHNIQUE: Use Blender's mathutils.noise module to generate a terrain heightfield
# entirely in Python.  Sample hetero_terrain() per vertex for elevation-dependent
# roughness (smooth valleys, jagged crests), derive slope via central differences,
# store both as named FLOAT attributes, and export as GLB with custom accessors
# readable by Three.js / WebXR for terrain collision and visual zone colouring.
#
# WHY mathutils.noise INSTEAD OF GN NOISE TEXTURE:
#   GN Noise is GPU-evaluated, non-destructive, and fast to tweak interactively.
#   mathutils.noise is CPU-evaluated at script time and bakes into static vertex data.
#   That baking enables things that are impossible inside the GN graph:
#     • slope / aspect via central differences (needs random access over the grid)
#     • deterministic snapshots for A* pathfinding or river-network seeding
#     • per-vertex downstream logic (audio trigger zones, LOD thresholds)
#     • GLB export of named scalars as typed custom accessors for Three.js
#
# WHY hetero_terrain() OVER fractal():
#   fractal() (FBM) applies equal high-frequency energy at every elevation.
#   hetero_terrain() modulates each octave amplitude by the current height
#   accumulator — low-altitude samples accumulate gently (marshland), high-altitude
#   samples amplify rapidly (rocky crests).  The practical difference is immediately
#   visible: valleys are smooth and river-like, ridgelines are jagged.
#
# MATHUTILS.NOISE FUNCTION SURVEY:
#   noise(pos, noise_basis)                           — single octave, range -1..1
#   turbulence(pos, octaves, hard, basis, amp, freq)  — FBM; hard=True = dunes
#   fractal(pos, H, lacunarity, octaves, basis)       — classic FBM
#   hetero_terrain(pos, H, lacunarity, oct, offset)   — elevation-dependent roughness
#   hybrid_multi_fractal(pos, H, lac, oct, offset, gain) — erosion analogue
#   ridged_multi_fractal(pos, H, lac, oct, offset, gain) — mountain ridges
#   cell(pos)          → float [0,1]   — Worley cell noise
#   cell_vector(pos)   → Vector        — per-cell gradient direction
#   voronoi(pos, metric, exponent)     → [F1, F2, F3, F4, pos, colour]
#
# ATTRIBUTES WRITTEN TO MESH:
#   elevation       FLOAT       POINT — hetero_terrain output, normalised [0,1]
#   slope           FLOAT       POINT — gradient magnitude via central diff, [0,1]
#   terrain_colour  FLOAT_COLOR POINT — RGBA zone (water/grass/rock/snow)
#
# GLB EXPORT:
#   elevation → custom accessor _ELEVATION
#   slope     → custom accessor _SLOPE
#   terrain_colour → COLOR_0 accessor

import bpy
import bmesh
import mathutils
import mathutils.noise as mn
from mathutils import Vector
import math

# ── parameters ────────────────────────────────────────────────────────────────
GRID_X        = 64          # vertices per X axis — 64×64 = 4 096 verts
GRID_Y        = 64          # vertices per Y axis
GRID_EXTENT   = 10.0        # half-extent in metres: terrain spans [-10, +10] XY

NOISE_SCALE   = 0.45        # frequency in noise space; larger = wider terrain
NOISE_OFFSET  = Vector((3.7, 1.2, 0.0))  # seed via world-space shift

H             = 0.55        # Hurst exponent: 0=rough, 1=smooth
LACUNARITY    = 2.1         # inter-octave frequency gap (classic = 2.0)
OCTAVES       = 7           # spectral octaves — 7 gives fine surface detail
OFFSET        = 0.8         # elevation-dependent roughness driver (hetero_terrain)
NOISE_BASIS   = 'PERLIN_ORIGINAL'  # basis for all octaves

TERRAIN_H     = 2.4         # maximum Z displacement in metres
SEA_LEVEL     = 0.18        # elevation fraction below which = water zone

# zone colour thresholds (fractions of normalised elevation range 0..1)
GRASS_MAX     = 0.42
ROCK_MAX      = 0.72

EXPORT_PATH   = "//terrain_heightfield.glb"
MESH_NAME     = "terrain_heightfield"
MAT_NAME      = "terrain_zone"

# ── 1 · clean scene ──────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# ── 2 · build quad grid via bmesh ────────────────────────────────────────────
# bmesh.ops.create_grid(size=half-extent, x_segments=edge_count) → vertex count
# = (x_segments+1) × (y_segments+1).  Row-major vertex order: v[r*GRID_X + c].
bm = bmesh.new()
bmesh.ops.create_grid(
    bm,
    x_segments=GRID_X - 1,
    y_segments=GRID_Y - 1,
    size=GRID_EXTENT,
)
mesh = bpy.data.meshes.new(MESH_NAME)
bm.to_mesh(mesh)
bm.free()

obj = bpy.data.objects.new(MESH_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ── 3 · sample hetero_terrain per vertex ────────────────────────────────────
elevation_raw = []
verts = mesh.vertices

for v in verts:
    nx = v.co.x / GRID_EXTENT * NOISE_SCALE + NOISE_OFFSET.x
    ny = v.co.y / GRID_EXTENT * NOISE_SCALE + NOISE_OFFSET.y
    h = mn.hetero_terrain(
        Vector((nx, ny, 0.0)),
        H, LACUNARITY, OCTAVES, OFFSET, NOISE_BASIS,
    )
    elevation_raw.append(h)

h_min   = min(elevation_raw)
h_max   = max(elevation_raw)
h_range = (h_max - h_min) or 1.0

# Apply Z displacement; build normalised elevation list [0..1]
elevation_norm = []
for i, v in enumerate(verts):
    t = (elevation_raw[i] - h_min) / h_range
    elevation_norm.append(t)
    v.co.z = t * TERRAIN_H

# ── 4 · store elevation attribute (FLOAT, POINT) ────────────────────────────
elev_attr = mesh.attributes.new('elevation', 'FLOAT', 'POINT')
for i, t in enumerate(elevation_norm):
    elev_attr.data[i].value = t

# ── 5 · slope via central differences ───────────────────────────────────────
# Slope = |∇h| = sqrt(dh/dx² + dh/dy²) in normalised height units per metre.
# Central differences on interior vertices; forward/backward on edges.
# Grid spacing in normalised coords = 1/(GRID_X-1) per edge × actual step.
step = (GRID_EXTENT * 2.0) / (GRID_X - 1)  # metres per grid step

def _e(r, c):
    r = max(0, min(GRID_Y - 1, r))
    c = max(0, min(GRID_X - 1, c))
    return elevation_norm[r * GRID_X + c]

slope_values = []
for i in range(len(verts)):
    r = i // GRID_X
    c = i  % GRID_X
    dh_dx = (_e(r, c + 1) - _e(r, c - 1)) / (2.0 * step)
    dh_dy = (_e(r + 1, c) - _e(r - 1, c)) / (2.0 * step)
    slope_values.append(math.sqrt(dh_dx ** 2 + dh_dy ** 2))

slope_max  = max(slope_values) or 1.0
slope_attr = mesh.attributes.new('slope', 'FLOAT', 'POINT')
for i, s in enumerate(slope_values):
    slope_attr.data[i].value = s / slope_max

# ── 6 · zone colour (FLOAT_COLOR, POINT) ───────────────────────────────────
# Linear-space RGBA.  Water below SEA_LEVEL to flatten apparent mesh geometry.
WATER = (0.03, 0.09, 0.28, 1.0)
GRASS = (0.10, 0.25, 0.06, 1.0)
ROCK  = (0.22, 0.19, 0.17, 1.0)
SNOW  = (0.88, 0.90, 0.95, 1.0)

def _zone(t):
    if t < SEA_LEVEL:  return WATER
    if t < GRASS_MAX:  return GRASS
    if t < ROCK_MAX:   return ROCK
    return SNOW

col_attr = mesh.attributes.new('terrain_colour', 'FLOAT_COLOR', 'POINT')
for i, t in enumerate(elevation_norm):
    col_attr.data[i].color = _zone(t)

# Clamp Z at sea level for water areas — produces a flat ocean floor visually
for i, v in enumerate(verts):
    if elevation_norm[i] < SEA_LEVEL:
        v.co.z = SEA_LEVEL * TERRAIN_H

# ── 7 · flat shading ─────────────────────────────────────────────────────────
for poly in mesh.polygons:
    poly.use_smooth = False
mesh.update()

# ── 8 · material: Attribute → Principled BSDF ───────────────────────────────
mat   = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
nt    = mat.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

out  = nodes.new('ShaderNodeOutputMaterial');  out.location  = (400, 0)
pbr  = nodes.new('ShaderNodeBsdfPrincipled'); pbr.location  = (0,   0)
attr = nodes.new('ShaderNodeAttribute');      attr.location = (-300, 0)
attr.attribute_type = 'GEOMETRY'
attr.attribute_name = 'terrain_colour'

links.new(attr.outputs['Color'], pbr.inputs['Base Color'])
links.new(pbr.outputs['BSDF'],  out.inputs['Surface'])

pbr.inputs['Roughness'].default_value         = 0.85
pbr.inputs['Metallic'].default_value          = 0.0
pbr.inputs['Specular IOR Level'].default_value = 0.0

mesh.materials.append(mat)

# ── 9 · export GLB with named attributes ─────────────────────────────────────
# export_attributes=True writes elevation and slope as custom accessors
# (prefixed _ELEVATION, _SLOPE in the glTF buffer).
# export_colors=True writes terrain_colour as COLOR_0.
# export_yup=True flips +Z→+Y so Three.js scene-up matches WebXR conventions.
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath         = bpy.path.abspath(EXPORT_PATH),
    use_selection    = True,
    export_format    = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_colors    = True,
    export_attributes= True,
    export_apply     = True,
    export_yup       = True,
)

print(f"[mathutils.noise terrain] Exported → {bpy.path.abspath(EXPORT_PATH)}")
print(f"  Grid: {GRID_X}×{GRID_Y}  Verts: {len(verts)}")
print(f"  Elevation raw range: {h_min:.4f} .. {h_max:.4f}")
print(f"  Slope max (pre-norm): {slope_max:.6f} units/m")
