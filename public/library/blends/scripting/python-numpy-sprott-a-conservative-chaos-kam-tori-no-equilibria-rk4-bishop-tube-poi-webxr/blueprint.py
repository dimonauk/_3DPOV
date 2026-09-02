"""
Sprott A Conservative-Chaos Bishop-Transport Tube — Blender 5.1 — CC0
======================================================================
Source  : Sprott JC (1994) "Some simple chaotic flows"
          Phys. Rev. E 50(2):R647–R650
          DOI: 10.1103/PhysRevE.50.R647

System A from Table 1 of Sprott (1994):
    ẋ = y
    ẏ = −x + yz
    ż = 1 − y²

Key properties — what makes this system unusual among the library:

  ① NO equilibria: ẋ=ẏ=ż=0 requires 1=0 (impossible).
    All other attractors in this library have at least one fixed point.

  ② Non-constant divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + z + 0 = z
    The system is neither Hamiltonian (Hamiltonian systems have ∇·F=0) nor
    dissipative (dissipative attractors require ∇·F<0 everywhere).
    However ⟨z⟩ ≈ 0 over the orbit, so phase-volume is conserved on average —
    Liouville's theorem holds in a time-averaged sense.

  ③ NO strange attractor: trajectories do not converge to a lower-dimensional set.
    Instead the phase space is stratified into nested KAM tori (quasi-periodic
    orbits) separated by thin chaotic layers, exactly as in area-preserving 2D
    maps (Chirikov, Zaslavsky).  Different ICs explore different islands.

  ④ Lyapunov spectrum: λ₁ ≈ +0.014, λ₂ ≈ 0.000, λ₃ ≈ −0.014
    The Kaplan–Yorke dimension D_KY = 2 + λ₁/|λ₃| ≈ 2 + 1 = 3 (fills 3-space).
    This confirms the conservative balance: ∑λᵢ ≈ 0.

Four shape keys sample the KAM hierarchy at different IC amplitudes:
  Basis    IC=(0, 0.9, 0)    canonical Sprott A — mixed regular/chaotic
  SK_Torus IC=(0, 0.3, 0)    deep quasi-periodic KAM torus (low amplitude)
  SK_Wide  IC=(0, 1.3, 0)    outer chaotic layer (high amplitude, near-ergodic)
  SK_Shift IC=(0.5, 0.9, 0.5) shifted region — different invariant island

Colour attribute SprottA_Speed encodes orbital speed |ẋ, ẏ, ż|.
  Cobalt (slow)  →  Amber (fast)
Slow segments lie near turning points on the KAM torus; fast segments near the
equatorial crossing where z≈0 and the orbit sweeps most rapidly.
"""

import bpy, math
import numpy as np
from mathutils import Vector

# ── tunable parameters ───────────────────────────────────────────────────────
# Sprott A has no free parameters — the numbers below control sampling only.
DT        = 0.05     # RK4 step; 0.05 gives good accuracy (Sprott used 0.10)
BURN_IN   = 3_000    # warm-up steps discarded to escape transient behaviour
N_TOTAL   = 90_000   # integration steps per initial condition
THIN      = 30       # record every THIN-th step → N_PTS=3000 waypoints
N_PTS     = N_TOTAL // THIN          # = 3000

TUBE_SIDES = 12      # cross-section polygon resolution
TUBE_R     = 0.028   # tube radius in metres
POI_R      = 0.09    # poi-head sphere radius in metres

COBALT = (0.02, 0.10, 0.55, 1.0)   # slow colour  (RGBA)
AMBER  = (0.95, 0.60, 0.00, 1.0)   # fast colour

# Four initial conditions, each revealing a different region of phase space
ICS: dict[str, tuple[float, float, float]] = {
    "Basis":    (0.0,  0.9,  0.0),   # canonical mixed-phase orbit
    "SK_Torus": (0.0,  0.3,  0.0),   # deep quasi-periodic KAM torus
    "SK_Wide":  (0.0,  1.3,  0.0),   # outer chaotic layer, near-ergodic
    "SK_Shift": (0.5,  0.9,  0.5),   # different invariant island
}

OBJ_NAME  = "SprottA_Poi"
MESH_NAME = "SprottA_Mesh"

# ── Sprott A vector field ────────────────────────────────────────────────────
def _deriv(s: np.ndarray) -> np.ndarray:
    """(ẋ, ẏ, ż) for state s=(x, y, z)."""
    x, y, z = s
    return np.array([y, -x + y*z, 1.0 - y*y])

def _rk4(s: np.ndarray, dt: float) -> np.ndarray:
    # Classic 4th-order Runge–Kutta: O(dt⁴) local error.
    k1 = _deriv(s)
    k2 = _deriv(s + 0.5*dt*k1)
    k3 = _deriv(s + 0.5*dt*k2)
    k4 = _deriv(s +     dt*k3)
    return s + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

def integrate(x0: float, y0: float, z0: float) -> tuple[np.ndarray, np.ndarray]:
    """Return (N_PTS,3) trajectory and (N_PTS,) instantaneous speeds."""
    s = np.array([x0, y0, z0], dtype=np.float64)
    for _ in range(BURN_IN):      # discard transient
        s = _rk4(s, DT)
    pts, spd = [], []
    for i in range(N_TOTAL):
        s = _rk4(s, DT)
        if i % THIN == 0:
            pts.append(s.copy())
            d = _deriv(s)
            spd.append(math.sqrt(float(np.dot(d, d))))
    return np.array(pts), np.array(spd)

