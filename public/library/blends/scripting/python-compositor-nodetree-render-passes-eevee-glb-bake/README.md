# Python bpy.types.CompositorNodeTree — Production Compositor Pipeline
## Render Passes · OIDN Denoise · CDL Colour Balance · Glare · Multilayer EXR

**Blender 5.1 · Holoflow Studio · Licence: CC0**

## What this is

A production blueprint for building a full Compositor nodetree programmatically via
the Python API — no operator clicks, no manual node placement.  The script clears the
auto-populated default graph and wires a complete beauty pipeline: OIDN denoiser fed
by denoising data passes, a CDL colour grade, FOG_GLOW for EEVEE emission, barrel lens
distortion with chromatic aberration, a Composite output, and a multilayer EXR File
Output for lightmap bake archival.

Blender 5.1 adds a GPU compositor backend (`scene.render.compositor_device = 'GPU'`)
that evaluates the tree on the GPU during viewport refresh — the script enables it by
default.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full production script — builds compositor + scene |
| `record.py` | Viewport render animation (3 s, 24 fps, sphere spin) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Library manifest entry |

## Quick start

1. Open Blender 5.1 → New General file
2. Switch to the Scripting workspace
3. Open `blueprint.py` → Run Script
4. Switch to the Compositor workspace — the full node graph is wired and visible
5. Press **F12** to render; multilayer EXR is written to `//render/compositor_passes_0001.exr`

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `EXR_OUTPUT_PATH` | `//render/compositor_passes` | Relative output path for multilayer EXR |
| `COLOUR_LIFT` | `(0, 0, 0.01, 1)` | CDL lift — blue shadow push |
| `GLARE_THRESHOLD` | `0.85` | Luminance above which FOG_GLOW activates |
| `LENS_DISTORTION` | `0.012` | Barrel coefficient (positive = barrel) |
| `LENS_DISPERSION` | `0.008` | Chromatic aberration split |
| `USE_GPU_COMPOSITOR` | `True` | Enables GPU backend (5.1 only) |

## Expert notes

- `scene.use_nodes = True` auto-populates `scene.node_tree` with a RenderLayers +
  Composite pair.  **Always** call `tree.nodes.clear()` before adding custom nodes —
  the auto-pair silently absorbs your first link if left in place.
- File Output `layer_slots.new(name)` adds a named input **by name** but linking
  requires the **integer index**, not the socket name.  Keep a `slot_names` list
  derived from `fileout.layer_slots` after construction and use `.index(name)` to
  resolve it.
- OIDN `denoise.use_hdr = True` preserves values above 1.0 — without it, emission
  peaks are clipped to 1.0 before the denoising pass and the Glare node receives no
  HDR signal to amplify.
- `vl.use_denoising_data = True` must be set **before** the first render — it cannot
  be toggled mid-session.  Changing it requires a full cache flush (re-render).

## Outside sources

- **Blender Foundation — Compositor Nodes API** (CC-BY-SA-4.0)
  https://docs.blender.org/api/5.1/bpy.types.CompositorNode.html
- **Blender Manual — Compositor Introduction** (CC-BY-SA-4.0)
  https://docs.blender.org/manual/en/latest/compositing/introduction.html
- **Open Image Denoise (OIDN)** (Apache-2.0, Intel)
  https://github.com/RenderKit/oidn

## Studio cross-references

- `/tutorials/blender-tutorial-python-scene-color-management-agx-ocio-bake-safe`
- `/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr`
- `/tutorials/blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake`
- `/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping`
- `/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes`
