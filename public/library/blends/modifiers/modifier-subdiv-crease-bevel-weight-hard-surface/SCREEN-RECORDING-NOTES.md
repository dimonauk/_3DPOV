# Screen Recording Notes
## Modifier Stack — SubDiv + Crease + Bevel Weight: Hard-Surface SubD

---

### Software
- OBS Studio (or Windows Game Bar `Win+G`) — whichever you prefer
- Blender 5.1

### Capture settings
| Setting | Value |
|---|---|
| Window source | Blender application window |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output | `screen.mp4` → place in `public/library/videos/modifiers/modifier-subdiv-crease-bevel-weight-hard-surface/` |

---

### What to record

**Segment 1 — Raw geometry (0:00–0:20)**
1. Open a fresh Blender file. Run `blueprint.py` (Text Editor → Run Script).
2. The mount block appears. All modifiers are present but none visible in viewport.
3. In the 3D Viewport header switch to **Wireframe** (`Alt+Z`). Pan slowly around.
4. Press **N** to open the Item panel. Switch back to Solid shading.
5. Highlight the edges by selecting them in Edit Mode — show the base ring,
   the top rim, and the groove inner rim so the audience can see the three groups.

**Segment 2 — Turn on Bevel modifier (0:20–0:40)**
1. Exit Edit Mode. Open the Properties panel → Modifier stack.
2. Click the eye icon on **Bevel** to enable viewport visibility.
3. Rotate around the block. The top outer rim now shows a two-segment chamfer;
   the base has a lighter chamfer. Inner groove edges: unchanged (no bevel weight
   on them).
4. Zoom into a corner so the chamfer profile is clearly visible.

**Segment 3 — Turn on Subdivision Surface (0:40–1:10)**
1. Enable the **SubDiv** modifier in the stack (eye icon).
2. The block smooths. Note: the silhouette corners remain sharp (Crease=1.0).
3. Orbit slowly. The groove rim shows a subtle tension curve (Crease=0.5).
4. Switch SubDiv levels from 2 → 3 in the modifier panel to show quality jump.
   Switch back to 2.

**Segment 4 — Turn on Weighted Normal (1:10–1:25)**
1. Enable **WeightedNormal** modifier.
2. Compare the shading at the groove wall / annulus join — shading artefacts
   from the planar-to-curved transition improve.
3. Optional: temporarily disable to show the before/after difference.

**Segment 5 — Fly-around beauty shot (1:25–2:00)**
1. Set viewport shading to **Material Preview** or **Rendered**.
2. Slowly orbit 360° around the finished block.
3. Zoom into the top groove corner for a close-up of the bevel + SubD result.
4. Pull back to a three-quarter overhead shot for the final freeze frame.

---

### Tips
- Use **Numpad 5** to toggle orthographic/perspective. Perspective is more
  cinematic for the fly-around.
- **Numpad 4/6/8/2** for controlled orbit increments if OBS jitter is an issue.
- If the SubDiv is slow at level 3, render in level 2 and note in commentary
  that level 3 is for final renders only.
- Scrub the timeline slider to show the blueprint's keyframed modifier toggle
  if you want a nice animated reveal instead of manual toggling.
