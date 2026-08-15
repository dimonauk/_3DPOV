# =============================================================================
# Menger Sponge — Level-3 Fractal Void Cage Poi Head
# Blender 5.1  |  Python 3.11  |  numpy required (bundled with Blender 5.1)
#
# TECHNIQUE
#   Karl Menger (1926) defined his sponge recursively: take a unit cube,
#   subdivide it into 3×3×3 = 27 sub-cubes, remove the 7 whose integer
#   coordinates (i,j,k) ∈ {0,1,2}³ satisfy count(coord == 1) ≥ 2, then
#   recurse on each of the 20 remaining cubes.  After N levels the sponge
#   lives in a 3ᴺ × 3ᴺ × 3ᴺ integer grid.
#
#   WHY count(coord == 1) ≥ 2 is the removal rule:
#     In a 3×3×3 block, coord == 1 marks the middle slice in that axis.
#     Cells where ≥ 2 axes are in their middle slice form the through-tunnels
#     (face-centred crosses) plus the body centre — exactly the 7 that must
#     go.  This extends to deeper levels by testing each base-3 digit.
#
#   Hausdorff dimension: d = log(20)/log(3) ≈ 2.7268…
#   Menger's universality theorem: every compact 1-dim metric space embeds
#   homeomorphically in M³ (despite d ≈ 2.73, the topological dimension = 1).
#   Volume at level N: Vₙ = (20/27)ⁿ → 0.  Surface area → ∞.
#
#   MESH ALGORITHM
#     1. Mark all 3ᴺ grid cells occupied/empty via vectorised base-3 digit test.
#     2. For each occupied cell, emit only the faces adjacent to empty space
#        or the bounding-box boundary.  This gives the exact visible surface
#        without any hidden internal geometry.
#     3. Vertex colour encodes face-normal axis: +X/−X = red, +Y/−Y = green,
#        +Z/−Z = blue.  This makes the three tunnel families immediately legible.
#     4. Shape key "SK_Exploded" scales each sub-cube outward from its centre
#        by EXPAND_FACTOR, separating them while preserving vertex count.
#
# POI HEAD
#   GLB: Draco-6, WebP, +Y-up, morph targets, holoflow:facet flag.
#   Scale: bounding box fitted to POI_DIAMETER (metres).
# =============================================================================

import math
import os
from collections import defaultdict

import bpy
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
N_LEVEL       = 3            # recursion depth; 1→20 cubes, 2→400, 3→8000
GRID          = 3 ** N_LEVEL # 27 — integer lattice side length
POI_DIAMETER  = 0.16         # target bounding-box diameter in metres
EXPAND_FACTOR = 1.35         # SK_Exploded sub-cube scale factor
METALLIC      = 0.55
ROUGHNESS     = 0.18
EMISSION_STR  = 2.40
EMIT_MIX      = 0.20

OUTPUT_GLB = os.path.join(
    bpy.path.abspath("//"),
    "../../glbs/scripting/"
    "python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr/"
    "hf_menger_poi.glb",
)

# ── Step 1 — Build occupied array (vectorised) ────────────────────────────────
# WHY vectorised: Python loops over 19683 cells are ~2s; numpy finishes in <50ms.

coords = np.arange(GRID)
I, J, K = np.meshgrid(coords, coords, coords, indexing="ij")  # (27,27,27)

occupied = np.ones((GRID, GRID, GRID), dtype=bool)
ti, tj, tk = I.copy(), J.copy(), K.copy()
for _ in range(N_LEVEL):
    di, dj, dk = ti % 3, tj % 3, tk % 3
    cross = (di == 1).astype(np.int8) + (dj == 1).astype(np.int8) + (dk == 1).astype(np.int8)
    occupied &= cross < 2
    ti //= 3;  tj //= 3;  tk //= 3

assert int(occupied.sum()) == 20 ** N_LEVEL, \
    f"Expected {20**N_LEVEL} cells, got {occupied.sum()}"  # 8000 for N=3

occupied_list = list(zip(*np.where(occupied)))  # [(i,j,k), ...]

# ── Step 2 — Build exterior mesh ──────────────────────────────────────────────
# For each occupied cell emit only faces adjacent to empty space / boundary.
# Face winding: CCW when viewed from outside (right-hand normal pointing out).

verts_pos   = []          # list of (x,y,z) int tuples
vert_idx    = {}          # (x,y,z) → index
faces_list  = []          # list of (v0,v1,v2,v3) index quads
face_axis   = []          # 0=X, 1=Y, 2=Z per face (for vertex colour)
vert_cells  = defaultdict(list)  # vertex index → [(i,j,k), ...]

def _v(pos):
    if pos not in vert_idx:
        vert_idx[pos] = len(verts_pos)
        verts_pos.append(pos)
    return vert_idx[pos]

