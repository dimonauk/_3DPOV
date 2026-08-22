"""
blueprint.py — 600-Cell: Binary Icosahedral Group Stereographic Shadow
Blender 5.1 · Python 3.11 · CC0

The 600-cell is the 4D analogue of the icosahedron. Its 120 vertices
coincide with the elements of the binary icosahedral group 2I — the
120 unit quaternions that form the universal double cover of A₅ (the
icosahedral rotation group). Each vertex sits on S³ ⊂ ℝ⁴; edges connect
pairs at angular separation π/5 (chord length 1/φ, where φ=(1+√5)/2).

Stereographic projection from the north pole of S³ maps the 720 straight
4D edges to circular arcs in ℝ³. The result is a self-similar nested
structure: the innermost dodecahedron appears full-scale; successive shells
compress toward the horizon, echoing the Poincaré ball model of hyperbolic
space. This topology is no accident — S³ / 2I is the Poincaré homology
sphere, one of the first known counterexamples to the Poincaré conjecture.

Run inside Blender ≥ 5.1:
    blender --python blueprint.py
"""

import bpy
import numpy as np
from itertools import product, permutations

# ── tuneable constants ─────────────────────────────────────────────────────────
PHI           = (1 + np.sqrt(5)) / 2   # golden ratio φ ≈ 1.618
EDGE_LEN      = 1.0 / PHI              # 600-cell edge length for circumradius 1
EDGE_TOL      = 0.02                   # distance threshold tolerance
ARC_DIVISIONS = 8                      # slerp samples per edge (more → smoother arcs)
BEVEL_R       = 0.007                  # tube radius for each edge (metres)
POLE_OFFSET   = np.deg2rad(12)         # 4D rotation angle to keep pole clear
OBJECT_NAME   = "hf_600cell"
OUTPUT_GLB    = "//hf_600cell.glb"

# ── 1. Generate 120 vertices of the 600-cell on S³ ───────────────────────────
# Three families of unit quaternions (w, x, y, z), ‖v‖ = 1.
# These are exactly the 120 elements of the binary icosahedral group.

def _perm_sign(p):
    """Return +1 for even permutation, −1 for odd. O(n) via cycle counting."""
    visited = [False] * len(p)
    sign = 1
    for i in range(len(p)):
        if not visited[i]:
            j, cyc = i, 0
            while not visited[j]:
                visited[j] = True
                j = p[j]
                cyc += 1
            if cyc % 2 == 0:
                sign = -sign
    return sign


def gen_600cell():
    V = []

    # Family 1 — 8 vertices: ±e_k (axis-aligned unit vectors)
    for k in range(4):
        for s in (1, -1):
            v = np.zeros(4)
            v[k] = float(s)
            V.append(v)

    # Family 2 — 16 vertices: ½(±1, ±1, ±1, ±1), all 16 sign combos
    for signs in product((-1.0, 1.0), repeat=4):
        V.append(0.5 * np.array(signs))

    # Family 3 — 96 vertices: ½ × even permutations of (0, 1/φ, 1, φ)
    # Norm check: ½√(0 + 1/φ² + 1 + φ²) = ½√(1/φ²+1+φ²) = ½√4 = 1 ✓
    base = 0.5 * np.array([0.0, 1.0 / PHI, 1.0, PHI])
    seen: set = set()
    for p in permutations(range(4)):
        if _perm_sign(list(p)) == 1:          # even permutations only (12 of 24)
            pv = base[list(p)]
            for signs in product((-1.0, 1.0), repeat=3):
                v = pv.copy()
                j = 0
                for i in range(4):
                    if abs(v[i]) > 1e-9:      # apply sign to each non-zero element
                        v[i] *= signs[j]
                        j += 1
                key = tuple(np.round(v, 9))
                if key not in seen:
                    seen.add(key)
                    V.append(v)

    return np.array(V, dtype=np.float64)      # shape (120, 4)


