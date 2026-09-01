# Screen Recording Notes — Duffing Oscillator

## Software
- **OBS Studio 30+** or Windows Game Bar
- Window source: Blender 5.1 (full window capture)
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **OFF**
- Bitrate: 8 000 kbps (H.264)

## Blender workspace before recording
1. Open `blueprint.py` in the Scripting editor.
2. Split view: Scripting (left) | 3D Viewport (right).
3. In the Scripting editor press **Run Script** — watch the viewport build the tube.
4. Set 3D Viewport shading to **Material Preview** (Z → Material Preview).
5. Select `hf_duffing_poi`, press **Numpad `.`** to frame it.
6. Open the **Properties → Object Data → Shape Keys** panel.
7. Open the Timeline; set range **1–360**.

## What to capture (suggested sequence ~12 s)

| Time | Action |
|------|--------|
| 0–2 s | Show Scripting editor with blueprint.py visible; press Run |
| 2–5 s | 3D Viewport: orbit slowly, show the chaotic tube (Basis / Holmes params) |
| 5–7 s | Drag `SK_Ueda` value slider from 0→1; watch the tube morph to Ueda attractor |
| 7–9 s | Drag `SK_Period2` to 1; show the clean two-lobed period-2 orbit |
| 9–11 s | Drag `SK_Locked` to 1; show the near-elliptical period-1 sinusoidal lock |
| 11–12 s | Return to Basis; slow orbit to show cobalt–amber well colouring |

## Tips
- Use **middle-mouse drag** for smooth orbit in the 3D Viewport.
- Press **Numpad 5** to toggle orthographic (good for showing attractor shape clean).
- The cobalt–amber gradient encodes x-position: cobalt = left potential well, amber = right.
- To slow down the shape-key morph: play the Timeline (Space) and let `record.py` do it,
  or scrub manually for the screen recording.

## Output
Save the trimmed recording to:
```
public/library/videos/scripting/
  python-numpy-duffing-oscillator-ueda-bistability-period-doubling-rk4-bishop-tube-poi-webxr/
  screen.mp4
```
Export settings: MP4 · H.264 · CRF 18 · 1920 × 1080 · 30 fps · no audio.
