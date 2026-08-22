# Screen Recording Notes — Bunimovich Stadium Billiard Poi Disc

**Target file:** `public/library/videos/scripting/python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr/screen.mp4`

## Software

- **OBS Studio** (recommended) or Windows Game Bar (`Win + G`) or QuickTime (macOS)

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no system audio) |
| Output format | MP4 (H.264) |
| Bitrate | 6000 kbps |

## What to record (≈ 90–120 seconds)

### Step 1 — Open the script (10 s)
Open Blender 5.1. Switch to the **Scripting** workspace. Open `blueprint.py` from the File browser.  Scroll through it so the mathematical docstring is visible.

### Step 2 — Run the simulation (15 s)
Press the **▶ Run Script** button.  Switch to 3D Viewport while the script executes.  After completion, orbit-rotate around the disc with Middle Mouse to show its flatness (stadium ergodicity = uniform density → nearly flat disc).

### Step 3 — Shape key morph (25 s)
Open the **Properties** panel → **Object Data** → **Shape Keys**.  With the disc selected, drag the `SK_Circle` slider from 0 to 1.  The disc surface lifts into five concentric rings of spikes — the 9-, 7-, 5-, 4- and 3-gon inscribed orbits.  Pan to show the 5-fold symmetry from above.

### Step 4 — Colour explanation (20 s)
Reset `SK_Circle` to 0.  Switch viewport shading to **Rendered** (Eevee).  Point out cobalt areas (rarely visited stadium phase-space regions near the caps) versus amber peaks (frequently visited segments near the flat walls).

### Step 5 — Blueprint walkthrough (30 s)
Switch back to **Scripting** workspace.  Scroll through the code:
- `_step()` — specular reflection law, Birkhoff p = −dot
- `_arc()` — normalised arc-length formula
- `_stadium_pts()` / `_circle_pts()` — two contrasting simulations
- `_density()` — 2D histogram → normalised float array

## Quick Checklist Before Recording
- [ ] Blender 5.1 open, theme set to **Dark**
- [ ] Script loaded in Text Editor
- [ ] OBS Source set to Blender window
- [ ] Test recording 5 seconds to confirm audio is off
