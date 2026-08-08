"""
Python numpy + scipy.ndimage — 3D Site Percolation:
    Hoshen–Kopelman Algorithm, Critical Spanning Cluster
    & Faceted Voxel Poi Head for WebXR (Blender 5.1)
====================================================================
Technique
---------
Site percolation randomly occupies each vertex of an N×N×N cubic lattice
with independent probability p.  Below the critical threshold p_c ≈ 0.3116
(simple cubic), only finite isolated clusters form.  Above p_c a single
"spanning cluster" (the infinite cluster in the thermodynamic limit) first
appears.  Exactly at p = p_c the cluster is a fractal with Hausdorff
dimension d_f ≈ 2.52 — denser than a surface (d=2) but sparser than a
volume (d=3).

Critical exponents (3D percolation universality class):
  • ν ≈ 0.876   (correlation-length divergence: ξ ∼ |p−p_c|^{−ν})
  • β ≈ 0.418   (order parameter: P_∞ ∼ (p−p_c)^β above p_c)
  • γ ≈ 1.793   (mean cluster size divergence: S ∼ |p−p_c|^{−γ})

The Hoshen–Kopelman (1976) algorithm labels connected components in a
single raster sweep using a union–find structure with path compression.
Here we delegate the sweep to scipy.ndimage.label (BSD-3-Clause), which
is the standard optimised implementation.  The largest label is the
spanning cluster.  An exposed-face voxel mesh is constructed entirely in
numpy by finding, for each of the 6 axis directions, every cluster–vacancy
boundary face.  Vertex colours run amber (dense interior) → teal (fractal
tips) along the z-axis.

Poi connection
--------------
Percolation threshold is the physical analogue of "critical trace density"
in light painting.  Below p_c: isolated light blobs, no paths connecting
opposite walls.  Above p_c: one contiguous luminous web fills the
bounding sphere.  Exactly at p_c: the poi trace's fractal dimension
(≈ 2.52) matches that of the surface between lit and unlit space —
maximum visual complexity for minimum material.

Outside sources
---------------
• Hoshen, J. & Kopelman, R. (1976). "Percolation and cluster distribution.
  I. Cluster multiple labeling technique and critical concentration
  algorithm." Physical Review B, 14(8), 3438–3445.
  Mathematical algorithm in the public domain (algorithms are not
  copyrightable).
  Related: Leath (1976) single-cluster growth algorithm;
  Newman & Ziff (2001) fast Newman algorithm (PRE 64, 016706).

• scipy / scipy  BSD-3-Clause
  https://github.com/scipy/scipy
  Authors: Travis Oliphant et al. / SciPy community.
  scipy.ndimage.label implements the equivalent of HK labelling on
  N-dimensional arrays.  Using it here lets the blueprint stay under
  300 lines while remaining verifiable against the ANSI C reference.
  Related: scikit-image/scikit-image (BSD); networkx/networkx (BSD).
"""

import bpy, bmesh, numpy as np, math
import scipy.ndimage as ndi
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG      = "hf_percolation"   # object / file prefix
N         = 55                  # lattice side; N³ = ~166 k sites
P_SITE    = 0.3116              # p_c for site percolation on simple cubic lattice
SEED      = 2024                # reproducible PRNG seed
VOXEL_SZ  = 1.0                 # lattice spacing before final scale
POI_DIAM  = 0.14                # target bounding diameter in metres (14 cm poi head)
EMIT_STR  = 4.5                 # emission strength — Eevee bloom glow
DRACO     = 6                   # Draco compression level (0–10)
OUT_GLB   = "//hf_percolation_poi.glb"
OUT_BLD   = "//hf_percolation_poi.blend"

AMBER  = (1.00, 0.55, 0.10, 1.0)   # warm cluster interior colour
TEAL   = (0.10, 0.90, 0.80, 1.0)   # cool fractal-tip colour

# ── 1. Random occupation grid ─────────────────────────────────────────────────
rng  = np.random.default_rng(SEED)
grid = rng.random((N, N, N)) < P_SITE   # bool N³

