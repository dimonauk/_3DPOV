"""
Goldberg Polyhedra GP(1,1) — C₆₀ Buckminsterfullerene Cage & Hexagonal Poi Head
=================================================================================
A Goldberg polyhedron GP(m,n) tiles the sphere with exactly 12 pentagonal faces
and 10(T−1) hexagonal faces, where T = m²+mn+n² is the *triangulation number*.

  GP(1,0) T=1 → dodecahedron          12 pentagons  0 hexagons
  GP(1,1) T=3 → truncated icosahedron 12 pentagons 20 hexagons ← THIS FILE
  GP(2,0) T=4 → chamfered dodecahedron 12 pentagons 30 hexagons
  GP(3,0) T=9 → 12 pentagons 80 hexagons

The GP(1,1) is simultaneously: the dual of the class-II frequency-1 geodesic
sphere; the vertex configuration of C₆₀ Buckminsterfullerene; and the
internationally-standardised association-football panel pattern.  Euler's
formula demands exactly 12 pentagons regardless of T — every additional
hexagonal ring adds 10 more hexagons and leaves the 12 pentagons untouched.

Construction here: truncate each of the 12 icosahedron vertices at t = 1/3
of each incident edge, yielding 60 vertices, then project to the sphere.

References
----------
Goldberg M (1937) A class of multi-symmetric polyhedra. Tôhoku Math J 43:104–108 PD
Antiprism (Rossiter A, MIT) https://github.com/antiprism/antiprism
"""

import bpy, bmesh
import numpy as np
from scipy.spatial import ConvexHull
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────────
SLUG         = "hf_goldberg_gp11_poi"
POI_RADIUS   = 0.082          # m — Holoflow poi-head bounding radius
TRUNC_T      = 1 / 3          # GP(1,1): truncate each edge at t and 1-t
MAT_PENTA    = (0.82, 0.42, 0.04, 1.0)   # amber  — 12 pentagonal faces
MAT_HEXA     = (0.06, 0.35, 0.80, 1.0)   # cobalt — 20 hexagonal faces
EMIT_FRAC    = 0.06                        # emission blend fraction

# ── Step 1: icosahedron vertices ─────────────────────────────────────────────────
# The 12 vertices of a regular icosahedron lie on three mutually-orthogonal
# golden rectangles.  φ = (1+√5)/2 controls the 1:φ aspect ratio of each rect.
phi = (1.0 + np.sqrt(5.0)) / 2.0
_raw = []
for s1, s2 in [(+1,+1),(+1,-1),(-1,+1),(-1,-1)]:
    _raw += [(0, s1, s2*phi), (s1, s2*phi, 0), (s2*phi, 0, s1)]
icos_v = np.array(_raw, dtype=float)
icos_v /= np.linalg.norm(icos_v[0])   # normalise to unit sphere

# ── Step 2: icosahedron faces via convex hull ────────────────────────────────────
# ConvexHull gives 20 triangular faces; flip any with inward-facing normals.
hull   = ConvexHull(icos_v)
faces  = hull.simplices.copy()
for i, f in enumerate(faces):
    n = np.cross(icos_v[f[1]] - icos_v[f[0]], icos_v[f[2]] - icos_v[f[0]])
    if icos_v[f[0]].dot(n) < 0:
        faces[i] = [f[0], f[2], f[1]]   # reverse to make outward-facing

# ── Step 3: build canonical edge list (30 edges) ────────────────────────────────
edge_key_to_idx = {}
edges = []
for f in faces:
    for k in range(3):
        a, b = int(f[k]), int(f[(k+1) % 3])
        key  = (min(a, b), max(a, b))
        if key not in edge_key_to_idx:
            edge_key_to_idx[key] = len(edges)
            edges.append((a, b))  # canonical direction = lowest index first

