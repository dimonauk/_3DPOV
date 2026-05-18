# wan-t2v-1_3b

Wan 2.1 T2V 1.3B text-to-video. Short cinematic clips for atelier
explainers and social cuts.

## What it generates

An MP4 via `VHS_VideoCombine`. Default 832 x 480, 81 frames, 16 fps
(~5 second clip).

## Source

**Found locally** at
`D:\The_Hangar\engines\comfyui\workflows\wan_1_3b_t2v.json` —
battle-tested in the Hangar. Ported here verbatim except for:

- Added `_meta.title` on every node (so the server's positive/negative
  prompt detection works without relying on node ordering).
- Filename prefix changed to `holoflow_wan_t2v_1_3b`.

Note: the `dollyos-comfyui-3d` skill mentions "kijai wrapper" for Wan
video, but the file in the Hangar's `workflows/` directory uses the
**native ComfyUI Wan node path** (`UNETLoader` + `CLIPLoader` +
`KSampler` + `VHS_VideoCombine`), not kijai's
`WanVideoWrapper`. The native path is what's been working on the bench,
so that's what we ship. If the operator wants the kijai variant for
specific features (FlashVSR, EchoShot, etc.), see
`D:\The_Hangar\engines\comfyui\custom_nodes\ComfyUI-WanVideoWrapper.disabled\example_workflows\`
and swap in those node types.

## Required ComfyUI installs on the bench

- **Model — UNET** — `models/unet/Wan2.1-T2V-1.3B.safetensors`
- **Model — CLIP** — `models/text_encoders/models_t5_umt5-xxl-enc-bf16.pth`
- **Model — VAE** — `models/vae/Wan2.1_VAE.pth`
- **Custom node** — `VHS_VideoCombine` from
  [`ComfyUI-VideoHelperSuite`](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite).
  Provides the MP4 muxing node and registers `videos[]` / `gifs[]` keys
  in the history outputs (which is what the server's `findOutputFile`
  walks).

## Server mutation contract

- **Positive prompt** → node `"4"` (`CLIPTextEncode`, title `Positive Prompt`)
- **Negative prompt** → node `"5"` (`CLIPTextEncode`, title `Negative Prompt`)
- **Seed** → node `"7"` (`KSampler.inputs.seed`)
- **Free-form params** — pass `{ "6": { "length": 121 } }` to make a
  longer clip, or `{ "7": { "steps": 30, "cfg": 7.5 } }` to tune
  sampling. Pass `{ "9": { "frame_rate": 24 } }` for 24fps output.

## Output node

- **Node id**: `"9"`
- **Class**: `VHS_VideoCombine`
- **Key**: `gifs[0]` or `videos[0]` (depending on VHS version — server
  checks both)
