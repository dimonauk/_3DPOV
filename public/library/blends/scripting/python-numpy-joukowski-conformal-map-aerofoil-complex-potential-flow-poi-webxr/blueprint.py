# ============================================================
# Joukowski Conformal Aerofoil — Complex Potential Flow
# Blender 5.1 / Python + numpy blueprint
# CC0 1.0 Universal — Holoflow Studio
# ============================================================
# Nikolai Joukowski (Жуковский, 1910) showed that the conformal
# map w = z + a²/z carries circles to streamlined wing profiles.
# When the circle passes through z = a (a branch point of the
# inverse), the mapped edge forms a cusp — the Kutta condition.
# Viscosity pins the rear stagnation point at the cusp; setting
# circulation Γ = 4π U R sin(α+β) satisfies this and delivers
# lift L = ρ U Γ per unit span (Kutta-Joukowski theorem).
# Blueprint builds: (a) 3-D wing mesh extruded from the mapped
# profile, (b) 18 streamlines integrated by RK4 in the z-plane
# and mapped to the w-plane, (c) GLB export for WebXR.
# ============================================================

import bpy, numpy as np
from mathutils import Vector

# ─────────────────────── PARAMETERS ─────────────────────────
A_JOUK     = 1.0    # Joukowski parameter; chord ≈ 4·A_JOUK
CX         = -0.12  # circle centre x (trailing-edge offset → thickness)
CY         =  0.08  # circle centre y (camber)
U_INF      =  1.0   # freestream speed (dimensionless)
ALPHA_DEG  =  8.0   # angle of attack (°)
N_PROFILE  = 180    # chord-wise vertex count for wing loop
WING_SPAN  =  0.5   # extrusion half-span each side (Blender metres)
WING_SEGS  =  4     # span-wise segment count
N_STREAMS  = 18     # streamline count
N_STEPS    = 320    # RK4 steps per streamline
DS         =  0.042 # RK4 arc-length step in z-plane
SCALE      =  0.50  # uniform scale: Joukowski units → Blender metres
BEVEL_R    =  0.004 # tube radius for streamline splines (m)
OBJ_WING   = "hf_joukowski_wing"
OBJ_STRM   = "hf_joukowski_streams"
GLB_PATH   = "//hf_joukowski_aerofoil.glb"
# ─────────────────────────────────────────────────────────────


# ──────────────────── CORE MATH ──────────────────────────────

def joukowski(z: np.ndarray, a: float) -> np.ndarray:
    # Singularities at ±a carry infinite curvature to sharp edges.
    # The +a singularity becomes the cusp (trailing edge).
    return z + a ** 2 / z


def _safe(z: np.ndarray, eps: float = 1e-9) -> np.ndarray:
    return np.where(np.abs(z) > eps, z, eps + 0j)


def circle_radius(cx: float, cy: float, a: float) -> float:
    # R = |z_c − a|  so the forward Joukowski point a lies on the circle.
    return abs(complex(cx, cy) - a)


def kutta_gamma(U: float, alpha: float, R: float,
                cx: float, cy: float, a: float) -> float:
    # β = angle from circle centre to forward Joukowski point.
    # Kutta condition: Γ = 4π U R sin(α + β).
    # Milne-Thomson, Theoretical Hydrodynamics §10.31 (1938).
    beta = np.angle(a - complex(cx, cy))
    return 4.0 * np.pi * U * R * np.sin(alpha + beta)


def stream_fn(z: np.ndarray, U: float, alpha: float,
              R: float, z_c: complex, G: float) -> np.ndarray:
    """ψ = Im(F): stream function. Streamlines satisfy ψ = const."""
    zeta = _safe(z - z_c)
    F = (U * np.exp(-1j * alpha) * zeta
         + U * np.exp( 1j * alpha) * R ** 2 / zeta
         + G / (2.0 * np.pi * 1j) * np.log(zeta / R))
    return F.imag


def vel_z(z: np.ndarray, U: float, alpha: float,
          R: float, z_c: complex, G: float) -> np.ndarray:
    """dF/dz; conj gives velocity vector (u, v) in z-plane."""
    zeta = _safe(z - z_c)
    return (U * np.exp(-1j * alpha)
            - U * np.exp( 1j * alpha) * R ** 2 / zeta ** 2
            + G / (2.0 * np.pi * 1j * zeta))


def _rk4(z: complex, U: float, alpha: float,
         R: float, z_c: complex, G: float, ds: float) -> complex:
    """One RK4 step. Velocity direction = conj(dF/dz)."""
    def v(zp):
        return np.conj(vel_z(np.array([zp]), U, alpha, R, z_c, G)[0])
    k1 = v(z);                   k2 = v(z + 0.5 * ds * k1)
    k3 = v(z + 0.5 * ds * k2);  k4 = v(z + ds * k3)
    return z + ds * (k1 + 2 * k2 + 2 * k3 + k4) / 6.0


# ──────────────── GEOMETRY BUILDERS ──────────────────────────

def build_profile(cx, cy, a, n) -> np.ndarray:
    """n complex w-plane points forming the aerofoil contour."""
    R = circle_radius(cx, cy, a)
    theta = np.linspace(0, 2 * np.pi, n, endpoint=False)
    z = complex(cx, cy) + R * np.exp(1j * theta)
    # Avoid z = 0 (pole); circle never passes through origin when R > |z_c|
    return joukowski(_safe(z), a)


