# SCREEN-RECORDING-NOTES — Crystal Antenna Repeat Zone

**Output file:** `public/library/videos/geometry-nodes/gn-repeat-zone-crystal-antenna-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent tutorial) |
| Output | MP4, H.264 High, ~8 Mbps |

## What to record (approx. 90 seconds)

### Part 1 — Repeat Zone anatomy (0-25 s)
1. Open `crystal_antenna.blend`, go to Geometry Node editor.
2. Pan to the Repeat Input and Repeat Output nodes.  Pause for 3 s to show their paired relationship — point out the `Accum`, `Tips`, and `Scale` item sockets on both nodes.
3. Zoom into the `Iterations` input on the Repeat Input node.

### Part 2 — Live iteration scrub (25-55 s)
4. Switch to the Properties panel → Modifier tab → show the `Iterations` slider.
5. Slowly drag Iterations from **1 to 5** — the tree grows generation by generation in the 3D viewport.  Pause at 2, 3, 4, 5 to let each generation settle.
6. Pan the viewport slightly to show 3-way symmetry.

### Part 3 — Inside the zone body (55-80 s)
7. Back in the GN editor, zoom into the body (between Input and Output nodes).
8. Highlight the CurveLine → CurveToMesh → InstanceOnPoints chain for one direction.
9. Select the Viewer node on `rpt_in.outputs['Tips']` to show the tip point cloud growing.

### Part 4 — Export (80-90 s)
10. File → Export → glTF 2.0.  Tick **Apply Modifiers** and **Draco compression level 6**.
11. Show the resulting `.glb` file size in the OS file browser (~80-120 KB).

## Tips
- Use the `N` panel → View → Focal Length 50 mm for a natural perspective.
- `Alt+H` to unhide everything before recording.
- Press `Numpad 5` to toggle orthographic off (keep perspective for depth clarity).
- Disable `Overlays → Statistics` overlay to keep the UI clean.
