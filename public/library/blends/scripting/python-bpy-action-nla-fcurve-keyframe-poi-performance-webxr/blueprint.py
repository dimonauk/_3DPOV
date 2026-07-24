# =============================================================================
# hf_poi_performance — Python bpy Action & NLA Editor
# Three poi spin patterns authored as independent Actions via the direct
# FCurve data API, sequenced with NLA strips, exported to animated GLB.
# Blender 5.1 | CC0-1.0 | Holoflow Studio
# =============================================================================
# TECHNIQUE SUMMARY
# bpy.data.actions.new() creates an Action container. FCurves inside it
# (one per animated channel) are created via action.fcurves.new(), then
# batch-populated using keyframe_points.add() + direct .co assignment with
# a final fc.update() — three to five times faster than the operator path
# (bpy.ops.anim.keyframe_insert) because it skips the depsgraph flush and
# the per-keyframe sort. Actions remain as reusable data-blocks; the NLA
# editor sequences them in scene-time without baking to a single timeline.
# =============================================================================

import bpy
import math
import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────
FRAMES_PER_PATTERN = 80          # frames each spin pattern occupies in NLA
KEY_DENSITY        = 40          # keyframe count per Action (evenly spaced)
FPS                = 24
CORD_LEN           = 1.40        # metres: hand → poi ball centre
POI_RADIUS         = 0.10        # ball radius
HAND_POS           = mathutils.Vector((0.0, 0.0, 1.30))   # performer wrist XYZ

EXPORT_GLB         = True
EXPORT_PATH        = "//hf_poi_performance.glb"


# ── Scene helpers ─────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.actions:
        bpy.data.actions.remove(block)


def make_poi_ball() -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=POI_RADIUS, location=HAND_POS, segments=12, ring_count=8
    )
    ball = bpy.context.active_object
    ball.name = "hf_poi_ball"

    mat = bpy.data.materials.new("hf_poi_glow")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = (0.15, 0.75, 1.0, 1.0)
    emit.inputs["Strength"].default_value = 5.0
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    ball.data.materials.append(mat)
    ball.animation_data_create()     # create AnimData now; tracks added later
    return ball


def add_lights() -> None:
    bpy.ops.object.light_add(type='AREA', location=(2.0, -2.0, 3.5))
    bpy.context.active_object.data.energy = 80.0
    bpy.ops.object.light_add(type='POINT', location=(-1.5, 1.5, 2.5))
    bpy.context.active_object.data.energy = 30.0


# ── FCurve batch-insert ───────────────────────────────────────────────────────
def bake_location(action: bpy.types.Action,
                  samples: list[tuple[float, float, float]]) -> None:
    """
    Insert (frame, x, y, z) location samples into three FCurves.

    Uses the batch path: keyframe_points.add(n) pre-allocates slots, then
    .co is assigned directly, then fc.update() runs one sort + handle pass.
    options={'FAST'} on keyframe_points.insert() would also work for the
    sequential-insert idiom, but the add+assign path avoids per-point
    function call overhead in large keyframe sets (>200 keys).
    """
    paths = ("location", 0), ("location", 1), ("location", 2)
    for (dp, idx), values in zip(paths, zip(*[(x, y, z) for _, x, y, z in samples])):
        fc = action.fcurves.new(data_path=dp, index=idx, action_group="Location")
        pts = fc.keyframe_points
        pts.add(len(samples))
        for i, (fr, val) in enumerate(zip([s[0] for s in samples], values)):
            pts[i].co               = (fr, val)
            pts[i].interpolation    = 'BEZIER'
            pts[i].handle_left_type  = 'AUTO'
            pts[i].handle_right_type = 'AUTO'
        fc.update()   # one sort + handle recalculation for all keyframes


def new_action(name: str) -> bpy.types.Action:
    """Create a fresh named Action, removing stale same-name block if present."""
    if name in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[name])
    return bpy.data.actions.new(name)


# ── Poi pattern generators ────────────────────────────────────────────────────
def _frame_seq() -> list[float]:
    """KEY_DENSITY evenly-spaced frames from 1 to FRAMES_PER_PATTERN (inclusive)."""
    return [1.0 + i * (FRAMES_PER_PATTERN - 1) / (KEY_DENSITY - 1)
            for i in range(KEY_DENSITY)]


def butterfly_action() -> bpy.types.Action:
    """
    Figure-8 Lissajous (2:1 ratio): x = L·sin(t), y = L·sin(2t)/2, z variable.
    Two full figure-8 cycles over FRAMES_PER_PATTERN frames.
    Relevant to: horizontal-plane butterfly, contact poi prep moves.
    """
    act = new_action("hf_poi_butterfly")
    samples = []
    for fr in _frame_seq():
        t = 2.0 * math.pi * 2.0 * (fr - 1.0) / FRAMES_PER_PATTERN
        x = HAND_POS.x + CORD_LEN * math.sin(t)
        y = HAND_POS.y + CORD_LEN * math.sin(2.0 * t) * 0.45
        z = HAND_POS.z - CORD_LEN * 0.25 * (1.0 - math.cos(t))
        samples.append((fr, x, y, z))
    bake_location(act, samples)
    act.frame_range = (1, FRAMES_PER_PATTERN)   # NLA reads this for strip length
    return act


