# HoloFlow System Map

Catalog of what's where across the studio's working code, and which
parts of the Hangar are now ported into the website (or queued to be).
Compiled 2026-05-15.

## The three boxes

```text
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ BOX 1 — The Hangar      │  │ BOX 2 — Holoflow site   │  │ BOX 3 — Open source     │
│ (Sovereign-PC, local)   │  │ (Vercel, public)        │  │ (GitHub, registries)    │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ splat360                │  │ /studio                 │  │ COLMAP, GLOMAP          │
│ comfyui                 │  │ /holo-walk              │  │ OpenSfM, hloc           │
│ sharp-onnx              │  │ /aura                   │  │ AliceVision (Meshroom)  │
│ ollama                  │  │ /atelier                │  │ nerfstudio + gsplat     │
│ DJI Studio (proprietary)│  │ /pipelines              │  │ Brush, OpenSplat        │
│ Insta360 Studio (prop.) │  │ /capabilities (registry)│  │ 3dgsconverter           │
│ Postshot (proprietary)  │  │ /studio (NEW)           │  │ SuGaR, Niantic SPZ      │
│ DaVinci Resolve         │  │ HoloScan iPad app (NEW) │  │ mkkellogg/Spark         │
│ Looking Glass display   │  │                         │  │ ffmpeg, ExifTool        │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

The migration discipline (from `lib/capabilities/_base.ts`): anything
entering Box 2 from Box 1 or Box 3 has to atomise to the
`CapabilityRecord` shape. The 41 currently-registered capabilities
include everything the site needs to operate; the unregistered Box 1
material is what we're porting next.

## Box 1 — what runs locally on Sovereign-PC

| Service / app | Port | Use | Bridge into Box 2 |
|---|---|---|---|
| **splat360** | 8390 | 360-camera → Gaussian Splat training | `useHoloFlowDesktop()` + `viz.splat-generate-360` |
| **comfyui** | 8188 | Flux / Wan / Hunyuan3D / SDXL-360 / Flux-equirect | `viz.generate-comfyui` (NEW, foundation stub) |
| **sharp-onnx** | 7845 | Single image → splat (Apple SHARP) | `viz.splat-generate` provider `sharp-onnx` |
| **ollama** | 11434 | Local LLM (Llama / Qwen / Phi) on RTX 3080 Ti | `agent.dialogue-ollama` (NEW, foundation stub) |
| **DJI Studio** | (app) | OSV → equirect stitch with seam blend | Manual; runs on operator's desktop |
| **Insta360 Studio** | (app) | INSV → equirect stitch with seam blend | Manual; same |
| **Postshot** | (app) | Splat trainer (commercial-friendly) | `viz.splat-generate` provider `postshot` |
| **DaVinci Resolve** | (app) | Pro video editing; has splat support since v19.x | Hand-off; no in-site integration |
| **Looking Glass Bridge** | (app) | Holographic display rendering | M5 territory; not yet wired |

## Box 2 — Holoflow site capability surface

41 capabilities registered in `lib/capabilities/index.ts`. New as of
2026-05-15:

| Capability | Where it ports from | Status |
|---|---|---|
| `viz.splat-generate-360` | Hangar splat360 service | stub registered |
| `viz.splat-ar-deploy` | Studio composite | stub registered |
| `viz.generate-comfyui` | Hangar ComfyUI workflows | stub registered |
| `agent.dialogue-ollama` | Hangar Ollama instance | stub registered |

These join the existing surface — 12 Aura-Alive vrm/audio/motion atoms,
6 splat-track vizes, 3 commerce, plus geo / ar / media / agent.

## The bench-bridge pattern (Box 1 ↔ Box 2)

Every Box 1 service that reaches the Vercel-deployed site uses the
same pattern (per the `holoflow-bench-bridge` skill):

```text
holoflow.co.uk  ⟶ Tailscale Funnel ⟶ chonky.tail99b2a4.ts.net:<port> ⟶ Sovereign-PC service
            ↑                                                         ↓
        bearer auth token shared via Vercel env + local .env
