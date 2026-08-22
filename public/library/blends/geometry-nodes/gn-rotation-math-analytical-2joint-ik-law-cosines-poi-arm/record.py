"""
record.py — Viewport animation: poi target traces a figure-8, arm tracks it.
Run AFTER blueprint.py has created hf_2joint_ik.blend.

Output: public/library/videos/geometry-nodes/
           gn-rotation-math-analytical-2joint-ik-law-cosines-poi-arm/viewport.mp4
"""

import bpy, math

FRAMES   = 120         # 4 s at 30 fps
FPS      = 30
OUT_DIR  = "//../../videos/geometry-nodes/gn-rotation-math-analytical-2joint-ik-law-cosines-poi-arm/"
A        = 1.7         # figure-8 x-amplitude (≤ L1+L2 = 2.7)
B        = 1.1         # figure-8 y-amplitude

# ── target animation ─────────────────────────────────────────────────────────

def animate_target():
    target = bpy.data.objects.get("PoiTarget")
    if target is None:
        raise RuntimeError("Run blueprint.py first to create PoiTarget.")
    target.animation_data_create()
    action = bpy.data.actions.new("PoiTarget_Fig8")
    target.animation_data.action = action

    # Lemniscate of Bernoulli (figure-8) parametric:
    #   x = A · sin(t) / (1 + cos²(t))
    #   y = A · sin(t)·cos(t) / (1 + cos²(t))
    # We insert 120 location keyframes.
    fc_x = action.fcurves.new("location", index=0)
    fc_y = action.fcurves.new("location", index=1)

    for f in range(FRAMES + 1):
        t = (f / FRAMES) * 2.0 * math.pi
        denom = 1.0 + math.cos(t) ** 2
        x =  A * math.sin(t) / denom
        y =  B * math.sin(t) * math.cos(t) / denom

        kx = fc_x.keyframe_points.insert(frame=f + 1, value=x)
        ky = fc_y.keyframe_points.insert(frame=f + 1, value=y)
        kx.interpolation = "LINEAR"
        ky.interpolation = "LINEAR"

    for fc in (fc_x, fc_y):
        fc.update()


# ── render settings ──────────────────────────────────────────────────────────

def setup_render():
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = FRAMES
    scn.render.fps  = FPS

    scn.render.image_settings.file_format  = "FFMPEG"
    scn.render.ffmpeg.format               = "MPEG4"
    scn.render.ffmpeg.codec                = "H264"
    scn.render.ffmpeg.constant_rate_factor = "HIGH"
    scn.render.ffmpeg.ffmpeg_preset        = "GOOD"

    scn.render.resolution_x      = 1280
    scn.render.resolution_y      = 720
    scn.render.resolution_percentage = 100
    scn.render.filepath = OUT_DIR + "viewport.mp4"

    # EEVEE settings
    eevee = scn.eevee
    eevee.taa_render_samples  = 16
    eevee.use_bloom           = True
    eevee.bloom_intensity     = 0.08

    # Soft ambient fill
    bpy.ops.object.light_add(type="AREA", location=(3, -4, 5))
    light = bpy.context.active_object
    light.data.energy = 80
    light.data.size   = 4


# ── main ─────────────────────────────────────────────────────────────────────

def run():
    animate_target()
    setup_render()
    bpy.ops.render.render(animation=True, use_viewport=False)
    bpy.ops.wm.save_as_mainfile(filepath="//hf_2joint_ik.blend")
    print(f"Rendered {FRAMES} frames → {bpy.context.scene.render.filepath}")


if __name__ == "__main__":
    run()