# ── 2. Connected-component labelling (6-connectivity: face neighbours only) ──
struct               = ndi.generate_binary_structure(3, 1)   # 6-conn kernel
labels, n_clusters   = ndi.label(grid, structure=struct)
# labels: int32 N³; 0 = background; 1..n_clusters = distinct clusters.

if n_clusters == 0:
    raise RuntimeError(f"[{SLUG}] No clusters at p={P_SITE}; increase P_SITE.")

sizes          = np.bincount(labels.ravel())
sizes[0]       = 0                              # ignore background label
largest_label  = int(sizes.argmax())
cluster        = (labels == largest_label)      # bool mask of spanning cluster

n_sites = int(cluster.sum())
print(f"[{SLUG}] {n_clusters} clusters; spanning cluster: "
      f"{n_sites} sites ({100.*n_sites/grid.sum():.1f}% of occupied)")

# ── 3. Exposed-face voxel mesh ────────────────────────────────────────────────
# Pad with False border → boundary faces emerge automatically.
pad = np.zeros((N + 2,) * 3, dtype=np.uint8)
pad[1:-1, 1:-1, 1:-1] = cluster

# Slices that retrieve the original N³ region from the padded array.
C = pad[1:-1, 1:-1, 1:-1]          # current cells

# For each of 6 face directions (axis ∈ {0,1,2}, sign ∈ {+1,−1}):
#   exposed face ⟺ C[i,j,k]=1 AND neighbour-in-direction=0
DIRS = [
    (0, +1, slice(2, None), slice(None, -2), slice(1, -1), slice(1, -1)),
    (0, -1, slice(0, -2),   slice(2, None),  slice(1, -1), slice(1, -1)),
    (1, +1, slice(1, -1),   slice(1, -1),    slice(2, None), slice(None, -2)),
    (1, -1, slice(1, -1),   slice(1, -1),    slice(0, -2),   slice(2, None)),
    (2, +1, slice(1, -1),   slice(1, -1),    slice(1, -1),   slice(1, -1)),
    (2, -1, slice(1, -1),   slice(1, -1),    slice(1, -1),   slice(1, -1)),
]

# Simpler: compute all 6 directions with np.roll on the padded array.
raw_quads = []   # will collect (K,4,3) float32 arrays

for axis, sign in [(0,+1),(0,-1),(1,+1),(1,-1),(2,+1),(2,-1)]:
    nbr_slice = [slice(1,-1), slice(1,-1), slice(1,-1)]
    nbr_slice[axis] = slice(2, None) if sign > 0 else slice(0, -2)
    nbr = pad[tuple(nbr_slice)]
    pos  = np.argwhere(C & ~nbr)     # (K,3): (i,j,k) indices of exposed cells
    K    = len(pos)
    if K == 0:
        continue

    ix, iy, iz = pos[:, 0], pos[:, 1], pos[:, 2]
    q = np.empty((K, 4, 3), dtype=np.float32)

    if axis == 0:
        fx = ix + (1 if sign > 0 else 0)
        q[:, :, 0] = fx[:, None]
        q[:, 0, 1], q[:, 0, 2] = iy,   iz
        q[:, 1, 1], q[:, 1, 2] = iy,   iz+1
        q[:, 2, 1], q[:, 2, 2] = iy+1, iz+1
        q[:, 3, 1], q[:, 3, 2] = iy+1, iz
    elif axis == 1:
        fy = iy + (1 if sign > 0 else 0)
        q[:, :, 1] = fy[:, None]
        q[:, 0, 0], q[:, 0, 2] = ix,   iz
        q[:, 1, 0], q[:, 1, 2] = ix+1, iz
        q[:, 2, 0], q[:, 2, 2] = ix+1, iz+1
        q[:, 3, 0], q[:, 3, 2] = ix,   iz+1
    else:
        fz = iz + (1 if sign > 0 else 0)
        q[:, :, 2] = fz[:, None]
        q[:, 0, 0], q[:, 0, 1] = ix,   iy
        q[:, 1, 0], q[:, 1, 1] = ix+1, iy
        q[:, 2, 0], q[:, 2, 1] = ix+1, iy+1
        q[:, 3, 0], q[:, 3, 1] = ix,   iy+1

    if sign < 0:             # flip winding so normals stay outward
        q = q[:, ::-1, :]
    raw_quads.append(q)

