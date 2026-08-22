"""
Gray-Scott Reaction-Diffusion — Turing Morphogenesis on a UV-Sphere Poi Head  (Blender 5.1)
============================================================================================
Technique:
  Alan Turing's 1952 "Chemical Basis of Morphogenesis" paper proposed that two
  interacting chemicals — an activator and an inhibitor — diffusing at different
  rates can spontaneously break spatial symmetry and form the patterns seen on
  animal coats, seashells, and embryonic tissue.  Gray & Scott (1983) gave the
  canonical two-variable formulation now called the Gray-Scott model:

      ∂u/∂t = D_u ∇²u  −  u·v²  +  F·(1 − u)
      ∂v/∂t = D_v ∇²v  +  u·v²  −  (F + k)·v

  where u (activator, substrate) and v (inhibitor, product) have diffusion
  constants D_u and D_v; F is a "feed" rate injecting u; k is a "kill" rate
  removing v.  The (F, k) plane is divided into named regimes — α-pearls,
  β-worm stripes, δ-labyrinthine, ε-holes, λ-Turing spots — each with a
  distinct topology.

  This blueprint runs five independent simulations on a 128×128 periodic grid,
  one per regime, then samples the resulting v-field onto the UV-sphere vertices
  using bilinear interpolation over the UV map.  The displacement is applied
  along each vertex's normal.  The first regime ("spots") forms the base mesh;
  the remaining four are stored as shape keys so the poi head can morph between
  pattern types in a WebXR scene.

Source:
  Mathematical framework: Turing AM 1952 "The Chemical Basis of Morphogenesis."
  Phil Trans R Soc B 237(641):37-72.  Public domain (pre-1978 UK Crown copyright,
  not renewed in US).  Regime parameters adapted from Pearson JE 1993 "Complex
  Patterns in a Simple System." Science 261(5118):189-192.  This implementation
  is an independent CC0 authoring by Holoflow Studio.
"""

import math
import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ─── Parameters ──────────────────────────────────────────────────────────────
GRID           = 128          # simulation grid side (power-of-two for FFT clarity)
SIM_STEPS      = 4000         # integration steps per regime
DT             = 1.0          # forward-Euler timestep (stable for D≤0.25, dt=1)
D_U            = 0.200        # activator diffusion constant
D_V            = 0.100        # inhibitor diffusion constant
SEED_RADIUS    = 6            # initial v-seed disc radius in grid cells

SPHERE_RADIUS  = 0.55         # poi head radius in Blender units
SPHERE_SEGS_U  = 64           # longitude segments (must be even)
SPHERE_SEGS_V  = 32           # latitude rings
DISP_SCALE     = 0.07         # max radial displacement from v-concentration
OBJ_NAME       = "gs_morphogenesis_poi"
EXPORT_PATH    = "//gs_morphogenesis_poi.glb"

# (F, k) regime table — name, feed, kill, colour (RGBA linear)
REGIMES = [
    ("spots",        0.035, 0.060, (0.08, 0.55, 0.78, 1.0)),   # α-pearls
    ("worm_stripes", 0.037, 0.063, (0.92, 0.68, 0.10, 1.0)),   # β-stripes
    ("labyrinthine", 0.046, 0.059, (0.78, 0.20, 0.45, 1.0)),   # δ-labyrinthine
    ("holes",        0.022, 0.051, (0.18, 0.78, 0.38, 1.0)),   # ε-holes
    ("fingerprints", 0.014, 0.054, (0.95, 0.38, 0.18, 1.0)),   # λ-Turing
]


# ─── Step 1: Laplacian & Gray-Scott Integrator ────────────────────────────────

def _laplacian(arr):
    """5-point stencil Laplacian with periodic (torus) boundary conditions.
    Using np.roll avoids explicit boundary checks and keeps the hot path
    inside numpy's C layer — critical for 128×128 × 4000 steps in pure Python."""
    return (
        np.roll(arr, +1, axis=0) +
        np.roll(arr, -1, axis=0) +
        np.roll(arr, +1, axis=1) +
        np.roll(arr, -1, axis=1) -
        4.0 * arr
    )


