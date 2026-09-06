"""
Hydraulic Erosion — Particle-Droplet Method on FBM Terrain (Blender 5.1)
=========================================================================
Technique: Simulate rainfall as individual water droplets that flow
downhill, eroding material proportional to speed × slope × water volume,
depositing when capacity is exceeded, evaporating until stopped.
Bake four erosion stages into a 128×128 stage-floor height-field.

Algorithm (MIT): Sebastian Lague — "Hydraulic Erosion" (2019–2023)
  https://github.com/SebLague/Hydraulic-Erosion
  Physics: ẋ = inertia·dx − (1−inertia)·∇H;  capacity = slope·speed·water·K

Shape keys: Basis (raw FBM) / SK_Eroded (40k drops) /
            SK_Rivers (100k total) / SK_Deposition (soft pass)
Colour attr: Erosion_Depth  (red=channel, white=plateau, blue=alluvial fan)
"""

import bpy, bmesh
import numpy as np
from mathutils import noise, Vector

# ── grid ─────────────────────────────────────────────────────────────────────
GRID_N       = 128           # vertices per side (128×128=16384V, 16129Q)
WORLD_SCALE  = 4.0           # mesh spans WORLD_SCALE × WORLD_SCALE metres
HEIGHT_SCALE = 0.70          # max terrain height (m)

# ── FBM ──────────────────────────────────────────────────────────────────────
FBM_OCTAVES  = 6
LACUNARITY   = 2.0
FBM_GAIN     = 0.5
FBM_SCALE    = 3.2           # spatial frequency of first octave
SEED         = Vector((47.33, 31.71, 13.07))

# ── erosion (Basis pass: 40k drops) ──────────────────────────────────────────
N_DROPS_BASIS  = 40_000
N_DROPS_RIVERS = 100_000
MAX_STEPS      = 64
INERTIA        = 0.05        # momentum: 0 = pure gradient, 1 = no steering
CAPACITY_K     = 8.0         # sediment carrying-capacity factor
MIN_SLOPE      = 0.01        # floor on slope term (prevents division problems)
ERODE_SPEED    = 0.30        # fraction of deficit eroded per step
DEPOSIT_SPEED  = 0.30        # fraction of surplus deposited per step
EVAP_RATE      = 0.01        # water evaporated per step
GRAVITY        = 4.0         # speed gain on downhill step
INIT_SPEED     = 1.0
INIT_VOL       = 1.0
STOP_WATER     = 0.01

# ── colour ────────────────────────────────────────────────────────────────────
ATTR_NAME    = "Erosion_Depth"
COL_ERODED   = np.array([0.820, 0.140, 0.040])  # red   = river channel
COL_NEUTRAL  = np.array([0.900, 0.900, 0.900])  # white = plateau
COL_DEPOSIT  = np.array([0.020, 0.200, 0.760])  # blue  = alluvial fan


# ─────────────────────────────────────────────────────────────────────────────
# 1. FBM heightmap via Blender's mathutils.noise
# ─────────────────────────────────────────────────────────────────────────────

def build_fbm(n, scale, octaves, lacunarity, gain, seed):
    """Return (n×n) float32 in [0,1] via mathutils turbulence FBM."""
    H, step = np.empty((n, n), dtype=np.float32), 1.0 / (n - 1)
    for yi in range(n):
        for xi in range(n):
            pos = Vector((xi*step*scale, yi*step*scale, 0.0)) + seed
            H[yi, xi] = (noise.turbulence(
                pos, octaves, hard=False, noise_basis='PERLIN_ORIGINAL',
                amplitude_scale=gain, frequency_scale=lacunarity) + 1.0) * 0.5
    return H


# ── bilinear helpers ─────────────────────────────────────────────────────────

