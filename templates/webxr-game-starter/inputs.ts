/**
 * templates/webxr-game-starter/inputs.ts — Input bindings for the
 * starter template's two game actions.
 *
 *   - `interact` — XR controller A button OR keyboard Space OR
 *                  pointer left click. The pickup volume listens for
 *                  the rising edge of this action.
 *   - `menu`     — XR menu button OR keyboard Escape. Wired to the
 *                  Restart button in the HUD.
 *
 * These are deliberately the same codes as DEFAULT_ACTION_MAP for the
 * sources we use; we restate them here so the fork-and-edit path is
 * a one-file change rather than a hunt through the framework.
 *
 * TODO (depends on parallel agent af92f9ea): `audio-bus.ts` and
 * `game-state.ts` land in the same commit as a richer router. If they
 * arrive with a different action map convention, reconcile here and
 * keep the file at one screen.
 */

import {
  createInputRouter,
  type ActionMap,
  type InputRouter,
} from "lib/game/input-router";

/**
 * The starter only needs two actions. We narrow the action union so
 * scene code that calls `router.onAction("interact", ...)` gets a
 * compile error if the binding was forgotten.
 */
export type StarterAction = "interact" | "menu";

export const STARTER_ACTION_MAP: ActionMap = {
  interact: [
    { source: "pointer", code: "left" },
    { source: "keyboard", code: "Space" },
    { source: "gamepad", code: "0" }, // A / Cross
    { source: "xr-controller", code: "4" }, // trigger on xr-standard
  ],
  menu: [
    { source: "keyboard", code: "Escape" },
    { source: "gamepad", code: "9" }, // Start
    { source: "xr-controller", code: "3" }, // thumbstick press on xr-standard
  ],
};

/**
 * Construct the router. Caller is responsible for `.destroy()` on
 * unmount — the React mount/unmount pair in `scene.tsx` does this.
 */
export function createStarterInputRouter(): InputRouter {
  return createInputRouter(STARTER_ACTION_MAP);
}
