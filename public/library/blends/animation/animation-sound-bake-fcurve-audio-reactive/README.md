# Sound Bake to F-Curve — Audio-Reactive Mesh via WAV Amplitude + Geometry Nodes

**Blender 5.1 | Holoflow Studio | CC0**

## What this is

A subdivided grid that pulses radial concentric-wave displacement in sync with a
synthetic kick+snare beat at 120 BPM. The entire pipeline — WAV generation, amplitude
extraction, keyframing, Geometry Nodes setup, and driver wiring — runs as a single
Python script without any operator calls that require UI context.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the entire scene from scratch: generates WAV, parses RMS per frame, keyframes `obj["audio_amplitude"]`, builds GN tree, wires scripted driver |
| `record.py` | Viewport OpenGL render → `viewport.mp4` (144 frames, 6 s) |
| `SCREEN-RECORDING-NOTES.md` | OBS setup + shot list for `screen.mp4` |

## How to run

1. Open Blender 5.1. New General file.
2. Scripting workspace → open `blueprint.py` → Run Script.
3. Check Info bar: `[AudioReactive] 144 frames | peak amplitude baked`.
4. Press Space in the 3D viewport — the grid pulses to the beat.
5. Optionally run `record.py` to bake the viewport animation to MP4.

## Key concepts

- **RMS amplitude per frame** — computed from raw 16-bit PCM samples using Python's
  built-in `wave` and `struct` modules. RMS (root-mean-square) reflects perceived
  loudness better than peak amplitude for driving smooth visual motion.
- **Custom property as animation bus** — `obj["audio_amplitude"]` is keyframed from
  the baked RMS data. This decouples the audio analysis from the GN tree structure.
- **Scripted Driver on GN socket** — drives `modifiers["GeometryNodes"]["Socket_N"]`
  from the custom property, allowing the GN tree to be swapped without re-baking.
- **Radial concentric sine wave** — `z = sin(√(x²+y²) × freq) × amplitude × scale`
  communicates "sound propagating outward from a point source".

## Expected artefacts

See `.expected-artefacts.json`. WAV file is written to the OS temp directory and is
not committed — re-running blueprint.py regenerates it deterministically.

## Licence

CC0. No attribution required. Outside references:
- Blender Python API docs: CC-BY-SA 4.0, Blender Foundation
  https://docs.blender.org/api/current/
- Python `wave` module docs: PSF Licence
  https://docs.python.org/3/library/wave.html
