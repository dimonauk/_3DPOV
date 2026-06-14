"""
Compositor — Motion Vector Pass + Vector Blur: Fast EEVEE Motion Blur
=====================================================================
Blender 5.1 | Holoflow Studio | CC0

The Motion Vector (Speed) render pass stores per-pixel 2D velocity
vectors as a float32 EXR buffer.  Blender's convention: R,G = backward
motion (displacement to the previous frame); B,A = forward motion
(displacement to the next frame).  The compositor's Vector Blur node
reads this split-channel layout and smears each pixel along its velocity
vector, producing motion blur in post rather than at render time.

WHY COMPOSITOR VECTOR BLUR INSTEAD OF EEVEE RENDER-TIME MOTION BLUR:
  EEVEE's built-in motion blur (scene.eevee.motion_blur_shutter) is a
  rasterisation-time TAA accumulation over sub-samples.  It is cheap
  but produces ghosting artefacts at alpha boundaries and in multi-layer
  composites.  Compositor Vector Blur runs after the render is complete;
  it respects the depth (Z) pass for correct near-over-far ordering,
  can be tuned per render layer independently in a multi-layer EXR
  workflow, and has no sub-sample budget — streak length is only bounded
  by BLUR_MAX_PX.  Trade-off: assumes LINEAR motion between frames (one
  frame shutter).  Abrupt direction changes (bouncing ball at apex) will
  show a slight straight-streak artefact rather than curved motion.  For
  constant rotation or translation it is exact.

MOTION VECTOR UNIT CONVENTION:
  Blender's Vector pass is in screen-space pixels, float32.  A pixel
  that moved 30 px right from frame N-1 to N stores R=30.0 (backward-X).
  BLUR_SPEED acts as a linear multiplier: 0.5 halves all streak lengths
  (subtler look), 2.0 doubles them (hyper-kinetic look).  BLUR_MAX_PX
  clamps the maximum streak length — essential to prevent seams when
  fast objects cross tile boundaries in high-sample renders.

EEVEE NEXT VECTOR PASS REQUIREMENT:
  Vector pass is not enabled by default.  It requires:
    view_layer.use_pass_vector = True
  In EEVEE Next (Blender 5.1), the vector pass is computed from the
  object's previous/current/next frame transform matrices in the
  dependency graph.  Deformable geometry (cloth, shape key) does NOT
  produce per-vertex vectors — only rigid-body transforms and armature
  rigs with constant topology generate accurate vectors.  For deformable
  motion, use EEVEE's render-time motion blur instead.
"""

import bpy
import math

# ── Constants ────────────────────────────────────────────────────────────────
OBJ_NAME       = "SpinningGem"
MAT_NAME       = "GemMetallic"
SPIN_FRAMES    = 36              # 360° over 36 frames → 10°/frame clear streak
SHUTTER        = 0.5             # shutter fraction stored in motion vectors
BLUR_SAMPLES   = 32              # VecBlur quality; 16=preview, 32=clean, 64=film
BLUR_SPEED     = 0.75            # vector multiplier; 1.0=full frame, 0.5=subtle
BLUR_MAX_PX    = 80              # streak length cap (pixels); avoids tiling seam
RENDER_X, RENDER_Y = 1280, 720
RENDER_FPS     = 24
CAMERA_DIST    = 6.0             # metres from origin
GEM_RADIUS     = 1.0
BASE_COLOR     = (0.05, 0.35, 0.85)  # cobalt-blue faceted gem
ROUGHNESS      = 0.08
METALLIC       = 0.90

# ── Reset scene ──────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

scene = bpy.context.scene
scene.name = "VecBlurDemo"

# ── Renderer: EEVEE Next ─────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = RENDER_X
scene.render.resolution_y = RENDER_Y
scene.render.fps = RENDER_FPS
scene.frame_start = 1
scene.frame_end = SPIN_FRAMES
scene.render.filepath = "//render/vecblur_###"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_depth = "16"

# EEVEE Next quality settings
eevee = scene.eevee
eevee.use_raytracing = True
eevee.ray_tracing_options.resolution_scale = "1"
# Disable EEVEE's own motion blur — we use compositor VecBlur instead
eevee.use_motion_blur = False

# ── Enable Vector render pass on the default view layer ──────────────────────
vl = scene.view_layers["ViewLayer"]
vl.use_pass_vector = True   # motion vector pass — R,G=backward; B,A=forward
vl.use_pass_z      = True   # Z depth — VecBlur uses depth for near-over-far

# ── Create gem mesh — Ico Sphere, flat shaded ────────────────────────────────
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=2,
    radius=GEM_RADIUS,
    location=(0, 0, 0),
)
gem = bpy.context.active_object
gem.name = OBJ_NAME

# Flat shading (all faces) — crystal-cut faceted look
bpy.ops.object.shade_flat()

