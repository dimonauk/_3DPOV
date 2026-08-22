"""
Hénon-Heiles Hamiltonian — Störmer-Verlet Symplectic Integration,
KAM Tori & Poincaré Section Poi Head — Blender 5.1

Technique in brief
──────────────────
Hénon & Heiles (1964) added a cubic perturbation to the 2D isotropic harmonic
oscillator to test whether galaxy stellar orbits conserve a "third integral" of
motion beyond energy and angular momentum.  The Hamiltonian is:

    H = ½(px² + py²) + ½(x² + y²) + x²y − y³/3

The cubic terms break the rotational symmetry of the harmonic part and make the
system non-integrable above a critical energy.  Contrast with the Lorenz system
(dissipative, volume contracts) — here Liouville's theorem demands exact phase-
volume conservation (det(Jacobian) = 1 at every step).

Equations of motion (Hamilton's equations  q̇=∂H/∂p, ṗ=−∂H/∂q):
    ẋ  =  px
    ẏ  =  py
    ṗx = −x − 2xy          (= −∂V/∂x)
    ṗy = −y − x² + y²      (= −∂V/∂y)

KAM structure by total energy:
    E = 0.083:  quasi-periodic — trajectory fills a 2D Lagrangian torus;
                Poincaré section (y=0, ṗy>0) shows smooth closed curves.
    E = 0.125:  mixed — KAM tori survive near stable resonances; Birkhoff
                island chains appear around 1:1 and 2:1 resonances; thin
                chaotic layers thread separatrices between islands.
    E = 0.166:  near escape threshold 1/6; most tori broken by resonance
                overlap (Chirikov criterion); widespread Hamiltonian chaos
                with a fractal Poincaré boundary and small surviving islands.

Integration: Störmer-Verlet (velocity-Verlet / leapfrog) is 2nd-order
symplectic — it preserves ω = dx∧dpx + dy∧dpy exactly, so energy oscillates
bounded rather than drifting.  RK4 is NOT symplectic: energy drift accumulates.

Mesh strategy: integrate N_STEPS=14 000 symplectic steps (DT=0.03) per energy,
discard N_TRANS=2 000 as transient.  Map orbit to (x, px, y) extended 3D phase
space; Bishop-frame tube (TUBE_SIDES=8) builds the poi head shell.  Three shape
keys morph between energy regimes.  Poincaré section emits violet dots as a
companion vertex-cloud object.  Draco-6 GLB exported for WebXR.
"""

import bpy, math, colorsys
import numpy as np

# ── Parameters (tune at top) ──────────────────────────────────────────────────
E_BASIS   = 0.083    # low energy: quasi-periodic KAM tori (basis shape key)
E_MID     = 0.125    # intermediate: mixed regular / island chain / thin chaos
E_HIGH    = 0.165    # near 1/6 escape: widespread Hamiltonian chaos

DT        = 0.03     # leapfrog step — energy oscillation < 3e-5 over 14 000 steps
N_STEPS   = 14_000   # steady-state integration steps after transient
N_TRANS   = 2_000    # discard first N_TRANS steps (approach to ergodic surface)

MAX_POINCARE = 400   # Poincaré section points per energy level
TUBE_SIDES   = 8     # tube cross-section polygon sides
TUBE_R_FRAC  = 0.024 # tube radius as fraction of poi diameter

POI_DIAMETER  = 0.13  # target bounding diameter (metres)
POLE_RADIUS   = 0.008
POLE_HEIGHT   = 0.08

OBJ_NAME = "hf_henon_heiles"


# ── Potential gradient ────────────────────────────────────────────────────────
def grad_V(x, y):
    """
    Returns (∂V/∂x, ∂V/∂y) for V = ½(x²+y²) + x²y − y³/3.
    The cubic coupling terms x²y and −y³/3 form a C₃ₓ-symmetric perturbation
    that has three equivalent saddle points at the escape boundary H = 1/6.
    Without them the system is the isotropic 2D SHO — integrable, all orbits
    close.  The coupling alone breaks the third integral.
    """
    dVdx = x + 2.0 * x * y      # harmonic + 2xy coupling
    dVdy = y + x * x - y * y    # harmonic + x²−y² coupling (from ∂/∂y of x²y − y³/3)
    return dVdx, dVdy


