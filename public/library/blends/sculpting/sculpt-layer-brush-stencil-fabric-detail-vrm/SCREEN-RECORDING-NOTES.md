# Screen Recording Notes — Layer Brush Stencil Fabric Detail

**Software**: OBS Studio (free) or Windows Game Bar (Win+G)
**Target file**: `public/library/videos/sculpting/sculpt-layer-brush-stencil-fabric-detail-vrm/screen.mp4`

## OBS setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920×1080 |
| FPS | 30 |
| Encoder | H264 (NVENC or x264) |
| Bitrate | 8000 kbps |
| Audio | Disabled (narration added in post via VSE) |

## What to record

1. **Open blueprint.py in Scripting workspace** — show the script loading and the Info bar progress during the Cycles normal bake (30–90 s on CPU). Keep the Properties > Render > Bake panel visible so the viewer sees `Bake From Multires` is ticked.

2. **Switch to Sculpt Mode** — show the Layer brush is pre-selected in the Toolbar (left panel). Hover over the `Height` value in the Tool panel (right N-panel > Tool > Brush Settings) to reveal the tooltip: "Maximum height of a layer brush stroke".

3. **Demonstrate Stencil controls** — hover over the viewport, then:
   - **RMB drag** to reposition the stencil (texture overlay visible on mesh)
   - **Shift+RMB drag** to scale the stencil (zoom in/out on weave frequency)
   - **Ctrl+RMB drag** to rotate (align warp/weft to garment axis)
   Show the stencil texture overlay in the Viewport Display by enabling `Brush > Texture > Show in Viewport`.

4. **Paint a stroke** — drag a long stroke across the torso. Show that a SECOND stroke over the same area adds NO further depth (the floor is already reached). Compare this to the Draw brush by briefly switching to Draw, stroking over the same area, then undoing — the Draw accumulation should be visibly deeper.

5. **Face Set auto-masking** — open Sculpt > Auto-Masking panel, enable `Face Sets`. Assign a Face Set (Ctrl+W in Sculpt Mode) to the upper jacket band, then show that Layer brush strokes stay confined to that zone automatically.

6. **Viewport level ramp** — in Properties > Modifier > Multires, scrub Viewport level 1 → 2 → 3 to reveal the progressive weave detail. At level 1 the fabric reads coarsely; at level 3 individual warp and weft threads are distinguishable.

7. **Run record.py** — switch to Scripting, load record.py, Run Script. Point camera at the terminal / Info bar to show the animation render progress. The output .mp4 lands at the path shown in the script.

## Edit hints

- Cut between brush stroke closeup and full-torso shot at the 4-second mark.
- Add a freeze-frame at the "level ramp" moment to let the detail read.
- Use Blender's VSE or DaVinci Resolve to add a lower-third text overlay: "Layer brush height: 6 mm — no accumulation beyond floor."
