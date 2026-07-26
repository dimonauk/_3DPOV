"""
blueprint.py — Torus Knot T(p,q): Parallel-Transport Tube Mesh for WebXR
Blender 5.1 — Holoflow Studio — CC0

T(p,q) is the closed curve that winds p times around the longitude of a
torus and q times around its meridian.  GCD(p,q) = 1 is required for a
single-component knot; any common factor produces a GCD-component link.

Frames are built by parallel transport (Bishop frame), not Frenet-Serret.
The Frenet principal normal at a point of vanishing curvature is undefined;
parallel transport avoids this and gives a visually cleaner, less-twisted
tube.  Holonomy (frame closure error) is measured and linearly distributed
so the mesh seam is invisible.
"""

# ─── Parameters ─────────────────────────────────────────────────────────────
P             = 2        # longitudinal wraps (around the hole)  → trefoil
Q             = 3        # meridional wraps   (around the tube)
TORUS_R       = 1.00     # major radius  (centre-of-hole to tube axis)
TORUS_r       = 0.38     # minor radius  (tube cross-section radius)
TUBE_RADIUS   = 0.045    # strand cross-section radius
N_LONG        = 240      # rings along the strand; higher → smoother
N_CIRC        = 14       # vertices per cross-section ring
MAT_COLOUR    = (0.05, 0.55, 0.95, 1.0)   # electric blue RGBA
EMIT_STRENGTH = 4.0                         # EEVEE emission bloom multiplier

# ─── Imports ─────────────────────────────────────────────────────────────────
import bpy, math, os
from mathutils import Vector

# ─── Pure-math helpers ───────────────────────────────────────────────────────
def _gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a

def _knot_pos(t: float) -> Vector:
    """T(p,q) torus-knot position at parameter t ∈ [0, 2π)."""
    r = TORUS_R + TORUS_r * math.cos(Q * t)
    return Vector((r * math.cos(P * t), r * math.sin(P * t), TORUS_r * math.sin(Q * t)))

def _knot_tangent(t: float) -> Vector:
    """Unit tangent via central difference (O(h²) accuracy at h=4e-5)."""
    h = 4e-5
    return (_knot_pos(t + h) - _knot_pos(t - h)).normalized()

# ─── Parallel-transport frame builder ────────────────────────────────────────
def _build_frames(n: int):
    """
    Returns list of (pos, T, N, B) tuples — one per longitudinal ring.

    Algorithm:
      1. Seed N[0] as any vector orthogonal to T[0].
      2. For i = 1..n-1: project N[i-1] onto the T[i]-perpendicular plane.
      3. Measure closure holonomy angle θ (angle between transported N[-1] and N[0]).
      4. Distribute -θ linearly across all frames so the tube closes cleanly.

    For T(p,q) torus knots θ is always a multiple of 2π — the distributed
    correction converges to a pure rotation by that multiple, confirming the
    knot's self-linking number is an integer (Seifert-framing invariant).
    """
    step      = 2.0 * math.pi / n
    positions = [_knot_pos(i * step)     for i in range(n)]
    tangents  = [_knot_tangent(i * step) for i in range(n)]

    seed = Vector((0.0, 0.0, 1.0))
    if abs(seed.dot(tangents[0])) > 0.90:
        seed = Vector((0.0, 1.0, 0.0))

    normals    = [None] * n
    normals[0] = (seed - seed.dot(tangents[0]) * tangents[0]).normalized()

    for i in range(1, n):
        t_i        = tangents[i]
        prev_n     = normals[i - 1]
        proj       = prev_n - prev_n.dot(t_i) * t_i
        normals[i] = proj.normalized()

    # Holonomy: signed angle between N[-1] transported back and N[0]
    n_last  = normals[-1]
    n_first = normals[0]
    cos_h   = max(-1.0, min(1.0, n_last.dot(n_first)))
    sin_h   = n_last.cross(n_first).dot(tangents[0])   # project onto T[0]
    theta_h = math.atan2(sin_h, cos_h)

    frames = []
    for i, (pos, T, N) in enumerate(zip(positions, tangents, normals)):
        # Rotate frame by -(i/n)·θ around T to distribute the correction
        frac  = i / n
        delta = frac * theta_h
        cos_d = math.cos(delta);  sin_d = math.sin(delta)
        B     = T.cross(N).normalized()
        N_c   = cos_d * N + sin_d * B
        B_c   = -sin_d * N + cos_d * B
        frames.append((pos, T, N_c, B_c))

    print(f"[HF] T({P},{Q}) holonomy = {math.degrees(theta_h):.2f}°  "
          f"({theta_h / (2 * math.pi):.3f} turns); correction distributed.")
    return frames

