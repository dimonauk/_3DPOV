"""
Rabinovich–Fabrikant Attractor — Modulation-Instability Chaos,
RK4 Integration, Bishop-Frame Tube & Poi Light Trail for WebXR
Blender 5.1 · Python scripting · Holoflow Studio

Technique in brief
──────────────────
Rabinovich & Fabrikant (1979, Zh. Eksp. Teor. Fiz. 77:617) derived this
three-variable system to describe the slow-time modulation of a wave packet
travelling through a nonlinear dispersive medium at marginal stability.
The complex wave amplitude A(t) = x + iy; z is the local energy density
surplus above the instability threshold.  The governing ODEs are:

    ẋ = y(z − 1 + x²) + γ x          (x: real part of amplitude)
    ẏ = x(3z + 1 − x²) + γ y          (y: imaginary part of amplitude)
    ż = −2z(α + xy)                    (z: surplus energy, always decays)

The 3z coefficient in ẏ vs the −1 in ẋ breaks the symmetry between real and
imaginary modes; that asymmetry is responsible for the scroll-like topology
of the attractor (unlike Lorenz's two symmetric lobes).

Fixed points
────────────
Setting ẋ=ẏ=ż=0 with z≠0:
  From ż=0:  z=0 or xy=−α
  Substituting xy=−α into ẋ=0 → 0 = y(−1+x²−α/x²) + γ·x ... nonlinear
The system has 1–7 fixed points depending on (γ,α).  At the standard chaotic
parameters only the origin C₀=(0,0,0) is easily verified; the others require
numerical root-finding and are all unstable saddle-spirals.

Lyapunov spectrum (γ=0.87, α=1.1, standard initial cond.)
  λ₁ ≈ +0.160    λ₂ ≈ 0.00    λ₃ ≈ −3.340
  Kaplan-Yorke dimension: D_KY = 2 + λ₁/|λ₃| ≈ 2.048
The attractor lives very close to a 2-D surface — thin scroll sheets.

Mesh strategy
─────────────
Three orbits (Basis γ=0.87 α=1.1; SK_PeriodTwo γ=0.10 α=0.14;
SK_WeakChaos γ=0.10 α=0.10) are each integrated for N_STEPS RK4 steps
and sub-sampled every SKIP steps → KEEP waypoints.  A Bishop
(rotation-minimising parallel-transport) frame builds an 8-sided tube.
FLOAT_COLOR POINT 'RF_Speed' encodes velocity magnitude ‖(ẋ,ẏ,ż)‖ cobalt
(slow) → amber (fast): slow near fixed-point shadows, fast at scroll folds.
Exported as Draco-6 GLB poi light trail for WebXR.

Outside source credit
─────────────────────
Rabinovich, M. I. & Fabrikant, A. L. (1979). Stochastic self-modulation of
waves in nonequilibrium media. Zh. Eksp. Teor. Fiz. 77(2):617–629.
(Soviet Physics JETP 50(1):311–317.)  Mathematical content Public Domain.
https://www.osti.gov/biblio/7357534  (OSTI mirror)
"""

import bpy, math
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
GAMMA_BASIS   = 0.87     # dissipation/gain — canonical chaotic regime
ALPHA_BASIS   = 1.10     # coupling — canonical chaotic regime

GAMMA_SK1     = 0.10     # period-2 limit cycle
ALPHA_SK1     = 0.14

GAMMA_SK2     = 0.10     # mild chaos (different scroll topology)
ALPHA_SK2     = 0.10

DT            = 0.003    # RK4 time step (smaller than Lorenz — RF can spike)
N_STEPS       = 60_000   # total integration steps → T_max = 180 time units
SKIP          = 20       # keep every 20th → 3 000 waypoints
KEEP          = N_STEPS // SKIP  # = 3 000

X0            = np.array([-0.10, 0.10, 0.25])  # generic initial condition

TUBE_SIDES    = 8        # cross-section polygon facets
TUBE_R        = 0.013    # tube radius in metres (scene units)
POI_DIAMETER  = 0.12     # target poi diameter in metres

OBJ_NAME      = "hf_rf_poi"

# Vertex-colour cobalt → amber
COBALT = np.array([0.06, 0.14, 0.66, 1.0])
AMBER  = np.array([0.88, 0.52, 0.04, 1.0])


# ── ODE ───────────────────────────────────────────────────────────────────────
def rf_deriv(state: np.ndarray, gamma: float, alpha: float) -> np.ndarray:
    """
    Rabinovich–Fabrikant vector field.
    WHY separate function: clean separation between the ODE and numerics;
    easy to swap parameters for shape-key variants without code duplication.
    """
    x, y, z = state
    dx = y * (z - 1.0 + x * x) + gamma * x
    dy = x * (3.0 * z + 1.0 - x * x) + gamma * y
    dz = -2.0 * z * (alpha + x * y)
    return np.array([dx, dy, dz])


