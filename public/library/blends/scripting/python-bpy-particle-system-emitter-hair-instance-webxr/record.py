"""
record.py — viewport animation for particle scatter tutorial
Outputs: public/library/videos/scripting/python-bpy-particle-system-emitter-hair-instance-webxr/viewport.mp4

Animates:
  0-20  : particles appear one by one (lifetime sweep)
  20-48 : camera orbits, instances visible at final scatter position
  48-72 : hair strand reveal (path_end 0 → 1)
"""

import bpy
import math

SLUG        = "python-bpy-particle-system-emitter-hair-instance-webxr"
OUT_PATH    = f"//../../videos/scripting/{SLUG}/viewport.mp4"
FPS         = 30
FRAME_END   = 72
RESOLUTION  = (1280, 720)


def _configure_output():
    s  = bpy.context.scene
    rd = s.render
    rd.resolution_x, rd.resolution_y = RESOLUTION
    rd.fps                            = FPS
    rd.image_settings.file_format     = "FFMPEG"
    rd.ffmpeg.format                  = "MPEG4"
    rd.ffmpeg.codec                   = "H264"
    rd.ffmpeg.constant_rate_factor    = "MEDIUM"
    rd.filepath                       = OUT_PATH
    s.frame_start = 0
    s.frame_end   = FRAME_END


def _setup_camera(col: bpy.types.Collection):
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    col.objects.link(cam_ob)
    cam_ob.location    = (0.0, -5.0, 3.0)
    cam_ob.rotation_euler = (math.radians(55), 0, 0)
    bpy.context.scene.camera = cam_ob
    return cam_ob


def _orbit_camera(cam_ob: bpy.types.Object):
    """Keyframe a simple orbit around world Z for frames 20-48."""
    radius = 5.5
    height = 3.0
    for f in range(20, 49):
        t   = (f - 20) / 28.0
        ang = t * math.pi * 0.5
        cam_ob.location = (
            math.sin(ang) * radius,
            -math.cos(ang) * radius,
            height,
        )
        cam_ob.rotation_euler = (math.radians(55), 0, ang)
        cam_ob.keyframe_insert("location",       frame=f)
        cam_ob.keyframe_insert("rotation_euler", frame=f)


def _animate_hair_reveal(psys_mod: bpy.types.ParticleSystemModifier):
    """
    Animate hair path_end 0→1 across frames 48-72 to show strands growing in.
    ParticleSettings is a shared data-block — keyframe via psys.settings.
    """
    s = psys_mod.particle_system.settings
    s.path_end = 0.0
    s.keyframe_insert("path_end", frame=48)
    s.path_end = 1.0
    s.keyframe_insert("path_end", frame=72)


def _animate_emitter_count(surface_emit: bpy.types.Object):
    """
    Sweep frame_end from 0 to 1 is not meaningful for static scatter.
    Instead keyframe size_random to hint at emergence: 0 → normal at frame 20.
    """
    for mod in surface_emit.modifiers:
        if mod.type != "PARTICLE_SYSTEM":
            continue
        s = mod.particle_system.settings
        if s.type != "EMITTER":
            continue
        s.particle_size = 0.001
        s.keyframe_insert("particle_size", frame=0)
        s.particle_size = 1.0
        s.keyframe_insert("particle_size", frame=20)
        break


def main():
    # Run blueprint first so scene is populated
    import importlib, sys, os
    bp_dir = os.path.dirname(__file__)
    if bp_dir not in sys.path:
        sys.path.insert(0, bp_dir)
    import blueprint
    importlib.reload(blueprint)
    blueprint.main()

    col = bpy.data.collections["ParticleDemo"]

    _configure_output()
    cam_ob = _setup_camera(col)
    _orbit_camera(cam_ob)

    # Locate the hair surface's particle modifier
    hair_surf = bpy.data.objects.get("hair_surface")
    if hair_surf:
        for mod in hair_surf.modifiers:
            if mod.type == "PARTICLE_SYSTEM":
                _animate_hair_reveal(mod)
                break

    emit_surf = bpy.data.objects.get("emitter_surface")
    if emit_surf:
        _animate_emitter_count(emit_surf)

    # Shading — Material Preview for fast render
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.shading.type = "MATERIAL"
            break

    bpy.ops.render.render(animation=True)
    print(f"[{SLUG}] record.py done → {OUT_PATH}")


if __name__ == "__main__":
    main()
