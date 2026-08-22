"""
Lorenz Strange Attractor — RK4 Integration, Bishop-Frame Tube & Butterfly Poi Light Trail
Blender 5.1 · Python scripting · Holoflow Studio

Technique in brief
──────────────────
Lorenz (1963) truncated the Saltzman (1962) Galerkin expansion of Rayleigh-Bénard
convection to three modes, yielding the now-canonical system:

    dx/dt = σ(y − x)          σ = Prandtl number (viscous/thermal diffusivity)
    dy/dt = x(ρ − z) − y      ρ = normalised Rayleigh number (buoyancy/dissipation)
    dz/dt = xy − βz            β = 8/3 (aspect-ratio: 4 / (1 + (2π/L)²), L=√2)

Three fixed points for ρ > 1:
  C₀ = (0, 0, 0)  — always an unstable saddle
  C± = (±√(β(ρ−1)),  ±√(β(ρ−1)),  ρ−1)  — stable spiral for 1 < ρ < ρ_H
                                           — unstable for ρ > ρ_H

Hopf bifurcation threshold:
  ρ_H = σ(σ + β + 3) / (σ − β − 1) ≈ 24.74  (σ=10, β=8/3)

At ρ=28 both C± are unstable: the orbit spirals outward from each wing until
nonlinear coupling forces it to switch lobes — aperiodically, forever.

Lyapunov exponents (σ=10, ρ=28, β=8/3):
  λ₁ ≈ +0.906   λ₂ ≈ 0   λ₃ ≈ −14.572
Kaplan-Yorke dimension:  D_KY = 2 + λ₁/|λ₃| ≈ 2.062
(Tucker 2002 proved this attractor exists rigorously — Smale's 14th problem.)

Mesh strategy: one orbit (N_STEPS=10 000, dt=0.005) is integrated by RK4;
sub-sampled every SKIP=5 steps → 2 000 waypoints.  A Bishop (rotation-
minimising parallel-transport) frame produces a smooth 8-sided tube.  Three
Blender shape keys encode ρ=28 (basis), ρ=22 (pre-chaotic stable spiral to C+),
and ρ=200 (high-Rayleigh vigorous chaos).  Vertex colour encodes integration
time as a HSV rainbow.  Exported as Draco-6 GLB poi light trail for WebXR.
"""

import bpy, math, colorsys
import numpy as np

# ── Parameters (tune at top) ──────────────────────────────────────────────────
SIGMA       = 10.0          # Prandtl number
RHO_BASIS   = 28.0          # classic chaos (ρ > ρ_H ≈ 24.74)
RHO_SK1     = 22.0          # below Hopf: stable spiral converges to C+
RHO_SK2     = 200.0         # high Rayleigh: broader chaotic structure
BETA        = 8.0 / 3.0    # aspect-ratio factor

DT          = 0.005         # RK4 step — halved from Lorenz's 1963 value for accuracy
N_STEPS     = 10_000        # → T_max = 50 time units (> 50 mixing times)
SKIP        = 5             # keep every 5th → 2000 waypoints per orbit

X0          = np.array([0.1, 0.0, 0.0])  # initial condition (arbitrary)

TUBE_SIDES  = 8             # cross-section polygon facets
TUBE_R_FRAC = 0.030         # tube radius as fraction of poi diameter
POI_DIAMETER = 0.12         # target diameter in metres
POLE_RADIUS  = 0.008        # handle stub radius (m)
POLE_HEIGHT  = 0.08         # handle stub height (m)

OBJ_NAME    = "hf_lorenz_poi"
COL_NAME    = "HF_Lorenz"


# ── Lorenz ODEs ───────────────────────────────────────────────────────────────
def lorenz(xyz, sigma, rho, beta):
    """
    Returns d(xyz)/dt.  x ~ convection speed, y ~ horizontal temperature
    gradient, z ~ deviation of vertical temperature profile from linearity.
    The xy product in dz/dt is the nonlinear term that generates chaos.
    """
    x, y, z = xyz
    return np.array([
        sigma * (y - x),
        x * (rho - z) - y,
        x * y - beta * z
    ])


