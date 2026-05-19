/**
 * app/admin/targeting/styles.ts — Scoped CSS. CSS string registry,
 * exempt from the 300-line cap.
 */

export const ADMIN_TARGETING_STYLES = `
  .tg-root {
    max-width: 880px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    color: rgba(255, 255, 255, 0.92);
  }
  .tg-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .tg-header p {
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.9rem;
    margin: 0 0 0.6rem;
    line-height: 1.5;
  }
  .tg-header code {
    background: rgba(255, 111, 181, 0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }
  .tg-hint {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.5);
  }
  .tg-form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.4rem 1.5rem;
    margin: 1.5rem 0;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 111, 181, 0.2);
    border-radius: 0.75rem;
  }
  .tg-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .tg-label {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .tg-row input[type="text"],
  .tg-row select {
    background: rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.55rem 0.7rem;
    border-radius: 0.4rem;
    font-size: 0.9rem;
    font-family: inherit;
  }
  .tg-row input:focus,
  .tg-row select:focus {
    outline: 0;
    border-color: rgba(255, 111, 181, 0.55);
  }
  .tg-run {
    background: #ff6fb5;
    color: #1a0a1a;
    border: 0;
    padding: 0.7rem 1.4rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-start;
    font-family: inherit;
  }
  .tg-results {
    margin-top: 1.5rem;
  }
  .tg-results-title {
    font-weight: 700;
    margin-bottom: 0.85rem;
  }
  .tg-empty {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.9rem;
  }
  .tg-hits {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .tg-hits li {
    padding: 0.85rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.5rem;
  }
  .tg-hit-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.6rem;
  }
  .tg-hit-name a {
    color: rgba(255, 255, 255, 0.92);
    font-weight: 600;
    text-decoration: none;
  }
  .tg-hit-name a:hover {
    color: #ff6fb5;
  }
  .tg-hit-score {
    background: rgba(255, 111, 181, 0.15);
    color: #ffb1d6;
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .tg-hit-meta {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0.35rem 0;
  }
  .tg-hit-reasons {
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.7);
  }
  .tg-hit-links {
    margin-top: 0.45rem;
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
  }
  .tg-hit-links a {
    color: #ff6fb5;
    text-decoration: none;
  }
  .tg-hit-links a:hover {
    text-decoration: underline;
  }
`;