# Six face directions: (neighbour delta, axis, CCW quad of corner offsets)
FACE_DEFS = [
    ((+1, 0, 0), 0, [(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),  # +X
    ((-1, 0, 0), 0, [(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),  # -X
    ((0, +1, 0), 1, [(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),  # +Y
    ((0, -1, 0), 1, [(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),  # -Y
    ((0,  0,+1), 2, [(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),  # +Z
    ((0,  0,-1), 2, [(0,0,0),(0,1,0),(1,1,0),(1,0,0)]),  # -Z
]

for (ci, cj, ck) in occupied_list:
    for (di, dj, dk), axis, corners in FACE_DEFS:
        ni, nj, nk = ci + di, cj + dj, ck + dk
        # Emit face only when neighbour is empty or out of bounds
        if 0 <= ni < GRID and 0 <= nj < GRID and 0 <= nk < GRID:
            if occupied[ni, nj, nk]:
                continue
        quad = []
        for (ox, oy, oz) in corners:
            pos = (ci + ox, cj + oy, ck + oz)
            vi  = _v(pos)
            vert_cells[vi].append((ci, cj, ck))
            quad.append(vi)
        faces_list.append(tuple(quad))
        face_axis.append(axis)

# ── Step 3 — Normalise vertex positions to [-0.5, 0.5] ──────────────────────
scale = POI_DIAMETER / GRID
verts_f = [(x * scale - POI_DIAMETER / 2,
            y * scale - POI_DIAMETER / 2,
            z * scale - POI_DIAMETER / 2)
           for (x, y, z) in verts_pos]

# ── Step 4 — Create Blender mesh ──────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

mesh = bpy.data.meshes.new("menger_sponge")
mesh.from_pydata(verts_f, [], faces_list)
mesh.validate()
obj = bpy.data.objects.new("menger_sponge", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Step 5 — Vertex colour (axis-direction encoding) ─────────────────────────
# WHY face-corner colours: Blender vertex-colour layers are per corner, not
# per vertex — this lets each face own its own colour regardless of sharing.
col_layer = mesh.vertex_colors.new(name="axis_colour")
# face_axis[i] ∈ {0,1,2} → rgb
AXIS_COLOURS = [
    (0.92, 0.20, 0.18, 1.0),  # X-tunnels: red
    (0.22, 0.78, 0.30, 1.0),  # Y-tunnels: green
    (0.18, 0.40, 0.90, 1.0),  # Z-tunnels: blue
]
for poly, ax in zip(mesh.polygons, face_axis):
    c = AXIS_COLOURS[ax]
    for li in poly.loop_indices:
        col_layer.data[li].color = c

# ── Step 6 — Shape key SK_Exploded ───────────────────────────────────────────
# Expand each sub-cube outward from its centre by EXPAND_FACTOR.
# WHY same vertex count: shape keys require identical topology.
# Each vertex moves as a weighted average of its owning cells' expansions.
obj.shape_key_add(name="Basis", from_mix=False)
sk_exp = obj.shape_key_add(name="SK_Exploded", from_mix=False)

cell_centre = {}
for (ci, cj, ck) in occupied_list:
    cell_centre[(ci, cj, ck)] = np.array(
        [(ci + 0.5) * scale - POI_DIAMETER / 2,
         (cj + 0.5) * scale - POI_DIAMETER / 2,
         (ck + 0.5) * scale - POI_DIAMETER / 2], dtype=float)

for vi, (px, py, pz) in enumerate(verts_f):
    cells = vert_cells.get(vi, [])
    if not cells:
        sk_exp.data[vi].co = (px, py, pz)
        continue
    pos = np.array([px, py, pz])
    new_pos = np.zeros(3)
    for c in cells:
        cc = cell_centre[c]
        offset = pos - cc
        new_pos += cc + offset * EXPAND_FACTOR
    new_pos /= len(cells)
    sk_exp.data[vi].co = tuple(new_pos)

# ── Step 7 — Material ─────────────────────────────────────────────────────────
mat = bpy.data.materials.new("menger_mat")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
for n in nodes:
    nodes.remove(n)

out   = nodes.new("ShaderNodeOutputMaterial")
mix   = nodes.new("ShaderNodeMixShader")
emit  = nodes.new("ShaderNodeEmission")
pbr   = nodes.new("ShaderNodeBsdfPrincipled")
vcol  = nodes.new("ShaderNodeVertexColor")

vcol.layer_name   = "axis_colour"
pbr.inputs["Metallic"].default_value   = METALLIC
pbr.inputs["Roughness"].default_value  = ROUGHNESS
pbr.inputs["Base Color"].default_value = (0.08, 0.08, 0.12, 1.0)
emit.inputs["Strength"].default_value  = EMISSION_STR
mix.inputs[0].default_value            = EMIT_MIX

links.new(vcol.outputs["Color"], pbr.inputs["Base Color"])
links.new(vcol.outputs["Color"], emit.inputs["Color"])
links.new(pbr.outputs["BSDF"],   mix.inputs[1])
links.new(emit.outputs["Emission"], mix.inputs[2])
links.new(mix.outputs["Shader"],    out.inputs["Surface"])

out.location   = (600, 0);  mix.location  = (400, 0)
pbr.location   = (100, 80); emit.location = (100, -80); vcol.location = (-200, 0)

obj.data.materials.append(mat)

# ── Step 8 — Custom property for Holoflow WebXR exporter ─────────────────────
obj["holoflow:facet"] = True
obj.rotation_euler = (0, 0, 0)

# ── Step 9 — Export GLB ───────────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUTPUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath             = OUTPUT_GLB,
    export_format        = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format  = "WEBP",
    export_morph         = True,
    export_colors        = True,
    use_selection        = False,
    export_yup           = True,
)

print(
    f"Menger sponge L{N_LEVEL}: "
    f"{len(verts_f)} verts, {len(faces_list)} quads — "
    f"exported to {OUTPUT_GLB}"
)
