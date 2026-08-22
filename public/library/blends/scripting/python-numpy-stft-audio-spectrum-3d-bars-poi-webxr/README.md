# Python + numpy STFT — Audio Spectrum 3D Bar Visualiser & Poi Reactive Trail (Blender 5.1)

A Short-Time Fourier Transform computed in Python drives 32 animated bar columns
inside Blender, producing an audio-reactive 3D frequency spectrum. A poi-sized
emissive sphere tracks the dominant frequency bin over time, tracing a
light-painting arc when rendered with motion blur.

## What STFT means

A single FFT snapshot tells you the frequency content at one moment. The STFT
repeats that snapshot every `HOP` samples — a sliding-window approach — giving
you a 2-D spectrogram: rows = time frames, columns = frequency bins. For a
Blender animation:

```
frame f  →  audio sample at  f / 24 * 44100
           ↓  extract WINDOW_SIZE=2048 samples, apply Hann window
           ↓  numpy.fft.rfft  →  N_BARS=32 magnitude bins
           ↓  set bar[n].scale.z  →  keyframe_insert
```

## Frequency coverage

With `SAMPLE_RATE = 44100 Hz` and `WINDOW_SIZE = 2048`, each bin spans
`44100 / 2048 ≈ 21.5 Hz`. The 32 bars displayed cover **0–688 Hz** — sub-bass,
bass, and low-mid, the most visually dynamic range for music and poi performance.

## Synthetic signal design

No .wav file is required. The signal is synthesised in pure Python:

| Component | Params | Perceptual role |
|---|---|---|
| Sub-bass drone | 55 Hz (A1), amplitude 0.55 | Fills bars 0–3 throughout |
| Linear chirp | 220→440 Hz over 5 s, amp 0.40 | Peak bar sweeps left to right across bins 10–20 |
| White noise | amplitude 0.08 | Scatters low-level energy across all bars |

The chirp makes the visualiser tell a story: a bright narrow peak moves
steadily rightward from about bar 10 (220 Hz) to bar 20 (440 Hz), while the
drone holds a constant glow at the bass end and noise provides texture.

## Key Blender API calls

| Call | Purpose |
|---|---|
| `bpy.ops.mesh.primitive_cube_add()` | One cube per frequency bar |
| `obj.scale.z = mag * BAR_MAX_Z` | Height proportional to magnitude |
| `obj.keyframe_insert("scale", index=2, frame=f)` | Per-frame Z-scale animation |
| `obj.keyframe_insert("location", index=2, frame=f)` | Origin tracks midpoint of bar |
| `kp.interpolation = "LINEAR"` | Crisp step-like bar-graph response |
| `bpy.ops.export_scene.gltf(export_animations=True)` | Exports full animation to GLB |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds scene: synthetic audio, STFT, bar rig, poi sphere, GLB export |
| `record.py` | EEVEE Next render → `viewport.mp4` (1920×1080, 5 s, bloom enabled) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Outputs

- `hf_spectrum.blend` — animated .blend with 120-frame spectrum rig
- `hf_spectrum.glb` — WebXR-ready animated GLB (poi trail included)

## Poi connection

The poi sphere (`Poi_Dot`) is an orange emissive sphere that moves:
- **X axis** = frequency bin with peak energy (which note is loudest)
- **Z axis** = total RMS power (how loud the signal is)

With motion blur enabled, its path across 120 frames traces an arc from
low-frequency centre to mid-frequency right as the chirp sweeps. This is the
direct Blender equivalent of a poi performer drawing a light arc whose position
encodes the music they are spinning to.
