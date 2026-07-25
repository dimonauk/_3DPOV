"""
Blender 5.1 — Python bpy FCurve Modifiers
Noise Flutter · Cycles Loop · Stepped Stop-Motion · Generator Drift

Two poi balls share a base circular orbit built from 16 pre-allocated keyframes.
Four FCurve modifier types are stacked on top, then the entire evaluated result
is sampled frame-by-frame and baked to LINEAR keyframes for GLB/WebXR export.

WHY bake?  FCurve modifiers live in Blender's runtime evaluator.  GLB/glTF stores
only discrete keyframe data; there is no glTF equivalent of a noise or cycles
modifier.  bpy.types.FCurve.evaluate(frame) applies every enabled modifier and
returns one float — sampling this for the export range captures modifier output
faithfully before the modifiers are removed.

Studio: Holoflow Studio
Licence: CC0 1970 (Public Domain)
"""

import bpy
import math

# ─── Parameters ────────────────────────────────────────────────────────────────
ORBIT_RADIUS   = 1.0          # metres — poi arm length
FRAME_START    = 1
FRAME_CYCLE    = 40           # one full orbit; Cycles modifier loops this range
FRAME_BAKE_END = 160          # 4 loops baked → 6.7 s at 24 fps
FPS            = 24
BALL_RADIUS    = 0.08

# Noise modifier
NOISE_SCALE    = 0.8    # period in frames; lower = faster noise variation
NOISE_STRENGTH = 0.12   # amplitude in metres
NOISE_DEPTH    = 2      # Perlin octave count (1 = broad blobs, 3 = fine detail)

# Stepped modifier
STEP_FRAMES    = 3      # hold value for N frames before jumping (stop-motion feel)

# Generator modifier — constant Z offset on ball B
GEN_OFFSET_Z   = 0.20   # lift ball B 0.20 m above the stage plane


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.actions):
        bpy.data.batch_remove(ids=[block])


