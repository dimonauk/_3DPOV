"""
Reuleaux Tetrahedron — Four-Sphere Intersection, Spherical-Cap Barycentric
Parametrisation, Meissner Constant-Width Conjecture & Poi Head for WebXR
Blender 5.1 · Holoflow Studio · CC0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background
──────────
The Reuleaux TRIANGLE (2-D) is the intersection of three discs, each centred at
a vertex of an equilateral triangle with radius equal to the edge length.  It is
the simplest non-circular curve of constant width: every pair of parallel
supporting lines is separated by the same distance, the edge length a.

The Reuleaux TETRAHEDRON (3-D) is the analogous intersection of FOUR SPHERES,
each of radius a centred at a vertex of a regular tetrahedron with edge length a.
Counter-intuitively, it is NOT a body of constant width in ℝ³: it is wider in
the vertex-to-vertex directions than across the edge-arc directions.

The MEISSNER BODIES (Meissner 1912) correct this: they are obtained by replacing
three of the six curved edge-arcs of the Reuleaux tetrahedron with smooth round
arcs.  Meissner's conjecture—that these are the minimum-volume bodies of
constant width in ℝ³—remains open.

Parametrisation
───────────────
A regular tetrahedron with edge length a and vertices at:
  v₁=(1,1,1), v₂=(1,−1,−1), v₃=(−1,1,−1), v₄=(−1,−1,1)
has a = 2√2.  Each spherical cap (centred at vₖ, radius r) is a spherical
TRIANGLE with the other three vertices as its corners.

For cap centred at v₄ with corner-direction unit vectors
  n₁=(v₁−v₄)/a,  n₂=(v₂−v₄)/a,  n₃=(v₃−v₄)/a
a point at barycentric weights (u,v,w=1−u−v) maps via:

  p(u,v) = v₄ + r · normalise( u·n₁ + v·n₂ + w·n₃ )

This is the slerp through the spherical triangle—equivalent to central projection
of a flat triangular grid onto a sphere.

Three shape keys:
  Basis  r = a         exact Reuleaux tetrahedron, corners at vₖ
  Puffed r = 1.4·a     larger spheres, rounder profile, deeper grooves
  Sphere vertices projected onto circumscribed sphere (uniform K)
"""

import bpy, bmesh, mathutils
import numpy as np
from pathlib import Path

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
OBJ_NAME   = "hf_reuleaux_tet_poi"
MESH_NAME  = "HF_ReuleauxTet"
GLB_PATH   = str(Path(__file__).parent / "hf_reuleaux_tet_poi.glb")
BLEND_PATH = str(Path(__file__).parent / "hf_reuleaux_tet_poi.blend")

# Grid resolution per spherical triangle (N² triangles per cap)
N_GRID = 24          # 4 × 24² = 2304 triangles total — adequate density

# Radii for the three shape keys relative to edge length
R_EXACT  = 1.000    # exact Reuleaux tetrahedron
R_PUFFED = 1.400    # 40% larger spheres → rounder
# 'Sphere' shape key is computed as pure spherical projection

POI_DIAM = 0.10     # normalise basis to 100 mm poi head

# Tetrahedron vertex coordinates (edge length = 2√2 ≈ 2.83)
_VERTS_RAW = np.array([
    [ 1,  1,  1],
    [ 1, -1, -1],
    [-1,  1, -1],
    [-1, -1,  1],
], dtype=float)
EDGE_LEN = np.linalg.norm(_VERTS_RAW[0] - _VERTS_RAW[1])   # 2√2

# Cap-corner colour (RGBA, linear) — one warm hue per tetrahedron vertex
CAP_COLS = np.array([
    [1.0, 0.4, 0.2, 1.0],   # v₁ — flame orange
    [0.2, 0.8, 1.0, 1.0],   # v₂ — sky blue
    [0.5, 1.0, 0.3, 1.0],   # v₃ — jade green
    [0.9, 0.3, 0.9, 1.0],   # v₄ — violet pink (cap centre vertex, not used as corner)
], dtype=float)


# ── GEOMETRY ───────────────────────────────────────────────────────────────────
def _normalise(v):
    """Return unit vector; clamp magnitude to avoid zero-division."""
    mag = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(mag, 1e-12)


def build_cap(cap_idx: int, r_frac: float) -> tuple:
    """
    Build one spherical-triangle cap.

    Parameters
    ----------
    cap_idx : 0..3, index of the CENTRE vertex (v_cap = _VERTS_RAW[cap_idx]).
    r_frac  : sphere radius as a multiple of EDGE_LEN.

    Returns
    -------
    verts   : (M, 3) float32 vertex coordinates
    faces   : (F, 3) int32 face indices (triangles)
    uvweights : (M, 3) barycentric weights of each vertex → used for colour
    """
    r = r_frac * EDGE_LEN
    v_cap = _VERTS_RAW[cap_idx]
    # Other vertices (corners of this cap's spherical triangle)
    corners = np.array([_VERTS_RAW[i] for i in range(4) if i != cap_idx])  # (3,3)
    # Unit vectors from cap centre toward each corner
    n_dirs = _normalise(corners - v_cap)   # (3, 3)

    # Sample barycentric grid: u+v ≤ 1, both ≥ 0
    # Steps: N_GRID + 1 divisions; (N_GRID+1)*(N_GRID+2)/2 vertices
    us, vs, ws = [], [], []
    for i in range(N_GRID + 1):
        for j in range(N_GRID + 1 - i):
            k = N_GRID - i - j
            us.append(i); vs.append(j); ws.append(k)
    uvw = np.array([us, vs, ws], dtype=float).T / N_GRID   # (M, 3) normalised
    M = len(uvw)

    # 3-D point via central-projection slerp
    dirs = uvw @ n_dirs          # (M, 3) weighted sum of direction vectors
    dirs = _normalise(dirs)
    verts = v_cap + r * dirs     # (M, 3)

    # Triangulate the grid
    # Map (i,j) → vertex index
    idx_map = {}
    for k, (i, j, _) in enumerate(zip(us, vs, ws)):
        idx_map[(i, j)] = k

    faces = []
    for i in range(N_GRID):
        for j in range(N_GRID - i):
            a = idx_map[(i, j)]
            b = idx_map[(i+1, j)]
            c = idx_map[(i, j+1)]
            faces.append((a, b, c))
            if i + j + 1 < N_GRID:
                d = idx_map[(i+1, j+1)]
                faces.append((b, d, c))

    return verts.astype(np.float32), np.array(faces, dtype=np.int32), uvw.astype(np.float32)


