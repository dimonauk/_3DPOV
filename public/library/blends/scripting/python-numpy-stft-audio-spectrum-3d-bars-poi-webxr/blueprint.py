"""
Python + numpy STFT — Audio Spectrum 3D Bar Visualiser & Poi Reactive Trail
Blender 5.1 · Holoflow Studio · CC0 1.0 Universal

TECHNIQUE
─────────
Short-Time Fourier Transform (STFT) decomposes a 1-D time signal into a
2-D time-frequency spectrogram. For each Blender frame we extract a Hann-
windowed audio chunk, run numpy.fft.rfft, and use the first N_BARS magnitude
bins as the Z-scale keyframes on N_BARS bar mesh objects. A secondary poi
sphere then tracks the peak-energy frequency bin across time — its X position
is bin index, Z is total RMS power — producing a light-painting arc when
rendered with motion blur.

Crucially, we synthesise the signal in Python so the .blend is self-contained:
no external .wav file required. The synthetic signal is a sum of:
  • a sub-bass drone  (55 Hz, A1) sustained throughout
  • a melodic sweep   (220→440 Hz linear chirp over 5 s)
  • white noise floor (amplitude 0.08) to fill the spectral texture

STFT parameters:
  SAMPLE_RATE  = 44 100 Hz
  WINDOW_SIZE  = 2 048 samples  (≈ 46 ms resolution, 21.5 Hz/bin)
  N_BARS       = 32             (covers 0–688 Hz, bass + low-mid)
  TOTAL_FRAMES = 120            (5 s at 24 fps)

Each bar is a unit cube. Z-scale is set equal to the normalised FFT magnitude
(clamped 0–BAR_MAX_Z). The bars parent to an empty called "Spectrum_Root" so
the whole rig is a single GLB node group.

Run: Text Editor → Alt+P
Outputs (relative to this file's directory):
  hf_spectrum.blend
  hf_spectrum.glb
"""

import math
import os
import numpy as np
import bpy
import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────
SAMPLE_RATE   = 44_100
WINDOW_SIZE   = 2_048
N_BARS        = 32          # frequency bins (0 Hz to N_BARS * SAMPLE_RATE/WINDOW_SIZE Hz)
TOTAL_FRAMES  = 120         # 5 s @ 24 fps
FPS           = 24
BAR_WIDTH     = 0.22        # X spacing (centre-to-centre)
BAR_DEPTH     = 0.18        # Y thickness
BAR_MAX_Z     = 3.5         # maximum height
DRONE_AMP     = 0.55        # sub-bass sine amplitude
DRONE_FREQ    = 55.0        # Hz – A1
CHIRP_AMP     = 0.40        # linear chirp amplitude
CHIRP_F0      = 220.0       # chirp start Hz
CHIRP_F1      = 440.0       # chirp end Hz
NOISE_AMP     = 0.08        # white noise floor

SLUG    = "python-numpy-stft-audio-spectrum-3d-bars-poi-webxr"
THIS_DIR = bpy.path.abspath(os.path.dirname(bpy.context.space_data.text.filepath)
                            if bpy.context.space_data and bpy.context.space_data.text
                            else f"//blends/scripting/{SLUG}/")

# frequency resolution in Hz per bin
DF = SAMPLE_RATE / WINDOW_SIZE  # ≈ 21.5 Hz


