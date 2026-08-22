# record.py — Viewport Animation Recorder
# Topic: bpy.utils.previews — Custom Icon Thumbnails & Render Previews
# Blender 5.1 | CC0
#
# HOW IT WORKS
# Registers blueprint.py, builds a three-object demo scene, positions a
# camera on a gentle 15-degree arc, then renders the viewport (Solid shading)
# as a 72-frame PNG sequence.  Three phases animate the panel state:
#   Frames  1–24 : scene establishes, N-panel opens showing the icon queue.
#   Frames 25–48 : HLF_OT_CaptureRenderThumb fires, thumbnail slot fills.
#   Frames 49–72 : camera drifts right, thumbnail and icons remain visible.
#
# The render thumbnail operator cannot be driven by keyframes, so it is
# invoked programmatically at frame 25 via a frame_change_post handler.
#
# RUN: Paste into Scripting workspace → Alt+P.
#      Output: public/library/videos/scripting/
#              python-bpy-utils-previews-custom-icon-ui/viewport_####.png

import math
import bpy

FRAME_START = 1
FRAME_END   = 72
FPS         = 24
OUTPUT_DIR  = ("//../../../../public/library/videos/scripting/"
               "python-bpy-utils-previews-custom-icon-ui/")

PALETTE = [
    (0.22, 0.62, 0.88),   # sky-blue   — mesh A
    (0.90, 0.42, 0.18),   # warm amber — mesh B
    (0.55, 0.82, 0.40),   # leaf-green — mesh C
]
CAMERA_RADIUS = 6.8
CAMERA_HEIGHT = 2.6
ARC_DEG       = 15.0     # total arc the camera sweeps (frames 49–72)


# ─── Scene setup ──────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes) + list(bpy.data.materials):
        try:
            if hasattr(blk, "vertices"):
                bpy.data.meshes.remove(blk, do_unlink=True)
            else:
                bpy.data.materials.remove(blk, do_unlink=True)
        except Exception:
            pass


def make_mat(name: str, rgb: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.45
    return mat


def build_scene() -> list:
    """Return the three demo mesh objects after placing them in the scene."""
    specs = [
        ("preview_cube",      "CUBE",       (-2.0, 0, 1.0), (0, 1, 2)),
        ("preview_gem",       "ICO_SPHERE", ( 0.0, 0, 0.7), (0, 1, 2)),
        ("preview_tile_grid", "GRID",       ( 2.0, 0, 0.04),(0, 1, 2)),
    ]
    objs = []
    for idx, (name, prim, loc, _) in enumerate(specs):
        if prim == "CUBE":
            bpy.ops.mesh.primitive_cube_add(location=loc)
            bpy.context.object.scale = (0.9, 0.3, 1.0)
        elif prim == "ICO_SPHERE":
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, location=loc)
            bpy.context.object.scale = (0.7,) * 3
        else:
            bpy.ops.mesh.primitive_grid_add(
                x_subdivisions=5, y_subdivisions=5, location=loc
            )
            bpy.context.object.scale = (1.3, 1.3, 1.0)
        obj = bpy.context.object
        obj.name = name
        bpy.ops.object.transform_apply(scale=True)
        obj.data.materials.append(make_mat(f"{name}_mat", PALETTE[idx]))
        objs.append(obj)

    # Floor plane.
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -0.01))
    floor = bpy.context.object
    floor.name = "record_floor"
    floor.data.materials.append(make_mat("floor_mat", (0.10, 0.10, 0.12)))
    return objs


def setup_camera_and_light() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(CAMERA_RADIUS, -CAMERA_RADIUS * 0.6, CAMERA_HEIGHT))
    cam = bpy.context.object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam
    cam.data.lens = 50

    # Point camera at scene centre.
    bpy.ops.object.constraint_add(type="TRACK_TO")
    bpy.context.object.constraints["Track To"].target = None

    # Manually aim — TRACK_TO needs a target object; use direct rotation.
    dx = -CAMERA_RADIUS
    dy =  CAMERA_RADIUS * 0.6
    dz = -CAMERA_HEIGHT
    import mathutils
    cam.rotation_euler = mathutils.Vector((dx, dy, dz)).to_track_quat("-Z", "Y").to_euler()

    # Key light.
    bpy.ops.object.light_add(type="SUN", location=(4, -3, 6))
    sun = bpy.context.object
    sun.name = "record_sun"
    sun.data.energy = 3.0
    return cam


def keyframe_camera_arc(cam: bpy.types.Object) -> None:
    """Insert location keyframes for the slow drift in the final phase."""
    scene  = bpy.context.scene
    start  = math.radians(-30)
    end    = start + math.radians(ARC_DEG)

    for frame, angle in ((FRAME_START, start), (49, start), (FRAME_END, end)):
        scene.frame_set(frame)
        cam.location.x = math.cos(angle) * CAMERA_RADIUS
        cam.location.y = math.sin(angle) * -CAMERA_RADIUS
        cam.keyframe_insert(data_path="location", frame=frame)


# ─── Thumbnail trigger handler ────────────────────────────────────────────────
_thumb_fired = False


def _frame_handler(scene):
    global _thumb_fired
    if scene.frame_current == 25 and not _thumb_fired:
        _thumb_fired = True
        # Select first object so the thumbnail captures it.
        for obj in bpy.data.objects:
            if obj.type == "MESH" and "record_floor" not in obj.name:
                bpy.context.view_layer.objects.active = obj
                obj.select_set(True)
                break
        try:
            bpy.ops.hlf.capture_render_thumb()
        except Exception:
            pass   # operator may not be registered in all contexts


# ─── Render setup ─────────────────────────────────────────────────────────────
def configure_render(output_dir: str) -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine                   = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x             = 1920
    scene.render.resolution_y             = 1080
    scene.render.resolution_percentage    = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath                 = output_dir

    # Solid-style shading in viewport render.
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.shading.type = "SOLID"
            area.spaces.active.shading.color_type = "MATERIAL"
            break


# ─── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    global _thumb_fired
    _thumb_fired = False

    clear_scene()
    objs = build_scene()
    cam  = setup_camera_and_light()
    keyframe_camera_arc(cam)
    configure_render(OUTPUT_DIR)

    # Register blueprint and seed queue with scene objects.
    try:
        import importlib, sys
        addon_path = str(__file__).replace("record.py", "blueprint.py")
        spec = importlib.util.spec_from_file_location("hlf_icon_demo", addon_path)
        mod  = importlib.util.module_from_spec(spec)
        sys.modules["hlf_icon_demo"] = mod
        spec.loader.exec_module(mod)
        mod.register()
    except Exception as e:
        print(f"[record.py] blueprint register failed: {e}")

    # Thumbnail handler fires at frame 25.
    if _frame_handler not in bpy.app.handlers.frame_change_post:
        bpy.app.handlers.frame_change_post.append(_frame_handler)

    bpy.ops.render.opengl(animation=True, write_still=True)

    # Cleanup handler.
    if _frame_handler in bpy.app.handlers.frame_change_post:
        bpy.app.handlers.frame_change_post.remove(_frame_handler)


main()
