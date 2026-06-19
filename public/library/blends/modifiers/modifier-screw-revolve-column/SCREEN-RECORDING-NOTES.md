# Screen Recording Notes
## Modifier — Screw: Lathe-Style Revolution Surface

---

### Software
- OBS Studio (or Windows Game Bar `Win+G`)
- Blender 5.1

### Capture settings
| Setting | Value |
|---|---|
| Window source | Blender application window |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` → place in `public/library/videos/modifiers/modifier-screw-revolve-column/` |

---

### What to record

**Segment 1 — Profile edge chain (0:00–0:25)**
1. Open a fresh Blender file. Run `blueprint.py` (Text Editor → Run Script).
2. The column appears, but first hide the Screw modifier in the Properties
   panel (eye icon off) and switch to **Wireframe** mode (`Alt+Z`).
3. Switch to **Front Ortho** (`Numpad 1`). The raw profile — 10 vertices in
   a vertical edge chain on the +X axis — is visible. Annotate: "this is all
   the Screw modifier needs."
4. Orbit slightly off-axis so the chain reads as 3-D. Zoom into the echinus
   flare (top) and entasis belly (middle third) to highlight the profile shape.

**Segment 2 — Enable Screw at low step count (0:25–0:55)**
1. Re-enable Screw modifier (eye icon). Set **Steps = 6** in the modifier
   panel. The result is a hexagonal prism with recognisably column-shaped
   profile.
2. Increment to **12**, then **24**, then **48**. Narrate how step count
   controls the LOD: 12 is fine for distant WebXR objects, 48 reads smooth
   without any subdivision.
3. Leave at 48. Orbit 180° in perspective mode so both the shaft and the
   capital are clearly visible.

**Segment 3 — Smooth shading + SubDiv (0:55–1:25)**
1. Enable the SubDiv modifier (eye icon). Show the modifier stack order
   (Screw → SubDiv) in the Properties panel.
2. Orbit slowly 360° with **Material Preview** shading. The column now reads
   as a smooth revolution surface. Zoom into the echinus flare to show the
   SubDiv rounds the silhouette without touching the step count.
3. Temporarily set SubDiv levels 2 → 0 and back to 2 to show the
   before/after difference.

**Segment 4 — Helix variant (1:25–1:50)**
1. In the Screw modifier panel, set **Screw = 0.06** (metres per turn).
   The column instantly becomes a helical spring / barber-pole form.
2. Set **Iterations = 4** and watch the helix extend four full turns.
3. Reset to 0 and 1 respectively. Confirm the closed column is restored.

**Segment 5 — Beauty fly-around (1:50–2:15)**
1. Switch to **Rendered** viewport shading (EEVEE Next).
2. Slowly orbit the finished column at a comfortable speed. Pause at the
   capital to let the abacus slab and echinus flare read clearly.
3. End on a three-quarter overhead shot looking down the shaft.

---

### Tips
- **Numpad 5** toggles ortho/perspective; use ortho for the profile shot,
  perspective for everything else.
- If OBS capture stutters during SubDiv orbit, temporarily disable SubDiv
  for the orbit section, then re-enable for the final beauty hold.
- The `record.py` automated render covers the same content — use either
  the screen recording or the automated render, or both.