# ── Audio synthesis ───────────────────────────────────────────────────────────
def generate_signal(n_samples: int) -> np.ndarray:
    """Synthetic audio: sub-bass drone + linear chirp + white noise."""
    t = np.linspace(0.0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
    drone = DRONE_AMP * np.sin(2 * math.pi * DRONE_FREQ * t)
    # linear chirp: instantaneous frequency = CHIRP_F0 + (CHIRP_F1 - CHIRP_F0) * t/T
    T = n_samples / SAMPLE_RATE
    chirp = CHIRP_AMP * np.sin(2 * math.pi * (CHIRP_F0 * t + 0.5 * (CHIRP_F1 - CHIRP_F0) / T * t ** 2))
    noise = NOISE_AMP * np.random.default_rng(42).standard_normal(n_samples)
    return (drone + chirp + noise).astype(np.float32)


# ── STFT ──────────────────────────────────────────────────────────────────────
def compute_stft_frames(signal: np.ndarray) -> np.ndarray:
    """Returns float32 array [TOTAL_FRAMES, N_BARS] of normalised magnitudes."""
    window = np.hanning(WINDOW_SIZE).astype(np.float32)
    out = np.zeros((TOTAL_FRAMES, N_BARS), dtype=np.float32)
    for frame in range(TOTAL_FRAMES):
        # centre the FFT window on the audio sample for this frame
        centre = int((frame / FPS) * SAMPLE_RATE)
        half   = WINDOW_SIZE // 2
        lo, hi = centre - half, centre + half
        # pad with zeros if we are near the signal boundary
        chunk  = np.zeros(WINDOW_SIZE, dtype=np.float32)
        sl_sig = signal[max(0, lo): min(len(signal), hi)]
        dst_lo = max(0, -lo)
        chunk[dst_lo: dst_lo + len(sl_sig)] = sl_sig
        spec = np.abs(np.fft.rfft(chunk * window))[:N_BARS]
        out[frame] = spec
    # normalise across the whole animation so the tallest bar hits 1.0
    peak = out.max()
    if peak > 1e-9:
        out /= peak
    return out


# ── Blender scene helpers ─────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def emission_material(name: str, color: tuple, strength: float = 2.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "OPAQUE"
    tree = mat.node_tree
    tree.nodes.clear()
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    emit = tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value   = (*color, 1.0)
    emit.inputs["Strength"].default_value = strength
    tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def make_bar(idx: int, mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = f"Bar_{idx:02d}"
    obj.data.name = f"Bar_{idx:02d}_mesh"
    # default cube is -0.5..+0.5; set scale so width/depth are correct
    # and origin sits at cube bottom (Z at 0, top at scale.z)
    obj.scale = (BAR_WIDTH * 0.9, BAR_DEPTH, 1.0)
    obj.location = (idx * BAR_WIDTH - (N_BARS * BAR_WIDTH) / 2.0 + BAR_WIDTH / 2, 0, 0.5)
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    return obj


def make_poi_sphere(mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, -0.6, 0))
    obj = bpy.context.active_object
    obj.name = "Poi_Dot"
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    return obj


# ── Keyframe animation ────────────────────────────────────────────────────────
def key_bars(bars: list, magnitudes: np.ndarray) -> None:
    """Insert Z-scale keyframes on every bar for every frame."""
    for f in range(TOTAL_FRAMES):
        bpy.context.scene.frame_set(f + 1)
        for idx, bar in enumerate(bars):
            bar.scale.z = float(magnitudes[f, idx]) * BAR_MAX_Z + 0.05
            bar.location.z = bar.scale.z / 2.0
            bar.keyframe_insert("scale",    index=2, frame=f + 1)
            bar.keyframe_insert("location", index=2, frame=f + 1)


def key_poi(poi: bpy.types.Object, magnitudes: np.ndarray) -> None:
    """Poi sphere follows peak-frequency bin (X) and RMS power (Z)."""
    x_range = (N_BARS - 1) * BAR_WIDTH
    x_shift = -x_range / 2.0
    for f in range(TOTAL_FRAMES):
        row   = magnitudes[f]
        peak  = int(np.argmax(row))
        rms   = float(np.sqrt(np.mean(row ** 2)))
        poi.location.x = peak * BAR_WIDTH + x_shift
        poi.location.z = rms * BAR_MAX_Z + 0.12
        poi.keyframe_insert("location", frame=f + 1)


# ── Build & export ────────────────────────────────────────────────────────────
def build() -> None:
    clear_scene()
    scene        = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    n_samples  = int(TOTAL_FRAMES / FPS * SAMPLE_RATE) + WINDOW_SIZE
    signal     = generate_signal(n_samples)
    magnitudes = compute_stft_frames(signal)

    bar_mat = emission_material("BarMat", (0.05, 0.8, 1.0), strength=3.0)
    poi_mat = emission_material("PoiMat", (1.0, 0.35, 0.05), strength=6.0)

    bars = [make_bar(i, bar_mat) for i in range(N_BARS)]
    poi  = make_poi_sphere(poi_mat)

    key_bars(bars, magnitudes)
    key_poi(poi, magnitudes)

    # parent everything to a root empty for clean GLB export
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = bpy.context.active_object
    root.name = "hf_spectrum"
    for bar in bars:
        bar.parent = root
    poi.parent = root

    # set all F-Curve interpolation to LINEAR for a crisp bar-graph response
    for obj in bars + [poi]:
        if obj.animation_data and obj.animation_data.action:
            for fc in obj.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"

    scene.frame_set(1)

    os.makedirs(THIS_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(THIS_DIR, "hf_spectrum.blend"))

    # export GLB: apply transforms, WebP textures, Draco off (bar animation needs it)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(THIS_DIR, "hf_spectrum.glb"),
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=False,
    )
    print(f"[holoflow] spectrum saved → {THIS_DIR}")


build()
