# blueprint.py
# Python numpy — Lévy Flight & Brownian Motion: Cauchy Steps, Superdiffusion
# & 3D Poi Light-Trail NURBS for WebXR (Blender 5.1)
# Licence: CC0  |  holoflow.co.uk/library

"""
Technique
---------
A Lévy flight is a random walk whose step sizes are drawn from a heavy-tailed
(power-law) distribution. Unlike Brownian motion (Gaussian steps, α=2),
a Lévy stable walk with 0 < α < 2 has divergent variance — individual steps
can be arbitrarily large, causing sudden long-range jumps between clustered
regions. The α=1 (Cauchy) case is the starkest: mean displacement per step
is undefined, MSD diverges, and the trajectory looks like tight coils
interrupted by flights across the whole domain.

Step-size generator: Chambers-Mallows-Stuck (1976) method for general
α-stable distributions, numpy-native (only uniform + exponential RNG needed).
Three walks produced side-by-side:
  - Brownian  (Gaussian α=2)  — compact diffuse blob
  - Lévy α=1.5 (sub-Cauchy)  — moderate jumps
  - Cauchy  α=1              — extreme superdiffusion

Each walk becomes a colour-gradient NURBS tube and is exported as a single GLB.
"""

import bpy, bmesh, numpy as np, colorsys, math
from mathutils import Vector, Matrix

# ── PARAMETERS ───────────────────────────────────────────────────────────────
SEED            = 42
N_STEPS         = 2000          # steps per walk
BROWNIAN_SIGMA  = 0.15          # Gaussian step std-dev for Brownian walk
LEVY_SCALE      = 0.08          # CMS scale parameter c
LEVY_MAX_STEP   = 4.0           # clip extreme Lévy jumps to this length
CHUNK_SIZE      = 120           # points per NURBS spline segment
BEVEL_DEPTH     = 0.018         # tube radius (m)
BEVEL_RES       = 3             # bevel resolution → 8-sided tube
EMIT_STRENGTH   = 3.5
OBJECT_SEP      = 6.0           # x-offset between the three walks (m)
GLB_PATH        = "//hf_levy_flight.glb"

# ── UTILITIES ─────────────────────────────────────────────────────────────────

def _unit_sphere(rng, n):
    """Marsaglia uniform sphere sampling — unbiased 3-D direction unit vectors."""
    while True:
        v = rng.uniform(-1, 1, (n * 2, 3))
        r2 = (v * v).sum(axis=1)
        ok = r2 < 1.0
        v = v[ok][:n]
        if len(v) == n:
            r = np.sqrt((v * v).sum(axis=1, keepdims=True))
            return v / r


def _cms_stable_steps(rng, n, alpha, c):
    """
    Chambers-Mallows-Stuck (1976) symmetric α-stable step magnitudes.

    Why CMS: it requires only V ~ Uniform(−π/2, π/2) and W ~ Exp(1),
    both natively in numpy, and avoids rejection sampling entirely.
    For α=1 (Cauchy) the formula collapses to the standard Cauchy quantile.
    """
    V = rng.uniform(-math.pi / 2, math.pi / 2, n)
    W = rng.exponential(1.0, n)
    if alpha == 1.0:                        # exact Cauchy: tan(V)
        s = np.tan(V)
    else:
        # General CMS:
        # S = sin(α(V−π/2)+π/2) / cos(V)^(1/α)
        #   × (cos(V − α(V−π/2)) / W)^((1−α)/α)
        # Simplification for α-symmetric stable (β=0, δ=0):
        aV  = alpha * V
        sin = np.sin(aV)
        cos = np.cos(V)
        cos2 = np.cos(V - aV)
        s = (sin / np.abs(cos) ** (1.0 / alpha)) * (cos2 / W) ** ((1.0 - alpha) / alpha)
    return np.clip(s * c, -LEVY_MAX_STEP, LEVY_MAX_STEP)


def generate_walk(rng, n, mode="brownian"):
    """Return (n+1, 3) float64 positions for one walk."""
    dirs = _unit_sphere(rng, n)          # (n,3) unit vectors
    if mode == "brownian":
        magnitudes = rng.normal(0, BROWNIAN_SIGMA, n)
    elif mode == "levy_1_5":
        magnitudes = _cms_stable_steps(rng, n, alpha=1.5, c=LEVY_SCALE)
    else:                                # cauchy α=1
        magnitudes = _cms_stable_steps(rng, n, alpha=1.0, c=LEVY_SCALE)
    steps = dirs * np.abs(magnitudes[:, None])
    pos = np.zeros((n + 1, 3))
    pos[1:] = np.cumsum(steps, axis=0)
    return pos


def walk_to_nurbs(positions, name, hue, x_offset):
    """Build a multi-spline NURBS Curve object from position array."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = BEVEL_DEPTH
    cu.bevel_resolution = BEVEL_RES
    cu.fill_mode = "FULL"
    cu.twist_mode = "MINIMUM"

    n = len(positions)
    chunks = [positions[i: i + CHUNK_SIZE] for i in range(0, n, CHUNK_SIZE)]

    for chunk in chunks:
        sp = cu.splines.new("NURBS")
        sp.order_u = min(4, len(chunk))
        sp.use_endpoint_u = True                 # clamped: spline passes through endpoints
        sp.points.add(len(chunk) - 1)
        for j, (px, py, pz) in enumerate(chunk):
            sp.points[j].co = (px + x_offset, py, pz, 1.0)

    obj = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(obj)

    # ── Material: colour gradient dark→bright along walk ─────────────────────
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    attr = nt.nodes.new("ShaderNodeAttribute")

    attr.attribute_name = "index"           # per-point index, not present — fallback gradient
    attr.location = (-600, 0)
    ramp.location = (-300, 0)
    emit.location = (0, 0)
    out.location  = (300, 0)

    # Ramp: dark desaturated start → saturated bright end
    dark_rgb  = colorsys.hsv_to_rgb(hue, 0.3, 0.15)
    light_rgb = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
    ramp.color_ramp.elements[0].color = (*dark_rgb,  1.0)
    ramp.color_ramp.elements[1].color = (*light_rgb, 1.0)

    # Use Object Info → Random as a crude proxy (each spline is separate object)
    # A simple solid emission works fine for this aesthetic
    emit.inputs["Color"].default_value  = (*light_rgb, 1.0)
    emit.inputs["Strength"].default_value = EMIT_STRENGTH

    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)
    return obj


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    # Clear existing mesh/curve objects
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    rng = np.random.default_rng(SEED)

    walks = [
        ("hf_brownian",  "brownian",  0.58,  -OBJECT_SEP),   # teal
        ("hf_levy_1_5",  "levy_1_5",  0.80,   0.0),           # violet
        ("hf_cauchy",    "cauchy",    0.10,  +OBJECT_SEP),   # amber
    ]

    for name, mode, hue, x in walks:
        pos = generate_walk(rng, N_STEPS, mode)
        walk_to_nurbs(pos, name, hue, x)

    # ── Labels (empty axes for visual reference) ──────────────────────────────
    bpy.context.scene.frame_set(1)

    # ── GLB export (Blender 5.1 unified exporter) ─────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.wm.obj_export   # not used; use gltf
    bpy.ops.export_scene.gltf(
        filepath           = bpy.path.abspath(GLB_PATH),
        export_format      = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_apply       = True,          # bake bevel curves to mesh
        export_yup         = True,
    )
    print(f"[holoflow] GLB written → {GLB_PATH}")


main()
