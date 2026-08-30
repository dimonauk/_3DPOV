"""
Kapitza Pendulum — Parametric Resonance, Mathieu Stability,
Bishop Parallel-Transport Tube Poi Head  |  Blender 5.1
═══════════════════════════════════════════════════════════
CC0 — Holoflow Studio  |  bpy / numpy

The Kapitza pendulum is a pendulum whose pivot point oscillates rapidly
in the vertical direction.  When the driving frequency Ω greatly exceeds
the natural frequency ω₀ = √(g/L), rapid pivot motion creates an effective
restoring potential that makes the normally-unstable inverted equilibrium
*dynamically stable*.  First predicted by Arthur Stephenson (1908), the
mechanism is the canonical demonstration of parametric resonance: not a
resonance that amplifies, but one that confines.

EQUATION OF MOTION (inertial frame, pivot at y_p = a·cos Ωt):
    θ̈ = −(g − a Ω² cos Ωt) / L · sin θ
    θ = 0 → hanging down;  θ = π → inverted (up)

EFFECTIVE POTENTIAL (high-frequency Kapitza average):
    U_eff(θ) = −m g L cos θ + m(aΩ)²/(4L) · sin²θ
Inverted equilibrium stable when:  (aΩ)² > 2 g L
   → a·Ω > √(2gL) ≈ 4.43 m/s  [g = 9.81, L = 1.0]

MATHIEU EQUATION (linearised about inverted position, φ = θ − π):
    φ'' + (δ − 2q cos 2τ) φ = 0
    τ = Ωt/2,  δ = −4(ω₀/Ω)²,  q = 2(a Ω ω₀/Ω)²/Ω²
The stability criterion corresponds to STABLE regions of the Strutt diagram
— see the Mathieu / Strutt tutorial for the companion stability-chart floor.

3-D EMBEDDING:
    x(t) = L sin θ · cos(ω_az t)
    y(t) = L sin θ · sin(ω_az t)
    z(t) = −L cos θ        [z = +L when inverted, z = −L when hanging]
The slow azimuthal wrap ω_az = 0.6 rad/s unrolls the 2-D phase portrait
into a helix; the Kapitza case coils tightly near z = +L (top of sphere).
"""

import bpy
import numpy as np

# ── PARAMETERS ─────────────────────────────────────────────────────────────
G          = 9.81        # m/s²
L_PEND     = 1.0         # pendulum length (m)
AZ_SPEED   = 0.6         # slow azimuthal wrap  (rad/s)

DT         = 0.001       # RK4 step  — 63 steps per driving period at Ω=50
BURN_IN    = 3_000       # 3 s transient discarded
N_STEPS    = 120_000     # 120 s integration  (~11 azimuthal turns)
THIN       = 40          # keep every 40th step → 3 000 waypoints

TUBE_R     = 0.010       # tube radius (m)
TUBE_SIDES = 12          # circumferential segments
POI_R      = 0.10        # bounding radius to scale head into (m)

COBALT = (0.02, 0.10, 0.55, 1.0)
AMBER  = (0.95, 0.60, 0.00, 1.0)
ATTR_NAME = "Kapitza_Speed"    # FLOAT_COLOR per-corner attribute

EXPORT_PATH = "//hf_kapitza_poi.glb"

# Each shape key: (name, θ₀, a_drive, Ω_drive)
# aΩ threshold = √(2×9.81×1) ≈ 4.43 m/s
SHAPE_KEYS = [
    ("Basis",      np.pi - 0.05, 0.10, 50.0),  # Kapitza-stable, near inverted
    ("SK_Border",  np.pi - 0.05, 0.089, 50.0), # aΩ=4.45 ≈ threshold — large wobble
    ("SK_Wide",    np.pi - 0.30, 0.10, 50.0),  # larger initial deviation from inverted
    ("SK_Fall",    np.pi - 0.05, 0.04, 50.0),  # aΩ=2.0 < threshold — pendulum falls
]


# ── HELPERS ────────────────────────────────────────────────────────────────

def _deriv(state, t, a, omega_d):
    """Right-hand side of Kapitza ODE: θ̈ = −(g − a Ω² cos Ωt)/L · sinθ."""
    th, dth = state
    d2th = -(G - a * omega_d**2 * np.cos(omega_d * t)) / L_PEND * np.sin(th)
    return np.array([dth, d2th])


def _rk4(state, t, dt, a, omega_d):
    """Single RK4 step."""
    k1 = _deriv(state,              t,          a, omega_d)
    k2 = _deriv(state + 0.5*dt*k1, t + 0.5*dt, a, omega_d)
    k3 = _deriv(state + 0.5*dt*k2, t + 0.5*dt, a, omega_d)
    k4 = _deriv(state +     dt*k3, t +     dt,  a, omega_d)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def _integrate(theta0, a, omega_d):
    """
    Integrate the Kapitza ODE and return N waypoints in 3-D.
    Returns positions (N,3) and angular speed |θ̇| (N,) for vertex colour.
    θ̇₀ = 0 (start from rest) for all shape keys — same topology, different dynamics.
    """
    state = np.array([theta0, 0.0])
    t = 0.0
    # Burn-in — settle onto attractor / let transient die
    for _ in range(BURN_IN):
        state = _rk4(state, t, DT, a, omega_d)
        t += DT

    pts    = []
    speeds = []
    for i in range(N_STEPS):
        state = _rk4(state, t, DT, a, omega_d)
        t += DT
        if i % THIN == 0:
            th, dth = state
            phi = AZ_SPEED * t          # slow azimuthal rotation
            x = L_PEND * np.sin(th) * np.cos(phi)
            y = L_PEND * np.sin(th) * np.sin(phi)
            z = -L_PEND * np.cos(th)   # +L = inverted, −L = hanging
            pts.append([x, y, z])
            speeds.append(abs(dth))

    pts = np.array(pts, dtype=np.float32)
    speeds = np.array(speeds, dtype=np.float32)
    # Scale so bounding radius ≈ POI_R
    r_max = np.max(np.linalg.norm(pts, axis=1))
    if r_max > 1e-6:
        pts *= POI_R / r_max
    return pts, speeds


