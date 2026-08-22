# Screen Recording Notes — GN Is Viewport LOD

**Software**: OBS Studio (recommended) or Windows Game Bar (Win+G)
**Resolution**: 1920 × 1080 | **Frame rate**: 30 fps | **Audio**: off

## Goal

Capture two visual states in one recording to demonstrate Is Viewport switching:
1. The **low-poly viewport mesh** (~12 faces) — what the artist sees in SOLID mode
2. The **high-quality render mesh** (192+ faces) — what Cycles and the GLB exporter see

## Setup

1. Open Blender 5.1 and run `blueprint.py`.
2. Set the 3D viewport to **SOLID** shading (Z → Solid).
3. In OBS, add a **Window Capture** source pointed at the Blender main window.
4. Ensure the 3D viewport fills at least half the captured frame.
5. Optionally: drag the Properties, Timeline, and Outliner out of view to maximise the 3D viewport.

## Recording sequence (~30 seconds)

| Time | Action | What viewer sees |
|---|---|---|
| 0–5 s | Orbit the panel in SOLID mode | Low-poly box + inset extrude, snappy response |
| 5–8 s | Open the Geometry Nodes editor, point to the Is Viewport node | Node highlighted |
| 8–15 s | Press Z → **Rendered** (or switch to Rendered shading in header) | Mesh visibly gains surface curvature + micro-displacement detail |
| 15–22 s | Orbit again in Rendered mode | Smooth subdivided surface |
| 22–25 s | Switch back to SOLID | Snaps back to low-poly — immediate |
| 25–30 s | Open Scripting workspace, call `export_glb()` | Terminal prints "Exported render-time mesh" |

## File naming

Save the recording as:
```
public/library/videos/geometry-nodes/gn-is-viewport-render-lod-switch-webxr/screen.mp4
```

Commit the viewport.mp4 (from `record.py`) and screen.mp4 together.

## Tips

- The transition between SOLID and Rendered shading is the key visual moment.
  Slow down the transition deliberately: hover over the shading selector dropdown
  for 2 seconds before clicking so the viewer can see what you're about to do.
- If Cycles is slow, switch the render engine to EEVEE Next temporarily —
  `Is Viewport` works identically in both.
- Annotate the Is Viewport node in the Geometry Nodes editor before recording:
  Ctrl+A to enter annotation mode, draw a circle around the node, and label it.
