"use client";

/**
 * AuraCompanion — wraps the VRMViewer with an intro audio playback
 * + chat overlay + Web Speech API TTS so the avatar feels alive
 * instead of just sitting there idle-animating.
 *
 * Three layers:
 *
 *   1. The VRM itself — rendered by VRMViewer, gets idle animation
 *      (breathing, sway, head-tracking).
 *
 *   2. Intro speech — when the user first opens the Avatar tab, the
 *      card's `vrmIntro` text gets spoken aloud via the browser's
 *      Web Speech API. Free, zero-infra, voice quality varies by
 *      platform but decent on macOS / iOS / modern Chrome.
 *
 *   3. Chat overlay — collapsible input at the bottom. Sends to
 *      /api/cards/[slug]/chat with the running history, streams the
 *      response in token-by-token, then speaks the full reply via
 *      Web Speech API. Visitor's history lives in component state
 *      only — no persistence, no PII risk.
 *
 * Web Speech API quirks handled:
 *   - speechSynthesis.getVoices() returns [] on first call in Chrome
 *     until 'voiceschanged' fires. We listen for it.
 *   - Some platforms cut off long utterances. We split on sentence
 *     boundaries.
 *   - On iOS the audio context needs a user gesture to start —
 *     hence the "Click to wake Aura" gate.
 *
 * No WebAudio amplitude lipsync yet — that's Level 4. For now the
 * VRM mouth stays neutral while Aura speaks. Idle animations
 * continue in the background.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Card } from "lib/ar/types";
import {
  parseAuraStream,
  type AuraClientAction,
  type AuraCardSummary,
} from "lib/aura/parse-ui-stream";
import { resolveAnimationFromText } from "lib/vrm/animationMap";
import wardrobeData from "../../data/wardrobe.json";

type WardrobeOutfit = {
  slug: string;
  label: string;
  url: string;
  bytes: number;
};
const WARDROBE_OUTFITS: WardrobeOutfit[] = wardrobeData.outfits;
// Emoji hints per outfit slug. Decorative only — labels are the
// authoritative identifier in the picker UI.
const OUTFIT_GLYPH: Record<string, string> = {
  "baby-pink-spice": "👗",
  "bunny-top": "🐰",
  "kawaii-potion": "🧪",
  "pink-blouse-purple-plaid-skirt": "👚",
  "pink-coat": "🧥",
  "purple-dance": "💃",
  "ready-player-one": "🕶",
};

const VRMViewer = dynamic(() => import("./VRMViewer"), { ssr: false });

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
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** True while the assistant message is still streaming */
  streaming?: boolean;
  /** Tool calls fired during this assistant turn. Renders inline. */
  toolCalls?: ToolCallRecord[];
};

type Props = {
  card: Card;
  vrmUrl: string;
};

/**
 * ToolCallChip — visual badge for an Aura tool call rendered inline in
 * the per-card chat panel. Shows tool name, key argument, status glyph.
 *
 * For tool results that carry actions (cards, vCard link, wallet
 * buttons, booking iframe), renders the actionable UI directly below
 * the chip header.
 */
