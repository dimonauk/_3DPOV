# ============================================================
# MAGNETIC PENDULUM — FRACTAL BASIN OF ATTRACTION
# Blender 5.1 · bpy + numpy · CC0
# ============================================================
#
# A damped magnetic pendulum hangs above three magnets fixed at
# the vertices of an equilateral triangle.  Starting from rest at
# every grid point the pendulum settles above whichever magnet
# wins the tug-of-war.  Which one depends on the starting position
# in a fractal pattern: the basin boundary is nowhere differentiable
# and has Hausdorff dimension > 1 (fractal basin boundary theorem,
# Grebogi–Ott–Yorke 1983).
#
# THIS SCRIPT maps the simulation onto a Blender stage-floor mesh:
#   vertex Z  = time to settle (normalised) × HEIGHT_SCALE
#              → fractal ridges mark the hard-to-decide regions
#   vertex colour = magnet identity (cobalt / amber / violet)
#              → basin map is literal vertex-paint colouring
#
# Reduced 2-D equations (z held at pendulum equilibrium height):
#   ẍ = −k·x − d·ẋ + Σᵢ Mᵢ·(xᵢ−x) / rᵢ³
#   ÿ = −k·y − d·ẏ + Σᵢ Mᵢ·(yᵢ−y) / rᵢ³
#   rᵢ = sqrt((x−xᵢ)² + (y−yᵢ)² + H²)
#
# H² prevents the force singularity when the bob passes directly
# over a magnet; H ≈ pendulum-bob-height above the magnet plane.
# ============================================================

import bpy
import numpy as np

# ─── parameters ───────────────────────────────────────────────
SLUG          = "hf_magpend"        # GLB root name
GRID_N        = 120                 # grid resolution (120²=14 400 V)
GRID_EXTENT   = 2.2                 # physical extent ±m

K_SPRING      = 0.20               # restoring spring constant
D_BASIS       = 0.30               # basis damping (moderate fractal)
D_HIGH        = 0.50               # SK_HighDamp: smoother basins
D_LOW         = 0.15               # SK_LowDamp: more intricate boundary
M_STRENGTH    = 1.00               # magnet strength scalar
H_ABOVE       = 0.50               # bob height above magnet plane (m)
DT            = 0.05               # RK4 timestep
MAX_STEPS     = 3000               # integration limit per grid point
CONV_VEL      = 0.012              # |v| < CONV_VEL → considered settling
CONV_DIST     = 0.14               # proximity to magnet for convergence
HEIGHT_SCALE  = 0.32               # max vertex Z displacement (m)

# Equilateral triangle magnet positions (radius 1.0 from centre)
_R = 1.0
MAGNETS_3 = np.array([
    [_R * np.cos(np.pi / 2),                _R * np.sin(np.pi / 2)               ],
    [_R * np.cos(np.pi / 2 + 2*np.pi / 3), _R * np.sin(np.pi / 2 + 2*np.pi / 3)],
    [_R * np.cos(np.pi / 2 + 4*np.pi / 3), _R * np.sin(np.pi / 2 + 4*np.pi / 3)],
], dtype=np.float64)

# Square magnet layout for shape-key variant (4 magnets)
MAGNETS_4 = np.array([[ 1., 1.], [-1., 1.], [-1.,-1.], [ 1.,-1.]],
                     dtype=np.float64) / np.sqrt(2.0)

# Per-magnet RGBA colours (cobalt / amber / violet / teal)
COL_3 = np.array([
    [0.10, 0.42, 0.88, 1.0],
    [0.94, 0.58, 0.04, 1.0],
    [0.60, 0.08, 0.78, 1.0],
], dtype=np.float32)

COL_4 = np.array([
    [0.10, 0.42, 0.88, 1.0],
    [0.94, 0.58, 0.04, 1.0],
    [0.60, 0.08, 0.78, 1.0],
    [0.08, 0.78, 0.52, 1.0],
], dtype=np.float32)


# ─── simulation ───────────────────────────────────────────────
def _deriv(state: np.ndarray, magnets: np.ndarray,
           k: float, d: float, m: float, h: float) -> np.ndarray:
    """Vectorised RHS for N pendulums simultaneously.

    state  : (N, 4) — columns [x, y, vx, vy]
    Returns: (N, 4) — derivatives [vx, vy, ax, ay]

    WHY vectorise over grid points: the 14 400-point grid must
    run thousands of RK4 steps.  A Python loop per point would
    take minutes; a numpy batch over all active points per step
    reduces wall-time to seconds.
    """
    x, y, vx, vy = state[:, 0], state[:, 1], state[:, 2], state[:, 3]
    dx  = magnets[:, 0][None, :] - x[:, None]   # (N, M)
    dy  = magnets[:, 1][None, :] - y[:, None]
    r2  = dx**2 + dy**2 + h**2                   # add h² to avoid 1/0
    r3  = r2 ** 1.5
    fx  = np.sum(m * dx / r3, axis=1)            # (N,)
    fy  = np.sum(m * dy / r3, axis=1)
    ax  = -k * x - d * vx + fx
    ay  = -k * y - d * vy + fy
    return np.stack([vx, vy, ax, ay], axis=1)


