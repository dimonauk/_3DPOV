"""
Blender 5.1 — Python FCurve API: Procedural Keyframe Authoring
Turntable rotation + hover oscillation + elastic entrance → baked GLB

Studio context: Holoflow WebXR animations must be self-contained in the GLB.
glTF 2.0 stores sampled keyframe arrays; it cannot represent Blender's FCurve
modifiers or drivers. The pipeline is therefore: author channels with the bpy
data API → apply FModifierCycles for viewport preview → bake to per-frame
keyframes before export.

Key invariant: fc.keyframe_points.insert(..., options={'FAST'}) skips
per-keyframe handle recalculation. You MUST call fc.update() after a bulk
insert or Blender will evaluate wrong tangents everywhere. This is the single
most common bug in scripted animation.

Source: Blender Foundation Python API documentation (CC-BY-SA 4.0)
  https://docs.blender.org/api/5.1/bpy.types.FCurve.html
"""

import bpy
import math

# ─── PARAMETERS ─────────────────────────────────────────────────────────────
SLUG             = "python-fcurve-keyframe-insert-procedural-animation-turntable"
OBJ_NAME         = "turntable_prop"
ACTION_NAME      = "TurntableAction"
FRAME_START      = 1
FRAME_END        = 120          # 5 s @ 24 fps — one full revolution
FPS              = 24

HOVER_AMPLITUDE  = 0.06         # metres vertical float from rest Z = 0
HOVER_CYCLES     = 2            # sine oscillations within FRAME_START→FRAME_END
ELASTIC_PEAK     = 1.15         # overshoot factor for entrance bounce
ELASTIC_SETTLE   = 30           # frame at which scale returns to 1.0

TURNTABLE_AXIS   = 2            # rotation_euler index: 0=X 1=Y 2=Z
OUTPUT_GLB       = "//turntable_prop.glb"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)