def run_gray_scott(F: float, k: float) -> np.ndarray:
    """
    Run a Gray-Scott simulation from a centred disc seed.
    Returns v-field [0,1]^(GRID×GRID) after SIM_STEPS forward-Euler steps.

    WHY forward Euler instead of RK4:
      The Gray-Scott system is numerically stiff only when D_u is large relative
      to dt.  With D_u=0.2, D_v=0.1, dt=1.0 the explicit scheme stays stable
      (Von Neumann criterion: D*dt/dx² = 0.2 ≤ 0.25 for dx=1).  RK4 would
      quadruple cost per step for no visible accuracy improvement in the
      asymptotic steady state we care about.

    WHY centre seed instead of random noise:
      A small localised perturbation lets the pattern grow outward from a
      well-defined front.  Uniform noise produces the final pattern faster but
      hides the beautiful Turing front propagation.  We use a disc so the
      symmetry breaking is visible from the first 200 steps.
    """
    u = np.ones((GRID, GRID), dtype=np.float64)
    v = np.zeros((GRID, GRID), dtype=np.float64)

    # Seed: small disc of (u=0.5, v=0.25) near centre — breaks symmetry
    cx, cy = GRID // 2, GRID // 2
    r = SEED_RADIUS
    for i in range(cx - r, cx + r + 1):
        for j in range(cy - r, cy + r + 1):
            if (i - cx)**2 + (j - cy)**2 <= r * r:
                u[i, j] = 0.50 + np.random.uniform(-0.01, 0.01)
                v[i, j] = 0.25 + np.random.uniform(-0.01, 0.01)

    for _ in range(SIM_STEPS):
        Lu = _laplacian(u)
        Lv = _laplacian(v)
        uvv = u * v * v
        du = D_U * Lu - uvv + F * (1.0 - u)
        dv = D_V * Lv + uvv - (F + k) * v
        u += DT * du
        v += DT * dv
        # Clamp to physical range — can drift marginally negative with float noise
        np.clip(u, 0.0, 1.0, out=u)
        np.clip(v, 0.0, 1.0, out=v)

    return v


# ─── Step 2: Simulate all regimes ─────────────────────────────────────────────

np.random.seed(42)  # deterministic seed so every record.py run matches

print("Gray-Scott: running 5 simulations …  (each ~30s on a laptop CPU)")
regime_fields = []
for name, F, k, _ in REGIMES:
    print(f"  regime '{name}' F={F} k={k} …")
    v_field = run_gray_scott(F, k)
    regime_fields.append(v_field)
    print(f"    v range [{v_field.min():.4f}, {v_field.max():.4f}]")


# ─── Step 3: Build the UV sphere ──────────────────────────────────────────────

def sample_v_on_sphere(v_field, vertices):
    """
    Bilinear sample of v_field at each vertex's UV coordinate.

    The standard Blender UV sphere maps longitude θ ∈ [0, 2π) → U ∈ [0, 1]
    and latitude φ ∈ [-π/2, π/2] → V ∈ [0, 1].  We invert from the 3D vertex
    position to avoid storing a UV layer before bmesh to mesh conversion.

    WHY bilinear and not nearest-neighbour:
      The sphere has 64×32 = 2048 vertices mapping onto a 128×128 grid.
      Nearest-neighbour aliasing produces a grid-aligned faceting that fights
      the organic Turing pattern.  Bilinear removes that artefact.
    """
    N = GRID
    displacements = []
    for v in vertices:
        # Spherical coordinates from Cartesian (Y-up Blender convention)
        nx, ny, nz = v.co.x, v.co.y, v.co.z
        norm = math.sqrt(nx*nx + ny*ny + nz*nz)
        if norm < 1e-9:
            displacements.append(0.0)
            continue
        nx, ny, nz = nx/norm, ny/norm, nz/norm

        lon = math.atan2(nx, nz)            # atan2(x, z) → longitude in [-π, π]
        lat = math.asin(max(-1.0, min(1.0, ny)))   # latitude in [-π/2, π/2]

        u_coord = (lon / (2.0 * math.pi) + 0.5) % 1.0   # [0, 1)
        v_coord = (lat / math.pi + 0.5)                   # [0, 1]

        fx = u_coord * (N - 1)
        fy = v_coord * (N - 1)
        ix, iy = int(fx), int(fy)
        tx, ty = fx - ix, fy - iy

        ix0, ix1 = ix % N, (ix + 1) % N
        iy0, iy1 = min(iy, N-1), min(iy + 1, N-1)

        val = (
            v_field[iy0, ix0] * (1-tx) * (1-ty) +
            v_field[iy0, ix1] *    tx  * (1-ty) +
            v_field[iy1, ix0] * (1-tx) *    ty  +
            v_field[iy1, ix1] *    tx  *    ty
        )
        displacements.append(val)
    return displacements


