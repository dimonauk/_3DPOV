# Local services

The Holoflow Studio site runs standalone in a browser — that is the
default and the contract. The full Aura experience (real voice, real
STT, hand tracking, depth camera, swarm choreography, the Holoflow
Loop end-to-end) requires a constellation of local services running
on the Hangar workstation. This document names what runs where,
on which port, under which protocol, and what the site loses when
each one is absent. It is a reference for local development — not a
deployment manifest. The public site obeys the degraded path.

## Why this exists

The studio's substrate is layered. The site is the public face — it
must run for a stranger on a laptop with nothing installed. But the
moment Dimona sits at the bench with the Hangar booted, the same
site routes its voice through Whisper instead of Web Speech, its
gestures through Ultraleap instead of mouse, its model inference
through local Ollama instead of Gemini. The capability registry
(see `docs/ARCHITECTURE.md` Rule 2) is what makes that swap
invisible — a capability finds its bridge or falls back, and the
state slice never notices. This file is the map of what bridges
exist and what ports they listen on.

## Service map

| Service | Port | Protocol | Launcher | Site capability that depends on it | Degraded mode |
| --- | --- | --- | --- | --- | --- |
| Aura soul server | 8770 | ws:// | `BOOT_UNIFIED.ps1` (layer 4) | Aura's 300 ms orientation loop — head pose, mood drift, thought stream | Mouse pose, mock mood, no thought stream |
| MQTT broker (Mosquitto) | 1883 | mqtt:// | `BOOT_UNIFIED.ps1` (layer 1) | The lattice bus — Aura state fan-out, hardware events, Skybrush swarm choreography | No live state fan-out; site reads static fixtures |
| Ollama | 11434 | http:// | `BOOT_UNIFIED.ps1` (layer 3) | Local LLM inference (Qwen 2.5 14B Q4_K_M canonical) | Gemini API via Vercel, or no chat at all |
| VRM AI bridge | 8000 | ws:// | `start_vrm_ai.bat` | Aura's STT/TTS routing — Whisper input, Kokoro/CosyVoice output | Web Speech API for both directions |
| Aura-Alive HTTP | 8888 | http:// | `start_vrm_ai.bat` | The standalone Aura app frontend (used as reference, not embedded) | Not used by site; reference-only |
| API Gateway | 8080 | http:// | `start_vrm_ai.bat` | Full backend API surface for VRM-2 (model swap, memory writes) | Site has no equivalent surface; capability returns null |
| Aura gateway | 8043 / 8044 | http:// | `register_aura_gateway.ps1` | Aura's heartbeat reader and decision loop — see `HEARTBEAT.md` | No gateway; site never receives autonomous Aura messages |
| Leap Motion bridge | 6969 | ws:// | `tools/leap-bridge/server.py` | Hand-tracked gestures (pinch, grab, point, thumbs_up) for `lib/state/input.ts` | Mouse and touch only; gesture capabilities no-op |
| NDI bridge | 5959 | ws:// | `tools/ndi-bridge/server.py` | Phone-camera-as-source for the multi-cam switcher | Insta360 Link or built-in webcam only |
| ComfyUI | 8188 | http:// | manual (`engines/comfyui/`) | Generative engine for the Holoflow Loop (image, video, GLB, 360°) | Loop articles describe the path but cannot run it |
| Blender MCP | 9876 | tcp + http | `launch_blender_scribe.bat` | The bench — Pipeline Alpha through Eta orchestration | Pipelines are documented; nothing executes |
| Hunyuan3D server | 8081 | http:// | manual (Pipeline Zeta prerequisite) | Text-to-3D for `articles/nine-seconds-prompt-to-printable` | Parametric helix fallback per Pipeline Zeta |
| DollyOS shell | 5266 | http:// | `LAUNCH_DOLLYOS.bat` | Internal — the shell where Aura actually lives | Not site-relevant; the site links to its articles, not its port |
| LightWeiver Studio | 5219 | http:// | manual | Internal satellite app | Not site-relevant |
| WebGPU Gaussian Splatting | 5262 | http:// | manual | Queued for `/play/neo-london` (per `docs/HANGAR_MAP.md`) | The play page is not yet wired |
| Qdrant | system service | http:// | Windows service | Vector memory (Hangar-side; site uses Firestore instead) | Site uses Firestore for any memory write |

