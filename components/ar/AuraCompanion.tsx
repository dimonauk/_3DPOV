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
 * Orchestrator only. Voice synthesis lives in
 * aura-companion/use-voice.ts; chat state in use-chat.ts; chat panel
 * JSX in chat-panel.tsx; tool-call chips in tool-call-chip.tsx;
 * styles in styles.ts. Per ARCHITECTURE.md Rule 1.
 *
 * On iOS the audio context needs a user gesture to start — hence
 * the "Click to wake Aura" gate that mounts before the stage.
 */

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatPanel } from "./aura-companion/chat-panel";
import { AURA_COMPANION_STYLES, AURA_WAKE_STYLES } from "./aura-companion/styles";
import { type AuraCompanionProps, CARD_SLUG_RE } from "./aura-companion/types";
import { useAuraChat } from "./aura-companion/use-chat";
import { useVoice } from "./aura-companion/use-voice";

const VRMViewer = dynamic(() => import("./VRMViewer"), { ssr: false });

export default function AuraCompanion({ card, vrmUrl }: AuraCompanionProps) {
  const intro = card.ar.vrmIntro;
  const hasChat = Boolean(card.ar.vrmPersona);
  const router = useRouter();

  const [woken, setWoken] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  const chatLogRef = useRef<HTMLDivElement | null>(null);

  const { speaking, speak, stopSpeaking } = useVoice({
    preferred: card.ar.vrmVoice,
    muted,
  });

  const { messages, input, setInput, busy, error, clear, send } = useAuraChat({
    card,
    speak,
  });

  // Play intro the first time Aura is "woken up". Honor `muted` —
  // visitor may tap-to-wake with sound off (so the avatar appears
  // without yelling). We still flip introPlayed so unmuting later
  // doesn't suddenly start the intro mid-conversation.
  useEffect(() => {
    if (woken && intro && !introPlayed) {
      if (!muted) speak(intro);
      setIntroPlayed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [woken, intro, introPlayed, muted]);

  // Auto-scroll the chat log.
  useEffect(() => {
    const el = chatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Wake gate — on iOS the audio context needs a user gesture before
  // it can play. On desktop too, autoplay policies usually block
  // SpeechSynthesis until interaction. So we gate behind a tap.
  if (!woken) {
    const firstName = card.name.split(" ")[0];
    return (
      <div className="aura-wake">
        <button onClick={() => setWoken(true)} className="aura-wake-btn">
          <span className="aura-wake-pulse" />
          <span>Tap to wake {firstName}&rsquo;s avatar</span>
        </button>
        <style jsx global>{`${AURA_WAKE_STYLES}`}</style>
      </div>
    );
  }

  const firstName = card.name.split(" ")[0];

  return (
    <div className="aura-root">
      <div className="aura-stage">
        <VRMViewer card={card} vrmUrl={vrmUrl} />

        {/* Speaking indicator overlay */}
        {speaking && (
          <div className="aura-speaking" role="status" aria-live="polite">
            <span className="aura-speak-dot" aria-hidden />
            <span className="aura-speak-dot" aria-hidden />
            <span className="aura-speak-dot" aria-hidden />
            <button
              onClick={stopSpeaking}
              className="aura-stop-btn"
              title="Stop speaking"
              aria-label="Stop speaking"
              type="button"
            >
              ⏹
            </button>
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
          aria-label={muted ? "Unmute Aura" : "Mute Aura"}
          aria-pressed={muted}
          type="button"
        >
          <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
        </button>

        {/* Chat toggle */}
        {hasChat && (
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="aura-chat-toggle"
            aria-expanded={chatOpen}
            aria-controls="aura-chat-panel"
            type="button"
          >
            {chatOpen ? "↓ Close chat" : `💬 Chat with ${firstName}'s avatar`}
          </button>
        )}
      </div>

      {hasChat && chatOpen && (
        <ChatPanel
          card={card}
          logRef={chatLogRef}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={send}
          busy={busy}
          error={error}
          onClear={clear}
          onCardClick={(s) => {
            // Tool result slug came from the LLM — validate against
            // the same pattern Firestore rules accept before sending
            // the visitor to an arbitrary path.
            if (CARD_SLUG_RE.test(s)) router.push(`/c/${s}`);
          }}
        />
      )}

      {/* Global because styled-jsx's babel plugin needs to see
          static CSS in source to compute a scoped class hash; the
          styles live in styles.ts so this component stays readable.
          The aura-* / tool-chip-* class prefixes are unique to this
          component, so global injection won't collide. */}
      <style jsx global>{`${AURA_COMPANION_STYLES}`}</style>
    </div>
  );
}
