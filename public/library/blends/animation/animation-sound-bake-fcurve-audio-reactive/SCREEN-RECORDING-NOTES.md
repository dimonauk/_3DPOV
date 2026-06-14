# Screen Recording Notes — Audio-Reactive Mesh (Sound Bake to F-Curve)

**Target file**: `public/library/videos/animation/animation-sound-bake-fcurve-audio-reactive/screen.mp4`

## OBS / Game Bar Settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** — no system audio needed for screen recording |
| Output format | MP4 / H.264 |

## What to Record

1. **Run blueprint.py** (Scripting workspace → Run Script). Show the terminal output confirming "144 frames | peak amplitude baked".
2. **Switch to Layout workspace.** The grid appears flat — amplitude is 0 on frame 1.
3. **Press Space** to play the timeline. Watch the radial concentric-wave pattern rise and fall as the kick (tall, fast) and snare (medium, quicker decay) pulses drive the displacement.
4. **Scrub manually** to frames 12 and 13 (first kick hit) — show the peak wave height compared to frame 11 (near-zero).
5. **Select the mesh.** Open **Properties ▸ Object Properties ▸ Custom Properties**. Scrub the timeline and point to `audio_amplitude` animating between 0 and 1 in real time.
6. **Open the Graph Editor.** Select AudioReactiveMesh. Press A to show all FCurves. Show the amplitude FCurve — it pulses in a kick/snare pattern. Zoom into the first bar to show individual beat peaks.
7. **Open the Modifier Properties** → GeometryNodes modifier → show the Amplitude socket is driven (small icon next to it). Open the driver by hovering and pressing Ctrl+D to confirm the scripted driver reads `["audio_amplitude"]`.
8. **Swap to Material Preview shading** (Z key → Material Preview). The cyan emission grid glows — wave height and emission reading together are visually cohesive.
9. **Run record.py** (Scripting workspace) to produce `viewport.mp4`. Optionally stay on the render output popover while it processes.

## Duration

Aim for **90–120 seconds** of screen recording covering steps 1–9. Edit to 60 seconds for upload.
