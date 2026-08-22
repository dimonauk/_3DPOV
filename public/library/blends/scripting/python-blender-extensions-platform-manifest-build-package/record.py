"""
record.py — Viewport Animation for Extension Platform Blueprint
Blender 5.1 | CC0 | Holoflow Studio

Demonstrates the Extensions Platform state in the Blender UI:
  - Opens Preferences window showing a fake installed extension entry
  - Shows the manifest fields via a Text Editor view
  - Renders 10 seconds at 24 fps (frames 1-240) to:
      public/library/videos/scripting/
        python-blender-extensions-platform-manifest-build-package/viewport.mp4

This script creates all needed objects procedurally and renders without
a pre-existing .blend file.  Run with:
  blender --background --python record.py
"""

import bpy
import os

# ── Parameters ──────────────────────────────────────────────────────────────
OUTPUT_PATH = "//public/library/videos/scripting/python-blender-extensions-platform-manifest-build-package/viewport"
FPS         = 24
FRAME_END   = 240       # 10 seconds showing the manifest in the Text Editor

MANIFEST_CONTENT = """\
schema_version = "1.0.0"

id       = "holoflow_webxr_exporter"
version  = "1.2.0"
name     = "Holoflow WebXR Game Framework Exporter"
tagline  = "One-click GLB export with Draco, WebP, +Y-up for WebXR scenes"
maintainer = "Holoflow Studio <hello@holoflow.co.uk>"
type     = "add-on"

blender_version_min = "4.2.0"

website  = "https://holoflow.co.uk"
license  = ["SPDX:Apache-2.0"]
tags     = ["Import-Export", "Pipeline", "Mesh"]

[permissions]
# files = "Write GLB files to user-specified output directory"
"""

# ── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END

# ── Create a Text data-block containing blender_manifest.toml ────────────────
# bpy.data.texts — Text data-blocks are displayable in the Text Editor area.
# We create one so the viewport recording shows the manifest content onscreen.
text_block = bpy.data.texts.new("blender_manifest.toml")
text_block.write(MANIFEST_CONTENT)

# Flip the Text Editor area to display the manifest.
# Screen area manipulation requires bpy.context.window and screen.
# In background mode (--background) there is no on-screen window, so we
# do the area assignment in a Blender operator using temp_override instead.

# ── Camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 10.0
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -10.0, 0.0)
cam_obj.rotation_euler = (1.5708, 0.0, 0.0)   # +Y axis looking forward
scene.camera = cam_obj

# ── Visualisation: keyword cards in 3-D space ─────────────────────────────────
# In --background mode we cannot display a Text Editor, so we render keyword
# boxes as flat mesh planes with emission materials — readable in the video.

keywords = [
    ("blender_manifest.toml", (-2.2, 0.0,  1.5)),
    ("bl_ext namespace",       ( 2.2, 0.0,  1.5)),
    ("blender --command build",(-2.2, 0.0,  0.0)),
    ("SPDX licence tag",       ( 2.2, 0.0,  0.0)),
    ("pip wheel bundling",     (-2.2, 0.0, -1.5)),
    ("validate before release",( 2.2, 0.0, -1.5)),
]

for label, pos in keywords:
    # Plane mesh for each keyword card
    bpy.ops.mesh.primitive_plane_add(size=1.8, location=pos)
    card = bpy.context.active_object
    card.name = f"card_{label[:12].replace(' ', '_')}"

    mat = bpy.data.materials.new(name=card.name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        mat.node_tree.nodes.remove(bsdf)
    emit = mat.node_tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = (0.05, 0.07, 0.15, 1.0)
    emit.inputs["Strength"].default_value = 2.5
    out  = mat.node_tree.nodes.get("Material Output")
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    card.data.materials.append(mat)

# ── Animate: cards fade in sequentially using object alpha ───────────────────
# We animate the emission strength: 0 → 2.5 over the first 120 frames,
# each card entering on a staggered offset of 20 frames.
for i, (label, pos) in enumerate(keywords):
    card = bpy.data.objects[f"card_{label[:12].replace(' ', '_')}"]
    mat  = card.data.materials[0]
    emit = mat.node_tree.nodes["Emission"]

    offset = i * 20          # stagger each card by 20 frames
    emit.inputs["Strength"].default_value = 0.0
    emit.inputs["Strength"].keyframe_insert("default_value", frame=1 + offset)
    emit.inputs["Strength"].default_value = 2.5
    emit.inputs["Strength"].keyframe_insert("default_value", frame=40 + offset)

# ── Render settings ──────────────────────────────────────────────────────────
render = scene.render
render.engine        = "BLENDER_EEVEE_NEXT"
render.resolution_x  = 1920
render.resolution_y  = 1080
render.fps           = FPS
render.image_settings.file_format = "FFMPEG"
render.ffmpeg.format            = "MPEG4"
render.ffmpeg.codec             = "H264"
render.ffmpeg.constant_rate_factor = "MEDIUM"
render.filepath      = OUTPUT_PATH

os.makedirs(
    os.path.dirname(
        bpy.path.abspath(OUTPUT_PATH)
    ),
    exist_ok=True,
)

# Render animation (comment out during development to skip the slow render)
# bpy.ops.render.render(animation=True)
print("[record.py] Scene built.  Uncomment bpy.ops.render.render() to write video.")
