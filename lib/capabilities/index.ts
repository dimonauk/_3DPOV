/**
 * lib/capabilities/index.ts — The capability registry.
 *
 * Every callable atom in the studio registers here. The /capabilities
 * route reads from this index. The terminal /run command resolves
 * targets through this index. The evolution engine consults this
 * index to know what is breedable.
 *
 * Wave 0 (this commit): scaffold only — no capabilities registered
 * yet. The 12 Aura-Alive entries below are declared as `stub` status
 * so the /capabilities route can render the surface before
 * atomisation lands.
 *
 * Wave 1: atomise Aura-Alive (see docs/CAPABILITY_REGISTRY_PLAN.md).
 * Wave 2: lift Pipeline Epsilon engines from `merrypranxter/strange_attractors`.
 * Wave 3: lift agent-memory pattern from `AkshitIreddy/Interactive-LLM-Powered-NPCs`.
 *
 * Adding a capability: create `lib/capabilities/<kind>/<verb>.ts`,
 * declare its public surface, then add a `register({...})` call
 * here pointing at it with a lazy `load: () => import("./<kind>/<verb>")`.
 */

import { register, type CapabilityRecord } from "./_base";

export * from "./_base";

// ---------- Wave 1: Aura-Alive atomisation (all stub) ----------

const auraAliveStubs: CapabilityRecord[] = [
  {
    id: "vrm.load",
    kind: "vrm",
    name: "VRM loader",
    summary:
      "Parse a .vrm file from a URL into a typed handle registered in the vrm slice. Standard cleanup pass on load.",
    status: "registered",
    source:
      "@pixiv/three-vrm canonical loader + Hangar webgpu-particles-library/apps/07-aura-alive/main.js VRM mount",
    load: () => import("./vrm/load"),
    stateSlices: ["vrm"],
  },
  {
    id: "vrm.bones.pose",
    kind: "vrm",
    name: "Bone pose driver",
    summary:
      "Write a PoseVector (named or supplied) to the vrm slice. Ships Aura's hostess-superheroine-brat held default in the named-pose library.",
    status: "registered",
    source: "Studio — named-pose library; Hangar aura-alive bone-emitter shape",
    load: () => import("./vrm/pose"),
    stateSlices: ["vrm"],
    dependsOn: ["vrm.load"],
  },
  {
    id: "vrm.expressions.blend",
    kind: "vrm",
    name: "Expression blend",
    summary:
      "Reads visemes + mood, writes merged expression weights to the vrm slice. Owns the mouth (aa/ee/ih/oh/ou) and face (happy/surprised/angry/relaxed/sad) slots; preserves blink and other keys.",
    status: "registered",
    source: "Studio blend layer + Hangar aura-alive lipsync timing as shape",
    load: () => import("./vrm/expression"),
    stateSlices: ["vrm", "audio", "aura"],
    dependsOn: ["vrm.load", "audio.visemes"],
  },
  {
    id: "vrm.lookAt",
    kind: "vrm",
    name: "Look-at target",
    summary:
      "Drive head + eye orientation toward a target — point in space or another VRM handle. Slice write only; VRMAvatar applies via three-vrm's lookAt module.",
    status: "registered",
    source: "Studio slice-driven look-at + @pixiv/three-vrm lookAt module",
    load: () => import("./vrm/look-at"),
    stateSlices: ["vrm"],
    dependsOn: ["vrm.load"],
  },
  {
    id: "audio.stt",
    kind: "audio",
    name: "Speech-to-text",
    summary:
      "Microphone stream → transcript chunks in the audio slice. Web Speech baseline; Whisper provider slot stubbed for later.",
    status: "registered",
    source: "Browser Web Speech Recognition API + Hangar VRM 2 AI System provider shape",
    load: () => import("./audio/stt"),
    stateSlices: ["audio"],
  },
  {
    id: "audio.tts",
    kind: "audio",
    name: "Text-to-speech",
    summary:
      "Provider-agnostic TTS entry point. Web Speech baseline; ElevenLabs / F5 / Kokoro siblings plug into the same speak() surface.",
    status: "registered",
    source: "Browser Web Speech API + Hangar VRM 2 AI System provider shape",
    load: () => import("./audio/tts"),
    stateSlices: ["audio"],
  },
  {
    id: "audio.visemes",
    kind: "audio",
    name: "Viseme stream",
    summary:
      "Text + duration → time-aligned viseme stream, walked by a rAF cursor that writes the active viseme to audio.visemes. v0.1 estimates from text characters; provider-buffer analysis lands behind the same start() API later.",
    status: "registered",
    source: "Studio character-class viseme estimator + Hangar aura-alive timing shape",
    load: () => import("./audio/visemes"),
    stateSlices: ["audio"],
    dependsOn: ["audio.tts"],
  },
  {
    id: "audio.lipsync-analysis",
    kind: "audio",
    name: "Lipsync analysis",
    summary:
      "AnalyserNode + formant detection + RMS → real-time viseme stream from an actual audio source. Ready for when ElevenLabs/Kokoro/F5 wire in; uses the same audio.visemes slot as the text-based estimator.",
    status: "registered",
    source:
      "Hangar: apps/aura-vrm/src/features/lipSync/lipSync.ts (AnalyserNode + formant + RMS). Atomised per docs/MIGRATION_PRINCIPLES.md.",
    load: () => import("./audio/lipsync-analysis"),
    stateSlices: ["audio"],
    dependsOn: ["audio.tts"],
  },
  {
    id: "motion.idle",
    kind: "motion",
    name: "Idle motion",
    summary:
      "Layers slow breath + periodic blink + micro hip-shift on top of the baseline pose. Modulation amplitude + cycle rate scale with Aura's mood.",
    status: "registered",
    source: "Studio idle loop; Hangar aura-alive idle loops as shape reference",
    load: () => import("./motion/idle"),
    stateSlices: ["vrm", "aura"],
    dependsOn: ["vrm.load", "vrm.bones.pose"],
  },
  {
    id: "motion.gesture",
    kind: "motion",
    name: "Triggered gesture",
    summary:
      "Triggers a transient named gesture (wave, nod, shrug, point) — eases baseline → peak → baseline on vrm.poses. Additive with motion.idle; never fights breath/blink.",
    status: "registered",
    source: "Studio gesture library + Aura character mapping (POSES.welcomeWave style)",
    load: () => import("./motion/gesture"),
    stateSlices: ["vrm"],
    dependsOn: ["vrm.load", "vrm.bones.pose"],
  },
  {
    id: "motion.laban",
    kind: "motion",
    name: "Laban effort extractor",
    summary:
      "Kinematic extraction (Space × Time × Weight × Flow) over pose samples + named-move blending + move-id → PoseVector resolution. Headless, pure functions; consumes the lib/cast/move-library catalogue.",
    status: "registered",
    source:
      "Hangar: apps/prototypes/poi-sculptor/choreography_engine.js (EFFORT canon) + move_library/cross/MOVE.md (Laban table) + docs/THE_LIVING_STAGE.md §II (flirt-dial framing). Atomised per docs/MIGRATION_PRINCIPLES.md.",
    load: () => import("./motion/laban"),
    stateSlices: [],
    dependsOn: [],
  },
  {
    id: "agent.banter",
    kind: "agent",
    name: "Banter runtime",
    summary:
      "Multi-character LLM banter driven by live telemetry. Returns a 1-3 line exchange between named cast members. Throttle hint via tickMs.",
    status: "registered",
    source:
      "Hangar: apps/prototypes/neo-london-chrono-protocol/services/geminiService.ts (SYSTEM_INSTRUCTION + 12s tick canon). Atomised per docs/MIGRATION_PRINCIPLES.md.",
    load: () => import("./agent/banter"),
    stateSlices: ["agent", "cast", "aura"],
    dependsOn: [],
  },
  {
    id: "agent.dialogue",
    kind: "agent",
    name: "Dialogue runtime",
    summary:
      "One LLM turn per call. Loads character bible + history, returns text + intent + chosen ChronoMode, threads writes through agent + cast + aura slices. Gemini provider baseline.",
    status: "registered",
    source: "Gemini SDK + studio bible pattern; Hangar ws_ai_bridge.py as shape reference",
    load: () => import("./agent/dialogue"),
    stateSlices: ["agent", "cast", "aura"],
  },
  {
    id: "agent.memory",
    kind: "agent",
    name: "Conversational memory",
    summary:
      "Retrieval over cast.history. v0.1 Jaccard overlap; v0.2 will swap embeddings behind the same surface. recallRecent + recallRelevant + formatForPrompt.",
    status: "registered",
    source: "Studio retrieval layer; Box 3 AkshitIreddy/Interactive-LLM-Powered-NPCs pattern for the embedding upgrade path",
    load: () => import("./agent/memory"),
    stateSlices: ["cast"],
  },
  {
    id: "input.headpose",
    kind: "input",
    name: "Head pose",
    summary:
      "Yaw / pitch / roll vector for the active viewer. WebXR → MediaPipe → Mouse → Touch → Neutral priority chain. v0.1 implements mouse-fallback only.",
    status: "registered",
    source: "Mouse-fallback baseline + future MediaPipe Tasks Vision + WebXR head-pose",
    load: () => import("./input/headpose"),
    stateSlices: ["input"],
  },
  {
    id: "viz.light-sculpture",
    kind: "viz",
    name: "Light sculpture",
    summary:
      "Animated long-exposure trajectory renderer. Composes viz.attractor over time — a head cursor walks the trajectory, a fading tail trails behind. The HoloWalk sculpture format.",
    status: "registered",
    source: "Studio composition over viz.attractor; HoloWalk flagship rendering.",
    load: () => import("./viz/light-sculpture"),
    stateSlices: ["viz"],
    dependsOn: ["viz.attractor"],
  },
  {
    id: "geo.position",
    kind: "geo",
    name: "Geolocation + heading",
    summary:
      "GPS watcher + compass heading writer (webkitCompassHeading on iOS; alpha on Android). Permission-gated via DeviceOrientationEvent.requestPermission() for iOS. Foundation for the HoloWalk outdoor AR trail.",
    status: "registered",
    source: "Browser Geolocation API + DeviceOrientationEvent + iOS permission-gate dance.",
    load: () => import("./geo/position"),
    stateSlices: ["geo"],
  },
  {
    id: "ar.window",
    kind: "ar",
    name: "Magic-window AR",
    summary:
      "Camera stream + GPS-locked world transform for the HoloWalk AR view. requestCameraStream + attachStreamToVideo + releaseStream + computeARTransform (haversine + ENU + heading rotation). Pure math + browser-API helpers.",
    status: "registered",
    source: "Studio — getUserMedia + DeviceOrientation composition + WGS84 ENU math. Works on iOS Safari + Android Chrome today without WebXR.",
    load: () => import("./ar/window"),
    stateSlices: ["geo"],
    dependsOn: ["geo.position"],
  },
  {
    id: "media.capture",
    kind: "media",
    name: "Photo + video capture",
    summary:
      "Composite camera + overlay canvas into JPEG/PNG photo or MP4 video via Mediabunny. Share via navigator.share with file-download fallback. Hardware-accelerated H.264 on iOS Safari 26+ via WebCodecs.",
    status: "registered",
    source: "Box 3: Mediabunny (MPL-2.0, supersedes mp4-muxer / webm-muxer) + Web Share API + canvas 2D composite. The iOS-Safari MP4-capture solve.",
    load: () => import("./media/capture"),
  },
  {
    id: "viz.depth-estimation",
    kind: "viz",
    name: "Depth estimation",
    summary:
      "Depth Anything V2 small via Transformers.js, WebGPU when available, WebGL/WASM fallback. probeDepthSupport gates the user-facing button so iOS Safari without WebGPU never starts a 50MB download for an unusable path.",
    status: "registered",
    source: "Box 3: Depth Anything V2 (Apache-2.0) + @huggingface/transformers (Apache-2.0). Atomised per docs/MIGRATION_PRINCIPLES.md.",
    load: () => import("./viz/depth-estimation"),
  },
  {
    id: "viz.stereo-pair",
    kind: "viz",
    name: "Stereo pair",
    summary:
      "Pure-math depth-warp: image + depth map → left/right ImageData pair. IPD-baseline driven, depth-weighted horizontal shift, simple horizontal hole-fill for occlusion edges.",
    status: "registered",
    source: "Studio — classic depth-image-based-rendering (DIBR) implementation.",
    load: () => import("./viz/stereo-pair"),
  },
  {
    id: "viz.usdz-export",
    kind: "viz",
    name: "USDZ export",
    summary:
      "THREE.USDZExporter wrapper + AR Quick Look launcher. iOS users tap to place the 3D scene in their room via Apple's native AR Quick Look — works on iOS without WebXR.",
    status: "registered",
    source: "three.js USDZExporter (MIT) + Apple AR Quick Look pattern (rel=ar anchor with child element).",
    load: () => import("./viz/usdz-export"),
  },
  {
    id: "viz.spatial-export",
    kind: "viz",
    name: "Spatial photo + video",
    summary:
      "Side-by-side / over-under MP4 + USDZ stereo still output. Quest 3 + Vision Pro players auto-detect SBS aspect ratio. v1: SBS-MP4 / OU-MP4 / usdz-stereo. v2: MV-HEVC.",
    status: "registered",
    source: "Studio composite + Mediabunny (re-uses media.capture's video-encoder pattern).",
    load: () => import("./viz/spatial-export"),
    dependsOn: ["viz.stereo-pair"],
  },
  {
    id: "viz.splat-generate",
    kind: "viz",
    name: "Splat generate",
    summary:
      "Source-agnostic 3D Gaussian Splat synthesis. Provider union (sharp-onnx | postshot | studio-rig-native | luma-genie); every record carries a licence field that commerce surfaces filter on. Foundation-phase stub — router exists, providers wire in one at a time.",
    status: "stub",
    source: "Studio composite over apple-amlr (research-only) + Jawset Postshot (commercial) + studio POV-rig (owned) + Luma API.",
    load: () => import("./viz/splat-generate"),
  },
  {
    id: "viz.splat-render",
    kind: "viz",
    name: "Splat render",
    summary:
      "Viewer-agnostic .ply gaussian-splat embedding. Renderer union (spark-js | gsplat-js | postshot-binary); web side single-engine on three.js so the site keeps one WebGL context. Flavour-gates SHARP raw PLYs out of web targets (must pass through convert_sharp_ply.py first). Foundation-phase stub — props surface only, no concrete viewers wired.",
    status: "stub",
    source: "Studio composite over sparkjsdev/spark (MIT) + @mkkellogg/gaussian-splats-3d (MIT) + Jawset Postshot binary.",
    load: () => import("./viz/splat-render"),
    dependsOn: ["viz.splat-generate"],
  },
  {
    id: "commerce.sharp-job",
    kind: "commerce",
    name: "SHARP commission",
    summary:
      "Server-side SHARP single-image-to-gaussian-splat job. Submits to the studio's 3080 Ti via the python-services/sharp_service.py FastAPI bridge. Premium-quality 2D→3D; falls back gracefully to the free in-browser viz.depth-estimation when the GPU is offline.",
    status: "registered",
    source: "Apple ml-sharp (Apple AI Research License) wrapped in a FastAPI service on the studio's local GPU. Atomised per docs/MIGRATION_PRINCIPLES.md.",
    load: () => import("./commerce/sharp-job"),
  },
  {
    id: "commerce.sharp-video-job",
    kind: "commerce",
    name: "SHARP video commission (4D)",
    summary:
      "Server-side 2D→4D video job. Decodes input video, runs SHARP per keyframe, threads splats into a 4D Gaussian timeline + stereo-MP4 stitch. Studio's 3080 Ti; output is .4dgs + stereo-MP4 + USDZ keyframes. Long-running — handle exposes per-frame progress events. Falls back gracefully to the free in-browser depth-anything-v2 per-frame path when the GPU is offline.",
    status: "registered",
    source: "Studio composition: StereoCrafter (TencentARC MIT) + 4DGaussians (hustvl) + Apple ml-sharp keyframes. Wrapped in python-services/sharp_video_service.py.",
    load: () => import("./commerce/sharp-video-job"),
    dependsOn: ["commerce.sharp-job"],
  },
  {
    id: "commerce.print-order",
    kind: "commerce",
    name: "Print-bar order",
    summary:
      "Drop-ship 3D-print quote + order seam under every 3D viewport. Vendor catalogue × scale band × finish surcharge → live PrintQuote on every dropdown change. v0.1 quotes are synchronous and mocked; the requestPrintQuote function is the seam Stripe + partner APIs wire into in the Stripe wave.",
    status: "registered",
    source: "Studio commerce substrate. Vendor data lives in lib/print-vendors/; rendered by components/three/print-bar.tsx.",
    load: () => import("./commerce/print-order"),
  },
  {
    id: "viz.attractor",
    kind: "viz",
    name: "Strange attractor",
    summary:
      "Pipeline Epsilon — Clifford / Thomas / Lorenz / Dequan-Li trajectory generation. Mood → engine canon. v0.1 CPU; WebGPU TSL upgrade target.",
    status: "registered",
    source:
      "Box 3 crib: merrypranxter/strange_attractors (MIT) + canonical attractor lit. We dropped de Jong + Aizawa, added Dequan Li. Atomised per docs/MIGRATION_PRINCIPLES.md.",
    load: () => import("./viz/attractor"),
    stateSlices: ["viz", "aura"],
  },
  {
    id: "viz.particles",
    kind: "viz",
    name: "Particle field",
    summary:
      "Logical particle-field registry — free, bone-anchored, or explicit-emitter. auraParticleFields() registers 50k across head + hands per the Aura canon.",
    status: "registered",
    source: "Hangar: webgpu-particles-library/ atomised + studio canon",
    load: () => import("./viz/particles"),
    stateSlices: ["viz", "vrm"],
    dependsOn: ["vrm.load"],
  },
];

auraAliveStubs.forEach(register);
