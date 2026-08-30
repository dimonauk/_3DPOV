"""
Moore–Spiegel Oscillator — Moore & Spiegel 1966
Stellar Convection Nonlinear Jerk System · Amplitude-Dependent Damping Chaos
Bishop Parallel-Transport Tube · Cobalt–Amber Poi Head for WebXR (Blender 5.1)

SOURCE:  Moore DW & Spiegel EA (1966) "A Thermally Excited Non-Linear Oscillator"
         Astrophysical Journal 143:871-887
         doi:10.1086/148562
         Status: public-domain equations; no code taken.

WHY THIS SYSTEM:
  Moore and Spiegel derived this ODE in 1966 to model the vertical displacement
  of a fluid parcel oscillating through a thermally stratified layer in a stellar
  convection zone.  The key physics: when the parcel displacement x is small the
  buoyancy feedback is linearly destabilising (like negative damping), but when x
  grows large the nonlinear term Rx²y provides restoring damping — the same
  amplitude-dependent gain mechanism found in the Van der Pol oscillator, but
  embedded in a three-dimensional phase space that allows chaotic dynamics.

  Written as a jerk system, the single scalar equation is:
      x‴ = −ẍ − (T − R + Rx²)ẋ − Tx

  This is among the earliest astrophysical ODEs shown to produce chaos.
  Compare: Van der Pol (1926) had the same MECHANISM in 2D; Moore-Spiegel (1966)
  is the 3D extension that admits chaos.  Lorenz (1963) has constant divergence;
  so does Moore-Spiegel (∇·F = −1), making them exactly comparable structurally.
"""

# ── stdlib ─────────────────────────────────────────────────────────────────
import math
# ── third-party (bundled with Blender 5.x Python) ──────────────────────────
import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ═══════════════════════════════════════════════════════════════════════════
# PARAMETERS — edit here, nowhere else
# ═══════════════════════════════════════════════════════════════════════════

# ── Thermal parameters (Moore & Spiegel 1966 canonical chaos) ────────────────
# T = ratio of thermal relaxation to dynamical time-scale
# R = Rayleigh-number-like ratio driving convective instability
# Canonical chaos: T=6, R=20 → ∇·F = −1 (constant), λ₁≈+0.070, D_KY≈2.065
T_PARAM    = 6.0    # thermal time-scale ratio
R_PARAM    = 20.0   # convective drive

# Nonlinear damping coefficient switches sign at |x| = √((R-T)/R) = √0.70 ≈ 0.837:
#   (R-T-Rx²) > 0  when |x| < 0.837  → energy injection (unstable)
#   (R-T-Rx²) < 0  when |x| > 0.837  → nonlinear saturation (damping)

# ── Integration ─────────────────────────────────────────────────────────────
DT         = 0.005   # RK4 timestep
N_STEPS    = 150_000 # total steps (T=6 is slower than Lorenz; more steps needed)
BURN_IN    = 8_000   # discard transient before attractor is reached
THIN       = 50      # keep every 50th point → ≈2840 waypoints on spline

# ── Blender geometry ────────────────────────────────────────────────────────
POI_RADIUS = 0.12    # circumradius after normalisation (WebXR hand scale, metres)
TUBE_R     = 0.015   # Bishop tube cross-section radius
TUBE_SIDES = 12      # polygon count around tube

# ── Shape-key variant parameters ────────────────────────────────────────────
# SK_Periodic: R=12 → linear growth weaker than saturation → limit cycle
# SK_Dense:    R=28 → stronger convective drive → denser attractor
# SK_HighT:    T=9, R=20 → higher thermal stiffness → altered topology
SK_VARIANTS = [
    dict(name="SK_Periodic", T=5.0,  R=12.0),
    dict(name="SK_Dense",    T=6.0,  R=28.0),
    dict(name="SK_HighT",    T=9.0,  R=20.0),
]

# ── Material / colours ──────────────────────────────────────────────────────
OBJ_NAME  = "MooreSpiegel_Amp"  # snake_case root, holoflow convention
MAT_NAME  = "MooreSpiegelMat"
ATTR_NAME = "MSp_Amplitude"     # FLOAT_COLOR vertex attribute (amplitude |x|)
COL_A     = (0.10, 0.30, 0.80, 1.0)   # cobalt — small |x|, linear growth zone
COL_B     = (0.90, 0.60, 0.10, 1.0)   # amber  — large |x|, nonlinear saturation


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — Runge-Kutta 4 integration
# ─────────────────────────────────────────────────────────────────────────────