# ── Step 4: trisect each edge → 60 GP(1,1) vertices ────────────────────────────
# For edge (a, b): two new points at t=1/3 and t=2/3.
# The point nearer a is stored as verts[2k], nearer b as verts[2k+1].
gp_verts_raw = np.zeros((60, 3))
# edge_verts[(a,b)] = (idx_near_a, idx_near_b) in gp_verts_raw
edge_verts = {}
for k, (a, b) in enumerate(edges):
    va, vb = icos_v[a], icos_v[b]
    p_near_a = (1 - TRUNC_T) * va + TRUNC_T * vb   # = (2a+b)/3
    p_near_b = TRUNC_T * va + (1 - TRUNC_T) * vb   # = (a+2b)/3
    gp_verts_raw[2*k]   = p_near_a
    gp_verts_raw[2*k+1] = p_near_b
    key = (min(a,b), max(a,b))
    if a < b:
        edge_verts[(a, b)] = (2*k, 2*k+1)
        edge_verts[(b, a)] = (2*k+1, 2*k)
    else:
        edge_verts[(a, b)] = (2*k+1, 2*k)
        edge_verts[(b, a)] = (2*k, 2*k+1)

# Project all 60 vertices onto the poi-head sphere
gp_verts = gp_verts_raw / np.linalg.norm(gp_verts_raw, axis=1, keepdims=True) * POI_RADIUS

# ── Step 5: build face index lists ──────────────────────────────────────────────
# Pentagons (12): one per original icosahedron vertex.
# For vertex v, collect its 5 incident edge trisection points (the one nearest v),
# then sort them cyclically around the outward normal = v itself.
pentagons = []
adj = {i: [] for i in range(12)}
for a, b in edges:
    adj[a].append(b)
    adj[b].append(a)

def cyclic_sort(v_idx, nbrs):
    """Sort neighbour indices by angle in the tangent plane at icos_v[v_idx]."""
    v  = icos_v[v_idx]
    up = np.array([0, 0, 1.0]) if abs(v[2]) < 0.9 else np.array([1.0, 0, 0])
    e1 = np.cross(up, v); e1 /= np.linalg.norm(e1)
    e2 = np.cross(v, e1); e2 /= np.linalg.norm(e2)
    pts  = [gp_verts_raw[edge_verts[(v_idx, u)][0]] for u in nbrs]
    angs = [np.arctan2((p - icos_v[v_idx]).dot(e2), (p - icos_v[v_idx]).dot(e1)) for p in pts]
    order = np.argsort(angs)
    return [nbrs[i] for i in order]

for v_idx in range(12):
    sorted_nbrs = cyclic_sort(v_idx, adj[v_idx])
    # Pentagon = the "near v_idx" trisection point on each of its 5 edges
    pentagons.append([edge_verts[(v_idx, u)][0] for u in sorted_nbrs])

# Hexagons (20): one per original icosahedron triangular face.
# Walking CCW around triangle (a→b→c), the 6 hexagon vertices are:
#   near-a on a-b, near-b on a-b, near-b on b-c, near-c on b-c, near-c on c-a, near-a on c-a
hexagons = []
for f in faces:
    a, b, c = int(f[0]), int(f[1]), int(f[2])
    hexagons.append([
        edge_verts[(a, b)][0], edge_verts[(a, b)][1],
        edge_verts[(b, c)][0], edge_verts[(b, c)][1],
        edge_verts[(c, a)][0], edge_verts[(c, a)][1],
    ])

print(f"GP(1,1): {len(gp_verts)} verts, "
      f"{len(pentagons)} pentagons, {len(hexagons)} hexagons")
# Expected: 60 verts, 12 pentagons, 20 hexagons  (T=3, 10(T-1)=20)

# ── Step 6: build Blender mesh ───────────────────────────────────────────────────
def _clean(name):
    for blk in [bpy.data.objects, bpy.data.meshes]:
        if name in blk:
            blk.remove(blk[name], do_unlink=True)

