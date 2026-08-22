"""
record.py — Swallowtail Catastrophe Viewport Animation (Blender 5.1)
=====================================================================
Run AFTER blueprint.py has been executed in the same Blender session
(or after loading the saved .blend file).

OUTPUT  public/library/videos/scripting/
        python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr/
        viewport.mp4

DURATION  120 frames / 4 s at 30 fps (short clip — the surface is static
           geometry; the animation shows orbit + two shape-key morphs).

ACTS
  Act 1 (F1–40)   360° camera orbit at elevation 20°, Basis shape key.
                   Shows the full swallowtail with its tail self-intersection
                   and the cusp throat visible from multiple angles.
  Act 2 (F41–70)  Shape key Swallowtail_Tight value 0 → 1 while camera holds.
                   The cusp throat pinches inward as x-range shrinks.
  Act 3 (F71–120) Shape key value 1 → 0 (return to Basis) while camera
                   continues orbiting for a final 180° sweep.

ENGINE  Workbench (vertex-colour FLAT) for speed; no ray tracing needed
        because the vertex colour carries all the information.
"""

import bpy, math

SLUG     = "hf_swallowtail"
FPS      = 30
ORBIT_R  = 0.28      # camera orbit radius (metres)
ELEV_DEG = 20        # camera elevation above XY plane
FRAMES   = 120


def setup_workbench() -> None:
    """
    WHY Workbench:  the swallowtail colour is per-vertex; workbench renders
    vertex colour in FLAT mode in <1 s per frame vs. EEVEE's ~3 s.  The
    flat shading is intentional — it matches the holoflow:facet flag and
    makes the angular surface geometry legible.
    """
    bpy.context.scene.render.engine       = 'BLENDER_WORKBENCH'
    bpy.context.scene.display.shading.type = 'SOLID'
    bpy.context.scene.display.shading.color_type = 'VERTEX'
    bpy.context.scene.display.shading.light = 'FLAT'
    bpy.context.scene.display.shading.show_shadows = False


def setup_render(out_path: str) -> None:
    bpy.context.scene.render.resolution_x   = 1920
    bpy.context.scene.render.resolution_y   = 1080
    bpy.context.scene.render.fps            = FPS
    bpy.context.scene.render.image_settings.file_format = 'FFMPEG'
    bpy.context.scene.render.ffmpeg.format  = 'MPEG4'
    bpy.context.scene.render.ffmpeg.codec   = 'H264'
    bpy.context.scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    bpy.context.scene.render.filepath       = out_path
    bpy.context.scene.frame_start           = 1
    bpy.context.scene.frame_end             = FRAMES


def find_object() -> bpy.types.Object:
    for ob in bpy.data.objects:
        if ob.name.startswith(SLUG):
            return ob
    raise RuntimeError(f"[record.py] Object '{SLUG}' not found — run blueprint.py first.")


def animate_camera(cam_ob: bpy.types.Object) -> None:
    """
    360° orbit in Acts 1+3 (F1-40 and F71-120 together = 90°+180°=270° total).
    Camera always looks at origin.
    """
    scene = bpy.context.scene
    r     = ORBIT_R
    el    = math.radians(ELEV_DEG)

    def set_cam(frame: int, angle_deg: float) -> None:
        ang = math.radians(angle_deg)
        x   = r * math.cos(ang) * math.cos(el)
        y   = r * math.sin(ang) * math.cos(el)
        z   = r * math.sin(el)
        cam_ob.location = (x, y, z)

        # Point camera at origin
        dir_v  = -cam_ob.location.normalized()
        up_v   = bpy.context.scene.cursor.matrix.col[2].xyz   # world Z
        # Simple LookAt: compute rotation from -Z to dir_v
        import mathutils
        rot    = mathutils.Vector((0, 0, -1)).rotation_difference(
                     mathutils.Vector(dir_v))
        cam_ob.rotation_euler = rot.to_euler()

        scene.frame_set(frame)
        cam_ob.keyframe_insert("location")
        cam_ob.keyframe_insert("rotation_euler")

    # Act 1: F1-40, full 360° / 3 (120°)
    for f in range(1, 41):
        angle = 360.0 * (f - 1) / 120.0       # 1° per frame
        set_cam(f, angle)

    # Acts 2+3: F41-120, camera continues orbit from 40° to 40+240°=280°
    for f in range(41, 121):
        angle = 40.0 + 240.0 * (f - 41) / 79.0
        set_cam(f, angle)


def animate_shape_keys(ob: bpy.types.Object) -> None:
    """
    Act 2 (F41-70): morph to Swallowtail_Tight.
    Act 3 (F71-120): return to Basis.
    """
    sk = ob.data.shape_keys
    if sk is None:
        return
    tight = sk.key_blocks.get("Swallowtail_Tight")
    if tight is None:
        return

    def key(frame: int, val: float) -> None:
        bpy.context.scene.frame_set(frame)
        tight.value = val
        tight.keyframe_insert("value")

    key(1,   0.0)
    key(41,  0.0)
    key(70,  1.0)
    key(90,  1.0)
    key(120, 0.0)


def main() -> None:
    import os
    ob  = find_object()
    cam = bpy.context.scene.camera
    if cam is None:
        bpy.ops.object.camera_add()
        cam = bpy.context.object
        bpy.context.scene.camera = cam

    out_dir = os.path.join(
        bpy.path.abspath("//"),
        "..", "..", "..", "videos", "scripting",
        "python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr",
    )
    os.makedirs(out_dir, exist_ok=True)

    setup_workbench()
    setup_render(os.path.join(out_dir, "viewport.mp4"))
    animate_camera(cam)
    animate_shape_keys(ob)

    bpy.ops.render.render(animation=True)
    print("[Holoflow] record.py done → viewport.mp4")


if __name__ == "__main__":
    main()
