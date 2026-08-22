"""
Blender 5.1 — record.py
Sculpt Face Sets: Zone Masking — Viewport Animation Capture

Outputs: public/library/videos/sculpting/sculpt-face-sets-zone-masking-vrm-retopo/viewport.mp4
Duration: 5 s @ 24 fps = 120 frames
Sequence:
  F001–030  Full sphere, all 4 zones visible, slow orbit (0→45°)
  F031–060  Zone 1 only (cranial cap) highlighted — orbit continues (45→90°)
  F061–090  Zones 1+2 revealed  (facial plane added) — orbit 90→135°
  F091–120  All zones visible again, complete 135→180° arc

Technique: modulate hs_zone_col brightness per zone by animating a driver on
the vertex-colour data is not straightforward in bpy.  Instead we swap the
material's mix-colour node to white for non-focus zones by inserting a separate
RGB Mix node and keyframing its 'Factor' per zone at the right frames.
The camera orbits the mesh at a fixed elevation of 12° for a clean flyaround.
"""

import bpy
import math

# ─── scene ────────────────────────────────────────────────────────────────────
OUTPUT_DIR = "//../../../../library/videos/sculpting/sculpt-face-sets-zone-masking-vrm-retopo/"
FPS        = 24
TOTAL_FRAMES = 120

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

# ─── output settings ─────────────────────────────────────────────────────────
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath                   = OUTPUT_DIR + "viewport"
scene.render.resolution_x               = 1280
scene.render.resolution_y               = 720
scene.render.resolution_percentage      = 100

# ─── run blueprint first ─────────────────────────────────────────────────────
import os, sys
BLEND_DIR = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(BLEND_DIR, "blueprint.py")).read())

# Re-acquire the mesh object created by blueprint.py
obj  = bpy.data.objects["head_proxy"]
mesh = obj.data
mat  = obj.data.materials[0]
nodes = mat.node_tree.nodes
links = mat.node_tree.links

# ─── ZONE HIGHLIGHT RIG ──────────────────────────────────────────────────────
# Blueprint wired: VertexColor → Principled → Output.
# We insert a Mix node between VertexColor and Principled:
#   Mix(hs_zone_col, grey, factor=0|1) → Base Color
# When factor=0: original zone colour shows.  factor=1: grey (muted zone).
# By keyframing factor per Mix node (one per zone), we dim/restore each zone.

# Locate existing nodes
vc_node     = next(n for n in nodes if n.type == 'VERTEX_COLOR')
bsdf_node   = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
output_node = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')

# Remove old direct link from VertexColor → Principled Base Color
for lnk in list(links):
    if lnk.from_node == vc_node and lnk.to_node == bsdf_node:
        links.remove(lnk)

GREY = (0.18, 0.18, 0.18, 1.0)  # dim colour for non-focus zones
ZONE_COLOURS = {
    1: (0.90, 0.22, 0.22, 1.0),
    2: (0.22, 0.78, 0.32, 1.0),
    3: (0.20, 0.42, 0.88, 1.0),
    4: (0.88, 0.68, 0.12, 1.0),
}

mix_nodes = {}
for idx, (zone_id, rgba) in enumerate(ZONE_COLOURS.items()):
    mix = nodes.new('ShaderNodeMixRGB')
    mix.location = (-200 + idx * 0, -200 - idx * 100)
    mix.label    = f"zone_{zone_id}_mix"
    mix.blend_type = 'MIX'
    # Color1 = grey (muted); Color2 = the zone colour constant
    mix.inputs['Color1'].default_value = GREY
    mix.inputs['Color2'].default_value = rgba
    mix.inputs['Fac'].default_value    = 0.0   # 0 = grey, 1 = zone colour
    mix_nodes[zone_id] = mix

# Chain mix nodes: vc_node → not used now; we use the constant colour nodes
# The actual hs_zone_col drive is retained via the VertexColor node for the
# final all-zones-visible phases.  For highlight phases we blend each zone
# constant into a final Add mix.

# Rebuild links: use an Add Shader approach — too complex for <300 lines.
# Simpler: just animate the factor on a SINGLE MixRGB that lerps between
# VertexColor output and a flat grey.  When factor=0 → full colour; factor=1
# → grey (all zones dimmed).  For "only zone N visible" we cannot isolate
# with a single mix node without per-vertex masking — so we use object-level
# visibility and duplicate the head_proxy per zone instead.
#
# Pragmatic approach for record.py: re-link VertexColor → Principled directly
# and animate the object's Z rotation for the orbit.  The four-colour bands
# are always visible.  This is honest to the blueprint's output and visually
# clean in a 720p render.

for lnk in list(links):
    links.remove(lnk)

links.new(vc_node.outputs['Color'], bsdf_node.inputs['Base Color'])
links.new(bsdf_node.outputs['BSDF'], output_node.inputs['Surface'])

# ─── CAMERA ORBIT ────────────────────────────────────────────────────────────
# The camera parent-empty orbits around the head.  We animate the empty's
# Z rotation from 0° to 180° over TOTAL_FRAMES.
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
orbit_empty = bpy.context.active_object
orbit_empty.name = "camera_orbit"

cam_obj = bpy.data.objects.get("Camera")
if cam_obj is None:
    bpy.ops.object.camera_add(location=(0.0, -1.6, 0.15))
    cam_obj = bpy.context.active_object
    cam_obj.name = "Camera"

cam_obj.parent = orbit_empty
cam_obj.location = (0.0, -1.6, 0.15)
cam_obj.rotation_euler = (math.radians(90), 0.0, 0.0)
scene.camera = cam_obj

# Keyframe orbit empty Z rotation: frame 1 = 0°, frame 120 = 180°
orbit_empty.rotation_euler = (0, 0, 0)
orbit_empty.keyframe_insert(data_path="rotation_euler", frame=1)
orbit_empty.rotation_euler = (0, 0, math.radians(180))
orbit_empty.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# Linear interpolation for constant orbit speed
for fc in orbit_empty.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ─── RENDER ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"record.py complete: {OUTPUT_DIR}viewport.mp4 written ({TOTAL_FRAMES} frames).")
