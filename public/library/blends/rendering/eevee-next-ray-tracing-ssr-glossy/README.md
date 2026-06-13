# EEVEE Next — Screen-Space Ray Tracing: Graduated-Roughness Metal Sphere Array

Blender 5.1 · CC0 · Holoflow Studio

## What this demonstrates

Six metallic IcoSpheres on a near-mirror floor step from roughness 0.0 (chrome)
to 1.0 (matte clay). SSR is configured with `ssr_max_roughness = 0.45`, making
the boundary between screen-space ray tracing and sphere-probe fallback visible
in a single viewport frame. Spheres 0–3 show SSR. Spheres 4–5 show probe.

## Scene objects

| Object | Role |
|--------|------|
| `sphere_r000` – `sphere_r100` | Metal spheres at roughness 0.0, 0.08, 0.18, 0.32, 0.55, 1.0 |
| `floor` | Near-mirror marble, roughness 0.03 |
| `backdrop_wall` | Deep navy backdrop — reflected colour is legible on spheres |
| `sphere_probe_centre` | Sphere Light Probe at Z 1.8 m, influence 9 m |
| `light_key`, `light_fill` | 400W + 180W area lights |
| `camera_main` | 50mm lens, Track To constraint on `camera_target` |

## Running blueprint.py

```bash
blender --background --python blueprint.py
```

Outputs: `public/library/glbs/rendering/eevee-next-ray-tracing-ssr-glossy/ssr_metal_spheres.glb`

## Running record.py (requires blueprint.py scene open)

Open `blueprint.py` in the Blender Scripting workspace, run it, then open
`record.py` and run it in the same session.

Outputs: `public/library/videos/rendering/eevee-next-ray-tracing-ssr-glossy/viewport.mp4`

## Key SSR settings

| Property | Value | Why |
|----------|-------|-----|
| `ssr_quality` | 0.50 | Balances ray count vs render time |
| `ssr_max_roughness` | 0.45 | Chrome + brushed metal get SSR; matte uses probe |
| `ssr_thickness` | 0.15 m | Prevents dark halos on thick-profile spheres |
| `ssr_border_fade` | 0.08 | Soft fade at screen edges; prevents hard pop |
| `ssr_firefly_fac` | 10.0 | Clamps extreme bright samples |

## Cross-references

- `/tutorials/blender-tutorial-eevee-next-reflection-plane-mirror-floor` — the PROBE Plane method (complement to SSR)
- `/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe` — GI probe baking
- `/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh` — Cycles path-traced alternative
- `/tutorials/blender-tutorial-shader-principled-transmission-iridescence` — IOR and Fresnel on dielectrics

## Outside sources

- Blender Manual — EEVEE Screen Space Reflections
  `https://docs.blender.org/manual/en/5.1/render/eevee/render_settings/screen_space_reflections.html`
  CC-BY-SA-4.0 · Blender Foundation
- blender-scripting by Nicolas Janakiev
  `https://github.com/njanakiev/blender-scripting`
  MIT licence — related sibling: njanakiev/fractal-landscapes
