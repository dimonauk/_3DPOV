"use client";

/**
 * components/theme/theme-context.tsx
 *
 * Day/night theme toggle for Holoflow Studio.
 *
 * - Default: "day" (gallery-first — parchment bg, dark text).
 * - Persists to localStorage under "hf-theme".
 * - Sets data-theme on <html> so every CSS var override in globals.css fires.
 * - SSR-safe: context starts in "day" (matches html[data-theme="day"] in
 *   layout.tsx), then syncs from storage on mount.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "day" | "night";

const STORAGE_KEY = "hf-theme";
const DEFAULT: Theme = "day";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: DEFAULT,
  toggle: () => {},
});

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start at DEFAULT — matches the SSR html[data-theme="day"] attribute.
  const [theme, setTheme] = useState<Theme>(DEFAULT);

  // On mount: sync from storage. If user stored "night", switch over.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const resolved: Theme =
        stored === "night" || stored === "day" ? stored : DEFAULT;
      setTheme(resolved);
      applyTheme(resolved);
    } catch {
      applyTheme(DEFAULT);
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === "day" ? "night" : "day";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop — private browsing, quota, etc. */
    }
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
