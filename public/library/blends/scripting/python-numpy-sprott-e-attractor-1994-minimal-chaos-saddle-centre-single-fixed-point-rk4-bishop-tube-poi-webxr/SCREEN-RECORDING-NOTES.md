# Screen Recording Notes — Sprott E Attractor

## Target file
`public/library/videos/scripting/python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar settings
| Setting | Value |
|---|---|
| Window source | Blender 5.1 (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration for silent library clips) |
| Encoder | x264 or NVENC H.264 |
| Output format | MP4 |
| Bitrate | 6000–8000 kbps |

## What to record (5–8 minutes)

### 1. Open a fresh Blender scene (30 s)
- `File → New → General`
- Delete the default cube (`X → Delete`)

### 2. Paste and run blueprint.py (2–3 min)
- Open the Scripting workspace
- Create a new text block, paste the full contents of `blueprint.py`
- Click **Run Script**
- Let it integrate (30–60 s with numpy, no visible progress)
- Once done: switch to 3D Viewport to see the tube appear

### 3. Inspect the result (1 min)
- Press `Numpad 5` (ortho) then rotate to get a side view of the ribbon
- Press `Z → Material Preview` to see the cobalt-amber gradient
- In **Properties → Object Data → Shape Keys**, step through Basis / SK_Loose /
  SK_Tight / SK_Wide — observe the tube widening and tightening as α changes
- Note the single fixed point (mark it with a tiny empty at (0.25, 0.0625, 0)
  if desired)

### 4. GLB export (1 min)
- `File → Export → glTF 2.0 (.glb)`
- Check **Apply Modifiers**, **+Y Up**, **Draco Compression level 6**,
  **WebP** textures
- Name: `hf_sprott_e_poi.glb`

### 5. Highlight the eigenvalue structure (optional — good for voice-over)
- Add a text object reading "P = (1/α, 1/α², 0)"
- Add a second text "λ = −1, ±i/√α"
- Place them floating near the attractor in viewport

## Tips
- Run `record.py` for the automated viewport.mp4 before this screen recording —
  having both clips lets you edit a side-by-side comparison.
- If Blender freezes on first run, the integration is still going: wait for the
  Python console to print `[SprottE] OK`.
- The attractor fits inside a ≈0.10 m sphere after scale_to_poi(); zoom to
  ~0.2 m distance for a comfortable view.
