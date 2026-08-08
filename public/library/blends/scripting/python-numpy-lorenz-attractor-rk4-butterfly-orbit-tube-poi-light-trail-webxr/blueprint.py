"""
Lorenz Attractor — RK4 Integration, Butterfly Orbit & Poi Light-Trail Tube Mesh
=================================================================================
The Lorenz system (1963) is the archetypal example of deterministic chaos:

  dx/dt = σ(y − x)
  dy/dt = x(ρ − z) − y
  dz/dt = xy − βz

Parameters σ=10, ρ=28, β=8/3 place the system in the chaotic regime where
trajectories converge onto the Lorenz butterfly attractor — a fractal set with
Hausdorff dimension ≈ 2.06.  Two nearby trajectories diverge exponentially
with Lyapunov exponent λ₁ ≈ 0.906; a system is "predictable" only for
t ≪ 1/λ₁ ≈ 1.1 time units.

Studio use: each wing of the butterfly maps to one poi tether arm.  We integrate
two adjacent initial conditions (Δx = ε) to show divergence, and extrude a tube
along each orbit.  Both tubes share a common emission palette (wing A = blue-
white, wing B = red-amber) and are exported as a single Draco-6 GLB.

Technique: direct bpy.data / bmesh API, no bpy.ops context.  RK4 integration
in numpy; Bishop parallel-transport frame for tube cross-sections.
"""

import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
σ, ρ, β    = 10.0, 28.0, 8.0 / 3.0   # Classic Lorenz parameters (chaotic regime)
DT         = 0.003   # RK4 time step (smaller → smoother tube, larger file)
N_STEPS    = 18000   # Integration steps; 18 000 × 0.003 = 54 time units ≈ 2 attractors
SKIP       = 500     # Skip transient before orbit settles onto attractor
THIN       = 4       # Keep every Nth RK4 step for mesh vertices (reduces polygon count)
IC_A       = np.array([0.1,  0.0, 0.0])   # Initial condition wing A
IC_B       = np.array([0.1 + 1e-4, 0.0, 0.0])  # Δx = 1e-4; diverges after ≈ 10 t.u.

TUBE_R     = 0.035   # Cross-section radius
N_CIRC     = 6       # Cross-section polygon sides
MESH_SCALE = 0.06    # Scale attractor (native coords span ~40; map to ~2.4 m)
OUTPUT_GLB = "//hf_lorenz.glb"

# Emission colours for wing A and wing B
COL_A = (0.15, 0.55, 1.00, 1.0)   # ice-blue  — converging arm
COL_B = (1.00, 0.35, 0.05, 1.0)   # ember     — diverging arm
# ─────────────────────────────────────────────────────────────────────────────


def lorenz_deriv(state: np.ndarray) -> np.ndarray:
    """
    Returns (dx/dt, dy/dt, dz/dt) for the Lorenz system.
    WHY a function: RK4 calls the derivative 4 times per step; factoring
    avoids repeating the formula and makes σ/ρ/β easy to modify.
    """
    x, y, z = state
    return np.array([σ * (y - x), x * (ρ - z) - y, x * y - β * z])


def integrate_rk4(ic: np.ndarray, n_steps: int, dt: float, skip: int) -> np.ndarray:
    """
    RK4 integration of the Lorenz system.

    WHY RK4 over Euler: Euler's error is O(dt²) per step, cumulative O(dt).
    RK4's local error is O(dt⁵), cumulative O(dt⁴).  For dt=0.003 this means
    RK4 is about 1 000× more accurate for the same step count, keeping the
    orbit faithful to the true attractor geometry rather than spiralling off it.
    The butterfly wing-crossing structure depends on this accuracy.
    """
    out = []
    s   = ic.copy()
    for i in range(n_steps + skip):
        k1 = lorenz_deriv(s)
        k2 = lorenz_deriv(s + 0.5 * dt * k1)
        k3 = lorenz_deriv(s + 0.5 * dt * k2)
        k4 = lorenz_deriv(s + dt * k3)
        s  = s + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        if i >= skip:
            out.append(s.copy())
    return np.array(out)


