"""
Rössler Attractor — Otto Rössler 1976
Single-Scroll Band Attractor · Shilnikov Homoclinic Orbit · Smale Horseshoe
Bishop Parallel-Transport Tube · Cobalt–Amber Poi Head for WebXR (Blender 5.1)

SOURCE:  Rössler OE (1976) "An Equation for Continuous Chaos"
         Physics Letters A 57(5):397-398
         doi:10.1016/0375-9601(76)90101-8
         Status: public-domain equations; no code taken.

WHY THIS ATTRACTOR:
  Rössler designed this ODE system in 1976 to be the simplest possible chaotic
  flow — one that could be understood geometrically as a continuous-time horseshoe.
  It has exactly ONE quadratic nonlinearity (the xz product in ż), yet it achieves
  Shilnikov-type chaos through a single-scroll topology.  Contrast with Lorenz
  (two quadratics, double-scroll butterfly) and Chen (two quadratics, anti-dual
  butterfly).  Rössler's band attractor is the theoretical prototype that motivated
  the Smale horseshoe interpretation of chaos.
"""

# ── stdlib ─────────────────────────────────────────────────────────────────
import sys
# ── third-party (bundled with Blender 5.x Python) ──────────────────────────
import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ═══════════════════════════════════════════════════════════════════════════
# PARAMETERS — edit here, nowhere else
# ═══════════════════════════════════════════════════════════════════════════

# ── ODE parameters (Rössler 1976 canonical) ─────────────────────────────────
# a=0.2, b=0.2, c=5.7 → λ₁≈+0.071, λ₂≈0, λ₃≈-5.40, D_KY≈2.013
A          = 0.2    # slow-spiral expansion coefficient in ẏ = x + ay
B          = 0.2    # threshold offset in ż = b + z(x − c)
C          = 5.7    # fold threshold; bifurcation from periodic (c≈4) to chaos

# ── Integration ─────────────────────────────────────────────────────────────
DT         = 0.005  # Runge-Kutta timestep (smaller than Lorenz needs because
                    # the system is slower; 0.005 gives ΔE/E₀ < 1e-5 per cycle)
N_STEPS    = 120_000  # total steps
BURN_IN    = 5_000    # discard transient before attractor locks
THIN       = 40       # keep every 40th point → 2,875 waypoints on spline
                      # (the band topology is thin enough that fine-grained
                      #  sampling crowds the tube; 40 is a good balance)

# ── Blender geometry ────────────────────────────────────────────────────────
POI_RADIUS = 0.12   # metres; normalise to this circumradius for WebXR hand scale
TUBE_R     = 0.016  # tube cross-section radius (Bishop frame)
TUBE_SIDES = 12     # polygon count of tube cross-section

# ── Shape-key variant parameters ────────────────────────────────────────────
# SK_Periodic: c=4.0 → stable limit cycle (period-1 before period-doubling)
# SK_Period2:  c=5.0 → period-2 orbit (first bifurcation in cascade)
# SK_Dense:    a=0.3, c=5.7 → slower spiral, denser winding, wider band
SK_VARIANTS = [
    dict(name="SK_Periodic", a=A, b=B, c=4.0),
    dict(name="SK_Period2",  a=A, b=B, c=5.0),
    dict(name="SK_Dense",    a=0.3, b=B, c=5.7),
]

# ── Material ─────────────────────────────────────────────────────────────────
OBJ_NAME  = "Rossler_A"   # snake_case root, holoflow convention
MAT_NAME  = "RosslerMat"
ATTR_NAME = "RosslerColour"   # FLOAT_COLOR vertex attribute for WebXR baking
COL_A     = (0.10, 0.30, 0.80, 1.0)   # cobalt  (slow, inner band)
COL_B     = (0.90, 0.60, 0.10, 1.0)   # amber   (fast, fold region)

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — Runge-Kutta 4 integration
# ─────────────────────────────────────────────────────────────────────────────

def rossler_deriv(state: np.ndarray, a: float, b: float, c: float) -> np.ndarray:
    """
    Returns (ẋ, ẏ, ż) for the Rössler system.

    ẋ = −y − z
    ẏ =  x + a·y
    ż =  b + z·(x − c)

    The only quadratic term is z·x in ż.  The linear terms (−y−z, x+ay, b−cz)
    alone would give a stable spiral; the z·x cross-coupling is what generates
    the fold that creates chaotic behaviour.  When x > c the z-term amplifies,
    shooting the trajectory up; when x < c it damps, pulling it back to the
    xy-plane.  This alternating shoot-and-return is the Rössler mechanism.
    """
    x, y, z = state
    dx = -y - z
    dy =  x + a * y
    dz =  b + z * (x - c)
    return np.array([dx, dy, dz])


