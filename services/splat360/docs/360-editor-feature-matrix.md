# 360 Video Editors — Feature Matrix + Competitive Analysis

Reference for the **Holoflow Studio Web 360 Editor** milestone: "better
than DJI Studio and Insta360 Studio, in the browser". Compiled
2026-05-15 from vendor docs + user-complaint threads.

## Full feature matrix

### Ingest / capture-side

| Feature | DJI Studio | Insta360 Studio | GoPro Quik/Player | Our target |
|---|---|---|---|---|
| OSV (DJI dual-fisheye) | ✅ proprietary | ❌ | ❌ | ✅ via ffmpeg + dji-osv-format skill |
| INSV / INSP (Insta360) | ❌ | ✅ proprietary | ❌ | ✅ via ffmpeg map streams |
| .360 (GoPro MAX EAC) | ❌ | ❌ | ✅ proprietary | ✅ via GPMF parser |
| MP4 equirect | ✅ | ✅ | ✅ | ✅ |
| DNG raw pairs | ✅ Avata/Osmo | ✅ Insta | ✅ Fusion .gpr | ✅ via rawpy |
| Theta / Kandao / Vuze input | ❌ | ❌ | ❌ | ✅ universal ingest |
| SRT / GPMF telemetry overlay | ✅ partial | ❌ | ✅ | ✅ both formats |
| LRF proxy auto-detect | ✅ | n/a | ✅ | ✅ |
| Multi-clip combine on timeline | ❌ (must re-export) | ✅ (added 2025) | ✅ | ✅ |

### Stitching

| Feature | DJI Studio | Insta360 Studio | GoPro | Our target |
|---|---|---|---|---|
| Dual-fisheye → equirect | ✅ proprietary blend | ✅ proprietary | ✅ EAC unwrap | ✅ ffmpeg v360 dfisheye + optional optical-flow seam blend |
| Seam-blending quality | high | high | high | **medium → high** (v0 ffmpeg, v1 optical-flow) |
| Live preview while stitching | ❌ (re-render) | partial | partial | ✅ WebGPU preview |
| Custom calibration override | ❌ | partial | ❌ | ✅ FOV / yaw / pitch / roll params |
| Per-clip stitch params | ❌ batch-equal | ❌ batch-equal | ❌ | ✅ per-clip |

### Reframing (the core 360 → flat output)

| Feature | DJI Studio | Insta360 Studio | GoPro Quik | Our target |
|---|---|---|---|---|
| Keyframe virtual camera (yaw / pitch / FOV) | ✅ "Virtual Gimbal" | ✅ | ✅ | ✅ |
| Bezier-tuneable keyframes | ❌ smoothness fixed | partial | partial | ✅ full curve editor |
| Auto-transition between keyframes | ✅ | ✅ | ✅ | ✅ |
| Tiny planet / sphere / crystal-ball | ❌ | ✅ multi-mode | partial | ✅ all modes via shader |
| Bullet time / orbit lock | ❌ | ✅ | ✅ CameraFx | ✅ |
| POV "see what I saw" mode | ❌ | ❌ | ✅ | ✅ |
| Aspect-ratio presets (16:9, 9:16, 1:1) | ✅ | ✅ | ✅ | ✅ |
| Custom aspect-ratio export | partial | ✅ | partial | ✅ |
| Phone-gyroscope playback control | ❌ | ❌ | ✅ "MotionFrame" | ✅ DeviceOrientation API |

### AI / automation

| Feature | DJI Studio | Insta360 Studio | GoPro | Our target |
|---|---|---|---|---|
| Subject tracking (basic) | ✅ ActiveTrack 360 | ✅ Deep Track | ✅ Object Tracking | ✅ + SAM 2 backbone |
| Re-acquire after occlusion | partial | ✅ Deep Track | partial | ✅ SAM 2 native |
| Multi-subject tracking | ❌ | partial | ❌ | ✅ |
| Auto-cut highlights | ❌ | ✅ AI Highlights | ✅ Quik auto | ✅ Whisper + scene detect |
| Speed ramp (TimeShift) | partial | ✅ | partial | ✅ |
| Pixel upscale (AI) | ❌ | ✅ Pixel Boost | ❌ | ✅ Topaz / RealESRGAN |
| Denoise (AI) | ❌ | partial | ✅ Advanced Denoise | ✅ |
| Auto-stabilize | ✅ partial | ✅ FlowState | ✅ HyperSmooth | ✅ |
| Horizon lock | ✅ | ✅ 360° Horizon Lock | ✅ | ✅ |

