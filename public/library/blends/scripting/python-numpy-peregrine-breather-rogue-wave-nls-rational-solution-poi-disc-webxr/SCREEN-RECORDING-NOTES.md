# Screen Recording Notes — Peregrine Breather Rogue Wave

## Target file
`public/library/videos/scripting/python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr/screen.mp4`

## Software
OBS Studio (Windows: Game Bar / Xbox Game Bar also works)

## Steps

### 1. Open the blend file
File → Open → `public/library/blends/scripting/python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr/hf_peregrine_poi.blend`

Or run blueprint.py in a fresh Blender 5.1 scene (Scripting editor → Open → blueprint.py → Run Script).

### 2. Set up OBS
- Source: Window Capture → Blender (capture the 3D Viewport)
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: OFF (no commentary track for screen.mp4 — that is overlaid in the tutorial video editor)
- Output format: MP4 / H.264 CRF 18

### 3. Blender viewport settings
- Shading: **Material Preview** (shows vertex colours correctly via EEVEE)
- Overlay: OFF (no grid lines)
- Gizmo: OFF
- Header / toolbar: hide (press T and N to collapse)
- Camera: Numpad 0 — use the Record Cam from record.py, or manually orbit to roughly (0, −1.8, 1.4) looking down at ~52°

### 4. Shape-key demo sequence (approx. 30 seconds)
1. Start at Basis (full landscape). Slowly tumble the viewport so the rogue-wave peak at the centre is visible. (~8 s)
2. Set Shape Keys → SK_Flat to 1.0 gradually. The terrain flattens to a calm sea. (~5 s)
3. Bring SK_Flat back to 0, Basis to 1. Peak re-emerges. (~5 s)
4. Set SK_Perturb to 1.0. Background disappears; only the wave perturbation ridge is visible. (~5 s)
5. Swap to SK_Narrow (t-axis compressed). The ridge becomes a sharp spine. (~4 s)
6. Swap to SK_Wide. Algebraic decay is visible — note the gentle slope far from (0,0). (~4 s)

### 5. Console view (optional extra 10 seconds)
Switch to Scripting editor, show blueprint.py with the core maths visible — the D formula and amp2 computation. Highlight that there are no free parameters.

### 6. Stop recording
- Trim head/tail silence in DaVinci Resolve or ffmpeg
- Crop to 1920×1080 if letterboxed
- Export as MP4 / H.264 ≤ 50 MB

## Key talking points for voice-over
- "Background sea is |Ψ|=1 everywhere — a plane wave."
- "At the origin, amplitude is exactly 3 — no parameter, no tuneable constant."
- "It's rational, not exponential. The wave never fully vanishes at finite distance."
- "This solution predicted rogue waves in theory 30 years before oceanographers could measure them reliably."
