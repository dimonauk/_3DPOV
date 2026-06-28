"""
record.py — Viewport animation for GN Viewer Node debug tutorial (Blender 5.1)

OUTPUT:
  public/library/videos/geometry-nodes/
    gn-viewer-node-debug-inspect-attributes/viewport.mp4

Run AFTER blueprint.py has created the scene.  The animation shows the
displaced grid orbiting under the active Viewer overlay — three segments,
one per Viewer probe.

IMPORTANT: The Viewer overlay is only visible in Solid viewport shading, NOT
in a full EEVEE/Cycles render.  This script prepares keyframes and switches
the active Viewer node per segment.  To produce viewport.mp4:

  1. Set the 3D Viewport to Solid shading mode.
  2. Run this script in the Scripting tab.
  3. Run: bpy.ops.render.opengl(animation=True, write_still=False)
     from the Python console (or via the menu: View → Viewport Render Animation).

The opengl render captures exactly what the Solid viewport shows, including
the per-domain colour overlay.  At 1920×1080 × 24 fps for 288 frames this
takes approximately 30 seconds on a mid-range GPU.

SEGMENT PLAN (288 frames = 12 seconds at 24 fps):
  Frames   1– 96  Probe A active: grayscale noise height map (POINT domain)
  Frames  97–192  Probe B active: RGB face normal map (FACE domain)
  Frames 193–288  Probe C active: round-trip readback (should match Probe A)

Viewer switching works by setting ng.nodes.active per segment inside a
frame_change_pre handler.  The Spreadsheet Editor auto-follows the active node.
"""

import bpy, math, os

# ── output path ───────────────────────────────────────────────────────────────
OUT_DIR = os.path.normpath(os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..",
    "public", "library", "videos",
    "geometry-nodes",
    "gn-viewer-node-debug-inspect-attributes",
))
os.makedirs(OUT_DIR, exist_ok=True)

FPS     = 24
TOTAL_F = 288    # 12 s
SEG     = 96     # 4 s per probe

# ── fetch scene objects ───────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps          = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.frame_start         = 1
scene.frame_end           = TOTAL_F

obj = bpy.data.objects.get("gn_debug_probe")
if obj is None:
    raise RuntimeError("gn_debug_probe not found — run blueprint.py first.")

mod = next((m for m in obj.modifiers if m.type == 'NODES'), None)
ng  = mod.node_group

# ── index Viewer nodes by label fragment ─────────────────────────────────────
def find_viewer(fragment: str):
    for n in ng.nodes:
        if n.type == 'VIEWER' and fragment in n.label:
            return n
    raise KeyError(f"Viewer node '{fragment}' not found in node tree.")

va = find_viewer("Noise Scalar")
vb = find_viewer("Face Normal")
vc = find_viewer("Named Attr RT")

# ── frame_change_pre handler — activate the correct Viewer ───────────────────
def switch_viewer(scene):
    f = scene.frame_current
    active = va if f <= SEG else (vb if f <= 2 * SEG else vc)
    if ng.nodes.active is not active:
        for n in ng.nodes:
            n.select = False
        active.select = True
        ng.nodes.active = active

bpy.app.handlers.frame_change_pre.append(switch_viewer)

# ── camera orbit keyframes ────────────────────────────────────────────────────
cam = scene.camera
RADIUS = 5.8
HEIGHT = 3.8

for frame in range(1, TOTAL_F + 1):
    t = (frame - 1) / (TOTAL_F - 1)          # 0 → 1 over the full clip
    angle = t * 2 * math.pi                   # one full 360° orbit
    cam.location.x = RADIUS * math.sin(angle)
    cam.location.y = -RADIUS * math.cos(angle)
    cam.location.z = HEIGHT
    # Point camera toward the grid centre
    dx = -cam.location.x
    dy = -cam.location.y
    cam.rotation_euler.z = math.atan2(dx, -dy)
    cam.rotation_euler.x = math.atan2(HEIGHT, RADIUS * 0.9)
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# ── render settings for opengl viewport capture ───────────────────────────────
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format        = 'FFMPEG'
scene.render.ffmpeg.format                     = 'MPEG4'
scene.render.ffmpeg.codec                      = 'H264'
scene.render.ffmpeg.constant_rate_factor       = 'MEDIUM'
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

print(f"Record target: {scene.render.filepath}")
print("Switch the 3D Viewport to Solid shading, then run:")
print("  bpy.ops.render.opengl(animation=True)")
print("Each probe segment will be 4 s (96 frames at 24 fps).")