def _poi_material(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value    = (*colour[:3], 1.0)
    bsdf.inputs["Emission Color"].default_value = (*colour[:3], 1.0)
    bsdf.inputs["Emission Strength"].default_value = 3.0
    bsdf.inputs["Roughness"].default_value     = 0.8
    return mat


def _create_poi_ball(name: str, mat: bpy.types.Material) -> bpy.types.Object:
    """Icosphere poi ball with flat shading (studio faceted style)."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=BALL_RADIUS)
    obj = bpy.context.active_object
    obj.name      = name
    obj.data.name = name + "_mesh"
    for poly in obj.data.polygons:
        poly.use_smooth = False
    obj.data.materials.append(mat)
    return obj


def _build_orbit_action(obj: bpy.types.Object, height_z: float = 0.0) -> bpy.types.Action:
    """
    Create one circular orbit cycle spanning [FRAME_START, FRAME_CYCLE].
    16 points adequately sample a unit circle; beyond 24 the curve is indistinguishable
    from a perfect circle under Bézier AUTO handles, so more points waste memory.
    """
    action = bpy.data.actions.new(obj.name + "_action")
    obj.animation_data_create()
    obj.animation_data.action = action

    N = 16
    fcs = [
        action.fcurves.new(data_path="location", index=i, action_group="Location")
        for i in range(3)
    ]
    for fc in fcs:
        fc.keyframe_points.add(N)  # pre-allocate once — avoids per-insert resort

    for k in range(N):
        t   = k / N
        fr  = FRAME_START + t * (FRAME_CYCLE - FRAME_START)
        ang = 2.0 * math.pi * t
        xyz = (math.cos(ang) * ORBIT_RADIUS,
               math.sin(ang) * ORBIT_RADIUS,
               height_z)

        for ax, fc in enumerate(fcs):
            kp = fc.keyframe_points[k]
            kp.co                = (fr, xyz[ax])
            kp.interpolation     = 'BEZIER'
            kp.handle_left_type  = 'AUTO'
            kp.handle_right_type = 'AUTO'

    for fc in fcs:
        fc.update()   # one sort + handle recalculation pass per FCurve

    return action


def _add_cycles(fc: bpy.types.FCurve) -> None:
    """
    Loop the base keyframe range forever without duplicating keys.

    CYCLES tiles the range defined by the first and last keyframe.  'REPEAT'
    mode replays the exact same trajectory — correct for a closed orbit where
    the ball returns to its start position.  'REPEAT_OFFSET' would shift each
    repeat by the delta between the first and last key value, which creates
    an ever-rising ramp; useful for wheel rotation accumulation but wrong here.
    """
    mod = fc.modifiers.new(type='CYCLES')
    mod.mode_before   = 'REPEAT'
    mod.mode_after    = 'REPEAT'
    mod.cycles_before = 0   # 0 = infinite repeats
    mod.cycles_after  = 0


def _add_noise(fc: bpy.types.FCurve, phase_offset: float = 0.0) -> None:
    """
    Add bandlimited Perlin noise on top of the orbit curve.

    Strength sets amplitude in the channel's native units (metres for location).
    Scale is the period in frames; 0.8 gives variation roughly every 20 frames.
    Phase shifts the noise along the time axis — vary per axis and per ball so
    XYZ motions are uncorrelated and both balls move independently.
    Depth controls the number of Perlin octaves layered together.
    """
    mod            = fc.modifiers.new(type='NOISE')
    mod.scale      = NOISE_SCALE
    mod.strength   = NOISE_STRENGTH
    mod.phase      = phase_offset
    mod.depth      = NOISE_DEPTH
    mod.blend_in   = 0.0   # no fade-in: full effect from frame 1
    mod.blend_out  = 0.0


def _add_stepped(fc: bpy.types.FCurve) -> None:
    """
    Quantise the curve to every STEP_FRAMES frames for a stop-motion look.

    The value holds at the last evaluated position for STEP_FRAMES frames, then
    jumps instantaneously.  Applied on one axis this creates anisotropic stepping —
    the Y axis stutters while X and Z move continuously, giving an odd mechanical
    rhythm that reads as intentional stylisation.
    """
    mod                = fc.modifiers.new(type='STEPPED')
    mod.frame_step     = STEP_FRAMES
    mod.frame_start    = FRAME_START
    mod.frame_end      = FRAME_BAKE_END
    mod.use_frame_start = True
    mod.use_frame_end   = True


def _add_generator(fc: bpy.types.FCurve) -> None:
    """
    Add a constant vertical offset via a degree-1 polynomial with zero linear term.

    GENERATOR evaluates P(x) = Σ coefficients[i] * x^i and adds it to the curve.
    Setting coefficients = [GEN_OFFSET_Z, 0.0] gives P(x) = GEN_OFFSET_Z — a flat
    additive lift at every frame.  A non-zero linear term [0, 0.001] would create
    a slow linear ascent; a quadratic [0, 0, 0.00001] a parabolic arc.
    """
    mod                = fc.modifiers.new(type='GENERATOR')
    mod.mode           = 'POLYNOMIAL'
    mod.poly_order     = 1            # degree; 1 = at most linear
    mod.coefficients[0] = GEN_OFFSET_Z   # constant term
    mod.coefficients[1] = 0.0            # linear coefficient (zero = no drift)


def _bake(obj: bpy.types.Object) -> None:
    """
    Sample fc.evaluate(frame) for every export frame and write real keyframes.
    Removes all modifiers afterward so the action is portable to any renderer.
    """
    action = obj.animation_data.action
    for fc in action.fcurves:
        samples = [(float(f), fc.evaluate(float(f)))
                   for f in range(FRAME_START, FRAME_BAKE_END + 1)]

        fc.keyframe_points.clear()
        for mod in list(fc.modifiers):
            fc.modifiers.remove(mod)

        fc.keyframe_points.add(len(samples))
        for i, (fr, val) in enumerate(samples):
            kp = fc.keyframe_points[i]
            kp.co            = (fr, val)
            kp.interpolation = 'LINEAR'
            # LINEAR is correct for pre-sampled noise; Bézier would over-smooth
            # and could reintroduce the artefacts we removed via baking.
        fc.update()


def _stage() -> bpy.types.Object:
    """Low disc as stage reference — helps frame the viewport for recording."""
    bpy.ops.mesh.primitive_cylinder_add(radius=1.6, depth=0.02, location=(0, 0, -0.01))
    obj = bpy.context.active_object
    obj.name = "HF_Stage"
    mat = bpy.data.materials.new("hf_stage")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.04, 0.04, 0.07, 1.0)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value  = 0.95
    obj.data.materials.append(mat)
    return obj


# ─── Main ──────────────────────────────────────────────────────────────────────

def run() -> None:
    _clear_scene()
    bpy.context.scene.render.fps  = FPS
    bpy.context.scene.frame_start = FRAME_START
    bpy.context.scene.frame_end   = FRAME_BAKE_END

    # ── Ball A — Noise flutter + Cycles loop ────────────────────────────────
    mat_a  = _poi_material("hf_poi_a_mat", (0.0, 0.8, 1.0))
    ball_a = _create_poi_ball("HF_Poi_A", mat_a)
    ball_a.location = (ORBIT_RADIUS, 0.0, 0.0)  # resting pos (overridden by action)
    action_a = _build_orbit_action(ball_a, height_z=0.0)

    for fc in action_a.fcurves:
        _add_cycles(fc)
        # Different phase per axis → uncorrelated noise on X, Y, Z
        _add_noise(fc, phase_offset=fc.array_index * 7.31)

    _bake(ball_a)

    # ── Ball B — Stepped (Y) + Generator Z offset + Cycles loop ────────────
    mat_b  = _poi_material("hf_poi_b_mat", (1.0, 0.4, 0.0))
    ball_b = _create_poi_ball("HF_Poi_B", mat_b)
    ball_b.location = (-ORBIT_RADIUS, 0.0, 0.0)
    action_b = _build_orbit_action(ball_b, height_z=0.0)

    for fc in action_b.fcurves:
        _add_cycles(fc)
        if fc.array_index == 1:   # Y axis gets stop-motion stepping
            _add_stepped(fc)
        if fc.array_index == 2:   # Z axis lifted by constant generator
            _add_generator(fc)

    _bake(ball_b)

    # ── Scene dressing ──────────────────────────────────────────────────────
    _stage()
    bpy.ops.object.light_add(type='SUN', location=(3.0, -3.0, 5.0))
    bpy.context.active_object.data.energy = 2.5
    bpy.context.active_object.data.angle  = math.radians(5)

    print("[hf] FCurve modifier pipeline complete.")
    print(f"[hf]  Ball A: CYCLES + NOISE (XYZ), baked {FRAME_BAKE_END} frames")
    print(f"[hf]  Ball B: CYCLES + STEPPED(Y) + GENERATOR(Z), baked {FRAME_BAKE_END} frames")


if __name__ == "__main__":
    run()
