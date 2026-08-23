"""
Viviani's Curve — Sphere × Cylinder Intersection
=================================================
Vincenzo Viviani c. 1692 (published 1674, "Quinto libro degli Elementi di Euclide").

The Viviani curve is the intersection of:
  Sphere   x² + y² + z² = (2A)²   (radius 2A)
  Cylinder (x − A)² + y² = A²     (radius A, through sphere centre)

WHY this cylinder? It is the unique cylinder of radius A centred on the
equatorial plane and passing through the sphere centre — Viviani's "window"
problem asks for the maximum area cut from a sphere by a cylindrical window.

Parametrisation (t ∈ [0, 4π) for the COMPLETE figure-8):
  x(t) = A(1 + cos t)
  y(t) = A sin t
  z(t) = 2A sin(t/2)

z(t/2) has period 4π while x, y have period 2π. The curve therefore traces
the generator circle TWICE — once for z > 0 (upper hemisphere, t ∈ [0, 2π))
and once for z < 0 (lower hemisphere, t ∈ [2π, 4π)). The self-intersection
at (2A, 0, 0) when t = 0 ≡ 2π is the "attachment point" of the poi head.

Projections:
  xz-plane  →  z² = 2A(2A − x)     (parabola; both branches → figure-8)
  xy-plane  →  (x − A)² + y² = A²  (the generator cylinder circle itself)

This blueprint builds a Bishop parallel-transport tube around the complete
figure-8, applies a holonomy-closing twist, bakes three shape keys (scale +
tube-width variants), maps a Cobalt/Amber FLOAT_COLOR POINT z-height gradient,
and exports a Draco-6 WebP GLB for WebXR.

Expert notes
============
• Bishop frame (Rodrigues transport) avoids the Frenet singularity that would
  appear at the self-intersection point where curvature momentarily passes
  through zero.
• Holonomy correction: after one full 4π traversal the Bishop frame rotates by
  a non-zero angle γ relative to the seed orientation. We distribute γ linearly
  over all N_LONG segments before building the tube so the end-cap quads align.
• Vertex count: N_LONG × N_CIRC = 240 × 14 = 3 360 vertices, 3 360 quads —
  compact enough for Draco to reach sub-20 KB after WebP texture folding.
• foreach_set bulk writes: faster than per-element assignment for large arrays.
"""

import bpy, bmesh, math
import numpy as np
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
A      = 0.50   # half-parameter: sphere radius = 2A = 1.0 m
N_LONG = 240    # curve samples, t ∈ [0, 4π)
N_CIRC = 14     # tube cross-section polygon sides (even = symmetric normals)
TUBE_R = 0.072  # tube radius in metres

OBJ_NAME  = "viviani_poi"
MESH_NAME = "Viviani_Tube"
GLB_PATH  = "//hf_viviani_poi.glb"

# Cobalt, Amber, White in linear FLOAT_COLOR
COL_COBALT = (0.055, 0.408, 0.918, 1.0)
COL_AMBER  = (0.918, 0.510, 0.055, 1.0)
COL_WHITE  = (0.900, 0.900, 0.870, 1.0)


# ─── Helpers ─────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.cameras, bpy.data.lights):
        for item in list(col):
            col.remove(item)


def viviani(a, n):
    """(n, 3) Viviani figure-8, t ∈ [0, 4π)."""
    t = np.linspace(0.0, 4.0 * math.pi, n, endpoint=False)
    return np.stack([
        a * (1.0 + np.cos(t)),
        a * np.sin(t),
        2.0 * a * np.sin(t * 0.5),
    ], axis=1)


