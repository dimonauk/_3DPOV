"""
F-Curve Modifiers — Noise + Cycles + Stepped: Procedural Animation Variation
=============================================================================
Blender 5.1 | Holoflow Studio | CC0

F-Curve modifiers are waveform post-processors that run inline during the
dependency-graph traversal, after keyframe evaluation and before the result
reaches the datablock. They add procedural behaviour — looping, organic noise,
time quantisation — without touching the authored keyframe data.

Three paired demonstrations:
  Sphere  → CYCLES  (infinite bounce loop from 24 keyframes)
            NOISE   (rotation wobble, blend_type=ADD: adds ±0.18 rad on rot.Z)
  Ratchet → STEPPED (snaps a continuous rotation to 15° increments, 4-frame hold)
  Camera  → NOISE   (handheld-shake: ±0.04 m on loc.X and loc.Y, different phases)

WHY CYCLES INSTEAD OF NLA REPEAT:
  NLA strips carry authoring overhead — strip metadata, action-slot binding,
  influence falloff. CYCLES is a zero-alloc modifier: the depsgraph re-evaluates
  the existing curve at a remapped frame index each tick. For simple looping motion
  (walking, breathing, bouncing) it is measurably faster at runtime, especially
  with hundreds of instances sharing the same action via linked data.

WHY EVALUATION ORDER MATTERS:
  fcurve.modifiers[0] evaluates first. Stacking CYCLES then NOISE means CYCLES
  remaps time before NOISE computes its random offset — the noise appears on
  every cycle, consistent. Reverse the stack: NOISE runs on the raw time axis
  first, CYCLES then tries to loop a noisy curve, which doubles noise at the
  cycle boundary and creates a pop artifact.

CYCLES mode_before / mode_after options:
  REPEAT        — value resets at cycle boundary; ideal for position bounce.
  REPEAT_OFFSET — adds the full-cycle delta each cycle; use for endless stairs
                  (loc.Z climbing while also looping the step motion).
  MIRROR        — ping-pong (forward then reversed); good for pendulums.

NOISE blend_type choices:
  ADD      — adds noise offset to the base curve (what we want for shake/wobble).
  REPLACE  — replaces the curve value entirely with noise; useful for fully
             procedural jitter channels like a flag flap with no authored keys.
  MULTIPLY — scales the curve value by (1 + noise); amplitude-modulation effect.

STEPPED quantisation:
  frame_step=1 → no change. frame_step=4 → value holds for 4 frames then jumps.
  snap_in_frame controls WHICH frame within the step block is sampled.
  Default snap_in_frame=0 samples the first frame of each block; set to half
  step for mid-block sampling (smoother appearance in motion-blur renders).

EXPORT BOUNDARY:
  F-Curve modifiers are .blend-internal only; glTF/GLB has no representation
  for them. Materialise to keyframes before export:
    Object ▸ Animation ▸ Bake Action → enable Visual Keying, Step = 1
  This produces dense keyframes that encode the modifier output faithfully.

Run headless:
    blender --background --python blueprint.py
"""

import bpy
import math

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
SPHERE_RADIUS       = 0.5
BOUNCE_LOW_Z        = SPHERE_RADIUS          # resting on ground (centre = radius)
BOUNCE_HIGH_Z       = 3.0
LOOP_FRAMES         = 24                     # one bounce period

NOISE_SPHERE_STR    = 0.18                   # ±rad wobble on sphere rot.Z
NOISE_SPHERE_SCALE  = 8.0                    # ~3 peaks per 24-frame loop
NOISE_SPHERE_DEPTH  = 2                      # octave count (1=smooth, 4=jagged)
NOISE_SPHERE_PHASE  = 42

NOISE_CAM_STR       = 0.04                   # ±m camera shake
NOISE_CAM_SCALE     = 5.0
NOISE_CAM_PHASE_X   = 17
NOISE_CAM_PHASE_Y   = 91                     # distinct phase → x/y don't sync

RATCHET_STEP_FRAMES = 4                      # 4-frame hold per click
TOTAL_FRAMES        = 96                     # render window (4 bounce loops)


def find_fcurve(action, data_path, array_index):
    """Return the first matching FCurve or raise informative KeyError."""
    for fc in action.fcurves:
        if fc.data_path == data_path and fc.array_index == array_index:
            return fc
    raise KeyError(f"FCurve not found: {data_path}[{array_index}]")


# ── RESET SCENE ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for block in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.actions):
    bpy.data.batch_remove([block])

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = 24

# ── GROUND PLANE ──────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Ground"
mat_g = bpy.data.materials.new("Ground_Mat")
mat_g.use_nodes = True
mat_g.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.08, 0.08, 0.12, 1)
ground.data.materials.append(mat_g)

# ── BOUNCING SPHERE ───────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(radius=SPHERE_RADIUS, location=(0, 0, BOUNCE_LOW_Z))
sphere = bpy.context.active_object
sphere.name = "BounceSphere"

mat_s = bpy.data.materials.new("Sphere_Mat")
mat_s.use_nodes = True
bsdf = mat_s.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value   = (0.6, 0.1, 0.9, 1)
bsdf.inputs["Roughness"].default_value    = 0.2
bsdf.inputs["Metallic"].default_value     = 0.0
bsdf.inputs["Emission Color"].default_value = (0.4, 0.05, 0.7, 1)
bsdf.inputs["Emission Strength"].default_value = 0.4
sphere.data.materials.append(mat_s)

