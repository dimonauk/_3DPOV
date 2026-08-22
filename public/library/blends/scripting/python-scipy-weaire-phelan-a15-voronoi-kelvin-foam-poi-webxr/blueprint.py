"""
Python scipy — Weaire-Phelan Foam: A15 Voronoi Cells, Kelvin Conjecture &
Pyritohedron/Tetrakaidecahedron Poi Head for WebXR (Blender 5.1)
==========================================================================

TECHNIQUE
---------
Build the Weaire-Phelan foam directly from its A15 crystal lattice (Cr₃Si
structure) by computing a periodic 3-D Voronoi tessellation of the 8 seed
points in the unit cell.  The result is exactly 2 pyritohedra (12-faced,
type A) + 6 tetrakaidecahedra (14-faced, type B) — the two cell species that
Weaire & Phelan (1994) showed partition space with 0.3 % less surface area
per unit volume than Kelvin's truncated-octahedron honeycomb.

WHY VORONOI OVER LEVEL-SET
---------------------------
A level-set / marching-cubes approach (used in the Gyroid tutorial) extracts
the partition surface but discards cell identity — you can't easily distinguish
A from B cells or count faces.  Direct Voronoi construction gives the exact
convex polyhedra, which we can colour by type, count, and export as two named
mesh objects for real-time XR inspection.

IMPLEMENTATION CHOICES
----------------------
• scipy.spatial.Voronoi: handles the full Delaunay/Voronoi duality in one call.
• Periodic BCs: replicate the 8 seeds in a 5×5×5 supercell (tile_n=2) so every
  boundary ridge has a valid finite opposite region — no infinite Voronoi vertices.
• Ridge-based face reconstruction: `vor.ridge_points` + `vor.ridge_vertices`
  give convex polygon faces directly.  Sorting by angle around the face centroid
  using the outward-normal direction avoids the mesh-dissolve workaround.
• Shape keys: four offset variants of the cell cluster shrink/expand each cell
  relative to its seed centre, mimicking soap-film thickness morph for WebXR.
• Export: Draco-6 GLB with Y-up, applied transforms, `holoflow:facet` flag.
"""

import bpy, bmesh, numpy as np, math, os
from scipy.spatial import Voronoi

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG       = "hf_weaire_phelan"
CELL_SIZE  = 1.4          # unit-cell side length in Blender metres
TILE_N     = 2            # replicate in (2*TILE_N+1)³ = 5³ supercell
SHRINK_KS  = [0.98, 0.92, 0.84, 0.74]   # per shape-key: cell shrink factors
EMIT_A     = (0.20, 0.85, 0.95)   # teal  — pyritohedra  (type A)
EMIT_B     = (0.90, 0.30, 0.65)   # coral — tetrakaidecahedra (type B)
EMIT_STR   = 4.0
OUT_GLB    = f"//{SLUG}.glb"
OUT_BLEND  = f"//{SLUG}.blend"

# ── A15 seed points (normalised [0,1]³) ──────────────────────────────────────
# Cr₃Si crystal: 2 Si atoms (BCC corners/body-centre) → pyritohedra,
#                6 Cr atoms (face-chain sites) → tetrakaidecahedra.
# Periodic topology: corners are all equivalent via 8 corners → 1 true corner.
A_NORM = np.array([[0.00, 0.00, 0.00],
                   [0.50, 0.50, 0.50]])          # 2 pyritohedra
B_NORM = np.array([[0.25, 0.50, 0.00],
                   [0.75, 0.50, 0.00],
                   [0.00, 0.25, 0.50],
                   [0.00, 0.75, 0.50],
                   [0.50, 0.00, 0.25],
                   [0.50, 0.00, 0.75]])          # 6 tetrakaidecahedra
SEEDS_NORM = np.vstack([A_NORM, B_NORM])         # (8, 3)
N_A, N_B = len(A_NORM), len(B_NORM)
N_S = N_A + N_B                                  # = 8

# ── 1. Periodic Voronoi via supercell ─────────────────────────────────────────
# Translate seeds to world coordinates, then tile.
SEEDS = SEEDS_NORM * CELL_SIZE                   # (8, 3) world-space, metres

shifts = np.array([[i, j, k]
                   for i in range(-TILE_N, TILE_N + 1)
                   for j in range(-TILE_N, TILE_N + 1)
                   for k in range(-TILE_N, TILE_N + 1)],
                  dtype=float)                   # ((2*TILE_N+1)³, 3)
N_tiles = len(shifts)

tiled_pts = (SEEDS[None] + (shifts * CELL_SIZE)[:, None]).reshape(-1, 3)
# shape: (N_tiles * N_S, 3)

vor = Voronoi(tiled_pts)

# Index of the (0,0,0) shift — the central unit cell we want
centre_shift_idx = int(np.where(np.all(shifts == 0, axis=1))[0][0])
central_indices  = np.arange(centre_shift_idx * N_S,
                              (centre_shift_idx + 1) * N_S)  # (8,) global seed indices

