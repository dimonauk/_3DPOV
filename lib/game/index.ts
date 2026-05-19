/**
 * lib/game/index.ts — Barrel for the WebXR Game Framework's
 * framework-agnostic primitives.
 *
 * Three modules live here today:
 *
 *   - `input-router.ts`  — typed game-action mapper across pointer,
 *                          keyboard, gamepad, and WebXR controller.
 *   - `audio-bus.ts`     — Web Audio + HRTF spatial-audio bus.
 *   - `game-state.ts`    — vanilla-TS store with localStorage save/load.
 *
 * The full framework picture (what these slot into, what's still
 * missing) lives in `docs/WEBXR-GAME-FRAMEWORK.md`. Read it before
 * adding a fourth primitive — there's a roadmap that lists the next
 * intended additions and their contracts.
 *
 * House rule for additions to this barrel: framework-agnostic only.
 * React-coupled wrappers, R3F hooks, and zustand bridges belong
 * under `hooks/` or `lib/state/` respectively. The `lib/game/*` floor
 * stays plain TypeScript so workers, tests, and the eventual
 * `holoflow-webxr-game` template scaffolder can reach it without
 * threading a React tree.
 */

export {
  createInputRouter,
  DEFAULT_ACTION_MAP,
} from "./input-router";
export type {
  ActionMap,
  GameAction,
  InputBinding,
  InputRouter,
  InputSource,
} from "./input-router";

export { createAudioBus } from "./audio-bus";
export type {
  AudioBus,
  ListenerPose,
  PlayOptions,
  SoundId,
} from "./audio-bus";

export { createGameState } from "./game-state";
export type {
  GameState,
  StateHandler,
  StateUpdater,
} from "./game-state";
