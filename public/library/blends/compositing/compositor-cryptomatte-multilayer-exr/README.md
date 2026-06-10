# Compositor Nodes — Cryptomatte Masking + Multi-Layer EXR

**Blender 5.1 · Compositing · CC0**

Builds a production compositor node tree in Blender that:

1. Denoises the Cycles Combined pass with Intel OIDN (Apache-2.0).
2. Uses Cryptomatte Object to isolate a single mesh by object hash.
3. Applies Fog Glow *only* to the isolated gem — no spill onto the background.
4. Adds a soft vignette via Ellipse Mask + Gaussian Blur.
5. Outputs every render pass to a multi-layer OpenEXR for external grading.

The technique is the foundation of Holoflow's render-to-grade pipeline: run
the blueprint, press F12 in Blender, and the .exr lands in `//renders/`
ready for DaVinci Resolve, Natron, or Nuke.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates scene, materials, lighting, render passes, compositor tree |
| `record.py` | 90-frame OpenGL viewport orbit → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for capturing `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable artefact list + cross-references |

---

## Artefacts produced

- `compositor_cryptomatte_multilayer.blend` — full scene with compositor tree
- `compositor_scene.glb` — Draco-compressed GLB of the 3-object scene
- `//renders/final_0001.png` — composited PNG (denoised + glow + vignette)
- `//renders/*.exr` — multi-layer EXR with all passes

---

## Outside sources

- **Cryptomatte Specification v1.2.1** — BSD 2-Clause — Psyop Inc.
  https://github.com/Psyop/Cryptomatte
- **Blender Compositor Manual** — CC-BY-SA 4.0 — Blender Foundation
  https://docs.blender.org/manual/en/latest/compositing/

---

## Key concepts

**Cryptomatte matte_id format:**
```
node.matte_id = '"object_name"'   # exact match — double-quotes inside the string
node.matte_id = '"gem" "sphere"'  # multiple objects — space-separated
```

**DWAA vs ZIP EXR codec:**
- ZIP: lossless, ~2× compression. Use for VFX pipelines that require bit-exact.
- DWAA: lossy wavelet, 3–8× compression. Perceptually indistinguishable at
  production resolutions. Correct choice for grade-only workflows.

**OIDN input passes:**
`RGB_ALBEDO_NORMAL` feeds three buffers to the denoiser. Omitting Normal
causes blurring at geometry silhouettes. Omitting Albedo desaturates textured
surfaces. Always use all three passes.
