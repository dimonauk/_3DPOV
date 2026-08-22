# Screen-Recording Notes — Hook Modifier Earring

## Goal

Capture `screen.mp4`: a 60-second tutorial walkthrough showing the Hook modifier
panel, both Empty pivots in the 3D viewport, and the pendulum playback.

## Software

- OBS Studio (≥ 30.x), CQP 18, H.264, 1920 × 1080, 30 fps
- Audio: commentator mic, noise gate −32 dB

## Scene setup before recording

```bash
blender --background --python blueprint.py
blender hf_hook_earring.blend
```

Open Blender with the generated file so the modifier stack and empties are live.

## Shot list

| # | Action | Duration |
|---|---|---|
| 1 | Viewport: tumble around earring, show gold facets | 8 s |
| 2 | Properties → Modifier tab → expand HK_hk_upper | 10 s |
| 3 | Highlight `Object`, `Vertex Group`, `Falloff Radius`, `Force` fields | 12 s |
| 4 | Select `hk_upper_pivot` Empty; show gizmo in viewport | 8 s |
| 5 | Press Space — play pendulum animation | 10 s |
| 6 | Open Spreadsheet editor; show vertex-group weights | 7 s |
| 7 | Open terminal; show `blueprint.py` bind_hook() function | 5 s |

## OBS scene

- Source 1: Display Capture (Blender window)
- Source 2: Mic capture
- Filters: Gain +3 dB, Noise Gate −32 dB threshold

## Export

File → Remux Recording → output `screen.mp4` (MP4, H.264, AAC)
Place at `public/library/videos/scripting/python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr/screen.mp4`
