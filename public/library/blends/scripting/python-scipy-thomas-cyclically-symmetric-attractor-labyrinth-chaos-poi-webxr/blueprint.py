"""
Thomas' Cyclically Symmetric Attractor — Labyrinth Chaos
Three Interlocked Poi Light Trails for WebXR · Blender 5.1 · Holoflow Studio

Thomas' system has exact Z₃ cyclic symmetry: the vector field is invariant
under the permutation (x,y,z)→(y,z,x). This means three trajectories started
at (x₀,0,0), (0,x₀,0) and (0,0,x₀) are identical up to a 120° rotation in
phase space. We use that symmetry to build three colour-coded poi trails that
are geometrically equivalent — the same choreography on three planes.

At b≈0.208186, the system undergoes a symmetry-breaking bifurcation. Above it,
orbits converge to a single symmetric strange attractor. Below it (b=0.19),
Thomas called this "labyrinth chaos": the orbit diffuses across all of ℝ³ via
phase-space corridors, never returning to where it started. We integrate at
b=0.208 to get a bounded, beautiful shape, and note the labyrinth regime.

Source: Thomas, R. (1999). Int. J. Bifurc. Chaos 9(10):1889–1905. Public domain.
"""

import sys
import subprocess

for _pkg in ("numpy", "scipy"):
    try:
        __import__(_pkg)
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", _pkg])

import numpy as np
from scipy.integrate import solve_ivp
import bpy

# ── Parameters ────────────────────────────────────────────────────────────────
B          = 0.208      # damping; bifurcation at ≈0.208186; try 0.19 for labyrinth
T_SPAN     = (0.0, 500.0)  # integration window (Thomas units)
DT_MAX     = 0.04       # max RK45 step — tighter than RK4 to catch tight spirals
RTOL       = 1e-9       # relative tolerance for adaptive step selection
ATOL       = 1e-11      # absolute tolerance; Thomas has slow linear damping
DOWNSAMPLE = 6          # keep every 6th integrated point as a spline vertex
BEVEL_R    = 0.010      # tube radius in metres
BEVEL_SEGS = 8          # cross-section polygon sides
EMIT       = 4.0        # emission strength in Blender's linear light units
SCALE      = 0.28       # world scale (attractor spans ≈±7 → ±2 m scene)
DRACO_LVL  = 6          # Draco mesh compression, level 0–10

# Z₃-symmetric initial conditions: (x₀,0,0), (0,x₀,0), (0,0,x₀)
# The orbit from the first IC, rotated 120° in phase space, is the second IC.
_X0 = 0.1
INITIAL_CONDITIONS = [
    np.array([_X0, 0.0, 0.0]),
    np.array([0.0, _X0, 0.0]),
    np.array([0.0, 0.0, _X0]),
]

# Emission colours (sRGB) — warm red / cold blue / spring green
COLOURS = [
    (0.95, 0.30, 0.12),
    (0.12, 0.55, 0.95),
    (0.18, 0.90, 0.40),
]

OUTPUT_GLB  = "//hf_thomas.glb"
COLLECTION  = "HF_Thomas"

# ── Thomas ODE ────────────────────────────────────────────────────────────────
def thomas(t, y, b=B):
    """
    dx/dt = sin(y) − b·x
    dy/dt = sin(z) − b·y
    dz/dt = sin(x) − b·z

    The sine coupling provides bounded nonlinearity without divergence; −b·x is
    linear damping. The cubic Z₃ symmetry (x,y,z)→(y,z,x) is exact.
    """
    x, y_, z = y
    return [np.sin(y_) - b * x,
            np.sin(z)  - b * y_,
            np.sin(x)  - b * z]

# ── Integration ───────────────────────────────────────────────────────────────
def integrate_thomas(ic: np.ndarray) -> np.ndarray:
    """
    Integrate Thomas' ODE with RK45 (adaptive step size).

    RK45 outperforms fixed-step RK4 here because Thomas' orbit slows
    dramatically near the saddle-focus equilibria at (±π,±π,±π) — an
    adaptive solver spends extra evaluations only where the trajectory
    curves sharply, maintaining accuracy without uniformly tiny steps.
    """
    sol = solve_ivp(
        thomas, T_SPAN, ic,
        method="RK45",
        max_step=DT_MAX,
        rtol=RTOL,
        atol=ATOL,
        dense_output=False,
    )
    pts = sol.y.T[::DOWNSAMPLE]   # (M, 3), downsampled control verts
    return pts * SCALE

# ── Blender helpers ───────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)

def ensure_collection(name: str):
    if name not in bpy.data.collections:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return bpy.data.collections[name]

def make_emission_mat(name: str, colour: tuple, strength: float):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = (*colour, 1.0)
    emit.inputs["Strength"].default_value = strength
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

def pts_to_nurbs(name: str, pts: np.ndarray, mat, coll) -> bpy.types.Object:
    """
    Build a cubic NURBS curve with a round bevel, then convert to mesh.

    NURBS chosen over Bezier: uniform-weight NURBS with endpoint interpolation
    (use_endpoint_u=True, order_u=4) gives C² continuity and passes through the
    first and last control points — useful for clean start/end caps.

    Convert-to-mesh before GLB export because the Blender glTF exporter does
    not evaluate NURBS splines; it skips curve objects silently.
    """
    crv = bpy.data.curves.new(name + "_crv", "CURVE")
    crv.dimensions      = "3D"
    crv.bevel_mode      = "ROUND"
    crv.bevel_depth     = BEVEL_R
    crv.bevel_resolution = BEVEL_SEGS
    crv.use_fill_caps   = True
    crv.resolution_u    = 2       # spline resolution between control points

    sp = crv.splines.new("NURBS")
    sp.points.add(len(pts) - 1)   # one point already exists by default
    for i, (x, y, z) in enumerate(pts):
        sp.points[i].co = (x, y, z, 1.0)  # homogeneous coords (w=1)
    sp.use_endpoint_u = True
    sp.order_u        = 4         # cubic NURBS

    obj = bpy.data.objects.new(name, crv)
    coll.objects.link(obj)
    bpy.context.scene.collection.objects.link(obj)  # needed for convert op

    # Convert to mesh — required for glTF export
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.data.materials.append(mat)

    # Shade smooth — per-face normal interpolation makes the tube look round
    bpy.ops.object.shade_smooth()

    bpy.context.scene.collection.objects.unlink(obj)
    return obj

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    coll = ensure_collection(COLLECTION)

    for i, ic in enumerate(INITIAL_CONDITIONS):
        pts = integrate_thomas(ic)
        mat = make_emission_mat(f"HF_Thomas_{i}", COLOURS[i], EMIT)
        pts_to_nurbs(f"Thomas_{i}", pts, mat, coll)
        print(f"  Trajectory {i}: {len(pts)} control points, "
              f"span ≈ {pts.max(axis=0) - pts.min(axis=0)}")

    # Black world
    world = bpy.data.worlds.new("HF_World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
    bpy.context.scene.world = world

    # Deselect, then export all objects in COLLECTION
    bpy.ops.object.select_all(action="DESELECT")
    for obj in coll.objects:
        obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LVL,
        export_image_format="WEBP",
        export_yup=True,
    )
    print(f"Exported → {OUTPUT_GLB}")

if __name__ == "__main__":
    main()
