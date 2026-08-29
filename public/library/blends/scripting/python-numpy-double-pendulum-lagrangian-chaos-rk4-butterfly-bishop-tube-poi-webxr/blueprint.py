"""
Double Pendulum — Lagrangian Chaos, RK4, Bishop Parallel-Transport Tube
========================================================================
Blender 5.1 · Python + NumPy · Holoflow Studio

WHY THIS MATTERS FOR BLENDER ARTISTS
--------------------------------------
The double pendulum is the canonical introduction to deterministic chaos: two
coupled rigid rods that behave predictably at small angles and become
structurally unpredictable at large ones. Two trajectories separated by one
millimetre diverge exponentially with Lyapunov exponent λ₁ ≈ +7 s⁻¹ in the
chaotic regime — within three seconds they share nothing. Understanding that
boundary (the KAM tori) is understanding why Blender's physics cache is
sensitive to step size at high velocities.

The butterfly-shaped tip path is used here as a poi-head geometry: a Bishop
parallel-transport tube wound around the lower-bob trajectory, coloured by
instantaneous kinetic energy. Three shape keys sample qualitatively different
dynamical regimes.

PHYSICS
-------
Lagrangian L = T − V, generalised coordinates (θ₁, θ₂):

  T = ½(m₁+m₂)L₁²ω₁² + ½m₂L₂²ω₂² + m₂L₁L₂ω₁ω₂cos(θ₁−θ₂)
  V = −(m₁+m₂)gL₁cosθ₁ − m₂gL₂cosθ₂

Euler–Lagrange gives the 2×2 linear system each step:

  M(θ)·[α₁, α₂]ᵀ = F(θ,ω)

  M = [[(m₁+m₂)L₁,  m₂L₂cos(Δ)],
       [L₁cos(Δ),    L₂         ]]          (Δ = θ₁−θ₂)

  F = [ m₂L₂ω₂²sin(Δ) − (m₁+m₂)g sinθ₁,
        L₁ω₁²sin(Δ)   − g sinθ₂          ]

SOURCES
-------
Lagrange J-L (1788) Mécanique Analytique, Public Domain
  https://archive.org/details/mcaniqueanaly00lagr
  Related: d'Alembert 1743 Traité de Dynamique PD; Hamilton 1834 PD

NumPy BSD-3-Clause https://numpy.org  github.com/numpy/numpy
  Related: SciPy BSD-3-Clause scipy.org  github.com/scipy/scipy
"""

import bpy, bmesh, math, numpy as np

# ── Parameters ──────────────────────────────────────────────────────────────
M1        = 1.0          # upper-bob mass (kg)
M2        = 1.0          # lower-bob mass (kg)
L1        = 1.0          # upper-rod length (m in physics units)
L2        = 1.0
G         = 9.81         # gravitational acceleration (m/s²)

DT        = 0.005        # RK4 time step (s)
N_STEPS   = 3600         # integration steps → 18 s of motion

TUBE_R    = 0.014        # tube radius (Blender metres)
TUBE_SIDES = 10          # polygonal cross-section
POI_R     = 0.082        # target bounding radius for poi head (m)

# Initial conditions (θ₁_deg, θ₂_deg, ω₁, ω₂)
IC_BASIS   = (40.0,  −10.0, 0.0,  0.0)
IC_CHAOTIC = (120.0, −30.0, 2.0,  0.0)
IC_WIDE    = (170.0,  10.0, 0.0,  3.0)

COBALT  = (0.06, 0.14, 0.66, 1.0)
AMBER   = (0.88, 0.52, 0.04, 1.0)

NAME = "DoublePendulum_Poi"


# ── ODE ─────────────────────────────────────────────────────────────────────
def _deriv(state):
    """RHS of double-pendulum state vector [θ₁, θ₂, ω₁, ω₂]."""
    th1, th2, w1, w2 = state
    delta = th1 - th2
    sd, cd = np.sin(delta), np.cos(delta)

    M = np.array([
        [(M1 + M2) * L1,  M2 * L2 * cd],
        [L1 * cd,          L2          ],
    ])
    F = np.array([
         M2 * L2 * w2 * w2 * sd - (M1 + M2) * G * np.sin(th1),
         L1 * w1 * w1 * sd      - G * np.sin(th2),
    ])
    accel = np.linalg.solve(M, F)   # WHY solve not inv: numerically stable
    return np.array([w1, w2, accel[0], accel[1]])


