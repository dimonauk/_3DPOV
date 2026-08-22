"""
Sound Bake to F-Curve — Audio-Reactive Mesh via WAV Amplitude + Geometry Nodes
===============================================================================
Blender 5.1 | Holoflow Studio | CC0

WAV amplitude is parsed frame-by-frame in pure Python (wave + struct, zero external
deps), keyframed onto a custom float property, then driven into a Geometry Nodes
displacement via a Scripted Driver. The result is a subdivided grid that pulses a
radial concentric-wave pattern to a synthetic kick+snare beat at 120 BPM.

WHY NOT bpy.ops.graph.sound_bake():
  The operator requires graph-editor UI context with an FCurve actively selected in
  the viewport — it cannot be invoked safely from a Text Editor script. Parsing the
  WAV in Python gives identical amplitude data, runs headlessly, and keeps authoring
  logic explicit and reproducible. Per-frame RMS amplitude is also a better perceptual
  loudness metric than raw peak amplitude for driving visual motion.

WHY CUSTOM PROPERTY + DRIVER:
  GN modifier inputs in 5.x are accessed via modifiers["GeometryNodes"][identifier].
  Driving that socket via a Scripted Driver that reads obj["audio_amplitude"] decouples
  the baked keyframe data from the GN tree. Swap the GN tree without re-baking;
  read the property from other drivers or tools without touching the modifier.

WHY RADIAL CONCENTRIC SINE WAVE:
  Uniform Z-lift loses spatial richness. Axis-aligned travelling wave breaks symmetry
  unnecessarily. Radial concentric waves from mesh centre read as "sound propagating
  outward" — the visual metaphor matches the audio source concept and stays legible
  across WebXR viewport scales.
"""

import bpy
import math
import struct
import wave
import os
import tempfile

# ── Constants ─────────────────────────────────────────────────────────────────
FPS           = 24
BEAT_BPM      = 120
TOTAL_BARS    = 3          # 3 bars × 4 beats = 12 beats = 6 seconds at 120 BPM
SAMPLE_RATE   = 44100
GRID_SIZE     = 40         # verts per side on the subdivided plane
GRID_SCALE    = 4.0        # world units across the grid
WAVE_FREQ     = 10.0       # radians per world unit for concentric wave
HEIGHT_SCALE  = 0.7        # max displacement at amplitude = 1.0


# ── 1. Generate synthetic beat WAV ────────────────────────────────────────────
def generate_beat_wav(path: str, bpm: float, bars: int) -> None:
    """
    Writes a 16-bit mono WAV with kick (60 Hz decaying sine) on beats 1, 3 and
    snare (200 Hz + 4 kHz transient) on beats 2, 4 of each bar.
    No external libraries required.
    """
    beats_total = bars * 4
    duration    = beats_total * 60.0 / bpm          # seconds
    n_samples   = int(SAMPLE_RATE * duration)
    beat_sec    = 60.0 / bpm

    samples: list[float] = [0.0] * n_samples
    for beat_i in range(beats_total):
        t0 = beat_i * beat_sec
        beat_in_bar = beat_i % 4
        for s_i in range(n_samples):
            t = s_i / SAMPLE_RATE
            dt = t - t0
            if dt < 0 or dt > 0.18:
                continue
            if beat_in_bar in (0, 2):              # kick
                v = math.exp(-dt * 38) * math.sin(2 * math.pi * 60 * dt)
            else:                                   # snare
                v = math.exp(-dt * 28) * (
                    0.7 * math.sin(2 * math.pi * 200 * dt)
                    + 0.3 * math.sin(2 * math.pi * 4000 * dt)
                )
            samples[s_i] = max(-1.0, min(1.0, samples[s_i] + v))

    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        packed = struct.pack(f'<{n_samples}h', *(int(s * 32767) for s in samples))
        wf.writeframes(packed)


