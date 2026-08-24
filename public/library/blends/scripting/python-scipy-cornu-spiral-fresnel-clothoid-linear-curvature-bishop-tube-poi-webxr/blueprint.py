"""
Cornu Spiral (Euler Spiral / Clothoid) — Poi Head
===================================================
Three discoverers, one curve:
  • Leonhard Euler (1768): Institutionum Calculi Integralis Vol. I, Part II evaluated
    ∫₀^∞ cos(t²) dt = ∫₀^∞ sin(t²) dt = (1/2)√(π/2). He did not draw the spiral itself.
  • Augustin-Jean Fresnel (1818): Mémoire sur la diffraction de la lumière — introduced
    C(t) and S(t) to compute the intensity at the edge of a geometric shadow.
  • Marie Alfred Cornu (1874): Méthode nouvelle pour la discussion des problèmes de
    diffraction — plotted C vs S as a single curve, the graphical tool that carries
    his name. The spiral is traced by a point whose speed is 1 and whose curvature
    κ = πt is proportional to arc length t.

In railway engineering (Rankine 1862, Talbot 1890s) the same curve is the "clothoid"
or "transition curve" — it interpolates smoothly between a straight track (κ = 0 at t = 0)
and a circular arc (constant κ at t = T_MAX) so that the lateral acceleration on a
vehicle changes continuously rather than instantaneously at the tangent point.

Key mathematical facts
----------------------
Definition (scipy normalisation, arc length t ≥ 0):
  C(t) = ∫₀ᵗ cos(πu²/2) du        (Fresnel cosine integral)
  S(t) = ∫₀ᵗ sin(πu²/2) du        (Fresnel sine integral)

Tangent angle: θ(t) = πt²/2  (curvature κ = dθ/dt = πt — linear in arc length t)

Limiting points: as t → +∞, (C, S) → (1/2, 1/2)
                 as t → −∞, (C, S) → (−1/2, −1/2)

The full bilateral spiral (t ∈ [−T_MAX, +T_MAX]) is an S-shaped curve with C₂ symmetry
(180° rotation maps it to itself). It passes through the origin at t = 0 with zero
curvature (tangent parallel to x-axis), then winds tighter with each additional half-turn
because curvature grows without bound as |t| → ∞.

WHY Bishop frame for an open curve
------------------------------------
The Frenet–Serret frame fails where curvature κ = 0. At t = 0 the Cornu spiral has
κ = 0 and the principal normal is undefined. Bishop parallel-transport bypasses this:
it rotates the frame from one tangent to the next via the minimum-rotation axis
(Rodrigues formula), making no reference to κ. For an OPEN curve no holonomy
correction is needed — the transported frame simply accumulates from one endpoint
to the other without a closure condition.

WHY the 3D helical clothoid (SK_Helix)
-----------------------------------------
Adding a constant-speed z component, z(t) = HELIX_RISE × t, while keeping the same
(C(t), S(t)) in XY, yields a space curve with curvature κ(t) = πt / (1 + HELIX_RISE²)^(1/2)
and constant torsion τ = πt × HELIX_RISE / (κ² + τ²)^(½). This is the "spherical clothoid"
generalisation. It arises in antenna design (helical phase ramps) and 3-D path planning
for autonomous vehicles.
"""

import bpy
import bmesh
import math
import numpy as np
from scipy.special import fresnel      # scipy.special.fresnel returns (S, C)
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
T_MAX      = 3.0    # arc-length parameter range; κ at each tip = π × T_MAX ≈ 9.42 rad/m
SCALE      = 0.38   # world scale: C(∞) ≈ 0.5 so half-width ≈ SCALE × 0.5 = 0.19 m
N_LONG     = 360    # samples along the S-curve (1° of tangent angle per step near t=0)
N_CIRC     = 12     # cross-section polygon sides
TUBE_R     = 0.018  # tube radius in metres
HELIX_RISE = 0.055  # SK_Helix: z = HELIX_RISE × t per unit arc length

OBJ_NAME  = "cornu_poi"
MESH_NAME = "Cornu_Tube"
GLB_PATH  = "//hf_cornu_poi.glb"

# ─── Colours (linear FLOAT_COLOR) ────────────────────────────────────────────
# Cobalt (κ ≈ 0 at centre, relaxed) → Amber (κ = π T_MAX at tips, tightly wound)
COL_COBALT = (0.055, 0.408, 0.918, 1.0)
COL_AMBER  = (0.918, 0.510, 0.055, 1.0)
COL_WHITE  = (0.900, 0.900, 0.870, 1.0)