def rk4(state: np.ndarray, dt: float, a: float, b: float, c: float) -> np.ndarray:
    """
    Classic 4th-order Runge-Kutta step.
    Each sub-step evaluation of the derivative is a Butcher-tableau row.
    WHY RK4 not Euler: Euler's single-derivative approximation accumulates
    O(dt²) error per step; RK4 is O(dt⁴).  For a 120 000-step integration
    that difference compounds dramatically.
    """
    k1 = rossler_deriv(state,          a, b, c)
    k2 = rossler_deriv(state + dt/2*k1, a, b, c)
    k3 = rossler_deriv(state + dt/2*k2, a, b, c)
    k4 = rossler_deriv(state + dt   *k3, a, b, c)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(a: float, b: float, c: float) -> np.ndarray:
    """
    Runs RK4 from a standard initial condition and returns the thinned waypoints.

    Initial condition (0.1, 0.1, 0.1) — close to the equilibrium origin but off-axis.
    WHY not the origin: (0,0,0) is an unstable equilibrium (linearisation has one
    positive eigenvalue); starting there traps the trajectory.
    """
    state = np.array([0.1, 0.1, 0.1])
    raw   = []
    for i in range(N_STEPS):
        state = rk4(state, DT, a, b, c)
        if i >= BURN_IN and (i - BURN_IN) % THIN == 0:
            raw.append(state.copy())
    return np.array(raw)   # shape (N_waypoints, 3)


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — Bishop (parallel-transport) frame tube construction
# ─────────────────────────────────────────────────────────────────────────────

def bishop_tube(pts: np.ndarray, radius: float, sides: int) -> tuple:
    """
    Builds ring-by-ring tube vertices via Bishop parallel-transport framing.

    WHY Bishop over Frenet-Serret: Frenet breaks at inflection points where the
    principal normal flips.  On the Rössler attractor the curvature passes through
    near-zero in the slow spiral region, which would cause a 180° twisting artefact
    with Frenet.  Bishop instead propagates the normal by minimal rotation about the
    tangent at each step — no torsion-induced flipping, smooth tube guaranteed.

    Returns (verts_list, ring_count) where verts_list is a flat list of Vector.
    """
    n      = len(pts)
    T      = pts[1] - pts[0]
    T      = T / (np.linalg.norm(T) + 1e-12)

    # Seed: find a vector not parallel to T
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(seed, T)) > 0.9:
        seed = np.array([0.0, 1.0, 0.0])
    N = seed - np.dot(seed, T) * T
    N /= (np.linalg.norm(N) + 1e-12)
    B = np.cross(T, N)

    verts  = []
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)

    for i in range(n):
        # Build ring
        for ang in angles:
            offset = radius * (np.cos(ang) * N + np.sin(ang) * B)
            verts.append(Vector(tuple(pts[i] + offset)))

        # Advance frame to next waypoint
        if i < n - 1:
            T_next = pts[i+1] - pts[i]
            T_next = T_next / (np.linalg.norm(T_next) + 1e-12)
            # Rodrigues rotation: rotate N,B by the angle from T→T_next
            axis   = np.cross(T, T_next)
            s      = np.linalg.norm(axis)
            c_     = np.dot(T, T_next)
            if s > 1e-9:
                axis /= s
                N = c_*N + s*np.cross(axis, N) + (1-c_)*np.dot(axis, N)*axis
                B = c_*B + s*np.cross(axis, B) + (1-c_)*np.dot(axis, B)*axis
                N /= (np.linalg.norm(N) + 1e-12)
                B /= (np.linalg.norm(B) + 1e-12)
            T = T_next

    return verts, n


