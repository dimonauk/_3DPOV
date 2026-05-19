# Screen-recording notes — UV Unwrapping for Low-Poly Stylised Meshes

OBS / Game Bar instructions for `screen.mp4`.

---

## Session goal

Show the operator working in Blender 5.1 to UV-unwrap a low-poly gem:

1. Starting with an unwrapped mesh (the gem from blueprint.py).
2. Entering Edit Mode and placing seams by hand.
3. Running Unwrap (U → Unwrap).
4. Inspecting the UV Editor alongside the 3D view.
5. Running Pack Islands.
6. Applying a checker material to verify the layout.

Target: `public/library/videos/uv-mapping/uv-unwrap-low-poly-stylised/screen.mp4`

---

## OBS setup

| Setting | Value |
|---|---|
| Capture source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264, CRF 22 |
| Audio | disabled |
| Output format | MP4 |

Keep the UV Editor open in a split view alongside the 3D viewport throughout.
The dual-panel view is the money shot — 3D mesh on the left, UV islands
updating live on the right.

---

## Shot list

| # | Action | Blender shortcut / path | Notes |
|---|---|---|---|
| 1 | Open `uv_low_poly_demo.blend` | File → Open | The file has the gem already |
| 2 | Switch to Material Preview | Z → Material Preview | The checker pattern becomes visible |
| 3 | Tab into Edit Mode | Tab | All faces selected |
| 4 | Deselect all | Alt+A | Nothing selected |
| 5 | Select one face | Left-click | Pick a square face |
| 6 | Select linked flat faces | Shift+G → Face Angle | Selects all faces at a similar angle — a quick group-select |
| 7 | Mark seam on the boundary edges | Ctrl+E → Mark Seam | Highlight seam edges in the 3D view before running unwrap |
| 8 | Clear all and re-do with the auto-seam approach | Alt+A, then Ctrl+E → Clear Seam, then use Select → All by Trait → Sharp Edges, then Ctrl+E → Mark Seam | Demonstrates the sharp-edge seam strategy |
| 9 | Select all | A | All faces selected |
| 10 | Unwrap | U → Unwrap | Islands appear in the UV Editor |
| 11 | Pack Islands | UV menu (top of UV Editor) → Pack Islands | Watch islands rearrange |
| 12 | Inspect checker | Look at 3D viewport in Material Preview | Zoom into a face; confirm checker is uniform |
| 13 | Show a badly-stretched case | Select one face, scale its UV island (S key in UV Editor) | Checker becomes rectangular — the wrong result |
| 14 | Undo the bad case | Ctrl+Z | Back to correct layout |

---

## Timing

- Aim for 2–3 minutes total.
- Pause 2 s each at: the first seam marked, the post-Unwrap island view, the
  final packed+checker-verified state. These are thumbnail candidates.
- The dual 3D/UV panel is the persistent visual anchor; keep it on screen
  the whole time.

---

## Post tips

- Add a text overlay: "Seam → Unwrap → Pack → Verify" as a 4-step
  progress bar across the top.
- If adding voiceover: use the shot list captions as the script skeleton.
