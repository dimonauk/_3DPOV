"""
Dadras–Momeni Strange Attractor (2009)  —  Blender 5.1 / bpy  —  Holoflow Studio
=====================================================================================
Dadras S & Momeni HR (2009) "A novel three-dimensional autonomous chaotic system
generating two, three and four-scroll attractors"
Phys Lett A 373(36):3637–3642  DOI 10.1016/j.physleta.2009.07.088

  ẋ = y − p·x + q·y·z
  ẏ = r·y − x·z + z
  ż = s·x·z − t·z

WHY THIS SYSTEM IS PEDAGOGICALLY DISTINCTIVE
─────────────────────────────────────────────
Most textbook strange attractors (Lorenz, Rössler, Thomas, Chen) have
*constant* volume-contraction rate:  ∇·F = const.  Dadras does not.

  ∂ẋ/∂x = −p          (constant)
  ∂ẏ/∂y =  r          (constant)
  ∂ż/∂z =  s·x − t   ← depends on the state variable x

So  ∇·F(x) = −p + r + s·x − t  =  (−p + r − t) + s·x

For canonical params (p=3, q=2.7, r=1.7, s=2, t=9):
  ∇·F(x) = −10.3 + 2x

At the left wing (x ≈ −2):  ∇·F ≈ −14.3  →  rapid compression.
At the right wing (x ≈ +2): ∇·F ≈ −6.3   →  slower compression.
The attractor self-organises so that the *time-average* ⟨∇·F⟩_orbit is
negative — required by Liouville's theorem for a strange attractor — but
the local rate varies across phase space in a position-dependent way.

MULTI-SCROLL TOPOLOGY
─────────────────────
Changing q (the y·z coupling in ẋ) moves the system through:
  q ≈ 0.0–0.9   →  period-1 / period-2 orbit (no scroll)
  q ≈ 1.0       →  2-scroll figure-eight attractor
  q ≈ 1.9       →  3-scroll attractor
  q ≈ 2.7       →  4-scroll attractor  (canonical Basis)

Each scroll corresponds to the trajectory winding around a different
unstable equilibrium.  The equilibria can be found by setting ẋ=ẏ=ż=0.

Lyapunov spectrum (q=2.7 canonical):
  λ₁ ≈ +0.47,  λ₂ ≈ 0,  λ₃ ≈ −4.47
  Kaplan–Yorke dimension: D_KY = 2 + λ₁/|λ₃| ≈ 2.105

Run this script from Blender's Text Editor (or headless via blender --python).
Requires:  bpy (built-in),  numpy (bundled with Blender 4.2+ / 5.x)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── INTEGRATION PARAMETERS ──────────────────────────────────────────────────
# RK4 step size — t=9 makes the z-equation moderately stiff; DT=5e-4 keeps
# local truncation error below machine-precision for the attractor's scale.
DT        = 5e-4
N_WARMUP  = 10_000   # discard transient — attractor typically settled by 5k
N_STEPS   = 90_000   # main run
THIN      = 30       # keep every THIN-th point → 3000 waypoints on tube

# ─── DADRAS PARAMETERS (canonical 4-scroll) ───────────────────────────────────
P_BASE, Q_BASE, R_BASE, S_BASE, T_BASE = 3.0, 2.7, 1.7, 2.0, 9.0

# ─── TUBE GEOMETRY ───────────────────────────────────────────────────────────
TUBE_SEGS    = 8     # cross-section polygon sides — keeps poly count low
TUBE_RADIUS  = 0.04  # world-space radius of the Bishop tube

# ─── VERTEX COLOUR ───────────────────────────────────────────────────────────
COL_SLOW = np.array([0.06, 0.14, 0.66, 1.0])   # cobalt  (slow segments)
COL_FAST = np.array([0.88, 0.52, 0.04, 1.0])   # amber   (fast segments)
ATTR_NAME = "Dadras_Speed"


# ─── NUMERICAL INTEGRATION ───────────────────────────────────────────────────

def _deriv(xyz, p, q, r, s, t):
    """Dadras vector field: returns (ẋ, ẏ, ż) as a numpy array."""
    x, y, z = xyz
    return np.array([
        y - p * x + q * y * z,    # ẋ — the q·y·z term drives multi-scroll
        r * y - x * z + z,         # ẏ — linear except for the x·z product
        s * x * z - t * z,         # ż — note: divergence contribution s·x − t
    ])


def rk4_step(xyz, p, q, r, s, t):
    """Classic 4th-order Runge-Kutta, fixed step DT."""
    k1 = _deriv(xyz,            p, q, r, s, t)
    k2 = _deriv(xyz + DT/2*k1, p, q, r, s, t)
    k3 = _deriv(xyz + DT/2*k2, p, q, r, s, t)
    k4 = _deriv(xyz + DT   *k3, p, q, r, s, t)
    return xyz + (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(p=P_BASE, q=Q_BASE, r=R_BASE, s=S_BASE, t=T_BASE,
              n_warmup=N_WARMUP, n_steps=N_STEPS, thin=THIN):
    """
    Integrate the Dadras system and return waypoints + speed magnitudes.

    WHY warmup then thin: the first ~2,000 steps settle from IC onto the
    attractor.  We keep every THIN-th point so the tube has ~3,000 vertices
    — enough to capture the topology without exceeding WebXR GPU budgets.
    """
    IC = np.array([0.1, 0.03, 0.0])  # near the attractor's interior
    xyz = IC.copy()

    # Warmup — run without recording
    for _ in range(n_warmup):
        xyz = rk4_step(xyz, p, q, r, s, t)

    # Main run — record thinned waypoints
    n_pts = n_steps // thin
    pts   = np.empty((n_pts, 3), dtype=np.float64)
    speed = np.empty(n_pts,      dtype=np.float64)

    saved = 0
    for i in range(n_steps):
        xyz_new = rk4_step(xyz, p, q, r, s, t)
        if i % thin == 0 and saved < n_pts:
            pts[saved]   = xyz_new
            speed[saved] = np.linalg.norm(xyz_new - xyz) / DT
            saved += 1
        xyz = xyz_new

    return pts, speed


# ─── BISHOP PARALLEL-TRANSPORT FRAME ─────────────────────────────────────────

def bishop_frames(pts):
    """
    Compute a Bishop (parallel-transport) frame along the polyline.

    WHY not Frenet-Serret: the Duffing / Dadras trajectory regularly passes
    through inflection points where curvature → 0, making the Frenet normal
    undefined.  Bishop frames propagate a chosen initial normal by parallel-
    transporting it along each edge, so the frame is always well-defined.

    Returns arrays of tangent T, normal N, and binormal B, all normalised.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    T = T / np.maximum(norms, 1e-12)

    # Seed the initial normal — pick a vector not parallel to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.99:
        seed = np.array([1.0, 0.0, 0.0])

    N  = np.empty((n - 1, 3))
    B  = np.empty((n - 1, 3))
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)
    N[0] = N0
    B[0] = np.cross(T[0], N0)

    # Parallel transport: rotate previous normal into the new tangent plane
    for i in range(1, n - 1):
        rot_axis = np.cross(T[i-1], T[i])
        rot_norm = np.linalg.norm(rot_axis)
        if rot_norm < 1e-9:
            N[i] = N[i-1]
        else:
            rot_axis /= rot_norm
            angle = np.arccos(np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0))
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            n_prev = N[i-1]
            # Rodrigues rotation
            N[i] = (cos_a * n_prev
                    + sin_a * np.cross(rot_axis, n_prev)
                    + (1 - cos_a) * np.dot(rot_axis, n_prev) * rot_axis)
            N[i] /= np.linalg.norm(N[i])
        B[i] = np.cross(T[i], N[i])

    return T, N, B


