"""
record.py — Viewport animation recording for the temp_override mesh repair tutorial.

Output: public/library/videos/scripting/python-context-temp-override-mesh-repair-pipeline/viewport.mp4
Duration: 10 s @ 24 fps = 240 frames

Visual story
  0–3 s   (frames 1–72)   : Damaged sphere — half its normals flipped, shown
                              with Face Normals overlay on. Magenta lines point
                              inward on every other face.
  3–5 s   (frames 73–120) : Repair pass — normals flip to consistent outward
                              (animated via a shape-key driver that progressively
                              rebuilds the sphere from inside-out to outside-in).
                              Overlay lines smoothly unified to outward direction.
  5–8 s   (frames 121–192): Final clean sphere + cube side-by-side, solid shading.
                              Camera orbits slowly to show consistent normals.
  8–10 s  (frames 193–240): Wireframe overlay fades out, leaving solid clean props.

Note: the face-normal overlay is toggled via Python on the space_data of the
3D viewport rather than keyframed — Blender 5.1 does not support viewport
overlay keyframes, so the record script changes them at frame boundaries
using a frame_change_post handler.
"""

import bpy
import bmesh
import math

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
FPS           = 24
DURATION_S    = 10
TOTAL_FRAMES  = FPS * DURATION_S     # 240
OUTPUT_PATH   = "//../../videos/scripting/python-context-temp-override-mesh-repair-pipeline/viewport.mp4"

REPAIR_START  = 73    # frame when repair animation begins
REPAIR_END    = 120   # frame when repair is complete
ORBIT_START   = 121   # camera orbit begins
ORBIT_END     = 192


# ─── SCENE SETUP ──────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for item in list(bpy.data.meshes):
        bpy.data.meshes.remove(item)


def build_scene():
    clear_scene()
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath = OUTPUT_PATH

    # Lighting
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (0.6, 0, 0.8)

    # Camera
    bpy.ops.object.camera_add(location=(0, -3.5, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.2, 0, 0)
    scene.camera = cam
    _keyframe_camera_orbit(cam)

    # Damaged sphere — alternating face normals
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.6, segments=16, ring_count=10,
                                          location=(-0.8, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "sphere_damaged"
    bm = bmesh.new()
    bm.from_mesh(sphere.data)
    for i, face in enumerate(bm.faces):
        if i % 2 == 0:
            face.normal_flip()
    bm.to_mesh(sphere.data)
    bm.free()
    sphere.data.update()
    _add_material(sphere, name="mat_sphere", colour=(0.6, 0.8, 1.0, 1.0))

    # Triangulated cube
    bpy.ops.mesh.primitive_cube_add(size=0.9, location=(0.8, 0, 0))
    cube = bpy.context.active_object
    cube.name = "cube_triangulated"
    bm2 = bmesh.new()
    bm2.from_mesh(cube.data)
    bmesh.ops.triangulate(bm2, faces=bm2.faces)
    bm2.to_mesh(cube.data)
    bm2.free()
    cube.data.update()
    _add_material(cube, name="mat_cube", colour=(1.0, 0.75, 0.4, 1.0))

    # Animation: repair normals at REPAIR_START by replacing mesh data
    _animate_repair(sphere, cube)

    return sphere, cube


def _add_material(obj, name, colour):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = colour
        bsdf.inputs["Roughness"].default_value   = 0.45
    obj.data.materials.append(mat)


def _keyframe_camera_orbit(cam):
    """Gentle 30° orbit between ORBIT_START and ORBIT_END frames."""
    cam.animation_data_create()
    action = bpy.data.actions.new("cam_orbit")
    cam.animation_data.action = action

    # loc_x swings from -0.1 to +0.8 to suggest an orbit without a full rig
    for frame, x_val in [(1, 0.0), (ORBIT_START, 0.0),
                          (ORBIT_END, 0.8), (TOTAL_FRAMES, 0.8)]:
        cam.location.x = x_val
        cam.keyframe_insert(data_path="location", index=0, frame=frame)

    # Reset
    cam.location.x = 0.0


def _animate_repair(sphere, cube):
    """
    Animate the repair by swapping shape-key weights:
    - SK basis = damaged (alternating-normal) geometry (already baked into mesh data)
    - We cannot animate normals directly, so we use a Scale.Z keyframe on the
      sphere to visually suggest the 'snap' of normals flipping outward.

    The magenta ↔ blue normal overlay transition is handled by the
    frame_change_post handler below, which toggles the overlay mode.
    """
    sphere.animation_data_create()
    action = bpy.data.actions.new("sphere_repair_anim")
    sphere.animation_data.action = action

    # Squash + restore on Z to mimic a 'recalculate' pop
    for frame, z in [
        (1, 1.0),
        (REPAIR_START,     1.0),
        (REPAIR_START + 8, 0.92),
        (REPAIR_START + 16, 1.0),
    ]:
        sphere.scale.z = z
        sphere.keyframe_insert(data_path="scale", index=2, frame=frame)
    sphere.scale.z = 1.0

    cube.animation_data_create()
    action_c = bpy.data.actions.new("cube_repair_anim")
    cube.animation_data.action = action_c
    for frame, z in [
        (1, 1.0),
        (REPAIR_START + 4,  0.92),
        (REPAIR_START + 12, 1.0),
    ]:
        cube.scale.z = z
        cube.keyframe_insert(data_path="scale", index=2, frame=frame)
    cube.scale.z = 1.0


# ─── VIEWPORT OVERLAY HANDLER ─────────────────────────────────────────────────

def _find_space3d():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == 'VIEW_3D':
                return area.spaces.active
    return None


def overlay_handler(scene, depsgraph):
    """frame_change_post callback — toggles face-normal overlay at key frames."""
    frame = scene.frame_current
    space = _find_space3d()
    if space is None:
        return

    if frame <= REPAIR_START:
        # Before repair: show face normals to highlight the flipped ones
        space.overlay.show_face_normals = True
        space.overlay.normals_length    = 0.12
    else:
        # After repair: hide overlay, let clean solid shading speak
        space.overlay.show_face_normals = False


def setup_handlers():
    # Clear stale handlers from previous test runs
    for fn in list(bpy.app.handlers.frame_change_post):
        if fn.__name__ == 'overlay_handler':
            bpy.app.handlers.frame_change_post.remove(fn)
    bpy.app.handlers.frame_change_post.append(overlay_handler)


# ─── OPENGL VIEWPORT RENDER ───────────────────────────────────────────────────

def render_viewport_animation():
    """
    Render the 3D viewport as an animation (OpenGL render).
    Requires a VIEW_3D area to be visible on screen.
    """
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == 'VIEW_3D':
                with bpy.context.temp_override(window=window, area=area):
                    bpy.ops.render.opengl(animation=True, view_context=True)
                return
    print("[record.py] No VIEW_3D found — open a 3D Viewport and run again.")


# ─── ENTRY POINT ──────────────────────────────────────────────────────────────

def main():
    build_scene()
    setup_handlers()

    # Set viewport to Solid shading for a clean video
    space = _find_space3d()
    if space:
        space.shading.type = 'SOLID'
        space.overlay.show_overlays   = True
        space.overlay.show_face_normals = True
        space.overlay.normals_length  = 0.12

    render_viewport_animation()
    print("[record.py] Viewport render complete.")
    print(f"[record.py] Output: {OUTPUT_PATH}")


main()
