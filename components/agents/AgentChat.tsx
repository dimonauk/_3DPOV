"use client";

/**
 * components/agents/AgentChat.tsx — Per-person agent chat surface.
 *
 * Posts to `/api/agents/[slug]/chat` and renders the streamed reply
 * using `readUIMessageStream` from `ai@^6`. Hand-rolled fetch loop
 * (no `@ai-sdk/react` dependency added — the surface is small enough
 * not to need it).
 *
 * Voice in user-facing strings: workshop-Dimona, British English.
 * No buzzwords. The footer note is the privacy posture.
 *
 * State machine:
 *   idle → submitting → streaming → idle
 *                     ↘ error → idle (with `connection` flipped)
 *
 * Connection indicator probes the endpoint with a HEAD-like check
 * (a no-op POST with empty messages returns 400 — that's a healthy
 * route reachable). 503 means Ollama is offline; the UI surfaces the
 * route's friendly message.
 */

import {
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { useCallback, useEffect, useRef, useState } from "react";

type AgentChatProps = {
  slug: string;
  profileName: string;
};

type Turn = { id: string; role: "user" | "assistant"; text: string };

type Connection =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "ollama-down"; hint: string }
  | { kind: "endpoint-missing" }
  | { kind: "unknown-error"; hint: string };

const STORAGE_KEY_PREFIX = "agent-chat:";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function probeEndpoint(slug: string): Promise<Connection> {
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(slug)}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Empty messages = 400 from a healthy route. 503 = Ollama down.
      body: JSON.stringify({ messages: [] }),
    });
    if (res.status === 400) return { kind: "ready" };
    if (res.status === 503) {
      const json = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;
      return {
        kind: "ollama-down",
        hint: json?.message ?? "Local Ollama isn't reachable.",
      };
    }
    if (res.status === 404) return { kind: "endpoint-missing" };
    return { kind: "unknown-error", hint: `Endpoint replied ${res.status}.` };
  } catch (err) {
    return {
      kind: "unknown-error",
      hint: err instanceof Error ? err.message : String(err),
    };
  }
}

function connectionLabel(c: Connection): string {
  switch (c.kind) {
    case "checking":
      return "checking…";
    case "ready":
      return "ready";
    case "ollama-down":
      return "ollama offline";
    case "endpoint-missing":
      return "endpoint missing";
    case "unknown-error":
      return "unreachable";
  }
}

function connectionTone(c: Connection): string {
  switch (c.kind) {
    case "ready":
      return "text-emerald-300";
    case "checking":
      return "text-chrome-400";
    default:
      return "text-pink-200";
  }
}