# ── Bishop parallel-transport frame ─────────────────────────────────────────
def bishop_frames(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Build the Bishop (rotation-minimising) frame along a polygonal path.

    Why Bishop instead of Frenet?
    The Frenet frame is undefined where curvature vanishes and flips by π
    when the path locally straightens.  Sprott A trajectories near KAM torus
    boundaries can be nearly straight for dozens of steps, causing Frenet
    instability.  Bishop transport accumulates no unnecessary twist: the normal
    is propagated by Rodrigues rotation between consecutive tangents only,
    giving a smooth, well-defined frame everywhere.
    """
    n = len(pts)
    T = np.zeros((n, 3))
    for i in range(n - 1):
        v = pts[i+1] - pts[i]
        nrm = float(np.linalg.norm(v))
        T[i] = v / nrm if nrm > 1e-12 else T[max(i-1, 0)]
    T[-1] = T[-2]

    # Seed N[0] orthogonal to T[0]
    ref = np.array([1.0, 0.0, 0.0])
    if abs(float(np.dot(T[0], ref))) > 0.9:
        ref = np.array([0.0, 1.0, 0.0])
    N0 = np.cross(T[0], ref)
    N0 /= np.linalg.norm(N0)

    N_arr = np.zeros((n, 3))
    N_arr[0] = N0
    for i in range(1, n):
        ax  = np.cross(T[i-1], T[i])
        sin = float(np.linalg.norm(ax))
        cos = float(np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0))
        if sin < 1e-10:
            N_arr[i] = N_arr[i-1]
        else:
            ax /= sin
            np_  = N_arr[i-1]
            N_arr[i] = (cos * np_
                        + sin * np.cross(ax, np_)
                        + (1.0 - cos) * np.dot(ax, np_) * ax)
    return T, N_arr, np.cross(T, N_arr)

# ── Tube geometry ─────────────────────────────────────────────────────────────
def tube_verts(pts: np.ndarray, N: np.ndarray, B: np.ndarray) -> np.ndarray:
    angles = np.linspace(0.0, 2*math.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    rings = (pts[:, None, :]
             + TUBE_R * ca[None, :, None] * N[:, None, :]
             + TUBE_R * sa[None, :, None] * B[:, None, :])
    return rings.reshape(-1, 3)  # (N_PTS * TUBE_SIDES, 3)

def tube_quads(n: int) -> list[tuple[int, int, int, int]]:
    s, faces = TUBE_SIDES, []
    for i in range(n - 1):
        for j in range(s):
            a = i*s + j; b = i*s + (j+1) % s
            c = (i+1)*s + (j+1) % s; d = (i+1)*s + j
            faces.append((a, b, c, d))
    return faces

# ── Colour attribute ─────────────────────────────────────────────────────────
def apply_colour(mesh: bpy.types.Mesh, spd: np.ndarray) -> None:
    attr = mesh.attributes.new("SprottA_Speed", "FLOAT_COLOR", "POINT")
    s_min = float(spd.min()); s_max = float(spd.max())
    denom = max(s_max - s_min, 1e-12)
    for i, si in enumerate(spd):
        t = (si - s_min) / denom
        col = tuple(COBALT[c] + t * (AMBER[c] - COBALT[c]) for c in range(4))
        for j in range(TUBE_SIDES):
            attr.data[i * TUBE_SIDES + j].color = col

# ── Material ─────────────────────────────────────────────────────────────────
def make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("SprottA_Mat")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "SprottA_Speed"
    bsdf.inputs["Metallic"].default_value          = 0.50
    bsdf.inputs["Roughness"].default_value         = 0.22
    bsdf.inputs["Emission Strength"].default_value = 1.6
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    return mat

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    scene = bpy.context.scene
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete()

    orbits: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    for key, (x0, y0, z0) in ICS.items():
        orbits[key] = integrate(x0, y0, z0)

    pts_b, spd_b = orbits["Basis"]
    _, N_b, B_b  = bishop_frames(pts_b)
    verts_b      = tube_verts(pts_b, N_b, B_b)
    faces        = tube_quads(N_PTS)

    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata(list(map(tuple, verts_b)), [], faces)
    mesh.update(); apply_colour(mesh, spd_b)

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    scene.collection.objects.link(obj)

    obj.shape_key_add(name="Basis", from_mix=False)
    for key in ("SK_Torus", "SK_Wide", "SK_Shift"):
        pts_k, _ = orbits[key]
        _, N_k, B_k = bishop_frames(pts_k)
        verts_k = tube_verts(pts_k, N_k, B_k)
        sk = obj.shape_key_add(name=key, from_mix=False)
        for i, v in enumerate(verts_k):
            sk.data[i].co = tuple(v)

    mat = make_material()
    obj.data.materials.append(mat)
    obj["holoflow:facet"] = False

    # Poi head at first waypoint
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=POI_R, location=tuple(pts_b[0]), segments=16, ring_count=8)
    poi = bpy.context.active_object
    poi.name = "SprottA_Poi_Head"; poi.data.materials.append(mat)
    poi["holoflow:facet"] = False

    # +Y-up convention for WebXR export
    obj.rotation_euler = (-math.pi/2, 0.0, 0.0)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(rotation=True, scale=True)

    bpy.ops.wm.save_as_mainfile(filepath="//hf_sprott_a_poi.blend")
    bpy.ops.export_scene.gltf(
        filepath="//hf_sprott_a_poi.glb",
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print("✓ Sprott A blueprint complete")

if __name__ == "__main__":
    main()
