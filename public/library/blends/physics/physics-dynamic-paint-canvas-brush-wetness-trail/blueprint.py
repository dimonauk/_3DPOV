# ============================================================
#  Holoflow Studio — Dynamic Paint: Canvas + Brush
#  Slug  : physics-dynamic-paint-canvas-brush-wetness-trail
#  Blender: 5.1 | Licence: CC0 | holoflow.co.uk
# ============================================================
#
# Dynamic Paint splits a "painting" interaction into two roles:
# CANVAS (the surface that accumulates state) and BRUSH (anything
# that deposits it).  The modifier computes paint coverage per-
# vertex or per UV-texel, exports a vertex-colour attribute or an
# image sequence, then hands that data straight to the shader.
# No custom render callback, no post-process pass — the result is
# a plain texture that any material can read.
#
# WHY this is harder than it looks:
#   The solver stores a floating-point "wet-map" alongside the
#   colour map.  Wet paint spreads; dry paint is fixed.  The
#   two maps interact: drying speed applies only to dry-side
#   pixels; spreading speed is modulated by wetness.  If you
#   set dry_speed too low the whole canvas stays wet and looks
#   blurry; too high and paint dries before it can spread.  The
#   sweet spot for a realistic trail on sand is dry_speed ≈ 30–50
#   frames and spread_speed ≈ 1.0–2.0.
#
# Brush paint_source = 'VOLUME':
#   The sphere is treated as a solid body.  Any canvas vertex
#   inside the sphere's volume at the current frame receives
#   full paint coverage.  Use 'DISTANCE' for a soft halo that
#   fades with distance beyond the surface.  'POINT' treats the
#   object origin as a single point source — useful for particle
#   brushes where each particle is a point.
#
# Vertex vs Image format:
#   VERTEX writes straight to a mesh colour attribute (instant
#   viewport preview, zero UV setup, limited by vertex count).
#   IMAGE writes to a baked PNG sequence in UV space (clean edges,
#   arbitrary resolution, requires UV unwrap first).  This script
#   uses VERTEX so you can see the result immediately without baking.

import bpy
import math

# ── Parameters ─────────────────────────────────────────────
GRID_SIZE            = 2.4      # world-space edge length of the canvas plane
GRID_CUTS            = 60       # edge subdivisions → 3721 vertices at 60
SPHERE_RADIUS        = 0.18
BRUSH_COLOUR         = (0.06, 0.44, 0.82)   # cobalt blue
BRUSH_WETNESS        = 1.0      # 0–1; drives spread rate
BRUSH_SMOOTH         = 1.2      # edge-softness relative to sphere radius
DRY_SPEED            = 40       # half-life of wet paint in frames
SPREAD_SPEED         = 1.5      # lateral spread per frame (world units)
FRAME_START          = 1
FRAME_END            = 90       # 3 s at 30 fps
DP_OUTPUT_NAME       = "dp_paint"    # vertex colour attribute name

# Path: brush sweeps diagonally across the canvas for visual interest
PATH_START           = (-0.9,  0.6, SPHERE_RADIUS + 0.005)
PATH_MID             = ( 0.0, -0.1, SPHERE_RADIUS + 0.005)
PATH_END             = ( 0.9, -0.5, SPHERE_RADIUS + 0.005)

# ── Scene reset ────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END

# ── Canvas: dense flat plane ───────────────────────────────
# 'Simple' subdivision keeps quads flat — no smoothing artefacts
# that would distort the vertex colour gradient at low counts.
bpy.ops.mesh.primitive_grid_add(
    x_subdivisions = GRID_CUTS,
    y_subdivisions = GRID_CUTS,
    size           = GRID_SIZE,
    location       = (0, 0, 0),
)
canvas = bpy.context.active_object
canvas.name = "canvas_plane"

# Pre-initialise the vertex colour attribute that Dynamic Paint will write.
# Without this, the attribute doesn't exist at frame 1 and the shader
# sees black (default fallback) rather than the ivory canvas colour.
attr = canvas.data.color_attributes.new(
    name   = DP_OUTPUT_NAME,
    type   = 'BYTE_COLOR',
    domain = 'POINT',
)
# Flood fill with near-white so unpainted areas read as the canvas base
for sample in attr.data:
    sample.color = (0.93, 0.91, 0.86, 1.0)

# ── Canvas material ────────────────────────────────────────
mat = bpy.data.materials.new("mat_canvas")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new('ShaderNodeOutputMaterial')
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
vcol = nt.nodes.new('ShaderNodeVertexColor')
mix  = nt.nodes.new('ShaderNodeMixRGB')   # legacy node; still valid in 5.1

