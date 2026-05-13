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
      { capability: "audio.tts", note: "speak text via Web Speech or ElevenLabs" },
      { capability: "audio.visemes", note: "estimate viseme timeline from text + duration" },
      { capability: "vrm.expressions.blend", note: "read active viseme, write mouth weights to vrm.expressions" },
    ],
    slices: ["audio", "vrm"],
    surface: "/demo/aura-talks",
    status: "registered",
  },
  {
    id: "mood-face",
    name: "Mood face",
    summary:
      "Aura's facial expression mirrors her mood without saying a word. Brow + eye + relaxed-state weights.",
    stages: [
      { capability: "vrm.expressions.blend", note: "read aura.mood, write face weights to vrm.expressions" },
    ],
    slices: ["aura", "vrm"],
    surface: "/demo/aura-talks",
    status: "registered",
  },
  {
    id: "held-stance",
    name: "Held stance",
    summary:
      "Aura's hostess-superheroine-brat default. Baseline pose + slow breath + periodic blink + micro hip-shift, mood-scaled.",
    stages: [
      { capability: "vrm.load", note: "load nanny.vrm into the slice" },
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
];

export function getPipeline(id: string): Pipeline | undefined {
  return pipelines.find((p) => p.id === id);
}

export function listPipelines(): Pipeline[] {
  return pipelines;
}
