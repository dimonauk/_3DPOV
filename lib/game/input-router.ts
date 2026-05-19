/**
 * lib/game/input-router.ts — Typed game-action router for the WebXR
 * Game Framework. Maps raw pointer / keyboard / gamepad / WebXR
 * controller events onto a small set of named game actions so the
 * rest of the scene code never touches the raw event surface.
 *
 * Why this exists. SceneStage already gives us a viewer pose (see
 * `lib/tracking/`). That's the "where is the head" question. The
 * router answers the orthogonal question: "did the player ask to
 * interact?" Without it every scene re-implements keydown listeners
 * and gamepad polling by hand, and inevitably ends up with subtle
 * differences in dead-zone, repeat behaviour, and XR-controller
 * handling. Once.
 *
 * Sources covered:
 *
 *   - "pointer"        — left/middle/right buttons via PointerEvents
 *                        on the window. `code` is "left" | "middle"
 *                        | "right".
 *   - "keyboard"       — `KeyboardEvent.code` strings (the physical
 *                        key, e.g. "Space" or "KeyE"). Repeat events
 *                        are de-duped so a held key fires `pressed`
 *                        true continuously but only one `onAction`
 *                        callback at the leading edge.
 *   - "gamepad"        — Standard Gamepad mapping button indices
 *                        (e.g. "0" for A on Xbox / Cross on PS,
 *                        "9" for Start). Polled via rAF.
 *   - "xr-controller"  — The @react-three/xr session's gamepad
 *                        surface for each connected controller.
 *                        `code` is the same Standard-Mapping index
 *                        string as the desktop gamepad path.
 *
 * The router is framework-agnostic. It reads from `window` directly
 * and runs a polling tick on `requestAnimationFrame`. R3F-side code
 * doesn't have to do anything beyond constructing one and remembering
 * to call `.destroy()` on unmount. The XR controller path is wired
 * by polling `navigator.getGamepads()` — the WebXR runtime surfaces
 * controller gamepads through that API on every supported headset
 * browser (Quest, Vision Pro via transient-pointer is a separate
 * pattern, Pico, Wolvic-Chromium, Steam Frame's PC-side stream).
 *
 * Non-goals — kept out deliberately, document for the next agent:
 *
 *   - Touch / pinch gestures. The studio's pinch handling lives in
 *     `transient-pointer` land for Vision Pro / Galaxy XR and
 *     deserves its own router; we stay out of it here so this file
 *     keeps under 300 lines.
 *   - Action remapping UI. The map is data the caller hands in.
 *     A "rebind these in a settings dialog" layer is a future
 *     primitive, sketched in WEBXR-GAME-FRAMEWORK.md.
 *   - Analogue axis values. The router answers "is this action
 *     pressed", not "by how much". Analogue locomotion already runs
 *     through @react-three/xr's `useXRControllerLocomotion`.
 */

export type GameAction =
  | "interact"
  | "jump"
  | "menu"
  | "back"
  | "primary"
  | "secondary";

export type InputSource = "pointer" | "keyboard" | "gamepad" | "xr-controller";

export type InputBinding = {
  /** Which input surface this binding listens on. */
  source: InputSource;
  /**
   * Source-specific identifier:
   *   - pointer:        "left" | "middle" | "right"
   *   - keyboard:       KeyboardEvent.code (e.g. "Space", "KeyE", "Enter")
   *   - gamepad:        Standard-Mapping button index as a decimal string
   *                     (e.g. "0" for A/Cross, "1" for B/Circle, "9" Start)
   *   - xr-controller:  same Standard-Mapping index string as gamepad
   */
  code: string;
};

export type ActionMap = Partial<Record<GameAction, InputBinding[]>>;

export type InputRouter = {
  /** True while at least one bound input for the action is active. */
  isPressed(action: GameAction): boolean;
  /**
   * Register a callback for the rising-edge of the action. Returns
   * an unsubscribe. Callbacks fire on the leading edge only — held
   * inputs do not refire until released and pressed again.
   */
  onAction(action: GameAction, handler: () => void): () => void;
  /** Detach every listener and stop the polling loop. */
  destroy(): void;
};