def bishop_frames(pts):
    """
    Compute Bishop (parallel-transport) frames for a closed curve.

    Returns T (tangent), N (normal), B (binormal) arrays, each (n, 3).
    Holonomy γ is measured at the closure and distributed linearly around
    the loop so the tube seam closes without twist artefacts.
    """
    n = len(pts)
    # ---- Centred finite-difference tangents (periodic) -------------------
    T = pts[np.arange(1, n + 1) % n] - pts[np.arange(-1, n - 1) % n]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(norms < 1e-14, 1.0, norms)

    # ---- Seed N₀ perpendicular to T₀ ------------------------------------
    up = np.array([0.0, 0.0, 1.0])
    if abs(float(T[0] @ up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    N = np.empty_like(T)
    N[0] = np.cross(T[0], up)
    N[0] /= np.linalg.norm(N[0])

    # ---- Rodrigues transport ---------------------------------------------
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        ax_n = np.linalg.norm(axis)
        if ax_n < 1e-14:
            N[i] = N[i - 1]
            continue
        axis /= ax_n
        c = float(np.clip(T[i - 1] @ T[i], -1.0, 1.0))
        s = math.sqrt(max(0.0, 1.0 - c * c))
        # Rodrigues: N_new = c·N + s·(axis×N) + (1-c)(axis·N)·axis
        N[i] = (c * N[i - 1]
                + s * np.cross(axis, N[i - 1])
                + (1.0 - c) * float(axis @ N[i - 1]) * axis)
        n_mag = np.linalg.norm(N[i])
        if n_mag > 1e-14:
            N[i] /= n_mag

    # ---- Holonomy correction ---------------------------------------------
    # Project transported N[-1] onto the T[0]-perpendicular plane
    Nf = N[-1] - float(N[-1] @ T[0]) * T[0]
    nf_mag = np.linalg.norm(Nf)
    if nf_mag > 1e-14:
        Nf /= nf_mag
    cos_h = float(np.clip(Nf @ N[0], -1.0, 1.0))
    B0 = np.cross(T[0], N[0])
    sin_h = float(Nf @ B0)  # signed via binormal dot
    holonomy = math.atan2(sin_h, cos_h)

    # Distribute holonomy linearly: adds twist_i = holonomy × i/n
    for i in range(n):
        theta = holonomy * i / n
        c, s_t = math.cos(theta), math.sin(theta)
        Bi = np.cross(T[i], N[i])
        N[i] = c * N[i] + s_t * Bi
        nm = np.linalg.norm(N[i])
        if nm > 1e-14:
            N[i] /= nm

    B = np.cross(T, N)
    return T, N, B


def tube_verts_faces(pts, N, B, r, nc):
    """
    Return (verts np.ndarray (nl×nc, 3), faces list of 4-tuples).
    The tube is toroidal: both longitudinal and circumferential directions wrap.
    """
    nl = len(pts)
    ang = np.linspace(0.0, 2.0 * math.pi, nc, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)          # (nc,)

    # verts[i*nc + j] = pts[i] + r*(ca[j]*N[i] + sa[j]*B[i])
    verts = (pts[:, np.newaxis, :]             # (nl, 1, 3)
             + r * (ca[np.newaxis, :, np.newaxis] * N[:, np.newaxis, :]
                    + sa[np.newaxis, :, np.newaxis] * B[:, np.newaxis, :]))
    verts = verts.reshape(-1, 3)               # (nl*nc, 3)

    faces = []
    for i in range(nl):
        i1 = (i + 1) % nl
        for j in range(nc):
            j1 = (j + 1) % nc
            a = i  * nc + j
            b = i1 * nc + j
            c = i1 * nc + j1
            d = i  * nc + j1
            faces.append((a, b, c, d))
    return verts, faces


def z_gradient_colours(pts, nc, a_param):
    """
    FLOAT_COLOR POINT: Cobalt (z = +2A) → White (z ≈ 0) → Amber (z = −2A).
    Each point repeated nc times (one per circumference vertex).
    """
    z_max = 2.0 * a_param
    flat = []
    for pt in pts:
        t_raw = float(pt[2]) / z_max          # ∈ [−1, 1]
        t_pos = max(0.0, t_raw)
        t_neg = max(0.0, -t_raw)
        t_wh  = 1.0 - t_pos - t_neg
        col = tuple(
            t_pos * COL_COBALT[k]
            + t_neg * COL_AMBER[k]
            + t_wh  * COL_WHITE[k]
            for k in range(4)
        )
        for _ in range(nc):
            flat.extend(col)
    return flat


def emissive_material(attr_name):
    mat = bpy.data.materials.new(attr_name + "_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = attr_name
    emit.inputs["Strength"].default_value = 3.5
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    clear_scene()

    # --- Basis geometry --------------------------------------------------
    pts   = viviani(A, N_LONG)
    T, N, B = bishop_frames(pts)
    verts, faces = tube_verts_faces(pts, N, B, TUBE_R, N_CIRC)

    # --- Mesh -----------------------------------------------------------
    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.use_auto_smooth = True
    for p in me.polygons:
        p.use_smooth = True

    # --- Object ---------------------------------------------------------
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj["holoflow:facet"] = True

    # --- Vertex colour --------------------------------------------------
    n_verts = N_LONG * N_CIRC
    vc = me.color_attributes.new("Viviani_Z", 'FLOAT_COLOR', 'POINT')
    flat_colours = z_gradient_colours(pts, N_CIRC, A)
    vc.data.foreach_set("color", flat_colours)

    # --- Material -------------------------------------------------------
    obj.data.materials.append(emissive_material("Viviani_Z"))

    # --- Shape keys -----------------------------------------------------
    obj.shape_key_add(name="Basis", from_mix=False)

    sk_configs = [
        ("SK_Contracted", 0.35, TUBE_R),        # tighter figure-8
        ("SK_Expanded",   0.70, TUBE_R),         # wider figure-8
        ("SK_Thick",      A,    TUBE_R * 1.65),  # same curve, fatter tube
    ]
    for sk_name, a_sk, r_sk in sk_configs:
        pts_sk = viviani(a_sk, N_LONG)
        T_sk, N_sk, B_sk = bishop_frames(pts_sk)
        v_sk, _ = tube_verts_faces(pts_sk, N_sk, B_sk, r_sk, N_CIRC)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for idx, co in enumerate(v_sk):
            sk.data[idx].co = co.tolist()

    # --- Camera & world -------------------------------------------------
    bpy.ops.object.camera_add(location=(2.6, -2.4, 1.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(70), 0, math.radians(48))
    bpy.context.scene.camera = cam
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.008, 0.008, 0.015, 1.0)
    bpy.context.scene.world = world

    # --- GLB export -----------------------------------------------------
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_morph=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[viviani] ✓ Exported → {GLB_PATH}")
    print(f"  Verts={N_LONG * N_CIRC}  Faces={N_LONG * N_CIRC}  ShapeKeys=4")


if __name__ == "__main__":
    main()
