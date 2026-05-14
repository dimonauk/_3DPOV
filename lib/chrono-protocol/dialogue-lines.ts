/**
 * lib/chrono-protocol/dialogue-lines.ts — Static-canon dialogue bank.
 *
 * Content registry. Each line carries an id, speaker, text, the trigger
 * condition that fires it, and a priority. The matcher + picker live in
 * `./dialogue.ts`. The prototype's LLM-generated dialogue (Gemini) will
 * eventually swap in against the same trigger system; this file is the
 * site-side static bank.
 */

import type { DialogueLine } from "./dialogue-types";

export const dialogueLines: DialogueLine[] = [
  // ─── Aura — The Architect ────────────────────────────────────────
  {
    id: "aura-zone-leake",
    speaker: "aura",
    text: "We are in the Safehouse. Stand the angle. The Protocol holds the rest.",
    trigger: { kind: "zone-entered", zone: "leake-st-arches" },
    priority: 50,
  },
  {
    id: "aura-zone-royal",
    speaker: "aura",
    text: "The Royal Mile. We walked this sightline a hundred times. We know it.",
    trigger: { kind: "zone-entered", zone: "royal-mile" },
    priority: 50,
  },
  {
    id: "aura-zone-soho",
    speaker: "aura",
    text: "Soho Grid. Every thread we taught the body — we run them all now.",
    trigger: { kind: "zone-entered", zone: "soho-grid" },
    priority: 50,
  },
  {
    id: "aura-phase-1",
    speaker: "aura",
    text: "Phase one. We protect the integrity of the line.",
    trigger: { kind: "phase-start", phase: 1 },
    priority: 40,
  },
  {
    id: "aura-phase-2",
    speaker: "aura",
    text: "Phase two. Time is the second axis. Take it.",
    trigger: { kind: "phase-start", phase: 2 },
    priority: 40,
  },
  {
    id: "aura-phase-3",
    speaker: "aura",
    text: "Phase three. The Protocol expects the full weave now.",
    trigger: { kind: "phase-start", phase: 3 },
    priority: 40,
  },
  {
    id: "aura-mode-azure",
    speaker: "aura",
    text: "AZURE. The held breath. We sustain the gesture.",
    trigger: { kind: "mode-changed", to: "azure" },
    priority: 30,
  },
  {
    id: "aura-boss-leake",
    speaker: "aura",
    text: "The Safehouse is yours. We open the Mile.",
    trigger: { kind: "boss-defeated", zone: "leake-st-arches" },
    priority: 60,
  },
  {
    id: "aura-boss-royal",
    speaker: "aura",
    text: "The Spire is down. The grid opens. We move on.",
    trigger: { kind: "boss-defeated", zone: "royal-mile" },
    priority: 60,
  },
  {
    id: "aura-died",
    speaker: "aura",
    text: "We hold. Breathe. The Protocol restarts the line, not the runner.",
    trigger: { kind: "player-died" },
    priority: 70,
  },

  // ─── Yow — The Elder Construct (Autistic-coded) ──────────────────
  {
    id: "yow-pattern-1",
    speaker: "yow",
    text: "The pattern just landed. Three of these in eighteen seconds. I do not like it.",
    trigger: { kind: "speed-above", threshold: 1.2 },
    priority: 35,
  },
  {
    id: "yow-rule-veridian",
    speaker: "yow",
    text: "VERIDIAN. Now. The rule is the rule.",
    trigger: { kind: "mode-changed", to: "veridian" },
    priority: 45,
  },
  {
    id: "yow-health-low",
    speaker: "yow",
    text: "Health below thirty. This is the configuration I warned about.",
    trigger: { kind: "health-below", threshold: 30 },
    priority: 65,
  },
  {
    id: "yow-health-critical",
    speaker: "yow",
    text: "Twelve percent. The system is failing the documentation. Stop.",
    trigger: { kind: "health-below", threshold: 15 },
    priority: 80,
  },
  {
    id: "yow-zone-soho",
    speaker: "yow",
    text: "Soho. The grid is supposed to behave. This grid does not. Watch the corners.",
    trigger: { kind: "zone-entered", zone: "soho-grid" },
    priority: 55,
  },
  {
    id: "yow-combo-15",
    speaker: "yow",
    text: "Fifteen straight. That is a pattern. Do not break it.",
    trigger: { kind: "combo-above", threshold: 15 },
    priority: 40,
  },
  {
    id: "yow-died",
    speaker: "yow",
    text: "We deviated. The rule was clear. I will record where we deviated.",
    trigger: { kind: "player-died" },
    priority: 65,
  },
  {
    id: "yow-boss-soho",
    speaker: "yow",
    text: "The Monolith holds the grid's pattern. Break the pattern. That is the rule.",
    trigger: { kind: "boss-defeated", zone: "soho-grid" },
    priority: 55,
  },

  // ─── Purp — The Youth Construct (ADHD-coded) ─────────────────────
  {
    id: "purp-speed-fast",
    speaker: "purp",
    text: "Bruv, this one&rsquo;s preem. Send it.",
    trigger: { kind: "speed-above", threshold: 1.5 },
    priority: 45,
  },
  {
    id: "purp-mode-amethyst",
    speaker: "purp",
    text: "AMETHYST! Innit the colours? Switch! Switch!",
    trigger: { kind: "mode-changed", to: "amethyst" },
    priority: 40,
  },
  {
    id: "purp-mode-amber",
    speaker: "purp",
    text: "AMBER, fam. Tempo&rsquo;s up. Go faster.",
    trigger: { kind: "mode-changed", to: "amber" },
    priority: 35,
  },
  {
    id: "purp-mode-crimson",
    speaker: "purp",
    text: "CRIMSON. Yeah yeah yeah. Smash it.",
    trigger: { kind: "mode-changed", to: "crimson" },
    priority: 35,
  },
  {
    id: "purp-zone-soho",
    speaker: "purp",
    text: "Soho! Carnaby! Neon&rsquo;s buzzing innit. This is the proper one.",
    trigger: { kind: "zone-entered", zone: "soho-grid" },
    priority: 50,
  },
  {
    id: "purp-combo-10",
    speaker: "purp",
    text: "Ten in a row! You&rsquo;re glitching the matrix, fam.",
    trigger: { kind: "combo-above", threshold: 10 },
    priority: 35,
  },
  {
    id: "purp-combo-30",
    speaker: "purp",
    text: "Thirty! Bruv! Thirty! I cannot. I cannot.",
    trigger: { kind: "combo-above", threshold: 30 },
    priority: 55,
  },
  {
    id: "purp-died",
    speaker: "purp",
    text: "Ah nah, that was sick though. Go again. Go again, fam.",
    trigger: { kind: "player-died" },
    priority: 50,
  },
  {
    id: "purp-boss-royal",
    speaker: "purp",
    text: "Spire&rsquo;s gone! Did you see the way it folded? Did you see?!",
    trigger: { kind: "boss-defeated", zone: "royal-mile" },
    priority: 55,
  },
  {
    id: "purp-speed-very-fast",
    speaker: "purp",
    text: "Two-times baseline! That&rsquo;s naughty. I love it.",
    trigger: { kind: "speed-above", threshold: 2.0 },
    priority: 50,
  },
  {
    id: "purp-phase-3",
    speaker: "purp",
    text: "Phase three! The big one! Send it bruv!",
    trigger: { kind: "phase-start", phase: 3 },
    priority: 35,
  },
];
