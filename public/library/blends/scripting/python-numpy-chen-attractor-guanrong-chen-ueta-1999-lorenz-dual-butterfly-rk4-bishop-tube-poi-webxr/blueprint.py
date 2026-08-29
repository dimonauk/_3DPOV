"""
Chen Attractor — blueprint.py
Blender 5.1 · bpy + numpy · CC0

Technique: The Chen attractor (Guanrong Chen & Ueta 1999) is a three-variable
autonomous ODE that is the simplest known "anti-dual" of the Lorenz system.
Where Lorenz contracts in y (∂ẏ/∂y = -1), Chen's y-equation has a direct
expansion term (+cy), making the two attractors topologically different despite
sharing the same double-lobe butterfly silhouette. Both have CONSTANT phase-space
divergence — a rare property that lets Liouville's theorem give an exact sanity
check on numerical integration: ∑λᵢ = div = -a + c - b = -10 for canonical params.

Source: Chen G & Ueta T (1999) Yet Another Chaotic Attractor.
  Int J Bifurc Chaos 9(7):1465-1466. DOI: 10.1142/S0218127499001024
  Mathematical content is public domain.
"""

import bpy
import numpy as np
from math import pi

# ── Parameters ─────────────────────────────────────────────────────────────────
A_CHEN     = 35.0   # contraction coefficient — same structural role as Lorenz σ
B_CHEN     = 3.0    # z-decay rate — same structural role as Lorenz β
C_BASIS    = 28.0   # coupling strength; canonical chaos; divergence = -35+28-3 = -10
C_PERIODIC = 23.0   # near Hopf bifurcation (c ≈ 22); yields stable limit cycle
C_WING     = 31.0   # denser chaotic wings; D_KY shifts toward 2.22
A_LU       = 36.0   # Lü system (Chen 2002): bridge from Lorenz (α→0) to Chen (α→1)
C_LU       = 20.0   # Lü canonical coupling

# WHY these step / count choices:
#   λ₁ ≈ 2.03 → Lyapunov time ≈ 0.49 s → DT=0.002 gives ~245 steps per τ
#   Chen is faster than Thomas (τ≈26) but slower than Rössler
DT         = 0.002
BURN_IN    = 3_000  # ≈ 6 Lyapunov times; attractor converges in < 2 τ
N_STEPS    = 60_000 # recorded steps
SKIP       = 20     # → 3 000 waypoints (same resolution as Lorenz studio entry)
TUBE_SIDES = 12     # smooth enough for WebXR; 12-gon ≈ 1.5 % deviation from circle
TUBE_R     = 0.014  # metres — thin relative to lobe separation; avoids self-intersection
POI_R      = 0.082  # standard Holoflow poi head sphere radius

COBALT  = (0.06, 0.14, 0.66, 1.0)  # slow / near saddle-focus
AMBER   = (0.88, 0.52, 0.04, 1.0)  # fast / through open manifold

OBJ_NAME    = "Chen_Attractor_Poi"
MESH_NAME   = "Chen_Attractor_Mesh"
MAT_NAME    = "ChenCol_Mat"
ATTR_NAME   = "Chen_Speed"
EXPORT_PATH = "//chen_attractor_poi.glb"


# ── ODE ────────────────────────────────────────────────────────────────────────
def _deriv(s: np.ndarray, a: float, b: float, c: float) -> np.ndarray:
    """
    ẋ = a(y − x)       ← contraction toward y, same as Lorenz
    ẏ = (c−a)x − xz + cy   ← the +cy term is what differentiates Chen from Lorenz
    ż = xy − bz
    div = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = −a + c − b  (constant, no position dependence)
    """
    x, y, z = s
    return np.array([a*(y - x),
                     (c - a)*x - x*z + c*y,
                     x*y - b*z], dtype=np.float64)


def _rk4(s: np.ndarray, a: float, b: float, c: float, dt: float) -> np.ndarray:
    k1 = _deriv(s,               a, b, c)
    k2 = _deriv(s + 0.5*dt*k1,  a, b, c)
    k3 = _deriv(s + 0.5*dt*k2,  a, b, c)
    k4 = _deriv(s + dt*k3,      a, b, c)
    return s + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(a: float, b: float, c: float) -> tuple[np.ndarray, np.ndarray]:
    """Returns (waypoints [N_WAY, 3], speed [N_WAY])."""
    s = np.array([-0.1, 0.5, 0.2], dtype=np.float64)
    for _ in range(BURN_IN):
        s = _rk4(s, a, b, c, DT)

    n_way = N_STEPS // SKIP
    pts   = np.empty((n_way, 3), dtype=np.float64)
    spd   = np.empty(n_way,      dtype=np.float64)
    i_out = 0
    for i in range(N_STEPS):
        d = _deriv(s, a, b, c)
        if i % SKIP == 0:
            pts[i_out] = s
            spd[i_out] = float(np.linalg.norm(d))
            i_out += 1
        s = _rk4(s, a, b, c, DT)
    return pts, spd