# ─── Geometry helpers ────────────────────────────────────────────────────────
def cornu_spine(t_max, n, scale, helix_rise=0.0):
    """
    Return (n, 3) array of the Cornu spiral (bilateral, t ∈ [−t_max, +t_max]).

    scipy.special.fresnel(x) returns (S(|x|), C(|x|)) × sign(x) for signed x.
    """
    t = np.linspace(-t_max, t_max, n)
    S, C = fresnel(t)        # WHY fresnel returns (S, C): Fresnel's 1818 convention
    pts = np.stack([
        scale * C,           # x = C(t), rightward along the "flat" part at t = 0
        scale * S,           # y = S(t), upward curl of the spiral
        helix_rise * t,      # z = 0 for basis; linear rise for SK_Helix
    ], axis=1)
    return pts, t


def bishop_open(pts):
    """
    Bishop parallel-transport frame for an OPEN curve.

    WHY no holonomy correction: the curve is open (not periodic). The first
    and last rings of the tube will be capped with flat disks, so there is no
    seam that needs to close — only consistent normal propagation matters.

    Returns T (tangent), N (normal), B (binormal) each (n, 3).
    """
    n = len(pts)

    # Centred finite-difference tangents (forward/backward difference at ends)
    T = np.empty_like(pts)
    T[0]    = pts[1]    - pts[0]
    T[-1]   = pts[-1]   - pts[-2]
    T[1:-1] = pts[2:]   - pts[:-2]
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(norms < 1e-14, 1.0, norms)

    # Seed N₀ perpendicular to T₀
    # WHY: any unit vector perpendicular to T[0] works as a seed; we choose the
    # one that avoids catastrophic cancellation by picking the "least aligned" axis.
    up = np.array([0.0, 0.0, 1.0])
    if abs(float(T[0] @ up)) > 0.9:
        up = np.array([0.0, 1.0, 0.0])
    N = np.empty_like(T)
    N[0] = np.cross(T[0], up)
    N[0] /= np.linalg.norm(N[0])

    # Rodrigues transport
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        ax_n = np.linalg.norm(axis)
        if ax_n < 1e-14:           # parallel tangents → no rotation
            N[i] = N[i - 1]
            continue
        axis /= ax_n
        c = float(np.clip(T[i - 1] @ T[i], -1.0, 1.0))
        s = math.sqrt(max(0.0, 1.0 - c * c))
        N[i] = (c * N[i - 1]
                + s * np.cross(axis, N[i - 1])
                + (1.0 - c) * float(axis @ N[i - 1]) * axis)
        nm = np.linalg.norm(N[i])
        if nm > 1e-14:
            N[i] /= nm

    B = np.cross(T, N)
    return T, N, B


def build_open_tube(pts, N, B, r, nc):
    """
    Return (verts, faces) for an OPEN cylinder tube.

    Topology: (n_long × nc) ring verts + 2 cap centre verts.
    Faces:
      • (n_long − 1) × nc quads between consecutive rings
      • nc triangles at each end cap (fan around a central vertex)
    """
    nl  = len(pts)
    ang = np.linspace(0.0, 2.0 * math.pi, nc, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)

    # Ring vertices: verts[i*nc + j]
    ring = (pts[:, np.newaxis, :]
            + r * (ca[np.newaxis, :, np.newaxis] * N[:, np.newaxis, :]
                   + sa[np.newaxis, :, np.newaxis] * B[:, np.newaxis, :]))
    ring = ring.reshape(-1, 3)    # (nl × nc, 3)

    # Cap centre vertices at both ends
    cap0_idx = nl * nc        # index of start-cap centre
    cap1_idx = nl * nc + 1   # index of end-cap centre

    all_verts = np.vstack([ring,
                            pts[0:1],    # start cap centre
                            pts[-1:]])   # end cap centre

    faces = []
    # Ring-to-ring quads (longitudinal, no wrap)
    for i in range(nl - 1):
        i1 = i + 1
        for j in range(nc):
            j1 = (j + 1) % nc
            a = i  * nc + j
            b = i1 * nc + j
            c = i1 * nc + j1
            d = i  * nc + j1
            faces.append((a, b, c, d))

    # Start cap (fan from cap0_idx, ring 0 reversed for outward normal)
    for j in range(nc):
        j1 = (j + 1) % nc
        faces.append((cap0_idx, j1, j))           # reversed → outward normal

    # End cap (fan from cap1_idx, ring nl-1)
    base = (nl - 1) * nc
    for j in range(nc):
        j1 = (j + 1) % nc
        faces.append((cap1_idx, base + j, base + j1))

    return all_verts, faces


