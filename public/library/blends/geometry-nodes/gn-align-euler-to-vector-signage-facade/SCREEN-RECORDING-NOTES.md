# Screen Recording Notes
## GN Align Euler to Vector — Signage Façade
### Holoflow Studio · Blender 5.1

**Capture target**: `screen.mp4`
**Destination**: `public/library/videos/geometry-nodes/gn-align-euler-to-vector-signage-facade/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF |
| Output format | MP4 (H.264) |

---

## Recording sequence

### Segment 1 — Demonstrate the confusion (1 min)
1. Open `signage_facade.blend` after running `blueprint.py`.
2. In the GN editor, locate `Align Euler to Vector`. Show the `axis` property set to `Y`.
3. **Change axis to Z** — in viewport, the panels now stand perpendicular to the façade
   (local +Z = face normal → panels point away from the wall like spikes). Wrong.
4. **Change back to Y** — panels snap flat against the façade correctly.
5. Narrate: *"The axis property picks which local arm of the instance is aimed at the
   target vector. Get it wrong and you get spikes. Get it right and you get panels."*

### Segment 2 — Factor reveal animation (30 s)
1. With axis=Y, set Factor to 0. All panels are unrotated (default +Y = world +Y).
2. Scrub Factor from 0 → 1 slowly via the node socket slider.
3. Watch panels rotate individually to match their respective face normals.
4. Pause at Factor = 0.5 to show the partial-alignment state.

### Segment 3 — pivot_axis difference (45 s)
1. Set pivot_axis to `AUTO`. Panels look the same on a vertical cylinder.
2. Tilt the cylinder 45° (S X 0.8 or rotate X 30°) to simulate sloped terrain.
3. **With pivot=Z**: panels at the top cap face flip and gimbal-lock as the normal
   approaches world +Z. Show the problem.
4. **With pivot=AUTO**: panels stay upright at any slope. No flip.
5. Undo the cylinder tilt (Ctrl+Z). Set pivot back to Z for the final export.

### Segment 4 — Spreadsheet (30 s)
1. Open the Spreadsheet editor (top bar → Spreadsheet icon).
2. Select `Instances` domain. Show the per-instance rotation values changing
   as you rotate the viewport camera (not moving, just confirming they vary by face).
3. Switch to `Points` domain — each distributed point has a position. Relate
   normal vector values to the rotation you see in the viewport.

### Segment 5 — GLB export (15 s)
Open the terminal / Info header. Show the GLB export operator completing.
Briefly mention `export_apply=True` bakes the modifier before export.

---

## Narration cues
- "FunctionNodeAlignEulerToVector — one of the most useful GN nodes nobody teaches."
- "axis tells it WHICH arm of your instance to point at the vector."
- "pivot_axis controls how the instance rolls around that arm — AUTO is safest for terrain."
- "Factor lets you animate the snap — great for reveal sequences in WebXR."
