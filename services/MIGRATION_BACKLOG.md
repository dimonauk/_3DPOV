# services/ migration backlog

The catalog of Hangar bench services that satisfy the
[migration criterion](./README.md) but haven't been pulled into
`services/` yet. Each entry is a discrete, mechanical task — pull
the source, strip artefacts, write a README, white-label any
"Hangar"-specific names, optionally write the matching Vercel-side
capability contract.

Last surveyed: 2026-05-16 by exhaustive walk of `D:/The_Hangar/`.

## Already migrated (shipped)

- `splat360/` — 360-camera-first gaussian splat service
- `sharp-onnx/` — Apple SHARP single-image inference
- `mesh-to-sdf/` — mesh → Float32 SDF binary for browser shaders
- `lithophane/` — image → printable lithophane STL (also `/atelier/lithophane`)
- `image-to-pixel/` — pure JS pixel-art converter (drives `/atelier/pixelify`)
- `softxels/` — three.js voxel renderer library
- `webgpu-marching-cubes/` — WebGPU isosurface (drives `/atelier/isosurface`)
- `holoflow-services/` — bench mesh-ops bundle (lithophane / voxelize / Pixelorama bridge)
- `triposr/`, `hy-wu/`, `unique3d/`, `instantmesh/` — image-to-mesh provider quartet (drives `/atelier/image-to-mesh`; bench wrapper pending — see `lib/capabilities/viz/image-to-mesh.server.ts` docstring)

## High value — migrate next

### Image → 3D mesh providers (4 candidates → one capability)

Five separate Hangar engines all answer the same contract: "give me
an image, get back a mesh." Worth designing
`lib/capabilities/viz/image-to-mesh.ts` as source-agnostic up front
(splat-generate pattern), then migrating the providers as stubs that
fulfil the contract.

| Provider | Hangar source | Notes |
|---|---|---|
| `triposr` | `D:/The_Hangar/engines/TripoSR/` | Single-image; ~1.6 GB checkpoint stays bench (HF download on first run) |
| `hy-wu` | `D:/The_Hangar/engines/HY-WU/` | Hunyuan + Wu wrapper; ~30 KB source |
| `instantmesh` | `D:/The_Hangar/tools/InstantMesh/` | Multi-view input variant |
| `unique3d` | `D:/The_Hangar/tools/Unique3D/` | Single-view; Triton wheel + venv |
| `trellis` (DEFER) | `D:/The_Hangar/engines/TRELLIS/` | Microsoft; heavy weights, slow inference — provider stub fine for now |

### holoflow-services — mesh-ops bundle

- Path: `D:/The_Hangar/engines/holoflow-services/`
- Already named for this. FastMCP + sibling FastAPI sidecar.
- Bundles: lithophane, voxelize, simplify, repair, inspect mesh + Pixelorama CLI.
- Vercel side: `lib/capabilities/viz/mesh-ops` (TBD)
- White-label: drop MCP wrapper; keep FastAPI half.

### lightpainting-forge-backend — segment + depth

- Path: `D:/The_Hangar/tools/lightpainting-forge-backend/`
- SAM2 segmentation + Depth Anything V2 ONNX. Natural HoloWalk pairing.
- Vercel side: `lib/capabilities/image/segment-sam2` + extend the
  existing `viz.depth-estimation`.
- White-label: rename "Lightpainting Forge"; hard-coded
  `D:\The_Hangar\sam2` path needs to become env-driven.

## Utility belt — MCP servers ready to ship

All FastMCP SSE servers; HTTP-callable from Vercel via Tailscale Funnel.
Naming convention: drop MCP wrapper where possible, keep FastAPI core,
white-label "Hangar Lattice Node" headers.

| MCP server | Hangar path | Vercel capability (proposed) |
|---|---|---|
| `sharp_mcp` (Pillow ops) | `Servers/sharp_mcp.py` | `lib/capabilities/image/transform` |
| `converter_mcp` (ffmpeg+Pillow universal converter) | `Servers/converter_mcp.py` | `lib/capabilities/format/convert` |
| `transcoder_mcp` (video transcode) | `Servers/transcoder_mcp.py` | `lib/capabilities/format/transcode-video` |
| `tts_mcp` (ElevenLabs + pyttsx3 fallback) | `Servers/tts_mcp.py` | `lib/capabilities/agent/tts-elevenlabs` |
| `vision_mcp` / `vision_perception_mcp` | `Servers/vision_*.py` | `lib/capabilities/agent/vision-describe` |
| `audio_mcp` / `sound_perception_mcp` | `Servers/audio_mcp.py`, `Servers/sound_perception_mcp.py` | `lib/capabilities/audio/analyze` |
| `media_mcp` (probe video/audio/image metadata) | `Servers/media_mcp.py` | `lib/capabilities/format/probe` |
| `ingest_mcp` (file staging glue) | `Servers/ingest_mcp.py` | `lib/capabilities/storage/ingest` |
| `aura_voiceprint_service` (ECAPA-TDNN speaker verification) | `python-services/aura_voiceprint_service.py` | `lib/capabilities/audio/voiceprint` (rename out of Aura) |
| `chatterbox_service` (OpenAI-compatible TTS) | `python-services/chatterbox_service.py` | `lib/capabilities/agent/tts-chatterbox` |
| `soundscape-engine` (Flask, text → ambient/music) | `engines/soundscape-engine/` | `lib/capabilities/audio/generate` (rename "Neo London") |

## Client-side libraries — drop straight into `services/` or `packages/`

