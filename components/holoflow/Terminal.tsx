/**
 * components/holoflow/Terminal.tsx — animated bootlog terminal.
 *
 * The "soul_server --port 8770 · [BOOT] ... · [SOUL] ..." block from
 * the Aura section. Lines fade in sequentially on mount.
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";

export type TerminalLine = {
  tag?: "boot" | "soul" | "tts" | "vrm" | "emo" | "vlm" | "ok" | "err" | "info";
  text: ReactNode;
};

const TAG_TONE: Record<NonNullable<TerminalLine["tag"]>, { color: string; label: string }> = {
  boot: { color: "text-teal-300", label: "BOOT" },
  soul: { color: "text-lavender-200", label: "SOUL" },
  tts: { color: "text-gold-300", label: "TTS" },
  vrm: { color: "text-teal-300", label: "VRM" },
  emo: { color: "text-coral-300", label: "EMO" },
  vlm: { color: "text-lavender-200", label: "VLM" },
  ok: { color: "text-teal-300", label: "OK" },
  err: { color: "text-coral-300", label: "ERR" },
  info: { color: "text-chrome-400", label: "INFO" },
};

export function Terminal({
  prompt,
  lines,
  stepMs = 220,
}: {
  prompt?: string;
  lines: TerminalLine[];
  stepMs?: number;
}) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= lines.length) return;
    const id = setTimeout(() => setRevealed((n) => n + 1), stepMs);
    return () => clearTimeout(id);
  }, [revealed, lines.length, stepMs]);

  return (
    <div className="min-h-[140px] overflow-hidden border border-warm-black-700 bg-warm-black-950 p-4 font-mono text-[11px] leading-loose text-chrome-400">
      {prompt && (
        <div className="text-chrome-200">
          <span className="text-teal-400">{">"} </span>
          {prompt}
        </div>
      )}
      {lines.slice(0, revealed).map((line, k) => (
        <div key={k} className="holoflow-fade-up">
          {line.tag && (
            <span className={TAG_TONE[line.tag].color}>
              [ {TAG_TONE[line.tag].label} ]
            </span>
          )}{" "}
          {line.text}
        </div>
      ))}
    </div>
  );
}