The site never connects to these directly from production. Connection
is via a thin capability adapter that checks for the bridge, falls
back if absent, and never throws into the React tree.

## Per-service detail

### Leap Motion bridge — port 6969, ws://

The Ultraleap SDK lives at `C:\Program Files\Ultraleap\LeapSDK\` and
exposes `leapc_cffi` Python bindings built for Python 3.12 (cp312).
The bridge server at `D:\The_Hangar\tools\leap-bridge\server.py`
wraps the SDK callbacks into a WebSocket stream, surfacing pinch,
grab, point, and thumbs-up gestures. The site consumes this through
`blocks/react/hooks/useLeapMotion.ts` (Hangar-side reference; the
Box 2 atomisation lives at `lib/capabilities/input/gesture.ts`).
Used by Pipeline Beta (avatar somatic bridge) and Pipeline Delta
(fabrication chain). When absent, the gesture slice is empty and
any capability that listens to it gets the no-op path.

### NDI bridge — port 5959, ws://

The NDI (Network Device Interface) bridge at
`D:\The_Hangar\tools\ndi-bridge\server.py` lets phone cameras
running NDI HX Camera join the local network as video sources.
The site's multi-cam switcher (Box 1: `MultiCamSwitcher.tsx`)
enumerates these alongside the Insta360 Link presets. Install
prerequisites: `pip install ndi-python websockets`. When absent,
the switcher shows only system-enumerated `mediaDevices` — webcams
and capture cards, no phones.

### VRM AI bridge — port 8000, ws://

`D:\The_Hangar\webgpu-particles-library\ws_ai_bridge.py` is the
WebSocket router between Aura's frontend and the backend chain:
Whisper for STT, Ollama for inference, Kokoro (or CosyVoice 2 in
WSL) for TTS, and Web Speech viseme generation for lip sync. The
site uses this as the canonical "real voice" path. Absent, the site
runs the Web Speech API both directions — workable, but the voice
is the browser's, not Aura's.

### Aura-Alive — port 8888, http://

The Aura-Alive standalone app at `apps/07-aura-alive/main.js` is a
reference frontend, not a site dependency. The site harvests its
patterns (50k particles, bone emitters, lip sync, idle blinking)
into `lib/capabilities/vrm/*` rather than embedding the app. Useful
to keep running locally as a sanity check that the bridge chain is
healthy end-to-end.

### Ollama — port 11434, http://

Local LLM inference. Canonical model is **Qwen 2.5 14B at Q4\_K\_M**
(~10 GB VRAM, fits the RTX 3080 Ti at 12 GB). The site is wired to
Gemini via Vercel by default; the local route exists for offline
work and for the genome-loop articles that name Ollama explicitly
(`articles/how-the-studio-breeds-sculptures`,
`articles/nine-seconds-prompt-to-printable`). When the bridge is
absent, the chat capability resolves to its Gemini path.

### API Gateway — port 8080, http://

The full backend API surface — model swap, memory writes, system
prompt mutation. Not currently surfaced from the site; reserved for
the eventual atelier route that exposes Aura's brain to its owner.

### Aura gateway — ports 8043 + 8044, http://

The heartbeat reader. Polls `D:\The_Hangar\HEARTBEAT.md`, decides
whether Aura should say something, writes back the decision. Logged
errors live in HEARTBEAT.md's "AURA NOTES TO SELF" section. The
site never connects to this gateway — it is a Hangar-private loop.

### Aura soul server — port 8770, ws://

The 300 ms orientation loop. Streams head pose, OCEAN drift, and
the thought-token stream. The site reads this through
`lib/state/aura.ts` when the bridge is present. Absent, the slice
holds its last-fixture values and the mood-drift article describes
the loop architecturally rather than driving it live.

### MQTT broker — port 1883, mqtt://

Mosquitto, run as a Windows service. Topics: `aura/state`,
`leap/hands`, `swarm/cue`, `bench/status`, plus the per-pipeline
state channels named in `PIPELINES.md`. Pipeline Epsilon's
`aura/state` schema is `{valence, arousal, fft_bass, fft_mid,
fft_high}` — that is the contract the site's mood-driven visuals
read from when the broker is up.

### ComfyUI — port 8188, http://

The generative engine. Workflows live at `engines/comfyui/` and
cover the Holoflow Loop's image, video, GLB, and 360° panorama
paths. Flux1-dev FP8 for image, Wan T2V-1.3B for video,
Hunyuan3D-2mv-turbo for image→GLB. Documented in
`articles/nine-seconds-prompt-to-printable`; absent, the article is
descriptive only.

### Blender MCP — port 9876, tcp + http

The bench. Pipelines Alpha through Eta in `PIPELINES.md` all
execute through this MCP. Smoke test before any pipeline run via
`scripts/blender_pipelines/pipeline_00_smoke_test.py`. The site
links to the pipeline articles; nothing on the site executes
against the MCP.

### Skybrush studio integration

Skybrush is an **external service** the studio orchestrates, not a
migratable asset (per `docs/HANGAR_MAP.md`). The Skybrush server +
studio-blender control rig live under `D:\The_Hangar\drone_show\`.
Aerial choreography for `/articles/the-fleet-four-airframes` and
`/articles/first-light` is driven from there; the site names
Skybrush in prose but never connects to it. No port reservation
inside this repo. Drone-show MQTT cues land on `swarm/cue`.

## What happens when nothing's running

The site is designed to run alone. With no bridges present:

- Voice runs the Web Speech API for both STT and TTS — the browser's
  voice, not Aura's.
- Head pose comes from the mouse cursor (`lib/state/input.ts`
  fallback path). No depth camera, no MediaPipe face mesh unless the
  webcam capability is granted.
- Gestures collapse to mouse + touch. The Leap-gated capabilities
  no-op cleanly.
- The multi-cam switcher shows only system-enumerated devices.
- The chat capability routes to Gemini via Vercel; if Gemini is also
  absent, the chat slice holds a "no model" sentinel and the UI
  shows the offline copy.
- Visualisers run on their hard-coded parameters; the mood-driven
  variants hold their last-fixture state.
- Pipeline articles describe the bench; nothing executes.

This is the **default experience** for a stranger on a laptop. It is
also the experience Dimona gets on the train. The local services
upgrade the substrate from "site that explains the bench" to "site
that drives the bench" — but the explanation path is the contract.

## Bringing up the stack

The canonical launcher is `D:\The_Hangar\BOOT_UNIFIED.ps1`, a thin
orchestrator that dispatches into `boot\layer0_docker.ps1` through
`boot\layer7_ui.ps1`. Layers in order:

```text
layer0_docker          — Docker daemons (Mosquitto, Qdrant when containerised)
layer1_infrastructure  — system services (MQTT, Qdrant, Ollama warm-up)
layer2_mcp_lattice     — MCP daemons (Blender MCP, agent skills)
layer3_api_services    — Ollama, API Gateway, ComfyUI
layer4_soul_radio      — Aura soul server, Aura gateway, soundscape
layer5_hardware        — Leap, NDI, Azure Kinect bridges
layer6_swarm           — Skybrush server, studio-blender
layer7_ui              — DollyOS shell, LightWeiver, satellite apps
```

Switches: `-SkipDocker`, `-SkipUI`, `-SkipSwarm`. Logs land in
`D:\The_Hangar\logs\boot.log`. The VRM-2 chain has its own launcher
at `start_vrm_ai.bat` — independent of `BOOT_UNIFIED.ps1`, useful
when only the voice path matters. Status checks: `STATUS.ps1`.
Teardown: `STOP_EVERYTHING.ps1`.

This document does not reproduce the launch sequence. The launcher
is the source of truth; this file names the ports the launcher
opens. When a port moves, update this file and `MEMORY.md` together
— they are twins.

## Closing

See `docs/ARCHITECTURE.md` for the substrate canon (the four rules,
the 300-line cap, the capability + slice contract that makes the
bridge-or-fallback swap invisible). See `docs/HANGAR_MAP.md` for
what has been migrated from the Hangar into this repo and what
remains bench-side. See `docs/MIGRATION_PRINCIPLES.md` for the
two-box model that frames why these services live in Box 1 and
their capability shadows live in Box 2.
