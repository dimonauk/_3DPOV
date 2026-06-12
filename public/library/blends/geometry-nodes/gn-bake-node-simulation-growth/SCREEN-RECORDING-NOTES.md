# Screen Recording Notes — GN Bake Node: Crystal Spread

**Target file:** `public/library/videos/geometry-nodes/gn-bake-node-simulation-growth/screen.mp4`

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio 30+ or Windows Game Bar (Win+G) |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary needed for library) |
| Output format | MP4 / H.264 |

## Pre-recording checklist

- [ ] Run `blueprint.py` — scene is built, sphere has GN modifier
- [ ] Switch to **Layout** workspace
- [ ] Set 3D Viewport shading to **Rendered** (Z → Rendered, or sphere icon)
- [ ] Timeline: frame range 1–60 visible at bottom
- [ ] Press **Space** once to verify animation plays (simulation evaluates live)
- [ ] Press **Home** to return to frame 1
- [ ] Collapse Properties panel (N key) to give sphere more screen space

## Recording sequence (≈ 90 seconds total)

### Part 1 — Live simulation playback (20 s)
1. Press **Space** — play animation from frame 1
2. Let it run to frame 60 (watch sphere turn cyan from top down)
3. Press **Space** to pause at frame 60
4. Drag timeline back to frame 1 — notice the pause as simulation re-evaluates

### Part 2 — Properties panel walkthrough (30 s)
1. Click on the sphere
2. Open **Properties › Modifier** (wrench icon)
3. Expand the `CrystalSpreadBake` modifier
4. Scroll to the **Bake** section (shows the Bake node item)
5. Hover over the **Bake** button — show tooltip
6. Click **Bake** — progress bar appears while Blender evaluates all 60 frames
7. After bake completes: drag timeline freely — playback is instant

### Part 3 — Node editor overview (20 s)
1. Split viewport: right-click top edge of 3D Viewport → Split Area
2. Change new area to **Shader Editor** (header dropdown → Geometry Node Editor)
3. Show the node tree: GroupInput → StoreNamedAttribute → SimZone → BakeNode → GroupOutput
4. Click the **Bake node** — show its bake path in the node properties sidebar

### Part 4 — Cache files on disk (20 s)
1. Open a File Browser area (or use OS file manager)
2. Navigate to the blend file directory
3. Show `simulation_cache/CrystalSpreadBake/` folder containing `.bnode` files
4. Return to Blender

### Outro (10 s)
1. Return to 3D Viewport Rendered mode
2. Drag timeline back-and-forth rapidly — shows instant seekable playback
3. End recording

## Notes for editing

- Trim any accidental OS notifications from capture
- No audio mixing needed
- Target runtime: 60–90 seconds
- Export as `screen.mp4` at 1080p, H.264, CRF 22