def kappa_colours(t_arr, nc, t_max):
    """
    FLOAT_COLOR POINT: Cobalt (κ = 0 at t = 0) → Amber (κ = π·t_max at tips).
    Each spine point repeated nc times (ring vertices) + 2 cap centres.

    WHY POINT domain: colour varies along the spine, not per face —
    POINT gives smooth interpolation without per-face discontinuities.
    """
    flat = []
    for t in t_arr:
        frac = abs(t) / t_max           # 0 at centre, 1 at tips
        col = tuple(
            (1.0 - frac) * COL_COBALT[k] + frac * COL_AMBER[k]
            for k in range(4)
        )
        for _ in range(nc):
            flat.extend(col)

    # Cap centres: same colour as the tip they close (|t| = t_max → Amber)
    flat.extend(COL_AMBER)   # start cap
    flat.extend(COL_AMBER)   # end cap
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
    emit.inputs["Strength"].default_value = 3.2
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.cameras, bpy.data.lights):
        for item in list(col):
            col.remove(item)


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    clear_scene()

    # ── Basis spine ─────────────────────────────────────────────────────────
    pts_basis, t_arr = cornu_spine(T_MAX, N_LONG, SCALE, helix_rise=0.0)
    T, N, B = bishop_open(pts_basis)
    verts, faces = build_open_tube(pts_basis, N, B, TUBE_R, N_CIRC)

    # ── Mesh ────────────────────────────────────────────────────────────────
    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.use_auto_smooth = True
    for p in me.polygons:
        p.use_smooth = True

    # ── Object ──────────────────────────────────────────────────────────────
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj["holoflow:facet"] = True

    # ── Vertex colour ───────────────────────────────────────────────────────
    n_colour_pts = N_LONG * N_CIRC + 2   # rings + 2 cap centres
    vc = me.color_attributes.new("Cornu_Kappa", 'FLOAT_COLOR', 'POINT')
    flat_cols = kappa_colours(t_arr, N_CIRC, T_MAX)
    vc.data.foreach_set("color", flat_cols)

    # ── Material ────────────────────────────────────────────────────────────
    obj.data.materials.append(emissive_material("Cornu_Kappa"))

    # ── Shape keys ──────────────────────────────────────────────────────────
    # WHY shape keys for different helix rises / scale: they let the WebXR
    # viewer morph between the flat 2D spiral and the 3D helical clothoid in
    # real time — no texture bake required.
    obj.shape_key_add(name="Basis", from_mix=False)

    sk_configs = [
        # (name, helix_rise, t_max_scale, tube_r_scale)
        ("SK_Helix",   HELIX_RISE, T_MAX,       TUBE_R),        # 3-D helical clothoid
        ("SK_Tight",   0.0,        T_MAX * 0.5, TUBE_R * 0.8),  # fewer coils, relaxed
        ("SK_Fat",     0.0,        T_MAX,        TUBE_R * 1.6),  # same curve, fatter tube
    ]

    for sk_name, h_rise, t_mx, r_sk in sk_configs:
        pts_sk, _ = cornu_spine(t_mx, N_LONG, SCALE, helix_rise=h_rise)
        # For SK_Tight, fewer coils means shorter t range — Bishop frame still computed
        # on N_LONG points (same vertex count, different geometry)
        _, N_sk, B_sk = bishop_open(pts_sk)
        v_sk, _ = build_open_tube(pts_sk, N_sk, B_sk, r_sk, N_CIRC)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for idx, co in enumerate(v_sk):
            sk.data[idx].co = co.tolist()

    # ── Camera & world ──────────────────────────────────────────────────────
    bpy.ops.object.camera_add(location=(0.0, -2.8, 0.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.006, 0.006, 0.012, 1.0)
    bpy.context.scene.world = world

    # ── GLB export ──────────────────────────────────────────────────────────
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
    n_verts = N_LONG * N_CIRC + 2
    n_faces = (N_LONG - 1) * N_CIRC + 2 * N_CIRC
    print(f"[cornu] ✓ Exported → {GLB_PATH}")
    print(f"  Verts={n_verts}  Faces={n_faces}  ShapeKeys=4")


if __name__ == "__main__":
    main()
