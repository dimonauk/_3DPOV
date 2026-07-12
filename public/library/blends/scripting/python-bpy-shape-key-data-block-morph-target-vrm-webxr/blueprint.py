"""
bpy.types.Key + bpy.types.ShapeKey — Scripted VRM Morph Target Construction
Blender 5.1  |  CC0  |  Holoflow Studio

TECHNIQUE
---------
A Mesh's shape keys live on a bpy.types.Key data-block accessible via
mesh.shape_keys.  Blender creates the Key block automatically on the first
ob.shape_key_add() call.  key.key_blocks is an ordered SequenceProxy of
bpy.types.ShapeKey objects.  Index 0 is always the Basis — the neutral vertex
positions.  Every subsequent block is relative to its relative_key (defaults
to Basis) and contributes an additive positional offset scaled by .value.

The fast write path for vertex data is ShapeKey.data.foreach_set('co', flat):
  • flat must be a flat sequence of length 3 * vertex_count in (x,y,z,…) order
  • array.array('f', …) avoids the per-element Python boxing overhead
  • foreach_set calls the C-layer memcopy directly — ~80× faster than a
    Python for-loop over sk.data[i].co for meshes above ~300 vertices

VRM 1.0 Expression Presets (VRMC_vrm spec §7)
----------------------------------------------
The VRM spec assigns reserved preset names that three-vrm / UniVRM bind
automatically without extra JSON wiring:
  Emotions : happy  angry  sad  surprised  relaxed
  Visemes  : aa  ih  ou  ee  oh
  Blink    : blink  blinkLeft  blinkRight
  Look     : lookUp  lookDown  lookLeft  lookRight
  Neutral  : neutral
These exact lower-camel-case strings are matched by three-vrm's
ExpressionManager.setValue(name, weight) at runtime.

GLB export: export_morph=True (on by default) packs shape keys as glTF
morph targets.  export_morph_normal=True ships per-morph normal deltas so
the shading deforms cleanly.  export_morph_tangent=False omits tangent
deltas — they add ~30 % file size and three-vrm recomputes them.
"""
import bpy
import array as arr

SLUG          = "python-bpy-shape-key-data-block-morph-target-vrm-webxr"
OBJ_NAME      = "vrm_head_proxy"
GLB_PATH      = "//vrm_morph_proxy.glb"
BLEND_PATH    = "//vrm_morph_proxy.blend"
SEG           = 16     # UV-sphere longitude divisions
RINGS         = 12     # UV-sphere latitude rings (poles are extra)
RADIUS        = 1.0

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ── UV sphere — head stand-in ─────────────────────────────────────────────────
# 16 × 12 + 2 poles = 194 vertices. Ring topology maps well to face bands:
# upper hemisphere → brow/eye, lower hemisphere → cheek/jaw.
bpy.ops.mesh.primitive_uv_sphere_add(
    segments   = SEG,
    ring_count = RINGS,
    radius     = RADIUS,
    location   = (0.0, 0.0, 0.0),
)
ob  = bpy.context.active_object
ob.name = OBJ_NAME
me      = ob.data
me.name = OBJ_NAME + "_mesh"

for p in me.polygons:          # smooth shading for morph-normal export
    p.use_smooth = True

mat = bpy.data.materials.new("vrm_skin")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value       = (0.80, 0.61, 0.47, 1.0)
bsdf.inputs["Subsurface Weight"].default_value = 0.15
bsdf.inputs["Roughness"].default_value         = 0.65
ob.data.materials.append(mat)

print(f"[{SLUG}] mesh: {len(me.vertices)} verts, {len(me.polygons)} faces")

# ── Basis shape key ───────────────────────────────────────────────────────────
# ob.shape_key_add() creates the bpy.types.Key data-block on first call and
# appends to key_blocks on subsequent calls.  from_mix=False copies the current
# vertex positions rather than the active mix result — essential for Basis.
basis_sk = ob.shape_key_add(name="Basis", from_mix=False)
me.shape_keys.use_relative   = True          # default but declared explicitly
me.shape_keys.reference_key  = basis_sk      # belt-and-braces

n = len(me.vertices)
basis_flat = arr.array('f', [0.0] * (3 * n))
basis_sk.data.foreach_get('co', basis_flat)  # read all (x,y,z) into flat buffer

print(f"[{SLUG}] Basis: {n} verts read via foreach_get")

