"""
record.py — viewport animation for the Toda Lattice poi disc.
Run AFTER blueprint.py has saved hf_toda_disc.blend.

Opens the .blend, configures a 144-frame Workbench render (Vertex-Colour
mode), morphs through the three shape-key regimes, keeps the camera
tilted 30° to reveal the disc surface profile, and renders to:

  public/library/videos/scripting/
    python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr/
      viewport.mp4
"""

import bpy, math
from pathlib import Path

HERE      = Path(__file__).parent
BLEND     = HERE / "hf_toda_disc.blend"
OUT_DIR   = Path(__file__).parents[4] / (
    "videos/scripting/"
    "python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr"
)
OUT_FILE  = OUT_DIR / "viewport"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FPS          = 24
TOTAL_FRAMES = 144          # 6 s at 24fps
ORBIT_TURNS  = 1.5          # disc rotates 1.5 × in 6 s

# Shape-key animation schedule (frame ranges, inclusive)
PHASES = [
    ("Basis",     0,  35),   # 2-soliton (hold)
    ("SK_1sol",  36,  95),   # morph to 1-soliton, hold
    ("SK_phonon", 96, 143),  # morph to phonon, hold
]

MORPH_DURATION = 18          # frames for each morph transition


def _ease(t: float) -> float:
    """Smooth-step easing: t in [0,1] → eased [0,1]."""
    return t * t * (3.0 - 2.0 * t)


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * max(0.0, min(1.0, t))


def _sk_value(sk_name: str, frame: int) -> float:
    """Return the shape-key blend value for a given frame."""
    for name, f_start, f_end in PHASES:
        if name != sk_name:
            continue
        if frame < f_start:
            return 0.0
        if frame > f_end:
            # held at full; check if next phase has taken over
            return 1.0
        # morph-in at start of phase
        t = (frame - f_start) / max(1, MORPH_DURATION)
        return _ease(min(t, 1.0))
    return 0.0


def run():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))

    scene = bpy.context.scene
    scene.render.engine         = 'BLENDER_WORKBENCH'
    scene.render.fps            = FPS
    scene.frame_start           = 0
    scene.frame_end             = TOTAL_FRAMES - 1
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format  = 'MPEG4'
    scene.render.ffmpeg.codec   = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath       = str(OUT_FILE)
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080

    # Workbench: vertex colour mode
    scene.display.shading.type           = 'SOLID'
    scene.display.shading.color_type     = 'VERTEX'
    scene.display.shading.light          = 'MATCAP'
    scene.display.shading.show_shadows   = True

    obj = bpy.data.objects.get("hf_toda_disc")
    if obj is None:
        print("[record] ERROR: hf_toda_disc not found"); return

    # Camera: angled 30° above disc to see height variation
    cam = bpy.data.objects.get("Camera") or _add_camera()
    cam.location = (0, -0.18, 0.06)
    cam.rotation_euler = (math.radians(75), 0, 0)
    cam.data.lens = 80.0

    # Track-to constraint so camera follows disc centre
    if "Track To" not in cam.constraints:
        tc = cam.constraints.new('TRACK_TO')
        tc.target = obj
        tc.track_axis = 'TRACK_NEGATIVE_Z'
        tc.up_axis = 'UP_Y'

    # Empty at disc centre for stable rotation
    emp = bpy.data.objects.new("Pivot", None)
    bpy.context.collection.objects.link(emp)
    emp.location = (0, 0, 0)

    # Keyframe the disc rotation (slow spin to show all angles)
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert(data_path="rotation_euler", frame=0)
    obj.rotation_euler = (0, 0, math.radians(360 * ORBIT_TURNS))
    obj.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES - 1)

    # Keyframe shape keys
    keys_to_animate = ["SK_1sol", "SK_phonon"]
    ks = obj.data.shape_keys
    for fname in range(TOTAL_FRAMES):
        scene.frame_set(fname)
        for kname in keys_to_animate:
            kb = ks.key_blocks.get(kname)
            if kb is None:
                continue
            kb.value = _sk_value(kname, fname)
            kb.keyframe_insert(data_path="value", frame=fname)

    # Render
    bpy.ops.render.render(animation=True)
    print(f"[Toda record] wrote {OUT_FILE}.mp4")


def _add_camera():
    bpy.ops.object.camera_add(location=(0, -0.18, 0.06))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    return cam


run()
