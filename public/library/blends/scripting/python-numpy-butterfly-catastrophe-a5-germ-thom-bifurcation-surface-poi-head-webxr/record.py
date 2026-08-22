"""
record.py — Butterfly Catastrophe A₅ Viewport Animation (Blender 5.1)
======================================================================
Run AFTER blueprint.py has been executed in the same Blender session,
or after loading the saved .blend file.

OUTPUT
  public/library/videos/scripting/
  python-numpy-butterfly-catastrophe-a5-germ-thom-bifurcation-surface-poi-head-webxr/
  viewport.mp4

DURATION  150 frames / 5 s at 30 fps

ACTS
  Act 1 (F1–60):   Full 360° orbit at 22° elevation, symmetric butterfly (b=0).
                   Reveals the three-wing structure — body spine at centre,
                   two outer wings flanking it — from all compass headings.
  Act 2 (F61–100): Camera holds at 20° heading; shape key "Butterfly_Left"
                   morphs 0 → 1.  Left wing inflates, right wing deflates.
                   Shows how the b parameter breaks the mirror symmetry.
  Act 3 (F101–150):Shape key returns 1 → 0 while camera sweeps the final
                   quarter-orbit back to start.

ENGINE  Workbench SOLID / VERTEX colour / FLAT — vertex colour is all the
        visual information; flat shading enforces the holoflow:facet aesthetic
        and renders at <0.5 s / frame vs. EEVEE's ~3 s.
"""

import bpy, math, os

SLUG      = "hf_butterfly_a5"
FPS       = 30
ORBIT_R   = 0.32
ELEV_DEG  = 22
FRAMES    = 150


def find_ob() -> bpy.types.Object:
    for ob in bpy.data.objects:
        if ob.name.startswith(SLUG):
            return ob
    raise RuntimeError("[record.py] Object not found — run blueprint.py first.")


def setup_workbench() -> None:
    """
    WHY Workbench over EEVEE Next:
      The butterfly surface carries all information in vertex colour; there is
      no texture, HDR environment, or volumetric effect to render.  Workbench
      FLAT mode produces identical visual output to EEVEE vertex-colour mode
      at one-sixth the render time, which matters for a 150-frame clip.
    """
    sc = bpy.context.scene
    sc.render.engine                         = 'BLENDER_WORKBENCH'
    sc.display.shading.type                  = 'SOLID'
    sc.display.shading.color_type            = 'VERTEX'
    sc.display.shading.light                 = 'FLAT'
    sc.display.shading.show_shadows          = False


def setup_render(out_path: str) -> None:
    sc = bpy.context.scene
    sc.render.resolution_x                   = 1920
    sc.render.resolution_y                   = 1080
    sc.render.fps                            = FPS
    sc.render.image_settings.file_format     = 'FFMPEG'
    sc.render.ffmpeg.format                  = 'MPEG4'
    sc.render.ffmpeg.codec                   = 'H264'
    sc.render.ffmpeg.constant_rate_factor    = 'MEDIUM'
    sc.render.filepath                       = out_path
    sc.frame_start                           = 1
    sc.frame_end                             = FRAMES


def animate_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    cam.data.lens = 85

    el = math.radians(ELEV_DEG)
    r  = ORBIT_R

    def place(f: int, angle_deg: float) -> None:
        ang = math.radians(angle_deg)
        cam.location = (
            r * math.cos(ang) * math.cos(el),
            r * math.sin(ang) * math.cos(el),
            r * math.sin(el),
        )
        # Point at world origin
        dx, dy, dz = (-cam.location[0], -cam.location[1], -cam.location[2])
        cam.rotation_euler = (
            math.atan2(math.sqrt(dx*dx + dy*dy), -dz),
            0.0,
            math.atan2(dy, dx) + math.pi / 2,
        )
        cam.keyframe_insert("location",       frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

    # Act 1: full 360° orbit over F1–60
    for f in range(1, 61):
        place(f, 360.0 * (f - 1) / 59.0)

    # Acts 2+3: fixed at 20° for shape-key morph, then small swing back
    for f in range(61, 101):
        place(f, 20.0)
    for f in range(101, 151):
        t = (f - 101) / 49.0          # 0 → 1 over Act 3
        place(f, 20.0 + 70.0 * t)     # gentle 70° sweep back

    return cam


def animate_shape_key(ob: bpy.types.Object) -> None:
    """Morph Butterfly_Left: 0 in Act 1 → 1 in Act 2 → 0 in Act 3."""
    sk = ob.data.shape_keys
    if sk is None:
        return
    key = sk.key_blocks.get("Butterfly_Left")
    if key is None:
        return

    def kf(f: int, v: float) -> None:
        key.value = v
        key.keyframe_insert("value", frame=f)

    kf(1,   0.0)
    kf(60,  0.0)
    kf(100, 1.0)
    kf(150, 0.0)


def main() -> None:
    ob = find_ob()
    setup_workbench()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir    = os.path.normpath(os.path.join(
        script_dir,
        "..", "..", "..", "..", "videos", "scripting",
        "python-numpy-butterfly-catastrophe-a5-germ-thom-bifurcation-surface-poi-head-webxr",
    ))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "viewport.mp4")

    setup_render(out_path)
    animate_camera()
    animate_shape_key(ob)

    bpy.ops.render.render(animation=True)
    print(f"[record.py] Done → {out_path}")


main()
