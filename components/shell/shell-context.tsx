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
  useShellStore,
  type PanelKey,
  type ShellState,
} from "lib/state/shell";

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
  const open = useShellStore((s) => s.open);
  const toggleStore = useShellStore((s) => s.toggle);
  const setOpenStore = useShellStore((s) => s.setOpen);
  const [hydrated, setHydrated] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);

  const state: ShellState = useMemo(() => ({ open }), [open]);

  // zustand's persist middleware hydrates async on the client. We mark
  // hydrated true after first paint so components can rely on the SSR
  // closed-default-then-slide-in transition.
  useEffect(() => {
    setHydrated(true);
  }, []);

  const toggle = useCallback(
    (key: PanelKey) => {
      toggleStore(key);
    },
    [toggleStore],
  );

  const setOpen = useCallback(
    (key: PanelKey, open: boolean) => {
      setOpenStore(key, open);
    },
    [setOpenStore],
  );

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
