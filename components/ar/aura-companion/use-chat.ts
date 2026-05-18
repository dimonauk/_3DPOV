"use client";

/**
 * components/ar/aura-companion/use-chat.ts — Chat state machine for
 * AuraCompanion. Owns the messages array, input value, busy flag,
 * and error; exposes `send` which POSTs to /api/cards/[slug]/chat,
 * streams the SSE-like Aura response via parseAuraStream, threads
 * tool calls into the latest assistant message, and speaks the
 * final reply through the supplied `speak` callback.
 *
 * Extracted from AuraCompanion.tsx per ARCHITECTURE.md Rule 1.
 * Side effects: window.dispatchEvent for animations and router.push
 * for navigate-action tools. Visitor's history lives in this hook's
 * useState only — no persistence, no PII risk.
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { Card } from "lib/ar/types";
import { parseAuraStream } from "lib/aura/parse-ui-stream";
import {
  EMOTION_TO_ANIMATION,
  resolveAnimationFromText,
} from "lib/vrm/animationMap";

import { type ChatMessage, type ToolCallRecord } from "./types";

export type UseChatOptions = {
  card: Card;
  speak: (text: string) => void;
  /** Optional outfit-change handler. Fires when Aura's `change_outfit`
   *  tool resolves with a `changeOutfit` action carrying the new
   *  VRM URL. The host typically updates a `currentVrmUrl` state so
   *  VRMViewer re-mounts with the new outfit. */
  onOutfitChange?: (url: string) => void;
};

export function useAuraChat({ card, speak, onOutfitChange }: UseChatOptions) {
  const router = useRouter();
  const slug = card.slug;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);

    const newUser: ChatMessage = { role: "user", content: text };
    const history = [...messages, newUser];
    setMessages(history);
    setBusy(true);

    // Add a placeholder assistant message to stream into.
    const assistantIndex = history.length;
    setMessages([...history, { role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch(`/api/cards/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) {
        // Friendly messaging for the two visitor-facing states the
        // server already returns (503 not configured) or might return
        // once a rate-limit lands (429 too many requests).
        let friendly: string | null = null;
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const seconds = retryAfter ? Number(retryAfter) : NaN;
          friendly =
            Number.isFinite(seconds) && seconds > 0
              ? `Slow down — try again in ${Math.ceil(seconds)}s.`
              : "Slow down — too many requests, try again shortly.";
        } else if (res.status === 503) {
          friendly = "Chat isn't available right now. Try again later.";
        }
        const errBody = friendly ?? (await res.text()).slice(0, 200);
        setError(friendly ? errBody : `Chat error: ${res.status} ${errBody}`);
        setMessages((m) => m.slice(0, assistantIndex));
        setBusy(false);
        return;
      }
      if (!res.body) {
        setError("No response body");
        setMessages((m) => m.slice(0, assistantIndex));
        setBusy(false);
        return;
      }
      let acc = "";
      const turnTools: ToolCallRecord[] = [];

      const writeAssistant = () => {
        setMessages((m) => {
          const next = [...m];
          next[assistantIndex] = {
            role: "assistant",
            content: acc,
            streaming: true,
            ...(turnTools.length > 0 ? { toolCalls: [...turnTools] } : {}),
          };
          return next;
        });
      };

      for await (const evt of parseAuraStream(res.body)) {
        if (evt.type === "text-delta") {
          acc += evt.text;
          writeAssistant();
        } else if (evt.type === "tool-call") {
          turnTools.push({
            id: evt.toolCallId,
            name: evt.toolName,
            args: evt.args,
            status: "pending",
          });
          writeAssistant();
        } else if (evt.type === "tool-result") {
          const rec = turnTools.find((t) => t.id === evt.toolCallId);
          if (rec) {
            rec.status = "complete";
            const out =
              evt.result && typeof evt.result === "object"
                ? (evt.result as { summary?: string })
                : undefined;
            if (out?.summary) rec.summary = out.summary;
            if (evt.action) rec.action = evt.action;
            if (evt.action?.kind === "showCards") rec.cards = evt.action.cards;
            if (evt.action?.kind === "showCard") rec.card = evt.action.card;
            writeAssistant();

            // Client-side effects.
            if (evt.action?.kind === "navigate" && evt.action.path) {
              const path = evt.action.path;
              setTimeout(() => router.push(path), 600);
            } else if (evt.action?.kind === "playAnimation") {
              // VRMViewer (mounted above the chat) listens on the window.
              window.dispatchEvent(
                new CustomEvent("aura:play-animation", {
                  detail: { name: evt.action.name },
                }),
              );
            } else if (evt.action?.kind === "setEmotion") {
              // Agent declared an emotional tone. Map emotion to an
              // animation via the canonical EMOTION_TO_ANIMATION
              // registry; if it resolves to a real animation (i.e.,
              // not null/neutral), dispatch the same play-animation
              // event the explicit play_animation tool uses.
              const animation = EMOTION_TO_ANIMATION[evt.action.emotion];
              if (animation) {
                window.dispatchEvent(
                  new CustomEvent("aura:play-animation", {
                    detail: { name: animation },
                  }),
                );
              }
            } else if (evt.action?.kind === "changeOutfit") {
              // Hand the new VRM URL up to the host; it owns the
              // currentVrmUrl state that VRMViewer re-mounts on.
              onOutfitChange?.(evt.action.url);
            }
          }
        } else if (evt.type === "error") {
          throw new Error(evt.message);
        }
      }

      // Finalise.
      setMessages((m) => {
        const next = [...m];
        next[assistantIndex] = {
          role: "assistant",
          content: acc,
          ...(turnTools.length > 0 ? { toolCalls: turnTools } : {}),
        };
        return next;
      });

      // Keyword-based auto-animation: a last-resort fallback. We
      // prefer the agent's structured emotion emission — either
      // play_animation (explicit gesture) or set_emotion (mood tag
      // that the client maps via EMOTION_TO_ANIMATION). Only run the
      // regex when neither fired, so we don't double up on top of the
      // agent's own choice.
      const triggeredAnimation = turnTools.some(
        (t) => t.name === "play_animation" || t.name === "set_emotion",
      );
      if (!triggeredAnimation && acc.trim()) {
        const auto = resolveAnimationFromText(acc);
        if (auto) {
          window.dispatchEvent(
            new CustomEvent("aura:play-animation", {
              detail: { name: auto },
            }),
          );
        }
      }

      // Speak the reply.
      if (acc.trim()) speak(acc);
    } catch (e) {
      setError((e as Error).message ?? "Network error");
      setMessages((m) => m.slice(0, assistantIndex));
    } finally {
      setBusy(false);
    }
  }, [busy, input, messages, slug, router, speak, onOutfitChange]);

  return {
    messages,
    input,
    setInput,
    busy,
    error,
    setError,
    clear,
    send,
  };
}