if not raw_quads:
    raise RuntimeError(f"[{SLUG}] Spanning cluster produced no exposed faces.")

# Stack all quads; deduplicate vertices (integer coords → exact equality).
v_raw   = np.vstack([r.reshape(-1, 3) for r in raw_quads])    # (4F, 3)
n_faces = v_raw.shape[0] // 4
v_int   = v_raw.astype(np.int32)
v_uniq, inv = np.unique(v_int, axis=0, return_inverse=True)
faces_np = inv.reshape(n_faces, 4)
print(f"[{SLUG}] Mesh: {len(v_uniq)} verts, {n_faces} quads")

# ── 4. Build bmesh ────────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new(SLUG)
bm   = bmesh.new()

bverts = [bm.verts.new(v.tolist()) for v in v_uniq.astype(float)]
bm.verts.ensure_lookup_table()
for fi in faces_np:
    try:
        bm.faces.new([bverts[i] for i in fi])
    except ValueError:
        pass    # skip degenerate duplicate faces (should be absent after dedup)
bm.faces.ensure_lookup_table()

# Shade flat (no smooth normals for voxel aesthetic)
for f in bm.faces:
    f.smooth = False

# ── 5. Vertex colour: height gradient ─────────────────────────────────────────
col_layer = bm.loops.layers.color.new("Col")
z_all     = np.array([v.co.z for v in bm.verts])
z_min, z_rng = z_all.min(), max(z_all.ptp(), 1.0)
for face in bm.faces:
    for loop in face.loops:
        t = (loop.vert.co.z - z_min) / z_rng
        loop[col_layer] = tuple(
            (1 - t) * a + t * b for a, b in zip(AMBER, TEAL)
        )

bm.to_mesh(mesh)
bm.free()
mesh.update()

# ── 6. Object, centre, scale ──────────────────────────────────────────────────
obj = bpy.data.objects.new(SLUG, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Recalculate normals outward using operator (safe in Blender 5.1)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

# Centre at origin, fit to poi-head bounding sphere
vc = np.array([v.co[:] for v in mesh.vertices])
ctr = vc.mean(axis=0)
for v in mesh.vertices:
    v.co -= Vector(ctr)
r_max = float(np.linalg.norm(vc - ctr, axis=1).max())
scale = (POI_DIAM / 2.0) / max(r_max, 1e-6)
for v in mesh.vertices:
    v.co *= scale
mesh.update()

obj["holoflow:facet"] = True     # studio export flag
obj.name = SLUG

# ── 7. Emission material ──────────────────────────────────────────────────────
mat = bpy.data.materials.new(SLUG + "_mat")
mat.use_nodes = True
nt  = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
attr = nt.nodes.new("ShaderNodeAttribute");      attr.attribute_name = "Col"
emit = nt.nodes.new("ShaderNodeEmission");       emit.inputs["Strength"].default_value = EMIT_STR
out  = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(attr.outputs["Color"],    emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
mesh.materials.append(mat)

# ── 8. Eevee scene ────────────────────────────────────────────────────────────
scn                       = bpy.context.scene
scn.render.engine         = 'BLENDER_EEVEE_NEXT'
scn.eevee.use_bloom       = True
scn.eevee.bloom_threshold = 0.35
scn.eevee.bloom_intensity = 0.70

# ── 9. Export GLB + save blend ────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT_BLD))
bpy.ops.export_scene.gltf(
    filepath          = bpy.path.abspath(OUT_GLB),
    export_format     = 'GLB',
    use_selection     = True,
    export_apply      = True,
    export_attributes = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO,
    export_image_format = 'WEBP',
    export_yup        = True,
)

print(f"[{SLUG}] done — {n_faces} quads · {n_sites} cluster sites "
      f"· p_c={P_SITE} · N={N} · seed={SEED}")
