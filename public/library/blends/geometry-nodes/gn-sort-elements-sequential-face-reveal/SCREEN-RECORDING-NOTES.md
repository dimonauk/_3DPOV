# Screen Recording Notes — GN Sort Elements: Sequential Face Reveal

Target file: `public/library/videos/geometry-nodes/gn-sort-elements-sequential-face-reveal/screen.mp4`

## Software

- **OBS Studio** or Windows Game Bar (`Win + G`)
- Blender 5.1 with `sequential_face_reveal.blend` open
- Output: 1920 × 1080, 30 fps, no audio

## OBS Setup

1. **Add Source → Window Capture** → select Blender
2. **Output**: MP4, x264, 8000 kbps, 30 fps
3. **Save to**: `public/library/videos/geometry-nodes/gn-sort-elements-sequential-face-reveal/screen.mp4`

## Blender Window Layout

### Left 65% — 3D Viewport
- **Shading**: Material Preview or Rendered (EEVEE Next)
- **View**: Front perspective, slight right-up angle (`Numpad 1`, orbit slightly)
- Camera looking at the sphere from front-right so the bottom-to-top unfurl is readable

### Right 35% — Geometry Nodes Editor
- Open `GN_SortElements_SequentialReveal` node group
- Sort Elements node clearly visible — show its domain='FACE' and Sort Weight input

## Recording Flow (approx. 90 seconds)

1. **[0:00 – 0:10]** Start at frame 1. The sphere is completely dark (navy) — no faces
   have activated yet. Point out the Sort Elements node in the GN editor.

2. **[0:10 – 0:25]** In the GN editor, explain Sort Elements: its FACE domain
   setting, the Sort Weight = InputPosition.Z (centroid Z), and how face index 0
   will be the bottommost face after sorting.

3. **[0:25 – 0:55]** Scrub the timeline from frame 1 to frame 70 in the 3D viewport.
   The faces peel outward in strict bottom-to-top order: first the very bottom triangles
   glow cyan and extrude, then progressively higher ones follow. Pause at frames 20, 40,
   60 to show the activation front.

4. **[0:55 – 1:15]** Scrub from frame 70 to frame 130 to show the top third of the
   sphere completing the reveal. The fully revealed sphere is a faceted glowing form
   with all faces extruded, bright cyan at the top, slightly less so at the bottom
   (which activated earlier and holds the same white endpoint).

5. **[1:15 – 1:30]** Open Blender Spreadsheet editor, select Face domain. Show the
   'face_t' float column: bottom faces show 1.0, mid faces show values between 0 and 1
   (at frame 70), top faces show 0.0. This is the clearest evidence of the Sort
   Elements rank-based activation.

## After Recording

Trim to 60–90 seconds. Save to the target path above.
