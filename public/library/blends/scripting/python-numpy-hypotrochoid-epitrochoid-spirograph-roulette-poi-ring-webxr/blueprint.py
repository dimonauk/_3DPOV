"""
Hypotrochoid & Epitrochoid — Rolling-Circle Roulette Curves
Bishop-Frame Tube Poi Ring · Blender 5.1 · CC0

A roulette curve is the path traced by a fixed point on a circle rolling
without slipping against another circle.  Hypotrochoid: rolling inside the
fixed circle.  Epitrochoid: rolling outside.  The closed-curve condition is
GCD(R, r) = g → curve closes after exactly r/g full rolling-circle revolutions,
i.e. period = 2π·(r/g).

WHY: every poi aerial that repeats with N-fold symmetry and no tangling has an
underlying roulette structure.  The bishop-frame tube converts the 2D curve to a
WebXR-ready GLB ring in a single bpy script, no modifier stack needed.

Usage:
    Open Blender 5.1 → Scripting workspace → Open blueprint.py → ▶ Run Script
    Select hf_spirograph_poi in Outliner → File → Export → glTF 2.0
    Settings: Draco 6, WebP, Selected Objects, +Y-Up
"""

import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
N_CURVE   = 1024   # sample points around the curve (power of 2 — FFT friendly)
TUBE_R    = 0.012  # tube cross-section radius in Blender units (≈ 12 mm)
N_CIRC    = 12     # polygon sides on tube cross-section
SCALE_M   = 0.15   # overall scaling so the ring fits a 30 cm poi head

# Named roulette variants.  Each entry: (R, r, d, roulette_type, label)
#   R = fixed-circle radius, r = rolling-circle radius, d = pen-arm length
#   roulette_type = 'hypo' | 'epi'
VARIANTS = [
    (5, 3, 4.0, "hypo", "Spirograph_5_3"),   # 5-petalled hypotrochoid, d>r → loopy
    (7, 2, 2.5, "hypo", "Rose_7_2"),          # 7-lobed hypotrochoid, fine inner loops
    (4, 1, 1.0, "hypo", "Astroid"),            # d=r, 4-cusped hypocycloid
    (3, 1, 1.0, "hypo", "Deltoid"),            # d=r, 3-cusped deltoid
    (2, 1, 1.0, "epi",  "Cardioid"),           # d=r, 1-cusped epicycloid
    (3, 1, 1.0, "epi",  "Nephroid"),           # d=r, 2-cusped nephroid
]
DEFAULT_VARIANT = 0   # index into VARIANTS used for the base mesh


# ── Maths ──────────────────────────────────────────────────────────────────────
def sample_roulette(R, r, d, N, roulette_type="hypo"):
    """Return (x, y) arrays of length N for one closed period of a roulette curve.

    Hypotrochoid: rolling circle r inside fixed circle R.
    Epitrochoid:  rolling circle r outside fixed circle R.

    Closed-curve condition: period = 2π · (r / gcd(R, r)).
    We always sample exactly one closed period so the tube joins cleanly.
    """
    g = math.gcd(int(round(R)), int(round(r)))
    period = 2.0 * math.pi * (r / g)
    t = np.linspace(0.0, period, N, endpoint=False)
    if roulette_type == "hypo":
        ratio = (R - r) / r
        x = (R - r) * np.cos(t) + d * np.cos(ratio * t)
        y = (R - r) * np.sin(t) - d * np.sin(ratio * t)
    else:  # epi
        ratio = (R + r) / r
        x = (R + r) * np.cos(t) - d * np.cos(ratio * t)
        y = (R + r) * np.sin(t) - d * np.sin(ratio * t)
    return x, y


def normalise_to_scale(x, y, target):
    """Centre on origin, scale so the max radius equals target."""
    x = x - x.mean()
    y = y - y.mean()
    r_max = np.sqrt(x**2 + y**2).max()
    s = target / r_max if r_max > 1e-9 else 1.0
    return x * s, y * s


def bishop_frame(pts3d):
    """Compute parallel-transport (Bishop) frame along a closed 3D curve.

    Returns T (tangents), Nx (normal), Bx (binormal) arrays, shape (N, 3).
    WHY Bishop over Frenet: planar curves have zero torsion so the Frenet
    binormal is constant (Z).  Bishop propagates the frame without accumulating
    spin, giving a twist-free tube even across inflection points (cusps).

    Closure correction: accumulate the frame rotation over one period and
    distribute the residual twist uniformly.  This ensures the tube mesh
    closes without a seam crack at the join.
    """
    N = len(pts3d)
    # Tangent — central difference, wrap at ends
    T = np.zeros((N, 3))
    for i in range(N):
        T[i] = pts3d[(i + 1) % N] - pts3d[(i - 1) % N]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T = T / norms

    # Seed the first normal — pick any vector not parallel to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.99:
        seed = np.array([0.0, 1.0, 0.0])
    Nx = np.zeros((N, 3))
    Bx = np.zeros((N, 3))
    n0 = seed - np.dot(seed, T[0]) * T[0]
    n0 /= np.linalg.norm(n0)
    Nx[0] = n0
    Bx[0] = np.cross(T[0], n0)

    # Propagate with minimal rotation (double-reflection transport)
    for i in range(1, N):
        v1 = pts3d[i] - pts3d[i - 1]
        c  = np.dot(T[i - 1], T[i])
        if c > 0.99999:
            Nx[i] = Nx[i - 1]
        else:
            axis = np.cross(T[i - 1], T[i])
            axis /= max(np.linalg.norm(axis), 1e-12)
            angle = math.acos(min(max(c, -1.0), 1.0))
            # Rodrigues rotation
            Nx[i] = (Nx[i - 1] * math.cos(angle)
                     + np.cross(axis, Nx[i - 1]) * math.sin(angle)
                     + axis * np.dot(axis, Nx[i - 1]) * (1 - math.cos(angle)))
        Bx[i] = np.cross(T[i], Nx[i])

    # Closure correction: measure residual angle at wrap-around
    dot = np.clip(np.dot(Nx[-1], Nx[0]), -1.0, 1.0)
    cross_z = np.dot(np.cross(Nx[-1], Nx[0]), T[0])
    residual = math.atan2(cross_z, dot)
    for i in range(N):
        theta = residual * i / N
        c, s = math.cos(theta), math.sin(theta)
        Nx[i] = c * Nx[i] + s * Bx[i]
        Bx[i] = np.cross(T[i], Nx[i])
    return T, Nx, Bx


