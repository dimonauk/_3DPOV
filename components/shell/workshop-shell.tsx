"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ShellProvider, useShell } from "components/shell/shell-context";
import { PanelTab } from "components/shell/panel-tab";
import { LeftPanelBody } from "components/shell/left-panel";
import { RightPanelBody } from "components/shell/right-panel";
import { BottomTerminalBody } from "components/shell/bottom-terminal";

/**
 * Paths where the workshop shell should NOT appear. The veil page
 * ships its own layout; the shell would only confuse it.
 */
const EXCLUDED_PREFIXES = ["/coming-soon"];

function shouldShowShell(pathname: string | null): boolean {
  if (!pathname) return true;
  return !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Detect a mobile-class viewport with a media-query listener. Returns
 * false during SSR so the desktop grid markup is the initial render.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function DesktopShell({ children }: { children: ReactNode }) {
  const { state, hydrated } = useShell();
  // The shell store uses zustand persist (localStorage). On SSR + the
  // very first client render, the store reports its default state
  // (all panels closed). After mount, persist rehydrates and any panels
  // the visitor previously had open snap to the persisted state — which
  // diverges from the SSR render and triggers a hydration warning on
  // every page that mounts the shell (~20 routes site-wide).
  //
  // Fix: force the effective open-state to all-closed until `hydrated`
  // flips true. SSR + first client paint match; the user's saved layout
  // applies on the next re-render with no warning.
  const left = hydrated ? state.open.left : false;
  const right = hydrated ? state.open.right : false;
  const terminal = hydrated ? state.open.terminal : false;

  const leftWidth = left
    ? "var(--shell-panel-width, 280px)"
    : "0px";
  const rightWidth = right
    ? "var(--shell-panel-width, 280px)"
    : "0px";
  const terminalHeight = terminal
    ? "var(--shell-terminal-height, 200px)"
    : "0px";

  // Grid columns: [left-tab] [left-panel] [main] [right-panel] [right-tab]
  // Grid rows:    [content] [bottom-tab] [terminal]
  return (
    <div
      className="relative grid w-full"
      style={{
        gridTemplateColumns: `var(--shell-tab-width, 32px) ${leftWidth} minmax(0, 1fr) ${rightWidth} var(--shell-tab-width, 32px)`,
        gridTemplateRows: `minmax(0, 1fr) var(--shell-tab-height, 28px) ${terminalHeight}`,
        transition: "grid-template-columns 250ms ease-out, grid-template-rows 250ms ease-out",
      }}
    >
      {/* Left tab — column 1, content row */}
      <div
        className="row-start-1 col-start-1 row-span-1"
        style={{ gridRow: "1 / span 1" }}
      >
        <PanelTab panel="left" orientation="left" label="Navigate" />
      </div>

      {/* Left panel — column 2 */}
      <aside
        id="shell-panel-left"
        aria-hidden={left ? "false" : "true"}
        className={`row-start-1 col-start-2 overflow-hidden border-r border-warm-black-800 bg-warm-black-900/60 backdrop-blur-sm ${left ? "" : "pointer-events-none"}`}
        style={{ gridRow: "1 / span 1" }}
      >
        {left ? <LeftPanelBody /> : null}
      </aside>

      {/* Main content — column 3, content row */}
      <main
        className="row-start-1 col-start-3 min-w-0 overflow-x-hidden"
        style={{ gridRow: "1 / span 1" }}
      >
        {children}
      </main>

      {/* Right panel — column 4 */}
      <aside
        id="shell-panel-right"
        aria-hidden={right ? "false" : "true"}
        className={`row-start-1 col-start-4 overflow-hidden border-l border-warm-black-800 bg-warm-black-900/60 backdrop-blur-sm ${right ? "" : "pointer-events-none"}`}
        style={{ gridRow: "1 / span 1" }}
      >
        {right ? <RightPanelBody /> : null}
      </aside>

      {/* Right tab — column 5 */}
      <div
        className="row-start-1 col-start-5"
        style={{ gridRow: "1 / span 1" }}
      >
        <PanelTab panel="right" orientation="right" label="Inspect" />
      </div>

      {/* Bottom tab — full width on row 2 */}
      <div className="col-span-5 col-start-1 row-start-2">
        <PanelTab panel="terminal" orientation="bottom" label="Terminal" />
      </div>

      {/* Terminal — full width on row 3 */}
      <div
        id="shell-panel-terminal"
        aria-hidden={terminal ? "false" : "true"}
        className={`col-span-5 col-start-1 row-start-3 overflow-hidden border-t border-cyan-500/40 ${terminal ? "" : "pointer-events-none"}`}
        style={{
          boxShadow: terminal
            ? "0 -1px 6px -2px rgba(0,243,255,0.4)"
            : "none",
        }}
      >
        {terminal ? <BottomTerminalBody /> : null}
      </div>
    </div>
  );
}

function MobileShell({ children }: { children: ReactNode }) {
  const { state, setOpen, hydrated } = useShell();
  // Same persist-vs-SSR mismatch as DesktopShell — see comment there.
  const left = hydrated ? state.open.left : false;
  const right = hydrated ? state.open.right : false;
  const terminal = hydrated ? state.open.terminal : false;

  return (
    <div className="relative w-full">
      {/* Main content &mdash; full width on mobile */}
      <main className="min-w-0">{children}</main>

      {/* Floating left tab */}
      <div className="fixed left-0 top-1/2 z-40 -translate-y-1/2">
        <PanelTab panel="left" orientation="left" label="Nav" />
      </div>

      {/* Floating right tab */}
      <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
        <PanelTab panel="right" orientation="right" label="Inspect" />
      </div>

      {/* Bottom tab — full-width, fixed above the terminal slot */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          transform: terminal
            ? "translateY(calc(-1 * var(--shell-mobile-terminal-height, 30vh)))"
            : "translateY(0)",
          transition: "transform 250ms ease-out",
        }}
      >
        <PanelTab panel="terminal" orientation="bottom" label="Terminal" />
      </div>

      {/* Left drawer — full-height overlay */}
      {left ? (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigator"
        >
          <button
            type="button"
            onClick={() => setOpen("left", false)}
            aria-label="Close navigator"
            className="flex-1 bg-warm-black-950/70 backdrop-blur-sm"
          />
          <div className="relative h-full w-[80%] max-w-sm overflow-hidden border-r border-warm-black-800 bg-warm-black-950">
            <button
              type="button"
              onClick={() => setOpen("left", false)}
              aria-label="Close navigator"
              className="absolute right-2 top-2 z-10 h-7 w-7 rounded-sm border border-warm-black-700 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              &times;
            </button>
            <LeftPanelBody />
          </div>
        </div>
      ) : null}

      {/* Right drawer — full-height overlay */}
      {right ? (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Inspector"
        >
          <div className="relative ml-auto h-full w-[80%] max-w-sm overflow-hidden border-l border-warm-black-800 bg-warm-black-950">
            <button
              type="button"
              onClick={() => setOpen("right", false)}
              aria-label="Close inspector"
              className="absolute left-2 top-2 z-10 h-7 w-7 rounded-sm border border-warm-black-700 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
            >
              &times;
            </button>
            <RightPanelBody />
          </div>
          <button
            type="button"
            onClick={() => setOpen("right", false)}
            aria-label="Close inspector"
            className="flex-1 bg-warm-black-950/70 backdrop-blur-sm"
          />
        </div>
      ) : null}

      {/* Bottom terminal — anchored bottom, ~30vh */}
      <div
        id="shell-panel-terminal-mobile"
        aria-hidden={terminal ? "false" : "true"}
        className={`fixed bottom-0 left-0 right-0 z-30 overflow-hidden border-t border-cyan-500/40 ${terminal ? "" : "pointer-events-none"}`}
        style={{
          height: terminal
            ? "var(--shell-mobile-terminal-height, 30vh)"
            : "0px",
          transition: "height 250ms ease-out",
          boxShadow: terminal
            ? "0 -1px 6px -2px rgba(0,243,255,0.4)"
            : "none",
        }}
      >
        {terminal ? <BottomTerminalBody /> : null}
      </div>
    </div>
  );
}

function ShellSwitch({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileShell>{children}</MobileShell>
  ) : (
    <DesktopShell>{children}</DesktopShell>
  );
}

/**
 * Public entry. Decides whether the shell appears at all (off on the
 * coming-soon veil) and wraps the rest of the page in the provider +
 * the appropriate desktop/mobile shape.
 */
export function WorkshopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <ShellProvider>
      <ShellSwitch>{children}</ShellSwitch>
    </ShellProvider>
  );
}