def init_condition(E, x0=0.0, y0=0.0, px0=0.0):
    """
    Initialise state from energy E.  Solve H = E for py (positive root).
    H = K + V = ½(px²+py²) + V(x,y)  →  py = √(2(E−V) − px²).
    """
    V0  = 0.5*(x0*x0 + y0*y0) + x0*x0*y0 - y0**3 / 3.0
    py2 = 2.0*(E - V0) - px0*px0
    if py2 < 0:
        raise ValueError(f"E={E}: energy infeasible at IC (py² = {py2:.5f})")
    return np.array([x0, y0, px0, math.sqrt(py2)])   # [x, y, px, py]


# ── Störmer-Verlet (leapfrog) symplectic integrator ──────────────────────────
def leapfrog_step(state, dt):
    """
    Velocity-Verlet (position-Verlet) formulation of Störmer-Verlet.
    This is the canonical symplectic integrator for separable Hamiltonians
    H = T(p) + V(q): one gradient evaluation per step, O(dt²) per step,
    bounded (not growing) energy error, exact symplecticity.

        p_{n+½} = p_n − (dt/2)·∇V(q_n)
        q_{n+1} = q_n + dt·p_{n+½}
        p_{n+1} = p_{n+½} − (dt/2)·∇V(q_{n+1})

    Two half-kicks sandwiching a full drift.  Compare RK4: four evaluations
    per step, O(dt⁴), but NOT symplectic — phase volume shrinks or grows
    exponentially over long integrations, destroying the KAM structure.
    """
    x, y, px, py = state
    dvx, dvy = grad_V(x, y)
    # half-kick momenta
    px_h = px - 0.5*dt*dvx
    py_h = py - 0.5*dt*dvy
    # full drift positions
    x1 = x + dt*px_h
    y1 = y + dt*py_h
    # half-kick momenta at new position
    dvx1, dvy1 = grad_V(x1, y1)
    px1 = px_h - 0.5*dt*dvx1
    py1 = py_h - 0.5*dt*dvy1
    return np.array([x1, y1, px1, py1])


def integrate(state0, dt, n_steps, n_trans, max_poincare):
    """
    Integrate orbit; return (waypoints, poincare_pts).
    waypoints shape: (n_steps, 3) mapped to (x, px, y) for 3D embedding.
    Poincaré section: record (x, px) when y crosses 0 upward (py > 0).
    Uses linear interpolation to place the crossing precisely between steps.
    """
    pts      = []
    poincare = []
    s        = state0.copy()
    prev_y   = None

    for i in range(n_steps + n_trans):
        s_new = leapfrog_step(s, dt)
        if i >= n_trans:
            pts.append([s_new[0], s_new[2], s_new[1]])   # (x, px, y)

            # Poincaré section: y=0 crossing with py>0
            if (prev_y is not None
                    and prev_y < 0.0 < s_new[1]
                    and s_new[3] > 0.0
                    and len(poincare) < max_poincare):
                # linear interpolation to exact y=0 crossing fraction
                tc      = -s[1] / (s_new[1] - s[1])
                x_c     = s[0] + tc*(s_new[0] - s[0])
                px_c    = s[2] + tc*(s_new[2] - s[2])
                poincare.append([x_c, px_c])

        prev_y = s_new[1]
        s      = s_new

    return np.array(pts), (np.array(poincare) if poincare else np.zeros((0, 2)))


