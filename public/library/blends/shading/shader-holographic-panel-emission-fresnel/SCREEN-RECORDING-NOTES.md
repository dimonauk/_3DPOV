# Screen-Recording Notes — Holographic Panel Shader

**Target file:** `public/library/videos/shading/shader-holographic-panel-emission-fresnel/screen.mp4`
**Duration:** 6–8 minutes · **Resolution:** 1920 × 1080 · **FPS:** 30 · **Audio:** off

---

## OBS / Game Bar setup

1. **Source:** Window Capture → select Blender 5.1.
2. **Canvas:** 1920 × 1080. Scale filter: Lanczos.
3. **Output:** MP4, H.264, CRF 22.
4. **Audio:** mute all tracks (tutorial voiceover added in post if needed).

---

## Shot list

### Shot 1 — Open blueprint.py (0:00–0:45)
Open Blender. Switch to the Scripting workspace. Click **Open** and navigate
to `blueprint.py`. Read the header docstring aloud or pause on it. Click
**Run Script**. Switch 3D Viewport to **Rendered** shading mode (Z → Rendered).
Show the panel appearing with the hex grid and scan lines lit.

### Shot 2 — Rendered viewport tour (0:45–2:00)
Orbit the camera (middle-mouse drag) around the panel. Demonstrate the Fresnel
rim glow brightening as you approach the silhouette edge. Pause at an
oblique angle to show the edge-brighter-than-face effect clearly. Zoom out to
show the two accent sub-panels.

### Shot 3 — Node editor walkthrough (2:00–4:30)
Open the **Shader Editor** (tab at top of the Properties panel area). Select
the `holo_panel_main` object. Show the full node graph. Walk through:
  - `Voronoi → Invert → Hex Ramp` explaining DISTANCE_TO_EDGE
  - `Wave → Scan Ramp` explaining BANDS direction and the scan scroll driver
  - `Fresnel → MULTIPLY_ADD amplifier` explaining why the rim is brighter
  - `Alpha summation` showing the three alpha contributors

### Shot 4 — Live parameter tweaks (4:30–6:00)
Change `HEX_SCALE` (Voronoi Scale input): increase from 9 to 20 (tighter grid),
then back to 6 (wide cells). Change `EMISSION_STRENGTH` (final Math Multiply
constant): reduce to 1.0 (no bloom), increase to 8.0 (strong bloom). Toggle
Render Properties → Effects → Bloom to show before/after bloom.

### Shot 5 — GLB export preview (6:00–end)
File → Export → glTF 2.0 (.glb). Confirm `Include → Material` is ticked.
Open the exported GLB in a browser tab via `model-viewer` or
`gltf-viewer.donmccurdy.com` to show the emissive glow is preserved via
`KHR_materials_emissive_strength`. End recording.

---

## Key settings to show on screen

| Setting | Location | Value |
|---|---|---|
| Render Engine | Render Properties | EEVEE |
| Bloom | Render Props → Effects | Enabled, Threshold 0.8 |
| Surface Render Method | Material Props → Settings | Forward |
| Shadow Mode | Material Props → Settings | None |
| Backface Culling | Material Props → Settings | Off |
