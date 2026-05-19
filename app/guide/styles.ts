/**
 * app/guide/styles.ts — Scoped CSS for the Hitchhiker's Guide reader.
 * CSS string registry, exempt from the 300-line cap per ARCHITECTURE
 * Rule 1.
 *
 * The `hhg-*` prefix is unique to /guide and /guide/[slug], so it is
 * safe to inject via <style dangerouslySetInnerHTML> at the route root.
 *
 * Visual language:
 *  - warm-black ground with a slight pink/cyan rim-glow
 *  - thin chrome borders, bracket-corner accents on every plate
 *  - cyan circuit-trace pseudo-elements drawn with borders only
 *  - scan-line repeating-gradient + soft CRT glow, both opt-in via
 *    prefers-reduced-motion: no-preference
 */

export const GUIDE_STYLES = `
  /* ─── Index page ────────────────────────────────────────────── */
  .hhg-root {
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
    padding: 4rem 1.5rem 6rem;
    color: var(--color-chrome-200);
  }

  .hhg-frame-label {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.28em;
    font-size: 0.65rem;
    color: var(--color-chrome-500);
  }

  .hhg-title {
    margin: 0.6rem 0 0;
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(2.4rem, 5vw, 3.6rem);
    line-height: 0.95;
    color: var(--color-chrome-100);
  }

  .hhg-lede {
    max-width: 56ch;
    margin: 1.4rem 0 0;
    color: var(--color-chrome-300);
    line-height: 1.6;
  }

  .hhg-grid {
    list-style: none;
    margin: 3.5rem 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .hhg-card {
    position: relative;
    display: block;
    padding: 1.1rem 1.15rem 1.4rem;
    background: rgba(20, 17, 26, 0.55);
    border: 1px solid rgba(94, 212, 255, 0.16);
    color: inherit;
    text-decoration: none;
    min-height: 11rem;
    transition: border-color 180ms ease, background 180ms ease;
  }

  .hhg-card:hover {
    border-color: rgba(255, 196, 217, 0.45);
    background: rgba(28, 22, 36, 0.75);
  }

  /* Bracket corners — drawn with pseudo-elements + box-shadow segments. */
  .hhg-card::before,
  .hhg-card::after {
    content: "";
    position: absolute;
    width: 14px;
    height: 14px;
    pointer-events: none;
  }
  .hhg-card::before {
    top: -1px;
    left: -1px;
    border-top: 1px solid var(--color-pink-300);
    border-left: 1px solid var(--color-pink-300);
  }
  .hhg-card::after {
    bottom: -1px;
    right: -1px;
    border-bottom: 1px solid var(--color-pink-300);
    border-right: 1px solid var(--color-pink-300);
  }

  .hhg-card-num {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    color: var(--color-chrome-400);
  }

  .hhg-card-title {
    margin: 0.7rem 0 0;
    font-size: 1.15rem;
    line-height: 1.25;
    color: var(--color-chrome-100);
  }

  .hhg-card-gloss {
    margin: 0.7rem 0 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--color-chrome-300);
  }

  .hhg-card-cta {
    position: absolute;
    bottom: 0.85rem;
    right: 1.15rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    color: var(--color-pink-200);
    text-transform: uppercase;
  }

  /* ─── Single-page reader ────────────────────────────────────── */
  .hhg-page-root {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    padding: 3.5rem 1.5rem 5rem;
    color: var(--color-chrome-200);
  }

  .hhg-back {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.7rem;
    color: var(--color-chrome-400);
    text-decoration: none;
  }
  .hhg-back:hover { color: var(--color-pink-200); }

  .hhg-page {
    position: relative;
    margin-top: 2rem;
    padding: 3rem 2.5rem 3.5rem;
    background: linear-gradient(
      180deg,
      rgba(20, 17, 26, 0.72) 0%,
      rgba(12, 10, 18, 0.78) 100%
    );
    border: 1px solid rgba(214, 221, 229, 0.12);
    overflow: hidden;
  }

  /* Bracket corners on the page itself — larger than the card brackets. */
  .hhg-page::before,
  .hhg-page::after {
    content: "";
    position: absolute;
    width: 28px;
    height: 28px;
    pointer-events: none;
  }
  .hhg-page::before {
    top: -1px;
    left: -1px;
    border-top: 1px solid var(--color-pink-300);
    border-left: 1px solid var(--color-pink-300);
  }
  .hhg-page::after {
    bottom: -1px;
    right: -1px;
    border-bottom: 1px solid var(--color-pink-300);
    border-right: 1px solid var(--color-pink-300);
  }

  /* Circuit trace SVGs sit inside the page, absolutely positioned. */
  .hhg-trace {
    position: absolute;
    pointer-events: none;
    color: rgba(94, 212, 255, 0.45);
  }
  .hhg-trace-tl {
    top: 18px;
    left: 18px;
    width: 110px;
    height: 90px;
  }
  .hhg-trace-br {
    bottom: 18px;
    right: 18px;
    width: 110px;
    height: 90px;
    transform: rotate(180deg);
  }

  .hhg-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 1.75rem;
  }

  .hhg-page-file {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.65rem;
    color: var(--color-chrome-500);
    max-width: 60%;
    word-break: break-all;
  }

  .hhg-page-num {
    font-family: var(--font-mono);
    font-size: 2.4rem;
    line-height: 1;
    color: var(--color-pink-200);
    letter-spacing: 0.05em;
    text-shadow: 0 0 18px rgba(255, 196, 217, 0.25);
  }

  .hhg-page-title {
    margin: 0 0 1.8rem;
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(1.8rem, 3.4vw, 2.4rem);
    line-height: 1.1;
    color: var(--color-chrome-100);
    max-width: 28ch;
  }

  .hhg-page-rule {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(255, 196, 217, 0.4) 0%,
      rgba(94, 212, 255, 0.25) 60%,
      transparent 100%
    );
    margin: 0 0 1.8rem;
  }

  .hhg-page-body {
    max-width: 60ch;
    line-height: 1.75;
    color: var(--color-chrome-200);
    font-size: 1.02rem;
  }
  .hhg-page-body p + p { margin-top: 1.1em; }
  .hhg-page-body strong {
    color: var(--color-pink-200);
    font-weight: 500;
  }

  /* Footer nav. */
  .hhg-nav {
    margin-top: 2.8rem;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: stretch;
    flex-wrap: wrap;
  }

  .hhg-nav-link {
    flex: 1 1 12rem;
    display: block;
    padding: 0.9rem 1rem;
    background: rgba(28, 22, 36, 0.55);
    border: 1px solid rgba(214, 221, 229, 0.1);
    text-decoration: none;
    color: var(--color-chrome-200);
    transition: border-color 180ms ease, background 180ms ease;
  }
  .hhg-nav-link:hover {
    border-color: rgba(255, 196, 217, 0.45);
    background: rgba(36, 28, 44, 0.7);
  }
  .hhg-nav-link.is-right { text-align: right; }
  .hhg-nav-disabled {
    flex: 1 1 12rem;
    padding: 0.9rem 1rem;
    border: 1px dashed rgba(214, 221, 229, 0.08);
    color: var(--color-chrome-500);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .hhg-nav-disabled.is-right { text-align: right; }
  .hhg-nav-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-chrome-500);
    display: block;
    margin-bottom: 0.3rem;
  }
  .hhg-nav-title {
    font-size: 0.95rem;
    color: var(--color-chrome-100);
    line-height: 1.25;
  }

  .hhg-index-link {
    display: inline-block;
    margin-top: 1.6rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-chrome-400);
    text-decoration: none;
  }
  .hhg-index-link:hover { color: var(--color-pink-200); }

  /* ─── Scan-lines + CRT glow ─ opt-in via prefers-reduced-motion. */
  @media (prefers-reduced-motion: no-preference) {
    .hhg-page::before,
    .hhg-page::after {
      box-shadow: 0 0 12px rgba(255, 196, 217, 0.35);
    }
    .hhg-scanlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: repeating-linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.025) 0px,
        rgba(255, 255, 255, 0.025) 1px,
        transparent 1px,
        transparent 3px
      );
      mix-blend-mode: overlay;
      opacity: 0.6;
    }
    .hhg-page-num {
      animation: hhg-flicker 6s infinite ease-in-out;
    }
    @keyframes hhg-flicker {
      0%, 100% { opacity: 1; }
      48% { opacity: 1; }
      50% { opacity: 0.85; }
      52% { opacity: 1; }
      72% { opacity: 1; }
      74% { opacity: 0.92; }
      76% { opacity: 1; }
    }
  }

  /* Hide scan-lines and decorative animations entirely when reduced
     motion is preferred. */
  @media (prefers-reduced-motion: reduce) {
    .hhg-scanlines { display: none; }
  }

  /* Narrow viewports — collapse padding. */
  @media (max-width: 640px) {
    .hhg-page { padding: 2rem 1.25rem 2.5rem; }
    .hhg-page-num { font-size: 1.8rem; }
    .hhg-trace-tl, .hhg-trace-br { width: 70px; height: 56px; }
  }
`;