def build_tube_verts(pts3d, Nx, Bx, tube_r, n_circ):
    """Tube vertices: for each spine point, extrude a circle of radius tube_r."""
    N = len(pts3d)
    verts = []
    for i in range(N):
        for j in range(n_circ):
            angle = 2.0 * math.pi * j / n_circ
            v = pts3d[i] + tube_r * (math.cos(angle) * Nx[i]
                                     + math.sin(angle) * Bx[i])
            verts.append(v.tolist())
    return verts


def build_tube_faces(N, n_circ):
    """Quad faces for the tube, wrapping both along the spine and around the circle."""
    faces = []
    for i in range(N):
        i1 = (i + 1) % N
        for j in range(n_circ):
            j1 = (j + 1) % n_circ
            a = i  * n_circ + j
            b = i  * n_circ + j1
            c = i1 * n_circ + j1
            d = i1 * n_circ + j
            faces.append((a, b, c, d))
    return faces


# ── Scene build ───────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def make_variant_verts(R, r, d, rtype, scale):
    """Return a flat list of 3D vertex positions for one roulette variant."""
    x, y = sample_roulette(R, r, d, N_CURVE, rtype)
    x, y = normalise_to_scale(x, y, scale)
    pts3d = np.column_stack([x, y, np.zeros(N_CURVE)])
    T, Nx, Bx = bishop_frame(pts3d)
    verts = build_tube_verts(pts3d, Nx, Bx, TUBE_R, N_CIRC)
    return verts


def build():
    clear_scene()

    # Build the base mesh from DEFAULT_VARIANT
    R0, r0, d0, rt0, lbl0 = VARIANTS[DEFAULT_VARIANT]
    base_verts = make_variant_verts(R0, r0, d0, rt0, SCALE_M)
    faces = build_tube_faces(N_CURVE, N_CIRC)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in base_verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        try:
            bm.faces.new([bm_verts[i] for i in f])
        except ValueError:
            pass  # skip degenerate face at cusps

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Flat shading — holoflow faceted aesthetic
    for face in bm.faces:
        face.smooth = False

    # Vertex colour: parametric t encoded as hue along the curve
    colour_layer = bm.loops.layers.color.new("roulette_t")
    N = N_CURVE
    for i, face in enumerate(bm.faces):
        spine_idx = i // N_CIRC  # approximate; good enough for colour
        t_val = spine_idx / N
        hue = t_val
        # HSV → RGB simple: cycle through the rainbow once per period
        r_c = abs(math.fmod(hue * 6.0, 6.0) - 3.0) - 1.0
        g_c = 2.0 - abs(math.fmod(hue * 6.0, 6.0) - 2.0)
        b_c = 2.0 - abs(math.fmod(hue * 6.0 + 2.0, 6.0) - 2.0)
        col = (min(max(r_c, 0), 1), min(max(g_c, 0), 1),
               min(max(b_c, 0), 1), 1.0)
        for loop in face.loops:
            loop[colour_layer] = col

    mesh = bpy.data.meshes.new("hf_spirograph_poi")
    bm.to_mesh(mesh)
    bm.free()
    mesh.use_auto_smooth = False

    obj = bpy.data.objects.new("hf_spirograph_poi", mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Shape keys — one per roulette variant
    obj.shape_key_add(name="Basis", from_mix=False)
    for idx, (Rv, rv, dv, rtv, lblv) in enumerate(VARIANTS):
        if idx == DEFAULT_VARIANT:
            continue
        var_verts = make_variant_verts(Rv, rv, dv, rtv, SCALE_M)
        sk = obj.shape_key_add(name=lblv, from_mix=False)
        for vi, co in enumerate(var_verts):
            sk.data[vi].co = co

    # Orient +Y-up for holoflow export convention
    obj.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Custom property for holoflow WebXR exporter
    obj["holoflow:facet"] = True

    print(f"[roulette] Done — {len(base_verts)} vertices, {len(faces)} quads")
    print(f"[roulette] Variants: {[v[4] for v in VARIANTS]}")
    print("[roulette] Export: File → Export → glTF 2.0, Draco 6, WebP, +Y-Up")


build()
