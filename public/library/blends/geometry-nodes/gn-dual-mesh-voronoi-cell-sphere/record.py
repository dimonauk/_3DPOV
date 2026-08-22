"""
record.py — viewport animation recorder for gn-dual-mesh-voronoi-cell-sphere
Outputs: public/library/videos/geometry-nodes/gn-dual-mesh-voronoi-cell-sphere/viewport.mp4

Run AFTER blueprint.py has written voronoi_cell_sphere.blend:
  blender voronoi_cell_sphere.blend --background --python record.py

Animation: the camera orbits 120 ° around the sphere in 3 s while the Noise
Strength socket animates from 0.0 to 0.14, showing the cell pattern evolving
from uniform hexagons (the classic geodesic dome dual) to organic irregular
Voronoi plates.  The transition makes the technique legible at a glance: you
see exactly how vertex perturbation controls cell irregularity.

WHY camera orbit rather than static?
  The extruded tiles produce angled side walls — a static camera at 0°
  misses most of the depth information.  A 120° orbit lets viewers read
  both the top face (cell plan) and the groove (gap + depth) in one clip.
"""

import bpy
import math

OUTPUT_PATH   = "//../../videos/geometry-nodes/gn-dual-mesh-voronoi-cell-sphere/viewport"
ANIM_FRAMES   = 72
FPS           = 24
RES_X, RES_Y  = 1280, 720
CAM_RADIUS    = 2.8    # orbit radius
CAM_HEIGHT    = 1.4    # fixed elevation during orbit
ORBIT_START   = math.radians(30)
ORBIT_END     = math.radians(150)
NS_START      = 0.0    # noise strength at frame 1
NS_END        = 0.14   # noise strength at final frame


def setup_camera_orbit() -> bpy.types.Object:
    """Create an empty at origin; camera parented to it and offset radially."""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    pivot = bpy.context.active_object
    pivot.name = "CamPivot"

    bpy.ops.object.camera_add(location=(CAM_RADIUS, 0, CAM_HEIGHT))
    cam_obj = bpy.context.active_object
    cam_obj.name = "RecordCam"
    cam_obj.data.lens = 50
    bpy.context.scene.camera = cam_obj

    # Parent camera to pivot; child_of via matrix to preserve world offset.
    cam_obj.parent = pivot
    cam_obj.parent_type = 'OBJECT'

    # Point camera at origin each frame via a Track-To constraint.
    ct = cam_obj.constraints.new('TRACK_TO')
    ct.target       = pivot
    ct.track_axis   = 'TRACK_NEGATIVE_Z'
    ct.up_axis      = 'UP_Y'

    return pivot


def keyframe_orbit(pivot: bpy.types.Object) -> None:
    scene = bpy.context.scene

    scene.frame_set(1)
    pivot.rotation_euler = (0, 0, ORBIT_START)
    pivot.keyframe_insert('rotation_euler', frame=1)

    scene.frame_set(ANIM_FRAMES)
    pivot.rotation_euler = (0, 0, ORBIT_END)
    pivot.keyframe_insert('rotation_euler', frame=ANIM_FRAMES)

    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'   # constant-speed orbit


def keyframe_noise_strength() -> None:
    """Find the sphere object and animate its Noise Strength GN socket."""
    obj = bpy.data.objects.get("VoronoiCellSphere")
    if obj is None:
        print("WARNING: VoronoiCellSphere object not found — skipping NS keyframe")
        return

    mod = next((m for m in obj.modifiers if m.type == 'NODES'), None)
    if mod is None:
        return

    ns_id = None
    for item in mod.node_group.interface.items_tree:
        if item.name == "Noise Strength":
            ns_id = item.identifier
            break

    if ns_id is None:
        print("WARNING: 'Noise Strength' socket not found.")
        return

    scene = bpy.context.scene
    scene.frame_set(1)
    mod[ns_id] = NS_START
    mod.keyframe_insert(data_path=f'["{ns_id}"]', frame=1)

    scene.frame_set(ANIM_FRAMES)
    mod[ns_id] = NS_END
    mod.keyframe_insert(data_path=f'["{ns_id}"]', frame=ANIM_FRAMES)

    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def setup_lighting() -> None:
    for obj in list(bpy.data.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.data.angle  = 0.04

    bpy.ops.object.light_add(type='AREA', location=(-3, 3, 3))
    fill = bpy.context.active_object
    fill.data.energy = 100
    fill.data.size   = 5.0


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine           = 'BLENDER_EEVEE_NEXT'
    scene.render.filepath         = OUTPUT_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format    = 'MPEG4'
    scene.render.ffmpeg.codec     = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.resolution_x     = RES_X
    scene.render.resolution_y     = RES_Y
    scene.render.fps              = FPS
    scene.frame_start             = 1
    scene.frame_end               = ANIM_FRAMES
    scene.render.film_transparent = True


def main() -> None:
    pivot = setup_camera_orbit()
    keyframe_orbit(pivot)
    keyframe_noise_strength()
    setup_lighting()
    setup_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"✓ viewport.mp4 → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()
