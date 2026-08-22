# blueprint.py — Physarum Slime-Mould Transport Network
# Blender 5.1 · Python 3.11 · numpy
# Topic : scripting / procedural
# Licence: CC0
#
# Jeff Jones (2010) described how Physarum polycephalum forages as a sheet of
# microscopic agents that deposit a trail chemical, sense it with three
# forward-facing antennae, and rotate toward the strongest signal.  The result
# is a self-organising transport network that minimises path length while
# remaining fault-tolerant — a biological Steiner tree.
#
# This blueprint runs the Jones algorithm on a toroidal 2-D grid in pure
# numpy, then lifts the trail-density field into a displaced height-field mesh
# in Blender 5.1 for WebXR export.
#
# External reference:
#   Jones, J. 2010 "Characteristics of Pattern Formation and Evolution in
#   Approximations of Physarum Transport Networks" — Int. J. Unconventional
#   Computing 5(1): 3-23.  Algorithm description is in the public domain.
#   https://uwe-repository.worktribe.com/output/980579

import math
import bpy
import numpy as np

# ---------------------------------------------------------------------------
# SIMULATION PARAMETERS
# ---------------------------------------------------------------------------
GRID         = 128        # grid cells per axis (GRID×GRID trail map)
N_AGENTS     = 5000       # number of physarum agents
N_STEPS      = 100        # simulation timesteps
SENSOR_ANGLE = 45.0       # degrees: angular offset of side sensors
SENSOR_DIST  = 9          # cells ahead each sensor samples
ROTATION_ANGLE = 45.0     # degrees agent rotates per step when steered
STEP_SIZE    = 1.0        # cells moved per timestep
DEPOSIT      = 0.6        # trail chemical deposited per agent per step
DECAY        = 0.88       # multiplicative trail decay each step (< 1)

# mesh / export
PLANE_SIZE   = 4.0        # output mesh half-width in metres
HEIGHT_SCALE = 0.70       # vertical displacement for maximum trail density (m)
GLB_PATH     = "//hf_physarum_network.glb"

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------
def _box_blur(a: np.ndarray) -> np.ndarray:
    """3×3 uniform average over toroidal grid — pure numpy, no scipy needed."""
    out = np.zeros_like(a)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            # np.roll wraps at boundaries, matching the toroidal agent motion
            out += np.roll(np.roll(a, dy, axis=0), dx, axis=1)
    return out / 9.0


def _sense(pos: np.ndarray, angles: np.ndarray,
           offset: float, trail: np.ndarray) -> np.ndarray:
    """Sample trail at (SENSOR_DIST) cells ahead at (angle+offset) for all agents."""
    sa = angles + offset
    sx = (pos[:, 0] + SENSOR_DIST * np.cos(sa)).astype(np.int32) % GRID
    sy = (pos[:, 1] + SENSOR_DIST * np.sin(sa)).astype(np.int32) % GRID
    return trail[sy, sx]


# ---------------------------------------------------------------------------
# SIMULATION
# ---------------------------------------------------------------------------
rng = np.random.default_rng(seed=42)

# initialise agents on a central disc so the network grows outward
theta_init  = rng.uniform(0, 2 * math.pi, N_AGENTS)
r_init      = rng.uniform(0, GRID * 0.25, N_AGENTS)
pos         = np.column_stack([
    GRID * 0.5 + r_init * np.cos(theta_init),
    GRID * 0.5 + r_init * np.sin(theta_init),
]).astype(np.float64)
angles      = rng.uniform(0, 2 * math.pi, N_AGENTS)
trail_map   = np.zeros((GRID, GRID), dtype=np.float64)

sa_rad  = math.radians(SENSOR_ANGLE)
rot_rad = math.radians(ROTATION_ANGLE)

for _ in range(N_STEPS):
    # --- SENSE (three antennae: left, forward, right) ---
    fl = _sense(pos, angles, +sa_rad, trail_map)
    fw = _sense(pos, angles,  0.0,    trail_map)
    fr = _sense(pos, angles, -sa_rad, trail_map)

    # --- ROTATE (vectorised, no Python per-agent conditionals) ---
    # When both flanks exceed forward, random wiggle breaks symmetry (Jones §3.2)
    random_turn = (rng.random(N_AGENTS) - 0.5) * 2.0 * rot_rad
    cond_both   = (fl >= fw) & (fr >= fw)
    cond_left   = (fl > fr)  & (fl > fw) & ~cond_both
    cond_right  = (fr > fl)  & (fr > fw) & ~cond_both
    angles = np.where(cond_both,  angles + random_turn,
             np.where(cond_left,  angles + rot_rad,
             np.where(cond_right, angles - rot_rad, angles)))

    # --- MOVE & WRAP (toroidal boundary matches Jones' periodic grid) ---
    pos[:, 0] = (pos[:, 0] + STEP_SIZE * np.cos(angles)) % GRID
    pos[:, 1] = (pos[:, 1] + STEP_SIZE * np.sin(angles)) % GRID

    # --- DEPOSIT: unbuffered scatter-add (np.add.at avoids index collision) ---
    ix = pos[:, 0].astype(np.int32) % GRID
    iy = pos[:, 1].astype(np.int32) % GRID
    np.add.at(trail_map, (iy, ix), DEPOSIT)
    trail_map = trail_map.clip(0.0, 1.0)

    # --- DIFFUSE & DECAY ---
    # diffusion spreads the signal to neighbouring cells (short-range smoothing)
    # decay ensures old trails fade, keeping the map from saturating
    trail_map = (_box_blur(trail_map) * DECAY).clip(0.0, 1.0)

