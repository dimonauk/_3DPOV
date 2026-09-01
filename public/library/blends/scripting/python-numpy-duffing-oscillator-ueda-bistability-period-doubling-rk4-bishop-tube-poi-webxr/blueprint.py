"""
Duffing Oscillator — blueprint.py
Blender 5.1 · bpy + numpy · CC0

Technique: The Duffing oscillator ẍ + δẋ + αx + βx³ = γcos(ωt) is the simplest
forced nonlinear system capable of chaos. The double-well form (α<0, β>0) has
two stable equilibria at x = ±√(−α/β) separated by an unstable saddle at the
origin; as forcing amplitude γ increases the system undergoes a period-doubling
cascade ending in cross-well strange attractor. We embed the 2-D phase trajectory
(x, ẋ) in 3-D via the forcing sine z = sin(ωt), revealing the fractal laminar
sheets of the attractor as a Bishop parallel-transport tube.

Sources:
  Duffing G (1918) Erzwungene Schwingungen. Vieweg, Braunschweig. [PD]
  Ueda Y (1979) Randomly transitional phenomena. J Stat Phys 20(2):181. [eqns PD]
  Holmes P & Guckenheimer J (1983) Nonlinear Oscillations. Springer. [eqns PD]
"""

import bpy
import numpy as np
from math import pi

# ── Named constants ────────────────────────────────────────────────────────────
# Basis: Holmes–Duffing cross-well chaos
# WHY α=−1, β=1: double-well V(x)=−x²/2+x⁴/4 with minima x=±1 (separation 2)
# WHY γ=0.5, ω=1.2: Guckenheimer & Holmes canonical cross-well chaos window
# WHY δ=0.3: moderate damping; δ<0.05 → blow-up; δ>0.4 → collapses to period-1
ALPHA_B, BETA_B, DELTA_B, GAMMA_B, OMEGA_B = -1.0, 1.0, 0.3, 0.50, 1.2

# SK_Ueda: Ueda single-well Japanese attractor (α=0, no linear term)
# WHY γ=7.5: required to maintain bounded chaos without linear restoring
# WHY δ=0.05: light damping; heavy damping kills the attractor below γ≈5
ALPHA_U, BETA_U, DELTA_U, GAMMA_U, OMEGA_U = 0.0, 1.0, 0.05, 7.5, 1.0

# SK_Period2: period-2 orbit just past first bifurcation (γ≈0.29 for these params)
# The cascade runs: period-1 (γ<0.23) → period-2 (0.23<γ<0.37) → period-4 → chaos
ALPHA_P, BETA_P, DELTA_P, GAMMA_P, OMEGA_P = -1.0, 1.0, 0.3, 0.29, 1.2

# SK_Locked: period-1 lock (heavy damping, small forcing → sinusoidal single-well)
ALPHA_L, BETA_L, DELTA_L, GAMMA_L, OMEGA_L = -1.0, 1.0, 0.5, 0.10, 1.2

DT       = 0.025    # time step; T=2π/ω≈5.24 → 210 steps/period
N_WARMUP = 4_000    # transient: ≈19 forcing periods for Holmes params
N_STEPS  = 90_000   # recorded steps
SKIP     = 30       # thin → 3 000 waypoints per shape key

TUBE_R     = 0.016  # cross-section radius (m)
TUBE_SIDES = 10     # polygon sides
POI_R      = 0.082  # target bounding-sphere radius after scaling (m)
ZSCALE     = 1.0    # z-amplitude: z = ZSCALE·sin(ωt); same units as x for balance

OBJ_NAME  = "hf_duffing_poi"
MAT_NAME  = "Duffing_Mat"
ATTR_NAME = "Duffing_Phase"
COBALT    = (0.03, 0.15, 0.58)
AMBER     = (1.00, 0.65, 0.00)


# ── ODE right-hand side ────────────────────────────────────────────────────────
def _f(state, t, a, b, d, g, w):
    """Duffing ODE: state=[x,ẋ] → [ẋ, ẍ].
    WHY split to 1st-order: RK4 operates on vectors; explicit scalar ẍ avoids
    mutation of state mid-step.  Forcing cos(ωt) is evaluated at exact t each sub-step.
    """
    x, v = state
    return np.array([v, g * np.cos(w * t) - d * v - a * x - b * x**3])


# ── RK4 integrator ─────────────────────────────────────────────────────────────
def _integrate(a, b, d, g, w, ic=(1.0, 0.0)):
    """Integrate Duffing ODE; return (N_pts, 3) embedding (x, ẋ, ZSCALE·sin(ωt)).
    WHY sin(ωt) as z: bounded in [−ZSCALE, +ZSCALE] regardless of run length, so
    the 3-D structure stays compact.  Each forcing period wraps back on itself;
    the resulting sheets are the Poincaré section rendered continuously.
    WHY ic=(1.0, 0.0): start near the right-well minimum for Holmes params;
    transient burn-in discards the approach to the attractor.
    """
    s = np.array(ic, dtype=float)
    t = 0.0
    for _ in range(N_WARMUP):
        k1 = _f(s,           t,        a, b, d, g, w)
        k2 = _f(s+DT/2*k1,  t+DT/2,   a, b, d, g, w)
        k3 = _f(s+DT/2*k2,  t+DT/2,   a, b, d, g, w)
        k4 = _f(s+DT*k3,    t+DT,     a, b, d, g, w)
        s += DT/6*(k1+2*k2+2*k3+k4); t += DT
    pts = []
    for i in range(N_STEPS):
        k1 = _f(s,           t,        a, b, d, g, w)
        k2 = _f(s+DT/2*k1,  t+DT/2,   a, b, d, g, w)
        k3 = _f(s+DT/2*k2,  t+DT/2,   a, b, d, g, w)
        k4 = _f(s+DT*k3,    t+DT,     a, b, d, g, w)
        s += DT/6*(k1+2*k2+2*k3+k4); t += DT
        if i % SKIP == 0:
            pts.append([s[0], s[1], ZSCALE * np.sin(w * t)])
    return np.array(pts)


