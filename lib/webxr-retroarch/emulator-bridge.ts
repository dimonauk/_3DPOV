/**
 * lib/webxr-retroarch/emulator-bridge.ts — Wire an EmulatorJS-rendered
 * `<canvas>` into a Three.js texture, and pipe XR-controller gamepad
 * input into EmulatorJS's simulate-input surface.
 *
 * The load-bearing trick is the texture-bridge: EmulatorJS paints the
 * libretro core's framebuffer onto an HTMLCanvasElement every libretro
 * frame, and `THREE.CanvasTexture` re-uploads from that canvas to the
 * GPU when we flip `needsUpdate`. Perf cost on Quest 3 hardware: ~1-2
 * ms per frame for a 256×240 NES surface, ~2-3 ms for a 640×480 PSX
 * one. See docs/WEBXR-DEVICE-TARGETS.md for the budget reference.
 *
 * The input bridge polls `navigator.getGamepads()` for `xr-standard`
 * mappings and forwards the deltas to `EJS_emulator.gameManager
 * .simulateInput(player, libretroButton, value)`. Edge-detected — we
 * only call simulateInput when the state changes, not every frame.
 */

import { CanvasTexture, NearestFilter } from "three";

import {
  DEFAULT_MAPPING,
  LIBRETRO_BUTTONS,
  type SystemMapping,
} from "./input-mappings";

declare global {
  interface Window {
    EJS_emulator?: {
      gameManager?: {
        simulateInput?: (player: number, button: number, value: number) => void;
      };
    };
  }
}

/**
 * Find the canvas EmulatorJS renders into. The class name has been
 * stable across EmulatorJS releases for years; a loose fallback to
 * the first `<canvas>` inside the host is safe because EmulatorJS
 * only ever creates the one primary canvas.
 */
export function findEmulatorCanvas(
  hostSelector: string,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const host = document.querySelector(hostSelector);
  if (!host) return null;
  const explicit = host.querySelector<HTMLCanvasElement>("canvas.ejs_canvas");
  if (explicit) return explicit;
  return host.querySelector<HTMLCanvasElement>("canvas");
}

/**
 * Build the CanvasTexture from an EmulatorJS canvas. Configured for
 * pixel-art crispness: nearest sampling, mipmaps off (don't help
 * nearest filtering and cost an extra 30% per upload).
 */
export function buildEmulatorTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export type BridgeInputState = Map<string, number>;

/**
 * Poll once. Walks every connected gamepad with `xr-standard` mapping
 * and pushes deltas into EmulatorJS. The state shape is keyed by
 * hand × libretro button. Edge detection is cheap: walk the relevant
 * subset of the mapping for the active system, compare prev to next,
 * simulateInput on differences only.
 */
export function pollXRInput(
  mapping: SystemMapping,
  prev: BridgeInputState,
): BridgeInputState {
  const next = new Map(prev);

  const sim = window.EJS_emulator?.gameManager?.simulateInput;
  if (typeof sim !== "function") return next;

  if (typeof navigator === "undefined" || !navigator.getGamepads) return next;
  const pads = navigator.getGamepads();

  let left: Gamepad | null = null;
  let right: Gamepad | null = null;
  let nonHandedCount = 0;
  for (const pad of pads) {
    if (!pad || pad.mapping !== "xr-standard") continue;
    const hand = (pad as Gamepad & { hand?: string }).hand ?? "";
    if (hand === "left") left = pad;
    else if (hand === "right") right = pad;
    else if (nonHandedCount === 0) {
      right = pad;
      nonHandedCount++;
    } else if (nonHandedCount === 1) {
      left = pad;
      nonHandedCount++;
    }
  }

  forwardHand(sim, "left", left, mapping.leftHand, next);
  forwardHand(sim, "right", right, mapping.rightHand, next);
  forwardStick(sim, "left", left, mapping.leftStick, next);
  forwardStick(sim, "right", right, mapping.rightStick, next);

  return next;
}

type SimulateInput = (player: number, button: number, value: number) => void;

const XR_BUTTON_INDEX = {
  trigger: 0,
  grip: 1,
  thumbstickPress: 3,
  primaryFace: 4,
  secondaryFace: 5,
} as const;

function forwardHand(
  sim: SimulateInput,
  hand: "left" | "right",
  pad: Gamepad | null,
  map: SystemMapping["leftHand"],
  state: BridgeInputState,
): void {
  if (!pad) return;
  for (const xrName of Object.keys(XR_BUTTON_INDEX) as Array<
    keyof typeof XR_BUTTON_INDEX
  >) {
    const libretroName = map[xrName];
    if (!libretroName) continue;
    const idx = XR_BUTTON_INDEX[xrName];
    const btn = pad.buttons[idx];
    if (!btn) continue;
    const value = btn.pressed ? 1 : 0;
    const key = `${hand}:${xrName}:${libretroName}`;
    const prev = state.get(key) ?? 0;
    if (value !== prev) {
      try {
        sim(0, LIBRETRO_BUTTONS[libretroName], value);
      } catch (err) {
        console.warn("[retroarch-bridge] simulateInput threw:", err);
      }
      state.set(key, value);
    }
  }
}

const DEADZONE = 0.5;

function forwardStick(
  sim: SimulateInput,
  hand: "left" | "right",
  pad: Gamepad | null,
  routing: SystemMapping["leftStick"],
  state: BridgeInputState,
): void {
  if (!pad) return;
  if (routing.kind === "ignore") return;

  const x = pad.axes[2] ?? 0;
  const y = pad.axes[3] ?? 0;

  if (routing.kind === "dpad") {
    const up = y < -DEADZONE ? 1 : 0;
    const down = y > DEADZONE ? 1 : 0;
    const left = x < -DEADZONE ? 1 : 0;
    const right = x > DEADZONE ? 1 : 0;
    pushIfChanged(sim, state, `${hand}:stick:UP`, LIBRETRO_BUTTONS.UP, up);
    pushIfChanged(sim, state, `${hand}:stick:DOWN`, LIBRETRO_BUTTONS.DOWN, down);
    pushIfChanged(sim, state, `${hand}:stick:LEFT`, LIBRETRO_BUTTONS.LEFT, left);
    pushIfChanged(sim, state, `${hand}:stick:RIGHT`, LIBRETRO_BUTTONS.RIGHT, right);
    return;
  }
  // Analogue routings — wiring deferred. See doc.
}

function pushIfChanged(
  sim: SimulateInput,
  state: BridgeInputState,
  key: string,
  button: number,
  value: number,
): void {
  const prev = state.get(key) ?? 0;
  if (prev === value) return;
  try {
    sim(0, button, value);
  } catch (err) {
    console.warn("[retroarch-bridge] simulateInput (stick) threw:", err);
  }
  state.set(key, value);
}

export { DEFAULT_MAPPING };
