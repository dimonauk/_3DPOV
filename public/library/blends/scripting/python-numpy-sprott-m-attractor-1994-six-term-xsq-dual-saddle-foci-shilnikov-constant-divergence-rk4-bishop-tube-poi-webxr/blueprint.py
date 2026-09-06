"""
Sprott M Attractor — 1994 Canonical Case M
===========================================
Technique: RK4 integration of a 6-term 3-D ODE with a single quadratic
nonlinearity (x²), converted to a Bishop-parallel-transport tube mesh
coloured by speed.  All geometry via bpy.data — no operators required.

Reference: Sprott JC (1994) "Some simple chaotic flows",
  Phys Rev E 50(2):R647.  Public-domain mathematics.
  sprott.physics.wisc.edu/chaostsa/

System:
    ẋ = −z
    ẏ = −x² − y
    ż = A + Bx + Cy

Canonical: A=1.7  B=1.7  C=0.6

Key properties
--------------
∇·F = ∂(−z)/∂x + ∂(−x²−y)/∂y + ∂(A+Bx+Cy)/∂z
    = 0 + (−1) + 0 = −1   (constant, parameter-independent)
ΣLyapunov = −1  (Liouville theorem)

Fixed points: ẋ=0 → z=0; ẏ=0 → y=−x²; ż=0 → Cx²−Bx−A=0
  P₁ ≈ ( 3.617, −13.08, 0)  x=(B+√(B²+4CA))/(2C) ≈ (1.7+2.64)/1.2
  P₂ ≈ (−0.783, −0.613, 0)  x=(B−√(B²+4CA))/(2C) ≈ (1.7−2.64)/1.2

Jacobian at (x₀, −x₀², 0):  J=[[0,0,−1],[−2x₀,−1,0],[B,C,0]]

At P₂ (x₀≈−0.783):
  char poly: λ³+λ²+1.7λ+2.64=0
  roots: λ_s≈−1.30 (stable), λ_c≈+0.15±1.42i (UNSTABLE complex pair)
  → Shilnikov ratio |λ_s|/Re(λ_c) = 1.30/0.15 ≈ 8.67 >> 1 ✓  chaos guaranteed

At P₁ (x₀≈+3.617):
  char poly: λ³+λ²+1.7λ−2.64=0
  roots: λ_r≈+0.82 (UNSTABLE real), λ_c≈−0.91±1.55i (stable pair)
  → P₁ is a real-unstable / spiral-stable configuration (repels along x-axis)

λ₁≈+0.065  D_KY≈2.061  (λ₁+λ₃=−1 → λ₃≈−1.065; D=2+0.065/1.065)
"""

import bpy
import bmesh
import numpy as np

# ── integration parameters ────────────────────────────────────────────────────
A_PARAM = 1.70   # constant offset in ż (Sprott canonical)
B_PARAM = 1.70   # x-coefficient in ż
C_PARAM = 0.60   # y-coefficient in ż
DT      = 0.01   # RK4 step — conservative for MLE≈0.065
BURN_IN = 2_000  # transient steps before recording
N_STEPS = 90_000 # recording steps
THIN    = 30     # keep every 30th → 3000 waypoints
IC      = np.array([0.1, 0.5, 0.0])   # z=0 is fine: ż=A+B·0.1+C·0.5=1.6≠0

# ── tube geometry ─────────────────────────────────────────────────────────────
TUBE_SIDES = 8
TUBE_R     = 0.035   # cross-section radius (m)
POI_R      = 0.085   # bounding-sphere radius for poi-head WebXR export

# ── colour ────────────────────────────────────────────────────────────────────
ATTR_NAME = "SprottM_Speed"
COBALT    = np.array([0.020, 0.102, 0.557])  # slow
AMBER     = np.array([0.950, 0.600, 0.000])  # fast


# ─────────────────────────────────────────────────────────────────────────────
# 1. ODE + RK4
# ─────────────────────────────────────────────────────────────────────────────