# Keyframe: bounce low → high → low over LOOP_FRAMES
sphere.location.z = BOUNCE_LOW_Z
sphere.keyframe_insert(data_path="location", index=2, frame=1)
sphere.location.z = BOUNCE_HIGH_Z
sphere.keyframe_insert(data_path="location", index=2, frame=LOOP_FRAMES // 2)
sphere.location.z = BOUNCE_LOW_Z
sphere.keyframe_insert(data_path="location", index=2, frame=LOOP_FRAMES)

# SINE interpolation → smooth arc (not linear ramp)
act_sphere = sphere.animation_data.action
fc_bounce  = find_fcurve(act_sphere, "location", 2)
for kp in fc_bounce.keyframe_points:
    kp.interpolation = "SINE"

# MODIFIER 1 — CYCLES: loop the 24-frame bounce infinitely
cycles = fc_bounce.modifiers.new(type="CYCLES")
cycles.mode_before = "REPEAT"
cycles.mode_after  = "REPEAT"
# cycles_before/after = 0 means infinite; -1 is the 'not set' sentinel in older builds
# In Blender 5.1 leave at 0 for unlimited looping

# MODIFIER 2 — NOISE on rotation Z (organic wobble, evaluated AFTER cycles on a separate curve)
sphere.rotation_euler.z = 0.0
sphere.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
sphere.keyframe_insert(data_path="rotation_euler", index=2, frame=TOTAL_FRAMES)

fc_rot = find_fcurve(act_sphere, "rotation_euler", 2)
noise_s = fc_rot.modifiers.new(type="NOISE")
noise_s.blend_type = "ADD"          # adds to base 0-rad value, not replaces
noise_s.scale      = NOISE_SPHERE_SCALE
noise_s.strength   = NOISE_SPHERE_STR
noise_s.phase      = NOISE_SPHERE_PHASE
noise_s.depth      = NOISE_SPHERE_DEPTH

# ── RATCHET DISC ──────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=0.12, location=(2.5, 0, 0.06))
ratchet = bpy.context.active_object
ratchet.name = "RatchetDisc"

mat_r = bpy.data.materials.new("Ratchet_Mat")
mat_r.use_nodes = True
bsdf_r = mat_r.node_tree.nodes["Principled BSDF"]
bsdf_r.inputs["Base Color"].default_value = (0.05, 0.5, 0.9, 1)
bsdf_r.inputs["Metallic"].default_value   = 0.8
bsdf_r.inputs["Roughness"].default_value  = 0.15
ratchet.data.materials.append(mat_r)

# Keyframe: one full 360° rotation over TOTAL_FRAMES
ratchet.rotation_euler.z = 0.0
ratchet.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
ratchet.rotation_euler.z = math.tau      # 2π radians = 360°
ratchet.keyframe_insert(data_path="rotation_euler", index=2, frame=TOTAL_FRAMES)

act_ratchet = ratchet.animation_data.action
fc_ratchet  = find_fcurve(act_ratchet, "rotation_euler", 2)
for kp in fc_ratchet.keyframe_points:
    kp.interpolation = "LINEAR"          # constant angular velocity before stepping

# MODIFIER — STEPPED: quantise continuous rotation to 15° increments
# 96 frames total / 4 frame_step = 24 steps → 360°/24 = 15° per click
stepped = fc_ratchet.modifiers.new(type="STEPPED")
stepped.frame_step    = float(RATCHET_STEP_FRAMES)
stepped.snap_in_frame = 0.0              # sample the first frame of each block

# ── CAMERA ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(5.0, -4.5, 3.0))
cam_obj = bpy.context.active_object
cam_obj.name = "Camera"
scene.camera = cam_obj

# Point camera at sphere (world origin area)
cam_obj.rotation_euler = (math.radians(55), 0, math.radians(47))

# Seed keyframes so animation_data and action are created
cam_obj.keyframe_insert(data_path="location", frame=1)
cam_obj.keyframe_insert(data_path="location", frame=TOTAL_FRAMES)

act_cam = cam_obj.animation_data.action

# MODIFIER — NOISE on camera loc.X and loc.Y for handheld shake
for axis_idx, phase in ((0, NOISE_CAM_PHASE_X), (1, NOISE_CAM_PHASE_Y)):
    fc_cam = find_fcurve(act_cam, "location", axis_idx)
    noise_c = fc_cam.modifiers.new(type="NOISE")
    noise_c.blend_type = "ADD"
    noise_c.scale      = NOISE_CAM_SCALE
    noise_c.strength   = NOISE_CAM_STR
    noise_c.phase      = float(phase)
    noise_c.depth      = 2

# ── LIGHTING ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(3, -2, 5))
key_light = bpy.context.active_object
key_light.name = "KeyLight"
key_light.data.energy = 200
key_light.data.size   = 2.0
key_light.rotation_euler = (math.radians(50), 0, math.radians(30))

bpy.ops.object.light_add(type="AREA", location=(-3, -1, 3))
fill = bpy.context.active_object
fill.name = "FillLight"
fill.data.energy = 60
fill.data.color  = (0.6, 0.7, 1.0)   # cool blue fill
fill.data.size   = 3.0

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

print("blueprint.py complete — 3 objects with F-Curve modifiers ready.")
print("  BounceSphere : CYCLES (loc.Z loop) + NOISE (rot.Z wobble)")
print("  RatchetDisc  : STEPPED (4-frame quantised rotation)")
print("  Camera       : NOISE (handheld shake, loc.X + loc.Y)")
print("Next: run record.py to render viewport.mp4")
