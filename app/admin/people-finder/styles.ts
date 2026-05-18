/**
 * app/admin/people-finder/styles.ts — Scoped CSS. CSS string
 * registry, exempt from the 300-line cap.
 */

export const ADMIN_PEOPLE_FINDER_STYLES = `
  .pf-root {
    max-width: 820px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    color: rgba(255, 255, 255, 0.92);
  }
  .pf-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .pf-header p {
    color: rgba(255, 255, 255, 0.65);
    font-size: 0.9rem;
    margin: 0 0 0.6rem;
    line-height: 1.5;
  }
  .pf-header code {
    background: rgba(120, 200, 255, 0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }
  .pf-hint {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.45);
  }
  .pf-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    margin: 1.5rem 0;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(120, 200, 255, 0.18);
    border-radius: 0.75rem;
  }
  .pf-row {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .pf-label {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .pf-row textarea {
    background: rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.6rem 0.8rem;
    border-radius: 0.4rem;
    font-size: 0.88rem;
    font-family: ui-monospace, "Cascadia Code", Menlo, monospace;
    resize: vertical;
  }
  .pf-row textarea:focus {
    outline: 0;
    border-color: rgba(120, 200, 255, 0.6);
  }
  .pf-run-btn {
    background: #6fc8ff;
    color: #021b2c;
    border: 0;
    padding: 0.7rem 1.4rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-start;
    font-family: inherit;
  }
  .pf-run-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pf-warn {
    color: #ff8585;
    font-size: 0.85rem;
    margin: 0;
  }
  .pf-results {
    margin-top: 1.5rem;
  }
  .pf-results-title {
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .pf-run {
    padding: 1rem 1.25rem;
    margin-bottom: 0.85rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.55rem;
  }
  .pf-run h2 {
    font-size: 1rem;
    margin: 0 0 0.6rem;
    color: rgba(255, 255, 255, 0.9);
  }
  .pf-empty {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    margin: 0;
  }
  .pf-hits {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .pf-hits li {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 0.85rem;
    font-size: 0.85rem;
    align-items: baseline;
  }
  .pf-hits strong {
    color: rgba(255, 255, 255, 0.85);
    font-weight: 600;
  }
  .pf-hits a {
    color: #6fc8ff;
    text-decoration: none;
    word-break: break-all;
  }
  .pf-hits a:hover {
    text-decoration: underline;
  }
`;