# ── Gem material ─────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(name=MAT_NAME)
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

nodes.clear()

out  = nodes.new("ShaderNodeOutputMaterial")
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
out.location  = (300, 0)
bsdf.location = (0, 0)

bsdf.inputs["Base Color"].default_value  = (*BASE_COLOR, 1.0)
bsdf.inputs["Roughness"].default_value   = ROUGHNESS
bsdf.inputs["Metallic"].default_value    = METALLIC
bsdf.inputs["Coat Weight"].default_value = 1.0       # thin lacquer coat
bsdf.inputs["Coat IOR"].default_value    = 1.50

links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
gem.data.materials.append(mat)

# ── Animate: 360° spin around Z over SPIN_FRAMES ─────────────────────────────
# Keyframe at frame 1 (0°) and frame SPIN_FRAMES+1 (360°) with LINEAR interpolation.
# The extra frame at SPIN_FRAMES+1 ensures the vector at frame SPIN_FRAMES looks
# forward into a clean continuation rather than snapping back to 0°.
gem.rotation_mode = "XYZ"
gem.rotation_euler = (0, 0, 0)
gem.keyframe_insert(data_path="rotation_euler", frame=1)

gem.rotation_euler = (0, 0, math.radians(360.0))
gem.keyframe_insert(data_path="rotation_euler", frame=SPIN_FRAMES + 1)

# Force LINEAR interpolation — constant angular velocity gives clean vectors
for fcurve in gem.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Lighting ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(3, -2, 5))
key = bpy.context.active_object
key.data.energy = 400
key.data.size   = 2.0
key.data.color  = (1.0, 0.95, 0.88)

bpy.ops.object.light_add(type="AREA", location=(-4, 1, 3))
fill = bpy.context.active_object
fill.data.energy = 80
fill.data.size   = 3.0
fill.data.color  = (0.75, 0.85, 1.0)

# ── Camera ───────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -CAMERA_DIST, 1.2))
cam = bpy.context.active_object
cam.data.lens = 50
cam.rotation_euler = (math.radians(78), 0, 0)
scene.camera = cam

# ── World background (neutral grey) ──────────────────────────────────────────
world = bpy.data.worlds.new("VecBlurWorld")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.04, 0.04, 0.04, 1.0)
bg.inputs["Strength"].default_value = 1.0
scene.world = world

# ── Compositor ───────────────────────────────────────────────────────────────
scene.use_nodes = True
tree  = scene.node_tree
nodes = tree.nodes
links = tree.links

nodes.clear()

# Render Layers
rl = nodes.new("CompositorNodeRLayers")
rl.location = (-400, 0)

# Vector Blur
# WHY SAMPLES=32: each sample steps along the velocity vector; below 16 you
# see banding in the streak.  Above 64 gives diminishing returns.
# WHY BLUR_SPEED < 1.0: raw vectors represent full frame-to-frame displacement.
# At SPIN_FRAMES=36 / 360°, each frame is 10° — enough displacement that
# BLUR_SPEED=1.0 produces a very long streak.  0.75 gives a cinematic smear
# that reads as "fast" without turning the gem into an illegible disc.
vblur = nodes.new("CompositorNodeVecBlur")
vblur.location   = (0, 0)
vblur.samples    = BLUR_SAMPLES
vblur.speed      = BLUR_SPEED
vblur.min_speed  = 0
vblur.max_speed  = BLUR_MAX_PX
vblur.use_curved = False   # curved=True blends over arc; overkill at 10°/frame

# Composite output
comp = nodes.new("CompositorNodeComposite")
comp.location = (300, 0)

# Viewer for quick preview
viewer = nodes.new("CompositorNodeViewer")
viewer.location = (300, -180)

# Wire: Render Layers → VecBlur → Composite
links.new(rl.outputs["Image"],  vblur.inputs["Image"])
links.new(rl.outputs["Depth"],  vblur.inputs["Z"])
links.new(rl.outputs["Vector"], vblur.inputs["Speed"])
links.new(vblur.outputs["Image"], comp.inputs["Image"])
links.new(vblur.outputs["Image"], viewer.inputs["Image"])

# ── Color management (AgX — Blender 5.1 default) ─────────────────────────────
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "None"
# NOTE: VecBlur outputs display-referred pixels (already smeared in linear
# space but the vectors themselves are screen-space scalars, not HDR energy).
# AgX applies its tone curve to the Image output; the blur is computed in
# scene-linear space before AgX sees the result, which is correct.

print("[blueprint] VecBlurDemo scene ready.")
print(f"  Gem '{OBJ_NAME}' spins 360° over {SPIN_FRAMES} frames ({SPIN_FRAMES/RENDER_FPS:.1f}s).")
print("  Vector pass enabled. Run F12 on any frame to render with compositor blur.")
print("  Or: Render → Render Animation (Ctrl+F12) for the full PNG sequence.")
