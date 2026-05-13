/**
 * Workshop shell — client-side state.
 *
 * Three collapsible panels — left navigator, right inspector, bottom
 * terminal — each persisted across reloads in localStorage. The shell
 * defaults closed everywhere, so a first-time visitor lands on the
 * page itself and the workshop chrome stays out of the way until they
 * tap a tab.
 */

export type PanelKey = "left" | "right" | "terminal";

export type ShellState = {
  open: Record<PanelKey, boolean>;
};

export const defaultShellState: ShellState = {
  open: { left: false, right: false, terminal: false },
};

const LS_KEY = "holoflow-shell-v1";

/**
 * Read the persisted shell state from localStorage. On SSR or when
 * localStorage is unavailable / corrupt, returns the closed default.
 */
export function loadShellState(): ShellState {
  if (typeof window === "undefined") return defaultShellState;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaultShellState;
    const parsed = JSON.parse(raw) as Partial<ShellState> | null;
    if (!parsed || typeof parsed !== "object" || !parsed.open) {
      return defaultShellState;
    }
    return {
      open: {
        left: Boolean(parsed.open.left),
        right: Boolean(parsed.open.right),
        terminal: Boolean(parsed.open.terminal),
      },
    };
  } catch {
    return defaultShellState;
  }
}

/**
 * Persist the shell state. Silently no-ops on SSR / private-mode
 * browsers where storage is unavailable.
 */
export function saveShellState(state: ShellState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore — storage may be full or disabled */
  }
}
