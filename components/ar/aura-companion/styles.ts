/**
 * components/ar/aura-companion/styles.ts — Scoped CSS for
 * AuraCompanion. Extracted from the inline `<style jsx>` block per
 * ARCHITECTURE.md Rule 1.
 *
 * Two exports: the wake-gate styles (small) and the main chat-stage
 * styles (large). Both are returned as plain strings; the host
 * embeds them via `<style jsx global>` because styled-jsx's babel
 * plugin needs static CSS in source to compute a scoped class hash.
 * The `aura-*` / `tool-chip-*` prefixes are unique to this
 * component, so global injection is safe.
 */

export const AURA_WAKE_STYLES = `
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
`;

export const AURA_COMPANION_STYLES = `
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
  .aura-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .aura-chat-actions {
    display: flex;
    justify-content: flex-end;
  }
  .aura-chat-clear {
    background: transparent;
    color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    font-size: 0.7rem;
    cursor: pointer;
    font-family: inherit;
  }
  .aura-chat-clear:hover {
    color: white;
    border-color: rgba(255, 111, 181, 0.4);
  }
  .aura-chat-clear:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
`;
