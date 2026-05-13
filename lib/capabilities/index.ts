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
      "Play a named gesture clip (wave, nod, point) over the idle layer. Composable with vrm.lookAt for context-aware gesturing.",
    status: "stub",
    source: "Hangar: aura-alive gesture trigger code",
    load: () => Promise.resolve({}),
    stateSlices: ["vrm"],
    dependsOn: ["vrm.bones.pose"],
  },
  {
    id: "agent.dialogue",
    kind: "agent",
    name: "Dialogue runtime",
    summary:
      "LLM call with character bible + conversational memory. One call per turn; returns text + intent + chosen ChronoMode.",
    status: "stub",
    source:
      "Hangar: ws_ai_bridge.py + Box 3 crib AkshitIreddy/Interactive-LLM-Powered-NPCs",
    load: () => Promise.resolve({}),
    stateSlices: ["agent", "cast"],
    dependsOn: ["agent.memory"],
  },
  {
    id: "agent.memory",
    kind: "agent",
    name: "Conversational memory",
    summary:
      "Vector-store backed long-term memory per cast member. Read on dialogue turn, write on resolution.",
    status: "stub",
    source: "Box 3 crib: AkshitIreddy/Interactive-LLM-Powered-NPCs pattern",
    load: () => Promise.resolve({}),
    stateSlices: ["agent", "cast"],
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
    id: "viz.attractor",
    kind: "viz",
    name: "Strange attractor",
    summary:
      "GPGPU 4-engine attractor field (Clifford / Thomas / Lorenz / Dequan Li). Pipeline Epsilon's body.",
    status: "stub",
    source:
      "Box 3 crib: merrypranxter/strange_attractors (5-engine GPGPU; we keep 4 + add Dequan Li)",
    load: () => Promise.resolve({}),
    stateSlices: ["aura", "viz"],
  },
  {
    id: "viz.particles",
    kind: "viz",
    name: "Particle field",
    summary:
      "50k+ particle system with bone-anchored emitters. The Aura-Alive particle library, atomised.",
    status: "stub",
    source: "Hangar: webgpu-particles-library/",
    load: () => Promise.resolve({}),
    stateSlices: ["viz", "vrm"],
  },
];

auraAliveStubs.forEach(register);
