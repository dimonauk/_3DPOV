# Screen Recording Notes — GN Curve Arc Dial Gauge

Target file: `public/library/videos/geometry-nodes/gn-curve-arc-dial-gauge-webxr-hud/screen.mp4`

## Software

- **OBS Studio** (free, obsproject.com) or Windows Game Bar (Win+G)
- **Blender 5.1** open with `blueprint.py` already run (gauge visible in viewport)

## OBS Setup

1. Source → Window Capture → select the Blender window.
2. Set canvas to **1920 × 1080**.
3. Output → Recording: MP4, H.264, CRF 18, **30 fps**.
4. Audio: **off** (no voiceover yet; music layer added in VSE).

## What to Record

### Part A — Node tree walkthrough (~90 s)

1. Open the Geometry Nodes editor with `GN_DialGauge` selected.
2. Pan to the **Curve Arc (ring arc)** node. Hover over each socket:
   - Resolution → 64 (smooth ring)
   - Start Angle / End Angle → 0 / 2π (full circle)
3. Pan to the **Curve Arc (sector arc)**. Highlight:
   - **Connect Center = True** — the pie-slice formation
   - End Angle socket wired from the Math → Add chain
4. Pan to the **Set Spline Cyclic** node. Show the Cyclic = True input.
5. Pan to **Fill Curve** and **Extrude Mesh**.
6. Pan to the **tick arc** → Resample Curve → Instance on Points chain.

### Part B — Live value change (~60 s)

1. Switch to the Properties panel → Modifier → GN_DialGauge.
2. Drag the **Value** slider slowly from 0.00 to 1.00.
3. The green sector should sweep in real time. Record for ~20 s.
4. Set Value back to 0.65 (the resting reading).

### Part C — Viewport render preview (~30 s)

1. Switch viewport to **Rendered** mode (Z → Rendered).
2. Orbit slowly around the gauge for 15 s showing the emission materials.
3. Press record.py in a Text Editor panel to show the export happening
   (optional — skip if uncomfortable running scripts live).

## File Naming

Save the recording as `screen.mp4` in:
`public/library/videos/geometry-nodes/gn-curve-arc-dial-gauge-webxr-hud/`

Do **not** commit `.mp4` files — the `.gitignore` excludes them.
The directory structure is committed; binary video files are local only.
