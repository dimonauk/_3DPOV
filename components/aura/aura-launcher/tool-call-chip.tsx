"use client";

/**
 * components/aura/aura-launcher/tool-call-chip.tsx — Inline badge
 * for an Aura tool call in the launcher chat: tool name, key arg,
 * status glyph. For find_cards / show_card results, surfaces card
 * thumbnails as clickable buttons.
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1.
 * Pure presentation — host routes the slug clicks.
 */

import type { ToolCallRecord } from "./types";

export function ToolCallChip({
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
  const a = call.args;
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