export function createInputRouter(map: ActionMap): InputRouter {
  // State buckets keyed by `source:code` so a single map merges all
  // binding kinds. Set + Map keeps the per-frame work O(1) per
  // active binding.
  const pressed = new Set<string>();
  const listeners = new Map<GameAction, Set<() => void>>();
  const previousActionState = new Map<GameAction, boolean>();

  const noopWindow = typeof window === "undefined";

  function key(source: InputSource, code: string): string {
    return `${source}:${code}`;
  }

  function actionPressed(action: GameAction): boolean {
    const bindings = map[action];
    if (!bindings) return false;
    for (const b of bindings) {
      if (pressed.has(key(b.source, b.code))) return true;
    }
    return false;
  }

  function notifyEdges(): void {
    // After updating `pressed`, walk each action that anyone is
    // listening on and fire the rising-edge handlers. Cheap unless
    // the caller has subscribed to dozens of actions.
    for (const [action, handlers] of listeners) {
      const now = actionPressed(action);
      const prev = previousActionState.get(action) ?? false;
      if (now && !prev) {
        for (const h of handlers) {
          try {
            h();
          } catch (err) {
            console.warn("[input-router] action handler threw:", err);
          }
        }
      }
      previousActionState.set(action, now);
    }
  }

  // ---- Pointer ------------------------------------------------------
  function pointerName(button: number): string | null {
    switch (button) {
      case 0:
        return "left";
      case 1:
        return "middle";
      case 2:
        return "right";
      default:
        return null;
    }
  }

  function onPointerDown(ev: PointerEvent): void {
    const name = pointerName(ev.button);
    if (!name) return;
    pressed.add(key("pointer", name));
    notifyEdges();
  }
  function onPointerUp(ev: PointerEvent): void {
    const name = pointerName(ev.button);
    if (!name) return;
    pressed.delete(key("pointer", name));
    notifyEdges();
  }

  // ---- Keyboard -----------------------------------------------------
  function onKeyDown(ev: KeyboardEvent): void {
    // The OS-level autorepeat fires keydown continuously while the
    // key is held. We want `pressed` to stay true through the hold,
    // but only the *first* keydown should advance the rising edge.
    // Set semantics give us the dedupe for free.
    if (ev.repeat) return;
    pressed.add(key("keyboard", ev.code));
    notifyEdges();
  }
  function onKeyUp(ev: KeyboardEvent): void {
    pressed.delete(key("keyboard", ev.code));
    notifyEdges();
  }

  // ---- Gamepad / XR controller --------------------------------------
  //
  // Single polling pass per frame. The XR controllers surface
  // through `navigator.getGamepads()` on every supported headset
  // browser via the WebXR API's gamepad bridge, so the same loop
  // handles desktop pads and headset controllers. Source tag is
  // decided by `gamepad.mapping === "xr-standard"` per the spec.
  //
  // The Standard Mapping spec is the floor — Quest controllers use
  // "xr-standard", Xbox / DualSense use "standard". Either way the
  // button index is the binding code; the source flag is what tells
  // the caller which kind of input fired.

  let rafId = 0;
  let stopped = false;

  function pollPads(): void {
    if (stopped) return;
    rafId = window.requestAnimationFrame(pollPads);

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      const isXR = pad.mapping === "xr-standard";
      const source: InputSource = isXR ? "xr-controller" : "gamepad";
      for (let i = 0; i < pad.buttons.length; i++) {
        const btn = pad.buttons[i];
        // Browser quirk: a missing button slot can be undefined on
        // older Pico Browser builds. Guard rather than assume length
        // matches the array index.
        if (!btn) continue;
        const k = key(source, String(i));
        if (btn.pressed) {
          pressed.add(k);
        } else {
          pressed.delete(k);
        }
      }
    }
    notifyEdges();
  }

  // ---- Attach -------------------------------------------------------
  if (!noopWindow) {
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    rafId = window.requestAnimationFrame(pollPads);
  }

  return {
    isPressed: actionPressed,
    onAction(action, handler) {
      let set = listeners.get(action);
      if (!set) {
        set = new Set();
        listeners.set(action, set);
      }
      set.add(handler);
      return () => {
        const s = listeners.get(action);
        if (!s) return;
        s.delete(handler);
        if (s.size === 0) listeners.delete(action);
      };
    },
    destroy() {
      stopped = true;
      if (noopWindow) return;
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      pressed.clear();
      listeners.clear();
      previousActionState.clear();
    },
  };
}

/**
 * A reasonable starting binding map. Mirrors the conventions in
 * `docs/WEBXR-DEVICE-TARGETS.md` — A/Cross is interact, B/Circle is
 * back, hand-tracked pinch arrives through `transient-pointer` and
 * is NOT routed here (it's a separate primitive).
 */
export const DEFAULT_ACTION_MAP: ActionMap = {
  interact: [
    { source: "pointer", code: "left" },
    { source: "keyboard", code: "Enter" },
    { source: "keyboard", code: "Space" },
    { source: "gamepad", code: "0" }, // A / Cross
    { source: "xr-controller", code: "4" }, // trigger on xr-standard
  ],
  jump: [
    { source: "keyboard", code: "Space" },
    { source: "gamepad", code: "0" },
    { source: "xr-controller", code: "5" }, // grip on xr-standard
  ],
  menu: [
    { source: "keyboard", code: "Escape" },
    { source: "gamepad", code: "9" }, // Start
    { source: "xr-controller", code: "3" }, // thumbstick press on xr-standard
  ],
  back: [
    { source: "keyboard", code: "Backspace" },
    { source: "gamepad", code: "1" }, // B / Circle
    { source: "xr-controller", code: "1" },
  ],
  primary: [
    { source: "pointer", code: "left" },
    { source: "keyboard", code: "KeyE" },
    { source: "gamepad", code: "0" },
    { source: "xr-controller", code: "4" },
  ],
  secondary: [
    { source: "pointer", code: "right" },
    { source: "keyboard", code: "KeyQ" },
    { source: "gamepad", code: "2" }, // X / Square
    { source: "xr-controller", code: "5" },
  ],
};
