# Screen Recording Notes — Crystal Grotto (GN Realize Instances)

These instructions are for capturing `screen.mp4` — the OBS recording of Blender
that shows the full workflow in real-time.

## OBS Setup

- **Source**: Window Capture → select "Blender 5.1"
- **Resolution**: 1920 × 1080 (match your Blender window)
- **Frame rate**: 30 fps
- **Audio**: Disabled (no narration track needed for the library)
- **Output**: MP4, H264, CRF 18 (high quality, ~100–200 MB for a 10-minute session)
- **Output file**: `public/library/videos/geometry-nodes/gn-realize-instances-crystal-grotto/screen.mp4`

## What to record

1. Open a fresh Blender 5.1 scene (File → New → General).
2. Open the Text Editor, load `blueprint.py`, run it.
3. After the script completes, show the Geometry Nodes editor with the node graph visible.
4. Pan across the node chain: GroupInput → DistributePointsOnFaces → InstanceOnPoints →
   **CaptureAttribute** → **RealizeInstances** → StoreNamedAttribute → SetMaterial → SetShadeSmooth.
5. **Key highlight** (30 seconds): select the CaptureAttribute node, show its properties panel
   (`N` key), point out `domain = INSTANCE` and `data_type = FLOAT`.
6. Switch to Material Preview to show the multicolour crystal grotto.
7. Orbit the viewport (middle-mouse drag) to reveal different crystal colours.
8. Open the Shader Editor and show `ShaderNodeAttribute` reading `crystal_hue`.
9. **Demo the order law** (optional, 1–2 minutes): duplicate the CaptureAttribute node,
   temporarily move it AFTER RealizeInstances, show the result (flat single-colour crystals
   or per-vertex noise), then undo.
10. Show the GLB export dialog (File → Export → glTF 2.0), highlight `Apply Modifiers`
    and `Export Attributes` ticked.

## Timing guide

| Section | Duration |
|---------|---------|
| Setup and script run | 2 min |
| Node graph walkthrough | 3 min |
| Material and shader editor | 2 min |
| Order-law demo (optional) | 2 min |
| GLB export | 1 min |
| **Total** | **~10 min** |

## Notes

- Maximise the Geometry Nodes editor before the walkthrough for readability.
- Use Blender's `Home` key to fit the node graph to screen.
- If the node graph is crowded, split it into two screenshots: the scatter half
  (GroupInput → InstanceOnPoints) and the realization half (CaptureAttribute →
  RealizeInstances → StoreNamedAttribute).