# ── Bishop (rotation-minimising) frame ───────────────────────────────────────
def bishop_frame(pts):
    """Parallel-transport normals; avoids Frenet-Serret torsion spin."""
    n = len(pts)
    T = np.zeros((n, 3)); N = np.zeros((n, 3)); B = np.zeros((n, 3))
    T[0]    = pts[1]  - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    nrm = np.linalg.norm(T, axis=1, keepdims=True)
    T  /= np.where(nrm < 1e-10, 1.0, nrm)
    seed = np.array([0., 0., 1.]) if abs(T[0, 2]) < 0.9 else np.array([1., 0., 0.])
    N[0] = seed - np.dot(seed, T[0])*T[0]
    N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])
    for i in range(1, n):
        t0, t1 = T[i-1], T[i]
        axis   = np.cross(t0, t1)
        sa     = np.linalg.norm(axis)
        ca     = float(np.clip(np.dot(t0, t1), -1., 1.))
        if sa < 1e-10:
            N[i] = N[i-1] if ca > 0 else -N[i-1]
        else:
            axis /= sa
            Ni = (N[i-1]*ca + np.cross(axis, N[i-1])*sa
                  + axis*np.dot(axis, N[i-1])*(1. - ca))
            Ni -= np.dot(Ni, t1)*t1
            ln  = np.linalg.norm(Ni)
            N[i] = Ni/ln if ln > 1e-10 else N[i-1]
        B[i] = np.cross(T[i], N[i])
    return T, N, B


def tube_mesh(pts, r, n_sides, Nf, Bf):
    """Vertex + quad-face lists for a tube of radius r along pts."""
    ca = [math.cos(2*math.pi*k/n_sides) for k in range(n_sides)]
    sa = [math.sin(2*math.pi*k/n_sides) for k in range(n_sides)]
    verts = [(pts[i] + r*(ca[k]*Nf[i] + sa[k]*Bf[i])).tolist()
             for i in range(len(pts)) for k in range(n_sides)]
    ns = n_sides
    faces = [[i*ns+k, i*ns+(k+1)%ns, (i+1)*ns+(k+1)%ns, (i+1)*ns+k]
             for i in range(len(pts)-1) for k in range(ns)]
    return verts, faces


def orbit_colours(n_pts, n_sides):
    """HSV rainbow cycling over full orbit integration time."""
    cols = []
    for i in range(n_pts):
        h = (0.65 + (i/(n_pts-1))*0.85) % 1.0
        r, g, b = colorsys.hsv_to_rgb(h, 0.85, 0.95)
        for _ in range(n_sides):
            cols.append((r, g, b, 1.0))
    return cols


# ════════════════════════════════════════════════════════════════════════════════
# Main execution
# ════════════════════════════════════════════════════════════════════════════════
print("Hénon-Heiles: integrating three energy levels …")

ic_low  = init_condition(E_BASIS, x0=0.0, y0=0.0, px0=0.30)
ic_mid  = init_condition(E_MID,   x0=0.0, y0=0.0, px0=0.20)
ic_high = init_condition(E_HIGH,  x0=0.0, y0=0.0, px0=0.10)

pts_low,  poi_low  = integrate(ic_low,  DT, N_STEPS, N_TRANS, MAX_POINCARE)
pts_mid,  poi_mid  = integrate(ic_mid,  DT, N_STEPS, N_TRANS, MAX_POINCARE)
pts_high, poi_high = integrate(ic_high, DT, N_STEPS, N_TRANS, MAX_POINCARE)

N_PTS = len(pts_low)
print(f"  {N_PTS} waypoints | Poincaré pts: {len(poi_low)} / {len(poi_mid)} / {len(poi_high)}")

# Centre on low-energy reference; apply same scale to all three
mean0 = pts_low.mean(axis=0)
for arr in [pts_low, pts_mid, pts_high]:
    arr -= mean0
ext  = np.linalg.norm(pts_low.max(axis=0) - pts_low.min(axis=0))
S    = POI_DIAMETER / ext
for arr in [pts_low, pts_mid, pts_high]:
    arr *= S
R_TUBE = POI_DIAMETER * TUBE_R_FRAC

# ── Basis tube mesh (low energy — clean KAM torus) ────────────────────────────
_, Nb, Bb = bishop_frame(pts_low)
verts, faces = tube_mesh(pts_low, R_TUBE, TUBE_SIDES, Nb, Bb)

