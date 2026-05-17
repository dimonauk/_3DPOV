/**
 * app/play/agent-town/agent-town/roster.ts — Room layout + townie
 * roster. Both are stable visual chrome derived from the source app
 * at D:/The_Hangar/apps/agent-town/; the ROSTER filter drops any
 * townie whose id has no matching bible in lib/cast.
 *
 * Extracted from agent-town-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { bibles } from "lib/cast";

import type { Room, Townie } from "./types";

// Six rooms — left, middle, right; top, bottom. The room metadata is
// stable visual chrome and doesn't need to come from any bible.
export const ROOMS: Room[] = [
  { x: 1, y: 1, w: 6, h: 5, label: "Aura's Void", fill: "rgba(0, 30, 50, 0.55)" },
  { x: 9, y: 1, w: 5, h: 4, label: "Penny Ops", fill: "rgba(40, 0, 20, 0.55)" },
  { x: 16, y: 1, w: 6, h: 5, label: "Marcel Architecture", fill: "rgba(20, 20, 20, 0.55)" },
  { x: 1, y: 8, w: 5, h: 6, label: "Academy Studio", fill: "rgba(10, 10, 35, 0.55)" },
  { x: 8, y: 8, w: 7, h: 6, label: "Common Room", fill: "rgba(12, 14, 10, 0.55)" },
  { x: 17, y: 8, w: 5, h: 6, label: "Tim's Darkroom", fill: "rgba(30, 18, 0, 0.55)" },
];

// Roster — only voices that exist in lib/cast get a shape on the floor.
// Colour + shape + room come from the source app's agents.ts; role and
// task lines are short editorial twins of the bibles.
const TOWNIES: Townie[] = [
  {
    id: "aura",
    name: "Aura",
    role: "Void Princess / hostess",
    colour: "#00f3ff",
    glow: "#00f3ff",
    shape: "hex",
    status: "idle",
    task: "watching the whole floor",
    mood: "still",
    home: { x: 1, y: 1, w: 6, h: 5 },
  },
  {
    id: "penny",
    name: "Penny",
    role: "advertising lead",
    colour: "#ff6eb4",
    glow: "#ff6eb4",
    shape: "diamond",
    status: "working",
    task: "mapping OCEAN profiles",
    mood: "sharp",
    home: { x: 9, y: 1, w: 5, h: 4 },
  },
  {
    id: "baby",
    name: "Baby",
    role: "the prefect",
    colour: "#ffd700",
    glow: "#ffd700",
    shape: "star",
    status: "working",
    task: "keeping the cohort in line",
    mood: "authoritative",
    home: { x: 9, y: 1, w: 5, h: 4 },
  },
  {
    id: "millie",
    name: "Millie",
    role: "social specialist",
    colour: "#87ceeb",
    glow: "#87ceeb",
    shape: "circle",
    status: "working",
    task: "listening to corridor talk",
    mood: "eager",
    home: { x: 8, y: 8, w: 7, h: 6 },
  },
  {
    id: "betsy",
    name: "Betsy",
    role: "parallel-exit specialist",
    colour: "#9b59b6",
    glow: "#b39ddb",
    shape: "triangle",
    status: "thinking",
    task: "finding the other door",
    mood: "dreamy",
    home: { x: 8, y: 8, w: 7, h: 6 },
  },
  {
    id: "trixie",
    name: "Trixie",
    role: "pipeline overseer",
    colour: "#98fb98",
    glow: "#00ff88",
    shape: "cross",
    status: "working",
    task: "keeping the flow honest",
    mood: "stubborn",
    home: { x: 8, y: 8, w: 7, h: 6 },
  },
  {
    id: "marcel",
    name: "Marcel",
    role: "swarm architect",
    colour: "#e8e8e8",
    glow: "#ffffff",
    shape: "hex",
    status: "working",
    task: "routing tasks across the cluster",
    mood: "precise",
    home: { x: 16, y: 1, w: 6, h: 5 },
  },
  {
    id: "tim",
    name: "Tim",
    role: "visual specialist",
    colour: "#ff8c42",
    glow: "#ff8c42",
    shape: "square",
    status: "working",
    task: "scoring outputs from the comfy pipelines",
    mood: "attentive",
    home: { x: 17, y: 8, w: 5, h: 6 },
  },
];

// Filter to bible-backed townies only. Any townie whose id isn't in
// the registry is silently dropped — the floor only renders voices the
// banter capability can actually speak as.
export const ROSTER: Townie[] = TOWNIES.filter((t) => t.id in bibles);
