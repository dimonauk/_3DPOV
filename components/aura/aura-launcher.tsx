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
 * See `SHOW_ON_PATHS` below. Pages NOT in the list don't mount the
 * launcher at all (returns null) — keeps her off the home page, the
 * admin routes, the studio CMS, etc.
 */

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { useVoice } from "components/aura/voice/use-voice";
import { aura } from "lib/cast/aura";
import {
  DEFAULT_WEBGPU_MODEL,
  probeWebGpuChatSupport,
  respondWebGpu,
  type WebGpuChatSupport,
} from "lib/capabilities/agent/dialogue-webgpu";
import {
  parseAuraStream,
  type AuraClientAction,
  type AuraCardSummary,
} from "lib/aura/parse-ui-stream";

type ToolCallRecord = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "complete" | "error";
  summary?: string;
  action?: AuraClientAction;
  cards?: AuraCardSummary[];
  card?: AuraCardSummary;
};
type Turn = {
  role: "user" | "model";
  text: string;
  /** Agent-mode tool calls fired during this turn. Not persisted. */
  toolCalls?: ToolCallRecord[];
};

/** Paths where Aura shows. Match by prefix (or by equality for "/"). */
const SHOW_ON_PATHS = [
  // Homepage — concierge greeting + route-finding for first-time
  // visitors. "/" only matches exactly via the equality check; it
  // does NOT prefix-match every URL.
  "/",
  // Cards platform: the gallery, the designer, bulk import.
  // Per-card landings live at /c/[slug] and are HIDDEN below so
  // the card's own Aura panel (AuraCompanion) wins on those routes.
  "/cards",
  // Visitor's saved wallet collection.
  "/wallet",
  // Original allow-list (long-form content + studio chambers).
  "/articles",
  "/journal",
  "/tutorials",
  "/codex",
  "/research",
  "/atelier",
  "/holo-walk",
  "/aerial",
  "/cast",
  "/bureau",
  "/play",
  "/chrono-protocol",
  "/aura",
];

/** Paths where Aura is explicitly hidden, even if prefix-matched. */
const HIDE_ON_PATHS = [
  "/admin",
  "/api",
  "/studio",
  "/aura/web-llm", // the dedicated chat page has its own embedded UI
  // The per-card landing pages have their own card-scoped Aura panel
  // (components/ar/AuraCompanion.tsx) inside the Avatar tab — two
  // Auras would compete for the visitor's attention.
  "/c",
  // Owner-only backstage. She doesn't host the host — owners working
  // on their own card management aren't visitors needing routing.
  // (Future: a "backstage mode" persona that drafts replies + summarises
  // analytics. For now, stay out of their way.)
  "/cards/mine",
];

function shouldShow(pathname: string | null): boolean {
  if (!pathname) return false;
  if (HIDE_ON_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return SHOW_ON_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const STORAGE_KEY = "holoflow:aura-chat:v1";
const OPEN_KEY = "holoflow:aura-chat:open";
const AGENT_KEY = "holoflow:aura-chat:agent";
const MAX_HISTORY = 30;

function loadLocalHistory(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Turn =>
        typeof t === "object" &&
        t !== null &&
        ((t as Turn).role === "user" || (t as Turn).role === "model") &&
        typeof (t as Turn).text === "string",
    );
  } catch {
    return [];
  }
}

function saveLocalHistory(history: Turn[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-MAX_HISTORY)),
    );
  } catch {
    // quota / private mode — fall through
  }
}

