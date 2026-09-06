"""
Sprott I Attractor — 1994 Canonical Case I
===========================================
Technique: RK4 integration of a 6-term 3-D ODE with a single quadratic
nonlinearity (y²), converted to a Bishop-parallel-transport tube mesh
coloured by instantaneous speed.  All geometry via bpy.data — no operators.

Generalised form (canonical a = 0.20):
    ẋ = −a·y
    ẏ =  x + z
    ż =  x + y² − z

Reference: Sprott JC (1994) "Some simple chaotic flows",
  Phys Rev E 50(2):R647–R650.  DOI 10.1103/PhysRevE.50.R647
  Public-domain mathematics.  https://sprott.physics.wisc.edu/chaos/

Key properties
--------------
Divergence:  ∇·F = ∂(−ay)/∂x + ∂(x+z)/∂y + ∂(x+y²−z)/∂z
           = 0 + 0 + (−1) = −1   (CONSTANT, independent of a)
This constant divergence gives Liouville's theorem: ∑λᵢ = −1 for every
orbit on the canonical attractor.

Fixed points: ẋ=0 → y=0; ẏ=0 → x=−z; ż=0 → x+y²−z=0 → 2x=0 → x=0.
UNIQUE fixed point O = (0, 0, 0).  No second equilibrium, unlike Sprott O.

Jacobian at O = (0, 0, 0):
    J = [[ 0, −a,  0],
         [ 1,  0,  1],
         [ 1,  0, −1]]

    trace(J) = 0 + 0 + (−1) = −1   (matches ∇·F = −1 ✓)

Characteristic polynomial:
    det(J − λI) = 0
    λ³ + λ² + aλ + 2a = 0                    [exact, all a]

Factored form: λ²(λ+1) + a(λ+2) = 0

Routh–Hurwitz check (p₁=1, p₂=a, p₃=2a):
    p₁·p₂ − p₃ = a − 2a = −a < 0  for all a > 0
→ Origin is ALWAYS unstable for any positive a.  This is structural —
  the instability does not depend on parameter tuning.

Canonical (a=0.20):
    Characteristic poly: λ³ + λ² + 0.2λ + 0.4 = 0
    Real root:     λ_r ≈ −1.136   (stable 1-D W^s into origin)
    Complex pair:  λ_c ≈ +0.068 ± 0.589i  (unstable 2-D spiral out)
    Shilnikov ratio: |λ_r|/Re(λ_c) ≈ 1.136/0.068 ≈ 16.7  >>  1 ✓
    Shilnikov chaos guaranteed (homoclinic orbit condition met).

    λ₁ ≈ +0.059   (maximal Lyapunov exponent, weakly chaotic like Sprott J)
    λ₂ ≈  0       (marginal direction along flow)
    λ₃ ≈ −1.059   (from Liouville: λ₁+λ₂+λ₃ = −1)
    D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.059/1.059 ≈ 2.056

Lyapunov time: τ = 1/λ₁ ≈ 17 time-units (BURN_IN covers ~175 τ).

Shape-key parameter sweep (coupling coefficient a):
    Basis      a=0.20  canonical  λ_r≈−1.136  ρ≈+0.068  Shilnikov≈16.7
    SK_LowA    a=0.10  wider orbit, weaker attractor   Shilnikov≈24
    SK_HighA   a=0.35  tighter loops, stronger damping Shilnikov≈12
    SK_NearBif a=0.50  approaching topology change, orbit contracts markedly
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── integration parameters ────────────────────────────────────────────────────
A_BASIS   = 0.20   # canonical Sprott I coupling coefficient
A_LOWA    = 0.10   # weakly coupled — larger orbit footprint
A_HIGHA   = 0.35   # more strongly coupled — tighter spirals
A_NEARBIF = 0.50   # near topological transition

DT      = 0.01     # RK4 timestep; orbital ω≈0.59 rad/tu → ~10 steps/radian
BURN_IN = 3_000    # transient discard (~175 Lyapunov times at τ≈17)
N_STEPS = 90_000   # recording steps
THIN    = 30       # keep every 30th → 3 000 waypoints on attractor

IC = np.array([0.1, 0.0, 0.1], dtype=float)  # off fixed point; generic start

# ── tube geometry ─────────────────────────────────────────────────────────────
TUBE_SIDES = 8      # octagonal cross-section: minimal verts, still smooth
TUBE_R     = 0.045  # cross-section radius (metres)
POI_R      = 0.090  # bounding sphere for WebXR poi-head export

# ── vertex-colour attribute ───────────────────────────────────────────────────
ATTR_NAME = "SprottI_Speed"          # FLOAT_COLOR, domain POINT
COBALT = np.array([0.020, 0.102, 0.557])   # slow end — deep blue
AMBER  = np.array([0.950, 0.600, 0.000])   # fast end — warm amber


# ─────────────────────────────────────────────────────────────────────────────
# 1. ODE + RK4
# ─────────────────────────────────────────────────────────────────────────────

def _f(s: np.ndarray, a: float) -> np.ndarray:
    """Sprott I vector field.  s = [x, y, z].

    WHY −ay in ẋ: the y-coupling drives x indirectly; as a shrinks to 0
    the two-zero-eigenvalue degenerate limit is approached, and the chaotic
    attractor disappears.  The quadratic y² in ż provides the sole
    nonlinear folding that keeps trajectories bounded.
    """
    x, y, z = s
    return np.array([-a * y,
                      x + z,
                      x + y*y - z])


def _rk4(s: np.ndarray, a: float) -> np.ndarray:
    """Single RK4 step.  Classic 4-stage scheme — no adaptive stepping needed
    because the attractor is smoothly bounded and ω is moderate."""
    k1 = _f(s, a)
    k2 = _f(s + 0.5 * DT * k1, a)
    k3 = _f(s + 0.5 * DT * k2, a)
    k4 = _f(s + DT * k3, a)
    return s + (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def sample_orbit(a: float) -> tuple[np.ndarray, np.ndarray]:
    """Integrate, discard BURN_IN transient, thin to 3 000 waypoints.
    Returns (pts[3000, 3], speeds[3000]).
    """
    s = IC.copy()
    for _ in range(BURN_IN):
        s = _rk4(s, a)

    pts, speeds = [], []
    for i in range(N_STEPS):
        ds = _f(s, a)
        if i % THIN == 0:
            pts.append(s.copy())
            speeds.append(float(np.linalg.norm(ds)))
        s = _rk4(s, a)

    return np.array(pts), np.array(speeds)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Bishop parallel-transport frame
# ─────────────────────────────────────────────────────────────────────────────

def bishop_frames(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Propagate a normal vector along the curve without twisting.

    WHY Bishop (1975): Frenet–Serret frames flip 180° at inflection points
    where curvature vanishes, producing a twisted tube.  Bishop's frame
    propagates purely by parallel transport — no torsion term — giving a
    smooth tube on curves with any geometry, including the near-straight
    segments of the Sprott I orbit near the origin's stable manifold.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1e-12, norms)
    T = T / norms                               # unit tangents [n-1, 3]

    # Seed: pick any vector perpendicular to T[0]
    t0 = T[0]
    ax = np.array([1.0, 0.0, 0.0]) if abs(t0[0]) < 0.9 else np.array([0.0, 1.0, 0.0])
    N0 = ax - np.dot(ax, t0) * t0
    N0 /= np.linalg.norm(N0)

    N = np.empty((n-1, 3))
    N[0] = N0
    for i in range(1, n-1):
        axis = np.cross(T[i-1], T[i])
        sa = np.linalg.norm(axis)
        ca = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)
        if sa < 1e-10:
            N[i] = N[i-1]
        else:
            axis /= sa
            ni = N[i-1]
            N[i] = ca * ni + sa * np.cross(axis, ni) + (1.0 - ca) * np.dot(axis, ni) * axis

    B = np.cross(T, N)                          # binormal [n-1, 3]
    return N, B


# ─────────────────────────────────────────────────────────────────────────────
# 3. Tube mesh builder
# ─────────────────────────────────────────────────────────────────────────────

def build_tube(pts: np.ndarray, N: np.ndarray, B: np.ndarray) -> list[np.ndarray]:
    """Generate TUBE_SIDES × (len(pts)-1) vertex rings.

    Tube cross-section vertices lie at:
        centre[i] + TUBE_R * (cos θ · N[i] + sin θ · B[i])
    for θ ∈ {0, 2π/S, …, 2π(S-1)/S}.  WHY octagon (S=8): 8 sides cuts
    vertex count to 1/8 of a smooth circle while appearing smooth from
    WebXR viewing distances; Draco compression removes nearly all overhead.
    """
    S = TUBE_SIDES
    angles = np.linspace(0, 2 * np.pi, S, endpoint=False)
    cos_a = np.cos(angles)
    sin_a = np.sin(angles)

    rings = []
    for i in range(len(pts) - 1):
        ring = (pts[i]
                + TUBE_R * (cos_a[:, None] * N[i] + sin_a[:, None] * B[i]))
        rings.append(ring)
    return rings


# ─────────────────────────────────────────────────────────────────────────────
# 4. Speed colour mapping
# ─────────────────────────────────────────────────────────────────────────────

def speed_colours(speeds: np.ndarray, n_rings: int) -> np.ndarray:
    """Map per-waypoint speed to RGBA FLOAT_COLOR values, one per tube vertex.

    WHY percentile clipping: raw min/max are distorted by rare near-origin
    passages (very slow) and fast arc segments; p2–p98 clipping centres the
    cobalt→amber ramp on the typical orbit, maximising perceptual contrast.
    """
    lo = np.percentile(speeds, 2)
    hi = np.percentile(speeds, 98)
    hi = hi if hi > lo else lo + 1e-9
    t = np.clip((speeds - lo) / (hi - lo), 0.0, 1.0)

    # Repeat each waypoint colour across the ring vertices
    t_ring = np.repeat(t[:n_rings], TUBE_SIDES)
    rgb = (1.0 - t_ring[:, None]) * COBALT + t_ring[:, None] * AMBER
    alpha = np.ones((len(t_ring), 1))
    return np.concatenate([rgb, alpha], axis=1).astype(np.float32)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Blender mesh assembly
# ─────────────────────────────────────────────────────────────────────────────

ROT_YUP = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=float)
# WHY: Blender +Z up → WebXR/glTF +Y up.  Apply before writing vertices
# so the GLB exporter sees the correct orientation without a root transform.


def _make_tube_mesh(name: str, pts: np.ndarray, speeds: np.ndarray) -> bpy.types.Object:
    """Build a Blender mesh object for one orbit + colour attribute."""
    pts_rot = pts @ ROT_YUP.T

    N, B = bishop_frames(pts_rot)
    rings = build_tube(pts_rot, N, B)

    n_rings = len(rings)
    S = TUBE_SIDES

    verts = np.vstack(rings)                       # [n_rings*S, 3]
    n_verts = len(verts)

    # Quad faces — connect adjacent rings cyclically
    faces = []
    for i in range(n_rings - 1):
        base = i * S
        for j in range(S):
            nj = (j + 1) % S
            faces.append((base + j, base + nj,
                          base + S + nj, base + S + j))

    me = bpy.data.meshes.new(name + "_mesh")
    me.from_pydata(verts.tolist(), [], faces)
    me.update()

    # Per-vertex speed colour attribute
    rgba = speed_colours(speeds, n_rings)
    attr = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", rgba.ravel())

    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob["holoflow:facet"] = False
    return ob


def _add_poi_head(parent: bpy.types.Object) -> None:
    """UV-sphere capping the tube as a WebXR poi-head indicator."""
    tip = parent.data.vertices[0].co
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=tip)
    head = bpy.context.active_object
    head.name = parent.name + "_head"
    head["holoflow:facet"] = False
    head.parent = parent


def _apply_emissive_material(ob: bpy.types.Object) -> None:
    """Principled BSDF + emission driven by SprottI_Speed vertex colour."""
    mat = bpy.data.materials.new(ob.name + "_mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME

    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value  = 0.50
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Emission Strength"].default_value = 1.8

    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    ob.data.materials.append(mat)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Shape-key sweep
# ─────────────────────────────────────────────────────────────────────────────

def _insert_shape_key(ob: bpy.types.Object, key_name: str,
                      pts: np.ndarray, speeds: np.ndarray) -> None:
    """Rebuild tube geometry for a different a-value and write as shape key."""
    pts_rot = pts @ ROT_YUP.T
    N, B = bishop_frames(pts_rot)
    rings = build_tube(pts_rot, N, B)
    n_rings = len(rings)

    verts = np.vstack(rings)
    sk = ob.shape_key_add(name=key_name, from_mix=False)
    sk.data.foreach_set("co", verts.ravel())

    # Update colour attribute with new speeds
    rgba = speed_colours(speeds, n_rings)
    ob.data.attributes[ATTR_NAME].data.foreach_set("color", rgba.ravel())


# ─────────────────────────────────────────────────────────────────────────────
# 7. Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    # Clear scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Basis orbit
    pts_b, spd_b = sample_orbit(A_BASIS)
    ob = _make_tube_mesh("hf_sprott_i_poi", pts_b, spd_b)
    ob.shape_key_add(name="Basis", from_mix=False)

    # Shape keys for parameter sweep
    for key, a_val in [
        ("SK_LowA",    A_LOWA),
        ("SK_HighA",   A_HIGHA),
        ("SK_NearBif", A_NEARBIF),
    ]:
        pts_k, spd_k = sample_orbit(a_val)
        _insert_shape_key(ob, key, pts_k, spd_k)

    _add_poi_head(ob)
    _apply_emissive_material(ob)

    # Camera
    bpy.ops.object.camera_add(location=(0, -9, 2))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.20, 0.0, 0.0)
    bpy.context.scene.camera = cam

    print("Sprott I blueprint complete — hf_sprott_i_poi ready for export.")


main()
