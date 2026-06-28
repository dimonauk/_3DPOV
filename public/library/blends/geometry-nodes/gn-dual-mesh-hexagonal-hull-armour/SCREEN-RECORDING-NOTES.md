# Screen Recording Notes — GN Dual Mesh Hull Armour

**Output target:** `public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/screen.mp4`

---

## OBS / Game Bar Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic needed for this recording) |
| Output format | MP4 / H.264 |

---

## Viewport setup before recording

1. Open Blender 5.1. Set layout to **Default** workspace.
2. Delete the default cube. Add → Mesh → Ico Sphere, **Subdivisions = 2**.
3. In the Properties panel → Modifier Properties → **Add Modifier → Generate → Geometry Nodes**. Name the tree `GN_DualMesh_HullArmour`.
4. In the **N Panel** (press N), set the Geometry Nodes editor to **Object** context.
5. Switch one area to **Geometry Node Editor**.
6. Set **Viewport Shading** to **Material Preview** (Lookdev mode, HDRI on).

---

## Scene to record

Work through these steps in real time. Each step below is one continuous camera pass.

### Pass 1 — Add Dual Mesh node (≈ 45 s)

- In the GN editor, add **Group Input → Dual Mesh → Group Output**.
- Wire **Geometry** socket through **Dual Mesh (Mesh input / Dual Mesh output)**.
- Watch the viewport: the icosphere triangles snap into the 30-hex + 12-pent pattern instantly.
- Point the mouse at the viewport and say / gesture: *"80 triangle faces became 42 faces — 30 hexagons and 12 pentagons."*

### Pass 2 — Scale Elements (≈ 30 s)

- Insert **Scale Elements** between Dual Mesh and Group Output.
- Set domain to **Face**, mode to **Uniform**.
- Drag the **Scale** value from 1.0 down to **0.88** — panels visibly separate.
- Pause on 0.88 for a moment so the gap reads clearly.

### Pass 3 — Extrude Mesh (≈ 30 s)

- Insert **Extrude Mesh** after Scale Elements.
- Set **Mode → Faces**, tick **Individual**.
- Set **Offset Scale → 0.06** — panels raise off the sphere surface.
- Rotate the view to show the raised panel edges in profile.

### Pass 4 — Pentagon detection + material (≈ 60 s)

- Add **Index → Corners of Face → Compare (=, 5) → Set Material Index (= 1)** chain.
- Insert **Set Material Index** between Dual Mesh and Scale Elements.
- Open **Material Properties**, add two slots: slot 0 metallic blue, slot 1 emissive cyan.
- The 12 pentagon panels light up cyan in the viewport.

### Pass 5 — Final rotate reveal (≈ 20 s)

- Numpad 5 → orthographic off (perspective on).
- Middle-mouse orbit slowly around the hull armour ball.
- Cut.

---

## Post-processing (optional)

- Trim to remove dead time at start/end.
- Speed ramp on Pass 4 if it runs long.
- No colour grading needed — Material Preview HDRI already looks good.
- Export at **CRF 18** for tutorial quality.
