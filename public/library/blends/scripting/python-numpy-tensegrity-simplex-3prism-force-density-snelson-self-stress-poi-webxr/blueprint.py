"""
Tensegrity Simplex T3 — Snelson/Fuller Self-Stress
Force-Density Eigenspectrum · Cables vs Bars · WebXR Poi Head

Blender 5.1 · bpy + numpy · CC0

A tensegrity is a structure in which a network of continuous cables (tension
only) prestresses a set of disconnected struts (compression only). Kenneth
Snelson built the first working model in 1948; Buckminster Fuller coined
"tensegrity" in 1962. The minimal 3-D example — three struts, nine cables,
six nodes — is the T3 simplex (also called the "needle tower cell").

Force-density method (Schek 1974):
  D = Cᵀ diag(q) C          (j×j force-density matrix, j = node count)
  D x = 0, D y = 0, D z = 0  (nodal force equilibrium per axis)
  C ∈ ℝ^{e×j}: signed incidence matrix (+1 / -1 per directed edge)
  q ∈ ℝ^e:    force-density per element (+ = tension, − = compression)

Self-stress condition: nullity(D) = 4
  For j = 6: rank(D) = 2, nullity = 4.
  The four independent null vectors are the x, y, z node-coordinate arrays
  and the uniform translation (all-ones) vector — proof that the structure
  carries no infinitesimal mechanism and has exactly one self-stress mode.

Analytic force-density ratios for the 30°-twist simplex (any height H):
  q_strut = −1   q_saddle = +1   q_triangle = 1/√3
  (verified below via eigvalsh: σ₄ ≈ 0 ↔ nullity ≥ 4)

Geometry: twist angle Δθ = 30° between top and bottom triangles.
  Elements:
    3 struts  (longer diagonals T_i–B_{i+1 mod 3}, compression)
    3 saddle cables (shorter adjacents T_i–B_i, tension)
    3 top-triangle cables (T_i–T_j, tension)
    3 bottom-triangle cables (B_i–B_j, tension)

Mesh: combined joined mesh from oriented cylinders (no bpy.ops primitives).
  Bars   → COBALT 8-sided cylinders
  Cables → AMBER  6-sided cylinders
  FLOAT_COLOR POINT attribute encodes type; holoflow:facet = True.

Shape keys (3):
  SK_Extended   H = 0.28 m, twist +30° (nominal)
  SK_Compressed H = 0.07 m, twist +30° (near-flat)
  SK_Inverted   H = 0.28 m, twist −30° (mirror chirality)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
R_CIRCUM    = 0.110          # circumradius of top/bottom triangles [m]
H_EXT       = 0.280          # extended height [m]
H_CMP       = 0.070          # compressed height [m]
TWIST_DEG   = 30.0           # twist angle top→bottom [degrees]
BAR_RADIUS  = 0.006          # strut tube radius [m]
CAB_RADIUS  = 0.0025         # cable tube radius [m]
N_BAR       = 8              # polygon sides for strut cylinders
N_CAB       = 6              # polygon sides for cable cylinders

COBALT = (0.02, 0.20, 0.72, 1.0)
AMBER  = (0.95, 0.52, 0.04, 1.0)

MESH_NAME = "hf_tensegrity_t3"
OBJ_NAME  = "hf_tensegrity_t3_poi"

# ── TOPOLOGY ──────────────────────────────────────────────────────────────────
# Node indices: 0,1,2 = top (T0,T1,T2)  |  3,4,5 = bottom (B0,B1,B2)
# Bottom is rotated by +TWIST_DEG relative to top.
#
# BARS (struts, longer diagonals, compression q < 0):
#   T0-B1, T1-B2, T2-B0  →  (0,4), (1,5), (2,3)
# SADDLE cables (shorter adjacents, tension):
#   T0-B0, T1-B1, T2-B2  →  (0,3), (1,4), (2,5)
# TOP-triangle cables:
#   T0-T1, T1-T2, T0-T2  →  (0,1), (1,2), (0,2)
# BOT-triangle cables:
#   B0-B1, B1-B2, B0-B2  →  (3,4), (4,5), (3,5)

ELEMENTS = [
    # (node_i, node_j, is_bar, n_sides, radius, color)
    (0, 4, True,  N_BAR, BAR_RADIUS, COBALT),  # struts
    (1, 5, True,  N_BAR, BAR_RADIUS, COBALT),
    (2, 3, True,  N_BAR, BAR_RADIUS, COBALT),
    (0, 3, False, N_CAB, CAB_RADIUS, AMBER),   # saddle cables
    (1, 4, False, N_CAB, CAB_RADIUS, AMBER),
    (2, 5, False, N_CAB, CAB_RADIUS, AMBER),
    (0, 1, False, N_CAB, CAB_RADIUS, AMBER),   # top triangle
    (1, 2, False, N_CAB, CAB_RADIUS, AMBER),
    (0, 2, False, N_CAB, CAB_RADIUS, AMBER),
    (3, 4, False, N_CAB, CAB_RADIUS, AMBER),   # bottom triangle
    (4, 5, False, N_CAB, CAB_RADIUS, AMBER),
    (3, 5, False, N_CAB, CAB_RADIUS, AMBER),
]

# ── MATHEMATICS ───────────────────────────────────────────────────────────────

def simplex_nodes(R, H, twist_deg):
    """6 node positions for the T3 simplex. Returns (6,3) float64 array."""
    tw = np.radians(twist_deg)
    top_a = np.radians([0.0, 120.0, 240.0])
    bot_a = top_a + tw
    top = np.column_stack([R * np.cos(top_a), R * np.sin(top_a),
                           np.full(3, H / 2)])
    bot = np.column_stack([R * np.cos(bot_a), R * np.sin(bot_a),
                           np.full(3, -H / 2)])
    return np.vstack([top, bot])


def force_density_matrix(nodes):
    """
    Build D = Cᵀ diag(q) C using the analytic force-density ratios.
    q_strut = −1, q_saddle = +1, q_triangle = 1/√3.
    Returns D (6×6), q_vector (12,), incidence C (12×6).
    """
    Q_STRUT = -1.0
    Q_SADDLE = 1.0
    Q_TRI = 1.0 / np.sqrt(3.0)

    q_map = {True: Q_STRUT, False: Q_SADDLE}  # initial: bars=strut, saddle
    edges = [(i, j, is_bar) for i, j, is_bar, *_ in ELEMENTS]

    q_vals = []
    for k, (i, j, is_bar) in enumerate(edges):
        if k < 3:                       # struts
            q_vals.append(Q_STRUT)
        elif k < 6:                     # saddle cables
            q_vals.append(Q_SADDLE)
        else:                           # top + bottom triangle cables
            q_vals.append(Q_TRI)
    q_vals = np.array(q_vals)

    j_count = 6
    e_count = len(edges)
    C = np.zeros((e_count, j_count))
    for k, (i, j, _) in enumerate(edges):
        C[k, i] = +1.0
        C[k, j] = -1.0

    D = C.T @ np.diag(q_vals) @ C
    return D, q_vals, C


def verify_equilibrium(nodes, D):
    """
    Check D @ node_coords ≈ 0 for each axis.
    Returns max absolute residual (should be < 1e-12 for exact coords).
    """
    residual = D @ nodes            # shape (6, 3)
    return np.max(np.abs(residual))


# ── MESH BUILDER ──────────────────────────────────────────────────────────────

def cylinder_verts_faces(p0, p1, radius, n):
    """
    Return (verts, faces) for an oriented n-sided cylinder from p0 to p1.
    Winding convention: outside faces normals point outward.
    2*n vertices, n*2+2 faces (n side quads + 2 caps).
    """
    axis = p1 - p0
    L = float(np.linalg.norm(axis))
    if L < 1e-9:
        return [], []
    z = axis / L
    ref = np.array([1.0, 0, 0]) if abs(z[0]) < 0.9 else np.array([0, 1.0, 0])
    x = np.cross(ref, z);  x /= np.linalg.norm(x)
    y = np.cross(z, x)

    th = np.linspace(0.0, 2 * np.pi, n, endpoint=False)
    ring0 = [tuple(p0 + radius * (np.cos(t) * x + np.sin(t) * y)) for t in th]
    ring1 = [tuple(p1 + radius * (np.cos(t) * x + np.sin(t) * y)) for t in th]

    verts = ring0 + ring1
    faces = []
    for k in range(n):
        k1 = (k + 1) % n
        faces.append((k, k1, n + k1, n + k))        # side quad
    faces.append(tuple(range(n - 1, -1, -1)))        # bottom cap (CCW)
    faces.append(tuple(range(n, 2 * n)))             # top cap (CCW)
    return verts, faces


def build_geometry(nodes):
    """
    Assemble all element cylinders. Returns (all_verts, all_faces, vert_colors).
    Vertex order is deterministic for consistent shape-key remapping.
    """
    all_verts, all_faces, all_colors = [], [], []

    for (i, j, is_bar, n, r, col) in ELEMENTS:
        voff = len(all_verts)
        vv, ff = cylinder_verts_faces(nodes[i], nodes[j], r, n)
        if not vv:
            continue
        all_verts.extend(vv)
        all_faces.extend([tuple(voff + fi for fi in f) for f in ff])
        all_colors.extend([col] * len(vv))   # per-vertex colour

    return all_verts, all_faces, all_colors


# ── BLENDER SCENE ─────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for item in list(blk):
            blk.remove(item)


def build_scene():
    clear_scene()

    # ── Force-density verification ──────────────────────────────────────────
    nodes_ext = simplex_nodes(R_CIRCUM, H_EXT, TWIST_DEG)
    D, q_vec, C = force_density_matrix(nodes_ext)
    resid = verify_equilibrium(nodes_ext, D)
    print(f"  Max equilibrium residual: {resid:.2e}  (target < 1e-12)")

    eigs = np.linalg.eigvalsh(D)
    print(f"  Eigenvalues (sorted): {eigs}")
    # Expect 4 near-zero eigenvalues (nullity = 4), 2 positive
    print(f"  Null eigenvalue count (|λ|<1e-9): "
          f"{np.sum(np.abs(eigs) < 1e-9)}")

    # ── Mesh construction ───────────────────────────────────────────────────
    verts_ext, faces, colors = build_geometry(nodes_ext)

    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata(verts_ext, [], faces)
    mesh.update()

    # Vertex colour attribute (FLOAT_COLOR, point domain)
    col_attr = mesh.color_attributes.new(
        name="Col", type="FLOAT_COLOR", domain="POINT"
    )
    for vi, c in enumerate(colors):
        col_attr.data[vi].color = c

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── Custom properties for HoloFlow exporter ─────────────────────────────
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:facet_smooth"] = False

    # ── Shape keys ──────────────────────────────────────────────────────────
    # SK_Extended = Basis (already in mesh data)
    sk_basis = obj.shape_key_add(name="SK_Extended", from_mix=False)
    mesh.shape_keys.use_relative = True

    # SK_Compressed — near-flat (H_CMP)
    sk_cmp = obj.shape_key_add(name="SK_Compressed", from_mix=False)
    nodes_cmp = simplex_nodes(R_CIRCUM, H_CMP, TWIST_DEG)
    verts_cmp, _, _ = build_geometry(nodes_cmp)
    for vi, pos in enumerate(verts_cmp):
        sk_cmp.data[vi].co = Vector(pos)

    # SK_Inverted — mirrored chirality (twist = −TWIST_DEG)
    sk_inv = obj.shape_key_add(name="SK_Inverted", from_mix=False)
    nodes_inv = simplex_nodes(R_CIRCUM, H_EXT, -TWIST_DEG)
    verts_inv, _, _ = build_geometry(nodes_inv)
    for vi, pos in enumerate(verts_inv):
        sk_inv.data[vi].co = Vector(pos)

    # ── Material (Principled BSDF — visual fallback, vertex colour active) ─
    mat = bpy.data.materials.new("hf_tensegrity_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Metallic"].default_value  = 0.85
        bsdf.inputs["Roughness"].default_value = 0.20
    obj.data.materials.append(mat)

    # ── Camera + World ───────────────────────────────────────────────────────
    bpy.ops.object.camera_add(location=(0.0, -0.60, 0.18))
    cam = bpy.context.active_object
    cam.rotation_euler = (np.radians(75), 0, 0)
    bpy.context.scene.camera = cam

    world = bpy.data.worlds.new("hf_world")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.02, 0.02, 0.04, 1.0)
        bg.inputs["Strength"].default_value = 1.0
    bpy.context.scene.world = world

    print(f"✓ Tensegrity T3 built: {len(verts_ext)} verts, "
          f"{len(faces)} faces, 3 shape keys.")
    print(f"  Force densities: q_strut={-1}, q_saddle={1}, "
          f"q_triangle={1/np.sqrt(3):.4f}")
    return obj


build_scene()
