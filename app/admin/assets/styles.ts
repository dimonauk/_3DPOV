/**
 * app/admin/assets/styles.ts — Scoped CSS for the admin asset
 * registry page. CSS string registry, exempt from the 300-line cap
 * per ARCHITECTURE.md Rule 1.
 *
 * The `aa-*` prefix is unique to this route, so injecting via
 * `<style jsx global>` is safe.
 */

export const ADMIN_ASSETS_STYLES = `
  .aa-root {
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    color: rgba(255, 255, 255, 0.92);
  }
  .aa-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .aa-header p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin: 0 0 1.5rem;
    line-height: 1.5;
  }
  .aa-header code,
  .aa-output-title code {
    background: rgba(120, 200, 255, 0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }
  .aa-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .aa-tabs button {
    background: rgba(0, 0, 0, 0.3);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.5rem 0.95rem;
    border-radius: 0.4rem;
    font-size: 0.85rem;
    cursor: pointer;
    font-family: inherit;
  }
  .aa-tabs button:hover {
    border-color: rgba(120, 200, 255, 0.4);
    color: white;
  }
  .aa-tabs .aa-tab-active {
    background: rgba(120, 200, 255, 0.15);
    border-color: rgba(120, 200, 255, 0.6);
    color: white;
    font-weight: 700;
  }
  .aa-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(120, 200, 255, 0.18);
    border-radius: 0.75rem;
  }
  .aa-form h2 {
    margin: 0 0 0.5rem;
    font-size: 1.05rem;
    font-weight: 600;
  }
  .aa-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .aa-label {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .aa-row input[type="text"],
  .aa-row input[type="number"],
  .aa-row input[type="file"],
  .aa-row select {
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.55rem 0.75rem;
    border-radius: 0.4rem;
    font-size: 0.9rem;
    font-family: inherit;
  }
  .aa-row input:focus,
  .aa-row select:focus {
    outline: 0;
    border-color: rgba(120, 200, 255, 0.6);
  }
  .aa-input-error {
    border-color: rgba(255, 82, 82, 0.6) !important;
  }
  .aa-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.45);
  }
  .aa-hint code {
    background: rgba(120, 200, 255, 0.12);
    padding: 0.05rem 0.3rem;
    border-radius: 0.2rem;
  }
  .aa-error-hint {
    color: #ff8585;
  }
  .aa-upload-btn {
    background: #6fc8ff;
    color: #021b2c;
    border: 0;
    padding: 0.7rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-start;
    font-family: inherit;
  }
  .aa-upload-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .aa-warn {
    color: #ff8585;
    font-size: 0.85rem;
    margin: 0;
  }
  .aa-output {
    margin-top: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(120, 200, 255, 0.35);
    border-radius: 0.75rem;
  }
  .aa-output-title {
    font-weight: 700;
    margin-bottom: 0.4rem;
  }
  .aa-output-meta {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    margin: 0.4rem 0;
  }
  .aa-snippet {
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.4rem;
    padding: 0.85rem 1rem;
    margin: 0.6rem 0;
    font-family: ui-monospace, SFMono-Regular, "Cascadia Code", Menlo,
      monospace;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.85);
    white-space: pre;
    overflow-x: auto;
  }
  .aa-copy-btn {
    background: rgba(120, 200, 255, 0.15);
    color: white;
    border: 1px solid rgba(120, 200, 255, 0.4);
    padding: 0.4rem 0.85rem;
    border-radius: 0.4rem;
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
  }
  .aa-copy-btn:hover {
    background: rgba(120, 200, 255, 0.25);
  }
`;