_clean(SLUG); _clean(SLUG + "_mesh")
mesh = bpy.data.meshes.new(SLUG + "_mesh")
obj  = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)

verts_co = [Vector(gp_verts[i]) for i in range(60)]
all_faces = pentagons + hexagons   # first 12 = pentagons, next 20 = hexagons
mesh.from_pydata(verts_co, [], all_faces)
mesh.validate(verbose=False)

# ── Step 7: two materials — amber pentagons, cobalt hexagons ─────────────────────
def _mat(name, base_col, emit_col=None):
    m = bpy.data.materials.get(name)
    if m: bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = base_col
    bsdf.inputs["Metallic"].default_value    = 0.35
    bsdf.inputs["Roughness"].default_value   = 0.22
    if emit_col:
        bsdf.inputs["Emission Color"].default_value  = emit_col
        bsdf.inputs["Emission Strength"].default_value = EMIT_FRAC
    return m

mat_p = _mat("gp11_pentagon", MAT_PENTA, (0.90, 0.55, 0.10, 1.0))
mat_h = _mat("gp11_hexagon",  MAT_HEXA,  (0.10, 0.45, 0.90, 1.0))
obj.data.materials.append(mat_p)   # index 0
obj.data.materials.append(mat_h)   # index 1

# Assign material index 0 to first 12 faces (pentagons), 1 to next 20 (hexagons)
for i, poly in enumerate(mesh.polygons):
    poly.material_index = 0 if i < 12 else 1

mesh.shade_flat()

# ── Step 8: shape keys ───────────────────────────────────────────────────────────
# SK_Basis  — sphere (already built)
# SK_Prolate — Z stretched ×1.50  (egg shape)
# SK_Flat    — Z compressed ×0.35 (discus)
# SK_Raw     — un-projected Platonic truncated icosahedron (flat faces visible)
bpy.context.view_layer.objects.active = obj
obj.shape_key_add(name="Basis", from_mix=False)

raw_norm = gp_verts_raw / np.linalg.norm(gp_verts_raw, axis=1, keepdims=True)
raw_scaled = raw_norm * POI_RADIUS

for sk_name, transform in [
    ("SK_Prolate", lambda v: v * np.array([1.0, 1.0, 1.5])),
    ("SK_Flat",    lambda v: v * np.array([1.0, 1.0, 0.35])),
    ("SK_Raw",     lambda v: gp_verts_raw[np.where(
                       np.all(np.isclose(gp_verts, v.reshape(1,3)), axis=1))[0][0]]
                             / np.max(np.linalg.norm(gp_verts_raw, axis=1)) * POI_RADIUS),
]:
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    if sk_name == "SK_Raw":
        # un-projected: flat-face Platonic shape, same bounding radius
        scale = POI_RADIUS / np.max(np.linalg.norm(gp_verts_raw, axis=1))
        for i, kp in enumerate(sk.data):
            kp.co = Vector(gp_verts_raw[i] * scale)
    else:
        for i, kp in enumerate(sk.data):
            kp.co = Vector(transform(gp_verts[i]))

# ── Step 9: custom properties (Holoflow exporter reads these) ────────────────────
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-head"
obj["holoflow:T"]        = 3       # triangulation number
obj["holoflow:pentagons"] = 12
obj["holoflow:hexagons"]  = 20

# ── Step 10: orient + export ─────────────────────────────────────────────────────
import math
obj.rotation_euler = (math.pi / 2, 0, 0)   # Blender Z-up → WebXR Y-up
bpy.ops.object.transform_apply(rotation=True)

bpy.ops.export_scene.gltf(
    filepath                        = f"//glbs/{SLUG}.glb",
    export_format                   = "GLB",
    use_selection                   = True,
    export_yup                      = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format             = "WEBP",
    export_morph                    = True,
    export_materials                = "EXPORT",
)

print(f"✓ {SLUG}.glb written — GP(1,1) C₆₀ cage: 60 verts 32 faces (12 penta + 20 hexa)")
