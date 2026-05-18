/**
 * app/admin/wardrobe/wardrobe/styles.ts — Scoped CSS for the admin
 * wardrobe upload page. CSS string registry, exempt from the 300-line
 * cap per ARCHITECTURE.md Rule 1.
 *
 * The `aw-*` prefix is unique to this route, so injecting via
 * `<style jsx global>` is safe.
 */

export const ADMIN_WARDROBE_STYLES = `
  .aw-root {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    color: rgba(255, 255, 255, 0.92);
  }
  .aw-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .aw-header p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin: 0 0 2rem;
  }
  .aw-header code {
    background: rgba(255, 111, 181, 0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }
  .aw-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 111, 181, 0.2);
    border-radius: 0.75rem;
  }
  .aw-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .aw-label {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .aw-row input[type="text"],
  .aw-row input[type="file"] {
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.55rem 0.75rem;
    border-radius: 0.4rem;
    font-size: 0.9rem;
    font-family: inherit;
  }
  .aw-row input:focus {
    outline: 0;
    border-color: rgba(255, 111, 181, 0.6);
  }
  .aw-glyph-input {
    max-width: 5rem;
    text-align: center;
    font-size: 1.2rem !important;
  }
  .aw-input-error {
    border-color: rgba(255, 82, 82, 0.6) !important;
  }
  .aw-hint {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.45);
  }
  .aw-error-hint {
    color: #ff8585;
  }
  .aw-upload-btn {
    background: #ff6fb5;
    color: white;
    border: 0;
    padding: 0.7rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-start;
    font-family: inherit;
  }
  .aw-upload-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .aw-warn {
    color: #ff8585;
    font-size: 0.85rem;
    margin: 0;
  }
  .aw-output {
    margin-top: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 111, 181, 0.3);
    border-radius: 0.75rem;
  }
  .aw-output-error {
    border-color: rgba(255, 82, 82, 0.4);
  }
  .aw-output-title {
    font-weight: 700;
    margin-bottom: 0.4rem;
  }
  .aw-output-meta {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    margin: 0.4rem 0;
  }
  .aw-output-meta code {
    background: rgba(255, 111, 181, 0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 0.25rem;
  }
  .aw-output-meta a {
    color: #ff6fb5;
  }
  .aw-snippet {
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
  .aw-copy-btn {
    background: rgba(255, 111, 181, 0.15);
    color: white;
    border: 1px solid rgba(255, 111, 181, 0.4);
    padding: 0.4rem 0.85rem;
    border-radius: 0.4rem;
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
  }
  .aw-copy-btn:hover {
    background: rgba(255, 111, 181, 0.25);
  }
`;