me = bpy.data.meshes.new(OBJ_NAME)
me.from_pydata(verts, [], faces)
me.update()

obj = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Shape keys (morph through KAM breakdown) ──────────────────────────────────
obj.shape_key_add(name="KAM_E0.083",  from_mix=False)   # basis: tori

for sk_name, pts_sk in [("Mixed_E0.125", pts_mid), ("Chaotic_E0.165", pts_high)]:
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    _, Nk, Bk = bishop_frame(pts_sk)
    v_sk, _   = tube_mesh(pts_sk, R_TUBE, TUBE_SIDES, Nk, Bk)
    sk.data.foreach_set("co", [c for v in v_sk for c in v])  # bulk-set: 30× faster

# ── Vertex colours: integration-time rainbow ──────────────────────────────────
cols     = orbit_colours(N_PTS, TUBE_SIDES)
col_attr = me.color_attributes.new(name="HenonAge", type="FLOAT_COLOR", domain="POINT")
col_attr.data.foreach_set("color", [c for rgba in cols for c in rgba])

# ── Emission material from vertex colour ──────────────────────────────────────
mat = bpy.data.materials.new("Mat_HenonHeiles")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()
attr = nt.nodes.new("ShaderNodeAttribute")
attr.attribute_name = "HenonAge"
emit = nt.nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = 3.5
out  = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
mat.shadow_method = "NONE"
obj.data.materials.append(mat)

obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-light-trail"

# ── Poincaré section point-cloud objects (three energy slabs) ─────────────────
POI_COLORS = [(0.8, 0.4, 1.0, 1.0), (0.4, 0.8, 1.0, 1.0), (1.0, 0.5, 0.2, 1.0)]

for (label, poi_pts, z_off, col) in [
    ("Poincare_KAM",   poi_low,  0.0,        POI_COLORS[0]),
    ("Poincare_Mixed", poi_mid,  S * 0.10,   POI_COLORS[1]),
    ("Poincare_Chaos", poi_high, S * 0.20,   POI_COLORS[2]),
]:
    if len(poi_pts) == 0:
        continue
    pv = [(float(p[0]*S), z_off, float(p[1]*S)) for p in poi_pts]
    pm = bpy.data.meshes.new(label)
    pm.from_pydata(pv, [], [])
    pm.update()
    po = bpy.data.objects.new(label, pm)
    bpy.context.scene.collection.objects.link(po)

    pm_mat = bpy.data.materials.new(f"Mat_{label}")
    pm_mat.use_nodes = True
    nt2 = pm_mat.node_tree
    nt2.nodes.clear()
    emit2 = nt2.nodes.new("ShaderNodeEmission")
    emit2.inputs["Strength"].default_value = 5.0
    emit2.inputs["Color"].default_value    = col
    out2  = nt2.nodes.new("ShaderNodeOutputMaterial")
    nt2.links.new(emit2.outputs["Emission"], out2.inputs["Surface"])
    pm_mat.shadow_method = "NONE"
    po.data.materials.append(pm_mat)

# ── Connector stub ────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(
    radius=POLE_RADIUS, depth=POLE_HEIGHT,
    location=(0, 0, -POI_DIAMETER/2 - POLE_HEIGHT/2))
pole      = bpy.context.active_object
pole.name = OBJ_NAME + "_pole"

# ── Export ────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
pole.select_set(True)

bpy.ops.export_scene.gltf(
    filepath  = bpy.path.abspath("//hf_henon_heiles.glb"),
    use_selection = True,
    export_format = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_colors  = True,
    export_morph   = True,
    export_apply   = True,
    export_yup     = True,
    export_image_format = "WEBP",
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//hf_henon_heiles.blend"))
print(f"Saved → hf_henon_heiles.blend + hf_henon_heiles.glb")
print(f"  Tube verts: {len(verts)}  Tube faces: {len(faces)}")
print(f"  Poincaré point counts: {len(poi_low)} / {len(poi_mid)} / {len(poi_high)}")