# ── Bishop parallel-transport tube ────────────────────────────────────────────
def _bishop_tube(pts):
    """Build a closed-cross-section tube around a 3-D polyline using Bishop frames.
    Returns (verts_list, quad_faces_list) ready for bpy.data.meshes.from_pydata.
    WHY Bishop over Frenet: Frenet frames flip 180° at inflection points (κ→0),
    tearing the tube; Bishop accumulates rotation only from torsion, giving smooth
    tubes along chaotic trajectories which have many near-zero curvature points.
    """
    N = len(pts)
    T = np.zeros((N, 3))
    T[:-1] = pts[1:] - pts[:-1]; T[-1] = T[-2]
    nrm = np.linalg.norm(T, axis=1, keepdims=True)
    nrm[nrm < 1e-12] = 1.0; T /= nrm

    # initial normal: pick axis most perpendicular to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], ref)) > 0.99: ref = np.array([0.0, 1.0, 0.0])
    N0 = ref - np.dot(ref, T[0])*T[0]; N0 /= np.linalg.norm(N0)

    normals = np.zeros((N, 3)); normals[0] = N0
    for i in range(1, N):
        ax = np.cross(T[i-1], T[i]); s = np.linalg.norm(ax)
        if s < 1e-12: normals[i] = normals[i-1]; continue
        ax /= s; c = np.dot(T[i-1], T[i])
        n = normals[i-1]
        normals[i] = c*n + s*np.cross(ax, n) + (1-c)*np.dot(ax, n)*ax

    # holonomy correction: remove net rotation of frame over full path
    tw = np.arctan2(np.dot(np.cross(normals[-1], normals[0]), T[-1]),
                    np.dot(normals[-1], normals[0]))
    dth = np.linspace(0, tw, N)
    for i in range(N):
        c, s2 = np.cos(dth[i]), np.sin(dth[i]); b = np.cross(T[i], normals[i])
        normals[i] = c*normals[i] + s2*b

    ring = np.linspace(0, 2*pi, TUBE_SIDES, endpoint=False)
    verts = []
    for i in range(N):
        b = np.cross(T[i], normals[i])
        for a in ring:
            verts.append((pts[i] + TUBE_R*(np.cos(a)*normals[i]+np.sin(a)*b)).tolist())

    faces = []
    for i in range(N-1):
        r0, r1 = i*TUBE_SIDES, (i+1)*TUBE_SIDES
        for j in range(TUBE_SIDES):
            jn = (j+1) % TUBE_SIDES
            faces.append([r0+j, r0+jn, r1+jn, r1+j])
    return verts, faces


# ── Build scene ────────────────────────────────────────────────────────────────
def _build():
    pts_b = _integrate(ALPHA_B, BETA_B, DELTA_B, GAMMA_B, OMEGA_B)
    pts_u = _integrate(ALPHA_U, BETA_U, DELTA_U, GAMMA_U, OMEGA_U, ic=(0.0, 0.0))
    pts_p = _integrate(ALPHA_P, BETA_P, DELTA_P, GAMMA_P, OMEGA_P)
    pts_l = _integrate(ALPHA_L, BETA_L, DELTA_L, GAMMA_L, OMEGA_L)

    # normalise Basis to POI_R sphere; apply same scale to SK keys for comparability
    ctr = pts_b.mean(axis=0); pts_b -= ctr
    scale = POI_R / np.linalg.norm(pts_b, axis=1).max()
    pts_b *= scale
    for arr in (pts_u, pts_p, pts_l):
        arr -= arr.mean(axis=0); arr *= scale

    verts, faces = _bishop_tube(pts_b)
    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts, [], faces); me.update()
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)

    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "duffing-oscillator"

    # colour: normalised x position → left-well=cobalt, right-well=amber
    L = len(pts_b)
    x_vals = pts_b[:, 0]
    x_lo, x_hi = x_vals.min(), x_vals.max()
    x_norm = (x_vals - x_lo) / max(x_hi - x_lo, 1e-10)
    col_attr = me.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
    flat = []
    for t_v in x_norm:
        for _ in range(TUBE_SIDES):
            flat += [COBALT[0]+t_v*(AMBER[0]-COBALT[0]),
                     COBALT[1]+t_v*(AMBER[1]-COBALT[1]),
                     COBALT[2]+t_v*(AMBER[2]-COBALT[2]), 1.0]
    col_attr.data.foreach_set("color", flat)

    obj.shape_key_add(name="Basis", from_mix=False)

    def _sk(name, arr):
        sk = obj.shape_key_add(name=name, from_mix=False)
        tv, _ = _bishop_tube(arr)
        sk.data.foreach_set("co", [c for v in tv for c in v])

    _sk("SK_Ueda",    pts_u)   # Ueda single-well chaos (large γ, weak δ)
    _sk("SK_Period2", pts_p)   # period-doubled orbit: two loops per forcing period
    _sk("SK_Locked",  pts_l)   # period-1 sinusoidal lock (strong damping, small γ)

    mat = bpy.data.materials.new(MAT_NAME); mat.use_nodes = True
    nt = mat.node_tree
    for nd in list(nt.nodes): nt.nodes.remove(nd)
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME; attr.attribute_type = 'GEOMETRY'
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 2.0
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)
    print(f"[Duffing] {len(verts)}V {len(faces)}Q — done.")


_build()