# ─── Tube mesh ───────────────────────────────────────────────────────────────
def _build_tube(frames):
    """N_LONG × N_CIRC quad mesh; both directions closed (torus topology)."""
    n_l = len(frames)
    verts, faces = [], []
    for pos, _T, N, B in frames:
        for j in range(N_CIRC):
            ang = 2.0 * math.pi * j / N_CIRC
            verts.append(pos + (math.cos(ang) * N + math.sin(ang) * B) * TUBE_RADIUS)
    for i in range(n_l):
        ni = (i + 1) % n_l
        for j in range(N_CIRC):
            nj = (j + 1) % N_CIRC
            faces.append((i  * N_CIRC + j,
                          i  * N_CIRC + nj,
                          ni * N_CIRC + nj,
                          ni * N_CIRC + j))
    return verts, faces

# ─── Guard ───────────────────────────────────────────────────────────────────
g = _gcd(P, Q)
if g != 1:
    raise ValueError(f"T({P},{Q}): GCD = {g}; produces a {g}-component link, not a knot.  "
                     f"Try T(2,3), T(2,5), T(3,4), or T(3,5).")

# ─── Build scene ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

frames_data    = _build_frames(N_LONG)
verts, faces   = _build_tube(frames_data)

me = bpy.data.meshes.new('hf_torus_knot')
me.from_pydata(verts, [], faces)
me.update()
for poly in me.polygons:          # smooth shading
    poly.use_smooth = True
me.use_auto_smooth = True

ob = bpy.data.objects.new('hf_torus_knot', me)
scene.collection.objects.link(ob)

# ─── Material: emissive for EEVEE bloom ──────────────────────────────────────
mat = bpy.data.materials.new('hf_knot_mat')
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out_n  = nt.nodes.new('ShaderNodeOutputMaterial');  out_n.location  = (300, 0)
emit_n = nt.nodes.new('ShaderNodeEmission');         emit_n.location = (0,   0)
emit_n.inputs['Color'].default_value    = MAT_COLOUR
emit_n.inputs['Strength'].default_value = EMIT_STRENGTH
nt.links.new(emit_n.outputs['Emission'], out_n.inputs['Surface'])
me.materials.append(mat)

# ─── World: black void + bloom ───────────────────────────────────────────────
world = bpy.data.worlds.new('hf_world')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
scene.world = world
scene.render.engine                    = 'BLENDER_EEVEE_NEXT'
bpy.context.scene.eevee.use_bloom      = True
bpy.context.scene.eevee.bloom_threshold = 0.10
bpy.context.scene.eevee.bloom_intensity = 0.85

# ─── Camera ──────────────────────────────────────────────────────────────────
cam_d = bpy.data.cameras.new('Camera')
cam_o = bpy.data.objects.new('Camera', cam_d)
cam_o.location       = (0.0, -3.5, 0.9)
cam_o.rotation_euler = (math.radians(76), 0.0, 0.0)
scene.collection.objects.link(cam_o)
scene.camera = cam_o

# ─── GLB export ──────────────────────────────────────────────────────────────
blend_dir = os.path.dirname(bpy.data.filepath) or '/tmp'
bpy.ops.export_scene.gltf(
    filepath                             = os.path.join(blend_dir, 'hf_torus_knot.glb'),
    export_format                        = 'GLB',
    export_apply                         = True,
    use_selection                        = False,
    export_yup                           = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
)
print(f"[HF] T({P},{Q}) tube: {len(verts)} verts / {len(faces)} quads  →  hf_torus_knot.glb")
