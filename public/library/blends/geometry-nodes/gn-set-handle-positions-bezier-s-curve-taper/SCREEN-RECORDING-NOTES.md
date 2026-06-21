# Screen Recording Notes
## GN Set Handle Positions — Parametric Bezier S-Curve Taper Ribbon

**Output file:** `public/library/videos/geometry-nodes/gn-set-handle-positions-bezier-s-curve-taper/screen.mp4`

---

### OBS / Game Bar Settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (silent capture) |
| Encoder | x264 / NVENC H.264 |
| Output format | MP4 |

---

### What to Record

**Part 1 — Fresh start (30 s)**
1. Open Blender → Scripting workspace → paste `blueprint.py` → Run Script.
2. Switch to 3D Viewport → press Numpad 1 for front view.
3. Show the S-curve ribbon in solid shading (click the sphere icon → Solid).
4. Hover over the modifier panel to show `Handle_Spread` and `Profile_Radius` sliders.

**Part 2 — Handle Spread live scrub (45 s)**
1. Open the Geometry Nodes modifier in the Properties panel (blue wrench icon).
2. Slowly drag `Handle_Spread` from 0.00 → 0.55 → 1.20 → back to 0.55.
3. Hold at 0.55 for 5 seconds so viewers can see the final S-shape clearly.
4. Cut to Rendered shading (press Z → Rendered) — the emissive coral ribbon glows.

**Part 3 — Node tree walkthrough (90 s)**
1. Switch to the Geometry Nodes editor workspace.
2. Pan left to the `Curve Line` node — hold for 3 s.
3. Pan right to `Set Handle Type FREE` — hold for 3 s, explain it locks handles.
4. Continue right: show `SHP: P0 Right` and `SHP: P1 Left` side by side.
5. Continue to `Set Curve Radius` + the sin(t·π) math chain — hold for 5 s.
6. End at `Curve to Mesh` + `Shade Smooth`.

**Part 4 — Export (20 s)**
1. File → Export → glTF 2.0.
2. Show Draco compression enabled, level 6.
3. Click Export GLB. Done.

---

### Editing Notes

- Trim any pauses > 3 s between actions.
- Add a title card at 00:00: `"GN Set Handle Positions — Blender 5.1"` (white text on black, 2 s).
- No background music needed for a technical tutorial this short.
- Final cut target: 3–4 minutes.
