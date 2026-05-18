"use client";

/**
 * components/ar/aura-companion/tool-call-chip.tsx — Visual badge for
 * an Aura tool call rendered inline in the per-card chat panel.
 * Shows tool name, key argument, status glyph; for tools that
 * return UI actions (cards, vCard link, wallet, booking, lead
 * captured), renders the actionable UI directly below the chip
 * header.
 *
 * Extracted from AuraCompanion.tsx per ARCHITECTURE.md Rule 1.
 * Pure presentational — the host owns slug validation + routing.
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
    capture_lead: "✉",
    find_related_cards: "⌕",
    download_vcard: "↓",
    book_a_call: "📅",
    save_to_wallet: "💳",
    play_animation: "🎭",
    change_outfit: "👗",
    set_emotion: "✨",
  };
  const LABELS: Record<string, string> = {
    capture_lead: "Saving lead",
    find_related_cards: "Searching related",
    download_vcard: "vCard ready",
    book_a_call: "Booking",
    save_to_wallet: "Wallet save",
    play_animation: "Posing",
    change_outfit: "Changing outfit",
    set_emotion: "Mood",
  };
  const icon = ICONS[call.name] ?? "▸";
  const label = LABELS[call.name] ?? call.name;
  const stateGlyph =
    call.status === "complete" ? "✓" : call.status === "error" ? "!" : "…";

  // Argument preview.
  let argPreview = "";
  const a = call.args;
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
  } else if (
    call.name === "set_emotion" &&
    typeof a["emotion"] === "string"
  ) {
    argPreview = a["emotion"] as string;
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