# ── 2. Face-extraction helper ─────────────────────────────────────────────────
def voronoi_cell_faces(global_seed_idx, seed_pos):
    """Return list[list[int]] — per-face vertex indices into vor.vertices.

    Uses the ridge table: each ridge shared with global_seed_idx is one face.
    Vertices are sorted by angle around the face centroid (outward-normal frame)
    so bmesh.faces.new() receives them in correct winding order.
    """
    faces_out = []
    for ridge_idx, (p1, p2) in enumerate(vor.ridge_points):
        if p1 != global_seed_idx and p2 != global_seed_idx:
            continue
        verts_idx = vor.ridge_vertices[ridge_idx]
        if -1 in verts_idx:
            continue                             # infinite ridge — skip
        pts = vor.vertices[verts_idx]            # (K, 3) polygon vertices
        centre = pts.mean(axis=0)
        normal = centre - seed_pos               # outward from seed
        nn = np.linalg.norm(normal)
        if nn < 1e-10:
            continue
        normal /= nn
        ref = pts[0] - centre
        ref -= np.dot(ref, normal) * normal
        rn = np.linalg.norm(ref)
        if rn < 1e-10:
            continue
        ref /= rn
        perp = np.cross(normal, ref)
        d = pts - centre
        angles = np.arctan2(d @ perp, d @ ref)
        order = np.argsort(angles)
        faces_out.append([verts_idx[o] for o in order])
    return faces_out

# ── 3. Clear scene ────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.meshes) + list(bpy.data.materials):
    bpy.data.batch_remove(ids=[block])

# ── 4. Materials ─────────────────────────────────────────────────────────────
def emission_mat(name, colour, strength=EMIT_STR):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    mix  = nt.nodes.new("ShaderNodeMixShader")
    emit = nt.nodes.new("ShaderNodeEmission")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit.inputs["Color"].default_value    = (*colour, 1.0)
    emit.inputs["Strength"].default_value = strength
    bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.25
    mix.inputs["Fac"].default_value         = 0.35   # 35 % emission blend
    nt.links.new(emit.outputs[0], mix.inputs[2])
    nt.links.new(bsdf.outputs[0], mix.inputs[1])
    nt.links.new(mix.outputs[0],  out.inputs[0])
    return mat

mat_a = emission_mat("wp_pyritohedron",       EMIT_A)
mat_b = emission_mat("wp_tetrakaidecahedron", EMIT_B)

# ── 5. Build one mesh object per Voronoi cell ─────────────────────────────────
parent = bpy.data.objects.new(SLUG, None)
bpy.context.scene.collection.objects.link(parent)
parent["holoflow:facet"] = True

for local_i, global_i in enumerate(central_indices):
    seed_pos = SEEDS[local_i]                    # world-space seed centre
    faces    = voronoi_cell_faces(int(global_i), seed_pos)
    if len(faces) < 4:
        continue

    # Collect all unique vertex coordinates needed by this cell
    all_vert_idx = sorted({v for face in faces for v in face})
    coord_map    = {old: new for new, old in enumerate(all_vert_idx)}
    coords       = vor.vertices[all_vert_idx]    # (K, 3)

    bm = bmesh.new()
    bm_v = [bm.verts.new(c) for c in coords]
    bm.verts.ensure_lookup_table()
    for face in faces:
        try:
            bm.faces.new([bm_v[coord_map[v]] for v in face])
        except Exception:
            pass
    bm.normal_update()

    mesh = bpy.data.meshes.new(f"cell_{local_i:02d}")
    bm.to_mesh(mesh); bm.free()
    mesh.shade_flat()

    obj_name = f"pyritohedron_{local_i}" if local_i < N_A else f"tetrakaidecahedron_{local_i - N_A}"
    obj = bpy.data.objects.new(obj_name, mesh)
    obj["holoflow:facet"] = True
    obj.parent = parent
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_a if local_i < N_A else mat_b)

    # ── Shape keys: shrink each cell toward its seed centre ─────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    for ki, factor in enumerate(SHRINK_KS):
        sk = obj.shape_key_add(name=f"shrink_{int(factor*100)}", from_mix=False)
        for j, v in enumerate(sk.data):
            v.co = coords[j] * factor + seed_pos * (1.0 - factor)

# ── 6. Lights + camera ────────────────────────────────────────────────────────
sun = bpy.data.lights.new("sun", 'SUN')
sun.energy = 4.0
sun_obj = bpy.data.objects.new("Sun", sun)
sun_obj.rotation_euler = (math.radians(60), 0, math.radians(30))
bpy.context.scene.collection.objects.link(sun_obj)

cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
cam_obj.location = (CELL_SIZE * 2.8, -CELL_SIZE * 2.8, CELL_SIZE * 1.6)
cam_obj.rotation_euler = (math.radians(65), 0, math.radians(45))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# ── 7. EEVEE render settings ─────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 0.6
scene.eevee.bloom_intensity  = 0.8
scene.eevee.bloom_radius     = 4.0

# ── 8. Save + export ─────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLEND))

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUT_GLB),
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply=True,
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    use_selection=False,
)
print(f"[WP] Done → {OUT_GLB}")
