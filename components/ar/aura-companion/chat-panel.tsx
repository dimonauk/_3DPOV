"use client";

/**
 * components/ar/aura-companion/chat-panel.tsx — Collapsible chat
 * region for AuraCompanion: message log, tool-chip rendering, error
 * banner, input form, clear-conversation control.
 *
 * Extracted from AuraCompanion.tsx per ARCHITECTURE.md Rule 1. Pure
 * presentation — the host owns the chat state machine (via useAuraChat)
 * and the slug-validation/routing for tool-call card clicks.
 */

import { type RefObject } from "react";

import type { Card } from "lib/ar/types";

import { ToolCallChip } from "./tool-call-chip";
import type { ChatMessage } from "./types";

export function ChatPanel({
  card,
  logRef,
  messages,
  input,
  onInputChange,
  onSubmit,
  busy,
  error,
  onClear,
  onCardClick,
}: {
  card: Card;
  logRef: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  onClear: () => void;
  onCardClick: (slug: string) => void;
}) {
  const firstName = card.name.split(" ")[0];
  return (
    <div
      className="aura-chat"
      id="aura-chat-panel"
      role="region"
      aria-label={`Chat with ${firstName}'s avatar`}
    >
      {messages.length > 0 && (
        <div className="aura-chat-actions">
          <button
            type="button"
            onClick={onClear}
            className="aura-chat-clear"
            aria-label="Clear conversation"
            title="Clear conversation"
            disabled={busy}
          >
            ✕ Clear
          </button>
        </div>
      )}
      <div
        ref={logRef}
        className="aura-chat-log"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div className="aura-chat-empty">
            Ask anything. I&rsquo;m {firstName}&rsquo;s avatar — I&rsquo;ll do my
            best, and hand off to her at{" "}
            <strong>{card.contact?.email ?? "her email"}</strong> if it&rsquo;s
            above my pay grade.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`aura-msg aura-msg-${m.role} ${m.streaming ? "aura-msg-streaming" : ""}`}
          >
            <div className="aura-msg-role">
              {m.role === "user" ? "you" : "avatar"}
            </div>
            <div className="aura-msg-content">
              {m.content || (m.streaming ? "…" : "")}
            </div>
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div className="aura-tool-chips">
                {m.toolCalls.map((tc) => (
                  <ToolCallChip key={tc.id} call={tc} onCardClick={onCardClick} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {error && (
        <div className="aura-error" role="alert">
          {error}
        </div>
      )}
      <form
        className="aura-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="aura-chat-input" className="aura-sr-only">
          Message to {firstName}&rsquo;s avatar
        </label>
        <input
          id="aura-chat-input"
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={busy}
          className="aura-input"
          maxLength={2000}
          aria-label={`Message to ${firstName}'s avatar`}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="aura-send"
          aria-label="Send message"
        >
          {busy ? "…" : "↵"}
        </button>
      </form>
    </div>
  );
}