function ToolCallChip({
  call,
  onCardClick,
}: {
  call: ToolCallRecord;
  onCardClick: (slug: string) => void;
}) {
  const ICONS: Record<string, string> = {
    capture_lead: "✉",
    find_related_cards: "⌕",
    download_vcard: "↓",
    book_a_call: "📅",
    save_to_wallet: "💳",
    play_animation: "🎭",
    change_outfit: "👗",
  };
  const LABELS: Record<string, string> = {
    capture_lead: "Saving lead",
    find_related_cards: "Searching related",
    download_vcard: "vCard ready",
    book_a_call: "Booking",
    save_to_wallet: "Wallet save",
    play_animation: "Posing",
    change_outfit: "Changing outfit",
  };
  const icon = ICONS[call.name] ?? "▸";
  const label = LABELS[call.name] ?? call.name;
  const stateGlyph =
    call.status === "complete" ? "✓" : call.status === "error" ? "!" : "…";

  // Argument preview.
  let argPreview = "";
  const a = call.args as Record<string, unknown>;
  if (call.name === "capture_lead" && typeof a["email"] === "string") {
    argPreview = a["email"] as string;
  } else if (
    call.name === "find_related_cards" &&
    typeof a["query"] === "string"
  ) {
    argPreview = `"${a["query"]}"`;
  } else if (call.name === "book_a_call" && typeof a["purpose"] === "string") {
    argPreview = a["purpose"] as string;
  } else if (call.name === "play_animation" && typeof a["name"] === "string") {
    argPreview = a["name"] as string;
  } else if (call.name === "change_outfit" && typeof a["slug"] === "string") {
    argPreview = a["slug"] as string;
  }

  return (
    <div className={`tool-chip tool-chip-${call.status}`}>
      <div className="tool-chip-header">
        <span className="tool-chip-icon">{icon}</span>
        <span className="tool-chip-label">{label}</span>
        {argPreview && <span className="tool-chip-arg">— {argPreview}</span>}
        <span className="tool-chip-state">{stateGlyph}</span>
      </div>

      {/* Related cards thumbnails */}
      {call.cards && call.cards.length > 0 && (
        <div className="tool-chip-cards">
          {call.cards.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => onCardClick(c.slug)}
              className="tool-chip-card"
            >
              <span
                className="tool-chip-swatch"
                style={{ background: c.primary }}
                aria-hidden
              />
              <span className="tool-chip-card-name">{c.name}</span>
              {c.tagline && (
                <span className="tool-chip-card-tagline">— {c.tagline}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* vCard download link */}
      {call.action?.kind === "showVcard" && (
        <a
          href={call.action.url}
          download
          className="tool-chip-action-link"
        >
          ↓ Save {call.action.name} to your contacts
        </a>
      )}

      {/* Booking flow — embedded iframe + external link */}
      {call.action?.kind === "openBooking" && call.action.url && (
        <div className="tool-chip-booking">
          <a
            href={call.action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tool-chip-action-link"
          >
            📅 Open booking
            {call.action.purpose ? ` — ${call.action.purpose}` : ""}
          </a>
        </div>
      )}

      {/* Wallet save options */}
      {call.action?.kind === "saveToWallet" && (
        <div className="tool-chip-wallet">
          {call.action.platforms.includes("apple") && (
            <a
              href={`/api/cards/${call.action.slug}/wallet/apple`}
              className="tool-chip-action-link"
              download
            >
              ⌘ Apple Wallet
            </a>
          )}
          {call.action.platforms.includes("google") && (
            <a
              href={`/api/cards/${call.action.slug}/wallet/google`}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-chip-action-link"
            >
              G Google Wallet
            </a>
          )}
        </div>
      )}

      {/* Lead captured confirmation */}
      {call.action?.kind === "leadCaptured" && (
        <div className="tool-chip-confirm">
          ✓ Saved {call.action.email}
        </div>
      )}

      {/* Outfit change confirmation */}
      {call.action?.kind === "changeOutfit" && (
        <div className="tool-chip-confirm">
          ✓ Now wearing: {call.action.label}
        </div>
      )}
    </div>
  );
}

export default function AuraCompanion({ card, vrmUrl }: Props) {
  const intro = card.ar.vrmIntro;
  const hasChat = Boolean(card.ar.vrmPersona);
  const slug = card.slug;
  const router = useRouter();

  const [woken, setWoken] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Wardrobe state — initialized from props.vrmUrl (the card's default
  // outfit from data/cards/<slug>.json). Outfit changes either via the
  // picker UI or the change_outfit Aura tool update this; VRMViewer
  // re-mounts on URL change.
  const [currentVrmUrl, setCurrentVrmUrl] = useState(vrmUrl);
  useEffect(() => {
    // If the parent ever changes the default mid-mount, follow it.
    setCurrentVrmUrl(vrmUrl);
  }, [vrmUrl]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Cache available voices once the browser has loaded them.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => {
      const v = window.speechSynthesis?.getVoices() ?? [];
      voicesRef.current = v;
    };
    refresh();
    window.speechSynthesis?.addEventListener?.("voiceschanged", refresh);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", refresh);
    };
  }, []);

  const pickVoice = (): SpeechSynthesisVoice | undefined => {
    const preferred = card.ar.vrmVoice;
    const voices = voicesRef.current;
    if (preferred) {
      // Match by name or lang.
      const match = voices.find(
        (v) =>
          v.name === preferred ||
          v.lang === preferred ||
          v.voiceURI === preferred,
      );
      if (match) return match;
    }
    // Default: prefer en-GB female-sounding, fall back to en-*, then any.
    const enGB = voices.find(
      (v) => v.lang === "en-GB" && /female|woman|samantha|kate|fiona|emily|amy|aria/i.test(v.name),
    );
    if (enGB) return enGB;
    const anyEnGB = voices.find((v) => v.lang === "en-GB");
    if (anyEnGB) return anyEnGB;
    const anyEn = voices.find((v) => v.lang.startsWith("en"));
    return anyEn ?? voices[0];
  };

  /**
   * Speak a string via Web Speech API. Splits on sentence boundaries
   * so long utterances don't get cut off by browser limits.
   */
  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    if (muted) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel(); // stop anything already speaking
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) return;
    const voice = pickVoice();
    setSpeaking(true);
    sentences.forEach((sentence, idx) => {
      const u = new SpeechSynthesisUtterance(sentence);
      if (voice) u.voice = voice;
      u.rate = 1.0;
      u.pitch = 1.05;
      if (idx === sentences.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  // Play intro the first time Aura is "woken up".
  useEffect(() => {
    if (woken && intro && !introPlayed) {
      speak(intro);
      setIntroPlayed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [woken, intro, introPlayed]);

  // Stop speech when the component unmounts.
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // Auto-scroll the chat log.
  useEffect(() => {
    const el = chatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
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
        const errBody = await res.text();
        setError(`Chat error: ${res.status} ${errBody.slice(0, 200)}`);
        // Remove placeholder
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
            } else if (evt.action?.kind === "changeOutfit") {
              // Update state; VRMViewer re-mounts on the new URL.
              setCurrentVrmUrl(evt.action.url);
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

      // Keyword-based auto-animation: if Aura's reply contains words
      // like "interesting", "well done", "goodbye", trigger the
      // matching emote. Skip if the agent already called play_animation
      // this turn (don't double up).
      const triggeredAnimation = turnTools.some(
        (t) => t.name === "play_animation",
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
  };

  // Wake gate — on iOS the audio context needs a user gesture before
  // it can play. On desktop too, autoplay policies usually block
  // SpeechSynthesis until interaction. So we gate behind a tap.
  if (!woken) {
    return (
      <div className="aura-wake">
        <button onClick={() => setWoken(true)} className="aura-wake-btn">
          <span className="aura-wake-pulse" />
          <span>Tap to wake {card.name.split(" ")[0]}&rsquo;s avatar</span>
        </button>
        <style jsx>{`
          .aura-wake {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 360px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a0a1a, #0a0a1a);
            border-radius: 0.75rem;
          }
          .aura-wake-btn {
            background: rgba(255, 111, 181, 0.1);
            color: white;
            border: 1px solid rgba(255, 111, 181, 0.4);
            padding: 1.2rem 2rem;
            border-radius: 999px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            font-family: inherit;
          }
          .aura-wake-btn:hover {
            background: rgba(255, 111, 181, 0.2);
          }
          .aura-wake-pulse {
            display: inline-block;
            width: 0.65rem;
            height: 0.65rem;
            background: #ff6fb5;
            border-radius: 50%;
            animation: aura-pulse 1.5s ease-in-out infinite;
          }
          @keyframes aura-pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="aura-root">
      <div className="aura-stage">
        <VRMViewer card={card} vrmUrl={currentVrmUrl} />

        {/* Speaking indicator overlay */}
        {speaking && (
          <div className="aura-speaking">
            <span className="aura-speak-dot" />
            <span className="aura-speak-dot" />
            <span className="aura-speak-dot" />
            <button onClick={stopSpeaking} className="aura-stop-btn" title="Stop speaking">⏹</button>
          </div>
        )}

        {/* Mute toggle */}
        <button
          onClick={() => {
            if (!muted) stopSpeaking();
            setMuted((m) => !m);
          }}
          className="aura-mute"
          title={muted ? "Unmute Aura" : "Mute Aura"}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {/* Chat toggle */}
        {hasChat && (
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="aura-chat-toggle"
          >
            {chatOpen ? "↓ Close chat" : `💬 Chat with ${card.name.split(" ")[0]}'s avatar`}
          </button>
        )}
      </div>

      {/* Outfit picker */}
      <div className="aura-wardrobe">
        <span className="aura-wardrobe-tag">Outfit</span>
        <div className="aura-wardrobe-chips">
          {WARDROBE_OUTFITS.map((o) => {
            const isActive = currentVrmUrl === o.url;
            return (
              <button
                key={o.slug}
                type="button"
                onClick={() => setCurrentVrmUrl(o.url)}
                className={
                  "aura-wardrobe-btn" + (isActive ? " aura-wardrobe-active" : "")
                }
                title={o.label}
                aria-pressed={isActive}
                aria-label={`Wear ${o.label}`}
              >
                <span className="aura-wardrobe-glyph">
                  {OUTFIT_GLYPH[o.slug] ?? "👕"}
                </span>
                <span className="aura-wardrobe-name">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      {hasChat && chatOpen && (
        <div className="aura-chat">
          <div ref={chatLogRef} className="aura-chat-log">
            {messages.length === 0 && (
              <div className="aura-chat-empty">
                Ask anything. I&rsquo;m {card.name.split(" ")[0]}&rsquo;s avatar — I&rsquo;ll do my best, and hand off to her at <strong>{card.contact?.email ?? "her email"}</strong> if it&rsquo;s above my pay grade.
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
                <div className="aura-msg-content">{m.content || (m.streaming ? "…" : "")}</div>
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="aura-tool-chips">
                    {m.toolCalls.map((tc) => (
                      <ToolCallChip
                        key={tc.id}
                        call={tc}
                        onCardClick={(s) => router.push(`/c/${s}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {error && <div className="aura-error">{error}</div>}
          <form
            className="aura-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              className="aura-input"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="aura-send"
            >
              {busy ? "…" : "↵"}
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .aura-root {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 480px;
          gap: 0.75rem;
        }
        .aura-stage {
          position: relative;
          flex: 1;
          min-height: 360px;
          background: linear-gradient(135deg, #1a0a1a, #0a0a1a);
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .aura-speaking {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.5);
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
          display: flex;
          gap: 0.35rem;
          align-items: center;
        }
        .aura-speak-dot {
          width: 0.4rem;
          height: 0.4rem;
          background: #ff6fb5;
          border-radius: 50%;
          animation: aura-speak 0.7s ease-in-out infinite;
        }
        .aura-speak-dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .aura-speak-dot:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes aura-speak {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }
        .aura-stop-btn {
          background: transparent;
          color: white;
          border: 0;
          padding: 0 0 0 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .aura-mute {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: 0;
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 50%;
          font-size: 1.1rem;
          cursor: pointer;
        }
        .aura-chat-toggle {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 111, 181, 0.15);
          color: white;
          border: 1px solid rgba(255, 111, 181, 0.4);
          padding: 0.5rem 1.2rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .aura-chat-toggle:hover {
          background: rgba(255, 111, 181, 0.25);
        }
        .aura-chat {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 111, 181, 0.2);
          border-radius: 0.75rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 320px;
        }
        .aura-chat-log {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          min-height: 100px;
          max-height: 220px;
          padding-right: 0.25rem;
        }
        .aura-chat-empty {
          opacity: 0.65;
          font-size: 0.88rem;
          text-align: center;
          padding: 1rem 0;
        }
        .aura-msg {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .aura-msg-role {
          font-size: 0.7rem;
          opacity: 0.55;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .aura-msg-content {
          font-size: 0.9rem;
          line-height: 1.4;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          max-width: 90%;
        }
        .aura-msg-user .aura-msg-content {
          background: rgba(255, 255, 255, 0.05);
          align-self: flex-end;
        }
        .aura-msg-user {
          align-items: flex-end;
        }
        .aura-msg-assistant .aura-msg-content {
          background: rgba(255, 111, 181, 0.1);
          border: 1px solid rgba(255, 111, 181, 0.2);
        }
        .aura-msg-streaming .aura-msg-content::after {
          content: "▍";
          margin-left: 2px;
          opacity: 0.6;
          animation: aura-blink 1s ease-in-out infinite;
        }
        @keyframes aura-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.6; }
        }
        .aura-error {
          background: rgba(255, 82, 82, 0.1);
          border: 1px solid rgba(255, 82, 82, 0.3);
          color: #ff8585;
          padding: 0.5rem 0.75rem;
          border-radius: 0.4rem;
          font-size: 0.82rem;
        }
        .aura-input-row {
          display: flex;
          gap: 0.4rem;
        }
        .aura-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.6rem 0.85rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          font-family: inherit;
        }
        .aura-input:focus {
          outline: 0;
          border-color: rgba(255, 111, 181, 0.6);
        }
        .aura-send {
          background: #ff6fb5;
          color: white;
          border: 0;
          padding: 0 1rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 700;
        }
        .aura-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ---- Tool chips ---- */
        .aura-tool-chips {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .tool-chip {
          border: 1px solid rgba(255, 111, 181, 0.2);
          background: rgba(255, 111, 181, 0.06);
          border-radius: 0.5rem;
          padding: 0.4rem 0.55rem;
          font-size: 0.78rem;
        }
        .tool-chip-pending {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
        }
        .tool-chip-error {
          border-color: rgba(255, 82, 82, 0.4);
          background: rgba(255, 82, 82, 0.06);
        }
        .tool-chip-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .tool-chip-icon { color: #ff6fb5; }
        .tool-chip-label { color: rgba(255, 255, 255, 0.85); }
        .tool-chip-arg {
          color: rgba(255, 255, 255, 0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
        }
        .tool-chip-state {
          margin-left: auto;
          color: #ff6fb5;
        }
        .tool-chip-pending .tool-chip-state {
          color: rgba(255, 255, 255, 0.4);
          animation: aura-tool-pulse 1s ease-in-out infinite;
        }
        @keyframes aura-tool-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .tool-chip-cards {
          margin-top: 0.45rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .tool-chip-card {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          padding: 0.4rem 0.55rem;
          border-radius: 0.4rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          text-align: left;
          font-family: inherit;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .tool-chip-card:hover {
          border-color: rgba(255, 111, 181, 0.5);
        }
        .tool-chip-swatch {
          width: 0.65rem;
          height: 0.65rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tool-chip-card-name { color: white; font-weight: 600; }
        .tool-chip-card-tagline {
          color: rgba(255, 255, 255, 0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tool-chip-action-link {
          display: inline-block;
          margin-top: 0.4rem;
          background: rgba(255, 111, 181, 0.15);
          color: white;
          border: 1px solid rgba(255, 111, 181, 0.35);
          padding: 0.4rem 0.7rem;
          border-radius: 0.4rem;
          font-size: 0.78rem;
          text-decoration: none;
          font-weight: 600;
        }
        .tool-chip-action-link:hover {
          background: rgba(255, 111, 181, 0.25);
        }
        .tool-chip-wallet {
          margin-top: 0.4rem;
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .tool-chip-confirm {
          margin-top: 0.4rem;
          color: #b8e0a8;
          font-size: 0.75rem;
        }

        /* ---- Outfit picker ---- */
        .aura-wardrobe {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.4rem 0.55rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 111, 181, 0.18);
          border-radius: 0.6rem;
          flex-wrap: wrap;
        }
        .aura-wardrobe-tag {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.55;
          padding-left: 0.2rem;
          padding-right: 0.2rem;
          flex-shrink: 0;
        }
        .aura-wardrobe-chips {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          flex: 1;
        }
        .aura-wardrobe-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.32rem;
          padding: 0.28rem 0.6rem;
          background: rgba(255, 111, 181, 0.06);
          border: 1px solid rgba(255, 111, 181, 0.2);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.85);
          font-family: inherit;
          font-size: 0.72rem;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease,
            transform 0.12s ease;
        }
        .aura-wardrobe-btn:hover {
          background: rgba(255, 111, 181, 0.16);
          border-color: rgba(255, 111, 181, 0.5);
        }
        .aura-wardrobe-active {
          background: rgba(255, 111, 181, 0.28);
          border-color: rgba(255, 111, 181, 0.85);
          color: white;
          transform: scale(1.02);
        }
        .aura-wardrobe-glyph {
          font-size: 0.95rem;
          line-height: 1;
        }
        .aura-wardrobe-name {
          font-weight: 500;
        }
        @media (max-width: 520px) {
          .aura-wardrobe-name {
            display: none;
          }
          .aura-wardrobe-btn {
            padding: 0.34rem 0.55rem;
          }
        }
      `}</style>
    </div>
  );
}
