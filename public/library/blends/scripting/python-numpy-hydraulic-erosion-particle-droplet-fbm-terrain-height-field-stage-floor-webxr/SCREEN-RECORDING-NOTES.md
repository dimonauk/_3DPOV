# Screen Recording Notes — Hydraulic Erosion Terrain

**Output target:** `public/library/videos/scripting/python-numpy-hydraulic-erosion-particle-droplet-fbm-terrain-height-field-stage-floor-webxr/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Encoder | x264 / H.264 |
| Bitrate | 8 000 kbps |
| Output format | MP4 |

## What to Record

### Step 1 — Open Blender, load/run blueprint.py
- Open Blender 5.1, new General project.
- Open the Scripting workspace tab.
- Open `blueprint.py` from Text Editor → Open.
- **RUN** the script (Alt+P or Run Script button).
- Camera view: show the generated terrain mesh with the Solid viewport
  shaded by vertex colours (toggle with the colour sphere in the viewport
  header → Attribute / Vertex Attribute → `Erosion_Depth`).

### Step 2 — Inspect shape keys
- Select the `hydraulic_erosion_floor` object.
- Open the Properties panel → Object Data Properties → Shape Keys.
- Manually slide the `SK_Eroded` value from 0 → 1.  Pause to show the
  terrain changing from raw FBM to river-carved valleys.
- Then slide `SK_Rivers` to 1 (extreme erosion).
- Reset and slide `SK_Deposition` to 1 (softer alluvial fans).
- Reset all to 0.

### Step 3 — Show erosion depth colour
- In the Viewport, change colour mode to Attribute → `Erosion_Depth`.
- Orbit the camera to show the colour field: red river channels, white
  plateaux, blue alluvial fans.

### Step 4 — Run record.py
- Open `record.py` in the Text Editor.
- Run the script.
- Hit F12 (Render Animation) to produce `viewport.mp4`.
  This step need not be recorded; cut here.

## Duration Target
8–12 minutes total screen recording.  Tutorial voice-over can be added
in the video-editing step using Blender VSE or DaVinci Resolve.

## Tips
- Before recording, collapse all other panels to focus on the 3D viewport
  and properties.
- Annotate key moments in OBS timeline for easier editing later.
- If script execution is slow (FBM loop), warn viewers; comment out
  `N_DROPS_RIVERS` large pass or reduce `GRID_N` to 64 for a live demo.
