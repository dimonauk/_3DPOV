"""
Biot-Savart Magnetic Field-Line Tracer — Blueprint (Blender 5.1)
=================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

The Biot-Savart law gives the magnetic field B produced by a steady current
I flowing along a wire path:

    B(r) = (μ₀ I / 4π) ∫_wire (dl × r̂) / |r|²

where r is the displacement from each wire element dl to the field probe
point, and r̂ = r/|r| is the unit vector pointing from element to probe.

Discretised over N wire segments (midpoints m_i, chord vectors dl_i):

    B ≈ Σ_i  (dl_i × r̂_i) / |r_i|²        r_i = p - m_i

The μ₀I/4π prefactor is constant and factors out when we only need the
field DIRECTION (field-line tracing).  Normalising B to a unit vector and
stepping along it gives the field-line geometry independent of current
magnitude.

Field-line integration: 4th-order Runge-Kutta (RK4).  Euler integration
accumulates O(h²) drift per step; RK4 has O(h⁵) local error, meaning a 10×
smaller step gives 100 000× better accuracy for the same compute budget.
At h=0.012 m the per-step error is ~10⁻⁹ m — negligible next to the coil
scale (~0.15 m).

Wire geometry: helical poi-cable coil — 3 turns, radius 0.15 m, height
0.40 m.  Tracer seeds placed on an equatorial ring at radius 0.30 m (just
outside the helix diameter).  Field lines near the coil axis return tightly;
lines seeded far outside spiral lazily around the coil ends — producing the
classic "doughnut + axial" light-painting pattern.

Blender output: POLY curves with bevel_depth tubes.  bevel_factor_end
animated 0→1 gives the trail-draw-on effect without a Build modifier.
Curves converted to meshes before GLB export (GLB does not carry curve data).

Outside sources:
  magpylib — MIT — Michael Ortner et al.
    https://github.com/magpylib/magpylib
    Discrete Biot-Savart segment model follows the magpylib Line source.
    related: https://github.com/magpylib/magpylib/tree/main/examples
  Blender Python API — bpy Curve  CC-BY-SA-4.0  Blender Foundation
    https://docs.blender.org/api/5.1/bpy.types.Curve.html
    related: https://projects.blender.org/blender/blender
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG            = "hf_biot_savart"
WIRE_TURNS      = 3        # helix turns in the poi-cable coil
WIRE_RADIUS     = 0.15     # m  helix tube radius
WIRE_HEIGHT     = 0.40     # m  total coil height (Z span)
N_WIRE_PTS      = 256      # integration segments (higher → more accurate B)
N_SEEDS         = 24       # tracer particles (equatorial ring)
SEED_RADIUS     = 0.30     # m  seed ring radius (outside the helix)
SEED_HEIGHT     = 0.0      # m  seed ring Z (equatorial plane)
RK4_STEPS       = 400      # RK4 steps per field line (total path length = RK4_STEPS × RK4_DT)
RK4_DT          = 0.012    # m  arc-length step size
BEVEL_DEPTH     = 0.003    # m  rendered tube radius
FRAME_END       = 120      # reveal animation length (bevel_factor_end 0→1)
EMIT_STRENGTH   = 8.0      # emission multiplier for EEVEE bloom
OUTPUT_GLB      = bpy.path.abspath("//hf_biot_savart.glb")

TRAIL_PALETTE = [
    (0.30, 0.80, 1.00, 1.0),   # cyan
    (0.80, 0.30, 1.00, 1.0),   # violet
    (1.00, 0.50, 0.10, 1.0),   # amber
    (0.10, 1.00, 0.40, 1.0),   # green
    (1.00, 0.20, 0.40, 1.0),   # rose
    (1.00, 0.95, 0.20, 1.0),   # yellow
]

# ── Scene reset ───────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for item in list(col):
            col.remove(item)

# ── Wire: helix segment midpoints and chord vectors ───────────────────────────
def build_wire_segments(n: int = N_WIRE_PTS):
    """Return [(midpoint, dl)] where dl is the chord vector (tangent × length)."""
    segs = []
    dtheta = 2.0 * math.pi * WIRE_TURNS / n

    def helix(theta: float) -> Vector:
        z = WIRE_HEIGHT * theta / (2.0 * math.pi * WIRE_TURNS) - WIRE_HEIGHT * 0.5
        return Vector((WIRE_RADIUS * math.cos(theta),
                       WIRE_RADIUS * math.sin(theta),
                       z))

    for i in range(n):
        t_lo  = i * dtheta
        t_mid = (i + 0.5) * dtheta
        t_hi  = (i + 1.0) * dtheta
        mid   = helix(t_mid)
        dl    = helix(t_hi) - helix(t_lo)   # chord ≈ tangent × segment length
        segs.append((mid, dl))
    return segs

WIRE_SEGS = build_wire_segments()   # precompute; reused at every RK4 sub-step

# ── Biot-Savart B-field (direction only; μ₀I/4π omitted) ─────────────────────
def b_field(p: Vector) -> Vector:
    """
    Unnormalised B at probe p.  Cross-product order: dl × r̂ gives the
    right-hand rule direction for current flowing from low to high parameter.
    Singularity guard: skip segments within 0.3 mm of p (probe inside wire).
    """
    B = Vector((0.0, 0.0, 0.0))
    for mid, dl in WIRE_SEGS:
        r    = p - mid
        r_sq = r.length_squared
        if r_sq < 9e-8:              # 0.3 mm exclusion sphere
            continue
        r_hat = r / math.sqrt(r_sq)
        B    += dl.cross(r_hat) / r_sq
    return B

# ── RK4 field-line stepper ────────────────────────────────────────────────────
def b_direction(p: Vector) -> Vector:
    """Normalised B at p; returns +Z if field is negligible (open far field)."""
    B = b_field(p)
    L = B.length
    return B / L if L > 1e-12 else Vector((0.0, 0.0, 1.0))

def rk4_step(p: Vector, h: float) -> Vector:
    k1 = b_direction(p)
    k2 = b_direction(p + (h * 0.5) * k1)
    k3 = b_direction(p + (h * 0.5) * k2)
    k4 = b_direction(p + h * k3)
    return p + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)

def trace_field_line(seed: Vector, steps: int = RK4_STEPS, h: float = RK4_DT):
    """Return list of Vector positions along the field line from seed."""
    pts = [seed.copy()]
    p   = seed.copy()
    for _ in range(steps):
        p = rk4_step(p, h)
        pts.append(p.copy())
        if p.length > 6.0:          # left scene bounds → terminate
            break
    return pts

# ── Emission material ─────────────────────────────────────────────────────────
def make_emit_material(name: str, rgba: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    for n in list(tree.nodes):
        tree.nodes.remove(n)
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    emit = tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = rgba
    emit.inputs["Strength"].default_value = EMIT_STRENGTH
    tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat

# ── Build Blender POLY curve from trajectory ──────────────────────────────────
def build_poly_curve(name: str, pts: list, mat: bpy.types.Material) -> bpy.types.Object:
    cdata               = bpy.data.curves.new(name, type='CURVE')
    cdata.dimensions    = '3D'
    cdata.bevel_depth   = BEVEL_DEPTH
    cdata.bevel_resolution = 2

    sp = cdata.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1.0)   # POLY uses (x, y, z, w)

    # Draw-on animation: bevel_factor_end 0→1 over FRAME_END frames
    cdata.bevel_factor_end = 0.0
    cdata.keyframe_insert("bevel_factor_end", frame=1)
    cdata.bevel_factor_end = 1.0
    cdata.keyframe_insert("bevel_factor_end", frame=FRAME_END)
    for fc in cdata.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    obj = bpy.data.objects.new(name, cdata)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

# ── Helix wire visualisation ──────────────────────────────────────────────────
def add_wire_visual():
    n     = 128
    dt    = 2.0 * math.pi * WIRE_TURNS / n
    cdata = bpy.data.curves.new("hf_coil", type='CURVE')
    cdata.dimensions  = '3D'
    cdata.bevel_depth = 0.004
    sp = cdata.splines.new('POLY')
    sp.points.add(n)
    for i in range(n + 1):
        t = i * dt
        z = WIRE_HEIGHT * t / (2.0 * math.pi * WIRE_TURNS) - WIRE_HEIGHT * 0.5
        sp.points[i].co = (WIRE_RADIUS * math.cos(t),
                           WIRE_RADIUS * math.sin(t), z, 1.0)
    mat = make_emit_material("hf_coil_mat", (0.7, 0.7, 0.9, 1.0))
    mat.node_tree.nodes["Emission"].inputs["Strength"].default_value = 3.0
    obj = bpy.data.objects.new("hf_coil", cdata)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)

# ── Seed ring ─────────────────────────────────────────────────────────────────
def make_seeds(n: int = N_SEEDS) -> list:
    seeds = []
    for i in range(n):
        angle = 2.0 * math.pi * i / n
        seeds.append(Vector((SEED_RADIUS * math.cos(angle),
                              SEED_RADIUS * math.sin(angle),
                              SEED_HEIGHT)))
    return seeds

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    scn = bpy.context.scene
    scn.frame_start, scn.frame_end = 1, FRAME_END

    add_wire_visual()

    trail_objs = []
    for i, seed in enumerate(make_seeds()):
        rgba = TRAIL_PALETTE[i % len(TRAIL_PALETTE)]
        mat  = make_emit_material(f"hf_trail_mat_{i:02d}", rgba)
        pts  = trace_field_line(seed)
        obj  = build_poly_curve(f"hf_trail_{i:02d}", pts, mat)
        trail_objs.append(obj)

    # Camera: slightly elevated, looking inward
    bpy.ops.object.camera_add(location=(0.0, -2.2, 0.3))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(83), 0.0, 0.0)
    scn.camera = cam

    # World: pure black for EEVEE bloom readability
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scn.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
    bg.inputs["Strength"].default_value = 0.0

    scn.render.engine     = 'BLENDER_EEVEE_NEXT'
    scn.eevee.use_bloom   = True
    scn.eevee.bloom_intensity = 0.08
    scn.render.resolution_x  = 1920
    scn.render.resolution_y  = 1080

    # Convert curves → meshes for GLB export
    bpy.ops.object.select_all(action='DESELECT')
    for obj in trail_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = trail_objs[0]
    bpy.ops.object.convert(target='MESH')

    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("hf_"):
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
        export_yup=True,
    )
    print(f"[hf_biot_savart] {len(trail_objs)} field lines → {OUTPUT_GLB}")

main()
