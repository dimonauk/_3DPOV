/**
 * lib/webxr-retroarch/input-mappings.ts — Per-system XR-controller →
 * EmulatorJS input layer routing.
 *
 * EmulatorJS exposes its input surface through
 * `EJS_emulator.gameManager.simulateInput(player, button, value)` where
 * `button` is the libretro button index and `value` is 0/1 digital or
 * -1..1 analogue.
 *
 * Libretro button indices are facts about a public API — referenced
 * from https://docs.libretro.com/development/retroarch/input/ — not
 * GPL-protected expression.
 *
 * Standard WebXR mapping (xr-standard) — the values @react-three/xr's
 * controller gamepad shape exposes:
 *   buttons[0]   trigger
 *   buttons[1]   grip / squeeze
 *   buttons[3]   thumbstick press
 *   buttons[4]   primary face (A right / X left)
 *   buttons[5]   secondary face (B right / Y left)
 *   axes[2/3]    thumbstick X/Y
 *
 * Vision Pro doesn't expose a gamepad at all (transient-pointer only)
 * — fallback to 2D-monitor mode + Bluetooth keyboard is the answer
 * there. See the doc.
 */

export const LIBRETRO_BUTTONS = {
  B: 0,
  Y: 1,
  SELECT: 2,
  START: 3,
  UP: 4,
  DOWN: 5,
  LEFT: 6,
  RIGHT: 7,
  A: 8,
  X: 9,
  L: 10,
  R: 11,
  L2: 12,
  R2: 13,
  L3: 14,
  R3: 15,
} as const;

export type LibretroButton = keyof typeof LIBRETRO_BUTTONS;

export type XRGamepadButton =
  | "trigger"
  | "grip"
  | "thumbstickPress"
  | "primaryFace"
  | "secondaryFace";

export type HandMapping = Partial<Record<XRGamepadButton, LibretroButton>>;

export type StickRouting =
  | { kind: "ignore" }
  | { kind: "dpad" }
  | { kind: "analogue-left" }
  | { kind: "analogue-right" };

export type SystemMapping = {
  systemSlug: string;
  schemeLabel: string;
  leftHand: HandMapping;
  rightHand: HandMapping;
  leftStick: StickRouting;
  rightStick: StickRouting;
};

export const SYSTEM_MAPPINGS: Record<string, SystemMapping> = {
  nes: {
    systemSlug: "nes",
    schemeLabel: "NES (2 buttons + Start/Select + D-pad)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START" },
    rightHand: { primaryFace: "A", secondaryFace: "B" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  snes: {
    systemSlug: "snes",
    schemeLabel: "SNES (4 face + L/R + Start/Select)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  n64: {
    systemSlug: "n64",
    schemeLabel: "N64 (analogue + C-buttons on right stick)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "analogue-left" },
    rightStick: { kind: "ignore" },
  },
  gb: {
    systemSlug: "gb",
    schemeLabel: "Game Boy (A/B + Start/Select)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START" },
    rightHand: { primaryFace: "A", secondaryFace: "B" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  gbc: {
    systemSlug: "gbc",
    schemeLabel: "Game Boy Color (A/B + Start/Select)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START" },
    rightHand: { primaryFace: "A", secondaryFace: "B" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  gba: {
    systemSlug: "gba",
    schemeLabel: "Game Boy Advance (A/B + L/R + Start/Select)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  nds: {
    systemSlug: "nds",
    schemeLabel: "Nintendo DS (A/B/X/Y + L/R + Start/Select)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  segamd: {
    systemSlug: "segamd",
    schemeLabel: "Mega Drive (A/B/C + X/Y/Z + Start)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  segams: {
    systemSlug: "segams",
    schemeLabel: "Master System (1/2 + Pause)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START" },
    rightHand: { primaryFace: "A", secondaryFace: "B" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  segagg: {
    systemSlug: "segagg",
    schemeLabel: "Game Gear (1/2 + Start)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START" },
    rightHand: { primaryFace: "A", secondaryFace: "B" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  segasaturn: {
    systemSlug: "segasaturn",
    schemeLabel: "Saturn (A/B/C/X/Y/Z + L/R + Start)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  psx: {
    systemSlug: "psx",
    schemeLabel: "PlayStation (△○✕□ + L1/L2/R1/R2 + Start/Select)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L2", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R2", grip: "R" },
    leftStick: { kind: "analogue-left" },
    rightStick: { kind: "analogue-right" },
  },
  atari2600: {
    systemSlug: "atari2600",
    schemeLabel: "Atari 2600 (single button + Select/Reset)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START" },
    rightHand: { primaryFace: "B", secondaryFace: "B" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
  arcade: {
    systemSlug: "arcade",
    schemeLabel: "Arcade (4 face + L/R + Start/Coin)",
    leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
    rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
    leftStick: { kind: "dpad" },
    rightStick: { kind: "ignore" },
  },
};

export const DEFAULT_MAPPING: SystemMapping = {
  systemSlug: "default",
  schemeLabel: "Standard (4 face + L/R + Start/Select)",
  leftHand: { primaryFace: "SELECT", secondaryFace: "START", trigger: "L", grip: "L" },
  rightHand: { primaryFace: "A", secondaryFace: "B", trigger: "R", grip: "R" },
  leftStick: { kind: "dpad" },
  rightStick: { kind: "ignore" },
};

export function getMapping(systemSlug: string): SystemMapping {
  return SYSTEM_MAPPINGS[systemSlug] ?? DEFAULT_MAPPING;
}
