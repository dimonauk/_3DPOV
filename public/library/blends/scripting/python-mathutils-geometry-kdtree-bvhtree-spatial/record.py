"""
record.py — Viewport animation render for spatial-queries tutorial.
Outputs: public/library/videos/scripting/
         python-mathutils-geometry-kdtree-bvhtree-spatial/viewport.mp4

Animation concept (90 frames @ 24 fps = ~3.75 s):
  F001–020  Anchor mesh fades in (alpha ramp via material Alpha socket)
  F021–060  Constellation object scale animates 0 → 1 (S keyframe pop-in)
  F061–090  Both objects orbit Y-axis 0° → 180° for a full reveal pass

Run from Blender Script Editor after running blueprint.py in the same session
(the AnchorMesh and Constellation objects must already exist in the scene).
"""

import bpy
import math

# ── PARAMETERS ─────────────────────────────────────────────────────────────
FRAME_START = 1
FRAME_END   = 90
FPS         = 24
OUT_DIR     = "//../../videos/scripting/" \
              "python-mathutils-geometry-kdtree-bvhtree-spatial/"
OUT_FILE    = OUT_DIR + "viewport"

# ── SCENE SETUP ────────────────────────────────────────────────────────────

def setup_scene() -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    # Workbench renderer — fast, no light dependency
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light       = 'MATCAP'
    scene.display.shading.color_type  = 'VERTEX'   # show snap_dist colours

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format             = 'MPEG4'
    scene.render.ffmpeg.codec              = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUT_FILE


def add_camera() -> None:
    bpy.ops.object.camera_add(location=(0, -3.5, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(72), 0, 0)
    bpy.context.scene.camera = cam


# ── ANIMATION KEYFRAMES ─────────────────────────────────────────────────────

def animate_anchor() -> None:
    """Fade the anchor mesh in over F001–020 via material Alpha."""
    anchor = bpy.data.objects.get("AnchorMesh")
    if not anchor:
        return
    mat = anchor.data.materials[0]
    mat.blend_method = 'BLEND'
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    alpha_in = bsdf.inputs["Alpha"]
    alpha_in.default_value = 0.0
    alpha_in.keyframe_insert("default_value", frame=1)
    alpha_in.default_value = 1.0
    alpha_in.keyframe_insert("default_value", frame=20)


def animate_constellation() -> None:
    """Pop constellation scale from 0 → 1 over F021–060."""
    cons = bpy.data.objects.get("Constellation")
    if not cons:
        return
    cons.scale = (0.0, 0.0, 0.0)
    cons.keyframe_insert("scale", frame=20)
    cons.scale = (1.0, 1.0, 1.0)
    cons.keyframe_insert("scale", frame=60)

    # Ease in with BACK interpolation for a satisfying pop
    for fc in cons.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BACK'


def animate_orbit() -> None:
    """Orbit both objects around Y axis F061 → F090."""
    for name in ("AnchorMesh", "Constellation"):
        obj = bpy.data.objects.get(name)
        if not obj:
            continue
        obj.rotation_euler.y = 0.0
        obj.keyframe_insert("rotation_euler", frame=61)
        obj.rotation_euler.y = math.radians(180)
        obj.keyframe_insert("rotation_euler", frame=90)


# ── RENDER ─────────────────────────────────────────────────────────────────

def render() -> None:
    bpy.ops.render.render(animation=True)
    print("[record] viewport.mp4 written to", OUT_FILE)


# ── MAIN ───────────────────────────────────────────────────────────────────

def main() -> None:
    setup_scene()
    add_camera()
    animate_anchor()
    animate_constellation()
    animate_orbit()
    render()


main()
