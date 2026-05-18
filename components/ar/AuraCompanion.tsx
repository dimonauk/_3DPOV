"use client";

/**
 * components/ar/AuraCompanion.tsx — wraps VRMViewer with intro TTS,
 * outfit picker, and chat overlay so the avatar feels alive instead
 * of just idle-animating.
 *
 * This file is the slim orchestrator (per ARCHITECTURE.md Rule 1).
 * Voice in aura-companion/use-voice.ts; chat state in use-chat.ts;
 * chat panel JSX in chat-panel.tsx; tool-call chips in
 * tool-call-chip.tsx; outfit picker + registry in wardrobe-picker.tsx;
 * styles in styles.ts.
 *
 * On iOS the audio context needs a user gesture to start — hence
 * the "Tap to wake" gate that mounts before the stage.
 */

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatPanel } from "./aura-companion/chat-panel";
import {
  AURA_COMPANION_STYLES,
  AURA_WAKE_STYLES,
} from "./aura-companion/styles";
import { type AuraCompanionProps, CARD_SLUG_RE } from "./aura-companion/types";
import { useAuraChat } from "./aura-companion/use-chat";
import { useVoice } from "./aura-companion/use-voice";
import { WardrobePicker } from "./aura-companion/wardrobe-picker";

const VRMViewer = dynamic(() => import("./VRMViewer"), { ssr: false });

export default function AuraCompanion({ card, vrmUrl }: AuraCompanionProps) {
  const intro = card.ar.vrmIntro;
  const hasChat = Boolean(card.ar.vrmPersona);
  const router = useRouter();

  const [woken, setWoken] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  // Wardrobe state — initialised from props.vrmUrl (the card's default
  // outfit from data/cards/<slug>.json). Outfit changes via either the
  // picker UI or the change_outfit Aura tool update this; VRMViewer
  // re-mounts on URL change.
  const [currentVrmUrl, setCurrentVrmUrl] = useState(vrmUrl);
  useEffect(() => {
    setCurrentVrmUrl(vrmUrl);
  }, [vrmUrl]);

  const chatLogRef = useRef<HTMLDivElement | null>(null);

  const { speaking, speak, stopSpeaking } = useVoice({
    preferred: card.ar.vrmVoice,
    muted,
  });

  const {
    messages,
    input,
    setInput,
    busy,
    error,
    clear,
    send,
  } = useAuraChat({
    card,
    speak,
    onOutfitChange: setCurrentVrmUrl,
  });

  // Play intro the first time Aura is "woken up". Honour `muted` — the
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

  const onCardClick = (slug: string) => {
    if (CARD_SLUG_RE.test(slug)) router.push(`/c/${slug}`);
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
        {/* eslint-disable-next-line react/no-unknown-property */}
        <style jsx global>{AURA_WAKE_STYLES}</style>
      </div>
    );
  }

  return (
    <div className="aura-root">
      <div className="aura-stage">
        <VRMViewer card={card} vrmUrl={currentVrmUrl} />

        {speaking && (
          <div className="aura-speaking">
            <span className="aura-speak-dot" />
            <span className="aura-speak-dot" />
            <span className="aura-speak-dot" />
            <button
              onClick={stopSpeaking}
              className="aura-stop-btn"
              title="Stop speaking"
            >
              ⏹
            </button>
          </div>
        )}

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

        {hasChat && (
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="aura-chat-toggle"
          >
            {chatOpen
              ? "↓ Close chat"
              : `💬 Chat with ${card.name.split(" ")[0]}'s avatar`}
          </button>
        )}
      </div>

      <WardrobePicker
        currentVrmUrl={currentVrmUrl}
        onSelect={setCurrentVrmUrl}
      />

      {hasChat && chatOpen && (
        <ChatPanel
          card={card}
          logRef={chatLogRef}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={() => void send()}
          busy={busy}
          error={error}
          onClear={clear}
          onCardClick={onCardClick}
        />
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{AURA_COMPANION_STYLES}</style>
    </div>
  );
}
