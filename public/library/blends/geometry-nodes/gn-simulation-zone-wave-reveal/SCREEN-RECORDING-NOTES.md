# Screen Recording Notes — GN Simulation Zone Wave Reveal

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-wave-reveal/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264, CRF 23) |

## Shot list

### Shot 1 — File open and scene overview (0:00 – 0:10)

1. Open `wave_reveal_grid.blend`.
2. Camera is set; viewport shows the flat grid lit by the sun lamp.
3. In the viewport header, switch to **EEVEE Next** render mode (press `Z` → Rendered).
4. Pause so the viewer can see the dark grid. All vertices inactive, material is near-black.

### Shot 2 — Play the timeline (0:10 – 0:40)

1. Press `Space` to play the animation.
2. The wave expands from the centre — navy/cobalt ring advancing outward.
3. Let it play to at least frame 90 so the cyan-white outer ring is visible.
4. Press `Space` to stop.

### Shot 3 — GN modifier inspector (0:40 – 1:00)

1. Select the grid object. Open the **Properties → Modifier** panel.
2. Show `HoloflowGNWaveReveal` is the only modifier; click the node-tree icon to open the editor.
3. Pan around the tree: show `SimulationInput → [body] → SimulationOutput`.
4. Zoom into the Switch pair (inner + outer) to show the conditional logic.

### Shot 4 — State items panel (1:00 – 1:15)

1. Click the **Simulation Output** node to select it.
2. In the **N-panel** (press `N` in the Node Editor) → **Item** tab, show the two state
   items: `Geometry` and `Radius`.
3. Hover over the `Radius` output socket to show the tooltip listing its type.

### Shot 5 — Attribute viewer (1:15 – 1:30)

1. Scrub the timeline to frame 45.
2. Open the **Spreadsheet Editor** (drag a new area → Spreadsheet).
3. Select the grid object; under **Object Data** → **Attribute** mode, show `wave_time`
   column — half the vertices show 0.0 (inactive), the activated half show non-zero floats.

### Shot 6 — Outro (1:30 – 1:40)

1. Return to timeline frame 1 and press `Space` for a final full-reveal pass.
2. Stop at frame 90 so the bright cyan outer ring fills the frame.
