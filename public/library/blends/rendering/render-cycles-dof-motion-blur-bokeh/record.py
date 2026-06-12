"""
record.py — Rack-focus viewport animation for DOF Bokeh tutorial.
Animates camera focus_distance from the near gem to the far gem over 60 frames
and renders a viewport OpenGL sequence to:
  public/library/videos/rendering/render-cycles-dof-motion-blur-bokeh/

Run this AFTER blueprint.py has built the scene.
"""

import bpy

OUTPUT_DIR  = "//../../../../public/library/videos/rendering/render-cycles-dof-motion-blur-bokeh/"
FRAME_COUNT = 60
RES_X       = 1280
RES_Y       = 720

# Camera sits at Y = -2.0; depth values are measured along the view axis.
# gem_near  at Y =  1.5  → depth ≈ 3.5 m
# gem_far   at Y =  8.0  → depth ≈ 10.0 m
FOCUS_NEAR  = 3.5
FOCUS_FAR   = 10.0


def main():
    scene = bpy.context.scene
    cam_ob = scene.camera
    if cam_ob is None:
        print("ERROR: no active camera.  Run blueprint.py first.")
        return

    cam = cam_ob.data
    scene.frame_start = 1
    scene.frame_end   = FRAME_COUNT

    # Detach the focus_object so we can drive focus_distance directly.
    # In a real production you'd keep the focus_object and animate an empty instead —
    # but for this preview the numeric animation is cleaner.
    cam.dof.focus_object = None

    cam.dof.focus_distance = FOCUS_NEAR
    cam.dof.keyframe_insert("dof.focus_distance", frame=1)

    cam.dof.focus_distance = FOCUS_FAR
    cam.dof.keyframe_insert("dof.focus_distance", frame=FRAME_COUNT)

    # Ease-in/ease-out mimics an operator pulling focus by hand on a cinema lens.
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            if "focus_distance" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"

    # Viewport render (EEVEE) — fast, shows DoF blur discs without Cycles cost.
    scene.render.filepath            = OUTPUT_DIR
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_x        = RES_X
    scene.render.resolution_y        = RES_Y

    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"Viewport frames written to {OUTPUT_DIR}")
    print("Convert to MP4:")
    print("  ffmpeg -r 24 -i <dir>/%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4")


if __name__ == "__main__":
    main()