def _rk4(state):
    """One RK4 step — minimal memory, no SciPy dependency."""
    k1 = _deriv(state)
    k2 = _deriv(state + 0.5 * DT * k1)
    k3 = _deriv(state + 0.5 * DT * k2)
    k4 = _deriv(state + DT * k3)
    return state + (DT / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


def _integrate(ic_deg_rad):
    """Return (N,4) trajectory array + lower-bob kinetic energy array."""
    th1_0 = math.radians(ic_deg_rad[0])
    th2_0 = math.radians(ic_deg_rad[1])
    state = np.array([th1_0, th2_0, ic_deg_rad[2], ic_deg_rad[3]])

    traj  = np.empty((N_STEPS, 4))
    ke2   = np.empty(N_STEPS)        # lower-bob kinetic energy
    for i in range(N_STEPS):
        traj[i] = state
        w2 = state[3]
        ke2[i] = 0.5 * M2 * (L2 * w2) ** 2
        state = _rk4(state)

    # Tip position in the XY plane (Blender +Y-up world)
    x = L1 * np.sin(traj[:, 0]) + L2 * np.sin(traj[:, 1])
    y = L1 * np.cos(traj[:, 0]) + L2 * np.cos(traj[:, 1])
    pts = np.column_stack([x, y, np.zeros(N_STEPS)])
    return pts, ke2


# ── Bishop parallel-transport tube ──────────────────────────────────────────
def _bishop_tube(pts):
    """Build (verts, faces) for a Bishop-transport tube around pts.

    WHY Bishop not Frenet: the lower-bob path has near-inflection points where
    the Frenet normal flips 180° discontinuously. Bishop transport propagates
    a smooth normal via Rodrigues rotation, completely avoiding that instability.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    nrm = np.linalg.norm(T, axis=1, keepdims=True)
    nrm = np.where(nrm < 1e-10, 1.0, nrm)
    T = T / nrm
    T = np.vstack([T, T[-1]])           # repeat last tangent to close count

    # Seed normal: pick any vector not parallel to T[0]
    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    N = np.cross(T[0], up)
    N /= np.linalg.norm(N)

    ang = np.linspace(0, 2 * math.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)

    verts = []
    for i in range(n):
        B = np.cross(T[i], N)
        ring = pts[i] + TUBE_R * (ca[:, None] * N + sa[:, None] * B)
        verts.append(ring)
        if i < n - 1:
            # Rodrigues: rotate N by minimal rotation T[i]→T[i+1]
            axis = np.cross(T[i], T[i + 1])
            a_len = np.linalg.norm(axis)
            if a_len > 1e-10:
                axis /= a_len
                c = np.clip(np.dot(T[i], T[i + 1]), -1, 1)
                s = math.sqrt(max(0.0, 1.0 - c * c))
                N = c * N + s * np.cross(axis, N) + (1 - c) * np.dot(axis, N) * axis

    verts = np.array(verts)  # (n, TUBE_SIDES, 3)

    faces = []
    for i in range(n - 1):
        for j in range(TUBE_SIDES):
            j1 = (j + 1) % TUBE_SIDES
            a = i * TUBE_SIDES + j
            b = i * TUBE_SIDES + j1
            c = (i + 1) * TUBE_SIDES + j1
            d = (i + 1) * TUBE_SIDES + j
            faces.append((a, b, c, d))
    return verts.reshape(-1, 3), faces


# ── Scale helper ─────────────────────────────────────────────────────────────
def _scale_to_poi(verts):
    """Centre and scale flat trajectory to fit inside POI_R sphere."""
    centre = verts.mean(axis=0)
    v = verts - centre
    r = np.linalg.norm(v, axis=1).max()
    scale = (POI_R - TUBE_R) / (r if r > 1e-9 else 1.0)
    return v * scale


# ── Mesh builder ─────────────────────────────────────────────────────────────
def build():
    # Remove existing
    bpy.ops.object.select_all(action="DESELECT")
    if NAME in bpy.data.objects:
        bpy.data.objects[NAME].select_set(True)
        bpy.ops.object.delete()

    # Integrate all three initial conditions
    pts_b, ke2_b = _integrate(IC_BASIS)
    pts_c, ke2_c = _integrate(IC_CHAOTIC)
    pts_w, ke2_w = _integrate(IC_WIDE)

    # Scale to poi size (Basis trajectory drives the geometry basis)
    pts_b = _scale_to_poi(pts_b)
    pts_c = _scale_to_poi(pts_c)
    pts_w = _scale_to_poi(pts_w)

    verts_b, faces = _bishop_tube(pts_b)

    # Create mesh
    me = bpy.data.meshes.new(NAME)
    me.from_pydata(verts_b.tolist(), [], faces)
    me.update()

    obj = bpy.data.objects.new(NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── FLOAT_COLOR: DoublePend_Energy ───────────────────────────────────────
    # WHY per-vertex energy: viewers immediately see where chaos intensifies —
    # the high-KE regions glow amber, low-KE regions stay cobalt.
    attr = me.attributes.new("DoublePend_Energy", "FLOAT_COLOR", "POINT")
    n_verts = len(verts_b)
    # Each ring-of-vertices shares the energy of its trajectory point
    ke2_norm = ke2_b / (ke2_b.max() + 1e-10)
    colours = np.empty((n_verts, 4))
    for vi in range(n_verts):
        pt_idx = vi // TUBE_SIDES
        pt_idx = min(pt_idx, len(ke2_norm) - 1)
        t = float(ke2_norm[pt_idx])
        colours[vi] = tuple(COBALT[k] * (1 - t) + AMBER[k] * t for k in range(4))
    attr.data.foreach_set("color", colours.ravel().astype(np.float32))

    # ── Shape keys ────────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    # SK_Chaotic: strongly chaotic regime
    sk_c = obj.shape_key_add(name="SK_Chaotic", from_mix=False)
    verts_c, _ = _bishop_tube(pts_c)
    sk_c.data.foreach_set("co", verts_c.ravel().astype(np.float32))

    # SK_WideSwing: near-inverted large amplitude
    sk_w = obj.shape_key_add(name="SK_WideSwing", from_mix=False)
    verts_w, _ = _bishop_tube(pts_w)
    sk_w.data.foreach_set("co", verts_w.ravel().astype(np.float32))

    # SK_Tight: same trajectory, half the tube radius (for layered poi look)
    sk_t = obj.shape_key_add(name="SK_Tight", from_mix=False)
    global TUBE_R
    old_r, TUBE_R = TUBE_R, TUBE_R * 0.5
    verts_t, _ = _bishop_tube(pts_b)
    TUBE_R = old_r
    sk_t.data.foreach_set("co", verts_t.ravel().astype(np.float32))

    me.update()

    # ── Material ─────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new(NAME + "_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr_n = nt.nodes.new("ShaderNodeAttribute")
    attr_n.attribute_name  = "DoublePend_Energy"
    attr_n.attribute_type  = "GEOMETRY"

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value    = 0.45
    bsdf.inputs["Roughness"].default_value   = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.8

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr_n.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr_n.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])
    me.materials.append(mat)

    # ── Holoflow metadata ─────────────────────────────────────────────────────
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "double-pendulum-chaos"
    obj["holoflow:system"]   = "lagrangian-mechanics"

    # ── Apply transforms, export ─────────────────────────────────────────────
    import math as _math
    obj.rotation_euler = (_math.pi / 2, 0.0, 0.0)   # +Y up
    bpy.ops.object.transform_apply(rotation=True)

    glb_path = "//hf_double_pendulum_poi.glb"
    bpy.ops.export_scene.gltf(
        filepath          = glb_path,
        use_selection     = True,
        export_format     = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_colors     = True,
        export_morph      = True,
        export_yup        = True,
    )
    print(f"Exported → {glb_path}")


build()
