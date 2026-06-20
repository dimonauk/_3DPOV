"""
record.py — compositor-keying-green-screen-despill-tutorial-production
Blender 5.1 · CC0 · Holoflow Studio

Renders a 60-frame viewport animation that pans from the raw green-screen
render → the keyed result → the final composite, one stage every 20 frames.
Output: public/library/videos/compositing/compositor-keying-green-screen-despill-tutorial-production/viewport.mp4

How the transition is visualised:
  Frame  1-20 : raw render (green background visible — keying disabled)
  Frame 21-40 : keyed matte only (BW alpha channel shown via Viewer)
  Frame 41-60 : final composite (deep-space background)

Requires blueprint.py to have been run first in the same Blender session.
Run from Text Editor: Shift+F11, open record.py, Alt+R.
"""

import bpy
import math

sc    = bpy.context.scene
tree  = sc.node_tree
nodes = tree.nodes

# ── RENDER OUTPUT — MP4 via FFmpeg ──────────────────────────────────────────
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'  # ~CRF 18
sc.render.ffmpeg.audio_codec          = 'NONE'
sc.render.filepath = (
    "//../../videos/compositing/"
    "compositor-keying-green-screen-despill-tutorial-production/viewport"
)

sc.frame_start = 1
sc.frame_end   = 60

# ── KEYFRAME COMPOSITOR BYPASS ───────────────────────────────────────────────
# To show three stages we animate the compositor's node mute flags.
#
# Blender compositor node.mute: True = node passes input straight through.
# Muting AlphaOver and SetAlpha exposes the raw green-screen render (stage 1).
# Muting AlphaOver but showing the Matte channel reveals the extracted key (stage 2).
# Full tree active = final composite (stage 3).

# Locate key nodes by label
ao_node  = next(n for n in nodes if n.label == "Alpha Over")
cm_node  = next(n for n in nodes if n.label == "Colour Match")
viewer   = next(n for n in nodes if n.label == "Preview")
sa_node  = next(n for n in nodes if n.label == "Set Alpha")

def key_bool(node, attr, frame, value):
    setattr(node, attr, value)
    node.keyframe_insert(attr, frame=frame)

# STAGE 1: raw green render — mute everything downstream of RenderLayers
for f in (1, 20):
    key_bool(ao_node, "mute", f, True)
    key_bool(sa_node, "mute", f, True)
    key_bool(cm_node, "mute", f, True)

# STAGE 2: matte only — unmute SetAlpha so alpha is visible; keep AlphaOver muted
for f in (21, 40):
    key_bool(sa_node, "mute", f, False)
    key_bool(ao_node, "mute", f, True)
    key_bool(cm_node, "mute", f, True)

# STAGE 3: full composite
for f in (41, 60):
    key_bool(sa_node, "mute", f, False)
    key_bool(ao_node, "mute", f, False)
    key_bool(cm_node, "mute", f, False)

# Slow camera push-in during final stage for visual interest
cam = sc.camera
cam.location = (0, -4.5, 1.4)
cam.keyframe_insert("location", frame=41)
cam.location = (0, -3.8, 1.4)
cam.keyframe_insert("location", frame=60)
for fcurve in cam.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'BEZIER'

print("[record.py] 60-frame keying demo animation prepared.")
print("  Ctrl+F12 (Render Animation) to produce viewport.mp4")
print("  Output →", sc.render.filepath)