# ── Expression helper ─────────────────────────────────────────────────────────
def make_expression(name, delta_fn, slider_max=1.0):
    """
    Add a relative ShapeKey and populate it via foreach_set.
    delta_fn(x, y, z) -> (dx, dy, dz) for each vertex in local space.
    arr.array('f', basis_flat) copies the Basis positions in one C call.
    Modifying the copy and calling foreach_set writes the result back without
    touching the source — no aliasing risk.
    """
    sk              = ob.shape_key_add(name=name, from_mix=False)
    sk.slider_min   = 0.0
    sk.slider_max   = slider_max
    sk.relative_key = basis_sk             # explicit — default may shift on copy
    flat = arr.array('f', basis_flat)      # single C-level memcopy
    for i in range(n):
        x = flat[i * 3]
        y = flat[i * 3 + 1]
        z = flat[i * 3 + 2]
        dx, dy, dz = delta_fn(x, y, z)
        flat[i * 3]     += dx
        flat[i * 3 + 1] += dy
        flat[i * 3 + 2] += dz
    sk.data.foreach_set('co', flat)
    return sk

# ── happy — raise mouth corners ───────────────────────────────────────────────
# Lower-lateral-front verts: z ∈ (-0.55, -0.15), |x| > 0.35, front (y < 0.05)
# Weight tapers linearly from x = 0.35 to x = 1.0.
make_expression("happy", lambda x, y, z: (
    0.0, 0.0,
    (0.10 * max(0.0, (abs(x) - 0.35) / 0.65)
     if -0.55 < z < -0.15 and abs(x) > 0.35 and y < 0.05
     else 0.0)
))

# ── angry — depress brow ──────────────────────────────────────────────────────
# Upper-front-medial verts: z ∈ (0.30, 0.70), |x| < 0.55, front (y < 0.0)
make_expression("angry", lambda x, y, z: (
    0.0, 0.0,
    (-0.10 * max(0.0, 1.0 - abs(x) / 0.55)
     if 0.30 < z < 0.70 and y < 0.0
     else 0.0)
))

# ── sad — drop mouth corners ──────────────────────────────────────────────────
# Same lateral-lower region as happy but pushed downward.
make_expression("sad", lambda x, y, z: (
    0.0, 0.0,
    (-0.09 * max(0.0, (abs(x) - 0.35) / 0.65)
     if -0.50 < z < -0.10 and abs(x) > 0.35 and y < 0.05
     else 0.0)
))

# ── surprised — brow raise + jaw drop ────────────────────────────────────────
# Two-region: upper half scales radially outward; lower-front drops.
def delta_surprised(x, y, z):
    if z > 0.20:
        t = (z - 0.20) / 0.80
        return (x * 0.12 * t, y * 0.12 * t, z * 0.08 * t)
    if z < -0.20 and y < 0.0:
        t = (-z - 0.20) / 0.80
        return (0.0, 0.0, -0.12 * t)
    return (0.0, 0.0, 0.0)

make_expression("surprised", delta_surprised)

# ── blink base (shared by blink / blinkLeft / blinkRight) ────────────────────
# Squash upper-front eye-band downward: z ∈ (0.20, 0.65), front (y < -0.05)
def _blink(x, y, z):
    if 0.20 < z < 0.65 and y < -0.05:
        t = (z - 0.20) / 0.45
        return (0.0, 0.0, -0.22 * t)
    return (0.0, 0.0, 0.0)

make_expression("blink",      _blink)
make_expression("blinkLeft",  lambda x, y, z: _blink(x, y, z) if x < 0 else (0.0, 0.0, 0.0))
make_expression("blinkRight", lambda x, y, z: _blink(x, y, z) if x > 0 else (0.0, 0.0, 0.0))

# ── aa viseme — jaw drop ──────────────────────────────────────────────────────
# Lower-front verts drop proportionally to distance from equator.
make_expression("aa", lambda x, y, z: (
    0.0, 0.0,
    (-0.15 * max(0.0, (-z - 0.05) / 0.95)
     if z < -0.05 and y < 0.10
     else 0.0)
))

print(f"[{SLUG}] keys: {[kb.name for kb in me.shape_keys.key_blocks]}")

# ── GLB export with morph targets ─────────────────────────────────────────────
# export_morph=True  — default, pack ShapeKey data as glTF morph targets
# export_morph_normal=True — per-morph normal deltas; crucial for smooth shading
# export_morph_tangent=False — tangent deltas inflate file by ~30 %; omit
bpy.ops.export_scene.gltf(
    filepath                              = bpy.path.abspath(GLB_PATH),
    export_format                         = 'GLB',
    use_selection                         = False,
    export_apply                          = True,
    export_morph                          = True,
    export_morph_normal                   = True,
    export_morph_tangent                  = False,
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format                   = 'WEBP',
    export_yup                            = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
print(f"[{SLUG}] done — GLB → {GLB_PATH}")