def build_tube(pts, speed):
    """
    Construct an open Bishop-frame tube mesh from waypoints.

    Returns:
        verts  — (n_ring * n_pts_interior, 3) float array
        faces  — (n_quads, 4) int array (CCW quads)
        cols   — (n_ring * n_pts_interior, 4) RGBA float array
    """
    _, N, B = bishop_frames(pts)

    # Rings — only interior points (not the final waypoint, which has no frame)
    n_inner = len(pts) - 1
    angles  = np.linspace(0, 2 * np.pi, TUBE_SEGS, endpoint=False)

    # Ring offset vectors in 3-D
    cos_a = np.cos(angles)  # (TUBE_SEGS,)
    sin_a = np.sin(angles)

    verts_list = []
    cols_list  = []

    for i in range(n_inner):
        c  = pts[i]
        n  = N[i] * TUBE_RADIUS
        b  = B[i] * TUBE_RADIUS
        t  = speed[i]
        ring = c + cos_a[:, None] * n + sin_a[:, None] * b  # (TUBE_SEGS, 3)
        verts_list.append(ring)

        # Normalised speed → cobalt–amber colour per ring vertex
        cols_list.append(np.tile(t, (TUBE_SEGS, 1)))  # placeholder, normalise later

    verts = np.concatenate(verts_list, axis=0)   # (n_inner*TUBE_SEGS, 3)
    raw_s = np.concatenate(cols_list, axis=0)[:, 0]

    # Normalise speed to [0,1] for colour mapping
    s_min, s_max = raw_s.min(), raw_s.max()
    t_norm = (raw_s - s_min) / max(s_max - s_min, 1e-9)
    cols   = (1 - t_norm[:, None]) * COL_SLOW + t_norm[:, None] * COL_FAST

    # Quad faces: walk rings in sequence
    faces = []
    for i in range(n_inner - 1):
        base = i * TUBE_SEGS
        for j in range(TUBE_SEGS):
            nj = (j + 1) % TUBE_SEGS
            # CCW quad: current ring → next ring
            faces.append([base + j, base + nj,
                          base + TUBE_SEGS + nj, base + TUBE_SEGS + j])

    return verts, np.array(faces, dtype=np.int32), cols


# ─── MESH ASSEMBLY ────────────────────────────────────────────────────────────

