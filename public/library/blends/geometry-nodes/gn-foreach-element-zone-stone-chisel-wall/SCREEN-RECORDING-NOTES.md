# Screen Recording Notes — GN Foreach Element Zone Ashlar Wall

Target file: `public/library/videos/geometry-nodes/gn-foreach-element-zone-stone-chisel-wall/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Scene | Blender Viewport |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | Disabled (no mic, no desktop audio) |
| Output format | MP4 / H.264 / CRF 18 |

## What to Record (approx. 8–12 minutes)

### Part 1 — The Problem (2 min)

1. Open a new Blender file. Add a Plane, add a Geometry Nodes modifier.
2. In the GN editor, try building a per-face unique stone wall with field nodes
   only (Distribute Points on Faces + Instance on Points + Random scale).
3. Demonstrate why this breaks: all stones share the same scale field — you
   can't vary the stone's *polygon count* or *topology* per face.
4. Verbalise: "Field-based GN evaluates the same graph for every element
   simultaneously. To build different geometry per element, we need the
   Foreach Element Zone."

### Part 2 — Node Tree Build (6–8 min)

Work through the tree in blueprint.py order:

1. **Grid** → show GRID_X/GRID_Y and the resulting face layout.
2. **Capture Attribute (face centre)** — set Domain to Face, explain that
   Position evaluated at Face domain = centroid. Highlight the Attribute output.
3. **FunctionNodeRandomValue + Capture** — point out the Seed socket, drag
   it to vary the pattern live.
4. **Foreach Element Input** — set Domain to Face. Explain: "The zone runs
   once per face; Element Index counts up from 0."
5. **Sample Index** (×2) — show connecting Element Index → Index, zone geometry
   → Geometry, captured Attribute → Value. Compare to Sample Nearest (which
   searches spatially) vs Sample Index (which reads at an explicit index).
6. **Math chain** — depth, jitter, stone X/Y/Z.
7. **Mesh Box + Set Position** — note the CombineXYZ for size; explain the
   Z-offset = depth/2 to back-flush stones to the grid plane.
8. **Foreach Output → Set Material**.
9. Change Seed: show 4–5 different stone patterns appearing instantly.
10. Change Depth Max from 0.0 → 0.12: show depth variation building up.

### Part 3 — Export (1 min)

1. File → Export → glTF 2.0.
2. Enable Apply Modifiers, Draco compression level 6, Y-up.
3. Show the resulting GLB file size (expect 40–80 KB for 48 stones).

## Editing Notes

- Cut the initial false-start before recording the correct approach.
- Pause recording when looking up node names.
- Add a title card: "GN Foreach Element Zone | Blender 5.1 | Holoflow Studio".
- Export at 1920 × 1080, H.264, CRF 18, no audio track.
