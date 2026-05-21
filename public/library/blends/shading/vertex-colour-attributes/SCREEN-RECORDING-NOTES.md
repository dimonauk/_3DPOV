# Screen Recording Notes — Vertex Colour Attributes

Target file: `public/library/videos/shading/vertex-colour-attributes/screen.mp4`

## Software

| App | Setting |
|-----|---------|
| OBS Studio (≥ 31) | Scene: Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (mute all sources) |
| Output format | MP4 / H.264, CRF 18 |

## Shot list

### Shot 1 — Open a new Blender file and inspect the Color Attributes panel (≈ 30 s)

1. Launch Blender 5.1, open a new General file.
2. Select the default cube. Switch to **Properties → Object Data → Color Attributes**.
3. Show the empty list — zero entries — so the viewer sees the baseline.
4. Pause on the panel. Keep cursor still for two seconds.

### Shot 2 — Run blueprint.py in the Blender Python console (≈ 45 s)

1. Switch to **Scripting** workspace.
2. Click **Open** → navigate to `public/library/blends/shading/vertex-colour-attributes/blueprint.py`.
3. Click **Run Script** (or press Alt+P).
4. Watch the console output. Show `[blueprint] GLB →` and `[blueprint] .blend →` lines.

### Shot 3 — Inspect the colour attribute (≈ 30 s)

1. Select the `vertex_colour_demo` object.
2. Open **Properties → Object Data → Color Attributes**.
3. Show "Col" entry with domain **Face Corner** and type **Byte Color**.
4. Click the attribute name — it highlights in blue as the active attribute.
5. Switch to **Vertex Paint** mode: the four palette zones are visible on the
   icosphere without any UV map.

### Shot 4 — Inspect the material (≈ 30 s)

1. Switch to **Shader Editor** with the object selected.
2. Pan to show the three-node chain:
   **Vertex Color (Col) → Emission → Material Output**.
3. Hover over the Vertex Color node to show the `Layer Name: Col` tooltip.
4. Switch the 3D Viewport to **Rendered** shading — all four palette hues
   appear as flat blocks with crisp facet boundaries.

### Shot 5 — Verify the GLB in glTF Viewer (≈ 30 s)

1. Open a browser → `https://gltf-viewer.donmccurdy.com`
2. Drag `vertex_colour_demo.glb` onto the viewer.
3. In the **Scene** tab expand **Meshes → vertex_colour_demo → Primitives [0]**,
   confirm `COLOR_0` attribute is present.
4. In the viewer 3D window, rotate the model to show all four colour zones.

## Trim guide

Keep shots tight: cut dead mouse movements, leave viewport spin in shot 4.
Target runtime: **2 minutes 30 seconds**.