def helicopter_action() -> bpy.types.Action:
    """
    Horizontal circle elevated above head: 3 full revolutions.
    x = L·cos(3t), y = L·sin(3t), z = HAND + raised offset.
    The high rev-count compresses the timing for a visual "blur" in light-painting.
    """
    act = new_action("hf_poi_helicopter")
    samples = []
    for fr in _frame_seq():
        t = 2.0 * math.pi * 3.0 * (fr - 1.0) / FRAMES_PER_PATTERN
        x = HAND_POS.x + CORD_LEN * math.cos(t)
        y = HAND_POS.y + CORD_LEN * math.sin(t)
        z = HAND_POS.z + 0.50               # overhead raise
        samples.append((fr, x, y, z))
    bake_location(act, samples)
    act.frame_range = (1, FRAMES_PER_PATTERN)
    return act


def weave_action() -> bpy.types.Action:
    """
    3-beat poi weave: side-to-side swing (3 cycles) plus forward-back arc (1 cycle).
    Simplified parametric — a full weave requires hand tracking too, but this
    approximates the poi-head trajectory visible in light-photography.
    """
    act = new_action("hf_poi_weave")
    samples = []
    for fr in _frame_seq():
        t = 2.0 * math.pi * (fr - 1.0) / FRAMES_PER_PATTERN
        # 3-beat lateral rhythm:
        x = HAND_POS.x + 0.70 * math.sin(3.0 * t)
        # front-back arc synchronised to side-crossing moments:
        y = HAND_POS.y + CORD_LEN * math.cos(t)
        # height dips at each side extreme (poi passes under arm):
        z = HAND_POS.z - CORD_LEN * 0.45 * abs(math.sin(1.5 * t))
        samples.append((fr, x, y, z))
    bake_location(act, samples)
    act.frame_range = (1, FRAMES_PER_PATTERN)
    return act


# ── NLA sequencing ────────────────────────────────────────────────────────────
def build_nla(obj: bpy.types.Object,
              sequence: list[tuple[bpy.types.Action, int]]) -> None:
    """
    Add each action as its own NLA track with a single REPLACE strip.

    REPLACE blend_type: this strip completely overrides the evaluated result
    of lower-priority tracks for the frames it covers. No interpolation
    leakage between patterns — each segment is fully autonomous.

    blend_in / blend_out = 0 prevents Blender's cross-fade from softening
    the hard cut between patterns. Hard cuts are intentional here: each
    pattern is a distinct performance phrase.

    NlaStrips.new(name, start, action) places the strip's action_frame_start
    at the action's frame_range.x, so the action's internal frame numbering
    maps 1:1 onto the strip's NLA-time position.
    """
    ad = obj.animation_data
    ad.action = None    # clear any direct action slot binding before using NLA

    for action, nla_start in sequence:
        track       = ad.nla_tracks.new()
        track.name  = action.name
        strip       = track.strips.new(action.name, int(nla_start), action)
        strip.blend_type    = 'REPLACE'
        strip.use_auto_blend = False
        strip.blend_in      = 0.0
        strip.blend_out     = 0.0
        strip.scale         = 1.0    # no time-scale: 1 action-frame == 1 scene-frame


# ── Export ────────────────────────────────────────────────────────────────────
def export_glb(path: str) -> None:
    """
    Export animated GLB. export_nla=True bakes all NLA strips into the
    output; without it only the directly-assigned action (ad.action) exports.
    apply_scale_options='FBX_SCALE_NONE' avoids the 100× scale bake Blender
    sometimes inserts for FBX-derived workflows — irrelevant here but safe.
    """
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_yup=True,
        export_apply=False,
        export_animations=True,
        export_nla_strips=True,         # ← bake NLA into GLB animation tracks
        export_nla_strips_merged_animation_name="poi_performance",
        export_optimize_animation_size=False,
        export_morph=False,
        use_active_scene=True,
    )


# ── Main ──────────────────────────────────────────────────────────────────────
def run() -> None:
    reset_scene()
    ball = make_poi_ball()
    add_lights()

    act_butterfly  = butterfly_action()
    act_helicopter = helicopter_action()
    act_weave      = weave_action()

    # Stack: butterfly → helicopter → weave, gapless in NLA time
    build_nla(ball, [
        (act_butterfly,  1),
        (act_helicopter, 1 + FRAMES_PER_PATTERN),
        (act_weave,      1 + FRAMES_PER_PATTERN * 2),
    ])

    scene = bpy.context.scene
    scene.frame_start    = 1
    scene.frame_end      = 1 + FRAMES_PER_PATTERN * 3 - 1   # 240
    scene.render.fps     = FPS
    scene.frame_current  = 1

    if EXPORT_GLB:
        export_glb(EXPORT_PATH)
        print(f"✓ Exported: {EXPORT_PATH}")

    print(f"✓ hf_poi_performance: {scene.frame_end} frames, 3 NLA patterns")
    print(f"  butterfly  : frames   1–{FRAMES_PER_PATTERN}")
    print(f"  helicopter : frames  {FRAMES_PER_PATTERN+1}–{FRAMES_PER_PATTERN*2}")
    print(f"  weave      : frames {FRAMES_PER_PATTERN*2+1}–{FRAMES_PER_PATTERN*3}")


run()