# Remove any previous object
for name in [OBJ_NAME]:
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

bpy.ops.mesh.primitive_uv_sphere_add(
    segments=SPHERE_SEGS_U,
    ring_count=SPHERE_SEGS_V,
    radius=SPHERE_RADIUS,
    location=(0, 0, 0),
)
obj = bpy.context.active_object
obj.name = OBJ_NAME

# Shade smooth before any displacement so normals are per-face-smooth
bpy.ops.object.shade_smooth()


# ─── Step 4: Displace base shape (regime 0 = spots) ──────────────────────────

me = obj.data
bm = bmesh.new()
bm.from_mesh(me)
bm.verts.ensure_lookup_table()

base_disps = sample_v_on_sphere(regime_fields[0], bm.verts)

for i, v in enumerate(bm.verts):
    d = base_disps[i]
    # Displace outward along vertex normal
    v.co += v.normal * (d * DISP_SCALE)

bm.to_mesh(me)
bm.free()
me.update()


# ─── Step 5: Shape keys for remaining regimes ────────────────────────────────

# WHY shape keys instead of separate objects:
#   Shape keys allow real-time morphing in GLTF (via morph targets) and let
#   the WebXR scene animate between morphologies with a single mesh draw call.
#   Separate objects would require mesh swaps + fade transitions = more JS code.

obj.shape_key_add(name="Basis", from_mix=False)

for regime_idx in range(1, len(REGIMES)):
    name = REGIMES[regime_idx][0]
    sk = obj.shape_key_add(name=name, from_mix=False)
    sk.value = 0.0

    disps = sample_v_on_sphere(regime_fields[regime_idx], obj.data.vertices)

    # We need the BASE displaced positions (regime 0) to compute the delta
    bm2 = bmesh.new()
    bm2.from_mesh(obj.data)
    bm2.verts.ensure_lookup_table()
    base_cos = [Vector(v.co) for v in bm2.verts]
    bm2.free()

    for i, vert in enumerate(obj.data.vertices):
        base_pos = base_cos[i]
        normal = Vector(vert.normal)
        new_pos = base_pos + normal * ((disps[i] - base_disps[i]) * DISP_SCALE)
        sk.data[i].co = new_pos


# ─── Step 6: Vertex colours from spots regime v-field ────────────────────────

colour_layer = obj.data.color_attributes.new(
    name="rd_concentration",
    type="FLOAT_COLOR",
    domain="POINT",
)
base_disps_arr = np.array(base_disps)
r_col, g_col, b_col, a_col = REGIMES[0][3]
for i, val in enumerate(base_disps_arr):
    t = float(val)
    colour_layer.data[i].color = (
        r_col * t,
        g_col * t + (1-t) * 0.02,
        b_col * (1-t) + t * 0.85,
        a_col,
    )


# ─── Step 7: Material (Principled BSDF, vertex colour driven) ─────────────────

mat = bpy.data.materials.new(name="GrayScottRD")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

output  = nodes.new("ShaderNodeOutputMaterial")
bsdf    = nodes.new("ShaderNodeBsdfPrincipled")
vcol    = nodes.new("ShaderNodeVertexColor")
vcol.layer_name = "rd_concentration"

bsdf.inputs["Roughness"].default_value = 0.35
bsdf.inputs["Metallic"].default_value  = 0.15

links.new(vcol.outputs["Color"],  bsdf.inputs["Base Color"])
links.new(bsdf.outputs["BSDF"],   output.inputs["Surface"])

output.location  = (300, 0)
bsdf.location    = (0, 0)
vcol.location    = (-300, 0)

if obj.data.materials:
    obj.data.materials[0] = mat
else:
    obj.data.materials.append(mat)


# ─── Step 8: Apply transforms and export ─────────────────────────────────────

bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

obj["holoflow:facet"] = False   # smooth poi head, not faceted

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    use_selection=True,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_morph=True,
    export_morph_normal=False,
    export_colors=True,
)

print(f"Exported → {EXPORT_PATH}")
print("Regime shape keys:", [sk.name for sk in obj.data.shape_keys.key_blocks])