def _f(s, a, b, c):
    """Sprott M vector field. s=[x,y,z]. Pure function, no side-effects."""
    x, y, z = s
    return np.array([
        -z,             # ẋ = −z           (pure transport; no x-term → divergence=0)
        -x*x - y,       # ẏ = −x² − y      (x²-suppressed damping: equilibrium y=−x²)
        a + b*x + c*y   # ż = A + Bx + Cy  (linear driving; divergence=0)
    ])


def integrate(a=A_PARAM, b=B_PARAM, c=C_PARAM, ic=IC):
    """RK4 integrate Sprott M; return (N_WP, 3) waypoint array.

    Why RK4 at DT=0.01: the largest eigenvalue at P₂ is Im≈1.42 rad/step,
    so Nyquist requires DT < π/1.42 ≈ 2.2.  DT=0.01 gives ~628 steps per
    full spiral, well inside the stability limit of RK4 (|hλ|<2√2 for
    complex λ → |0.01·(0.15+1.42i)|=0.014 << 2√2).
    """
    s = ic.copy().astype(float)
    for _ in range(BURN_IN):
        k1 = _f(s, a, b, c)
        k2 = _f(s + 0.5*DT*k1, a, b, c)
        k3 = _f(s + 0.5*DT*k2, a, b, c)
        k4 = _f(s + DT*k3, a, b, c)
        s += (DT/6.0)*(k1 + 2*k2 + 2*k3 + k4)

    pts = []
    for i in range(N_STEPS):
        k1 = _f(s, a, b, c)
        k2 = _f(s + 0.5*DT*k1, a, b, c)
        k3 = _f(s + 0.5*DT*k2, a, b, c)
        k4 = _f(s + DT*k3, a, b, c)
        s += (DT/6.0)*(k1 + 2*k2 + 2*k3 + k4)
        if i % THIN == 0:
            pts.append(s.copy())
    return np.array(pts)   # (3000, 3)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Bishop parallel-transport frame  (Bishop 1975, Am Math Monthly 82:246)
# ─────────────────────────────────────────────────────────────────────────────

def bishop_frame(pts):
    """Return normal N and binormal B arrays, each (N_WP,3), twist-free.

    Frenet–Serret frames accumulate torsion-twist; Bishop propagates by
    the minimal Rodrigues rotation aligning successive tangents — the
    resultant tube has no extrinsic twist even across near-collinear segments.
    """
    n  = len(pts)
    T  = np.zeros((n, 3))
    N  = np.zeros((n, 3))
    B  = np.zeros((n, 3))

    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        r = np.linalg.norm(d)
        T[i] = d / r if r > 1e-12 else (T[i-1] if i > 0 else np.array([0.,0.,1.]))
    T[-1] = T[-2]

    up = np.array([0., 0., 1.])
    if abs(np.dot(T[0], up)) > 0.9:
        up = np.array([1., 0., 0.])
    N[0] = np.cross(T[0], up)
    N[0] /= np.linalg.norm(N[0])
    B[0]  = np.cross(T[0], N[0])

    for i in range(1, n):
        axis  = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            ax   = axis / sin_a
            N[i] = (cos_a * N[i-1]
                    + sin_a * np.cross(ax, N[i-1])
                    + (1.0 - cos_a) * np.dot(ax, N[i-1]) * ax)
            nl   = np.linalg.norm(N[i])
            if nl > 1e-12:
                N[i] /= nl
        B[i] = np.cross(T[i], N[i])
    return N, B


# ─────────────────────────────────────────────────────────────────────────────
# 3. Tube geometry
# ─────────────────────────────────────────────────────────────────────────────

def build_tube(pts, N_frame, B_frame):
    """Return (verts, quad-faces) lists for a cylindrical tube.

    Ring layout: TUBE_SIDES vertices per cross-section at TUBE_R offset
    from the waypoint along N and B.  Faces are quads connecting adjacent
    rings, forming 2999×8=23 992 quad faces total.
    """
    n   = len(pts)
    s   = TUBE_SIDES
    ang = np.linspace(0, 2*np.pi, s, endpoint=False)
    ca  = np.cos(ang)   # (s,)
    sa  = np.sin(ang)   # (s,)

    # rings: (n, s, 3)  broadcast without explicit loop
    rings = (pts[:, None, :]
             + TUBE_R * ca[None, :, None] * N_frame[:, None, :]
             + TUBE_R * sa[None, :, None] * B_frame[:, None, :])

    verts = rings.reshape(-1, 3).tolist()   # (n*s, 3)

    faces = []
    for i in range(n - 1):
        for j in range(s):
            a = i*s + j
            b = i*s + (j+1) % s
            c = (i+1)*s + (j+1) % s
            d = (i+1)*s + j
            faces.append((a, b, c, d))
    return verts, faces


