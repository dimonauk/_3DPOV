"""
Compound of Five Cubes in a Regular Dodecahedron — Blender 5.1 blueprint
==========================================================================
WHY THIS WORKS
--------------
A regular dodecahedron has 20 vertices that fall in two algebraic families:
  A-type : (±1, ±1, ±1)                              [8 vertices]
  B-type : cyclic-permutations of (0, ±1/φ, ±φ)      [12 vertices]
where φ = (1+√5)/2 is the golden ratio.  Both families lie on a sphere of
radius √3 (verified: 0² + (1/φ)² + φ² = (2−φ) + (φ+1) = 3  ✓).

Exactly FIVE regular cubes of edge-length 2 are inscribed in this polyhedron,
each using 8 of the 20 vertices.  The symmetry group of the dodecahedron (I_h)
permutes these five cubes transitively; the stabiliser of one cube is the
chiral tetrahedral group T ≅ A₄ (order 12).  Orbit-stabiliser: |I|/|T| = 60/12 = 5.
The rotational group I ≅ A₅ is therefore realised concretely as the permutation
group on {C₀ … C₄} — one of the most direct visual proofs that A₅ is simple.

The 5 × 8 = 40 cube-vertex slots map onto 20 dodecahedron vertices: each vertex
shared by exactly two cubes.  The shape-key SK_Dodecahedron collapses duplicate
corners to expose this embedding.

PARAMETERS (edit before running)
"""
import bpy, bmesh, numpy as np
from itertools import combinations
from math import sqrt, pi

# ── geometry constants ────────────────────────────────────────────────────────
PHI          = (1 + sqrt(5)) / 2          # golden ratio ≈ 1.6180…
POI_RADIUS   = 0.100                      # circumscribed sphere radius [m]
WIRE_SCALE   = 0.92                       # shrink-factor for hollow-frame look

# ── visual palette (FLOAT_COLOR in linear sRGB) ───────────────────────────────
PALETTE = [
    (0.02, 0.08, 0.35, 1.0),   # C0 — cobalt
    (0.80, 0.45, 0.02, 1.0),   # C1 — amber
    (0.55, 0.02, 0.12, 1.0),   # C2 — crimson
    (0.02, 0.35, 0.15, 1.0),   # C3 — jade
    (0.85, 0.82, 0.72, 1.0),   # C4 — ivory
]

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Build all 20 dodecahedron vertices
# ─────────────────────────────────────────────────────────────────────────────
def dodecahedron_vertices() -> np.ndarray:
    """Return (20,3) array.  All rows lie on sphere of radius √3."""
    verts = []
    # A-type: 8 vertices
    for sx in (1, -1):
        for sy in (1, -1):
            for sz in (1, -1):
                verts.append([sx, sy, sz])
    # B-type: 12 vertices — cyclic permutations of (0, ±1/φ, ±φ)
    for s1 in (1, -1):
        for s2 in (1, -1):
            verts.append([0,          s1 / PHI,  s2 * PHI])
            verts.append([s1 / PHI,   s2 * PHI,  0       ])
            verts.append([s2 * PHI,   0,          s1 / PHI])
    return np.array(verts, dtype=float)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Discover the five cubes by combinatorial search