def rk4_orbit(gamma: float, alpha: float) -> np.ndarray:
    """
    Integrate the RF system for N_STEPS using classic 4th-order Runge-Kutta,
    sub-sampling every SKIP steps.

    WHY RK4: the RF system has rapid transients near the scroll fold regions.
    Euler or RK2 accumulate significant error there; RK4 with dt=0.003 keeps
    the local truncation error O(dt⁵)=O(2.4×10⁻¹³) per step, sufficient for
    3 000 displayed waypoints over T=180 time units.

    Transient burn-in: first 5 000 steps discarded — the orbit settles onto
    the attractor from the chosen IC within ~15 time units.
    """
    BURN  = 5_000
    state = X0.copy()

    # burn-in (not stored)
    for _ in range(BURN):
        k1 = rf_deriv(state,          gamma, alpha)
        k2 = rf_deriv(state + 0.5*DT*k1, gamma, alpha)
        k3 = rf_deriv(state + 0.5*DT*k2, gamma, alpha)
        k4 = rf_deriv(state +     DT*k3, gamma, alpha)
        state += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    pts   = np.empty((KEEP, 3), dtype=float)
    speed = np.empty(KEEP,      dtype=float)
    step  = 0
    idx   = 0

    while idx < KEEP:
        k1 = rf_deriv(state,          gamma, alpha)
        k2 = rf_deriv(state + 0.5*DT*k1, gamma, alpha)
        k3 = rf_deriv(state + 0.5*DT*k2, gamma, alpha)
        k4 = rf_deriv(state +     DT*k3, gamma, alpha)
        dstate = (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        state += dstate

        if step % SKIP == 0:
            pts[idx]   = state
            speed[idx] = float(np.linalg.norm(k1))  # speed at entry to step
            idx += 1
        step += 1

    return pts, speed


# ── Bishop frame ──────────────────────────────────────────────────────────────
def bishop_frame(pts: np.ndarray):
    """
    Compute rotation-minimising (Bishop) frames along the waypoint path.

    WHY Bishop not Frenet: Frenet frames flip when curvature passes through
    zero, producing sudden twists in the tube.  Bishop propagates the normal
    N by projecting it forward: N[i+1] = N[i] - dot(N[i], T[i+1]) * T[i+1],
    which is the Rodrigues rotation by the geodesic angle between consecutive
    tangents.  The tube appears smooth everywhere.

    Returns (normals N, binormals B), each shape (KEEP, 3).
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    lens = np.linalg.norm(T, axis=1, keepdims=True)
    lens = np.where(lens < 1e-10, 1e-10, lens)
    T = T / lens
    T = np.vstack([T, T[-1]])  # repeat last tangent at final point

    # seed N perpendicular to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([0.0, 1.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty((n, 3))
    B = np.empty((n, 3))
    N[0] = N0
    B[0] = np.cross(T[0], N0)

    for i in range(1, n):
        # Rodrigues: project N forward, re-orthogonalise
        n_proj = N[i-1] - np.dot(N[i-1], T[i]) * T[i]
        nlen   = np.linalg.norm(n_proj)
        if nlen < 1e-10:
            N[i] = N[i-1]
        else:
            N[i] = n_proj / nlen
        B[i] = np.cross(T[i], N[i])

    return N, B


# ── Tube mesh ─────────────────────────────────────────────────────────────────
def build_tube_verts(pts: np.ndarray, N: np.ndarray, B: np.ndarray,
                     radius: float) -> np.ndarray:
    """
    For each waypoint, lay out TUBE_SIDES vertices in a circle of `radius`.
    Output shape: (KEEP * TUBE_SIDES, 3)
    WHY vectorised: faster than a Python loop over 3 000 × 8 = 24 000 vertices.
    """
    angles = np.linspace(0, 2 * math.pi, TUBE_SIDES, endpoint=False)
    ca = np.cos(angles)
    sa = np.sin(angles)
    # (KEEP, 1, 3) * (1, TUBE_SIDES, 1) broadcasting → (KEEP, TUBE_SIDES, 3)
    ring = (pts[:, None, :]
            + radius * (ca[None, :, None] * N[:, None, :]
                        + sa[None, :, None] * B[:, None, :]))
    return ring.reshape(-1, 3)


def build_tube_faces(n_pts: int) -> list[list[int]]:
    """
    Quad faces connecting ring i to ring i+1.
    WHY quads: smoother shading gradient across FLOAT_COLOR attribute;
    Draco encoder handles quads natively.
    """
    faces = []
    for i in range(n_pts - 1):
        base = i * TUBE_SIDES
        for j in range(TUBE_SIDES):
            j1 = (j + 1) % TUBE_SIDES
            faces.append([base + j, base + j1,
                          base + TUBE_SIDES + j1,
                          base + TUBE_SIDES + j])
    return faces


# ── Scale helper ──────────────────────────────────────────────────────────────
def scale_to_poi(pts: np.ndarray) -> np.ndarray:
    """
    Centre and scale orbit so its bounding-box diagonal equals POI_DIAMETER.
    WHY: the RF attractor lives in a volume ≈ 3×3×1 in natural units; we want
    a compact 0.12 m poi head for XR.
    """
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    centre  = (lo + hi) / 2.0
    diag    = float(np.linalg.norm(hi - lo))
    scale   = POI_DIAMETER / max(diag, 1e-6)
    return (pts - centre) * scale


# ── Build Blender object ───────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def build_mesh_object(name, verts, faces):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(list(map(tuple, verts)), [], [list(f) for f in faces])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_vertex_colour(mesh, values: np.ndarray, attr_name: str):
    """
    Write FLOAT_COLOR POINT attribute encoding values[i] ∈ [0,1].
    One colour per vertex; each vertex appears TUBE_SIDES times in the ring.

    WHY FLOAT_COLOR POINT over BYTE_COLOR CORNER: FLOAT_COLOR preserves the
    full float precision used in Eevee HDR emission; POINT domain avoids
    duplicate-per-corner storage overhead for smooth gradients.
    """
    attr = mesh.attributes.new(attr_name, "FLOAT_COLOR", "POINT")
    # broadcast: each ring of TUBE_SIDES verts gets the same colour
    t = values.repeat(TUBE_SIDES)          # (KEEP * TUBE_SIDES,)
    colours = COBALT[None, :] * (1 - t[:, None]) + AMBER[None, :] * t[:, None]
    attr.data.foreach_set("color", colours.ravel().astype(np.float32))


def add_material(obj, attr_name: str):
    """
    Principled BSDF with ShaderNodeAttribute → BaseColor + Emission.
    metallic=0.45 for a subtle metallic sheen; emission_strength=1.8 so the
    attractor glows in XR low-ambient lighting.
    """
    mat = bpy.data.materials.new(obj.name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = attr_name
    attr.attribute_type = "GEOMETRY"
    attr.location = (-400, 0)

    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value    = 0.45
    bsdf.inputs["Roughness"].default_value   = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.8
    bsdf.location = (-100, 0)

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    obj.data.materials.append(mat)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("── Rabinovich–Fabrikant blueprint: integrating orbits …")
    clear_scene()

    # Basis orbit
    pts_b, spd_b = rk4_orbit(GAMMA_BASIS, ALPHA_BASIS)
    pts_b = scale_to_poi(pts_b)
    spd_b_n = spd_b / (spd_b.max() + 1e-12)  # normalise to [0,1]

    # SK_PeriodTwo orbit (same mesh topology, different coords)
    pts_1, _ = rk4_orbit(GAMMA_SK1, ALPHA_SK1)
    pts_1 = scale_to_poi(pts_1)

    # SK_WeakChaos orbit
    pts_2, _ = rk4_orbit(GAMMA_SK2, ALPHA_SK2)
    pts_2 = scale_to_poi(pts_2)

    print("   orbits integrated — building Bishop frames …")
    N_b, B_b = bishop_frame(pts_b)
    N_1, B_1 = bishop_frame(pts_1)
    N_2, B_2 = bishop_frame(pts_2)

    verts_b = build_tube_verts(pts_b, N_b, B_b, TUBE_R)
    verts_1 = build_tube_verts(pts_1, N_1, B_1, TUBE_R)
    verts_2 = build_tube_verts(pts_2, N_2, B_2, TUBE_R)
    faces   = build_tube_faces(KEEP)

    print(f"   mesh: {len(verts_b)} verts, {len(faces)} faces")

    obj = build_mesh_object(OBJ_NAME, verts_b, faces)
    mesh = obj.data

    # Vertex colour — speed on Basis orbit
    add_vertex_colour(mesh, spd_b_n, "RF_Speed")
    add_material(obj, "RF_Speed")

    # Shape keys
    obj.shape_key_add(name="Basis", from_mix=False)
    sk1 = obj.shape_key_add(name="SK_PeriodTwo", from_mix=False)
    sk2 = obj.shape_key_add(name="SK_WeakChaos", from_mix=False)
    sk1.data.foreach_set("co", verts_1.ravel().astype(np.float32))
    sk2.data.foreach_set("co", verts_2.ravel().astype(np.float32))
    mesh.update()

    # holoflow metadata
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "rabinovich-fabrikant-attractor"

    # +Y-up: rotate -90° around X so Z→Y for GLTF export convention
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(rotation=True)

    # Pole handle stub
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.008, depth=0.08,
        location=(0.0, -(POI_DIAMETER / 2 + 0.04), 0.0)
    )
    pole = bpy.context.active_object
    pole.name = OBJ_NAME + "_pole"

    # Paths
    import os
    blend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    blend_path = os.path.join(blend_dir, "hf_rf_poi.blend")
    glb_path   = os.path.join(blend_dir, "hf_rf_poi.glb")

    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_morph=True,
        export_yup=True,
        export_image_format="WEBP",
    )
    print(f"   Saved → {blend_path}")
    print(f"   Saved → {glb_path}")
    print("── Rabinovich–Fabrikant blueprint: done ──")


main()
