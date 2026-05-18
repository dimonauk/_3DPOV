# `viz.generate-comfyui` — Generate images / video / 3D / 360 via ComfyUI

The site's seam onto the Hangar's ComfyUI workflows. Five battle-tested
flows are exposed as a single capability:

| Workflow | Output | Why this one |
|---|---|---|
| `flux1-dev-fp8` | image | best lighting/physics in the Hangar's catalogue |
| `wan-t2v-1_3b` | video | kijai wrapper, used for explainers + social cuts |
| `hunyuan3d-2mv-turbo` | 3D GLB (~15 MB in ~53s) | image → mesh; the stage-furniture pipeline |
| `sdxl-360-panorama` | equirect image | seamless 360 backdrops |
| `flux-equirect-lora-v3` | equirect image | best 360 quality on the bench |

## Why this is a capability

The website routes (atelier / pipelines / chrono-protocol / aura, etc.)
need on-demand generation of stills, video, props, and 360 backdrops.
Hand-rolling per-route ComfyUI calls would duplicate the bench-bridge,
the workflow JSON munging, and the Blob persistence. One capability
absorbs that.

## The bench bridge

ComfyUI runs on Sovereign-PC at `D:/The_Hangar/engines/comfyui/` on
port 8188. From a Vercel-deployed page, the bench is reached via the
studio's Tailscale Funnel — set `COMFYUI_SERVICE_URL` to the tailnet
hostname (`https://comfyui.tail99b2a4.ts.net` or similar) and
`COMFYUI_AUTH_TOKEN` to the shared bearer per
[[holoflow-bench-bridge]].

From the bench itself (or when the dev server runs on Sovereign-PC),
default `http://localhost:8188` works without a tunnel.

## Workflow JSON files

The workflow JSONs live in `etc/comfyui-workflows/<workflow>.json`
in the repo, exported from the Hangar's ComfyUI session. Each one has
a small set of overridable nodes — prompt text, negative prompt, seed,
sampler steps — that the server impl merges with the caller's input
before submitting.

## Posture

Foundation phase. The type surface, the workflow enum, and the output
shape are stable. The server impl (`generate-comfyui.server.ts`) and
the workflow JSON files land when the first surface needs to actually
generate something. Until then, callers hit the stub router and get
`service-unavailable`.

## Composes with

- `media.library` — for Blob persistence + media-record write
- `viz.splat-generate-360` — when a generated 360 backdrop becomes a
  splat training input (rare; mostly the other way round)
- `agent.dialogue-*` — when Aura's responses include "generate an
  image of …" intents, the dialogue capability routes through here

## Sources

- ComfyUI workflows from the [dollyos-comfyui-3d] skill
- Hangar workflow files at `D:/The_Hangar/engines/comfyui/`
- Bench-bridge pattern from `viz.splat-generate.server.ts`
