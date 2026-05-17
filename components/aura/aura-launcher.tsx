"use client";

/**
 * components/aura/aura-launcher.tsx — `<AuraLauncher />`.
 *
 * Floating bottom-right chat launcher mounted globally in the root
 * layout, but ONLY visible on pages in the allow-list — Aura is a
 * taster on a curated set of "complicated" pages, not on every
 * surface. The full-access version lives behind a subscription.
 *
 * # Tiered backends
 * - **WebGPU (default)**: zero server-side per-call cost. Visitor's
 *   browser runs Llama-3.2-3B-Instruct via @mlc-ai/web-llm.
 * - **Gemini (fallback)**: server-side `/api/aura/chat` when the
 *   visitor's device can't run WebGPU. Paid per call.
 *
 * # Memory tiers
 * - **Anonymous**: localStorage. Single device, single browser.
 * - **Logged-in (free)**: Firestore via /api/aura/history. Cross-
 *   device. Loaded on mount, written through on each turn.
 * - **Subscribed (future)**: vector memory, longer context windows,
 *   richer models. The launcher hints at it for anon visitors after
 *   they've engaged.
 *
 * # Where Aura appears
 * See `aura-launcher/path-gating.ts` SHOW_ON_PATHS. Pages NOT in
 * the list don't mount the launcher at all (returns null).
 *
 * Orchestrator only. The chat state machine lives in
 * aura-launcher/use-aura-chat.ts; the panel JSX in
 * launcher-panel.tsx; helpers in path-gating.ts, history-store.ts,
 * chat-api.ts, tool-call-chip.tsx, types.ts. Per
 * ARCHITECTURE.md Rule 1.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  probeWebGpuChatSupport,
  type WebGpuChatSupport,
} from "lib/capabilities/agent/dialogue-webgpu";

import { LauncherPanel } from "./aura-launcher/launcher-panel";
import { shouldShow } from "./aura-launcher/path-gating";
import { AGENT_KEY, OPEN_KEY } from "./aura-launcher/types";
import { useAuraChat } from "./aura-launcher/use-aura-chat";

export default function AuraLauncher() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [support, setSupport] = useState<WebGpuChatSupport | null>(null);
  const [agentMode, setAgentMode] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Hydrate on mount: open/closed + agent-mode preference + probe.
  useEffect(() => {
    setMounted(true);
    try {
      setOpen(window.localStorage.getItem(OPEN_KEY) === "1");
      // Agent mode: default on. Only off if user has explicitly turned
      // it off (stored as "0"). Any other value (or absent) -> on.
      const agentPref = window.localStorage.getItem(AGENT_KEY);
      if (agentPref === "0") setAgentMode(false);
    } catch {
      // ignore
    }
    let cancelled = false;
    probeWebGpuChatSupport().then((s) => {
      if (!cancelled) setSupport(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist open/closed.
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open, mounted]);

  // Persist agent-mode preference whenever the host flips it.
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(AGENT_KEY, agentMode ? "1" : "0");
    } catch {
      // ignore
    }
  }, [agentMode, mounted]);

  // ESC closes the launcher modal — keyboard-accessible parity with
  // the X button in the header. Attached at the document level so
  // focus can be anywhere inside the modal (input, buttons, scrollback)
  // and the keystroke still lands. No-op when closed so the listener
  // doesn't hijack ESC for other UI on the page (e.g. atelier modals).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const chat = useAuraChat({
    pathname,
    support,
    speakerOn,
    agentMode,
    mounted,
  });

  // Auto-scroll on content change.
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [chat.history, chat.streaming, open]);

  // Hide on non-allow-listed pages.
  if (!mounted || !shouldShow(pathname)) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Talk to Aura"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-pink-200/40 bg-warm-black-950/90 px-4 py-2.5 text-sm text-pink-100 shadow-lg backdrop-blur-sm transition hover:border-pink-200/80 hover:text-pink-50"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-pink-300" />
          <span>Talk to Aura</span>
        </button>
      )}

      {open && (
        <LauncherPanel
          scrollerRef={scrollerRef}
          history={chat.history}
          historyLoaded={chat.historyLoaded}
          streaming={chat.streaming}
          streamingTools={chat.streamingTools}
          loadProgress={chat.loadProgress}
          error={chat.error}
          input={chat.input}
          busy={chat.busy}
          agentMode={agentMode}
          setAgentMode={setAgentMode}
          speakerOn={speakerOn}
          setSpeakerOn={setSpeakerOn}
          user={chat.user}
          useWebGpu={chat.useWebGpu}
          support={support}
          voice={chat.voice}
          onSubmit={() => void chat.send()}
          onInputChange={chat.setInput}
          onMicClick={() => void chat.onMicClick()}
          onClear={() => void chat.clearHistory()}
          onClose={() => setOpen(false)}
          onCardClick={(slug) => chat.router.push(`/c/${slug}`)}
        />
      )}
    </>
  );
}