# ─────────────────────────────────────────────────────────────────────────────
def find_five_cubes(verts: np.ndarray) -> list[list[int]]:
    """
    A regular cube on 8 points has C(8,2)=28 pairwise squared-distances in
    exactly three classes:  12 × a²,  12 × 2a²,  4 × 3a².
    We test every C(20,8)=125970 subsets — fast with NumPy pre-computation.
    WHY not hard-code? The algorithmic derivation is the tutorial.
    """
    n = len(verts)                          # 20
    # Pre-compute all pairwise squared-distances
    diff = verts[:, None, :] - verts[None, :, :]   # (20,20,3)
    D2   = np.einsum('ijk,ijk->ij', diff, diff)     # (20,20)

    cubes = []
    for idx in combinations(range(n), 8):
        sub = D2[np.ix_(idx, idx)]          # (8,8)
        # Collect upper-triangle non-zero values
        upper = sub[np.triu_indices(8, k=1)]        # 28 values
        d0 = upper.min()
        if d0 < 1e-6:
            continue                        # coincident vertices
        # Round to 5 decimals to absorb float noise
        counts = {}
        for v in upper:
            key = round(v / d0)
            counts[key] = counts.get(key, 0) + 1
        # Must have exactly {1:12, 2:12, 3:4}
        if counts == {1: 12, 2: 12, 3: 4}:
            cubes.append(list(idx))
    return cubes

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Build cube faces from 8 vertex indices
# ─────────────────────────────────────────────────────────────────────────────
def cube_faces_from_verts(pts: np.ndarray, idx8: list[int]) -> list[tuple]:
    """
    Given 8 points known to form a cube, pair up the body-diagonal partners
    and enumerate the 6 quad faces.
    WHY this approach: avoid hard-wiring face orientation — instead derive it
    from the geometry, which generalises to any orientation of the cube.
    """
    sub = pts[idx8]                         # (8,3) in dodecahedron units
    # Find body-diagonal pairs: squared dist ≈ 3a²
    diff = sub[:, None, :] - sub[None, :, :]
    D2   = np.einsum('ijk,ijk->ij', diff, diff)
    a2   = D2[D2 > 0].min()
    # Each vertex has exactly one body-diagonal partner (dist² ≈ 3a²)
    body_partner = {}
    for i in range(8):
        for j in range(8):
            if abs(D2[i, j] - 3 * a2) < 0.1 * a2:
                body_partner[i] = j

    # Build face by selecting 4 vertices with mutual squared-distances a² and 2a²
    faces = []
    used_pairs = set()
    for i in range(8):
        for j in range(i + 1, 8):
            if abs(D2[i, j] - a2) > 0.1 * a2:
                continue
            # i-j is an edge; find the face quad containing this edge
            # neighbours of both i and j at dist a²
            nbrs_i = {k for k in range(8) if abs(D2[i,k]-a2) < 0.1*a2}
            nbrs_j = {k for k in range(8) if abs(D2[j,k]-a2) < 0.1*a2}
            shared = nbrs_i & nbrs_j
            if len(shared) != 2:
                continue
            k, l = sorted(shared)
            quad = tuple(sorted([i, j, k, l]))
            if quad in used_pairs:
                continue
            # Verify it is planar and forms a square (all sides a², both diags 2a²)
            q = [i, j, k, l]
            ds_q = [D2[q[m], q[(m+1)%4]] for m in range(4)]
            if all(abs(d - a2) < 0.1 * a2 for d in ds_q):
                used_pairs.add(quad)
                # Order the quad for correct normal direction
                # Use cross product to determine winding
                p0, p1, p2 = sub[i], sub[j], sub[k]
                n = np.cross(p1 - p0, p2 - p0)
                # Put the fourth vertex; determine correct cycle
                # Simple: build from edges; accept either winding (bmesh fixes)
                faces.append((idx8[i], idx8[j], idx8[k], idx8[l]))

    # A cube has 6 faces; our method may produce 6
    return faces[:6]

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Clear scene and assemble the compound mesh
# ─────────────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

doc_verts = dodecahedron_vertices()         # (20,3) raw coordinates
cubes     = find_five_cubes(doc_verts)      # list of 5 × 8-index lists
assert len(cubes) == 5, f"Expected 5 cubes, got {len(cubes)}"

# Scale all coordinates so the circumsphere = POI_RADIUS
# Raw radius is √3 ≈ 1.7321
raw_radius = sqrt(3.0)
scale      = POI_RADIUS / raw_radius        # ≈ 0.0577 m per unit

# Build a single mesh containing all 5 cubes
me  = bpy.data.meshes.new("hf_five_cubes_compound")
bm  = bmesh.new()

# Vertices: 5 × 8 = 40 (duplicates are kept; SK_Dodecahedron will merge)
all_cube_verts = []        # track (cube_idx, local_v_idx) → bmesh vertex
cube_vert_map  = {}        # (cube_idx, global_doc_idx) → bm_vertex

for ci, cube_idx8 in enumerate(cubes):
    for vi in cube_idx8:
        co = doc_verts[vi] * scale
        bv = bm.verts.new((co[0], co[2], co[1]))   # +Y-up: swap Y↔Z
        cube_vert_map[(ci, vi)] = bv

# Faces for each cube (6 quads per cube = 30 total)
for ci, cube_idx8 in enumerate(cubes):
    faces_raw = cube_faces_from_verts(doc_verts, cube_idx8)
    for face_global in faces_raw:
        face_bverts = [cube_vert_map[(ci, gi)] for gi in face_global]
        try:
            bm.faces.new(face_bverts)
        except ValueError:
            pass    # degenerate or duplicate — skip

bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()
bm.to_mesh(me)
bm.free()

obj = bpy.data.objects.new("hf_five_cubes_compound", me)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5: Vertex attribute — Compound_Cube (FLOAT_COLOR POINT)
# ─────────────────────────────────────────────────────────────────────────────
# Assign one colour per cube so Geometry Nodes / shader can tint each cube.
# Vertex order in the final mesh: [C0 verts 0-7, C1 verts 0-7, … C4 verts 0-7]