def build_tube(name: str, pts: np.ndarray, tube_r: float, n_circ: int,
               col: bpy.types.Collection) -> bpy.types.Object:
    """
    Tube mesh along an open orbit path via Bishop parallel-transport frame.
    Open path (first and last rings are capped with centre vertices).
    """
    N = len(pts)
    # Wrapped tangents via central differences (open path: extend at ends)
    padded = np.concatenate([pts[:1], pts, pts[-1:]], axis=0)
    fwd    = padded[2:] - padded[:-2]
    fwd   /= np.linalg.norm(fwd, axis=1, keepdims=True) + 1e-12

    seed = np.array([0.0, 0.0, 1.0])
    if abs(float(fwd[0] @ seed)) > 0.85:
        seed = np.array([0.0, 1.0, 0.0])
    nor    = np.empty_like(fwd)
    r0     = seed - np.dot(seed, fwd[0]) * fwd[0]
    nor[0] = r0 / (np.linalg.norm(r0) + 1e-12)
    for i in range(1, N):
        r    = nor[i-1] - np.dot(nor[i-1], fwd[i]) * fwd[i]
        ln   = np.linalg.norm(r)
        nor[i] = r / ln if ln > 1e-12 else nor[i-1]
    bin_ = np.cross(fwd, nor)

    bm   = bmesh.new()
    angs = np.linspace(0, 2*math.pi, n_circ, endpoint=False)
    cos_a, sin_a = np.cos(angs), np.sin(angs)

    rings = []
    for i in range(N):
        ring = [bm.verts.new(Vector(pts[i] + tube_r*(cos_a[j]*nor[i] + sin_a[j]*bin_[i])))
                for j in range(n_circ)]
        rings.append(ring)

    # Barrel quads
    for i in range(N - 1):
        r0c, r1c = rings[i], rings[i+1]
        for j in range(n_circ):
            j1 = (j+1) % n_circ
            bm.faces.new([r0c[j], r0c[j1], r1c[j1], r1c[j]])

    # End caps
    for ring, centre_pt in [(rings[0], pts[0]), (rings[-1], pts[-1])]:
        cv = bm.verts.new(Vector(centre_pt))
        for j in range(n_circ):
            bm.faces.new([ring[j], ring[(j+1) % n_circ], cv])

    me = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(me); bm.free(); me.update()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    return ob


def make_emission_mat(name: str, rgba: tuple, strength: float = 4.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes; links = mat.node_tree.links; nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    em  = nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = rgba
    em.inputs["Strength"].default_value = strength
    links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


# ─── SCENE RESET ─────────────────────────────────────────────────────────────
for ob in list(bpy.data.objects):   bpy.data.objects.remove(ob,   do_unlink=True)
for me in list(bpy.data.meshes):    bpy.data.meshes.remove(me,    do_unlink=True)
for ma in list(bpy.data.materials): bpy.data.materials.remove(ma, do_unlink=True)
col = bpy.context.scene.collection

# ─── INTEGRATION ─────────────────────────────────────────────────────────────
pts_a = integrate_rk4(IC_A, N_STEPS, DT, SKIP)[::THIN] * MESH_SCALE
pts_b = integrate_rk4(IC_B, N_STEPS, DT, SKIP)[::THIN] * MESH_SCALE
print(f"[Lorenz] Orbit A: {len(pts_a)} verts  Orbit B: {len(pts_b)} verts")

# ─── ROOT EMPTY ──────────────────────────────────────────────────────────────
root = bpy.data.objects.new("LorenzAttractor", None)
root.empty_display_type = "SPHERE"; root.empty_display_size = 0.05
col.objects.link(root)
root["holoflow:facet"] = True

# ─── BUILD TUBES ─────────────────────────────────────────────────────────────
mat_a = make_emission_mat("LorenzA", COL_A)
mat_b = make_emission_mat("LorenzB", COL_B)
ob_a  = build_tube("Lorenz_WingA", pts_a, TUBE_R, N_CIRC, col)
ob_b  = build_tube("Lorenz_WingB", pts_b, TUBE_R, N_CIRC, col)
ob_a.data.materials.append(mat_a); ob_a.parent = root
ob_b.data.materials.append(mat_b); ob_b.parent = root

# ─── GLB EXPORT ──────────────────────────────────────────────────────────────
for ob in bpy.data.objects:
    ob.select_set(ob is root or ob.parent is root)
bpy.ops.export_scene.gltf(
    filepath           = bpy.path.abspath(OUTPUT_GLB),
    export_format      = "GLB",
    use_selection      = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_yup          = True,
    export_apply        = True,
    export_animations   = False,
)
print(f"[Lorenz] GLB → {bpy.path.abspath(OUTPUT_GLB)}")
