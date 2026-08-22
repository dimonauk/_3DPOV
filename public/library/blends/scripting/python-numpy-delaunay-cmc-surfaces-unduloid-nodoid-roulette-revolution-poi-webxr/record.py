"""
record.py — Viewport animation recorder for Delaunay CMC Surfaces
(Blender 5.1)

Run AFTER blueprint.py has built the scene.  Renders a 10-second MP4:
  Frames  1–60  : 360° orbit around the unduloid poi head
  Frames 61–120 : shape key morph from unduloid → sphere
  Frames121–180 : shape key morph from sphere → nodoid
  Frames181–240 : shape key morph from nodoid → catenary (slow dissolve)
  Frames241–300 : final 360° orbit of the morphed state

Output: public/library/videos/scripting/<slug>/viewport.mp4
        (10 s at 30 fps = 300 frames)
"""

import bpy, math

SLUG      = "python-numpy-delaunay-cmc-surfaces-unduloid-nodoid-roulette-revolution-poi-webxr"
OBJ_NAME  = "hf_delaunay_cmc"
FPS       = 30
ORBIT_RAD = 0.30          # camera distance (m)
ELEV_DEG  = 22.0          # camera elevation angle

VIDEO_PATH = f"//../../videos/scripting/{SLUG}/viewport.mp4"


def set_camera_orbit(frame: int, frac: float, elevation_deg: float,
                     dist: float, obj_center=(0, 0, 0)):
    """Position camera on a sphere orbiting the object."""
    az  = 2.0 * math.pi * frac
    el  = math.radians(elevation_deg)
    cx, cy, cz = obj_center

    cam = bpy.data.objects["Camera"]
    cam.location = (
        cx + dist * math.cos(el) * math.cos(az),
        cy + dist * math.cos(el) * math.sin(az),
        cz + dist * math.sin(el),
    )
    # Point at scene origin
    dx, dy, dz = (cx - cam.location.x, cy - cam.location.y,
                  cz - cam.location.z)
    length = math.sqrt(dx*dx + dy*dy + dz*dz)
    if length > 1e-6:
        cam.rotation_euler = (
            math.atan2(math.sqrt(dx*dx + dy*dy), dz) - math.pi/2,
            0.0,
            math.atan2(dy, dx) + math.pi/2,
        )
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


def set_shape_key(obj, sk_name: str, value: float, frame: int):
    """Keyframe a shape key value."""
    kb = obj.data.shape_keys.key_blocks.get(sk_name)
    if kb:
        kb.value = value
        kb.keyframe_insert("value", frame=frame)


def main():
    # ── Scene render settings ──────────────────────────────────────────────
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.fps             = FPS
    scene.frame_start            = 1
    scene.frame_end              = 300
    scene.render.image_settings.file_format  = 'FFMPEG'
    scene.render.ffmpeg.format               = 'MPEG4'
    scene.render.ffmpeg.codec                = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath        = VIDEO_PATH

    # Eevee bloom for emission glow
    eevee = scene.eevee
    eevee.bloom_threshold        = 0.40
    eevee.bloom_intensity        = 0.80
    eevee.bloom_radius           = 6.5
    eevee.use_bloom              = True

    # ── Camera ─────────────────────────────────────────────────────────────
    if "Camera" not in bpy.data.objects:
        bpy.ops.object.camera_add()
        bpy.data.objects["Camera"].name = "Camera"
    scene.camera = bpy.data.objects["Camera"]
    cam = bpy.data.objects["Camera"]
    cam.data.lens = 85.0

    # ── Object ─────────────────────────────────────────────────────────────
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        print(f"[record] Object '{OBJ_NAME}' not found — run blueprint.py first")
        return

    # Zero all shape keys at frame 1
    sk_names = ["sphere", "catenary", "nodoid"]
    for nm in sk_names:
        set_shape_key(obj, nm, 0.0, 1)

    # ── Phase 1 (1–60): full orbit, unduloid base ──────────────────────────
    for f in range(1, 61):
        frac = (f - 1) / 60.0
        set_camera_orbit(f, frac, ELEV_DEG, ORBIT_RAD)

    # ── Phase 2 (61–120): morph unduloid → sphere ─────────────────────────
    for f in range(61, 121):
        t = (f - 61) / 59.0
        set_shape_key(obj, "sphere", t, f)
        frac = (f - 1) / 60.0
        set_camera_orbit(f, frac, ELEV_DEG, ORBIT_RAD)

    # ── Phase 3 (121–180): morph sphere → nodoid ──────────────────────────
    for f in range(121, 181):
        t = (f - 121) / 59.0
        set_shape_key(obj, "sphere",  1.0 - t, f)
        set_shape_key(obj, "nodoid",  t,       f)
        frac = (f - 1) / 60.0
        set_camera_orbit(f, frac, ELEV_DEG + 10.0, ORBIT_RAD * 1.2)

    # ── Phase 4 (181–240): morph nodoid → catenary (extreme oscillation) ──
    for f in range(181, 241):
        t = (f - 181) / 59.0
        set_shape_key(obj, "nodoid",  1.0 - t, f)
        set_shape_key(obj, "catenary", t,       f)
        frac = (f - 1) / 60.0
        set_camera_orbit(f, frac, ELEV_DEG + 5.0, ORBIT_RAD)

    # ── Phase 5 (241–300): final orbit ────────────────────────────────────
    for f in range(241, 301):
        frac = (f - 241) / 60.0
        set_camera_orbit(f, frac, ELEV_DEG, ORBIT_RAD)

    # ── World lighting: dark background ───────────────────────────────────
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value  = (0.01, 0.01, 0.015, 1.0)
        bg_node.inputs["Strength"].default_value = 0.0

    # ── Render ─────────────────────────────────────────────────────────────
    bpy.ops.render.render(animation=True)
    print(f"[record] Rendered to {VIDEO_PATH}")


if __name__ == "__main__":
    main()
