# EEVEE Next — Bloom via Compositor: Emission Threshold Glow for Cel-Shade Props

**Blender 5.1 · CC0 · Holoflow Studio**

## What this is

EEVEE Next (Blender 4.2+, default from 5.0) removed the old **Bloom** toggle from Render
Properties. Bloom now lives in the **Compositor** as a **Glare** node set to *BLOOM* mode.
The **Viewport Compositor** (N panel → View → Compositor → Always) makes bloom visible live
in the 3D viewport without a full F12 render.

This entry shows how to combine a cel-shaded prop (flat Diffuse body, Emission trim + core)
with compositor bloom so that only the hot emission faces glow — the Glare threshold sits just
above the cel-body luminance so body flats never bloom.

A Python driver pulses the core emission strength (4 → 8) over 60 frames, animating bloom
intensity without touching the Compositor node.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build — geometry, materials, driver, compositor, GLB export |
| `record.py`    | Batch-renders frames 1–60 → PNG sequence → encodes `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS take notes for `screen.mp4` |
| `.expected-artefacts.json` | File checklist with cross-references |

## Run order

```bash
# In Blender Scripting workspace:
# 1. Open blueprint.py → Run Script
# 2. Open record.py   → Run Script  (renders viewport.mp4)
# 3. Follow SCREEN-RECORDING-NOTES.md for screen.mp4
```

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `BLOOM_THRESHOLD` | 0.75 | Pixels brighter than this bloom. Set just above body luminance. |
| `BLOOM_SIZE`      | 8    | Glare spread radius (1–9). 8 = wide soft corona. |
| `BLOOM_MIX`       | 0.80 | Bloom overlay strength. 1.0 = full additive, 0.0 = off. |
| `CORE_EMIT_STRENGTH` | 4.0 | Base emission on core faces; driver drives it up to 8.0. |
| `TRIM_EMIT_STRENGTH` | 1.5 | Static emission on trim band. |

## WebXR export notes

The GLB uses `KHR_materials_emissive_strength` to carry emission factors above 1.0.
Three.js requires the `KHR_materials_emissive_strength` extension to read them correctly.
Bloom is not baked into the GLB — add `UnrealBloomPass` in your Three.js
`EffectComposer` pipeline for runtime glow. Export emission colour/strength; configure
bloom threshold on the client to match Blender's Glare threshold.

## Outside sources

- **Blender Manual — Compositor Glare Node** (CC-BY-SA-4.0, Blender Foundation)
  https://docs.blender.org/manual/en/5.1/compositing/types/filter/glare.html
- **Blender Manual — EEVEE Viewport Compositor** (CC-BY-SA-4.0, Blender Foundation)
  https://docs.blender.org/manual/en/5.1/render/eevee/render_settings/performance.html#viewport-compositor
