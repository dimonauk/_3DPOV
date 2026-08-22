# Screen Recording Notes — DLA Dendritic Crystal

## Setup before recording

1. Open Blender 5.1.
2. New General file → delete default cube.
3. Open **Scripting** workspace tab.
4. Load `blueprint.py` → click **Run Script**.
5. Wait for console: `[DLA] GLB exported → //hf_dla_crystal.glb`  
   (≈ 20–60 s depending on machine; 600-point DLA with numpy is CPU-only).
6. Switch to **Layout** workspace.
7. Press **Numpad 0** → camera view.
8. Press **Space** to confirm the animation plays (crystal grows frame 1 → 120).

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Capture source | Window capture — **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary needed for b-roll) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` |

## What to capture

| Clip segment | Duration | What to show |
|---|---|---|
| Script run | 0:00 – 0:15 | Scripting workspace; highlight the `run_dla()` loop and the `_add_gn_modifier()` call; then hit Run Script |
| Console output | 0:15 – 0:25 | Console panel showing `[DLA] Running …` and the final extent line |
| Layout playback | 0:25 – 2:05 | Camera-view playback from frame 1 to 120 — crystal growing |
| Final crystal rotation | 2:05 – 2:30 | Middle-mouse orbit around the finished aggregate |
| Shader ball | 2:30 – 2:45 | Click `hf_dla_bead` → Material Preview mode → show emission glow |

## Editing notes (for VSE tutorial export)

- Trim the script-run clip to remove idle time between keystrokes.
- Add a simple white-text lower-third at the crystal playback segment:  
  `"DLA: 600 particles · fractal dimension ≈ 1.71"`
- No voiceover needed for b-roll; add ambient synth drone in post.
- Export at H.264 CRF 18, 1920 × 1080, for the library `screen.mp4`.

## Troubleshooting

- **Viewport playback is choppy**: set **Viewport Shading → Material Preview**  
  (not Rendered) and ensure playback syncs to audio (`Playback → Sync` set to  
  `Frame Dropping`).
- **Bloom not visible**: confirm EEVEE Next is the active engine in  
  `Properties → Render → Render Engine`.  In Blender 5.1 EEVEE Next, bloom is  
  under `Render Properties → Bloom`.
- **Crystal doesn't grow**: the GN modifier compares the `appear_frame` INT  
  attribute to `Scene Time → Frame`.  Select `hf_dla_aggregate`, open Geometry  
  Node editor, confirm the `Scene Time` node is present and linked to the  
  `Compare` node's B socket.