```

Server-side capabilities (`*.server.ts`) read `*_SERVICE_URL` +
`*_AUTH_TOKEN` env vars. Examples already shipped:

- `SHARP_ONNX_SERVICE_URL` / `SHARP_ONNX_AUTH_TOKEN`
- `SPLAT360_SERVICE_URL` / `SPLAT360_AUTH_TOKEN` (next wire)
- `COMFYUI_SERVICE_URL` / `COMFYUI_AUTH_TOKEN` (next wire)
- `OLLAMA_SERVICE_URL` / `OLLAMA_AUTH_TOKEN` (next wire)

When a visitor has HoloFlow Desktop installed locally, the same calls
hit `localhost:<port>` instead — `useHoloFlowDesktop()` returns the
right URL.

## Box 3 — OSS adopted into Box 1

Per `splat360/install/README.md` + `splat360/docs/already-installed-tools.md`:

| OSS | Where it lives | What it does in our stack |
|---|---|---|
| COLMAP | `D:\Tools\splat360-deps\colmap\` | Primary SfM |
| GLOMAP | `D:\Tools\splat360-deps\glomap\` | Faster SfM alternative |
| OpenSfM | (Docker pending) | Spherical SfM for path B |
| hloc | (sidecar venv) | Learned features (SuperPoint) |
| AliceVision / Meshroom | `D:\Tools\splat360-deps\meshroom\` | Quality oracle SfM |
| nerfstudio | splat360 venv | Splatfacto trainer |
| Brush | `D:\Tools\splat360-deps\brush\` | Rust splat trainer |
| OpenSplat | (build from source) | AGPL C++ trainer |
| 3dgsconverter | splat360 venv | PLY / KSplat / SPZ / SOG converter |
| SuGaR | (build pending) | Splat→mesh→USDZ for iOS AR |
| Niantic SPZ | (CLI install) | 10× smaller splat format |
| ffmpeg | winget Gyan.FFmpeg | Video frame extraction + v360 stitch |
| ExifTool | `D:\Tools\splat360-deps\exiftool\` | DJI telemetry / EXIF |
| mkkellogg/GaussianSplats3D | Holoflow `package.json` | Three.js splat renderer (client) |

## Cross-system integration map

```text
                              ┌──────────────────┐
                              │ User capture     │
                              │ (Avata 360, Osmo,│
                              │  Insta360, iPad) │
                              └──────────────────┘
                                       │
                                       ↓ files
                              ┌──────────────────┐
                              │ HoloScan iPad    │ (Box 2 — native iOS app, scaffolded)
                              │ → uploads bundle │
                              └──────────────────┘
                                       │
                                       ↓ over HTTPS
                              ┌──────────────────┐
                              │ HoloFlow Desktop │ (Box 1 — splat360 + installer)
                              │ (splat360 :8390) │ ← USB ingest also lands here
                              │ Routes to SfM +  │
                              │ trainer of choice│
                              └──────────────────┘
                                       │
                                       ↓ .spz / .ksplat / .usdz / transforms.json
                              ┌──────────────────┐
                              │ Vercel Blob       │ (Box 3 — storage)
                              │ + Firestore       │
                              │   (media library) │
                              └──────────────────┘
                                       │
                                       ↓ public URLs
                  ┌────────────────────┼────────────────────┐
                  ↓                    ↓                    ↓
        /studio (edit)        /holo-walk (visit)     /atelier (sell)
        /holo-walk/[id]/ar   /holo-walk/[id]/qr      print-bar in-viewer
        (magic-window AR)    (printable signage)     (drop-ship 3D-prints)
```

## What's pending registration / wiring

These are real code paths in Box 1 that haven't been atomised yet:

| Capability | Box 1 artefact | Notes |
|---|---|---|
| `viz.looking-glass-quilt` | LG quilt renderer | Requires LG Bridge on operator's machine |
| `viz.blender-pipeline` | Hangar `Dolly_OS/scripts/blender/*` | Four MCP-triggered pipelines (per blender-pipelines skill) |
| `agent.dialogue.gemini` (formal split) | Existing `agent.dialogue` | Currently un-namespaced; should suffix when Ollama lands |
| `media.scaniverse-import` | iOS Scaniverse export | TestFlight access required |
| `ar.lightship-vps` | Niantic VPS SDK | Decision: build VPS-lite or buy Niantic? |
| `commerce.stripe-checkout` | Stripe Connect | Replaces the mocked synchronous quote |

## Strategic sequencing reminder

From `hosting-platforms-landscape.md`: the absorption order is M1
(web 360 editor) → M2 (host) → M3 (in-place edit) → M4 (panorama
tour) → M5 (outdoor trails) → M6 (mobile capture) → M7 (USDZ) → M8
(print-drop-ship) → M9 (geo-anchor) → M10 (no-code 3D).

The four capabilities ported today (splat-generate-360,
splat-ar-deploy, generate-comfyui, dialogue-ollama) are the connective
tissue M1 needs — they make the studio editor usable end-to-end on
top of the Hangar bench services.