# ── 2. Find the 720 edges via distance threshold ───────────────────────────────
def find_edges(V):
    """
    scipy.spatial.cKDTree: O(n log n) rather than O(n²).
    We query all pairs within EDGE_LEN + EDGE_TOL.
    """
    from scipy.spatial import cKDTree
    tree = cKDTree(V)
    threshold = EDGE_LEN + EDGE_TOL
    pairs = list(tree.query_pairs(threshold))
    return pairs                              # list of (i, j) tuples


# ── 3. 4D rotation to prevent a vertex landing on the projection pole ─────────
def rot4d_yw(V, angle):
    """
    Rotate in the (y, w) plane.  This nudges every vertex away from the
    north pole (0, 0, 0, 1), which would project to infinity.
    """
    c, s = np.cos(angle), np.sin(angle)
    R = np.eye(4)
    R[1, 1] = c;  R[1, 3] = -s
    R[3, 1] = s;  R[3, 3] =  c
    return (R @ V.T).T


# ── 4. Stereographic projection S³ → ℝ³ ────────────────────────────────────
def stereo3(v4):
    """
    Project from the north pole (0, 0, 0, 1) to the w = 0 hyperplane.
    Straight great-circle arcs on S³ become circular arcs in ℝ³ because
    stereographic projection is conformal (angle-preserving) but not
    geodesic-preserving.
    """
    x, y, z, w = v4
    s = 1.0 / (1.0 - w)
    return np.array([x * s, y * s, z * s], dtype=np.float64)


def slerp4(a, b, t):
    """Spherical linear interpolation between unit 4-vectors."""
    dot = float(np.clip(a @ b, -1.0, 1.0))
    omega = np.arccos(dot)
    if omega < 1e-8:
        return a.copy()
    so = np.sin(omega)
    return (np.sin((1 - t) * omega) * a + np.sin(t * omega) * b) / so


def edge_arc(v4a, v4b):
    """
    Sample ARC_DIVISIONS+1 slerp points, project each to ℝ³.
    Returns list of (x, y, z) arrays.
    """
    ts = np.linspace(0.0, 1.0, ARC_DIVISIONS + 1)
    return [stereo3(slerp4(v4a, v4b, t)) for t in ts]


# ── 5. Build Blender scene ─────────────────────────────────────────────────────
def build_scene(V4, edges):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # Curve object — one POLY spline per edge arc
    cu = bpy.data.curves.new(OBJECT_NAME, type="CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = BEVEL_R
    cu.bevel_resolution = 3
    cu.fill_mode = "FULL"
    cu.use_fill_caps = True

    for (i, j) in edges:
        pts = edge_arc(V4[i], V4[j])
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)       # .new() already creates 1 point
        for k, p in enumerate(pts):
            sp.points[k].co = (p[0], p[1], p[2], 1.0)

    ob = bpy.data.objects.new(OBJECT_NAME, cu)
    scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    # Emissive material — electric violet matching studio palette
    mat = bpy.data.materials.new(f"{OBJECT_NAME}_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = (0.62, 0.18, 1.0, 1.0)   # violet
    em.inputs["Strength"].default_value = 3.0
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)

    # Camera
    bpy.ops.object.camera_add(location=(0, -7.5, 2.5))
    cam = bpy.context.object
    cam.rotation_euler = (np.deg2rad(75), 0, 0)
    scene.camera = cam

    # HDRI-free dark world
    scene.world = bpy.data.worlds.new("world")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)

    # Convert curve → mesh (glTF exporter silently skips NURBS/POLY curves)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target="MESH")

    ob_mesh = bpy.context.object
    ob_mesh.name = ob_mesh.data.name = OBJECT_NAME

    # Studio convention: +Y up, apply transforms
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Custom property for WebXR facet hint
    ob_mesh["holoflow:facet"] = False

    # Export GLB
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        use_selection=False,
    )
    print(f"[blueprint] 600-cell exported → {OUTPUT_GLB}")


# ── main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    V4    = gen_600cell()
    print(f"[blueprint] vertices: {len(V4)}")          # expect 120
    edges = find_edges(V4)
    print(f"[blueprint] edges: {len(edges)}")           # expect 720
    V4r   = rot4d_yw(V4, POLE_OFFSET)
    build_scene(V4r, edges)
