# sdxl-360-panorama

SDXL text-to-image tuned for seamless equirectangular panoramas.
Produces 4096 x 2048 spherical images for HoloWalk backdrops and AR
cards.

## What it generates

A PNG via `SaveImage`. Aspect ratio is 2:1 (equirect convention).
The 4096-wide canvas exceeds SDXL's native 1024 — the SDXL-360 finetune
linked below was specifically trained at panoramic dimensions.

## Source

**Adapted from Hangar**.
`D:\The_Hangar\engines\comfyui\workflows\sdxl_360_panorama.json` already
exists, but it loaded the **Flux** equirect LoRA on top of the SDXL
checkpoint, which is the wrong tooling combination (the LoRA is Flux-
specific). This file ships a clean SDXL-only path; the Flux equirect
LoRA gets its own workflow at `flux-equirect-lora-v3.json`.

Differences from the Hangar file:
- LoRA loader removed (it was a Flux LoRA being applied to an SDXL
  checkpoint — a bench-time mismatch).
- Canvas widened from 2048 x 1024 to 4096 x 2048 to give real panoramic
  resolution.
- Added `_meta.title` to every node.

## Required ComfyUI installs on the bench

- **Model — checkpoint** —
  `models/checkpoints/sdxl_360_diffusion.safetensors` (any of the
  "SDXL 360" / "Equirect SDXL" community finetunes —
  e.g. `sdxl-panorama-1.0`). Plain SDXL also works but seam quality
  drops without the finetune.
- **Core nodes only** — no custom_nodes required.

For best seamless results across the longitudinal wrap, install
`Tiled KSampler` from
[`ComfyUI_TiledKSampler`](https://github.com/BlenderNeko/ComfyUI_TiledKSampler)
and replace node `"5"`'s `class_type` with `BNK_TiledKSampler` —
`tiling_strategy: "circular"` makes the left/right edges line up.

## Server mutation contract

- **Positive prompt** → node `"2"` (`CLIPTextEncode`, title `Positive Prompt`)
- **Negative prompt** → node `"3"` (`CLIPTextEncode`, title `Negative Prompt`)
- **Seed** → node `"5"` (`KSampler.inputs.seed`)
- **Free-form params** — `{ "4": { "width": 2048, "height": 1024 } }`
  for a faster 1/2-resolution draft. `{ "5": { "steps": 50 } }` for
  higher fidelity.

## Output node

- **Node id**: `"7"`
- **Class**: `SaveImage`
- **Key**: `images[0]` → PNG file
