# Screen-Recording Notes
## GN Distribute Points on Faces — Poisson-Disk Terrain Scatter

**Target file:** `public/library/videos/geometry-nodes/gn-distribute-points-on-faces-poisson-disk-terrain-scatter/screen.mp4`

---

### OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary track needed) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

### What to record (in order)

1. **Open a new Blender file.** Show the default cube in the 3D Viewport.

2. **Run blueprint.py via Scripting workspace.**
   - New Text → paste blueprint.py → Run Script.
   - Camera perspective: hold Numpad 5 to toggle ortho/persp, use Numpad 0 for camera view.
   - Let the viewer see the terrain appear with scatter rocks.

3. **Inspect the Geometry Nodes modifier.**
   - Select the terrain. Go to Properties → Modifier stack → click HS_Scatter.
   - Show the Min Distance / Density Max / Seed parameters in the modifier panel.
   - Change Seed value (42 → 7 → 99) to show the scatter re-randomising in real time.

4. **Open the Geometry Nodes editor (Shift-F3 or via top header).**
   - Navigate around the tree. Hover over Distribute Points on Faces node.
   - Zoom into the Selection feed (slope mask path: Normal → Separate XYZ → Compare).
   - Zoom into the variant picker (Index → Modulo → IndexSwitch).

5. **Change Density Max to 0 in the modifier panel.**
   - Show the terrain with zero rocks. Then drag back up to 8.
   - This illustrates the density control clearly.

6. **Shade / viewport shading.**
   - Switch to Material Preview (Z → Material Preview or hold Z, choose).
   - Orbit around the terrain: Middle-Mouse drag.
   - Show a steep cliff face edge — confirm no rocks spawn on vertical faces.

7. **GLB export.**
   - File → Export → glTF 2.0.
   - Show the export dialog: Apply Modifiers ON, Draco compression ON.
   - Click Export glTF 2.0.

**Total target duration:** 8–12 minutes of useful material (trim in Blender VSE or DaVinci Resolve).

---

### Post-production (Blender VSE)

- Cut: remove any pauses longer than 3 seconds.
- Speed ramp: 1.5× on the GN tree navigation sections.
- Titles: add a lower-third text strip at the start: `Blender 5.1 — Distribute Points on Faces (Poisson Disk)`.
- Export: File → Render → Render Animation → output to `screen.mp4`.
