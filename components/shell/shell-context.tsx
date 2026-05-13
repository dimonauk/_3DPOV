"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  defaultShellState,
  loadShellState,
  saveShellState,
  type PanelKey,
  type ShellState,
} from "lib/shell/state";

type TerminalLine = {
  id: number;
  kind: "system" | "aura" | "user" | "error" | "info";
  text: string;
};

type ShellContextValue = {
  state: ShellState;
  /** True once the client has hydrated from localStorage. Lets the
   * server-rendered closed panels mount before the first toggle. */
  hydrated: boolean;
  toggle: (key: PanelKey) => void;
  setOpen: (key: PanelKey, open: boolean) => void;
  /** Terminal lines — the rolling activity feed plus any user echo. */
  terminalLines: TerminalLine[];
  appendTerminalLine: (line: Omit<TerminalLine, "id">) => void;
  clearTerminal: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

let lineIdCounter = 0;
const nextLineId = (): number => {
  lineIdCounter += 1;
  return lineIdCounter;
};

export function ShellProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShellState>(defaultShellState);
  const [hydrated, setHydrated] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);

  // Hydrate from localStorage once on mount. Server renders all closed;
  // client picks up the visitor's last shape and slides into it.
  useEffect(() => {
    setState(loadShellState());
    setHydrated(true);
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    saveShellState(state);
  }, [state, hydrated]);

  const toggle = useCallback((key: PanelKey) => {
    setState((prev) => ({
      open: { ...prev.open, [key]: !prev.open[key] },
    }));
  }, []);

  const setOpen = useCallback((key: PanelKey, open: boolean) => {
    setState((prev) => ({ open: { ...prev.open, [key]: open } }));
  }, []);

  const appendTerminalLine = useCallback(
    (line: Omit<TerminalLine, "id">) => {
      setTerminalLines((prev) => [...prev, { ...line, id: nextLineId() }]);
    },
    [],
  );

  const clearTerminal = useCallback(() => {
    setTerminalLines([]);
  }, []);

  const value = useMemo<ShellContextValue>(
    () => ({
      state,
      hydrated,
      toggle,
      setOpen,
      terminalLines,
      appendTerminalLine,
      clearTerminal,
    }),
    [
      state,
      hydrated,
      toggle,
      setOpen,
      terminalLines,
      appendTerminalLine,
      clearTerminal,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell must be used inside a ShellProvider");
  }
  return ctx;
}

export type { TerminalLine };