### Editing

| Feature | DJI Studio | Insta360 Studio | GoPro Quik | Our target |
|---|---|---|---|---|
| Timeline | basic | full | mobile | full |
| Transitions | 10 (some labeled in 中文) | full library | template-driven | unlimited (CSS animations + WebGPU) |
| Text overlays | ❌ | ✅ | ✅ | ✅ |
| Music / audio | basic | ✅ (after update) | ✅ | ✅ |
| Multi-track audio | ❌ | partial | ❌ | ✅ |
| Spatial audio (ambisonic) | ❌ | ❌ | ❌ | ✅ wedge feature |
| Color grading | basic LUT | full | filters | full + LUT import |
| Motion blur | ❌ | ✅ | ❌ | ✅ |
| Undo / redo stack | partial | ✅ (recent) | ✅ | ✅ |
| Project management | partial | ✅ (recent) | ✅ | ✅ |
| Batch export queue | ❌ | ✅ (recent) | ✅ | ✅ |

### Export

| Format | DJI Studio | Insta360 Studio | GoPro | Our target |
|---|---|---|---|---|
| MP4 / MOV | ✅ | ✅ | ✅ | ✅ |
| 8K HDR | ✅ | ✅ | ✅ | ✅ via WebCodecs |
| Equirect (re-export) | ✅ | ✅ | ✅ | ✅ |
| Cubemap faces (6× pinhole) | ❌ | ❌ | ❌ | ✅ for splat360 path C |
| **Gaussian Splat (.spz)** | ❌ | ❌ | ❌ | ✅ **the wedge** — pipe through splat360 |
| APMP (Apple Vision Pro) | ❌ | ❌ | ✅ GoPro Player only | ✅ |
| VR180 / VR360 sidecar metadata | partial | ✅ | ✅ | ✅ |
| GIF / WebP / animated thumb | ❌ | ✅ | ✅ | ✅ |
| Direct upload to social | partial | ✅ | ✅ | ✅ (Vercel routes) |

### Platform / workflow

| Aspect | DJI Studio | Insta360 Studio | GoPro Quik | Our target |
|---|---|---|---|---|
| Platform | Win + Mac desktop | Win + Mac desktop | Mobile + Mac (Player) | **Browser** (any OS) |
| Install required | ✅ | ✅ | ✅ | ❌ |
| Cross-vendor files | ❌ DJI only | ❌ Insta only | ❌ GoPro only | ✅ all formats |
| Public API / CLI | ❌ | ❌ | ❌ | ✅ REST + CLI |
| Multi-user collab | ❌ | ❌ | ❌ | ✅ shared sessions |
| Cloud-rendered | ❌ | partial | ✅ Quik cloud | ✅ via splat360 service |
| Source-open licence | ❌ | ❌ | ❌ | ✅ OSS-licensed components |
| Offline editing | ✅ | ✅ | partial | ✅ PWA + WebCodecs |

## What everyone is missing — the wedges

Five concrete gaps where none of the three competitors is good:

1. **Universal ingest.** DJI Studio refuses Insta360 files. Insta360 Studio refuses OSV. A browser editor that takes every 360-source format wins on universality alone.

2. **Splat export.** None of them produce a Gaussian Splat from a 360 capture. We already have `splat360` — the editor becomes the front-end to it, and "edit a 360 in the browser → splat lands at the end" is a workflow nobody else offers.

3. **Cross-vendor reframing.** Want to put an Avata 360 clip on a timeline next to an Insta360 X4 clip? You can't, in any current tool. A browser editor on WebCodecs does this trivially.

4. **Browser-native.** All three competitors are install-required desktop. A WebGPU-driven editor runs anywhere, no permissions, no sign-in for the basic flow. **70% browser support for WebGPU as of 2026** — the ceiling has lifted.

5. **API + CLI.** None of the three expose a programmable surface. Headless cloud editing, CI-pipeline reframing for an entire HoloWalk trail, automated thumbnail generation — all blocked by their GUI-only posture.

## Five things DJI Studio specifically gets wrong (user-reported)

- Cannot merge split in-flight files on the timeline
- Only 10 transitions, some labeled in Chinese
- No batch processing
- Buggy timeline on Mac (multi-second click latency)
- Refuses Insta360 files

## Five things Insta360 Studio specifically gets wrong

- Studio can't add music (until recent update; still partial)
- Stability issues on large files
- Vertical-video bias in some templates
- Limited advanced colour grading vs full NLEs
- Refuses DJI OSV

## Proposed scope — Milestone 1: "better than DJI + Insta360, in a browser"

