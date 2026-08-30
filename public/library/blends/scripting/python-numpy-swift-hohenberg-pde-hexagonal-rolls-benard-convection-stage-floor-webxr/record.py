"""
record.py — viewport animation for Swift–Hohenberg stage floor.

Outputs: public/library/videos/scripting/
         python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr/
         viewport.mp4

Run AFTER blueprint.py has created and saved the blend file.
Duration: 9 seconds at 30 fps = 270 frames.
Camera sweeps 180° around the floor at an elevated angle; shape-key
transitions reveal hexagons → labyrinth → onset incipience.
"""

import bpy, math, os

# ── settings ─────────────────────────────────────────────────────────────────
FPS         = 30
TOTAL       = 270          # frames
CAM_RADIUS  = 3.20         # metres from origin
CAM_ELEV    = 1.40         # metres above floor
LENS_MM     = 50.0
BLOOM_THRESH = 0.30
BLOOM_INT    = 0.40

OUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath) or "/tmp",
    "../../videos/scripting/"
    "python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr",
)
os.makedirs(OUT_DIR, exist_ok=True)

# ── scene / render settings ───────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL
scene.render.fps  = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUT_DIR, "viewport")

scene.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scene.eevee
eevee.use_bloom         = True
eevee.bloom_threshold   = BLOOM_THRESH
eevee.bloom_intensity   = BLOOM_INT
eevee.bloom_radius      = 3.5
eevee.taa_render_samples = 16

# ── camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = LENS_MM
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

def place_cam(frame: int):
    """WHY sweep 180°?  Half-orbit avoids repeating start/end while showing
    the full hexagonal symmetry from oblique angles — rolls look different
    when viewed along vs across their crests."""
    t     = (frame - 1) / (TOTAL - 1)          # 0..1
    angle = math.pi * t                          # 0 → π
    x     = CAM_RADIUS * math.cos(angle)
    y     = CAM_RADIUS * math.sin(angle)
    z     = CAM_ELEV
    cam_obj.location = (x, y, z)
    # point at floor centre
    dx, dy, dz = -x, -y, -z
    length = math.sqrt(dx**2 + dy**2 + dz**2)
    dx /= length; dy /= length; dz /= length
    # Blender camera looks down -Z; compute rotation from direction vector
    import mathutils
    rot = mathutils.Vector((dx, dy, dz)).to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot.to_euler()
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# keyframe camera at start and end
place_cam(1)
place_cam(TOTAL)

# ── world lighting ───────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
bg.inputs["Strength"].default_value = 0.4
scene.world = world

# ── shape-key animation ───────────────────────────────────────────────────────
floor_obj = bpy.data.objects.get("swift_hohenberg_floor")

if floor_obj and floor_obj.data.shape_keys:
    keys = floor_obj.data.shape_keys.key_blocks
    names = [k.name for k in keys]   # ["Basis","SK_Hex","SK_Labyrinth","SK_Onset"]

    # zero all keys at frame 1
    for k in keys:
        k.value = 0.0
        k.keyframe_insert("value", frame=1)

    def morph(from_key: str, to_key: str, f_start: int, f_end: int):
        """Crossfade: from_key 1→0, to_key 0→1 over [f_start, f_end]."""
        if from_key in names:
            keys[from_key].value = 1.0
            keys[from_key].keyframe_insert("value", frame=f_start)
            keys[from_key].value = 0.0
            keys[from_key].keyframe_insert("value", frame=f_end)
        if to_key in names:
            keys[to_key].value = 0.0
            keys[to_key].keyframe_insert("value", frame=f_start)
            keys[to_key].value = 1.0
            keys[to_key].keyframe_insert("value", frame=f_end)

    # frame 1-60:   Basis (rolls) visible
    keys["Basis"].value = 1.0
    keys["Basis"].keyframe_insert("value", frame=1)
    # frame 60-100: Basis → SK_Hex
    morph("Basis", "SK_Hex", 60, 100)
    # frame 100-130: hold SK_Hex
    keys["SK_Hex"].value = 1.0
    keys["SK_Hex"].keyframe_insert("value", frame=130)
    # frame 130-170: SK_Hex → SK_Labyrinth
    morph("SK_Hex", "SK_Labyrinth", 130, 170)
    # frame 170-210: hold SK_Labyrinth
    keys["SK_Labyrinth"].value = 1.0
    keys["SK_Labyrinth"].keyframe_insert("value", frame=210)
    # frame 210-250: SK_Labyrinth → SK_Onset
    morph("SK_Labyrinth", "SK_Onset", 210, 250)
    # frame 250-270: hold SK_Onset
    keys["SK_Onset"].value = 1.0
    keys["SK_Onset"].keyframe_insert("value", frame=270)

# ── render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[record] viewport.mp4 written →", OUT_DIR)