def assemble_mesh(r_frac: float):
    """Concatenate all 4 caps into a single soup of vertices+faces."""
    all_verts, all_faces, all_uvw, all_cap_idx = [], [], [], []
    offset = 0
    for cap_idx in range(4):
        verts, faces, uvw = build_cap(cap_idx, r_frac)
        all_verts.append(verts)
        all_faces.append(faces + offset)
        all_uvw.append(uvw)
        all_cap_idx.extend([cap_idx] * len(verts))
        offset += len(verts)
    return (np.concatenate(all_verts),
            np.concatenate(all_faces),
            np.concatenate(all_uvw),
            np.array(all_cap_idx, dtype=np.int32))


# ── BLENDER SCENE BUILD ────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for data in (bpy.data.meshes, bpy.data.materials, bpy.data.objects):
        for item in list(data):
            data.remove(item, do_unlink=True)


def build():
    clear_scene()

    # ── Build basis mesh ────────────────────────────────────────────────────
    verts_b, faces_b, uvw_b, cap_idx_b = assemble_mesh(R_EXACT)

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts_b.tolist(), [], faces_b.tolist())
    me.update()

    bm = bmesh.new()
    bm.from_mesh(me)
    # Weld shared boundary vertices (corners are duplicated across caps)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    # ── Normalise scale ─────────────────────────────────────────────────────
    # Max extent of basis Reuleaux tet ≈ 2×√3 (corner to corner)
    max_ext = max(abs(v) for vert in verts_b for v in vert) * 2
    scale = POI_DIAM / max_ext
    ob.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(scale=True)

    # ── Vertex colour (FLOAT_COLOR on corner layer) ─────────────────────────
    # After weld, vertex positions differ from pre-weld so rebuild cap colours
    # via nearest-vertex to cap centres
    cap_centres = _VERTS_RAW * scale   # scaled cap centres
    vc_layer = me.color_attributes.new("CapColor", 'FLOAT_COLOR', 'POINT')
    for vi, vert in enumerate(me.vertices):
        co = np.array(vert.co)
        # Find closest cap centre
        dists = [np.linalg.norm(co - cap_centres[c]) for c in range(4)]
        ci = int(np.argmin(dists))
        # Distance from this cap's centroid direction → blend with white at centre
        cap_dir = _normalise(co - cap_centres[ci])
        apex_dir = _normalise(-cap_centres[ci])
        blend = float(np.clip(np.dot(cap_dir, apex_dir), 0, 1))
        col = CAP_COLS[ci] * (1 - 0.5*blend) + np.array([1,1,1,1]) * 0.5*blend
        vc_layer.data[vi].color = col.tolist()

    # ── Shape keys ─────────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)
    bpy.context.view_layer.update()

    # Puffed: r = R_PUFFED * EDGE_LEN spheres, then rescale to same POI_DIAM
    verts_p, _, _, _ = assemble_mesh(R_PUFFED)
    verts_p_scaled = verts_p * scale   # same spatial scale as basis

    # We need to map puffed verts back after weld — use nearest-neighbour
    me_tmp = bpy.data.meshes.new("_tmp_puffed")
    me_tmp.from_pydata(verts_p.tolist(), [], [])
    me_tmp.update()
    bm_tmp = bmesh.new(); bm_tmp.from_mesh(me_tmp)
    kd = mathutils.kdtree.KDTree(len(bm_tmp.verts))
    for i, v in enumerate(bm_tmp.verts):
        kd.insert(v.co * scale, i)
    kd.balance(); bm_tmp.free(); bpy.data.meshes.remove(me_tmp)

    sk_puffed = ob.shape_key_add(name="Puffed", from_mix=False)
    for vi, vert in enumerate(me.vertices):
        _, puff_idx, _ = kd.find(vert.co)
        sk_puffed.data[vi].co = mathutils.Vector(verts_p_scaled[puff_idx])

    # Sphere: project each basis vertex onto sphere of radius = max basis dist
    sk_sphere = ob.shape_key_add(name="Sphere", from_mix=False)
    r_sphere = max(np.linalg.norm(v.co) for v in me.vertices)
    for vi, vert in enumerate(me.vertices):
        co = np.array(vert.co)
        mag = np.linalg.norm(co)
        if mag > 1e-9:
            sk_sphere.data[vi].co = mathutils.Vector((co / mag) * r_sphere)

    # ── Emission material ───────────────────────────────────────────────────
    mat = bpy.data.materials.new("HF_ReuleauxTet_Emit")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "CapColor"
    emit  = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 3.0
    out   = nodes.new("ShaderNodeOutputMaterial")
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)

    # ── Smooth shading ──────────────────────────────────────────────────────
    for face in me.polygons:
        face.use_smooth = True

    # ── GLB export ──────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_morph=True,
        export_apply=True,
    )

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[Holoflow] Reuleaux tetrahedron poi exported → {GLB_PATH}")


build()