# ── 2. Parse WAV → per-frame RMS amplitude ────────────────────────────────────
def wav_rms_per_frame(path: str, fps: int, n_frames: int) -> list[float]:
    with wave.open(path, 'r') as wf:
        sr          = wf.getframerate()
        n_ch        = wf.getnchannels()
        sw          = wf.getsampwidth()
        total_wav   = wf.getnframes()
        raw         = wf.readframes(total_wav)

    if sw != 2:
        raise RuntimeError(f"Expected 16-bit PCM, got {sw*8}-bit")

    floats = [s / 32768.0 for s in struct.unpack(f'<{total_wav * n_ch}h', raw)]
    if n_ch == 2:                                   # mix stereo to mono
        floats = [(floats[i] + floats[i + 1]) * 0.5 for i in range(0, len(floats), 2)]

    spf = sr / fps                                  # samples per animation frame
    result: list[float] = []
    for f in range(n_frames):
        a = int(f * spf)
        b = min(int((f + 1) * spf), len(floats))
        chunk = floats[a:b]
        rms = math.sqrt(sum(s * s for s in chunk) / len(chunk)) if chunk else 0.0
        result.append(rms)

    peak = max(result) or 1.0
    return [v / peak for v in result]              # normalise to [0, 1]


# ── 3. Build Geometry Nodes tree ──────────────────────────────────────────────
def build_gn_tree() -> bpy.types.NodeTree:
    nt = bpy.data.node_groups.new("AudioReactiveWave", 'GeometryNodeTree')

    nt.interface.new_socket("Geometry",  in_out='INPUT',  socket_type='NodeSocketGeometry')
    nt.interface.new_socket("Amplitude", in_out='INPUT',  socket_type='NodeSocketFloat')
    nt.interface.new_socket("Geometry",  in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gin   = nt.nodes.new('NodeGroupInput');   gin.location  = (-600, 0)
    gout  = nt.nodes.new('NodeGroupOutput');  gout.location = ( 800, 0)
    pos   = nt.nodes.new('GeometryNodeInputPosition'); pos.location = (-600, -200)
    sep   = nt.nodes.new('ShaderNodeSeparateXYZ');     sep.location = (-400, -200)
    # X² + Y² → sqrt → radius
    sq_x  = nt.nodes.new('ShaderNodeMath'); sq_x.operation  = 'POWER';  sq_x.inputs[1].default_value  = 2.0; sq_x.location  = (-200, -100)
    sq_y  = nt.nodes.new('ShaderNodeMath'); sq_y.operation  = 'POWER';  sq_y.inputs[1].default_value  = 2.0; sq_y.location  = (-200, -220)
    add   = nt.nodes.new('ShaderNodeMath'); add.operation   = 'ADD';    add.location   = (  0, -160)
    sqr   = nt.nodes.new('ShaderNodeMath'); sqr.operation   = 'SQRT';   sqr.location   = ( 200, -160)
    # sin(radius × WAVE_FREQ) → amplitude-scale
    mfreq = nt.nodes.new('ShaderNodeMath'); mfreq.operation = 'MULTIPLY'; mfreq.inputs[1].default_value = WAVE_FREQ; mfreq.location = (380, -160)
    sine  = nt.nodes.new('ShaderNodeMath'); sine.operation  = 'SINE';   sine.location  = (560, -160)
    mamp  = nt.nodes.new('ShaderNodeMath'); mamp.operation  = 'MULTIPLY'; mamp.location = (720, -80)
    mscl  = nt.nodes.new('ShaderNodeMath'); mscl.operation  = 'MULTIPLY'; mscl.inputs[1].default_value = HEIGHT_SCALE; mscl.location = (880, -80)
    comb  = nt.nodes.new('ShaderNodeCombineXYZ'); comb.location = (1040, -80)
    spos  = nt.nodes.new('GeometryNodeSetPosition'); spos.location = (600, 80)

    L = nt.links.new
    L(pos.outputs['Position'],         sep.inputs['Vector'])
    L(sep.outputs['X'],                sq_x.inputs[0])
    L(sep.outputs['Y'],                sq_y.inputs[0])
    L(sq_x.outputs['Value'],           add.inputs[0])
    L(sq_y.outputs['Value'],           add.inputs[1])
    L(add.outputs['Value'],            sqr.inputs[0])
    L(sqr.outputs['Value'],            mfreq.inputs[0])
    L(mfreq.outputs['Value'],          sine.inputs[0])
    L(sine.outputs['Value'],           mamp.inputs[0])
    L(gin.outputs['Amplitude'],        mamp.inputs[1])
    L(mamp.outputs['Value'],           mscl.inputs[0])
    L(mscl.outputs['Value'],           comb.inputs['Z'])
    L(comb.outputs['Vector'],          spos.inputs['Offset'])
    L(gin.outputs['Geometry'],         spos.inputs['Geometry'])
    L(spos.outputs['Geometry'],        gout.inputs['Geometry'])
    return nt


# ── 4. Main: scene assembly ───────────────────────────────────────────────────
def main() -> None:
    # Reset
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # WAV generation + parsing
    wav_path    = os.path.join(tempfile.gettempdir(), "holoflow_beat.wav")
    generate_beat_wav(wav_path, BEAT_BPM, TOTAL_BARS)
    beats_total = TOTAL_BARS * 4
    n_frames    = int(beats_total * FPS * 60 / BEAT_BPM)   # 144 at 120 BPM / 24fps
    amplitudes  = wav_rms_per_frame(wav_path, FPS, n_frames)

    # Scene / timeline
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = n_frames
    scn.render.fps  = FPS

    # Grid mesh — subdivided plane
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_SIZE,
        y_subdivisions=GRID_SIZE,
        size=GRID_SCALE,
    )
    obj = bpy.context.active_object
    obj.name = "AudioReactiveMesh"

    # Custom float property — receives amplitude keyframes
    obj["audio_amplitude"] = 0.0
    id_prop = obj.id_properties_ui("audio_amplitude")
    id_prop.update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0)

    # Bake RMS amplitude to keyframes on the custom property
    obj.animation_data_create()
    action = bpy.data.actions.new("AudioAmplitude")
    obj.animation_data.action = action
    for frame_i, amp in enumerate(amplitudes, start=1):
        obj["audio_amplitude"] = amp
        obj.keyframe_insert(data_path='["audio_amplitude"]', frame=frame_i)

    # GN modifier
    nt  = build_gn_tree()
    mod = obj.modifiers.new("GeometryNodes", 'NODES')
    mod.node_group = nt

    # Scripted driver: GN input ← custom property
    amp_socket = next(
        s for s in nt.interface.items_tree
        if getattr(s, 'name', '') == "Amplitude"
    )
    fc = mod.driver_add(f'["{amp_socket.identifier}"]')
    drv = fc.driver
    drv.type = 'SCRIPTED'
    drv.expression = 'amp'
    var = drv.variables.new()
    var.name = 'amp'
    var.type = 'SINGLE_PROP'
    var.targets[0].id = obj
    var.targets[0].data_path = '["audio_amplitude"]'

    # Emission material — glows brighter at peak amplitude
    mat = bpy.data.materials.new("AudioGlow")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit  = nodes.new('ShaderNodeEmission')
    out   = nodes.new('ShaderNodeOutputMaterial')
    emit.inputs['Color'].default_value  = (0.1, 0.7, 1.0, 1.0)   # cyan
    emit.inputs['Strength'].default_value = 2.0
    mat.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    obj.data.materials.append(mat)

    # Camera + lighting
    bpy.ops.object.camera_add(location=(0, -7, 5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(55), 0, 0)
    scn.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0

    print(f"[AudioReactive] {n_frames} frames | peak amplitude baked | WAV: {wav_path}")


main()