# ─────────────────────────────────────────────────────────────────────────────
# 4. Speed colours  (Cobalt→Amber FLOAT_COLOR)
# ─────────────────────────────────────────────────────────────────────────────

def speed_colours(pts, a=A_PARAM, b=B_PARAM, c=C_PARAM):
    """Per-vertex colour from ||ẋ,ẏ,ż||, broadcast to TUBE_SIDES vertices."""
    speeds = np.array([np.linalg.norm(_f(p, a, b, c)) for p in pts])
    t = (speeds - speeds.min()) / max(speeds.max() - speeds.min(), 1e-9)
    cols = np.outer(1.0 - t, COBALT) + np.outer(t, AMBER)   # (n, 3)
    return np.repeat(cols, TUBE_SIDES, axis=0)                # (n*s, 3)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Build Blender mesh
# ─────────────────────────────────────────────────────────────────────────────

def create_mesh_object(name, verts, faces, colours):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    # FLOAT_COLOR (4-channel RGBA) survives GLB Draco-6 + WebP export
    nv   = len(verts)
    attr = mesh.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    rgba = np.ones((nv, 4), dtype=np.float32)
    rgba[:, :3] = colours
    attr.data.foreach_set("color", rgba.flatten().tolist())

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ─────────────────────────────────────────────────────────────────────────────
# 6. Main — Basis + 3 shape keys
# ─────────────────────────────────────────────────────────────────────────────

def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # ── Basis ────────────────────────────────────────────────────────────────
    pts0   = integrate()
    sc0    = POI_R / max(np.abs(pts0).max(), 1e-9)
    pts0  *= sc0
    N0, B0 = bishop_frame(pts0)
    v0, f0 = build_tube(pts0, N0, B0)
    cols   = speed_colours(pts0)

    name = "hf_sprott_m_poi"
    obj  = create_mesh_object(name, v0, f0, cols)
    obj.shape_key_add(name="Basis", from_mix=False)

    # ── Variant shape keys ────────────────────────────────────────────────────
    # Each re-integrates with altered parameters; the attractor deforms.
    # Same THIN → same vertex count → valid shape-key targets.
    variants = [
        ("SK_WeakA", 1.20, B_PARAM, C_PARAM),  # weaker constant → fixed-pts shift
        ("SK_HighC", A_PARAM, B_PARAM, 0.90),   # stronger y-coupling → broader orbit
        ("SK_LowB",  A_PARAM, 1.20, C_PARAM),   # weaker x-coupling → topology shift
    ]
    for kname, a, b, c in variants:
        pts_v  = integrate(a=a, b=b, c=c)
        sc_v   = POI_R / max(np.abs(pts_v).max(), 1e-9)
        pts_v *= sc_v
        Nv, Bv = bishop_frame(pts_v)
        vv, _  = build_tube(pts_v, Nv, Bv)
        sk = obj.shape_key_add(name=kname, from_mix=False)
        flat = [coord for xyz in vv for coord in xyz]
        sk.data.foreach_set("co", flat)

    # ── holoflow metadata ─────────────────────────────────────────────────────
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "sprott-m-attractor"
    obj["holoflow:export"]   = "hf_sprott_m_poi"

    # ── +Y-up for WebXR ───────────────────────────────────────────────────────
    obj.rotation_euler = (1.5707963267948966, 0.0, 0.0)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    nv = len(obj.data.vertices)
    nf = len(obj.data.polygons)
    ks = [k.name for k in obj.data.shape_keys.key_blocks]
    print(f"[SprottM] {nv}V  {nf}Q  keys={ks}")


if __name__ == "__main__":
    main()