# normalise so peak always reaches 1.0 regardless of parameter variation
trail_map /= trail_map.max()

# ---------------------------------------------------------------------------
# SCENE SETUP
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# ---------------------------------------------------------------------------
# BUILD HEIGHT-FIELD MESH
# ---------------------------------------------------------------------------
# primitive_grid_add creates vertices in row-major order (Y outer, X inner)
# at unit size centred on origin — we scale via PLANE_SIZE afterwards
bpy.ops.mesh.primitive_grid_add(
    x_subdivisions=GRID - 1,
    y_subdivisions=GRID - 1,
    size=2.0,                  # extends ±1.0 in X and Y before scaling
    location=(0.0, 0.0, 0.0),
)
obj  = bpy.context.active_object
mesh = obj.data

# read all vertex coords at once via foreach_get (fast numpy path)
verts_flat = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
mesh.vertices.foreach_get("co", verts_flat)
vco = verts_flat.reshape(-1, 3)

# map each vertex XY in [-1,+1] → grid indices in [0, GRID-1]
gx_idx = np.round((vco[:, 0] + 1.0) * 0.5 * (GRID - 1)).astype(np.int32).clip(0, GRID - 1)
gy_idx = np.round((vco[:, 1] + 1.0) * 0.5 * (GRID - 1)).astype(np.int32).clip(0, GRID - 1)

trail_vals = trail_map[gy_idx, gx_idx]     # (N_verts,) trail intensity at each vertex
vco[:, 0] *= PLANE_SIZE                     # scale X to ±PLANE_SIZE metres
vco[:, 1] *= PLANE_SIZE                     # scale Y
vco[:, 2]  = trail_vals * HEIGHT_SCALE      # Z = displaced height

mesh.vertices.foreach_set("co", vco.ravel())

# flat shading → faceted appearance (holoflow aesthetic)
for poly in mesh.polygons:
    poly.use_smooth = False

mesh.calc_normals_split()

# ---------------------------------------------------------------------------
# VERTEX ATTRIBUTE (used by emission shader)
# ---------------------------------------------------------------------------
attr = mesh.attributes.new("trail_intensity", "FLOAT", "POINT")
attr.data.foreach_set("value", trail_vals.astype(np.float32))
mesh.update()

# ---------------------------------------------------------------------------
# MATERIAL — emission coloured by trail intensity
# ---------------------------------------------------------------------------
mat  = bpy.data.materials.new("physarum_network")
mat.use_nodes = True
tree = mat.node_tree
tree.nodes.clear()

nd_attr  = tree.nodes.new("ShaderNodeAttribute")
nd_attr.attribute_name = "trail_intensity"

nd_ramp  = tree.nodes.new("ShaderNodeValToRGB")
nd_ramp.color_ramp.interpolation = "LINEAR"
nd_ramp.color_ramp.elements[0].position  = 0.0
nd_ramp.color_ramp.elements[0].color     = (0.005, 0.01, 0.06, 1.0)   # deep navy void
nd_ramp.color_ramp.elements[1].position  = 1.0
nd_ramp.color_ramp.elements[1].color     = (0.0, 0.95, 0.85, 1.0)     # bright cyan trunk

# mid-tone: soft violet at 0.4 makes low-density hyphae visible
mid = nd_ramp.color_ramp.elements.new(0.40)
mid.color = (0.45, 0.05, 0.80, 1.0)      # violet

nd_emit  = tree.nodes.new("ShaderNodeEmission")
nd_emit.inputs["Strength"].default_value = 4.0

nd_out   = tree.nodes.new("ShaderNodeOutputMaterial")

tree.links.new(nd_attr.outputs["Fac"],       nd_ramp.inputs["Fac"])
tree.links.new(nd_ramp.outputs["Color"],     nd_emit.inputs["Color"])
tree.links.new(nd_emit.outputs["Emission"],  nd_out.inputs["Surface"])

obj.data.materials.append(mat)
obj.name = "physarum_network"
obj["holoflow:facet"] = True    # studio export flag — flat-shaded faceted mesh

# ---------------------------------------------------------------------------
# SCALE OBJECT & APPLY TRANSFORMS
# ---------------------------------------------------------------------------
# Y-up output: Blender +Z → glTF +Y via export_yup flag
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---------------------------------------------------------------------------
# EEVEE NEXT BLOOM
# ---------------------------------------------------------------------------
scene                                      = bpy.context.scene
scene.render.engine                        = "BLENDER_EEVEE_NEXT"
scene.eevee.bloom_threshold                = 0.40
scene.eevee.bloom_intensity                = 0.20
scene.eevee.bloom_radius                   = 6.0
scene.eevee.use_bloom                      = True

# ---------------------------------------------------------------------------
# GLB EXPORT
# ---------------------------------------------------------------------------
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_apply=True,
    export_yup=True,
    use_selection=False,
)

print(f"[physarum] exported → {GLB_PATH}")
print(f"[physarum] trail_map max={trail_map.max():.4f}  mean={trail_map.mean():.4f}")