export default function AgentChat({ slug, profileName }: AgentChatProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<Connection>({ kind: "checking" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Restore prior local conversation (per-slug). Best-effort — if
  // storage blows up we just start fresh.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Turn[];
        if (Array.isArray(parsed)) setTurns(parsed.slice(-40));
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${slug}`,
        JSON.stringify(turns.slice(-40)),
      );
    } catch {
      /* ignore */
    }
  }, [slug, turns]);

  // Initial reachability probe.
  useEffect(() => {
    let cancelled = false;
    void probeEndpoint(slug).then((c) => {
      if (!cancelled) setConnection(c);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Auto-scroll the message list as new content arrives.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setErrorMsg(null);

    const userTurn: Turn = { id: newId(), role: "user", text };
    const assistantId = newId();
    const assistantTurn: Turn = { id: assistantId, role: "assistant", text: "" };
    setTurns((prev) => [...prev, userTurn, assistantTurn]);
    setDraft("");
    setBusy(true);

    const payload = {
      messages: [...turns, userTurn].map((t) => ({
        role: t.role,
        content: t.text,
      })),
    };

    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 503) {
        const json = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        const hint = json?.message ?? "Local Ollama isn't reachable.";
        setConnection({ kind: "ollama-down", hint });
        setTurns((prev) =>
          prev.map((t) =>
            t.id === assistantId
              ? {
                  ...t,
                  text:
                    "I can't reach a local Ollama runtime right now. " +
                    "Start one with `ollama serve` and pull the model, then " +
                    "give it another go.",
                }
              : t,
          ),
        );
        return;
      }

      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${body.slice(0, 200)}`);
      }

      setConnection({ kind: "ready" });

      // The route returns an SSE stream of UI message chunks (the AI
      // SDK v6 wire format). parseJsonEventStream turns the bytes into
      // ParseResult<UIMessageChunk> events; readUIMessageStream then
      // folds those into hydrated UIMessage snapshots.
      const chunkStream = parseJsonEventStream({
        stream: res.body,
        schema: uiMessageChunkSchema,
      }).pipeThrough(
        new TransformStream<{ success: boolean; value?: UIMessageChunk }, UIMessageChunk>({
          transform(parsed, controller) {
            if (parsed.success && parsed.value) controller.enqueue(parsed.value);
          },
        }),
      );

      for await (const message of readUIMessageStream({ stream: chunkStream })) {
        if (message.role !== "assistant") continue;
        const text = textOfMessage(message);
        setTurns((prev) =>
          prev.map((t) => (t.id === assistantId ? { ...t, text } : t)),
        );
      }
    } catch (err) {
      const hint = err instanceof Error ? err.message : String(err);
      setErrorMsg(hint);
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? {
                ...t,
                text:
                  "Something went sideways mid-reply. Have a look at the " +
                  "connection note below; if Ollama is up, try again.",
              }
            : t,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [busy, draft, slug, turns]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const clear = () => {
    setTurns([]);
    setErrorMsg(null);
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${slug}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-5 py-6 md:px-6 md:py-7">
      <header className="flex items-center justify-between">
        <div className="chrome-label">Chat with the agent</div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-chrome-500">connection:</span>
          <span className={connectionTone(connection)}>
            {connectionLabel(connection)}
          </span>
        </div>
      </header>

      {connection.kind === "ollama-down" ? (
        <p className="mt-3 text-xs leading-relaxed text-pink-200">
          {connection.hint}
        </p>
      ) : null}
      {connection.kind === "unknown-error" ? (
        <p className="mt-3 text-xs leading-relaxed text-pink-200">
          {connection.hint}
        </p>
      ) : null}

      <div
        ref={listRef}
        className="mt-5 max-h-[420px] min-h-[180px] overflow-y-auto rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-4 font-mono text-[13px] leading-relaxed"
      >
        {turns.length === 0 ? (
          <p className="text-chrome-500">
            No turns yet. Ask {profileName}&rsquo;s agent something — about the
            work, the scenes, where to see them next.
          </p>
        ) : (
          <ul className="space-y-3">
            {turns.map((t) => (
              <li key={t.id} className="flex gap-3">
                <span
                  className={
                    t.role === "user"
                      ? "shrink-0 text-pink-200"
                      : "shrink-0 text-emerald-300"
                  }
                >
                  {t.role === "user" ? "you" : "agent"} &gt;
                </span>
                <span className="whitespace-pre-wrap text-chrome-100">
                  {t.text || (busy ? "…" : "")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={`Ask ${profileName}'s agent — enter to send, shift+enter for a new line.`}
          className="w-full resize-none rounded-sm border border-warm-black-700 bg-warm-black-950/80 px-3 py-2 font-mono text-[13px] text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
          disabled={busy}
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={clear}
            disabled={busy || turns.length === 0}
            className="text-xs text-chrome-500 hover:text-pink-200 disabled:opacity-40"
          >
            Clear conversation
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || draft.trim().length === 0}
            className="rounded-sm border border-pink-200 px-3 py-1.5 font-mono text-xs text-pink-200 hover:bg-pink-200/10 disabled:opacity-40"
          >
            {busy ? "thinking…" : "send"}
          </button>
        </div>
      </div>

      {errorMsg ? (
        <p className="mt-3 text-xs text-pink-200">Last error: {errorMsg}</p>
      ) : null}

      <p className="mt-4 text-[11px] text-chrome-500">
        Powered by your local Ollama &mdash; bytes never leave your machine.
      </p>
    </section>
  );
}

function textOfMessage(message: UIMessage): string {
  const parts = message.parts ?? [];
  let out = "";
  for (const part of parts) {
    if (part.type === "text" && typeof part.text === "string") {
      out += part.text;
    }
  }
  return out;
}
