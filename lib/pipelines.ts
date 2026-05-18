/**
 * lib/pipelines.ts — Static catalogue of named compositions across the capability registry.
 *
 * One-line role: enumerate the studio's molecules (compositions) the way lib/capabilities/index.ts enumerates the atoms.
 * Full purpose in pipelines.PURPOSE.md.
 */

import type { CapabilityId } from "lib/capabilities/_base";

export type PipelineStage = {
  capability: CapabilityId;
  /** Plain-language description of what this stage does in this pipeline. */
  note: string;
};

export type Pipeline = {
  id: string;
  /** Display name (e.g. "Lipsync", "Mood face"). */
  name: string;
  /** Greek-letter codename if one is canon (e.g. "Pipeline Epsilon"). */
  codename?: string;
  /** One-sentence elevator. */
  summary: string;
  /** Ordered list of capability stages. */
  stages: PipelineStage[];
  /** Slices the pipeline touches (read or written). */
  slices: string[];
  /** Demo / surface route, if one exists. */
  surface?: string;
  /** Status. */
  status: "registered" | "stub" | "speculative";
};

export const pipelines: Pipeline[] = [
  {
    id: "lipsync",
    name: "Lipsync",
    summary:
      "Aura speaks; her mouth moves in time. The first canonical multi-capability composition.",
    stages: [
      { capability: "vrm.load", note: "load /dimona.vrm into the vrm slice" },
      { capability: "audio.tts", note: "speak text via Web Speech or ElevenLabs" },
      { capability: "audio.visemes", note: "estimate viseme timeline from text + duration" },
      { capability: "vrm.expressions.blend", note: "read active viseme, write mouth weights to vrm.expressions" },
    ],
    slices: ["audio", "vrm"],
    surface: "/pipelines/lipsync",
    status: "registered",
  },
  {
    id: "mood-face",
    name: "Mood face",
    summary:
      "Aura's facial expression mirrors her mood without saying a word. Brow + eye + relaxed-state weights.",
    stages: [
      { capability: "vrm.load", note: "load /dimona.vrm into the vrm slice" },
      { capability: "vrm.expressions.blend", note: "read aura.mood, write face weights to vrm.expressions" },
    ],
    slices: ["aura", "vrm"],
    surface: "/pipelines/mood-face",
    status: "registered",
  },
  {
    id: "held-stance",
    name: "Held stance",
    summary:
      "Aura's hostess-superheroine-brat default. Baseline pose + slow breath + periodic blink + micro hip-shift, mood-scaled.",
    stages: [
      { capability: "vrm.load", note: "load dimona.vrm into the slice" },
      { capability: "vrm.bones.pose", note: "set POSES.auraDefault as baseline" },
      { capability: "motion.idle", note: "rAF loop writes idle offsets + blink, modulated by aura.mood" },
    ],
    slices: ["vrm", "aura"],
    surface: "/demo/vrm",
    status: "registered",
  },
  {
    id: "pipeline-epsilon",
    name: "Aura energy trails",
    codename: "Pipeline Epsilon",
    summary:
      "Aura's mood selects a strange-attractor engine; the engine iterates; 50k points render as the body of what she's feeling.",
    stages: [
      { capability: "viz.attractor", note: "engineFromMood(aura.mood) → iterate trajectory" },
      { capability: "viz.particles", note: "register particle fields anchored to head + hands" },
    ],
    slices: ["aura", "viz", "vrm"],
    surface: "/visualiser/strange-attractor",
    status: "registered",
  },
  {
    id: "look-back",
    name: "Look back",
    summary:
      "Aura's eyes track the user. Head-pose drives a world-space target the VRM's lookAt module reads.",
    stages: [
      { capability: "input.headpose", note: "mouse / WebXR / MediaPipe drives input.headPose" },
      { capability: "vrm.lookAt", note: "convert head-pose to target Vec3, write to vrm.lookTargets" },
    ],
    slices: ["input", "vrm"],
    surface: undefined,
    status: "speculative",
  },
  {
    id: "ten-shell-parallax",
    name: "Ten-shell parallax",
    summary:
      "The Russian-doll world. Ten concentric shells, head-pose-driven offsets per layer.",
    stages: [
      { capability: "input.headpose", note: "mouse fallback writes input.headPose" },
    ],
    slices: ["input", "world"],
    surface: "/demo/parallax-shells",
    status: "registered",
  },
  {
    id: "outdoor-trail",
    name: "HoloWalk outdoor trail",
    codename: "Pipeline HoloWalk",
    summary:
      "Magic-window AR. Visitor at the GPS spot, phone up, animated light sculpture re-anchored in the camera view. The flagship.",
    stages: [
      { capability: "geo.position", note: "GPS + heading watcher" },
      { capability: "ar.window", note: "camera + computeARTransform for the world-locked target position" },
      { capability: "viz.light-sculpture", note: "animated trajectory rendered as Trail + Bloom inside the camera-overlay canvas" },
    ],
    slices: ["geo", "viz"],
    surface: "/holo-walk/[id]/ar",
    status: "registered",
  },
  {
    id: "ar-capture",
    name: "AR capture + share",
    summary:
      "Composite of camera + overlay sampled per-frame, encoded as JPEG (photo) or MP4 (video) via Mediabunny, shared via navigator.share with download fallback.",
    stages: [
      { capability: "media.capture", note: "capturePhoto / startRecording / shareBlob — works on iOS Safari 26+ via WebCodecs" },
    ],
    slices: [],
    surface: "/holo-walk/[id]/ar",
    status: "registered",
  },
  {
    id: "photo-to-3d",
    name: "Photo to 3D (in-browser)",
    summary:
      "Free path. Depth Anything V2 estimates depth in the browser; a depth-weighted warp produces a stereo pair; output as USDZ for iOS AR Quick Look or SBS-MP4 for Quest 3 / Vision Pro.",
    stages: [
      { capability: "viz.depth-estimation", note: "Depth Anything V2 small via Transformers.js; WebGPU on capable phones, WebGL fallback" },
      { capability: "viz.stereo-pair", note: "depth-weighted horizontal warp at IPD baseline; pure-math, no GPU required" },
      { capability: "viz.usdz-export", note: "wrap stereo pair as USDZ for Apple AR Quick Look (iOS native)" },
      { capability: "viz.spatial-export", note: "alternate: composite side-by-side MP4 for Quest 3 / Vision Pro playback" },
    ],
    slices: [],
    surface: "/spatial",
    status: "registered",
  },
  {
    id: "sharp-commission",
    name: "SHARP commission (premium)",
    codename: "Pipeline SHARP",
    summary:
      "Server-side path. Same input photo, higher fidelity. Apple SHARP single-image Gaussian splat run on the studio's local 3080 Ti; job is polled, result delivered as splat + USDZ. Degrades gracefully to the in-browser path when the SHARP service is offline.",
    stages: [
      { capability: "commerce.sharp-job", note: "submit / poll / download against the studio's SHARP service; feature-detected at /spatial" },
    ],
    slices: [],
    surface: "/spatial",
    status: "registered",
  },
  {
    id: "video-to-4d",
    name: "Video to 4D (premium)",
    codename: "Pipeline SHARP-Video",
    summary:
      "Server-side path. 2D clip in, 4D Gaussian Splat timeline + stereo MP4 out. ffmpeg decodes, SHARP runs per keyframe, 4DGaussians temporal fit, ffmpeg stitches the SBS MP4. Long-running (minutes per few-second clip); progress reports per-frame counter + current stage.",
    stages: [
      { capability: "commerce.sharp-video-job", note: "submit / poll / download against the studio's SHARP-video service; per-frame progress channel for live counter" },
    ],
    slices: [],
    surface: "/spatial/video",
    status: "registered",
  },
  {
    id: "print-bar-order",
    name: "Print-bar order",
    codename: "Pipeline Drop-Ship",
    summary:
      "Every 3D viewport on the site mounts a 3D commerce strip inside its own scene. Material × scale × finish dropdowns quote live via the print-vendor catalogue; the action plate posts a (v0.1 mock) order receipt. The Stripe wave swaps the receipt for live Stripe + partner-API checkout without touching the bar or the viewport.",
    stages: [
      { capability: "commerce.print-order", note: "quotePrint synchronously on every dropdown change; requestPrintQuote on action-plate click (mocked in v0.1; Stripe seam)" },
    ],
    slices: [],
    surface: "/holo-walk/[id]",
    status: "registered",
  },
  {
    id: "dialogue-loop",
    name: "Dialogue loop",
    summary:
      "User speaks → STT transcribes → Aura's bible + memory feed Gemini → response text + intent + chosen mode → TTS speaks back, mouth + face + mood update in lockstep.",
    stages: [
      { capability: "audio.stt", note: "microphone → transcript" },
      { capability: "agent.memory", note: "recall relevant prior turns" },
      { capability: "agent.dialogue", note: "Gemini call returns text + intent + mode" },
      { capability: "audio.tts", note: "speak the response" },
      { capability: "audio.visemes", note: "viseme timeline for lipsync" },
      { capability: "vrm.expressions.blend", note: "mouth + face merged weights" },
      { capability: "motion.gesture", note: "trigger gesture from intent (wave on greet, nod on agree, shrug on don't-know)" },
    ],
    slices: ["audio", "agent", "cast", "aura", "vrm"],
    surface: undefined,
    status: "speculative",
  },
  {
    id: "cast-banter",
    name: "Cast banter",
    codename: "Pipeline Banter",
    summary:
      "Multi-character LLM exchange. Telemetry + active-speaker subset → Gemini returns 1-3 turns of in-voice exchange. The mechanism Aura + Yow + Purp used to flank the player in Neo-London Chrono-Protocol; generalised here to any subset of the cast.",
    stages: [
      { capability: "agent.banter", note: "Gemini call with multi-character system prompt + responseSchema; returns {turns, tickMs, followUpEta}" },
      { capability: "audio.tts", note: "speak each turn in order; voice routed per speaker" },
      { capability: "audio.visemes", note: "viseme timeline per turn" },
      { capability: "vrm.expressions.blend", note: "mouth + face per speaker's mood" },
    ],
    slices: ["agent", "cast", "aura", "audio", "vrm"],
    surface: "/chrono-protocol/run",
    status: "registered",
  },
  {
    id: "kinematic-extraction",
    name: "Kinematic extraction",
    summary:
      "Pose-sample stream → Laban Effort vector (Space × Time × Weight × Flow) → nearest named Basic Effort. The classifier that says what kind of movement just happened.",
    stages: [
      { capability: "input.headpose", note: "raw pose / motion sample feed (head + hand placeholder; depth-camera path future)" },
      { capability: "motion.laban", note: "analyseEffort(samples) returns {effort, basic, sampleCount, meanIntervalMs}" },
    ],
    slices: ["input"],
    surface: "/visualiser/laban-dial",
    status: "registered",
  },
  {
    id: "named-move-blend",
    name: "Named-move blend",
    summary:
      "Two named moves from the move-library, blended by their Laban coordinates at parameter t. Interpolated Effort points become a continuous gradient between named gestures.",
    stages: [
      { capability: "motion.laban", note: "interpolateMoves(fromId, toId, t) returns the blended EffortVector" },
      { capability: "motion.gesture", note: "(future) apply the blended Effort as a transient pose" },
    ],
    slices: ["vrm"],
    surface: undefined,
    status: "speculative",
  },
  {
    id: "ocean-mood-drift",
    name: "OCEAN mood drift",
    summary:
      "Conversational outcome (intent + sentiment) nudges Aura's OCEAN vector; the new vector recomputes mood; mood propagates into face + posture + attractor engine.",
    stages: [
      { capability: "agent.dialogue", note: "post-turn intent triggers a nudgeOcean call" },
      { capability: "viz.attractor", note: "engineFromMood(new mood) re-selects attractor engine" },
      { capability: "motion.idle", note: "moodGain re-scales breath + micro-shift amplitudes" },
      { capability: "vrm.expressions.blend", note: "faceForMood updates brow/eye/relaxed weights" },
    ],
    slices: ["aura", "agent", "vrm", "viz"],
    surface: undefined,
    status: "speculative",
  },
  {
    id: "morphing-curve-modulation",
    name: "Morphing curve modulation",
    summary:
      "An animation specified as MorphingConfig (duration + easing + endpoints) drives a parameter from A to B with a named Penner curve. The aesthetic backbone of every alive-not-metronome animation in the system.",
    stages: [
      { capability: "motion.gesture", note: "uses easeInOutCubic internally; can route through lib/math/easing for the full 31-curve catalogue" },
      { capability: "motion.idle", note: "sine-over-time breath cycle; cosineLerp helper for blending two curves" },
    ],
    slices: ["vrm"],
    surface: undefined,
    status: "registered",
  },
];

export function getPipeline(id: string): Pipeline | undefined {
  return pipelines.find((p) => p.id === id);
}

export function listPipelines(): Pipeline[] {
  return pipelines;
}