def msp_deriv(state: np.ndarray, T: float, R: float) -> np.ndarray:
    """
    Returns (ẋ, ẏ, ż) for the Moore-Spiegel oscillator:

        ẋ = y
        ẏ = z
        ż = −z − (T − R + R·x²)·y − T·x

    WHY this form: this is a jerk system — the ż equation gives the third
    time-derivative of x.  The term −(T−R+Rx²)y is the amplitude-dependent
    damping coefficient: at small |x| the factor (T−R+Rx²) is NEGATIVE,
    so −(negative)·y is POSITIVE feedback (pumping energy into the oscillation).
    At large |x|, Rx² dominates and the coefficient flips, providing restoring
    damping.  The T·x term is a linear restoring force.
    """
    x, y, z = state
    dx = y
    dy = z
    dz = -z - (T - R + R * x * x) * y - T * x
    return np.array([dx, dy, dz])


def rk4(state: np.ndarray, dt: float, T: float, R: float) -> np.ndarray:
    """
    Classic 4th-order Runge-Kutta step.
    WHY RK4: Moore-Spiegel contains a z-component feeding back through x²y,
    which can grow rapidly.  RK4's O(dt⁴) global error per step keeps the
    trajectory accurate for the 150 000-step integration without adaptive cost.
    """
    k1 = msp_deriv(state,             T, R)
    k2 = msp_deriv(state + dt/2 * k1, T, R)
    k3 = msp_deriv(state + dt/2 * k2, T, R)
    k4 = msp_deriv(state + dt   * k3, T, R)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(T: float, R: float) -> np.ndarray:
    """
    Runs RK4 from a standard IC and returns thinned waypoints.

    Initial condition (0.5, 0.0, 0.0) — displaced in x from origin.
    WHY not (0,0,0): the origin is the only fixed point of Moore-Spiegel and
    linearisation there has two unstable directions (eigenvalues ≈ +0.47 and
    +2.9 for T=6, R=20).  Starting at (0.5, 0, 0) seeds the attractor directly.
    """
    state = np.array([0.5, 0.0, 0.0])
    raw   = []
    for i in range(N_STEPS):
        state = rk4(state, DT, T, R)
        if i >= BURN_IN and (i - BURN_IN) % THIN == 0:
            raw.append(state.copy())
    return np.array(raw)   # shape (N_waypoints, 3)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — Bishop (parallel-transport) frame tube
# ─────────────────────────────────────────────────────────────────────────────

def bishop_tube(pts: np.ndarray, radius: float, sides: int) -> tuple:
    """
    Builds a ring-by-ring tube via Bishop parallel-transport framing.

    WHY Bishop over Frenet-Serret: the Moore-Spiegel attractor passes through
    near-zero curvature regions as the trajectory reverses near the turning
    points of the x oscillation.  Frenet's principal normal flips at inflection
    points, producing a 180° twist artefact.  Bishop propagates the frame by
    minimal rotation about the tangent at each step (Rodrigues formula), which
    accumulates no unnecessary twist even at curvature zeros.

    Returns (verts_list, ring_count).
    """
    n   = len(pts)
    T   = pts[1] - pts[0]
    T   = T / (np.linalg.norm(T) + 1e-12)

    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(seed, T)) > 0.9:
        seed = np.array([0.0, 1.0, 0.0])
    N = seed - np.dot(seed, T) * T
    N /= (np.linalg.norm(N) + 1e-12)
    B = np.cross(T, N)

    verts  = []
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)

    for i in range(n):
        for ang in angles:
            offset = radius * (np.cos(ang) * N + np.sin(ang) * B)
            verts.append(Vector(tuple(pts[i] + offset)))

        if i < n - 1:
            T_next = pts[i+1] - pts[i]
            T_next = T_next / (np.linalg.norm(T_next) + 1e-12)
            axis   = np.cross(T, T_next)
            s      = np.linalg.norm(axis)
            c_     = np.dot(T, T_next)
            if s > 1e-9:
                axis /= s
                N = c_*N + s*np.cross(axis, N) + (1 - c_)*np.dot(axis, N)*axis
                B = c_*B + s*np.cross(axis, B) + (1 - c_)*np.dot(axis, B)*axis
                N /= (np.linalg.norm(N) + 1e-12)
                B /= (np.linalg.norm(B) + 1e-12)
            T = T_next

    return verts, n


