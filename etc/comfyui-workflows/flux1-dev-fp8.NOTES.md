# flux1-dev-fp8

Flux1-dev FP8 text-to-image. Best lighting/physics per the
`dollyos-comfyui-3d` skill — the workhorse for hero stills and sculpture
concept art on the holoflow.co.uk site.

## What it generates

A single PNG via `SaveImage`. Default 1024 x 1024.

## Source

**Template, derived from Hangar**. The Hangar's
`D:\The_Hangar\engines\comfyui\workflows\flux_dev_fp8_t2i.json` uses the
advanced sampler chain (`RandomNoise` + `KSamplerSelect` +
`BasicScheduler` + `SamplerCustomAdvanced`) which does not match the
server impl's `class_type.startsWith("KSampler")` seed-mutation rule.

This file rewrites the same model wiring into the simpler
`CheckpointLoaderSimple` + `KSampler` pattern so the server can mutate
the seed without per-workflow special-casing.

## Required ComfyUI installs on the bench

- **Model** — `models/checkpoints/flux1-dev-fp8.safetensors` (single-file
  Flux1-dev FP8 checkpoint with bundled VAE + CLIP).
- **Core nodes only** — no custom_nodes required.

If the bench has the Flux UNETLoader split-loader pattern instead (the
Hangar's current setup), swap node 1 to:
```json
{
  "1a": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux1-dev-fp8.safetensors", "weight_dtype": "fp8_e4m3fn"}},
  "1b": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "t5xxl_fp8_e4m3fn.safetensors", "clip_name2": "clip_l.safetensors", "type": "flux"}},
  "1c": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}}
}
```
and rewire `["1", 0]` → `["1a", 0]`, `["1", 1]` → `["1b", 0]`,
`["1", 2]` → `["1c", 0]`.

## Server mutation contract

- **Positive prompt** → node `"2"` (`CLIPTextEncode`, title `Positive Prompt`)
- **Negative prompt** → node `"3"` (`CLIPTextEncode`, title `Negative Prompt`)
- **Seed** → node `"5"` (`KSampler.inputs.seed`)
- **Free-form params** — pass `{ "5": { "steps": 30, "cfg": 1.5 } }` etc.
  to override sampler settings. Pass `{ "4": { "width": 1920, "height": 1080 } }`
  to change canvas. Note Flux is most stable at `cfg=1.0`.

## Output node

- **Node id**: `"7"`
- **Class**: `SaveImage`
- **Key**: `images[0]` → PNG file
