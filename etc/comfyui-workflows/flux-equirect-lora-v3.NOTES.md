# flux-equirect-lora-v3

Flux1-dev FP8 + `Equirectangular v3` LoRA. The **best 360 quality**
path per the `dollyos-comfyui-3d` skill — used for hero 360 backdrops
on the site.

## What it generates

A 2048 x 1024 equirectangular PNG via `SaveImage`. Flux handles
photographic detail and the LoRA biases the latent toward seamless
spherical projections.

## Source

**Generated as template**. No Flux + equirect-LoRA workflow exists in
the Hangar's `workflows/` directory yet — only the SDXL panorama
workflow (which had the Flux LoRA mis-attached to it). This file is the
correctly-paired Flux+LoRA combination.

Built from the public ComfyUI conventions for Flux LoRA stacking:
`CheckpointLoaderSimple → LoraLoader → CLIPTextEncode (x2) → KSampler →
VAEDecode → SaveImage`.

## Required ComfyUI installs on the bench

- **Model — checkpoint** — `models/checkpoints/flux1-dev-fp8.safetensors`
  (same as the `flux1-dev-fp8` workflow).
- **Model — LoRA** —
  `models/loras/equirectangular_flux_lora_v3_000003072.safetensors`
  (the v3 release; matches the filename used in the Hangar's earlier
  SDXL-misattribution workflow, so the file is likely already on disk).
  If missing: train artist's release is on Civitai under "Flux
  Equirectangular Panorama LoRA v3".
- **Core nodes only** — no custom_nodes required.

If the bench is using the UNETLoader split-loader for Flux (the
Hangar's current setup), see `flux1-dev-fp8.NOTES.md` for the split
swap — and add a second `LoraLoaderModelOnly` node for the model branch
since `LoraLoader` (combined) expects both `model` and `clip` from the
same loader.

## Server mutation contract

- **Positive prompt** → node `"3"` (`CLIPTextEncode`, title `Positive Prompt`)
- **Negative prompt** → node `"4"` (`CLIPTextEncode`, title `Negative Prompt`)
- **Seed** → node `"6"` (`KSampler.inputs.seed`)
- **Free-form params**:
  - `{ "2": { "strength_model": 0.7, "strength_clip": 0.7 } }` — soften
    the LoRA if the projection feels over-stylised.
  - `{ "5": { "width": 4096, "height": 2048 } }` — full-res equirect.
    Doubles VRAM cost; may OOM on 12 GB.
  - `{ "6": { "steps": 35, "cfg": 1.5 } }` — Flux is stable at low cfg;
    don't push cfg over 2.

## Output node

- **Node id**: `"8"`
- **Class**: `SaveImage`
- **Key**: `images[0]` → PNG file
