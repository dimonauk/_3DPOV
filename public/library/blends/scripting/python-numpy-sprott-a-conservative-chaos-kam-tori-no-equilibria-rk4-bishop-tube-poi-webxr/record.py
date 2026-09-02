"""
record.py — Viewport animation render for Sprott A poi head · Blender 5.1
==========================================================================
Renders a 10-second (300-frame) 30 fps H.264 viewport animation.
The camera orbits 270° around the poi head, starting front-right and
sweeping counter-clockwise at 20° elevation, letting the viewer appreciate
the non-attractor structure of the conservative orbit.

Run from terminal (after running blueprint.py to create the .blend):
    blender -b hf_sprott_a_poi.blend -P record.py

Output:
    public/library/videos/scripting/
    python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr/
    viewport.mp4
"""
import bpy, math, mathutils

_SLUG = ("python-numpy-sprott-a-conservative-chaos-"
         "kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr")
OUTPUT = (f"//../../../../../../public/library/videos/scripting/{_SLUG}/viewport.mp4")

FPS    = 30
FRAMES = 300   # 10 s

def main() -> None:
    scene = bpy.context.scene
    scene.render.engine              = "BLENDER_WORKBENCH"
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.fps                  = FPS
    scene.frame_start                 = 1
    scene.frame_end                   = FRAMES
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format        = "MPEG4"
    scene.render.ffmpeg.codec         = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath             = OUTPUT

    # Remove any existing lights
    for obj in list(scene.objects):
        if obj.type == "LIGHT":
            bpy.data.objects.remove(obj, do_unlink=True)

    # Three-point studio lighting for dark WebXR aesthetic
    def add_light(name: str, loc: tuple, energy: float, kind: str = "POINT") -> None:
        bpy.ops.object.light_add(type=kind, location=loc)
        lt = bpy.context.active_object
        lt.name = name; lt.data.energy = energy

    add_light("Key",  ( 8,  4, 12), 900, "POINT")
    add_light("Fill", (-6, -3,  6), 350, "POINT")
    add_light("Rim",  ( 0, -9,  3), 200, "POINT")

    # Create camera
    cam_data        = bpy.data.cameras.new("RecordCam")
    cam_data.lens   = 50
    cam             = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera    = cam

    radius  = 14.0
    elev    = math.radians(22)          # slight upward tilt
    arc     = 1.5 * math.pi             # 270° sweep

    for f in range(1, FRAMES + 1):
        t     = (f - 1) / max(FRAMES - 1, 1)
        angle = t * arc                 # 0 → 270°
        cx    = radius * math.cos(angle) * math.cos(elev)
        cy    = radius * math.sin(angle) * math.cos(elev)
        cz    = radius * math.sin(elev)
        cam.location = (cx, cy, cz)
        # Point camera at scene origin
        fwd = mathutils.Vector((0.0, 0.0, 0.0)) - mathutils.Vector((cx, cy, cz))
        cam.rotation_euler = fwd.to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location",       frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

    bpy.ops.render.render(animation=True)
    print("✓ Sprott A record.py complete")

if __name__ == "__main__":
    main()