def make_faces(n_rings: int, sides: int) -> list:
    """Quadrilateral face indices connecting adjacent rings in the tube."""
    faces = []
    for i in range(n_rings - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            c = (i+1) * sides + (j + 1) % sides
            d = (i+1) * sides + j
            faces.append((a, b, c, d))
    return faces


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — Colour attribute (FLOAT_COLOR for WebXR baking)
# ─────────────────────────────────────────────────────────────────────────────

def assign_colours(mesh, pts: np.ndarray, sides: int):
    """
    Maps each vertex to a colour based on the azimuthal phase angle in the
    xy-plane of the Rössler attractor.

    WHY phase angle: the Rössler attractor spirals in the xy-plane then folds
    upward (positive z excursions).  Colouring by atan2(y,x) maps the slow-
    spiral inward sweeps to cobalt and the fast fold outward sweeps to amber,
    making the speed variation visually legible.  This is analogous to the
    'phase' colouring used across the library but adapted to Rössler topology.
    """
    col_attr = mesh.attributes.new(name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT")
    # Tile colours per ring
    n = len(pts)
    for ring_i, pt in enumerate(pts):
        phase = (np.arctan2(pt[1], pt[0]) / np.pi + 1.0) / 2.0   # 0→1
        col   = tuple(
            COL_A[ch] * (1 - phase) + COL_B[ch] * phase
            for ch in range(4)
        )
        for vtx_j in range(sides):
            col_attr.data[ring_i * sides + vtx_j].color = col


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — Blender mesh assembly
# ─────────────────────────────────────────────────────────────────────────────

def normalise(pts: np.ndarray) -> np.ndarray:
    """
    Scales the trajectory so its 99th-percentile radial distance from origin
    equals POI_RADIUS.  WHY 99th-percentile: the Rössler attractor occasionally
    makes large z-excursions in the fold region; using max would make the main
    spiral too small.  99th percentile keeps the common shape at the desired size
    while letting the rare excursion protrude only slightly.
    """
    radii = np.linalg.norm(pts, axis=1)
    scale = POI_RADIUS / (np.percentile(radii, 99) + 1e-12)
    return pts * scale


def build_mesh_from_pts(name: str, pts: np.ndarray) -> bpy.types.Object:
    """Creates a Blender mesh object from Bishop-framed tube vertices."""
    pts   = normalise(pts)
    verts, n_rings = bishop_tube(pts, TUBE_R * (POI_RADIUS / 0.12), TUBE_SIDES)
    faces = make_faces(n_rings, TUBE_SIDES)

    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata([v[:] for v in verts], [], faces)
    mesh.update()

    assign_colours(mesh, pts, TUBE_SIDES)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_shape_key(obj: bpy.types.Object, sk_name: str,
                  a: float, b: float, c: float):
    """
    Adds a shape key derived from a different Rössler parameter set.

    WHY shape keys not separate objects: shape keys let the WebXR scene morph
    between dynamical regimes at run-time with a single GLB, no extra HTTP fetch.
    Morph target animation in three.js (MorphTargetMixer) interpolates these natively.
    """
    pts  = integrate(a, b, c)
    pts  = normalise(pts)
    verts, _ = bishop_tube(pts, TUBE_R * (POI_RADIUS / 0.12), TUBE_SIDES)

    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for i, v in enumerate(verts):
        sk.data[i].co = v


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — Material
# ─────────────────────────────────────────────────────────────────────────────

def make_material() -> bpy.types.Material:
    """
    Principled BSDF with mild emission so the attractor glows in WebXR scenes.
    Roughness 0.18 keeps highlights tight — important for displaying the thin
    band topology without washout.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Metallic"].default_value   = 0.65
        bsdf.inputs["Roughness"].default_value  = 0.18
        bsdf.inputs["Emission Strength"].default_value = 0.22
    return mat


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 6 — Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    # Clear existing mesh objects
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False, confirm=False)
    bpy.context.scene.cursor.location = (0, 0, 0)

    # Integrate basis attractor
    print("Integrating Rössler basis (a=0.2, b=0.2, c=5.7)…")
    pts_basis = integrate(A, B, C)
    print(f"  Waypoints: {len(pts_basis)}")

    # Build basis mesh
    obj = build_mesh_from_pts(OBJ_NAME, pts_basis)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Basis shape key (required before adding variants)
    obj.shape_key_add(name="Basis", from_mix=False)

    # Shape-key variants
    for sk_def in SK_VARIANTS:
        print(f"  Building shape key {sk_def['name']}…")
        add_shape_key(obj, sk_def["name"], sk_def["a"], sk_def["b"], sk_def["c"])

    # Material
    mat = make_material()
    obj.data.materials.append(mat)

    # holoflow metadata
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

    # +Y-up rotation for WebXR export convention
    import math
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # Flat shading (faceted look, studio convention)
    bpy.ops.object.shade_flat()

    print(f"\nRössler Attractor built: {OBJ_NAME}")
    print(f"  Vertices  : {len(obj.data.vertices)}")
    print(f"  Shape keys: {[sk.name for sk in obj.data.shape_keys.key_blocks]}")
    print("\nNext steps:")
    print("  File → Export → glTF 2.0 → Draco Compression 6, WebP textures,")
    print("  include morph targets, export to public/library/glbs/scripting/<slug>/")


if __name__ == "__main__":
    main()