# ── Bishop Parallel-Transport Frame ───────────────────────────────────────────
def bishop_frame(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Rodrigues minimal rotation: propagates N₀ without twist accumulation.
    Why Bishop over Frenet: Chen's trajectory has near-zero curvature stretches
    where Frenet's binormal is undefined; Bishop is smooth everywhere.
    Returns (N, B) unit-vector arrays; T computed internally.
    """
    n = len(pts)
    T = np.empty((n, 3), dtype=np.float64)
    T[0]    = pts[1]  - pts[0];   T[0]    /= np.linalg.norm(T[0])
    T[-1]   = pts[-1] - pts[-2];  T[-1]   /= np.linalg.norm(T[-1])
    T[1:-1] = pts[2:] - pts[:-2]
    nm      = np.linalg.norm(T[1:-1], axis=1, keepdims=True)
    T[1:-1] /= np.where(nm < 1e-12, 1.0, nm)

    seed = np.array([0., 1., 0.]) if abs(T[0, 1]) < 0.9 else np.array([1., 0., 0.])
    N0 = seed - T[0]*np.dot(seed, T[0]); N0 /= np.linalg.norm(N0)
    N = np.empty((n, 3), dtype=np.float64); N[0] = N0
    for i in range(1, n):
        ax    = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(ax)
        cos_a = float(np.dot(T[i-1], T[i]))
        if sin_a < 1e-10:
            N[i] = N[i-1]
        else:
            ax /= sin_a
            N[i] = (cos_a*N[i-1]
                    + sin_a*np.cross(ax, N[i-1])
                    + (1.0 - cos_a)*np.dot(ax, N[i-1])*ax)
    B = np.cross(T, N)
    return N, B


def tube_verts(pts: np.ndarray, N: np.ndarray, B: np.ndarray) -> np.ndarray:
    angles = np.linspace(0, 2*pi, TUBE_SIDES, endpoint=False)
    ca = np.cos(angles); sa = np.sin(angles)
    rings = (pts[:, None, :]
             + TUBE_R*(ca[None, :, None]*N[:, None, :]
                       + sa[None, :, None]*B[:, None, :]))
    return rings.reshape(-1, 3)


def tube_faces(n_way: int) -> list[tuple[int, ...]]:
    s = TUBE_SIDES
    return [(i*s+j, i*s+(j+1)%s, (i+1)*s+(j+1)%s, (i+1)*s+j)
            for i in range(n_way - 1) for j in range(s)]


# ── Colour ─────────────────────────────────────────────────────────────────────
def speed_to_colours(spd: np.ndarray) -> np.ndarray:
    """
    Slow (near saddle-focus neighbourhoods) → cobalt.
    Fast (through open manifold channels) → amber.
    The two lobes of Chen are NOT symmetric in speed — one arm is consistently
    faster, a visible indicator of the broken y-symmetry vs Lorenz.
    """
    t     = spd / (spd.max() + 1e-12)
    t_rep = np.repeat(t, TUBE_SIDES)
    cols  = np.empty((len(t_rep), 4), dtype=np.float32)
    for ch, c0, c1 in zip(range(3), COBALT[:3], AMBER[:3]):
        cols[:, ch] = c0 + t_rep*(c1 - c0)
    cols[:, 3] = 1.0
    return cols


# ── Mesh & material ───────────────────────────────────────────────────────────
def make_mesh(pts_raw: np.ndarray, spd: np.ndarray) -> bpy.types.Mesh:
    centre = pts_raw.mean(axis=0)
    pts    = pts_raw - centre
    pts   *= POI_R / np.linalg.norm(pts, axis=1).max()

    N_f, B_f = bishop_frame(pts)
    verts     = tube_verts(pts, N_f, B_f)
    faces     = tube_faces(len(pts))
    cols      = speed_to_colours(spd)

    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata(verts.tolist(), [], faces)
    mesh.update()
    attr = mesh.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", cols.ravel())
    return mesh


def make_material(mesh: bpy.types.Mesh) -> None:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    t = mat.node_tree; t.nodes.clear()
    attr  = t.nodes.new("ShaderNodeAttribute");      attr.attribute_name = ATTR_NAME
    bsdf  = t.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value          = 0.45
    bsdf.inputs["Roughness"].default_value         = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.8
    out   = t.nodes.new("ShaderNodeOutputMaterial")
    t.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    t.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    t.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    mesh.materials.append(mat)


def add_shape_key(obj: bpy.types.Object, name: str,
                  a: float, b: float, c: float) -> None:
    """
    Full re-integration at new (a, b, c) parameters.  Vertex count is
    guaranteed identical (N_STEPS // SKIP × TUBE_SIDES) because those constants
    are not modified per-key.  This means Blender's morph interpolation is a
    geometric warp animating the parameter change — not a physics simulation.
    """
    pts_raw, _ = integrate(a, b, c)
    centre = pts_raw.mean(axis=0)
    pts    = pts_raw - centre
    pts   *= POI_R / np.linalg.norm(pts, axis=1).max()
    N_f, B_f = bishop_frame(pts)
    verts    = tube_verts(pts, N_f, B_f)
    sk = obj.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", verts.ravel().astype(np.float32))


# ── Entry point ───────────────────────────────────────────────────────────────
def run() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)

    pts_basis, spd_basis = integrate(A_CHEN, B_CHEN, C_BASIS)
    mesh = make_mesh(pts_basis, spd_basis)
    make_material(mesh)

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    obj.shape_key_add(name="Basis", from_mix=False)
    add_shape_key(obj, "SK_Periodic", A_CHEN, B_CHEN, C_PERIODIC)
    add_shape_key(obj, "SK_Wing",     A_CHEN, B_CHEN, C_WING)
    add_shape_key(obj, "SK_Lu",       A_LU,   B_CHEN, C_LU)

    obj["holoflow:facet"]       = True
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:export_name"] = "chen_attractor_poi"
    obj["holoflow:topic"]       = "chen-attractor"

    # +Y up for WebXR (Blender default is Z-up; WebXR/GLB is Y-up)
    obj.rotation_euler = (pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(rotation=True)

    bpy.ops.export_scene.gltf(
        filepath                             = EXPORT_PATH,
        export_format                        = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
        export_morph                         = True,
        export_colors                        = True,
    )
    n_v = len(mesh.vertices)
    print(f"[chen-attractor] blueprint complete — {n_v:,} vertices "
          f"({N_STEPS // SKIP} waypoints × {TUBE_SIDES} sides)")


if __name__ == "__main__":
    run()