out.location  = ( 600, 0)
bsdf.location = ( 300, 0)
mix.location  = (   0, 0)
vcol.location = (-300, 0)

vcol.layer_name          = DP_OUTPUT_NAME
mix.blend_type           = 'MIX'
mix.inputs[1].default_value = (0.93, 0.91, 0.86, 1.0)   # ivory base
mix.inputs[2].default_value = (*BRUSH_COLOUR, 1.0)       # paint colour

# Alpha channel of vertex colour drives the mix factor:
# 0 = unpainted (ivory), 1 = fully painted
nt.links.new(vcol.outputs['Alpha'], mix.inputs['Fac'])
nt.links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.78
nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

canvas.data.materials.append(mat)

# ── Canvas Dynamic Paint modifier ─────────────────────────
dp_canvas = canvas.modifiers.new("DynamicPaint", 'DYNAMIC_PAINT')
dp_canvas.ui_type = 'CANVAS'

surf = dp_canvas.canvas_settings.canvas_surfaces[0]
surf.surface_type   = 'PAINT'    # PAINT accumulates colour + wet map
surf.surface_format = 'VERTEX'   # write to colour attribute, not image seq
surf.output_name_a  = DP_OUTPUT_NAME
surf.output_name_b  = DP_OUTPUT_NAME + "_wet"
surf.frame_start    = FRAME_START
surf.frame_end      = FRAME_END

# Drying: paint transitions from wet → dry over dry_speed frames.
# Once dry, spread stops; colour is fixed.
surf.use_drying  = True
surf.dry_speed   = DRY_SPEED

# Spreading: wet paint bleeds outward along the mesh surface.
# spread_speed is in Blender world-units/second, approximately.
surf.use_spread    = True
surf.spread_speed  = SPREAD_SPEED

# ── Brush: animated sphere ─────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    radius     = SPHERE_RADIUS,
    segments   = 12,
    ring_count = 8,
    location   = PATH_START,
)
brush_obj = bpy.context.active_object
brush_obj.name = "brush_sphere"

# Three-point diagonal sweep: start → mid → end
scene.frame_set(FRAME_START)
brush_obj.location = PATH_START
brush_obj.keyframe_insert("location")

scene.frame_set(FRAME_START + (FRAME_END - FRAME_START) // 2)
brush_obj.location = PATH_MID
brush_obj.keyframe_insert("location")

scene.frame_set(FRAME_END)
brush_obj.location = PATH_END
brush_obj.keyframe_insert("location")

# Linear interpolation → constant-velocity drag across the canvas
for fc in brush_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Brush Dynamic Paint modifier ───────────────────────────
dp_brush = brush_obj.modifiers.new("DynamicPaint", 'DYNAMIC_PAINT')
dp_brush.ui_type = 'BRUSH'

br = dp_brush.brush_settings
br.paint_color   = BRUSH_COLOUR
br.paint_alpha   = 1.0
br.paint_wetness = BRUSH_WETNESS
br.smooth_radius = BRUSH_SMOOTH   # 1.2 = 20 % of brush radius added as falloff

# VOLUME: every canvas vertex that intersects the sphere's volume
# gets full-alpha paint.  No distance falloff inside the volume.
br.paint_source = 'VOLUME'

# Simple grey for the sphere — it shouldn't distract
mat_b = bpy.data.materials.new("mat_brush")
mat_b.use_nodes = True
mat_b.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (
    0.25, 0.25, 0.28, 1.0)
brush_obj.data.materials.append(mat_b)

# ── Lighting & camera ──────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, 4, 8))
sun = bpy.context.active_object
sun.data.energy      = 4.0
sun.rotation_euler   = (math.radians(40), 0, math.radians(25))

bpy.ops.object.camera_add(location=(0, -2.8, 2.4))
cam = bpy.context.active_object
cam.rotation_euler   = (math.radians(52), 0, 0)
scene.camera = cam

# ── Bake simulation ────────────────────────────────────────
# bpy.ops.dpaint.bake() steps through every frame, evaluates the
# brush against the canvas and writes the result into the vertex
# colour attribute.  Only works with the canvas selected + active.
bpy.ops.object.select_all(action='DESELECT')
canvas.select_set(True)
bpy.context.view_layer.objects.active = canvas

try:
    bpy.ops.dpaint.bake()
    print("[DP] Bake complete — scrub timeline to see trail.")
except RuntimeError as exc:
    # Context restrictions may block the operator in headless mode.
    # In that case bake manually: Physics → Dynamic Paint → Bake.
    print(f"[DP] Operator unavailable in this context: {exc}")
    print("     Open the file in Blender and click  Bake  under Dynamic Paint.")

# Rewind to mid-trail for the viewport preview screenshot
scene.frame_set(45)
