"""
GN Set Handle Positions — Parametric Bezier S-Curve Taper Ribbon
Blender 5.1  ·  Holoflow Studio blueprint
=============================================================================
Node chain:
  CurveLine → SetHandleType(FREE) → SetHandlePositions(P0 RIGHT)
  → SetHandlePositions(P1 LEFT) → SplineParameter → MapRange
  → SetCurveRadius → Resample → CurveToMesh(line profile) → output

WHY SetHandleType FREE must come before SetHandlePositions:
  Blender evaluates handle types AFTER the GN modifier writes positions.
  If any handle remains AUTO/BEZIER/ALIGN/VECTOR, Blender recomputes
  its position automatically, silently discarding what you set.
  Setting FREE is the lock that makes manually specified positions stick.
  This is the single most common mistake when working with this node.

WHY Offset=False (default) for absolute object-space positioning:
  Offset=True adds your vector to the AUTO handle position, which depends
  on adjacent control-point spacing — unpredictable in procedural contexts.
  Offset=False treats the position as raw object-space coordinates,
  giving deterministic S-curve shape regardless of the curve's own scale.

WHY only set P0-RIGHT and P1-LEFT (not all four handles):
  For an open two-point bezier:
    P0 LEFT  — the curve does not continue past start, so this handle
               has no effect on curve shape (it only matters on closed curves
               or if you add a segment going backwards).
    P0 RIGHT — controls the tangent LEAVING P0. This is the operative handle
               for the shape between P0 and P1. Must be set.
    P1 LEFT  — controls the tangent ENTERING P1. Also operative. Must be set.
    P1 RIGHT — the curve does not continue past end. No shape effect.
  Setting unused handles wastes nodes and adds confusion.

WHY Resample after SetHandlePositions:
  SetHandlePositions writes bezier handle data into the spline's EVALUATED
  form (the implicit arc). Curve to Mesh reads the evaluated polyline.
  Without an explicit Resample, resolution is controlled by the curve's
  resolution_u property (default 12 subdivisions per segment) — coarse.
  Resample with COUNT=120 produces a smooth silhouette with no visual cost.

WHY taper via SetCurveRadius + MapRange instead of a tapered profile:
  A tapered profile is a second curve that changes cross-section size.
  SetCurveRadius is a per-point scalar that Curve to Mesh multiplies with
  the profile radius. MapRange lets you shape the taper as a function of
  Spline Parameter (0=start, 1=end) using any mathematical envelope.
  Here: radius = sin(t * π) gives a bell — thin at tips, full at centre.
"""

import bpy, math, os

# ── Constants ─────────────────────────────────────────────────────────────────
BLEND_DIR      = os.path.dirname(os.path.abspath(__file__))
OUTPUT_GLB     = os.path.join(BLEND_DIR, "s_curve_ribbon.glb")
CURVE_LENGTH   = 1.0        # world units: Y span from start to end control point
HANDLE_SPREAD  = 0.55       # X offset of operative handles → S-curve width
PROFILE_RADIUS = 0.032      # half-width of the flat ribbon cross-section
RESAMPLE_COUNT = 120        # polyline resolution (subdivisions per segment)

# ── 1. Scene reset ────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "SCurveTaperRibbon"