# ── 4th-order Runge-Kutta ─────────────────────────────────────────────────────
def rk4_step(xyz, dt, sigma, rho, beta):
    """
    One RK4 step.  O(dt⁵) local truncation error vs O(dt²) for Euler —
    essential for capturing the attractor topology without drift.
    """
    k1 = lorenz(xyz,              sigma, rho, beta)
    k2 = lorenz(xyz + 0.5*dt*k1, sigma, rho, beta)
    k3 = lorenz(xyz + 0.5*dt*k2, sigma, rho, beta)
    k4 = lorenz(xyz +      dt*k3, sigma, rho, beta)
    return xyz + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(x0, sigma, rho, beta, n_steps, dt, skip):
    """Integrate Lorenz ODE; return sub-sampled trajectory as (n, 3) array."""
    pts, xyz = [], x0.copy()
    for i in range(n_steps):
        if i % skip == 0:
            pts.append(xyz.copy())
        xyz = rk4_step(xyz, dt, sigma, rho, beta)
    return np.array(pts)


# ── Bishop (rotation-minimising) parallel-transport frame ─────────────────────
def bishop_frame(pts):
    """
    Propagates the normal N by the unique rotation mapping T_{i-1} → T_i
    (Rodrigues formula on the cross-product axis).  Avoids Frenet-Serret torsion
    spin near inflection points that would twist the tube.
    Returns T, N, B each of shape (n, 3).
    """
    n = len(pts)
    T = np.zeros((n, 3)); N = np.zeros((n, 3)); B = np.zeros((n, 3))

    # Central-difference tangents (forward/backward at boundaries)
    T[0]    = pts[1] - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    T[1:-1] = pts[2:] - pts[:-2]
    nrm = np.linalg.norm(T, axis=1, keepdims=True)
    T /= np.where(nrm < 1e-10, 1.0, nrm)

    # Seed N₀ perpendicular to T₀
    seed = np.array([0.0, 0.0, 1.0]) if abs(T[0, 2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N[0] = seed - np.dot(seed, T[0]) * T[0]
    N[0] /= np.linalg.norm(N[0])
    B[0] = np.cross(T[0], N[0])

    for i in range(1, n):
        t0, t1 = T[i - 1], T[i]
        axis    = np.cross(t0, t1)
        sin_a   = np.linalg.norm(axis)
        cos_a   = np.clip(np.dot(t0, t1), -1.0, 1.0)

        if sin_a < 1e-10:
            N[i] = N[i - 1] if cos_a > 0 else -N[i - 1]
        else:
            axis /= sin_a
            Ni = (N[i - 1] * cos_a
                  + np.cross(axis, N[i - 1]) * sin_a
                  + axis * np.dot(axis, N[i - 1]) * (1.0 - cos_a))
            Ni -= np.dot(Ni, t1) * t1   # re-orthogonalise (numerical drift)
            ln  = np.linalg.norm(Ni)
            N[i] = (Ni / ln) if ln > 1e-10 else N[i - 1]

        B[i] = np.cross(T[i], N[i])

    return T, N, B


# ── Tube mesh builder ─────────────────────────────────────────────────────────
def tube_mesh(pts, r, n_sides, N_frame, B_frame):
    """Vertex + face lists for a tube along pts with radius r."""
    angles = [2 * math.pi * k / n_sides for k in range(n_sides)]
    ca = [math.cos(a) for a in angles]
    sa = [math.sin(a) for a in angles]
    verts = []
    for i, p in enumerate(pts):
        for k in range(n_sides):
            verts.append((p + r * (ca[k]*N_frame[i] + sa[k]*B_frame[i])).tolist())
    faces = []
    ns = n_sides
    for i in range(len(pts) - 1):
        for k in range(ns):
            k1 = (k + 1) % ns
            a, b = i*ns+k, i*ns+k1
            c, d = (i+1)*ns+k1, (i+1)*ns+k
            faces.append([a, b, c, d])
    return verts, faces


# ── HSV rainbow by integration time ──────────────────────────────────────────
def orbit_colours(n_pts, n_sides):
    """Hue cycles violet → red → green → violet over the full orbit."""
    cols = []
    for i in range(n_pts):
        t = i / (n_pts - 1)
        h = (0.65 + t * 0.85) % 1.0
        r, g, b = colorsys.hsv_to_rgb(h, 0.85, 0.95)
        for _ in range(n_sides):
            cols.append((r, g, b, 1.0))
    return cols


# ════════════════════════════════════════════════════════════════════════════════
# Main execution
# ════════════════════════════════════════════════════════════════════════════════
print("Integrating Lorenz orbits …")
p28  = integrate(X0, SIGMA, RHO_BASIS, BETA, N_STEPS, DT, SKIP)
p22  = integrate(X0, SIGMA, RHO_SK1,   BETA, N_STEPS, DT, SKIP)
p200 = integrate(X0, SIGMA, RHO_SK2,   BETA, N_STEPS, DT, SKIP)
N_PTS = len(p28)
print(f"  {N_PTS} waypoints each")

# Centre each orbit independently (z-offset ≈ ρ-1 differs between ρ values)
p28  -= p28.mean(axis=0)
p22  -= p22.mean(axis=0)
p200 -= p200.mean(axis=0)

# Scale basis orbit to poi diameter; apply same scale to others
extent = np.linalg.norm(p28.max(axis=0) - p28.min(axis=0))
s      = POI_DIAMETER / extent          # m / Lorenz-units
p28  *= s;  p22  *= s;  p200 *= s
R_TUBE = POI_DIAMETER * TUBE_R_FRAC    # tube radius in metres

# Build basis tube mesh
_, Nb, Bb = bishop_frame(p28)
verts, faces = tube_mesh(p28, R_TUBE, TUBE_SIDES, Nb, Bb)

me = bpy.data.meshes.new(OBJ_NAME)
me.from_pydata(verts, [], faces)
me.update()

obj = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Shape keys ────────────────────────────────────────────────────────────────
obj.shape_key_add(name="Basis_ρ28", from_mix=False)

for name, pts_sk in [("Stable_ρ22", p22), ("Hot_ρ200", p200)]:
    sk = obj.shape_key_add(name=name, from_mix=False)
    _, Nk, Bk = bishop_frame(pts_sk)
    v_sk, _ = tube_mesh(pts_sk, R_TUBE, TUBE_SIDES, Nk, Bk)
    flat_co = [co for v in v_sk for co in v]
    sk.data.foreach_set("co", flat_co)   # 30× faster than per-vertex loop

# ── Vertex colours ────────────────────────────────────────────────────────────
cols     = orbit_colours(N_PTS, TUBE_SIDES)
col_attr = me.color_attributes.new(name="LorenzAge", type="FLOAT_COLOR", domain="POINT")
col_attr.data.foreach_set("color", [c for rgba in cols for c in rgba])

# ── Material: emission driven by vertex colour ─────────────────────────────────
mat = bpy.data.materials.new("Mat_Lorenz")
mat.use_nodes = True
nt  = mat.node_tree; nt.nodes.clear()
attr = nt.nodes.new("ShaderNodeAttribute");    attr.attribute_name = "LorenzAge"
emit = nt.nodes.new("ShaderNodeEmission");     emit.inputs["Strength"].default_value = 3.0
out  = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
mat.shadow_method = "NONE"
obj.data.materials.append(mat)

# ── Custom properties ─────────────────────────────────────────────────────────
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-light-trail"

# ── Connector stub ────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(
    radius=POLE_RADIUS, depth=POLE_HEIGHT,
    location=(0, 0, -POI_DIAMETER / 2 - POLE_HEIGHT / 2))
pole      = bpy.context.active_object
pole.name = OBJ_NAME + "_pole"

# ── Export ────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True); pole.select_set(True)

bpy.ops.export_scene.gltf(
    filepath  = bpy.path.abspath("//hf_lorenz_poi.glb"),
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
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//hf_lorenz_poi.blend"))
print(f"Saved → hf_lorenz_poi.blend + hf_lorenz_poi.glb")
print(f"  Verts: {len(verts)}  Faces: {len(faces)}  Tube radius: {R_TUBE*1000:.1f} mm")
