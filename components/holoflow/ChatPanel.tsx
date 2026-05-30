/**
 * ChatPanel — three-toned chat history.
 *
 * From the Aura demo's .a-chat/.am pattern. Three speaker types:
 *   sys  — system messages (lavender)
 *   user — visitor input (dim chrome)
 *   aura — AI reply (mint/teal)
 *
 * Auto-scrolls to the bottom when new messages arrive. Header label
 * "SYSTEM · USER · AURA" sits above each line in tiny mono caps.
 */

"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type ChatTurn = {
  speaker: "sys" | "user" | "aura";
  text: ReactNode;
};

const SPEAKER_LABEL = { sys: "SYSTEM", user: "USER", aura: "AURA" } as const;
const SPEAKER_COLOR = {
  sys: "text-lavender-300",
  user: "text-chrome-400",
  aura: "text-teal-400",
} as const;

export function ChatPanel({
  turns,
  maxHeight = "max-h-72",
}: {
  turns: ChatTurn[];
  maxHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-2 overflow-y-auto border border-warm-black-700 bg-warm-black-925 p-4 ${maxHeight}`}
    >
      {turns.map((t, i) => (
        <div key={i} className={`text-[11px] leading-relaxed ${SPEAKER_COLOR[t.speaker]}`}>
          <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.12em] opacity-60">
            {SPEAKER_LABEL[t.speaker]}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
