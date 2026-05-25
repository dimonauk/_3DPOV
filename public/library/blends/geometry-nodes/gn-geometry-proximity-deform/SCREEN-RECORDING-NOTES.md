# Screen Recording Notes — GN Geometry Proximity Deform

**Target file:** `public/library/videos/geometry-nodes/gn-geometry-proximity-deform/screen.mp4`
**Resolution:** 1920 × 1080 · 30 fps · audio off

---

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 (match Blender window) |
| FPS | 30 |
| Encoder | x264 · CRF 18 |
| Audio | Disabled |

---

## Scene prep before hitting Record

1. Open `proximity_deform.blend` (created by blueprint.py).
2. Set viewport shading to **Material Preview** (Z → Material).
3. Open the **Node Editor** beside the 3D viewport — split the editor area 40/60.
   - Set editor type to **Geometry Nodes**.
   - Select `proximity_deform` in the outliner so `GNProximityDeform` appears in the node editor.
4. In the 3D viewport, orbit to a 3/4 overhead angle (numpad 5 for ortho, then tilt slightly) so the dome deformation is clearly visible.
5. Scrub timeline to frame 60 first — confirm the deformation dome is visible before recording.
6. Return to frame 1.

---

## Shot list (≈ 3–4 minutes of recording)

### Shot 1 — play the animation (30 s)
- Hit **Spacebar** to play.
- Let the animation run once end-to-end (150 frames = 5 s at 30fps).
- Pause. Viewers should see: flat grid → dome forms → holds → flattens.

### Shot 2 — node graph walkthrough (60 s)
Switch focus to the Node Editor. Hover over each node and describe:
1. **ObjectInfo** — "reads the sphere geometry into the GN tree"
2. **GeometryNodeProximity** — "computes nearest distance from each vertex to the sphere surface"
3. **MapRange (SMOOTHERSTEP)** — "converts raw distance to a [0,1] falloff; SMOOTHERSTEP gives C2 continuity at the boundary"
4. **Math(MULTIPLY)** — "scales the falloff by Max Depress to get metres of displacement"
5. **Math(SUBTRACT 0)** — "negates the displacement so it points downward (−Z)"
6. **CombineXYZ** — "packages the offset as a 3D vector (0, 0, −depress)"
7. **SetPosition** — "applies the offset to every vertex"

### Shot 3 — live parameter tweak (45 s)
- In the Properties panel → Modifier tab, find **ProximityDeform** modifier.
- Live-scrub **Max Depress** from 0 to 1.0 while at frame 60 — show the dome depth changing.
- Live-scrub **Influence Radius** from 0.5 to 2.0 — show the field width expanding.
- Return both to original values.

### Shot 4 — move the sphere manually (30 s)
- Select `influence_sphere` in the outliner.
- Grab (G) and move it in X or Y — show the dome follows the sphere in real time.
- Undo back to origin.

### Shot 5 — viewport comparison (30 s)
- Scrub to frame 1 (flat grid).
- Hold scrub bar and drag to frame 60 (dome).
- Drag back and forth a few times to show the near-instant feedback.

---

## Post-processing

Trim to ≤ 4 minutes. No audio needed. Export to `screen.mp4` (H.264, CRF 18).
Place in `public/library/videos/geometry-nodes/gn-geometry-proximity-deform/screen.mp4`.
