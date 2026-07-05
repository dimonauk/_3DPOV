"""
record.py — viewport animation for python-movieclip-motion-tracking-camera-solve-webxr-ar
Outputs: public/library/videos/scripting/python-movieclip-motion-tracking-camera-solve-webxr-ar/viewport.mp4

Renders a 5-second (150-frame at 30fps) turntable of the solved camera path:
- The reconstructed scene cloud as small icospheres at each track's 3D position
- The solved camera animated along its solved trajectory
- A floor grid for spatial reference

Run from the Blender Scripting workspace after executing blueprint.py.
"""

import bpy
import math
from mathutils import Vector

# ── Constants ──────────────────────────────────────────────────────────────────
OUT_PATH  = bpy.path.abspath(
    "//../../../../videos/scripting/"
    "python-movieclip-motion-tracking-camera-solve-webxr-ar/viewport"
)
ANIM_LEN  = 150    # frames to render (5 s at 30 fps)
TURNTABLE_RADIUS = 4.0

scene = bpy.context.scene
scene.render.fps        = 30
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.frame_start = 1
scene.frame_end   = ANIM_LEN

# ── Viewport shading — solid, cavity on ───────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        sp = area.spaces.active
        sp.shading.type = "SOLID"
        sp.shading.show_cavity = True
        sp.shading.cavity_type  = "WORLD"
        sp.overlay.show_floor   = True
        sp.overlay.show_axis_x  = True
        sp.overlay.show_axis_y  = True
        break

# ── Floor grid ────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_grid_add(size=8, x_subdivisions=16, y_subdivisions=16,
                                 location=(0, 0, 0))
grid = bpy.context.active_object
grid.name = "FloorGrid"
mat = bpy.data.materials.new("GridMat")
mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = \
    (0.05, 0.05, 0.08, 1.0)
grid.data.materials.append(mat)

# ── Track cloud: small icospheres at reconstructed 3D point positions ─────────
clip = next((c for c in bpy.data.movieclips), None)
if clip is not None:
    ico_mesh = bpy.data.meshes.new("ico_pt")
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.03, subdivisions=1)
    proto = bpy.context.active_object
    proto.name = "TrackPoint_proto"
    proto_mesh = proto.data

    for i, track in enumerate(clip.tracking.tracks):
        # Use the 3D reconstructed position stored on the track
        bundle = track.bundle
        if bundle.length_squared < 0.0001:
            continue
        obj = bpy.data.objects.new(f"tp_{i:03d}", proto_mesh)
        obj.location = bundle
        bpy.context.collection.objects.link(obj)
    bpy.data.objects.remove(proto, do_unlink=True)

# ── Render camera — turntable around origin ───────────────────────────────────
bpy.ops.object.camera_add(location=(TURNTABLE_RADIUS, -TURNTABLE_RADIUS, 2.5))
render_cam = bpy.context.active_object
render_cam.name = "RenderCam_Turntable"
bpy.context.scene.camera = render_cam

# Point at origin
track_to = render_cam.constraints.new("TRACK_TO")
track_to.target = bpy.data.objects.get("FloorGrid")  # tracks towards grid centre

# Keyframe the turntable rotation
for f in range(1, ANIM_LEN + 1):
    angle = (f / ANIM_LEN) * 2 * math.pi
    render_cam.location = Vector((
        math.cos(angle) * TURNTABLE_RADIUS,
        math.sin(angle) * TURNTABLE_RADIUS,
        2.5,
    ))
    render_cam.keyframe_insert("location", frame=f)

# ── Output ────────────────────────────────────────────────────────────────────
scene.render.filepath = OUT_PATH
bpy.ops.render.render(animation=True, use_viewport=False)
print(f"[record] viewport animation → {OUT_PATH}.mp4")