def create_prop() -> bpy.types.Object:
    """Ico-sphere + Dissolve decimate → faceted gem stand-in."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.5)
    obj      = bpy.context.active_object
    obj.name = OBJ_NAME

    dec                = obj.modifiers.new("Decimate", 'DECIMATE')
    dec.decimate_type  = 'DISSOLVE'
    dec.angle_limit    = math.radians(10)

    mat            = bpy.data.materials.new("VertGradient")
    mat.use_nodes  = True
    nt             = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf  = nt.nodes.new('ShaderNodeBsdfPrincipled')
    geo   = nt.nodes.new('ShaderNodeNewGeometry')
    remap = nt.nodes.new('ShaderNodeMapRange')
    mix   = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'

    bsdf.inputs['Metallic'].default_value   = 0.9
    bsdf.inputs['Roughness'].default_value  = 0.2
    remap.inputs['From Min'].default_value  = -0.5
    remap.inputs['From Max'].default_value  =  0.5
    mix.inputs['A'].default_value           = (0.05, 0.3,  0.9, 1.0)
    mix.inputs['B'].default_value           = (0.80, 0.2,  0.9, 1.0)

    nt.links.new(geo.outputs['Position'],  remap.inputs['Value'])
    nt.links.new(remap.outputs['Result'],  mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'],    bsdf.inputs['Base Color'])
    nt.links.new(bsdf.outputs['BSDF'],     out.inputs['Surface'])

    for n, x in zip([out, bsdf, mix, remap, geo], [300, 100, -100, -300, -500]):
        n.location = (x, 0)

    obj.data.materials.append(mat)
    return obj


def _ensure_action(obj: bpy.types.Object) -> bpy.types.Action:
    if obj.animation_data is None:
        obj.animation_data_create()
    action = bpy.data.actions.new(ACTION_NAME)
    obj.animation_data.action = action
    return action


def _new_fc(action: bpy.types.Action,
            data_path: str,
            index: int,
            group: str = "") -> bpy.types.FCurve:
    fc = action.fcurves.new(data_path=data_path, index=index, action_group=group)
    fc.keyframe_points.clear()
    return fc


# ─── CHANNEL 1: Turntable rotation ──────────────────────────────────────────
def build_turntable_rotation(action: bpy.types.Action) -> None:
    """
    Two keyframes (frame 1 = 0 rad, frame 120 = 2π rad), LINEAR interpolation.
    FModifierCycles with REPEAT_OFFSET advances the value at each repetition —
    giving smooth infinite rotation rather than a sawtooth snap to zero.
    Without REPEAT_OFFSET the value would jump back to 0 at every loop.
    """
    fc = _new_fc(action, "rotation_euler", TURNTABLE_AXIS, "Rotation")
    kps = fc.keyframe_points
    kps.add(2)

    kps[0].co            = (float(FRAME_START), 0.0)
    kps[0].interpolation = 'LINEAR'
    kps[1].co            = (float(FRAME_END), math.tau)   # 2π exactly
    kps[1].interpolation = 'LINEAR'

    mod             = fc.modifiers.new(type='CYCLES')
    mod.mode_before = 'REPEAT_OFFSET'
    mod.mode_after  = 'REPEAT_OFFSET'

    fc.update()


# ─── CHANNEL 2: Hover oscillation ───────────────────────────────────────────
def build_hover_oscillation(action: bpy.types.Action) -> None:
    """
    Sine wave baked into BEZIER keyframes every 2 frames.
    Dense enough that AUTO_CLAMPED handles reconstruct the wave faithfully
    between samples; sparse enough to keep the action data small.
    Using a SINE FCurve modifier would be simpler but won't survive NLA bake
    if the strip has a non-unit scale — explicit keyframes are always safe.
    """
    fc      = _new_fc(action, "location", 2, "Location")
    frames  = list(range(FRAME_START, FRAME_END + 1, 2))
    kps     = fc.keyframe_points
    kps.add(len(frames))

    for i, frame in enumerate(frames):
        t          = (frame - FRAME_START) / (FRAME_END - FRAME_START)
        z          = HOVER_AMPLITUDE * math.sin(2 * math.pi * HOVER_CYCLES * t)
        kps[i].co  = (float(frame), z)
        kps[i].interpolation = 'BEZIER'

    # Update once before setting handles — Blender won't move handles correctly
    # on keyframes whose co values it hasn't yet internalised.
    fc.update()
    for kp in kps:
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'
    fc.update()


# ─── CHANNEL 3: Elastic entrance ────────────────────────────────────────────
def build_elastic_entrance(action: bpy.types.Action) -> None:
    """
    Scale 0 → ELASTIC_PEAK → 1.0 across ELASTIC_SETTLE frames.
    Three control points give explicit overshoot magnitude without relying on
    Blender's ELASTIC easing maths alone (which is unpredictable at the start
    of a two-point curve). The middle keyframe BEZIER handles are left AUTO so
    Blender shapes a smooth arc through the peak.
    """
    mid = FRAME_START + ELASTIC_SETTLE // 2
    for idx in range(3):   # uniform XYZ scale
        fc  = _new_fc(action, "scale", idx, "Scale")
        kps = fc.keyframe_points
        kps.add(3)

        kps[0].co            = (float(FRAME_START), 0.0)
        kps[0].interpolation = 'ELASTIC'
        kps[0].easing        = 'EASE_IN_OUT'

        kps[1].co            = (float(mid), ELASTIC_PEAK)
        kps[1].interpolation = 'BEZIER'
        kps[1].easing        = 'EASE_IN_OUT'

        kps[2].co            = (float(ELASTIC_SETTLE), 1.0)
        kps[2].interpolation = 'BEZIER'

        fc.update()
        for kp in kps:
            kp.handle_left_type  = 'AUTO'
            kp.handle_right_type = 'AUTO'
        fc.update()


# ─── NLA push ───────────────────────────────────────────────────────────────
def push_to_nla(obj: bpy.types.Object, action: bpy.types.Action) -> None:
    """
    Detach the action from the slot, push it to an NLA track, then reattach.
    The reattach is required for bpy.ops.nla.bake to find the action.
    """
    obj.animation_data.action = None
    track      = obj.animation_data.nla_tracks.new()
    track.name = "Turntable"
    strip = track.strips.new(ACTION_NAME, FRAME_START, action)
    strip.action_frame_start = FRAME_START
    strip.action_frame_end   = FRAME_END
    strip.frame_start        = FRAME_START
    strip.frame_end          = FRAME_END
    obj.animation_data.action = action   # reattach for bake


# ─── Scene + export ─────────────────────────────────────────────────────────
def configure_scene() -> None:
    sc              = bpy.context.scene
    sc.render.fps   = FPS
    sc.frame_start  = FRAME_START
    sc.frame_end    = FRAME_END
    sc.render.engine = 'BLENDER_EEVEE'


def export_glb(obj: bpy.types.Object) -> None:
    """
    NLA bake collapses FModifierCycles into explicit per-frame keyframes that
    glTF 2.0 can store as a sampled animation. export_optimize_animation_size=False
    keeps all 120 frames even where values are nearly constant — the Three.js
    GLTFLoader interpolates anyway, but sparse data risks missed peaks on slow
    devices where frame caching is imprecise.
    """
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.nla.bake(
        frame_start=FRAME_START,
        frame_end=FRAME_END,
        visual_keying=True,
        clear_constraints=False,
        clear_parents=False,
        use_current_action=True,
        bake_types={'OBJECT'},
    )

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        use_selection=True,
        export_format='GLB',
        export_animations=True,
        export_anim_mode='ACTIVE_ACTIONS',
        export_nla_strips=False,
        export_optimize_animation_size=False,
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )


def main() -> None:
    clear_scene()
    configure_scene()

    obj    = create_prop()
    action = _ensure_action(obj)

    build_turntable_rotation(action)
    build_hover_oscillation(action)
    build_elastic_entrance(action)

    push_to_nla(obj, action)
    export_glb(obj)

    print(f"[{SLUG}] complete — {OUTPUT_GLB}")


if __name__ == "__main__":
    main()