function pathContext(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (!first) return "The visitor is on the homepage — first impression. The hypercube hero dominates above the fold. Read what they're looking for and route them: /cards for the AR business card gallery + designer, /atelier for the studio's portfolio, /shop for editioned waveguide sculptures + prints. Or just answer their question.";
  const rest = segments.slice(1).join("/");

  // Codex entries: produce a richer "you're reading about X" prompt so
  // Aura grounds her answers in the specific topic. The slug is the
  // topic — no codex-data import needed (avoids pulling 33 body
  // components into the launcher bundle).
  if (first === "codex" && segments.length > 1) {
    const slug = segments[1] ?? "";
    const topic = slug.replace(/-/g, " ").trim();
    if (topic) {
      return `The visitor is reading the studio's codex entry on "${topic}". Ground your replies in what you know about this topic. Where relevant, point them at the studio's own codex.`;
    }
  }

  // Cards platform: /cards/design and /cards/mine/import get special
  // sub-page treatment so Aura knows the visitor is mid-task, not
  // just browsing.
  if (first === "cards" && segments.length > 1) {
    const sub = segments[1];
    if (sub === "design") {
      return 'The visitor is at the AR business card designer (/cards/design). They can: scan a physical business card to autofill the form (📸 AI Scanner button at the top), pick from 9 templates, or start blank. Bulk CSV import is at /cards/mine/import for owners. Encourage them to try the scanner — it costs about a tenth of a cent and saves typing.';
    }
  }
  if (first === "wallet") {
    return "The visitor is browsing their saved card wallet (/wallet). These are AR business cards they've collected from scanning others'.";
  }
  if (first === "c" && segments.length > 1) {
    const slug = segments[1] ?? "";
    return `The visitor is on the public card landing for "${slug}" (/c/${slug}). NOTE: this page has its own per-card Aura panel inside the Avatar tab — you (site-wide Aura) are HIDDEN here, so this branch never fires in practice. Kept for safety.`;
  }

  const blurbs: Record<string, string> = {
    articles: "The visitor is reading an article",
    journal: "The visitor is reading a journal entry",
    tutorials: "The visitor is reading a tutorial",
    codex: "The visitor is browsing the codex",
    photographs: "The visitor is in the photograph gallery",
    aerial: "The visitor is on the aerial / drone page",
    atelier: "The visitor is in the atelier",
    "holo-walk": "The visitor is on a HoloWalk page",
    research: "The visitor is on the research notebook",
    play: "The visitor is on the play page",
    cast: "The visitor is meeting the cast",
    bureau: "The visitor is at the bureau",
    "chrono-protocol": "The visitor is in the chrono protocol",
    aura: "The visitor is on an Aura-specific page",
    cards:
      "The visitor is in the public AR business cards gallery (/cards). Demo cards by Dimona + the studio. They can browse, scan QR codes, or hit 'Design a new card' to make their own at /cards/design.",
  };
  const base = blurbs[first] ?? `The visitor is on /${first}`;
  return rest ? `${base} (${rest}).` : `${base}.`;
}

async function loadServerHistory(idToken: string): Promise<Turn[]> {
  try {
    const res = await fetch("/api/aura/history", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { turns?: unknown };
    if (!Array.isArray(json.turns)) return [];
    return json.turns.filter(
      (t): t is Turn =>
        typeof t === "object" &&
        t !== null &&
        ((t as Turn).role === "user" || (t as Turn).role === "model") &&
        typeof (t as Turn).text === "string",
    );
  } catch {
    return [];
  }
}

async function saveServerTurns(
  idToken: string,
  turns: Turn[],
): Promise<void> {
  try {
    await fetch("/api/aura/history", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ turns }),
    });
  } catch {
    // best effort
  }
}