These are JS/TS, no server needed. Could live as `services/<name>/`
source archive OR as a `packages/<name>/` workspace (if the site
ever becomes a real monorepo).

| Lib | Hangar path | Use |
|---|---|---|
| `softxels` | `tools/softxels/` | Three.js voxel renderer / world |
| `webgpu-marching-cubes` | `tools/webgpu-marching-cubes/` | WGSL marching cubes — pairs with `mesh-to-sdf` |
| `image-to-pixel` | `tools/Image-to-Pixel/` | Browser-native pixel-art converter |
| `pixelorama-kcentroid` (algorithm only) | `tools/pixelorama-kcentroid/` | Port the k-centroid palette algorithm to JS/Python |

## CPU-only Python tools — source archive

These don't need much. Migrate the source as a record; wrap with
FastAPI later if a Vercel-side caller appears.

| Tool | Hangar path | One-liner |
|---|---|---|
| `lithophane` | `tools/lithophane/` | Image → printable lithophane mesh |
| `image-to-stl` | `tools/image-to-stl/` | Image filaments → STL |
| `mesh-voxelization` | `tools/mesh-voxelization/` | C++ mesh → voxel grid (binary wrapper) |
| `nii2mesh` | `tools/nii2mesh/` | NIfTI volume → mesh (marching cubes) |
| `rembg-desktop` | `tools/rembg-desktop/` | Background removal (wrap `rembg` lib) |
| `pixeldetector` | `tools/pixeldetector/` | Pixel-art native resolution finder |

## DEFER (web-runnable but tricky)

| Service | Why defer |
|---|---|
| `TRELLIS` | Heavy weights, slow inference — provider stub before full migration |
| `ai-toolkit` (Flux LoRA training UI) | Closer to a job-runner desktop app |
| `AutoSeg-SAM2` | CUDA deps; bundle with lightpainting-forge when it moves |
| `astro-stacker` | CLI, not HTTP; wrap if asked |
| `aubio-beat-osc` | OSC protocol, not HTTP |
| `voxel2mesh` | Research code; conda env |
| `CUDA-Agent` | CUDA toolchain required |
| `OpenAgents` (full app) | Reference-only for agent UX patterns |
| `agent-starter-react-main` | Next.js app, not a service — reference pattern |
| `python-services/*` (Neo-London gateway) | MQTT-entangled; slice individual services out (already did chatterbox + voiceprint) |

## SKIP (not migrating)

| Why | Examples |
|---|---|
| Heavy GPU install + 100s GB weights | `engines/comfyui/` |
| Separate Vite app (not a service) | `Dolly_OS/`, `engines/OpenAgents/`, `engines/agent-starter-react-main/` |
| Desktop GUI app | `engines/blender5/`, `tools/vmagicmirror/`, `tools/blender-mcp-legacy/`, `tools/audio-reactive-led-strip/` |
| Hardware sensor bridges | `Servers/leap_ws_bridge`, `hardware_mcp`, `gaze_mcp`, `Azure_Kinect_py/`, `tools/azure-kinect-py/` |
| Character/story canon coupled to DollyOS | `Servers/gossip_mcp`, `consciousness_mcp`, `lore_mcp`, `mind_palace_mcp`, `panopticon_mcp`, `enforcer_mcp`, `crew_mcp`, `radioplay_mcp`, `magazine_mcp`, `curriculum_mcp`, `habituation_mcp`, `mannerism_engine`, `sentry_mcp`, `sieve_mcp`, `aura_soul/` |
| Asset / runtime data, not code | `Productions/` (Pixelorama .pxo), `Data/` (Qdrant snapshots), `Vtuber/` (VRoid/Luppet installs), `Lattice_Setup/dist/`, `References_DO_NOT_EDIT_OR_CHANGE/`, `_archive/`, `_legacy/`, `_intake_logs/`, `_merge-staging/` |
| Pruned / partial / dead | `engines/sillytavern/` (broken install), `engines/CubeComposer/` (CUDA-Agent family), `tools/ai-scripts/` (empty scaffolding), `tools/python-scripts/voice_to_create/` (empty) |

## White-label hotspots (apply consistently as you migrate)

- Header comments `Hangar Lattice Node: <Name>, Port: NNNN` → drop the "Hangar Lattice Node" prefix, keep the name + port
- `D:\The_Hangar\exports` default output paths → env-driven (`SERVICE_OUTPUT_DIR`)
- "Neo London …" branding → generic
- "Dolly's voiceprint" → "operator voiceprint"
- "Aura" prefixes on non-character services (voiceprint, etc.) → drop

## Pattern notes

- Every FastMCP server in `Servers/` mounts `sse_app` with CORS and
  defaults to `D:\The_Hangar\exports`. A shared launcher template
  would make all of these trivially containerizable for the
  Tailscale-funnel pattern.
- All image→mesh providers (TripoSR, HY-WU, Unique3D, InstantMesh,
  TRELLIS) should swap behind one capability — design
  `viz.image-to-mesh.ts` source-agnostic, just like `splat-generate.ts`.

## Workflow per migration

1. Read this entry + the source files
2. `mkdir services/<name>/`
3. Copy only the source files (no venv, no model weights, no run artefacts)
4. Strip `__pycache__`, `.venv`, etc.
5. Write `services/<name>/README.md` with: role, bench-local dev, Vercel-side capability, licence notes
6. White-label any "Hangar" references
7. Update the matching `lib/capabilities/*` docstring to point at `services/<name>/`
8. Add a row to the "Already migrated" section above
9. Remove the entry from "High value" / "Utility belt" / "Client-side" / "CPU-only Python tools"