def simulate(magnets: np.ndarray, damping: float,
             gx: np.ndarray, gy: np.ndarray) -> tuple:
    """Return (which_magnet, settle_fraction) for every grid point.

    settle_fraction ∈ [0,1]: 0 = settled immediately, 1 = never settled.
    The step at which a grid point converges is the primary signal —
    points near basin boundaries take the longest and rise highest.
    """
    N      = len(gx)
    state  = np.zeros((N, 4), dtype=np.float64)
    state[:, 0] = gx
    state[:, 1] = gy
    which  = np.full(N, -1, dtype=np.int32)
    steps  = np.full(N, float(MAX_STEPS), dtype=np.float64)
    active = np.ones(N, dtype=bool)

    for step in range(MAX_STEPS):
        if not active.any():
            break
        s  = state[active]
        k1 = _deriv(s,                magnets, K_SPRING, damping, M_STRENGTH, H_ABOVE)
        k2 = _deriv(s + 0.5*DT*k1,   magnets, K_SPRING, damping, M_STRENGTH, H_ABOVE)
        k3 = _deriv(s + 0.5*DT*k2,   magnets, K_SPRING, damping, M_STRENGTH, H_ABOVE)
        k4 = _deriv(s + DT*k3,        magnets, K_SPRING, damping, M_STRENGTH, H_ABOVE)
        state[active] = s + (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

        idx  = np.where(active)[0]
        spd  = np.hypot(state[idx, 2], state[idx, 3])
        slow = spd < CONV_VEL
        if slow.any():
            px = state[idx[slow], 0]
            py = state[idx[slow], 1]
            for mi in range(len(magnets)):
                dist   = np.hypot(px - magnets[mi, 0], py - magnets[mi, 1])
                at_mi  = dist < CONV_DIST
                settle = idx[slow][at_mi]
                which[settle] = mi
                steps[settle] = float(step)
                active[settle] = False

    # Fallback: unconverged points → nearest magnet by final position
    unc = np.where(which == -1)[0]
    if len(unc):
        px = state[unc, 0]
        py = state[unc, 1]
        dists = np.stack([np.hypot(px - m[0], py - m[1]) for m in magnets], axis=1)
        which[unc] = dists.argmin(axis=1)

    return which, steps / MAX_STEPS


# ─── mesh builder ─────────────────────────────────────────────
def _build_mesh(which: np.ndarray, settle_frac: np.ndarray,
                magnets: np.ndarray, colours: np.ndarray,
                obj: bpy.types.Object) -> None:
    """Write vertex positions + colour attribute from simulation results.

    The height ramp is intentionally NOT linear: we apply a gamma > 1
    so that slow-converging (boundary) points are relatively taller,
    making the fractal ridgeline more dramatic.
    """
    import bmesh
    me  = obj.data
    bm  = bmesh.new()
    bm.from_mesh(me)

    z = (settle_frac ** 0.7) * HEIGHT_SCALE     # gamma 0.7 → lift boundaries
    coords = np.stack([GX.ravel(), GY.ravel(), z], axis=1)

    for i, v in enumerate(bm.verts):
        v.co.x = coords[i, 0]
        v.co.y = coords[i, 1]
        v.co.z = coords[i, 2]

    bm.to_mesh(me)
    bm.free()
    me.update()

    # Colour: MAGNET_COLOUR, brightness modulated by settle speed
    # slow-settling points (boundary) get a brighter highlight
    brightness = 0.45 + settle_frac * 0.55     # [0.45, 1.0]
    rgba = colours[which].copy()               # (N, 4)
    rgba[:, :3] *= brightness[:, None]

    attr = me.attributes.get("MagPendCol")
    if attr:
        me.attributes.remove(attr)
    attr = me.attributes.new("MagPendCol", "FLOAT_COLOR", "POINT")
    flat = rgba.ravel().astype(np.float32)
    attr.data.foreach_set("color", flat)


# ─── grid ─────────────────────────────────────────────────────
xs = np.linspace(-GRID_EXTENT, GRID_EXTENT, GRID_N)
ys = np.linspace(-GRID_EXTENT, GRID_EXTENT, GRID_N)
GX, GY = np.meshgrid(xs, ys, indexing="ij")
gx_flat = GX.ravel()
gy_flat = GY.ravel()
N_VERTS = GRID_N * GRID_N

# Quad face connectivity (vectorised)
i_idx = np.arange(GRID_N - 1)
j_idx = np.arange(GRID_N - 1)
II, JJ = np.meshgrid(i_idx, j_idx, indexing="ij")
v00 = (II * GRID_N + JJ).ravel()
v10 = ((II + 1) * GRID_N + JJ).ravel()
v11 = ((II + 1) * GRID_N + JJ + 1).ravel()
v01 = (II * GRID_N + JJ + 1).ravel()
FACES = np.stack([v00, v10, v11, v01], axis=1).tolist()

# ─── scene setup ──────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

me = bpy.data.meshes.new("MagPendFloor")
ob = bpy.data.objects.new("MagPendFloor", me)
bpy.context.collection.objects.link(ob)

verts_init = [(float(gx_flat[i]), float(gy_flat[i]), 0.0) for i in range(N_VERTS)]
me.from_pydata(verts_init, [], FACES)
me.update()
for p in me.polygons:
    p.use_smooth = False

# ─── basis simulation (3 magnets, d=0.30) ─────────────────────
print("Simulating Basis (d=0.30, 3 magnets)…")
w0, sf0 = simulate(MAGNETS_3, D_BASIS, gx_flat, gy_flat)
_build_mesh(w0, sf0, MAGNETS_3, COL_3, ob)
ob.shape_key_add(name="Basis", from_mix=False)

# ─── SK_HighDamp (d=0.50) ─────────────────────────────────────
print("Simulating SK_HighDamp (d=0.50)…")
w1, sf1 = simulate(MAGNETS_3, D_HIGH, gx_flat, gy_flat)
z1 = (sf1 ** 0.7) * HEIGHT_SCALE
b1 = 0.45 + sf1 * 0.55
r1 = COL_3[w1].copy(); r1[:, :3] *= b1[:, None]
sk = ob.shape_key_add(name="SK_HighDamp", from_mix=False)
co1 = np.stack([gx_flat, gy_flat, z1], axis=1).ravel().astype(np.float32)
sk.data.foreach_set("co", co1)

# ─── SK_LowDamp (d=0.15) ──────────────────────────────────────
print("Simulating SK_LowDamp (d=0.15)…")
w2, sf2 = simulate(MAGNETS_3, D_LOW, gx_flat, gy_flat)
z2 = (sf2 ** 0.7) * HEIGHT_SCALE
sk2 = ob.shape_key_add(name="SK_LowDamp", from_mix=False)
co2 = np.stack([gx_flat, gy_flat, z2], axis=1).ravel().astype(np.float32)
sk2.data.foreach_set("co", co2)

# ─── SK_4Mag (4 magnets, d=0.30) ──────────────────────────────
print("Simulating SK_4Mag (4 magnets, d=0.30)…")
w3, sf3 = simulate(MAGNETS_4, D_BASIS, gx_flat, gy_flat)
z3 = (sf3 ** 0.7) * HEIGHT_SCALE
sk3 = ob.shape_key_add(name="SK_4Mag", from_mix=False)
co3 = np.stack([gx_flat, gy_flat, z3], axis=1).ravel().astype(np.float32)
sk3.data.foreach_set("co", co3)

# ─── material ─────────────────────────────────────────────────
mat = bpy.data.materials.new("MagPend")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial")
emi = nt.nodes.new("ShaderNodeEmission")
atr = nt.nodes.new("ShaderNodeAttribute")
atr.attribute_name = "MagPendCol"
nt.links.new(atr.outputs["Color"], emi.inputs["Color"])
emi.inputs["Strength"].default_value = 1.5
nt.links.new(emi.outputs["Emission"], out.inputs["Surface"])
me.materials.append(mat)

# ─── holoflow metadata ────────────────────────────────────────
ob["holoflow:facet"]    = True
ob["holoflow:category"] = "stage-floor"
ob["holoflow:topic"]    = "magnetic-pendulum-basin"
ob["holoflow:slug"]     = SLUG

# ─── export ───────────────────────────────────────────────────
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
ob.rotation_euler = (-1.5707963, 0.0, 0.0)   # +Y-up
bpy.ops.object.transform_apply(rotation=True)

import os
blend_dir = bpy.path.abspath("//")
if not blend_dir:
    blend_dir = os.path.expanduser("~")

glb_path = os.path.join(blend_dir, f"{SLUG}.glb")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_colors=True,
    export_morph=True,
    export_morph_normal=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)
print(f"GLB exported → {glb_path}")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, f"{SLUG}.blend"))
print("Done.")