def trace_streamline(z0: complex, z_c, R, U, alpha, G, a) -> np.ndarray:
    """RK4 path in z-plane, then Joukowski-mapped to w-plane."""
    pts = [z0]
    z = z0
    for _ in range(N_STEPS):
        z_new = _rk4(z, U, alpha, R, z_c, G, DS)
        if abs(z_new - z_c) < R * 1.01:   # entered circle interior
            break
        if abs(z_new) > 7.0:              # left domain
            break
        z = z_new
        pts.append(z)
    zz = _safe(np.array(pts))
    return joukowski(zz, a)


def delete_old(*names):
    for nm in names:
        if ob := bpy.data.objects.get(nm):
            bpy.data.objects.remove(ob, do_unlink=True)
        if me := bpy.data.meshes.get(nm):
            bpy.data.meshes.remove(me)
        if cv := bpy.data.curves.get(nm):
            bpy.data.curves.remove(cv)


def emissive_mat(name, rgb, strength=2.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*rgb, 1.0)
    em.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def build_wing(profile_w: np.ndarray):
    """
    Extrude profile into a finite-span 3-D wing.

    Coordinate convention: chord along Blender X, span along Y,
    thickness along Z — matches +Y-up GLB export convention.
    """
    ctr = profile_w.mean()
    pw = (profile_w - ctr) * SCALE        # centred, scaled
    n = len(pw)

    verts, faces = [], []
    for seg in range(WING_SEGS + 1):
        y = (seg / WING_SEGS - 0.5) * WING_SPAN * 2.0
        for p in pw:
            verts.append(Vector((p.real, y, p.imag)))

    for seg in range(WING_SEGS):
        ba, bb = seg * n, (seg + 1) * n
        for i in range(n):
            j = (i + 1) % n
            faces.append((ba + i, ba + j, bb + j, bb + i))

    # Endcap fans — winding reversed on one end for consistent normals
    def fan(base, flip):
        idx = list(range(base, base + n))
        if flip:
            idx = idx[::-1]
        return [(idx[0], idx[k], idx[k + 1]) for k in range(1, n - 1)]

    faces += fan(0, flip=True)
    faces += fan(WING_SEGS * n, flip=False)

    me = bpy.data.meshes.new(OBJ_WING)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(OBJ_WING, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(emissive_mat("mat_wing", (0.90, 0.82, 0.55)))
    ob["holoflow:facet"] = True
    return ob, ctr


def build_stream_curves(z_c, R, U, alpha, G, a, ctr_w):
    """
    Seed streamlines at uniform ψ intervals upstream,
    locate their y-positions by bisection, trace, and build
    NURBS tubes in the w-plane.
    """
    x_seed = -2.8
    psi_lo = stream_fn(np.array([complex(x_seed, -2.5 * R)]),
                       U, alpha, R, z_c, G)[0]
    psi_hi = stream_fn(np.array([complex(x_seed,  2.5 * R)]),
                       U, alpha, R, z_c, G)[0]
    psi_vals = np.linspace(psi_lo, psi_hi, N_STREAMS)

    # Bisection: find y so ψ(x_seed + iy) == psi_target
    seeds = []
    for psi in psi_vals:
        ya, yb = -3.0 * R, 3.0 * R
        for _ in range(50):
            ym = 0.5 * (ya + yb)
            pm = stream_fn(np.array([complex(x_seed, ym)]),
                           U, alpha, R, z_c, G)[0]
            if pm < psi:
                ya = ym
            else:
                yb = ym
        seeds.append(complex(x_seed, 0.5 * (ya + yb)))

    crv = bpy.data.curves.new(OBJ_STRM, 'CURVE')
    crv.dimensions = '3D'
    crv.bevel_depth = BEVEL_R
    crv.bevel_resolution = 2
    crv_ob = bpy.data.objects.new(OBJ_STRM, crv)
    bpy.context.collection.objects.link(crv_ob)
    crv.materials.append(emissive_mat("mat_streams", (0.3, 0.85, 1.0), 3.5))

    for z0 in seeds:
        w_pts = trace_streamline(z0, z_c, R, U, alpha, G, a)
        if len(w_pts) < 4:
            continue
        sp = crv.splines.new('NURBS')
        sp.points.add(len(w_pts) - 1)
        for i, wp in enumerate(w_pts):
            x = (wp.real - ctr_w.real) * SCALE
            zb = (wp.imag - ctr_w.imag) * SCALE
            sp.points[i].co = (x, 0.0, zb, 1.0)
        sp.use_endpoint_u = True
        sp.order_u = 4

    return crv_ob


# ─────────────────────── MAIN ────────────────────────────────

delete_old(OBJ_WING, OBJ_STRM)

alpha_r = np.radians(ALPHA_DEG)
R       = circle_radius(CX, CY, A_JOUK)
z_c     = complex(CX, CY)
Gamma   = kutta_gamma(U_INF, alpha_r, R, CX, CY, A_JOUK)

profile_w          = build_profile(CX, CY, A_JOUK, N_PROFILE)
wing_ob, ctr_w     = build_wing(profile_w)
stream_ob          = build_stream_curves(z_c, R, U_INF, alpha_r,
                                         Gamma, A_JOUK, ctr_w)

# Export both objects as a single GLB
bpy.ops.object.select_all(action='DESELECT')
wing_ob.select_set(True)
stream_ob.select_set(True)
bpy.context.view_layer.objects.active = wing_ob
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)
print(f"Γ = {Gamma:.4f}  R = {R:.4f}  L/span = ρ·U·Γ = {U_INF * Gamma:.4f} ρ")
print(f"Exported → {GLB_PATH}")
