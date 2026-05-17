"use client";

/**
 * app/atelier/pattern-prototype/chat-bot.tsx — Floating atelier-style
 * chat bot for the pattern-prototype chamber.
 *
 * Extracted from pattern-prototype-client.tsx (where it was the last
 * 175-line block of the file). Self-contained: own message state,
 * own input, own Gemini-direct stream via the visitor's BYO AI Studio
 * key (no server round-trip, no key in the bundle). Surfaces a
 * "no key set" hint when the key store is empty.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { GoogleGenAI } from "@google/genai";

import { createLogger } from "lib/log";
import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "lib/state/google-ai-key";

import {
  Icon,
  ICON_CHAT,
  ICON_SEND,
  ICON_SPARKLES,
  ICON_X,
} from "./icons";
import type { ChatMessage } from "./types";

const log = createLogger("atelier:pattern-prototype:chat");

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Bonjour. ask me for design advice — fabric pairings, silhouette notes, anything atelier-shaped.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const userMessage = input.trim();
    if (!userMessage || isTyping) return;

    const visitorKey = activeVisitorKey(useGoogleAiKeyStore.getState());
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    if (!visitorKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "no key set. paste an AI Studio key in settings to enable chat.",
        },
      ]);
      return;
    }

    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "model", text: "" }]);
    try {
      const ai = new GoogleGenAI({ apiKey: visitorKey });
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: userMessage,
        config: {
          systemInstruction:
            "ROLE: Master Atelier Assistant for ThreadLogic. Expert in fashion design, historical 1950s styles, computational tailoring. TONE: elegant, encouraging, sophisticated. Light French fashion terms (très chic). Concise.",
          temperature: 0.7,
        },
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (text) {
          fullResponse += text;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            return [...prev.slice(0, -1), { ...last, text: fullResponse }];
          });
        }
      }
    } catch (err) {
      log.error("chat failed", { err: String(err) });
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "pardon, the chat engine stalled. retry.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="mb-3 flex h-[440px] w-80 flex-col overflow-hidden rounded-3xl border border-rose-200 bg-white/80 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between bg-rose-500 p-4 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Icon d={ICON_SPARKLES} size={14} />
              </div>
              <div>
                <h4
                  className="text-base font-bold leading-none"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Atelier AI
                </h4>
                <p className="mt-1 text-[8px] font-black uppercase tracking-widest opacity-70">
                  Design Consultant
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="close chat"
              className="transition-transform hover:rotate-90"
            >
              <Icon d={ICON_X} size={16} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-white/30 p-4"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-none bg-rose-500 text-white"
                      : "rounded-tl-none border border-rose-50 bg-white text-rose-900"
                  }`}
                >
                  {msg.text ||
                    (isTyping && idx === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-rose-100 bg-white/60 p-3">
            <div className="relative flex items-center">
              <label htmlFor={inputId} className="sr-only">
                ask the atelier
              </label>
              <input
                id={inputId}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="ask for design advice…"
                className="w-full rounded-2xl border border-rose-100 bg-white py-2 pl-3 pr-10 text-xs text-rose-900 placeholder:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="send"
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500 text-white transition-all hover:bg-rose-600 disabled:opacity-30"
              >
                <Icon d={ICON_SEND} size={12} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "close chat" : "open chat"}
        className={`flex h-12 w-12 items-center justify-center rounded-3xl shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? "bg-white text-rose-500" : "bg-rose-500 text-white"
        }`}
      >
        {isOpen ? <Icon d={ICON_X} size={20} /> : <Icon d={ICON_CHAT} size={20} />}
      </button>
    </div>
  );
}