def _bilerp(H, px, py):
    """Height + gradient at continuous grid position (px, py).  No bounds check."""
    x0, y0 = int(px), int(py)
    u, v   = px - x0, py - y0
    h00 = H[y0,   x0];   h10 = H[y0,   x0+1]
    h01 = H[y0+1, x0];   h11 = H[y0+1, x0+1]
    h  = h00*(1-u)*(1-v) + h10*u*(1-v) + h01*(1-u)*v + h11*u*v
    gx = (h10-h00)*(1-v) + (h11-h01)*v   # ∂h/∂x
    gy = (h01-h00)*(1-u) + (h11-h10)*u   # ∂h/∂y
    return h, gx, gy

def _splat(A, x0, y0, u, v, amount):
    """Bilinearly distribute `amount` onto the 4 nearest grid cells."""
    A[y0,   x0]   += amount * (1-u) * (1-v)
    A[y0,   x0+1] += amount *    u  * (1-v)
    A[y0+1, x0]   += amount * (1-u) *    v
    A[y0+1, x0+1] += amount *    u  *    v


# ── erosion simulation ───────────────────────────────────────────────────────

def erode(H_in, n_drops, rng):
    """Run `n_drops` droplets; return (eroded_H, depth_map)."""
    H          = H_in.copy()
    depth_map  = np.zeros_like(H)   # +ve = eroded, −ve = deposited
    N          = H.shape[0]

    for _ in range(n_drops):
        px = rng.uniform(1.5, N - 2.5)
        py = rng.uniform(1.5, N - 2.5)
        dx, dy   = 0.0, 0.0
        speed    = INIT_SPEED
        water    = INIT_VOL
        sediment = 0.0

        for _step in range(MAX_STEPS):
            x0, y0 = int(px), int(py)
            if x0 < 1 or x0 >= N-2 or y0 < 1 or y0 >= N-2:
                break

            h, gx, gy = _bilerp(H, px, py)
            # inertia blend: steer toward downslope (−∇H)
            dx = dx * INERTIA - gx * (1.0 - INERTIA)
            dy = dy * INERTIA - gy * (1.0 - INERTIA)
            dlen = max(1e-9, (dx*dx + dy*dy) ** 0.5)
            dx /= dlen;  dy /= dlen

            nx, ny = px + dx, py + dy
            if nx < 1 or nx >= N-2 or ny < 1 or ny >= N-2:
                break

            new_h, _, _ = _bilerp(H, nx, ny)
            dh = new_h - h   # +ve → climbing uphill

            slope    = max(MIN_SLOPE, abs(dh) / dlen)
            capacity = slope * speed * water * CAPACITY_K

            x0i, y0i = int(px), int(py)
            ui, vi   = px - x0i, py - y0i

            if sediment > capacity or dh > 0.0:
                # deposit excess (or everything if forced uphill)
                if dh > 0.0:
                    deposit = min(dh, sediment)
                else:
                    deposit = (sediment - capacity) * DEPOSIT_SPEED
                deposit = max(0.0, deposit)
                sediment -= deposit
                _splat(H,         x0i, y0i, ui, vi,  deposit)
                _splat(depth_map, x0i, y0i, ui, vi, -deposit)  # −ve = deposition
            else:
                # erode
                erode_amt = min((capacity - sediment) * ERODE_SPEED, -dh)
                erode_amt = max(0.0, erode_amt)
                sediment += erode_amt
                _splat(H,         x0i, y0i, ui, vi, -erode_amt)
                _splat(depth_map, x0i, y0i, ui, vi,  erode_amt)  # +ve = erosion

            speed  = max(0.01, (max(0.0, speed * speed - dh * GRAVITY)) ** 0.5)
            water *= 1.0 - EVAP_RATE
            if water < STOP_WATER:
                break
            px, py = nx, ny

    return H, depth_map


# ── mesh construction ────────────────────────────────────────────────────────

def build_mesh(name, H):
    """GRID_N×GRID_N quad mesh from height array H.  Returns bpy object."""
    N, step = H.shape[0], WORLD_SCALE / (H.shape[0] - 1)
    verts = [(-WORLD_SCALE/2 + xi*step, -WORLD_SCALE/2 + yi*step,
              float(H[yi, xi]) * HEIGHT_SCALE)
             for yi in range(N) for xi in range(N)]
    faces = [(yi*N+xi, yi*N+xi+1, (yi+1)*N+xi+1, (yi+1)*N+xi)
             for yi in range(N-1) for xi in range(N-1)]
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.from_pydata(verts, [], faces)
    me.validate(); me.update()
    return ob