# ── 2. Geometry Nodes tree ────────────────────────────────────────────────────
ng = bpy.data.node_groups.new("GN_SCurveTaper", "GeometryNodeTree")
ng.interface.new_socket("Geometry",      in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Handle_Spread", in_out="INPUT",  socket_type="NodeSocketFloat")
ng.interface.new_socket("Profile_Radius",in_out="INPUT",  socket_type="NodeSocketFloat")
ng.interface.new_socket("Geometry",      in_out="OUTPUT", socket_type="NodeSocketGeometry")

for sock in ng.interface.items_tree:
    if sock.name == "Handle_Spread":
        sock.default_value = HANDLE_SPREAD
        sock.min_value     = 0.0
        sock.max_value     = 2.0
    elif sock.name == "Profile_Radius":
        sock.default_value = PROFILE_RADIUS
        sock.min_value     = 0.004
        sock.max_value     = 0.25

nodes = ng.nodes
links = ng.links

def N(bl_id, x, y, label=""):
    n = nodes.new(bl_id)
    n.location = (x, y)
    if label:
        n.label = label
    return n

gIn  = N("NodeGroupInput",  -2200, 0)
gOut = N("NodeGroupOutput",  2200, 0)

# ── 3. Curve Line: two control points on the Y axis ───────────────────────────
line = N("GeometryNodeCurvePrimitiveLine", -1900, 0, "Curve Line")
line.mode = 'POINTS'
line.inputs["Start"].default_value = (0.0, -CURVE_LENGTH / 2, 0.0)
line.inputs["End"].default_value   = (0.0,  CURVE_LENGTH / 2, 0.0)

# ── 4. Set Handle Type → FREE on both handles of every control point ───────────
sht = N("GeometryNodeCurveSetHandles", -1600, 0, "Set Handle Type FREE")
sht.mode        = {'LEFT', 'RIGHT'}   # applies to both handle sides
sht.handle_type = 'FREE'
links.new(line.outputs["Curve"], sht.inputs["Curve"])

# ── 5. Index node (shared across all selection comparisons) ──────────────────
idx = N("GeometryNodeInputIndex", -1750, -250, "Index")

# Boolean selection: Index == 0 (start control point)
sel0 = N("ShaderNodeMath", -1550, -250, "Sel: Index==0")
sel0.operation = 'COMPARE'
sel0.inputs[1].default_value = 0.0   # target index
sel0.inputs[2].default_value = 0.5   # epsilon < 1 → exact integer comparison
links.new(idx.outputs["Index"], sel0.inputs[0])

# Boolean selection: Index == 1 (end control point)
sel1 = N("ShaderNodeMath", -1550, -420, "Sel: Index==1")
sel1.operation = 'COMPARE'
sel1.inputs[1].default_value = 1.0
sel1.inputs[2].default_value = 0.5
links.new(idx.outputs["Index"], sel1.inputs[0])

# ── 6. Negate Handle_Spread for left-side handle positions ──────────────────
neg = N("ShaderNodeMath", -1550, -90, "Neg Spread")
neg.operation = 'MULTIPLY'
neg.inputs[1].default_value = -1.0
links.new(gIn.outputs["Handle_Spread"], neg.inputs[0])

# ── 7. Handle positions for the S-curve ──────────────────────────────────────
# P0 RIGHT: (+spread, -length/4, 0)
# The start point exits toward +X, creating the lower arc of the S.
p0r = N("ShaderNodeCombineXYZ", -1350,  -80, "P0 Right Pos")
p0r.inputs["Y"].default_value = -CURVE_LENGTH / 4
p0r.inputs["Z"].default_value = 0.0
links.new(gIn.outputs["Handle_Spread"], p0r.inputs["X"])

# P1 LEFT: (-spread, +length/4, 0)
# The end point is entered from -X, completing the upper arc of the S.
p1l = N("ShaderNodeCombineXYZ", -1350, -300, "P1 Left Pos")
p1l.inputs["Y"].default_value =  CURVE_LENGTH / 4
p1l.inputs["Z"].default_value = 0.0
links.new(neg.outputs["Value"], p1l.inputs["X"])

# ── 8. Set Handle Positions: P0 RIGHT ─────────────────────────────────────────
shp0 = N("GeometryNodeSetCurveHandlePositions", -1100, 0, "SHP: P0 Right")
shp0.mode = 'RIGHT'
links.new(sht.outputs["Curve"],           shp0.inputs["Curve"])
links.new(sel0.outputs["Value"],          shp0.inputs["Selection"])
links.new(p0r.outputs["Vector"],          shp0.inputs["Position"])

# ── 9. Set Handle Positions: P1 LEFT ──────────────────────────────────────────
shp1 = N("GeometryNodeSetCurveHandlePositions", -800, 0, "SHP: P1 Left")
shp1.mode = 'LEFT'
links.new(shp0.outputs["Curve"],          shp1.inputs["Curve"])
links.new(sel1.outputs["Value"],          shp1.inputs["Selection"])
links.new(p1l.outputs["Vector"],          shp1.inputs["Position"])

# ── 10. Taper via SetCurveRadius driven by sin(t·π) ──────────────────────────
# Spline Parameter (Factor) gives 0.0 at P0 → 1.0 at P1.
sparam = N("GeometryNodeSplineParameter", -600, -200, "Spline Param")

# Map Factor [0,1] through sin(t·π): returns 0 at tips, 1 at centre.
# MapRange: From Min=0, From Max=1, To Min=0, To Max=π
tpi = N("ShaderNodeMath", -400, -200, "t * PI")
tpi.operation = 'MULTIPLY'
tpi.inputs[1].default_value = math.pi
links.new(sparam.outputs["Factor"], tpi.inputs[0])

sin_t = N("ShaderNodeMath", -200, -200, "sin(t·PI)")
sin_t.operation = 'SINE'
links.new(tpi.outputs["Value"], sin_t.inputs[0])

# Radius = Profile_Radius * sin(t·PI)
rad_mult = N("ShaderNodeMath", 0, -200, "Radius")
rad_mult.operation = 'MULTIPLY'
links.new(sin_t.outputs["Value"],         rad_mult.inputs[0])
links.new(gIn.outputs["Profile_Radius"],  rad_mult.inputs[1])

set_rad = N("GeometryNodeSetCurveRadius", -600, 0, "Set Curve Radius")
links.new(shp1.outputs["Curve"],          set_rad.inputs["Curve"])
links.new(rad_mult.outputs["Value"],      set_rad.inputs["Radius"])

# ── 11. Resample Curve (collapses evaluated bezier to explicit polyline) ───────
res = N("GeometryNodeResampleCurve", -350, 0, "Resample")
res.mode = 'COUNT'
res.inputs["Count"].default_value = RESAMPLE_COUNT
links.new(set_rad.outputs["Curve"],       res.inputs["Curve"])

# ── 12. Profile: flat line segment for ribbon cross-section ───────────────────
prof = N("GeometryNodeCurvePrimitiveLine", -100, -200, "Ribbon Profile")
prof.mode = 'POINTS'
prof.inputs["Start"].default_value = (-PROFILE_RADIUS, 0.0, 0.0)
prof.inputs["End"].default_value   = ( PROFILE_RADIUS, 0.0, 0.0)

# ── 13. Curve to Mesh ──────────────────────────────────────────────────────────
ctm = N("GeometryNodeCurveToMesh", -100, 0, "Curve to Mesh")
ctm.inputs["Fill Caps"].default_value = False   # open ribbon ends; caps add unwanted quads
links.new(res.outputs["Curve"],           ctm.inputs["Curve"])
links.new(prof.outputs["Curve"],          ctm.inputs["Profile Curve"])

# ── 14. Shade smooth ───────────────────────────────────────────────────────────
sms = N("GeometryNodeSetShadeSmooth", 150, 0, "Shade Smooth")
sms.domain = 'FACE'
sms.inputs["Shade Smooth"].default_value = True
links.new(ctm.outputs["Mesh"],            sms.inputs["Geometry"])
links.new(sms.outputs["Geometry"],        gOut.inputs["Geometry"])

# ── 15. Carrier mesh + modifier ───────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=0.01)
carrier = bpy.context.active_object
carrier.name = "s_curve_ribbon"

mod = carrier.modifiers.new("GN_SCurveTaper", 'NODES')
mod.node_group = ng
mod["Socket_2"]  = HANDLE_SPREAD
mod["Socket_3"]  = PROFILE_RADIUS

# ── 16. Camera ────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(2.0, -1.5, 1.0))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(65), 0, math.radians(50))
scene.camera = cam

# ── 17. Key light ─────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(1.5, -1.0, 2.0))
light = bpy.context.active_object
light.data.energy  = 60.0
light.data.size    = 1.5
light.rotation_euler = (math.radians(45), 0, math.radians(30))

# ── 18. Emissive ribbon material ───────────────────────────────────────────────
mat = bpy.data.materials.new("ribbon_emissive")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (600, 0)
mix  = nt.nodes.new("ShaderNodeMixShader");      mix.location = (400, 0)
mix.inputs["Fac"].default_value = 0.55

bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (0, 100)
bsdf.inputs["Base Color"].default_value = (0.95, 0.35, 0.05, 1.0)   # coral orange
bsdf.inputs["Roughness"].default_value  = 0.30

emit = nt.nodes.new("ShaderNodeEmission");       emit.location = (0, -100)
emit.inputs["Color"].default_value   = (1.0, 0.45, 0.1, 1.0)
emit.inputs["Strength"].default_value = 6.0

nt.links.new(bsdf.outputs["BSDF"],      mix.inputs[1])
nt.links.new(emit.outputs["Emission"],  mix.inputs[2])
nt.links.new(mix.outputs["Shader"],     out.inputs["Surface"])

carrier.data.materials.append(mat)

# ── 19. GLB export ────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath              = OUTPUT_GLB,
    export_format         = 'GLB',
    export_apply          = True,          # materialise GN modifier before export
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format   = 'WEBP',
)
print(f"[blueprint] Exported GLB → {OUTPUT_GLB}")
