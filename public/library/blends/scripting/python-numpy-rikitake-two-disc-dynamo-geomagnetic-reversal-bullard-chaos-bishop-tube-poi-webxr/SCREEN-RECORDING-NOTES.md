# Screen Recording Notes — Rikitake Two-Disc Dynamo

## Software
OBS Studio (≥ 30.0) or Windows Game Bar (Win + G).  
Blender 5.1 must be open and the **rikitake_dynamo** object visible.

## Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` in this folder |

## Recommended viewport state
1. Open **Scripting** workspace, run `blueprint.py`.  
   Confirm the tube appears — cobalt/amber gradient flowing along the attractor.
2. Switch to **Layout** workspace → numpad **0** (camera view).
3. Set **Viewport shading** to **Rendered** (Eevee Next).
4. In the **Timeline**, set end frame to **300**.

## What to capture
| Time | Action |
|------|--------|
| 0–3 s | Camera orbiting the full attractor — show cobalt (normal polarity) and amber (reversed polarity) lobes clearly |
| 3–8 s | Run `record.py` from Scripting workspace OR press **Space** in the timeline to play the animation |
| 8–10 s | Pause on frame 160 (SK_HighFriction morph) — show the tighter reversal pattern |

## After recording
Rename the file to `screen.mp4` and place it next to `viewport.mp4` in  
`public/library/videos/scripting/python-numpy-rikitake-two-disc-dynamo-geomagnetic-reversal-bullard-chaos-bishop-tube-poi-webxr/`.

## Tips
- The attractor is small (≈ 0.082 m radius).  Press **numpad .** with the object selected to frame it.  
- If the bloom looks blown out, reduce `eevee.bloom_intensity` to 0.15 in `record.py`.  
- The shape-key animation is subtle — zoom in to see the topology change between normal (μ = 2) and high-friction (μ = 3) regimes.