def add_shape_key(ob, name, H):
    """Add a shape key to ob whose positions come from height array H."""
    N    = H.shape[0]
    step = WORLD_SCALE / (N - 1)
    sk   = ob.shape_key_add(name=name, from_mix=False)
    for yi in range(N):
        for xi in range(N):
            idx = yi*N + xi
            sk.data[idx].co.z = float(H[yi, xi]) * HEIGHT_SCALE
    return sk


def colour_from_depth(depth_map):
    """Map depth_map values to per-vertex float colours (Erosion_Depth)."""
    d = depth_map.ravel()
    d_norm = np.where(d >= 0,
                       np.clip(d / max(d.max(), 1e-9), 0, 1),
                      -np.clip(d / min(d.min(), -1e-9), 0, 1))
    # d_norm: +1 = max-eroded (red), 0 = neutral (white), -1 = max-deposited (blue)
    cols = np.where(
        d_norm[:, None] >= 0,
        COL_NEUTRAL + d_norm[:, None] * (COL_ERODED  - COL_NEUTRAL),
        COL_NEUTRAL + d_norm[:, None] * (COL_NEUTRAL - COL_DEPOSIT),
    ).clip(0, 1)
    return cols


# ── material ─────────────────────────────────────────────────────────────────

def make_material(ob, attr_name):
    mat = bpy.data.materials.new("Mat_HydroErosion")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = attr_name; attr.attribute_type = 'GEOMETRY'
    nt.links.new(attr.outputs["Color"], diff.inputs["Color"])
    nt.links.new(diff.outputs["BSDF"],  out.inputs["Surface"])
    ob.data.materials.append(mat)


# ── main ─────────────────────────────────────────────────────────────────────

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

rng = np.random.default_rng(seed=42)

# FBM terrain
print("Building FBM heightmap…")
H_raw = build_fbm(GRID_N, FBM_SCALE, FBM_OCTAVES, LACUNARITY, FBM_GAIN, SEED)

# Erosion passes
print("Running erosion pass 1 (40k drops)…")
H_eroded, depth_40k = erode(H_raw, N_DROPS_BASIS, rng)

print("Running erosion pass 2 (+60k drops → 100k total)…")
H_rivers, depth_100k = erode(H_eroded, N_DROPS_RIVERS - N_DROPS_BASIS, rng)

# Gentle deposition (very high capacity → lots of material deposited back)
H_depo = H_raw.copy()
depth_depo = np.zeros_like(H_depo)
_deposit_rng = np.random.default_rng(seed=99)
H_depo, depth_depo = erode(H_depo, 8_000, _deposit_rng)

# Build mesh from Basis (raw FBM)
ob = build_mesh("hydraulic_erosion_floor", H_raw)

# Shape keys
ob.shape_key_add(name="Basis", from_mix=False)        # already built into mesh
add_shape_key(ob, "SK_Eroded",     H_eroded)
add_shape_key(ob, "SK_Rivers",     H_rivers)
add_shape_key(ob, "SK_Deposition", H_depo)

# Vertex colour attribute (from 40k erosion depth)
cols = colour_from_depth(depth_40k)
attr = ob.data.color_attributes.new(
    name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
for i, c in enumerate(cols):
    attr.data[i].color = (c[0], c[1], c[2], 1.0)

# UV for GLB export
bpy.context.view_layer.objects.active = ob
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.001)
bpy.ops.object.mode_set(mode='OBJECT')

make_material(ob, ATTR_NAME)

# Apply transforms for GLB export (+Y-up handled by exporter)
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
ob.data.name = "hydraulic_erosion_floor"

print(f"Done — {len(ob.data.vertices)}V {len(ob.data.polygons)}Q")
print("Shape keys:", [sk.name for sk in ob.data.shape_keys.key_blocks])