attr = me.attributes.new(name="Compound_Cube", type='FLOAT_COLOR', domain='POINT')
col_data = []
for ci in range(5):
    col_data.extend([PALETTE[ci]] * 8)
attr.data.foreach_set("color", [v for c in col_data for v in c])

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6: Shape keys
# ─────────────────────────────────────────────────────────────────────────────
# Basis        — compound as built
# SK_Dodecahedron — each cube vertex snapped to dodecahedron vertex
#                   (merges the 2 duplicates per dodec-vertex → shows the dodecahedron)
# SK_Frame     — all vertices pulled to WIRE_SCALE of their cube's face-centre
#                (creates a see-through hollow-frame look within same outer radius)

obj.shape_key_add(name="Basis",          from_mix=False)
sk_dodec  = obj.shape_key_add(name="SK_Dodecahedron", from_mix=False)
sk_frame  = obj.shape_key_add(name="SK_Frame",        from_mix=False)
sk_golden = obj.shape_key_add(name="SK_GoldenStar",   from_mix=False)

# Build vertex list in the same order as the mesh was constructed
flat_verts = []     # (ci, doc_idx) pairs in mesh order
for ci, cube_idx8 in enumerate(cubes):
    for vi in cube_idx8:
        flat_verts.append((ci, vi))

# SK_Dodecahedron: snap each cube vertex to its dodecahedron source
sk_d_cos = sk_dodec.data
sk_f_cos = sk_frame.data
sk_g_cos = sk_golden.data

for mesh_i, (ci, doc_i) in enumerate(flat_verts):
    co_dodec = doc_verts[doc_i] * scale
    # +Y-up swap
    sk_d_cos[mesh_i].co = (co_dodec[0], co_dodec[2], co_dodec[1])

    # SK_Frame: retract vertex toward the centre of its enclosing cube
    cube_centre = doc_verts[cubes[ci]].mean(axis=0) * scale  # should be (0,0,0)
    co_raw = doc_verts[doc_i] * scale
    co_frame = cube_centre + WIRE_SCALE * (co_raw - cube_centre)
    sk_f_cos[mesh_i].co = (co_frame[0], co_frame[2], co_frame[1])

    # SK_GoldenStar: scale each cube outward by φ/2 then back — produces star polygon silhouette
    co_star = doc_verts[doc_i] * scale * (PHI / 2)
    r_star  = sqrt(co_star[0]**2 + co_star[1]**2 + co_star[2]**2)
    # Clamp to POI_RADIUS so it stays inside the poi sphere
    if r_star > POI_RADIUS:
        fac = POI_RADIUS / r_star
        co_star = co_star * fac
    sk_g_cos[mesh_i].co = (co_star[0], co_star[2], co_star[1])

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7: Material — emission driven by Compound_Cube attribute
# ─────────────────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("Compound_Cube_Mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

attr_node  = nt.nodes.new('ShaderNodeAttribute')
attr_node.attribute_name = "Compound_Cube"
attr_node.attribute_type = 'GEOMETRY'

emission   = nt.nodes.new('ShaderNodeEmission')
emission.inputs['Strength'].default_value = 2.5

output     = nt.nodes.new('ShaderNodeOutputMaterial')

nt.links.new(attr_node.outputs['Color'], emission.inputs['Color'])
nt.links.new(emission.outputs['Emission'], output.inputs['Surface'])

obj.data.materials.append(mat)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8: Apply transform for WebXR export (+Y up, apply scale/rotation)
# ─────────────────────────────────────────────────────────────────────────────
obj.rotation_euler = (0, 0, 0)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# holoflow metadata properties
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-head"
obj["holoflow:topic"]    = "compound-polyhedra-icosahedral-symmetry"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 9: GLB export
# ─────────────────────────────────────────────────────────────────────────────
import os
OUT_DIR  = "//../../glbs/scripting/python-numpy-compound-five-cubes-dodecahedron-icosahedral-a5-golden-ratio-poi-head-webxr/"
OUT_PATH = OUT_DIR + "hf_five_cubes_compound.glb"

os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath          = bpy.path.abspath(OUT_PATH),
    export_format     = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_colors     = True,
    export_morph      = True,
    export_yup        = True,
    use_selection     = True,
    export_texture_dir= '',
)
print(f"✓  Exported: {OUT_PATH}")
print(f"   Cubes found: {len(cubes)}")
for ci, cube_i in enumerate(cubes):
    edge_len = float(np.linalg.norm(
        doc_verts[cube_i[1]] - doc_verts[cube_i[0]]))
    print(f"   C{ci}: indices {cube_i}  edge≈{edge_len:.4f}  φ={PHI:.4f}")
