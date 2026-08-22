"""
record.py — viewport animation recording blueprint
Python bpy.types.Image — SDF Texture Atlas tutorial
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py (needs SDF_Atlas_Material and sdf_sphere in the scene).

What it does
────────────
1. Adds a grey Emission shader to the material.
2. Crossfades the sphere from grey → atlas-textured via a MixShader + keyframes.
3. Adds a simple turntable rotation to sdf_sphere.
4. Renders the EEVEE viewport to:
     public/library/videos/scripting/python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr/viewport.mp4

Frame timeline (120 frames @ 30 fps = 4 seconds)
  1–30   grey hold
  30–60  crossfade to atlas
  60–90  atlas hold, turntable continues
  90–120 end hold
"""

import bpy
import os

# ── output config ─────────────────────────────────────────────────────────────
OUTPUT_REL   = "//public/library/videos/scripting/python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr/"
FRAME_START  = 1
FRAME_END    = 120
FPS          = 30
RES_X        = 1280
RES_Y        = 720


def setup_render():
    sc = bpy.context.scene
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END
    sc.render.fps  = FPS
    sc.render.resolution_x = RES_X
    sc.render.resolution_y = RES_Y
    sc.render.resolution_percentage = 100
    sc.render.engine = "BLENDER_EEVEE_NEXT"

    # FFMPEG / H.264 output
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.ffmpeg.audio_codec         = "NONE"

    out_abs = bpy.path.abspath(OUTPUT_REL)
    os.makedirs(out_abs, exist_ok=True)
    sc.render.filepath = OUTPUT_REL + "viewport"


def add_mix_crossfade():
    """
    Wire a MixShader into SDF_Atlas_Material so the reveal can be keyframed.
    Socket 1 → atlas BSDF  (Fac=0 → 100% atlas)
    Socket 2 → grey Emission (Fac=1 → 100% grey)
    """
    mat = bpy.data.materials.get("SDF_Atlas_Material")
    if mat is None:
        raise RuntimeError("Run blueprint.py first — SDF_Atlas_Material not found.")

    nt  = mat.node_tree
    out = nt.nodes.get("Material Output")
    if out is None:
        raise RuntimeError("Material Output node missing from SDF_Atlas_Material.")

    # Remove any previous link from BSDF → Output so we can insert MixShader.
    for lnk in list(nt.links):
        if lnk.to_node == out and lnk.to_socket.name == "Surface":
            nt.links.remove(lnk)

    bsdf = nt.nodes.get("Principled BSDF")

    grey       = nt.nodes.new("ShaderNodeEmission")
    grey.name  = "Grey Emission"
    grey.inputs["Color"].default_value    = (0.18, 0.18, 0.18, 1.0)
    grey.inputs["Strength"].default_value = 1.0
    grey.location = (-100, -260)

    mix      = nt.nodes.new("ShaderNodeMixShader")
    mix.name = "Mix Shader"
    mix.location = (200, 0)
    mix.inputs["Fac"].default_value = 1.0  # start grey

    if bsdf:
        nt.links.new(bsdf.outputs["BSDF"],       mix.inputs[1])
    nt.links.new(grey.outputs["Emission"],       mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],          out.inputs["Surface"])

    return mat, mix


def keyframe_fac(mix_node, mat, frame, value):
    """Insert a keyframe on MixShader.inputs['Fac'].default_value."""
    bpy.context.scene.frame_set(frame)
    mix_node.inputs["Fac"].default_value = value
    mix_node.inputs["Fac"].keyframe_insert("default_value", frame=frame)


def setup_crossfade(mat, mix_node):
    keyframe_fac(mix_node, mat,   1, 1.0)   # grey
    keyframe_fac(mix_node, mat,  30, 1.0)   # hold grey
    keyframe_fac(mix_node, mat,  60, 0.0)   # atlas revealed
    keyframe_fac(mix_node, mat,  90, 0.0)   # hold atlas
    keyframe_fac(mix_node, mat, 120, 0.0)   # end


def add_turntable(ob_name="sdf_sphere"):
    """360° Z-rotation across the full clip — one full revolution."""
    ob = bpy.data.objects.get(ob_name)
    if ob is None:
        return
    ob.rotation_euler = (0, 0, 0)
    ob.keyframe_insert("rotation_euler", frame=1)
    import math
    ob.rotation_euler = (0, 0, math.tau)
    ob.keyframe_insert("rotation_euler", frame=FRAME_END)

    # Set linear interpolation so the spin is constant-rate, not ease-in/out.
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            if fc.data_path == "rotation_euler":
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"


def setup_camera():
    cam_ob = bpy.data.objects.get("Camera")
    if cam_ob is None:
        bpy.ops.object.camera_add()
        cam_ob = bpy.context.active_object
        cam_ob.name = "Camera"
    cam_ob.location       = (0.0, -4.0, 1.2)
    cam_ob.rotation_euler = (1.22, 0.0, 0.0)
    bpy.context.scene.camera = cam_ob


def ensure_light():
    """One area light so EEVEE shows texture detail without harsh shadows."""
    if "Record Light" not in bpy.data.objects:
        bpy.ops.object.light_add(type="AREA", location=(3, -2, 4))
        light = bpy.context.active_object
        light.name = "Record Light"
        light.data.energy = 500
        light.data.size   = 3.0


def run():
    setup_render()
    mat, mix_node = add_mix_crossfade()
    setup_crossfade(mat, mix_node)
    add_turntable()
    setup_camera()
    ensure_light()

    # opengl_render writes the viewport to disk without a full Cycles/EEVEE pass.
    # write_still=False → animation mode (writes the video file, not individual frames).
    bpy.ops.render.opengl(animation=True, write_still=False)
    print("[record] viewport.mp4 written to", bpy.path.abspath(OUTPUT_REL))


run()
