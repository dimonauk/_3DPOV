# Screen Recording Notes
## GN Collection Info + Pick Instance — Multi-Asset Scatter

**Target file:** `public/library/videos/geometry-nodes/gn-collection-info-pick-instance-asset-scatter/screen.mp4`

---

### Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 / Xbox Game Bar | Window Capture → **Blender 5.1** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no desktop audio) |
| Output format | MP4 / H.264, CRF 18 |

---

### Scene state before recording

1. Run `blueprint.py` (Scripting workspace → Alt+P).
2. Switch to **Geometry Nodes** workspace so both the 3D Viewport and the GN
   node editor are visible simultaneously (split horizontally — viewport top,
   node editor bottom).
3. Select `ground_scatter` so the `HF_CollectionScatter` modifier node tree
   is active in the node editor.
4. In Viewport overlays, enable **Statistics** (shows instance count live).
5. Set 3D Viewport shading to **Solid** with **Cavity** on (Viewport Overlays
   → Cavity → World Space, Strength 0.25) — this makes flat-shaded facets
   pop without requiring a render.
6. In the modifier panel, confirm Seed = 42, Min Distance = 0.55.

---

### Recording sequence (≈ 3 min screen time)

| Segment | Duration | Action |
|---------|----------|--------|
| **A — Node tree walkthrough** | 60 s | Pan through the GN tree slowly: Group Input → Distribute Points → Collection Info → Instance on Points (highlight Pick Instance = True and Instance Index random node) → Rotate → Scale → Realize → Group Output.  Pause 2 s on each node with the mouse tooltip visible. |
| **B — Live Seed scrub** | 30 s | In the modifier panel, drag the **Seed** slider from 0 to 150 slowly.  The scatter pattern reshuffles completely each integer step.  Pause at a well-distributed value. |
| **C — Min Distance scrub** | 30 s | Drag **Min Distance** from 1.0 down to 0.20.  Watch the point count climb in Statistics.  Return to 0.55. |
| **D — Outliner + collection** | 20 s | Switch focus to the Outliner, expand `scatter_kit` collection to show `rock_a`, `crystal_b`, `pebble_c`, `mushroom_d`.  Click each to select it — observe the prop in the viewport. |
| **E — Viewport orbit** | 30 s | Middle-mouse orbit the scene.  Show from above (flat plan view), then from eye level to reveal scale variation. |
| **F — Viewport render preview** | 30 s | Switch shading to **Rendered** (EEVEE).  Orbit gently.  Return to Solid. |

---

### Post-processing (optional, DaVinci Resolve / Kdenlive)

- Cut segment transitions where mouse leaves Blender window.
- Add lower-third text overlay for each segment label (A–F).
- No colour grade needed; EEVEE solid mode is already styled.
- Export: H.264, 30 fps, 1920×1080, bitrate ~8 Mbps.