def _bishop_frame(pts):
    """
    Parallel-transport Bishop frame along an open polyline.
    Returns (N,3) normal N and binormal B arrays.
    """
    n = len(pts)
    raw = np.diff(pts, axis=0)
    raw = np.vstack([raw, raw[-1]])          # duplicate last tangent for closure
    norms = np.linalg.norm(raw, axis=1, keepdims=True)
    norms = np.where(norms < 1e-10, 1.0, norms)
    T = raw / norms

    # Seed normal orthogonal to T[0]
    seed = np.array([0.0, 0.0, 1.0]) if abs(T[0, 2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty((n, 3), dtype=np.float32)
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            cos_a = np.clip(np.dot(T[i-1], T[i]), -1, 1)
            ax = axis / sin_a
            Ni = cos_a * N[i-1] + sin_a * np.cross(ax, N[i-1]) + (1 - cos_a) * np.dot(ax, N[i-1]) * ax
            N[i] = Ni / max(np.linalg.norm(Ni), 1e-10)
    B = np.cross(T, N).astype(np.float32)
    return N, B


def _build_tube(pts, N, B):
    """Construct closed tube mesh; returns (verts list, faces list)."""
    n = len(pts)
    S = TUBE_SIDES
    angles = np.linspace(0, 2 * np.pi, S, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    # Broadcast: rings (n, S, 3)
    rings = pts[:, None, :] + TUBE_R * (ca[None, :, None] * N[:, None, :] +
                                         sa[None, :, None] * B[:, None, :])
    verts = rings.reshape(-1, 3).tolist()
    faces = []
    for i in range(n - 1):
        for j in range(S):
            v00 = i * S + j
            v01 = i * S + (j + 1) % S
            v10 = (i + 1) * S + j
            v11 = (i + 1) * S + (j + 1) % S
            faces.append((v00, v01, v11, v10))
    return verts, faces


def _colour_attr(me, speeds):
    """Write Kapitza_Speed FLOAT_COLOR attribute (loop domain for viewport display)."""
    n_verts = len(speeds)
    S = TUBE_SIDES
    # Expand per-ring speed to per-corner (loop order matches quad faces)
    # For a tube of (n-1) rings of quads, each quad has 4 corners, traversed
    # ring-by-ring in face order; simpler to use POINT domain here.
    col_attr = me.color_attributes.new(name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT")
    s_min, s_max = speeds.min(), speeds.max()
    s_norm = (speeds - s_min) / max(s_max - s_min, 1e-10)
    n_verts_mesh = n_verts * S
    colours = np.empty(n_verts_mesh * 4, dtype=np.float32)
    for ring_i in range(n_verts):
        t = s_norm[ring_i]
        c = tuple(COBALT[k] * (1 - t) + AMBER[k] * t for k in range(4))
        for j in range(S):
            base = (ring_i * S + j) * 4
            colours[base:base+4] = c
    col_attr.data.foreach_set("color", colours)


def _add_material(obj, me):
    mat = bpy.data.materials.new("Kapitza_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 1.6
    bsdf.inputs["Metallic"].default_value = 0.50
    bsdf.inputs["Roughness"].default_value = 0.22
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    me.materials.append(mat)
    obj.data.update()


# ── MAIN BUILD ─────────────────────────────────────────────────────────────

def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    first_me = None
    obj = None

    for sk_name, theta0, a, omega_d in SHAPE_KEYS:
        pts, speeds = _integrate(theta0, a, omega_d)
        N_arr, B_arr = _bishop_frame(pts)
        verts, faces = _build_tube(pts, N_arr, B_arr)

        if first_me is None:
            # Create the mesh on first (Basis) pass
            me = bpy.data.meshes.new("Kapitza_Poi")
            me.from_pydata([tuple(v) for v in verts], [], faces)
            me.shade_flat()
            _colour_attr(me, speeds)
            _add_material(bpy.data.objects.new("Kapitza_Poi", me), me)
            obj = bpy.data.objects.new("Kapitza_Poi", me)
            bpy.context.collection.objects.link(obj)
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            first_me = me
            # Basis shape key
            sk = obj.shape_key_add(name="Basis", from_mix=False)
            sk.interpolation = "KEY_LINEAR"
        else:
            # Additional shape key
            sk = obj.shape_key_add(name=sk_name, from_mix=False)
            sk.interpolation = "KEY_LINEAR"
            flat_verts = np.array(verts, dtype=np.float32).ravel()
            sk.data.foreach_set("co", flat_verts)

    # Holoflow metadata
    obj["holoflow:facet"] = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:export_name"] = "hf_kapitza_poi"

    # +Y up: rotate −90° around X, apply
    obj.rotation_euler = (-np.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)

    if EXPORT_PATH and EXPORT_GLB:
        bpy.ops.export_scene.gltf(
            filepath=bpy.path.abspath(EXPORT_PATH),
            export_format="GLB",
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_colors=True,
            export_morph=True,
            export_image_format="WEBP",
        )
        print(f"Exported: {EXPORT_PATH}")

    print("Kapitza Poi built. Vertices:", len(first_me.vertices),
          "Faces:", len(first_me.polygons))


build()