def make_faces(n_rings: int, sides: int) -> list:
    """Quad face indices connecting adjacent rings."""
    faces = []
    for i in range(n_rings - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            c = (i + 1) * sides + (j + 1) % sides
            d = (i + 1) * sides + j
            faces.append((a, b, c, d))
    return faces


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — Amplitude colour attribute (FLOAT_COLOR for WebXR)
# ─────────────────────────────────────────────────────────────────────────────

def assign_colours(mesh, pts: np.ndarray, sides: int):
    """
    Colours each vertex by |x| normalised to [0, 1], mapping:
      cobalt → small |x| (energy-injection zone, inside nonlinear switch x★≈0.837)
      amber  → large |x| (nonlinear saturation zone, amplitude past the switch)

    WHY |x|: the Moore-Spiegel mechanism is governed entirely by x amplitude.
    When |x| < x★ the oscillator gains energy; when |x| > x★ it loses energy.
    Colouring by |x| makes this dynamically meaningful boundary visible in the
    rendered WebXR asset without any secondary velocity buffer.
    """
    col_attr = mesh.attributes.new(
        name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT"
    )
    amp_max = np.percentile(np.abs(pts[:, 0]), 99) + 1e-12
    for ring_i, pt in enumerate(pts):
        t = min(abs(pt[0]) / amp_max, 1.0)
        col = tuple(
            COL_A[ch] * (1 - t) + COL_B[ch] * t for ch in range(4)
        )
        for vtx_j in range(sides):
            col_attr.data[ring_i * sides + vtx_j].color = col


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — Blender mesh assembly
# ─────────────────────────────────────────────────────────────────────────────

def normalise(pts: np.ndarray) -> np.ndarray:
    """
    Scales trajectory so 99th-percentile radial distance equals POI_RADIUS.
    WHY 99th-percentile: Moore-Spiegel has occasional large excursions in y and z.
    Using max would shrink the attractor core below hand scale; 99th-percentile
    keeps the common structure at POI_RADIUS with minimal clipping.
    """
    radii = np.linalg.norm(pts, axis=1)
    scale = POI_RADIUS / (np.percentile(radii, 99) + 1e-12)
    return pts * scale


def build_mesh(name: str, pts: np.ndarray) -> bpy.types.Object:
    """Creates a Blender mesh object from Bishop-framed tube vertices."""
    pts    = normalise(pts)
    tube_r = TUBE_R * (POI_RADIUS / 0.12)
    verts, n_rings = bishop_tube(pts, tube_r, TUBE_SIDES)
    faces  = make_faces(n_rings, TUBE_SIDES)

    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata([v[:] for v in verts], [], faces)
    mesh.update()
    assign_colours(mesh, pts, TUBE_SIDES)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_shape_key(obj: bpy.types.Object, sk_name: str, T: float, R: float):
    """
    Adds a shape key from a different Moore-Spiegel parameter set.
    WHY shape keys: WebXR morph target animation lets viewers sweep between
    dynamical regimes in a single GLB — no extra HTTP fetch.  The limit-cycle
    regime (SK_Periodic) is visually dramatic — a smooth closed oval vs the
    chaotic basis — making the morph a real-time bifurcation demonstration.
    """
    pts    = integrate(T, R)
    pts    = normalise(pts)
    tube_r = TUBE_R * (POI_RADIUS / 0.12)
    verts, _ = bishop_tube(pts, tube_r, TUBE_SIDES)

    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for i, v in enumerate(verts):
        sk.data[i].co = v


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — Material
# ─────────────────────────────────────────────────────────────────────────────

def make_material() -> bpy.types.Material:
    """
    Principled BSDF: mild metallic sheen + subtle emission.
    Low roughness (0.16) keeps specular highlights tight at POI scale.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Metallic"].default_value          = 0.60
        bsdf.inputs["Roughness"].default_value         = 0.16
        bsdf.inputs["Emission Strength"].default_value = 0.20
    return mat


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6 — Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False, confirm=False)
    bpy.context.scene.cursor.location = (0, 0, 0)

    print("Integrating Moore-Spiegel basis (T=6, R=20)…")
    pts_basis = integrate(T_PARAM, R_PARAM)
    print(f"  Waypoints: {len(pts_basis)}")

    obj = build_mesh(OBJ_NAME, pts_basis)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    obj.shape_key_add(name="Basis", from_mix=False)

    for sk_def in SK_VARIANTS:
        print(f"  Building shape key {sk_def['name']} (T={sk_def['T']}, R={sk_def['R']})…")
        add_shape_key(obj, sk_def["name"], sk_def["T"], sk_def["R"])

    mat = make_material()
    obj.data.materials.append(mat)

    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

    # +Y-up rotation for WebXR export convention (Blender Z-up → glTF Y-up)
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bpy.ops.object.shade_flat()

    print(f"\nMoore-Spiegel Oscillator built: {OBJ_NAME}")
    print(f"  Vertices  : {len(obj.data.vertices)}")
    print(f"  Shape keys: {[sk.name for sk in obj.data.shape_keys.key_blocks]}")
    print("\nNext steps:")
    print("  File → Export → glTF 2.0 → Draco Compression 6, WebP textures,")
    print("  include morph targets → public/library/glbs/scripting/<slug>/")


if __name__ == "__main__":
    main()
