# Screen Recording Notes — City Block Tower Extrusion

**Target file:** `public/library/videos/geometry-nodes/gn-extrude-mesh-city-block-attribute-height/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic) |
| Output format | MP4 / H.264 |

## What to record

This tutorial is about the **Offset Scale field socket** on Extrude Mesh — the
audience needs to see the per-face height variation appear in real time.

**Recommended sequence (≈ 4–6 minutes):**

1. **Open a new Blender file** — show the default cube, delete it.
2. **Add a Grid** (10 m, 12 subdivisions) — show via Mesh → Grid in Add menu.
3. **Add a Geometry Nodes modifier** — press Properties → Modifier → Add → Geometry Nodes.
4. **Open the Shader Editor or GN editor** — show both Geometry Input and Output nodes.
5. **Add Extrude Mesh node** — Shift-A → Mesh → Extrude Mesh.  Wire Geometry through.
   - Show what `Individual` checkbox does: uncheck → all selected faces extrude as a slab.
   - Check `Individual` → faces separate.
6. **Add White Noise Texture** — Shift-A → Texture → White Noise Texture.  Set to `1D`.
7. **Add Input → Index node** — wire to `W` of White Noise.
8. **Add Map Range node** — set From Min/Max=0/1, To Min=0.5, To Max=6.0.
9. **Wire**: Index → White Noise → Map Range → **Offset Scale** on Extrude Mesh.
   Show the city block spring up with varied heights.
10. **Add park selection** — second White Noise + Index + Math(ADD, 10000) + Compare.
    Wire Compare → Selection on Extrude Mesh.  Show 25% of lots become parks.
11. **Add three materials** — ground/wall/rooftop.  Assign via SetMaterialIndex
    using the `Top` and `Side` outputs of Extrude Mesh.  Show the three-colour result.
12. **Export GLB** — File → Export → glTF 2.0.  Tick Apply Modifiers.

## Key moments to keep in frame

- The instant the Offset Scale wire connects — height variation appears live.
- The `Individual` checkbox toggle — demonstrates connected vs individual mode.
- The `Top` and `Side` output sockets being used as selection inputs.
- The final three-material view with rooftop gold, grey walls, green ground.

## After recording

Place the output file at:
`public/library/videos/geometry-nodes/gn-extrude-mesh-city-block-attribute-height/screen.mp4`
