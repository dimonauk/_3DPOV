"""
blueprint.py — Hopf Fibration: S³→S² Bundle, Clifford Parallels & Linked-Torus Light Sculpture
Blender 5.1 — Holoflow Studio — CC0

The Hopf fibration η: S³ → S² is the prototype principal U(1)-bundle.
Every point on S² has a circle (S¹) as its preimage in S³; any two such
circles are either identical or linked with linking number ±1 (Clifford
parallels).  Under stereographic projection π: S³\{pt} → ℝ³ the fibre
circles appear as Euclidean circles that fill nested, interlocked tori.
A Fibonacci-lattice sample of N_FIBRES base points on S² produces the
linked-torus light sculpture exported as a WebXR-ready GLB.
"""

# ─── Parameters ──────────────────────────────────────────────────────────────
N_FIBRES      = 72      # S² base points (Fibonacci / Vogel lattice)
N_PTS         = 96      # curve control points per fibre circle
TUBE_BEVEL    = 0.018   # bevel depth for the emissive tube
Z_MIN         = -0.70   # avoid south-pole singularity (d → −1 at z = −1)
SCALE         = 1.5     # overall scene scale after stereographic projection
R_CLIP        = 10.0    # discard control points projected beyond this radius
EMIT_STRENGTH = 5.0     # EEVEE Next bloom strength
WORLD_EMIT    = 0.0     # black void background

# ─── Imports ─────────────────────────────────────────────────────────────────
import bpy, math, os, colorsys
from mathutils import Vector

# ─── Fibonacci sphere ─────────────────────────────────────────────────────────
def fibonacci_sphere(n, z_min):
    """
    Distribute n points on S² using the Vogel/Fibonacci spiral.

    The golden angle φ_g = 2π(1 − 1/φ) ≈ 2.3998 rad (φ = golden ratio)
    causes consecutive spiral steps to rotate by the most irrational angle,
    giving a provably optimal, gap-free covering of S² (Bauer 2000).

    z_min clips the south-polar cap that would cause the stereographic
    projection to diverge (see hopf_fibre_projected for the bound).
    """
    PHI_GOLD = (1.0 + math.sqrt(5.0)) / 2.0
    PHI_G    = math.tau * (1.0 - 1.0 / PHI_GOLD)
    pts, i = [], 0
    while len(pts) < n:
        zi = 1.0 - (2.0 * i + 1.0) / n
        if zi >= z_min:
            ri    = math.sqrt(max(0.0, 1.0 - zi * zi))
            theta = i * PHI_G
            pts.append((ri * math.cos(theta), ri * math.sin(theta), zi))
        i += 1
        if i > 20 * n:
            break
    return pts

# ─── Hopf fibre via stereographic projection ──────────────────────────────────
def hopf_fibre_projected(phi, theta, n_pts, scale, r_clip):
    """
    Return n_pts Vector3 control points for the Hopf fibre over the base
    point n̂ = (sinφ cosθ, sinφ sinθ, cosφ) ∈ S².

    The fibre circle in S³ ⊂ ℂ² (parameterised by t ∈ [0, 2π)):
        z₁(t) = cos(φ/2) · e^{it}
        z₂(t) = sin(φ/2) · e^{i(t+θ)}

    In ℝ⁴ coordinates (a,b,c,d):
        a = cos(φ/2)cos t        b = cos(φ/2)sin t
        c = sin(φ/2)cos(t+θ)    d = sin(φ/2)sin(t+θ)

    Stereographic projection from the south pole (0,0,0,−1) of S³:
        π(a,b,c,d) = scale · (a, b, c) / (1 + d)

    Convergence: |π| = scale · √((1−d)/(1+d)).  The bound
        min(1+d) = 1 − sin(φ/2)
    stays positive for φ < π, guaranteed by z_min > −1.
    r_clip discards outlier control points when the fibre passes near the
    singularity locus — keeps the GLB clean without distorting the rest.
    """
    half_phi = phi / 2.0
    cos_h    = math.cos(half_phi)
    sin_h    = math.sin(half_phi)
    pts = []
    for k in range(n_pts):
        t     = math.tau * k / n_pts
        a     = cos_h * math.cos(t)
        b     = cos_h * math.sin(t)
        c     = sin_h * math.cos(t + theta)
        d     = sin_h * math.sin(t + theta)
        denom = 1.0 + d
        if denom < 1e-5:
            return None   # singular — skip entire fibre
        x, y, z = scale * a / denom, scale * b / denom, scale * c / denom
        if x*x + y*y + z*z > r_clip * r_clip:
            return None   # too far out — skip entire fibre for cleanliness
        pts.append(Vector((x, y, z)))
    return pts