async function clearServerHistory(idToken: string): Promise<void> {
  try {
    await fetch("/api/aura/history", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    // best effort
  }
}

async function callServerSideChat(
  history: Turn[],
  userText: string,
  context: string | undefined,
  idToken: string | null,
): Promise<string> {
  const res = await fetch("/api/aura/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({
      history: history.slice(-MAX_HISTORY),
      userText,
      context: context ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`server chat ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { text?: string };
  return typeof json.text === "string" ? json.text : "";
}

/**
 * Call /api/aura/agent — the streaming endpoint with tool use. Yields
 * raw AuraStreamEvents via the parser; caller drives UI updates.
 *
 * History shape difference: the agent endpoint expects OpenAI-style
 * messages with role "user" | "assistant". Local Turn type uses
 * "user" | "model". We map at the boundary.
 */
async function* callAuraAgent(
  history: Turn[],
  userText: string,
  pathname: string,
  idToken: string | null,
) {
  const messages = [...history, { role: "user", text: userText } as Turn].map(
    (t) => ({
      role: t.role === "user" ? ("user" as const) : ("assistant" as const),
      content: t.text,
    }),
  );
  const res = await fetch("/api/aura/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ messages, pathname }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`agent ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!res.body) throw new Error("agent: no response body");
  yield* parseAuraStream(res.body);
}

/**
 * ToolCallChip — visual badge for an Aura tool call rendered inline in
 * the chat. Shows the tool name, the most important argument value,
 * and a state indicator (pending, complete, error).
 *
 * For tools that return cards (find_cards, show_card), the cards
 * render as clickable thumbnails below the chip header.
 */
function ToolCallChip({
  call,
  onCardClick,
}: {
  call: ToolCallRecord;
  onCardClick: (slug: string) => void;
}) {
  const ICONS: Record<string, string> = {
    navigate_to: "→",
    find_cards: "⌕",
    show_card: "▣",
    capture_lead: "✉",
    open_designer: "✎",
    open_booking: "📅",
  };
  const LABELS: Record<string, string> = {
    navigate_to: "Navigating",
    find_cards: "Searching cards",
    show_card: "Surfacing card",
    capture_lead: "Saving lead",
    open_designer: "Opening designer",
    open_booking: "Booking",
  };

  const icon = ICONS[call.name] ?? "▸";
  const label = LABELS[call.name] ?? call.name;
  const stateGlyph =
    call.status === "complete" ? "✓" : call.status === "error" ? "!" : "…";

  // Argument preview — most distinctive arg per tool.
  let argPreview = "";
  const a = call.args as Record<string, unknown>;
  if (call.name === "navigate_to" && typeof a["path"] === "string") {
    argPreview = a["path"] as string;
  } else if (call.name === "find_cards" && typeof a["query"] === "string") {
    argPreview = `"${a["query"]}"`;
  } else if (call.name === "show_card" && typeof a["slug"] === "string") {
    argPreview = a["slug"] as string;
  } else if (call.name === "capture_lead" && typeof a["email"] === "string") {
    argPreview = a["email"] as string;
  } else if (call.name === "open_booking" && typeof a["purpose"] === "string") {
    argPreview = a["purpose"] as string;
  }

  return (
    <div
      className={`flex flex-col gap-1.5 rounded border px-2.5 py-1.5 text-xs ${
        call.status === "complete"
          ? "border-pink-300/30 bg-pink-200/[0.04]"
          : call.status === "error"
            ? "border-rose-300/40 bg-rose-200/[0.05]"
            : "border-warm-black-700 bg-warm-black-900/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-pink-300">{icon}</span>
        <span className="text-pink-100/80">{label}</span>
        {argPreview && (
          <span className="truncate text-chrome-400">— {argPreview}</span>
        )}
        <span
          className={`ml-auto ${
            call.status === "pending"
              ? "animate-pulse text-chrome-500"
              : call.status === "error"
                ? "text-rose-300"
                : "text-pink-300"
          }`}
        >
          {stateGlyph}
        </span>
      </div>
      {call.cards && call.cards.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {call.cards.map((card) => (
            <button
              key={card.slug}
              type="button"
              onClick={() => onCardClick(card.slug)}
              className="flex items-center gap-2 rounded border border-warm-black-700 bg-warm-black-950/60 px-2 py-1 text-left text-[11px] hover:border-pink-300/50"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: card.primary }}
                aria-hidden
              />
              <span className="text-pink-100">{card.name}</span>
              {card.tagline && (
                <span className="text-chrome-500 truncate max-w-[200px]">
                  — {card.tagline}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {call.card && (
        <button
          type="button"
          onClick={() => call.card && onCardClick(call.card.slug)}
          className="mt-1 flex items-center gap-2 rounded border border-warm-black-700 bg-warm-black-950/60 px-2 py-1 text-left text-[11px] hover:border-pink-300/50"
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: call.card.primary }}
            aria-hidden
          />
          <span className="text-pink-100">{call.card.name}</span>
          {call.card.tagline && (
            <span className="text-chrome-500 truncate max-w-[220px]">
              — {call.card.tagline}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export default function AuraLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const voice = useVoice();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [support, setSupport] = useState<WebGpuChatSupport | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [streamingTools, setStreamingTools] = useState<ToolCallRecord[]>([]);
  const [busy, setBusy] = useState(false);
  /**
   * Agent mode: when on, /api/aura/agent (tool-enabled) is the server
   * path. When off, /api/aura/chat (text-only). Default on — Aura is
   * meant to act, not just talk.
   */
  const [agentMode, setAgentMode] = useState(true);
  const [loadProgress, setLoadProgress] = useState<{
    text: string;
    progress: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speakerOn, setSpeakerOn] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Hydrate on mount.
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

  // Load history once auth state is known — Firestore for logged-in
  // visitors, localStorage otherwise.
  useEffect(() => {
    if (!mounted || authLoading) return;
    let cancelled = false;
    (async () => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const fromServer = await loadServerHistory(idToken);
          if (!cancelled) {
            // Merge any anonymous localStorage history that pre-dates
            // sign-in (one-time-only — clear local after merge so
            // sign-in/sign-out toggling doesn't duplicate).
            const local = loadLocalHistory();
            const merged = local.length > 0 ? [...fromServer, ...local] : fromServer;
            setHistory(merged);
            setHistoryLoaded(true);
            if (local.length > 0) {
              saveLocalHistory([]);
              void saveServerTurns(idToken, local);
            }
          }
        } catch {
          if (!cancelled) {
            setHistory(loadLocalHistory());
            setHistoryLoaded(true);
          }
        }
      } else {
        setHistory(loadLocalHistory());
        setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, authLoading, user]);

  // Persist open/closed.
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open, mounted]);

  // Auto-scroll on content change.
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [history, streaming, open]);

  const useWebGpu = support?.recommended === true;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const userTurn: Turn = { role: "user", text };
    const next = [...history, userTurn];
    setHistory(next);
    setBusy(true);
    setStreaming("");

    // Optimistic local persist; server persist after we have the reply.
    if (!user) saveLocalHistory(next);

    const ctx = pathContext(pathname);
    const idToken = user ? await user.getIdToken().catch(() => null) : null;

    try {
      let full = "";
      const turnToolCalls: ToolCallRecord[] = [];

      if (agentMode) {
        // Agent path: streaming with tool use.
        setStreamingTools([]);
        for await (const evt of callAuraAgent(history, text, pathname ?? "/", idToken)) {
          if (evt.type === "text-delta") {
            full += evt.text;
            setStreaming(full);
          } else if (evt.type === "tool-call") {
            const rec: ToolCallRecord = {
              id: evt.toolCallId,
              name: evt.toolName,
              args: evt.args,
              status: "pending",
            };
            turnToolCalls.push(rec);
            setStreamingTools([...turnToolCalls]);
          } else if (evt.type === "tool-result") {
            const idx = turnToolCalls.findIndex((r) => r.id === evt.toolCallId);
            if (idx >= 0) {
              const rec = turnToolCalls[idx]!;
              const out =
                evt.result && typeof evt.result === "object"
                  ? (evt.result as { summary?: string })
                  : undefined;
              rec.status = "complete";
              if (out?.summary) rec.summary = out.summary;
              if (evt.action) rec.action = evt.action;
              // Pull surfaced cards/card off the action for inline rendering.
              if (evt.action?.kind === "showCards") rec.cards = evt.action.cards;
              if (evt.action?.kind === "showCard") rec.card = evt.action.card;
              setStreamingTools([...turnToolCalls]);

              // Execute the client-side effect of the action.
              if (evt.action?.kind === "navigate" && evt.action.path) {
                // Defer so the visitor sees the tool chip flip to "done"
                // before the page changes.
                setTimeout(() => router.push(evt.action!.kind === "navigate" ? evt.action!.path : "/"), 600);
              }
            }
          } else if (evt.type === "error") {
            throw new Error(evt.message);
          }
        }
      } else if (useWebGpu) {
        await respondWebGpu({
          bible: aura,
          history,
          userText: text,
          model: DEFAULT_WEBGPU_MODEL,
          onProgress: (p) => setLoadProgress(p),
          onStream: (_chunk, acc) => {
            full = acc;
            setStreaming(acc);
          },
        });
      } else {
        full = await callServerSideChat(history, text, ctx, idToken);
        setStreaming(full);
      }
      const modelTurn: Turn = {
        role: "model",
        text: full,
        ...(turnToolCalls.length > 0 ? { toolCalls: turnToolCalls } : {}),
      };
      const final = [...next, modelTurn];
      setHistory(final);
      setStreaming(null);
      setStreamingTools([]);
      setLoadProgress(null);

      // Speak Aura's reply if the speaker toggle is on. Don't await —
      // playback can take seconds and we don't want to block the input.
      if (speakerOn && full) {
        void voice.speak(full);
      }

      if (user && idToken) {
        // WebGPU + agent paths: server hasn't already persisted the turn.
        // Gemini chat path: /api/aura/chat persists itself.
        if (useWebGpu || agentMode) {
          void saveServerTurns(idToken, [userTurn, modelTurn]);
        }
      } else {
        saveLocalHistory(final);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStreaming(null);
    } finally {
      setBusy(false);
    }
  }, [input, busy, history, useWebGpu, pathname, user, speakerOn, voice, agentMode, router]);

  // Mic: toggle recording, drop transcription into the input field
  // when it returns.
  const onMicClick = useCallback(async () => {
    const transcript = await voice.toggleMic();
    if (transcript !== null && transcript.trim()) {
      setInput((cur) => (cur ? `${cur} ${transcript}` : transcript));
    }
  }, [voice]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    setError(null);
    saveLocalHistory([]);
    if (user) {
      const idToken = await user.getIdToken().catch(() => null);
      if (idToken) void clearServerHistory(idToken);
    }
  }, [user]);

  // ---- Render gating ---------------------------------------------------

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
        <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-warm-black-800 bg-warm-black-950/95 backdrop-blur-md md:bottom-5 md:right-5 md:h-[min(640px,80vh)] md:w-[400px] md:rounded-md md:border">
          <header className="flex items-center justify-between border-b border-warm-black-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-300" />
              <span className="font-display text-base text-pink-100">
                Aura
              </span>
              <span className="text-[10px] uppercase tracking-wider text-chrome-500">
                {useWebGpu ? "local" : "hosted"}
                {user && " · synced"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAgentMode((on) => {
                    const next = !on;
                    try {
                      window.localStorage.setItem(AGENT_KEY, next ? "1" : "0");
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }}
                aria-label={agentMode ? "Switch to plain chat (no tools)" : "Switch to smart mode (tools)"}
                title={
                  agentMode
                    ? "Smart mode: Aura can navigate, find cards, capture leads"
                    : "Chat mode: plain text replies only"
                }
                className={`text-base leading-none transition ${
                  agentMode
                    ? "text-pink-200 hover:text-pink-100"
                    : "text-chrome-500 hover:text-pink-200"
                }`}
              >
                {agentMode ? "⚡" : "·"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeakerOn((on) => {
                    if (on && voice.speaking) voice.stopSpeaking();
                    return !on;
                  });
                }}
                aria-label={speakerOn ? "Mute Aura" : "Let Aura speak"}
                title={
                  speakerOn
                    ? "Aura speaks her replies (Kokoro TTS)"
                    : "Aura's replies are text-only"
                }
                className={`text-base leading-none transition ${
                  speakerOn
                    ? "text-pink-200 hover:text-pink-100"
                    : "text-chrome-500 hover:text-pink-200"
                }`}
              >
                {speakerOn ? "♪" : "♪̸"}
              </button>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => void clearHistory()}
                  className="text-xs text-chrome-400 hover:text-pink-200"
                  aria-label="Clear conversation"
                >
                  clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-chrome-300 hover:text-pink-100"
              >
                ✕
              </button>
            </div>
          </header>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
            {history.length === 0 && streaming === null && historyLoaded && (
              <div className="text-sm text-chrome-400">
                {support === null
                  ? "Probing your device…"
                  : support.recommended
                    ? "Say hi. The first message fetches a model into your browser cache (~2 GB, one time, then she lives there)."
                    : `Aura on this device runs through the studio's hosted backend.${
                        support.reason ? ` ${support.reason}.` : ""
                      }`}
              </div>
            )}
            {history.map((t, i) => (
              <div
                key={i}
                className={`mb-3 ${
                  t.role === "user" ? "text-chrome-300" : "text-pink-100"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-chrome-500">
                  {t.role === "user" ? "you" : "aura"}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{t.text}</div>
                {t.toolCalls && t.toolCalls.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {t.toolCalls.map((tc) => (
                      <ToolCallChip key={tc.id} call={tc} onCardClick={(slug) => router.push(`/c/${slug}`)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {streaming !== null && (
              <div className="text-pink-100">
                <div className="text-[10px] uppercase tracking-wider text-chrome-500">
                  aura
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm">
                  {streaming}
                  <span className="animate-pulse">▊</span>
                </div>
                {streamingTools.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {streamingTools.map((tc) => (
                      <ToolCallChip key={tc.id} call={tc} onCardClick={(slug) => router.push(`/c/${slug}`)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subscription nudge: only when anon, only after some
                engagement. Phrased as Aura herself for tone. */}
            {!user && history.length >= 6 && history.length % 6 === 0 && (
              <div className="my-3 rounded border border-pink-200/20 bg-pink-200/[0.03] px-3 py-2 text-xs text-pink-200/80">
                If you sign in, I&rsquo;ll remember this conversation across
                your devices. Subscribers get a brighter version of me.
              </div>
            )}
          </div>

          {loadProgress && (
            <div className="border-t border-warm-black-800 px-4 py-2 text-[11px] text-chrome-400">
              {loadProgress.text}
              {loadProgress.progress > 0 && (
                <span className="ml-2 text-pink-200">
                  {(loadProgress.progress * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}
          {error && (
            <div className="border-t border-rose-900 bg-rose-950/40 px-4 py-2 text-[11px] text-rose-200">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2 border-t border-warm-black-800 p-3"
          >
            <button
              type="button"
              onClick={() => void onMicClick()}
              disabled={busy || voice.transcribing}
              aria-label={voice.recording ? "Stop recording" : "Start recording"}
              title={
                voice.recording
                  ? "Recording — tap to stop and transcribe"
                  : voice.transcribing
                    ? "Transcribing…"
                    : "Speak to Aura (Whisper STT)"
              }
              className={`rounded border px-3 py-2 text-sm transition disabled:opacity-50 ${
                voice.recording
                  ? "border-rose-300 bg-rose-200/10 text-rose-100"
                  : "border-warm-black-800 text-chrome-400 hover:border-pink-200/60 hover:text-pink-200"
              }`}
            >
              {voice.recording ? "■" : voice.transcribing ? "…" : "🎙"}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                voice.recording
                  ? "Recording…"
                  : voice.transcribing
                    ? "Transcribing…"
                    : "Say something to Aura…"
              }
              disabled={busy || voice.recording || voice.transcribing}
              className="flex-1 rounded border border-warm-black-800 bg-warm-black-950 px-3 py-2 text-sm focus:border-pink-200 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded border border-pink-200/60 px-3 py-2 text-sm text-pink-100 hover:bg-pink-200/10 disabled:opacity-50"
            >
              {busy ? "…" : "→"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