def make_mesh_object(verts, faces, name):
    """Create a Blender mesh object from numpy arrays and link it to the scene."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces.tolist())
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    return ob


def add_float_color(ob, cols, attr_name):
    """
    Add a FLOAT_COLOR per-vertex attribute.

    WHY FLOAT_COLOR over BYTE_COLOR: FLOAT_COLOR keeps HDR values intact
    during GLTF export with vertex-colour emission, whereas BYTE_COLOR clips
    at 1.0 and loses the bloom headroom we want.
    """
    me = ob.data
    if attr_name in me.attributes:
        me.attributes.remove(me.attributes[attr_name])
    attr = me.attributes.new(attr_name, 'FLOAT_COLOR', 'POINT')
    flat = cols.ravel().tolist()
    attr.data.foreach_set("color", flat)


def add_shape_key(ob, name, verts_array):
    """Add a shape key from a flat numpy vertex array."""
    sk = ob.shape_key_add(name=name)
    sk.data.foreach_set("co", verts_array.ravel().tolist())
    return sk


# ─── MATERIAL ─────────────────────────────────────────────────────────────────

def build_material(ob, attr_name):
    """
    Vertex-colour emission material for the Dadras tube.

    The Attribute node reads FLOAT_COLOR in linear space; Principled BSDF
    receives it as both Base Colour (for lit scenes) and Emission Colour
    (for unlit WebXR / EEVEE passes).  Roughness 0.82 avoids specular noise
    at low-poly WebXR resolutions.
    """
    mat = bpy.data.materials.new("dadras_tube_mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nt.nodes.new("ShaderNodeAttribute")

    attr.attribute_name = attr_name
    attr.attribute_type = 'GEOMETRY'
    pbsdf.inputs["Roughness"].default_value  = 0.82
    pbsdf.inputs["Emission Strength"].default_value = 0.55

    nt.links.new(attr.outputs["Color"], pbsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], pbsdf.inputs["Emission Color"])
    nt.links.new(pbsdf.outputs["BSDF"], out.inputs["Surface"])

    out.location   = (300, 0)
    pbsdf.location = (0,   0)
    attr.location  = (-300, 0)

    ob.data.materials.append(mat)


# ─── MAIN BUILD ───────────────────────────────────────────────────────────────

def main():
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    NAME = "hf_dadras_poi"

    # ── Basis (canonical 4-scroll, q=2.7) ─────────────────────────────────
    pts_basis, spd_basis = integrate()
    verts_b, faces_b, cols_b = build_tube(pts_basis, spd_basis)

    ob = make_mesh_object(verts_b, faces_b, NAME)
    ob.shape_key_add(name="Basis")
    add_float_color(ob, cols_b, ATTR_NAME)
    build_material(ob, ATTR_NAME)
    ob["holoflow:facet"] = True   # Holoflow WebXR exporter flag (flat-shade on export)

    # ── SK_TwoScroll (q=1.0 — two-lobe figure-eight) ─────────────────────
    pts_2, spd_2 = integrate(q=1.0)
    v2, _, c2 = build_tube(pts_2, spd_2)
    # Pad or trim to match Basis vertex count
    n_basis = len(verts_b)
    if len(v2) >= n_basis:
        v2 = v2[:n_basis]
    else:
        v2 = np.vstack([v2, np.tile(v2[-1], (n_basis - len(v2), 1))])
    add_shape_key(ob, "SK_TwoScroll", v2)
    # Keep colour from Basis (shape keys don't carry separate vertex colours)

    # ── SK_Compact (s=3, tighter z-coiling) ───────────────────────────────
    pts_c, spd_c = integrate(s=3.0)
    vc, _, cc = build_tube(pts_c, spd_c)
    if len(vc) >= n_basis:
        vc = vc[:n_basis]
    else:
        vc = np.vstack([vc, np.tile(vc[-1], (n_basis - len(vc), 1))])
    add_shape_key(ob, "SK_Compact", vc)

    # ── SK_HighCoupling (q=2.7, p=2 — widened butterfly) ─────────────────
    pts_h, spd_h = integrate(p=2.0)
    vh, _, ch = build_tube(pts_h, spd_h)
    if len(vh) >= n_basis:
        vh = vh[:n_basis]
    else:
        vh = np.vstack([vh, np.tile(vh[-1], (n_basis - len(vh), 1))])
    add_shape_key(ob, "SK_WidePinch", vh)

    # ── Transforms & naming ────────────────────────────────────────────────
    ob.name = NAME
    ob.data.name = NAME + "_mesh"

    # Centre on origin (the attractor's mean position)
    mean = np.mean(verts_b, axis=0)
    ob.location = -Vector(mean.tolist())

    # Export GLB
    import os
    out_path = os.path.join(
        os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp",
        f"{NAME}.glb"
    )
    bpy.ops.export_scene.gltf(
        filepath         = out_path,
        use_selection    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_colors    = True,
        export_morph     = True,
        export_yup       = True,
    )
    print(f"[Holoflow] Exported → {out_path}")
    print(f"[Holoflow] Verts: {len(ob.data.vertices)}  Faces: {len(ob.data.polygons)}")


if __name__ == "__main__":
    main()