### v0.1 scope (3-4 weeks of work to MVP)

**Core capabilities:**
1. **Ingest** — drag MP4 (equirect or dual-fisheye side-by-side), OSV, INSV, .360 onto the page. Parse with `ffmpeg.wasm` + custom OSV stream splitter (we already have the recipe in `dji-osv-format` skill).
2. **Stitch** — for OSV/INSV/dual-fisheye, run `v360 dfisheye:e` via ffmpeg.wasm in a Web Worker. Live preview via WebGPU shader.
3. **Reframe** — WebGPU shader that samples the equirect with a keyframed virtual camera. Yaw / pitch / FOV / aspect controls.
4. **Keyframe editor** — full Bezier curves (none of the competitors have this). Drag handles on a timeline.
5. **Export** — `WebCodecs.VideoEncoder` direct to MP4 client-side (no server round-trip for the basic flow).

**Stretch (v0.2, weeks 4-6):**
6. **Splat export pipeline** — "Generate splat" button POSTs the source to the existing splat360 service. The trained `.spz` lands next to the MP4.
7. **Subject tracking** — SAM 2 in the browser via Transformers.js, or server-side via a small FastAPI sidecar.
8. **APMP export** for Vision Pro.

### Architecture sketch

```text
┌─────────────────────────────────────────────────────┐
│ Browser (PWA, WebGPU + WebCodecs)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Ingest      │  │ Reframe shader│ │ Timeline UI│  │
│  │ (ffmpeg.wasm│→ │ (WebGPU)      │←│ + keyframes│  │
│  │  OSV split, │  │               │ │            │  │
│  │  v360 stitch)│ └──────────────┘  └────────────┘  │
│  └─────────────┘                                    │
│         ↓ direct MP4 export via WebCodecs           │
│  ┌────────────────────────────────────────────┐    │
│  │ Splat export button → POST to splat360     │    │
│  │ (Tailscale-fronted bench)                  │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
            ↓ shareable URL                ↓ .spz URL
       Cloudflare R2 / Vercel Blob   HoloWalk SculptureLocation
```

### Why we can ship this

- **You already own all the parts**: ffmpeg.wasm patterns, the splat360 service, the OSV-stream-splitter recipe, the WebGPU stack via three.js, the Vercel Next.js deployment surface.
- **Browser support is mature**: 70% WebGPU coverage on desktop, WebCodecs in every modern Chromium + Safari 17.
- **Reference implementations exist**: MasterSelects and KubeezCut both ship full multi-track NLE in the browser via WebGPU. KubeezCut is OSS — read its WebCodecs encoder loop.

### Why it's defensible

The DJI / Insta360 / GoPro lock-in is the moat for *them*. The browser editor that breaks all three locks is the wedge for *you*. Combined with the splat360 differentiator (no other editor produces splats), this isn't a feature parity play — it's a category move.

## Sources

- [DJI Avata 360 ProVideo Coalition review (post-prod features)](https://www.provideocoalition.com/review-dji-avata-360/)
- [DJI Fly Avata 360 update (DJI Fly + DJI Studio reframing)](https://dronedj.com/2026/03/27/dji-fly-avata-360-drone/)
- [Insta360 Studio major update (Deep Track, TimeShift, project mgmt)](https://www.insta360.com/blog/news/insta360-studio-major-update)
- [Insta360 Studio missing features thread](https://forums.insta360.com/section/14/post/6203/)
- [DJI Studio reddit / forum complaints](https://greyarro.ws/t/dji-studio-questions-answers-and-tips/109867)
- [GoPro Quik 360 reframe (ReFrame, MotionFrame, CameraFx)](https://gopro.com/en/us/news/two-new-360-editing-tools-to-the-quik-app)
- [GoPro Player APMP for Vision Pro](https://gopro.com/en/us/news/gopro-announces-updated-max-360-camera-and-quik-reframe-editing)
- [MasterSelects WebGPU video editor (reference architecture)](https://www.webgpu.com/showcase/masterselects-webgpu-video-editor/)
- [KubeezCut — full browser NLE via WebGPU + WebCodecs](https://dev.to/sebyx07/i-built-a-free-browser-video-editor-with-webgpu-webcodecs-optional-ai-generation-2eo0)
- [Boris FX 360 editing guide 2026](https://borisfx.com/blog/360-video-editing-guide/)
- [WebGPU vs WebGL 2026 browser support](https://cybermaxia.com/en/blog/webgpu-vs-webgl-browser-2026-render-game-konsol)
