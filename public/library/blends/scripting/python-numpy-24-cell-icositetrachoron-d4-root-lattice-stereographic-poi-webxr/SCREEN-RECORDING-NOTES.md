# Screen Recording Notes — 24-Cell Poi Head

## Target file
`public/library/videos/scripting/python-numpy-24-cell-icositetrachoron-d4-root-lattice-stereographic-poi-webxr/screen.mp4`

## Software
**OBS Studio** (Windows/macOS/Linux) or **Xbox Game Bar** (Windows, Win+G).

## Setup steps

### 1. Open the blend file in Blender 5.1
- File → Open → `hf_24cell_poi.blend`
- Or run `blueprint.py` from the Scripting workspace to generate fresh.

### 2. OBS scene configuration
| Setting | Value |
|---|---|
| Source type | Window Capture → Blender |
| Base canvas | 1920 × 1080 |
| Output scaled | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | None (disabled) |

### 3. Blender viewport setup before recording
1. Set viewport to **Material Preview** or **Rendered** mode (NumPad 5 for ortho off).
2. In the 3D Viewport header, enable **Viewport Shading → Emission** pass (or use Rendered with EEVEE Next).
3. Camera: numpad **0** to enter camera view.
4. Run `record.py` in the Script editor — this will render to file automatically.
5. For a live screen recording instead, press **Space** to play the timeline while OBS captures.

### 4. Capture sequence (live version)
1. Start OBS recording (Ctrl+R or the Record button).
2. In Blender, press **NumPad 0** (camera view).
3. Press **Space** to play the 150-frame orbit (5 s).
4. Press **Space** again at frame 150 to stop.
5. Stop OBS recording.
6. Trim and encode to H.264 MP4, save to the target path above.

### 5. What to show
- Open with a top-down view briefly to show the three concentric shells.
- Then switch to perspective (camera orbit) to show the three-tier nesting.
- Highlight the amber cuboctahedron in the middle between the blue outer cage and
  the green inner tetrahedron-like inner shell.
- Close with a slow zoom out to show the full poi head scale (~14 cm diameter).

### 6. Troubleshooting
| Issue | Fix |
|---|---|
| Emission invisible in viewport | Switch to Rendered mode; enable bloom in EEVEE settings |
| Blue/amber/green flicker | Frame rate mismatch — set OBS to exactly 30 fps |
| Geometry missing | Re-run `blueprint.py`; check Blender console for errors |
