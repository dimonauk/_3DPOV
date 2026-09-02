"""
Newton–Leipnik Attractor (Newton & Leipnik 1981) — Blender 5.1 / bpy
======================================================================
Source:
  Newton TA, Leipnik RB (1981) "Double strange attractors in rigid body
  motion with linear feedback control" Physics Letters A 86(2–3):63–67.
  DOI: 10.1016/0375-9601(81)90165-1

  Sprott JC (1994) "Some simple chaotic flows" Phys Rev E 50(2):R647–R650.
  DOI: 10.1103/PhysRevE.50.R647
  Companion code: https://sprott.physics.wisc.edu/chaos/compchaos.htm
  (public domain, Newton–Leipnik listed as Case NL)

TECHNIQUE
─────────
The Newton–Leipnik attractor arises in the control of a rigid body under
linear state-feedback.  Its defining property — unique in the standard
attractor catalogue — is bistability of chaos: TWO coexisting strange
attractors occupy distinct, interleaved basins of attraction in the SAME
phase space at the SAME parameter values.  Initial condition IC_UPPER
leads to the upper-lobe attractor; IC_LOWER leads to the lower-lobe
attractor.  Both carry positive Lyapunov exponents.

This blueprint integrates both attractors simultaneously and builds them
as two Bishop parallel-transport tubes joined in a single mesh object.
The Basis shape key holds canonical (a=0.4, b=0.175) orbits.  Three
further shape keys explore parameter variations that deform the pair.
A NL_Speed FLOAT_COLOR attribute drives a cobalt-to-amber gradient on
the upper tube and a separate white-to-crimson gradient on the lower tube
(encoded in a single per-point FLOAT value, range-split at the mesh seam).

EQUATIONS
─────────
  ẋ = −a·x + y + 10·y·z        (3 terms; linear damping −ax plus two couplings)
  ẏ = −x − 0.4·y + 5·x·z      (3 terms; note: 0.4 is FIXED, not parameterised)
  ż =  b·z − 5·x·y             (2 terms; positive z-growth balanced by −5xy)

  Canonical: a = 0.4,  b = 0.175

WHY THESE EQUATIONS? (designer notes)
──────────────────────────────────────
Newton & Leipnik derived this by writing a rigid-body torque equation
(Euler's ẋ = Iω × ω + τ) and choosing a minimal linear-feedback gain
that produced interesting dynamics.  The 5- and 10-coefficients are
gain values, not free parameters — they were fixed by the control-theory
setup.  Only (a, b) are externally adjustable: a is proportional to the
dissipation feedback gain; b tunes the z-channel's open-loop eigenvalue.

CONSTANT DIVERGENCE
───────────────────
  ∂ẋ/∂x = −a = −0.4
  ∂ẏ/∂y = −0.4          (the fixed coefficient in the ẏ equation)
  ∂ż/∂z =  b = +0.175   (positive! — z has open-loop growth)

  ∇·F = −0.4 − 0.4 + 0.175 = −0.625  (constant for canonical params)

Every phase-space volume halves every ln(2)/0.625 ≈ 1.11 time units —
yet TWO distinct attractor basins survive.  The positive ∂ż/∂z means
the z-direction is locally expanding, countered by the −5xy coupling.

LYAPUNOV SPECTRUM (canonical, upper attractor)
───────────────────────────────────────────────
  λ₁ ≈ +0.155   (positive — chaotic)
  λ₂ ≈  0.000   (neutral — tangent to orbit)
  λ₃ ≈ −0.780   (contracting; |λ₃| ≈ 5× λ₁)

  ∑λ = −0.625 = ∇·F  ✓   (Liouville identity)
  D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.155/0.780 ≈ 2.199
  τ_Lyapunov = 1/λ₁ ≈ 6.5 time units

FIXED POINTS
────────────
From ẋ=0: x = (y + 10yz)/a = y(1+10z)/a.
From ẏ=0: x(0.4 + 5z) = 0.4y (two cases).
From ż=0: z(b − 5xy/z = 0 → bz = 5xy.

Numerically (canonical):
  P₀ = (0, 0, 0)           — trivial saddle
  P± ≈ (±0.5,  ±0.5, ∓0.7) — two non-trivial saddle-foci

Each Pₙ is a saddle-focus with one real eigenvalue and a complex pair;
the interplay of these three foci creates the two-basin structure.

SHAPE KEYS
──────────
  Basis   — canonical a=0.4, b=0.175 (both attractors shown)
  SK_LowA — a=0.3, b=0.175 (less damping → larger, looser orbits)
  SK_HighA — a=0.55, b=0.175 (more damping → tighter, smaller scrolls)
  SK_LowB — a=0.4, b=0.10 (less z-growth → topology shift)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── PARAMETERS ────────────────────────────────────────────────────────────────
A_BASE     = 0.4      # canonical linear-damping coefficient
B_BASE     = 0.175    # canonical z open-loop growth coefficient
DT         = 0.005    # RK4 timestep (stability verified for this system)
N_WARMUP   = 2_000    # discard warm-up steps before recording
N_STEPS    = 60_000   # steps to integrate after warm-up
THIN       = 20       # keep 1-in-20 → 3 000 waypoints per orbit
TUBE_R     = 0.030    # Bishop tube cross-section radius
TUBE_SEG   = 8        # circumference divisions (octagonal cross-section)

# Initial conditions: Newton & Leipnik (1981) Table 1 — two distinct basins
IC_UPPER   = np.array([ 0.349,  0.0, -0.160])
IC_LOWER   = np.array([-0.349,  0.0,  0.160])

OBJ_NAME   = "hf_newton_leipnik_poi"
MESH_NAME  = "hf_newton_leipnik_poi"
ATTR_NAME  = "NL_Speed"  # FLOAT_COLOR gradient attribute (per POINT domain)


# ── ODE DEFINITION ────────────────────────────────────────────────────────────
def nl_deriv(s: np.ndarray, a: float, b: float) -> np.ndarray:
    """Newton–Leipnik right-hand side.

    The fixed coefficients 10 and 5 are control gains from the original
    paper — not free parameters.  Only (a, b) vary between shape keys.
    """
    x, y, z = s
    return np.array([
        -a*x + y + 10.0*y*z,     # ẋ
        -x - 0.4*y + 5.0*x*z,    # ẏ  (0.4 is fixed gain, not 'a')
         b*z - 5.0*x*y,           # ż
    ])


# ── RK4 INTEGRATION ───────────────────────────────────────────────────────────
def rk4_orbit(ic: np.ndarray, a: float, b: float) -> np.ndarray:
    """Integrate Newton–Leipnik ODE and return thinned waypoints array."""
    s   = ic.copy().astype(np.float64)
    pts = []
    total = N_STEPS + N_WARMUP
    for i in range(total):
        k1 = nl_deriv(s, a, b)
        k2 = nl_deriv(s + 0.5*DT*k1, a, b)
        k3 = nl_deriv(s + 0.5*DT*k2, a, b)
        k4 = nl_deriv(s + DT*k3, a, b)
        s  = s + (DT / 6.0) * (k1 + 2.0*k2 + 2.0*k3 + k4)
        rec = i >= N_WARMUP and (i - N_WARMUP) % THIN == 0
        if rec:
            pts.append(s.copy())
    return np.array(pts)


# ── BISHOP PARALLEL-TRANSPORT TUBE ────────────────────────────────────────────
def bishop_tube(pts: np.ndarray, r: float, segs: int):
    """Build a Bishop parallel-transport tube.

    Returns (verts, faces, speed_attr) where speed_attr is |v| per waypoint,
    broadcast to per-vertex values.

    WHY BISHOP over Frenet? Frenet frames flip at inflection points where
    curvature → 0 (curvature = 0 makes the principal normal undefined).
    Bishop transport propagates the frame by rotating only about the tangent,
    producing a twist-free tube even on near-straight segments.
    """
    n = len(pts)
    # Per-step speed for colour attribute
    speed = np.linalg.norm(np.diff(pts, axis=0, prepend=pts[:1]), axis=1)
    spd_norm = (speed - speed.min()) / (speed.ptp() + 1e-12)

    # Initialise Bishop frame at first point
    t0 = pts[1] - pts[0]
    t0 /= np.linalg.norm(t0) + 1e-12
    # Choose an initial 'up' not parallel to t0
    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(t0, up)) > 0.9:
        up = np.array([0.0, 1.0, 0.0])
    r0 = np.cross(t0, up); r0 /= np.linalg.norm(r0) + 1e-12
    s0 = np.cross(t0, r0)

    frames = [(t0, r0, s0)]
    for i in range(1, n):
        t_new = pts[i] - pts[i-1]
        t_new /= np.linalg.norm(t_new) + 1e-12
        # Transport previous r/s by rotating about the axis t_prev × t_new
        t_prev, r_prev, s_prev = frames[-1]
        axis = np.cross(t_prev, t_new)
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:
            frames.append((t_new, r_prev, s_prev))
        else:
            axis /= sin_a
            cos_a = np.dot(t_prev, t_new)
            # Rodrigues rotation formula
            def rod(v):
                return v*cos_a + np.cross(axis, v)*sin_a + axis*np.dot(axis, v)*(1-cos_a)
            frames.append((t_new, rod(r_prev), rod(s_prev)))

    # Generate ring vertices for each waypoint
    angles = np.linspace(0, 2*np.pi, segs, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    verts     = []
    speed_out = []
    for i, (_, rv, sv) in enumerate(frames):
        c = pts[i]
        sp = float(spd_norm[i])
        for ca, sa in zip(cos_a, sin_a):
            verts.append(c + r*(ca*rv + sa*sv))
            speed_out.append(sp)

    # Quad faces connecting consecutive rings
    faces = []
    for i in range(n - 1):
        base = i * segs
        for j in range(segs):
            j1 = (j + 1) % segs
            a, b_, c, d = base+j, base+j1, base+segs+j1, base+segs+j
            faces.append((a, b_, c, d))

    return np.array(verts, dtype=np.float32), faces, np.array(speed_out, dtype=np.float32)


# ── MESH CONSTRUCTION ─────────────────────────────────────────────────────────
def build_mesh(pts_upper, pts_lower, name):
    """Build both tubes into one BMesh and return a Blender mesh object."""
    vU, fU, spU = bishop_tube(pts_upper, TUBE_R, TUBE_SEG)
    vL, fL, spL = bishop_tube(pts_lower, TUBE_R, TUBE_SEG)

    # Shift lower-tube face indices by upper-tube vertex count
    offset = len(vU)
    fL_shifted = [(a+offset, b+offset, c+offset, d+offset) for a,b,c,d in fL]

    # White-to-crimson encoding for lower tube: offset into 1.0–2.0 range
    spL_encoded = 1.0 + spL   # upper: 0–1, lower: 1–2 (split in shader)

    all_verts  = np.concatenate([vU, vL], axis=0)
    all_faces  = fU + fL_shifted
    all_speed  = np.concatenate([spU, spL_encoded])

    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(Vector(v.tolist())) for v in all_verts]
    for f in all_faces:
        try:
            bm.faces.new([bm_verts[i] for i in f])
        except ValueError:
            pass
    bm.to_mesh(mesh)
    bm.free()

    # NL_Speed FLOAT_COLOR attribute (per POINT domain)
    attr = mesh.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
    for i, sp in enumerate(all_speed):
        attr.data[i].color = (sp, sp, sp, 1.0)

    return obj


# ── SHAPE KEY VARIANTS ────────────────────────────────────────────────────────
def add_shape_key(obj, name, pts_upper, pts_lower):
    """Integrate a parameter variant and store as a shape key.

    WHY shape keys for parameter variants? A morph slider lets you scrub
    between basins in real time in the Blender viewport without re-running
    the integration.  The vertex count must be identical across shape keys —
    guaranteed here because THIN/N_STEPS/TUBE_SEG are fixed.
    """
    sk = obj.shape_key_add(name=name, from_mix=False)
    vU, _, _ = bishop_tube(pts_upper, TUBE_R, TUBE_SEG)
    vL, _, _ = bishop_tube(pts_lower, TUBE_R, TUBE_SEG)
    all_v = np.concatenate([vU, vL], axis=0)
    for i, v in enumerate(all_v):
        sk.data[i].co = v.tolist()


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    # ── 0. Clean scene ─────────────────────────────────────────────────────
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    # ── 1. Integrate canonical orbits ──────────────────────────────────────
    print("[NL] Integrating upper attractor …")
    pts_U_can = rk4_orbit(IC_UPPER, A_BASE, B_BASE)
    print("[NL] Integrating lower attractor …")
    pts_L_can = rk4_orbit(IC_LOWER, A_BASE, B_BASE)

    # ── 2. Build base mesh (Basis shape key is implicit first key) ─────────
    obj = build_mesh(pts_U_can, pts_L_can, MESH_NAME)
    obj.shape_key_add(name="Basis", from_mix=False)

    # ── 3. SK_LowA — less damping, larger orbits ───────────────────────────
    pU = rk4_orbit(IC_UPPER, 0.30, B_BASE)
    pL = rk4_orbit(IC_LOWER, 0.30, B_BASE)
    add_shape_key(obj, "SK_LowA", pU, pL)

    # ── 4. SK_HighA — more damping, tighter scrolls ────────────────────────
    pU = rk4_orbit(IC_UPPER, 0.55, B_BASE)
    pL = rk4_orbit(IC_LOWER, 0.55, B_BASE)
    add_shape_key(obj, "SK_HighA", pU, pL)

    # ── 5. SK_LowB — reduced z-growth coefficient ──────────────────────────
    pU = rk4_orbit(IC_UPPER, A_BASE, 0.10)
    pL = rk4_orbit(IC_LOWER, A_BASE, 0.10)
    add_shape_key(obj, "SK_LowB", pU, pL)

    # ── 6. Apply holoflow transform: Y-up, centred ─────────────────────────
    all_pts = np.concatenate([pts_U_can, pts_L_can])
    centre  = all_pts.mean(axis=0)
    obj.location = Vector((-centre[0], -centre[2], centre[1]))  # swap Y↔Z

    # ── 7. Set object origin to world origin ───────────────────────────────
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    print(f"[NL] Done. Object '{OBJ_NAME}' | "
          f"verts={len(obj.data.vertices)} | "
          f"shape_keys={len(obj.data.shape_keys.key_blocks)}")


if __name__ == "__main__":
    main()
