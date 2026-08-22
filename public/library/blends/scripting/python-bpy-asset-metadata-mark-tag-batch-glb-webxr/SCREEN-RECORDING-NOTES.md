# Screen Recording Notes — Asset Metadata Tag & Batch GLB Export

**Target file:** `public/library/videos/scripting/python-bpy-asset-metadata-mark-tag-batch-glb-webxr/screen.mp4`

## Setup

| Setting | Value |
|---------|-------|
| Capture source | Blender window (window capture, not display capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264, CRF 23 |

**OBS:** Sources → + → Window Capture → select "Blender" → Output → Recording Path → `public/library/videos/scripting/python-bpy-asset-metadata-mark-tag-batch-glb-webxr/`

## What to capture

### Part 1 — Run the script (≈ 45 seconds)

1. Open Blender 5.1 with a blank General scene.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` via Text Editor → Open.
4. Press **Run Script** (▶). Pause briefly on the console output showing the three exported GLB paths.
5. Switch to the **3D Viewport** (`1` on the numpad for front ortho). All four objects should be visible — the three coloured WebXR props and the grey wire-frame render-only cube.

### Part 2 — Asset Browser inspection (≈ 30 seconds)

1. Split the viewport and open an **Asset Browser** panel.
2. Switch to **Current File** in the drop-down.
3. Show all four assets listed with their icons.
4. Click **hf_crate_a** — its Description and Tags should appear in the sidebar (webxr, low-poly, holoflow).
5. Click **hf_hero_block** — tags show render, hero, holoflow (no webxr).

### Part 3 — Inspect exported GLBs (≈ 20 seconds)

1. Open a **File Browser** inside Blender and navigate to the directory where `blueprint.py` lives.
2. Show the three `.glb` files (`hf_crate_a.glb`, `hf_lantern_b.glb`, `hf_spike_c.glb`) and `asset_manifest.json` present; `hf_hero_block.glb` should be absent.
3. Open `asset_manifest.json` in a text editor overlay to show the exported array.

## Edit notes

Trim any system notifications or window-focus flicker. Keep total runtime under 100 seconds. No music; ambient keyboard audio is fine.