# ─── Latitude-to-colour mapping ───────────────────────────────────────────────
def colour_for_z(z):
    """
    Map z ∈ [−1, 1] (base-point latitude on S²) to an RGBA emission colour.

    Hue sweep: z=1 → gold (H=0.13), z=0 → cyan (H=0.50), z=−1 → violet (H=0.78).
    Saturation and value held at 1.0 so all fibres glow equally in EEVEE.
    This gives visually distinct latitude bands without desaturating any fibre.
    """
    t = (z + 1.0) / 2.0          # remap z ∈ [-1,1] → [0,1]
    hue = 0.78 - t * 0.65        # violet(0.78) … gold(0.13)
    r, g, b = colorsys.hsv_to_rgb(hue % 1.0, 1.0, 1.0)
    return (r, g, b, 1.0)

# ─── Build scene ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom            = True
scene.eevee.bloom_threshold      = 0.10
scene.eevee.bloom_intensity      = 0.90

# Black void world
world = bpy.data.worlds.new('hf_world')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Strength'].default_value = WORLD_EMIT
scene.world = world

base_pts = fibonacci_sphere(N_FIBRES, Z_MIN)
print(f"[HF] Hopf fibration: {len(base_pts)} base points sampled on S²")

n_created = 0
for idx, (nx, ny, nz) in enumerate(base_pts):
    phi   = math.acos(max(-1.0, min(1.0, nz)))
    theta = math.atan2(ny, nx)

    pts3d = hopf_fibre_projected(phi, theta, N_PTS, SCALE, R_CLIP)
    if pts3d is None:
        continue

    cu          = bpy.data.curves.new(f'hf_fibre_{idx:03d}', 'CURVE')
    cu.dimensions   = '3D'
    cu.bevel_depth  = TUBE_BEVEL
    cu.bevel_resolution = 4
    cu.use_fill_caps = True

    sp = cu.splines.new('NURBS')
    sp.use_cyclic_u = True
    sp.points.add(N_PTS - 1)
    for k, v in enumerate(pts3d):
        sp.points[k].co = (*v, 1.0)
    sp.order_u = min(4, len(sp.points))

    mat          = bpy.data.materials.new(f'hf_mat_{idx:03d}')
    mat.use_nodes = True
    nt           = mat.node_tree
    nt.nodes.clear()
    out_n  = nt.nodes.new('ShaderNodeOutputMaterial');  out_n.location = (300, 0)
    emit_n = nt.nodes.new('ShaderNodeEmission');         emit_n.location = (0,   0)
    emit_n.inputs['Color'].default_value    = colour_for_z(nz)
    emit_n.inputs['Strength'].default_value = EMIT_STRENGTH
    nt.links.new(emit_n.outputs['Emission'], out_n.inputs['Surface'])
    cu.materials.append(mat)

    ob = bpy.data.objects.new(f'hf_fibre_{idx:03d}', cu)
    scene.collection.objects.link(ob)
    n_created += 1

# ─── Camera ──────────────────────────────────────────────────────────────────
cam_d = bpy.data.cameras.new('Camera')
cam_o = bpy.data.objects.new('Camera', cam_d)
cam_o.location       = (0.0, -7.0, 2.5)
cam_o.rotation_euler = (math.radians(70), 0.0, 0.0)
scene.collection.objects.link(cam_o)
scene.camera = cam_o

# ─── GLB export ──────────────────────────────────────────────────────────────
blend_dir = os.path.dirname(bpy.data.filepath) or '/tmp'
out_path  = os.path.join(blend_dir, 'hf_hopf_fibration.glb')
bpy.ops.export_scene.gltf(
    filepath                             = out_path,
    export_format                        = 'GLB',
    export_apply                         = True,
    use_selection                        = False,
    export_yup                           = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
)
print(f"[HF] Hopf fibration: {n_created} fibres → {out_path}")
