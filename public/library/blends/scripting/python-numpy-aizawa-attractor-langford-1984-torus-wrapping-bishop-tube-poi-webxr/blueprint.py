"""
Aizawa / Langford Torus-Wrapping Strange Attractor — Bishop Tube Poi for WebXR
===============================================================================
Technique: RK4 integration of the Aizawa ODE system, Bishop parallel-transport
frame through 3 000 thinned waypoints, extruded circular tube with Aizawa_Z
FLOAT_COLOR attribute, four shape-key parameter families.

Physical origin (Langford 1984):
  The equations model torus-doubling bifurcations in a slow-fast planar system
  augmented by a cubic z-oscillator.  The (x,y) subsystem is a damped rotation
  whose gain/loss is governed by (z-b): when z>b the radius grows; when z<b it
  contracts.  The z-equation is a cubic oscillator driven by the radius r²=x²+y²
  and a weak skew term f·x·z.  Together they trap the orbit on a chaotic torus-like
  manifold that winds without closing — every lap is slightly displaced.

Reference:
  Langford WF (1984) "Numerical studies of torus bifurcations" in Küpper T, Mittelmann
  HD & Weber H (eds) Numerical Methods for Bifurcation Problems, ISNM vol 70,
  Birkhäuser Basel, pp 285–295.  DOI:10.1007/978-3-0348-6256-1_18.
  Mathematical equations: public domain (mathematical fact, not copyrightable).

Licence: CC0 — release all rights.
Blender: 5.1  |  Python: 3.11+  |  numpy required (bundled with Blender)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── parameters ──────────────────────────────────────────────────────────────
# Canonical Langford 1984 parameters
A   = 0.95   # z-linear gain in ż
B   = 0.70   # saddle threshold in (x,y) gain: z>B → grow, z<B → shrink
C   = 0.60   # z-offset (additive constant in ż)
D   = 3.50   # rotation rate in (x,y) plane
E   = 0.25   # radial–z coupling in ż (r² term coefficient)
F   = 0.10   # skew coupling f·x·z in ż (breaks full rotational symmetry)

DT      = 0.01        # RK4 step — well within stability for this system
N_TOTAL = 120_000     # total integration steps
THIN    = 40          # keep 1 in THIN → 3 000 waypoints
BURN_IN = 2_000       # discard transient before recording

TUBE_R    = 0.040     # tube cross-section radius (m)
TUBE_SIDES = 8        # polygons around tube circumference
POI_R     = 0.090     # poi-head bounding sphere radius (m)

OBJ_NAME  = "hf_aizawa_poi"
IC        = np.array([0.1, 0.0, 0.5])   # initial condition (near saddle P₁)

# ─── ODE ─────────────────────────────────────────────────────────────────────
def _f(s: np.ndarray, a=A, b=B, c=C, d=D, e=E, f=F) -> np.ndarray:
    """Aizawa vector field.
    ẋ = (z-b)x - d·y     — rotation + radial gain/loss
    ẏ = d·x + (z-b)y     — same gain/loss, 90° phase shifted
    ż = c + a·z - z³/3 - (x²+y²)(1+e·z) + f·x·z
    Divergence: 2(z-b) + a - z² - e(x²+y²) + f·x  (position-dependent)
    """
    x, y, z = s
    r2 = x*x + y*y
    zb = z - b
    dx = zb*x - d*y
    dy = d*x + zb*y
    dz = c + a*z - z*z*z/3.0 - r2*(1.0 + e*z) + f*x*z
    return np.array([dx, dy, dz])


def _rk4(s: np.ndarray, dt: float, **kw) -> np.ndarray:
    k1 = _f(s, **kw)
    k2 = _f(s + 0.5*dt*k1, **kw)
    k3 = _f(s + 0.5*dt*k2, **kw)
    k4 = _f(s + dt*k3, **kw)
    return s + (dt/6.0)*(k1 + 2*k2 + 2*k3 + k4)


def integrate(a=A, b=B, c=C, d=D, e=E, f=F) -> np.ndarray:
    """Return (N_WP, 3) array of thinned waypoints."""
    s = IC.copy()
    # burn-in: discard transient
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a=a, b=b, c=c, d=d, e=e, f=f)
    pts = []
    for i in range(N_TOTAL):
        s = _rk4(s, DT, a=a, b=b, c=c, d=d, e=e, f=f)
        if i % THIN == 0:
            pts.append(s.copy())
    return np.array(pts)   # (3000, 3)

# ─── Bishop parallel-transport frame ─────────────────────────────────────────
def bishop_frame(pts: np.ndarray):
    """Return per-point normal N and binormal B arrays using Bishop transport.
    Bishop (1975): propagate the normal by the minimal rotation that keeps it
    perpendicular to the tangent — no twist accumulation along smooth curves.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-14, 1e-14, norms)
    T = T / norms                          # unit tangents (n-1,3)

    # seed N₀ perpendicular to T₀
    t0 = T[0]
    ref = np.array([0.0, 1.0, 0.0]) if abs(t0[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N0 = np.cross(t0, ref)
    N0 /= np.linalg.norm(N0)

    N = np.empty((n-1, 3))
    N[0] = N0
    for i in range(1, n-1):
        axis = np.cross(T[i-1], T[i])
        s_len = np.linalg.norm(axis)
        if s_len < 1e-10:
            N[i] = N[i-1]
        else:
            axis /= s_len
            cos_a = np.dot(T[i-1], T[i])
            sin_a = s_len
            # Rodrigues rotation formula
            N[i] = (cos_a * N[i-1]
                    + sin_a * np.cross(axis, N[i-1])
                    + (1 - cos_a) * np.dot(axis, N[i-1]) * axis)
            N[i] /= np.linalg.norm(N[i])

    Bvec = np.cross(T, N)   # (n-1, 3) binormals
    return T, N, Bvec

# ─── build tube mesh ─────────────────────────────────────────────────────────
def build_tube(pts: np.ndarray, T, N, Bvec):
    """Extrude tube: TUBE_SIDES vertices per waypoint, quad faces."""
    n_wp  = len(pts) - 1   # drop last (no frame for it)
    angles = np.linspace(0, 2*np.pi, TUBE_SIDES, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)

    verts = []
    for i in range(n_wp):
        ring = (pts[i]
                + TUBE_R * (cos_a[:, None] * N[i] + sin_a[:, None] * Bvec[i]))
        verts.extend(ring.tolist())

    faces = []
    for i in range(n_wp - 1):
        r0 = i * TUBE_SIDES
        r1 = r0 + TUBE_SIDES
        for j in range(TUBE_SIDES):
            j1 = (j + 1) % TUBE_SIDES
            faces.append((r0+j, r0+j1, r1+j1, r1+j))
    return verts, faces

# ─── colour attribute ─────────────────────────────────────────────────────────
def colour_attr(mesh, pts):
    """Aizawa_Z: map z-height of each waypoint → cobalt (low-z) to amber (high-z).
    POINT domain: one colour per vertex ring = TUBE_SIDES repetitions.
    """
    n_wp = len(pts) - 1
    z_vals = pts[:n_wp, 2]
    lo, hi = z_vals.min(), z_vals.max()
    t = np.clip((z_vals - lo) / max(hi - lo, 1e-9), 0.0, 1.0)

    COBALT = np.array([0.02, 0.10, 0.55, 1.0])
    AMBER  = np.array([0.95, 0.60, 0.00, 1.0])
    colours = (1-t)[:, None]*COBALT + t[:, None]*AMBER   # (n_wp, 4)

    attr = mesh.color_attributes.new("Aizawa_Z", "FLOAT_COLOR", "POINT")
    flat = np.repeat(colours, TUBE_SIDES, axis=0).ravel()
    attr.data.foreach_set("color", flat)

# ─── shape key helper ─────────────────────────────────────────────────────────
def add_shape_key(obj, key_name: str, pts_new: np.ndarray, T, N, Bvec):
    n_wp = len(pts_new) - 1
    verts, _ = build_tube(pts_new, T, N, Bvec)
    sk = obj.shape_key_add(name=key_name, from_mix=False)
    for i, co in enumerate(verts):
        sk.data[i].co = Vector(co)

# ─── main ────────────────────────────────────────────────────────────────────
def main():
    # clean scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # ── Basis (canonical Langford 1984 parameters) ──
    pts = integrate()
    T, N, Bvec = bishop_frame(pts)
    verts, faces = build_tube(pts, T, N, Bvec)

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts, [], faces)
    me.validate()
    colour_attr(me, pts)

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Basis shape key (required before adding variants)
    obj.shape_key_add(name="Basis", from_mix=False)

    # ── SK_HighD: d=5.5, faster rotation — denser toroidal winding ──
    pts_d = integrate(d=5.5)
    T_d, N_d, B_d = bishop_frame(pts_d)
    n = min(len(pts)-1, len(pts_d)-1)
    add_shape_key(obj, "SK_HighD", pts_d[:n+1], T_d[:n], N_d[:n], B_d[:n])

    # ── SK_NoEF: e=0, f=0 — remove radial z-coupling; changes basin shape ──
    pts_nef = integrate(e=0.0, f=0.0)
    T_nef, N_nef, B_nef = bishop_frame(pts_nef)
    add_shape_key(obj, "SK_NoEF", pts_nef[:n+1], T_nef[:n], N_nef[:n], B_nef[:n])

    # ── SK_LowB: b=0.45 — lowers the radial saddle threshold; wider orbit ──
    pts_lb = integrate(b=0.45)
    T_lb, N_lb, B_lb = bishop_frame(pts_lb)
    add_shape_key(obj, "SK_LowB", pts_lb[:n+1], T_lb[:n], N_lb[:n], B_lb[:n])

    # ── material: emission driven by Aizawa_Z vertex colour ──
    mat = bpy.data.materials.new(OBJ_NAME + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    vcol = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "Aizawa_Z"
    emit.inputs["Strength"].default_value = 1.8
    nt.links.new(vcol.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)

    # ── holoflow export metadata ──
    obj["holoflow:facet"]       = False
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:export_name"] = OBJ_NAME

    # ── apply +Y-up transform for WebXR export ──
    import mathutils
    obj.rotation_euler[0] = 1.5707963   # π/2 rad = 90°
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # ── fit to poi-head bounding sphere ──
    me.update()
    max_r = max(Vector(v.co).length for v in me.vertices)
    if max_r > 1e-6:
        obj.scale = (POI_R / max_r,) * 3
        bpy.ops.object.transform_apply(scale=True)

    print(f"[Aizawa] Done — {len(me.vertices)} vertices, {len(me.polygons)} quads")
    print(f"[Aizawa] Waypoints: {len(pts)-1}  Tube sides: {TUBE_SIDES}")


if __name__ == "__main__":
    main()
