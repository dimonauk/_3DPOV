# Screen Recording Notes
## GN Simulation Zone — Spring-Pendulum Poi Lissajous

Target file: `public/library/videos/geometry-nodes/gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting/screen.mp4`

---

### Software
- **OBS Studio** 30.x or Windows Game Bar (`Win + G`)
- Blender 5.1 (standalone window, not embedded in editor)

### Capture settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264, CRF 18) |

### What to record (runtime ≈ 5–7 minutes of capture → edit to 2–3 min)

1. **Open Blender 5.1** — new General file.
2. Delete default cube. Add → Mesh → Single Vertex (or use Add → Empty → Plain Axes as the single-point source).
3. Add Geometry Nodes modifier to the vertex object.
4. In the GN editor, show the **Simulation Zone** node being added (`Add → Simulation → Simulation Zone`).
5. Wire up **Position**, **Store Named Attribute** (`vel`), and **Set Position** inside the zone.  Briefly show the node names as they are added.
6. Outside the zone: set up the hand orbit math nodes — `Scene Time → Math(Multiply, ω_h) → Combine XYZ`.
7. Show the **spring force** sub-network: VectorMath Subtract → VectorMath Length → Math Subtract L0 → VectorMath Scale.
8. Connect drag: VectorMath Scale on the velocity attribute, then Add to spring force.
9. **Kick step**: VectorMath Add velocity + force*(dt/m). **Drift step**: VectorMath Add position + v_new*dt.
10. Connect to Set Position and Store Named Attribute.
11. Press **Space** to play — show poi-head points tracing their paths in the viewport.
12. Optionally: show the Points to Curves → Curve to Mesh chain being added after the sim zone output to turn the accumulated point cloud into a ribbon.
13. Show **File → Export → glTF 2.0** → select GLB, Draco enabled, WebP textures.

### Post-production hints
- Trim dead air between node additions.
- Speed ramp the node-wiring sections ×1.5 — steady on the physics explanation moments.
- Overlay the formula card (F_spring = −k·(|d|−L₀)·d̂) as a text annotation at the spring-force step.
- Colour-grade to lower contrast, slight warm push — keeps the neon strand colours vivid.
