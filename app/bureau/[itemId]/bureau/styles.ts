/**
 * app/bureau/[itemId]/bureau/styles.ts — Scoped CSS for the bureau
 * picker. Content-registry-style, exempt from the 300-line cap.
 *
 * The `bp-*` prefix is unique to this route, so injecting via
 * `<style jsx global>` is safe.
 */

export const BUREAU_PICKER_STYLES = `
  .bp-root {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    color: rgba(255, 255, 255, 0.92);
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 800px) {
    .bp-root {
      grid-template-columns: 1fr 22rem;
    }
  }
  .bp-header {
    grid-column: 1 / -1;
  }
  .bp-header h1 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .bp-header p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin: 0;
  }
  .bp-header code {
    background: rgba(255, 111, 181, 0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
  }
  .bp-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .bp-fs {
    border: 1px solid rgba(255, 111, 181, 0.2);
    border-radius: 0.6rem;
    padding: 0.85rem 1rem 1rem;
    margin: 0;
    background: rgba(0, 0, 0, 0.2);
  }
  .bp-fs legend {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 111, 181, 0.85);
    padding: 0 0.4rem;
  }
  .bp-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .bp-opt {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: 0.6rem;
    align-items: start;
    padding: 0.6rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.45rem;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .bp-opt:hover {
    border-color: rgba(255, 111, 181, 0.4);
  }
  .bp-opt-active {
    border-color: rgba(255, 111, 181, 0.85);
    background: rgba(255, 111, 181, 0.08);
  }
  .bp-opt input[type="radio"] {
    grid-row: 1 / span 2;
    align-self: center;
    accent-color: #ff6fb5;
  }
  .bp-opt-label {
    font-size: 0.92rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
  }
  .bp-opt-desc {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.35;
  }
  .bp-submit {
    background: #ff6fb5;
    color: white;
    border: 0;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    align-self: flex-start;
  }
  .bp-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bp-quote {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 111, 181, 0.3);
    border-radius: 0.6rem;
    padding: 1.25rem;
    align-self: start;
    position: sticky;
    top: 2rem;
  }
  .bp-quote-label {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 111, 181, 0.85);
  }
  .bp-quote-price {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 0.3rem 0 0.9rem;
  }
  .bp-quote-dl {
    margin: 0 0 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .bp-quote-row {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    gap: 0.5rem;
    margin: 0;
  }
  .bp-quote-row dt {
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
  }
  .bp-quote-row dd {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }
  .bp-quote-paper {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.4;
    padding-top: 0.7rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin: 0 0 0.9rem;
  }
  .bp-quote-order {
    width: 100%;
    background: #ff6fb5;
    color: white;
    border: 0;
    padding: 0.75rem 1.2rem;
    border-radius: 0.45rem;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }
  .bp-quote-fineprint {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0.7rem 0 0;
  }
  .bp-empty {
    background: rgba(0, 0, 0, 0.2);
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 0.6rem;
    padding: 1.5rem;
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.85rem;
    align-self: start;
  }
  .bp-error {
    background: rgba(255, 82, 82, 0.08);
    border: 1px solid rgba(255, 82, 82, 0.4);
    color: #ff8585;
    padding: 0.8rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  /* Customer + shipping form (revealed after Order CTA). */
  .bp-cust {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-top: 1rem;
    padding: 1.25rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 111, 181, 0.3);
    border-radius: 0.6rem;
  }
  .bp-cust-title {
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 111, 181, 0.85);
    margin-bottom: 0.2rem;
  }
  .bp-cust-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .bp-cust-row span {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 0.04em;
  }
  .bp-cust-row input {
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.55rem 0.75rem;
    border-radius: 0.4rem;
    font-size: 0.9rem;
    font-family: inherit;
  }
  .bp-cust-row input:focus {
    outline: 0;
    border-color: rgba(255, 111, 181, 0.6);
  }
  .bp-cust-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem;
  }
  .bp-cust-country {
    text-transform: uppercase;
    max-width: 5rem;
  }
  .bp-cust-error {
    background: rgba(255, 82, 82, 0.08);
    border: 1px solid rgba(255, 82, 82, 0.4);
    color: #ff8585;
    padding: 0.6rem 0.85rem;
    border-radius: 0.4rem;
    font-size: 0.82rem;
    margin: 0;
  }
  .bp-cust-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.4rem;
  }
  .bp-cust-cancel {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.6rem 1rem;
    border-radius: 0.4rem;
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
  }
  .bp-cust-pay {
    background: #ff6fb5;
    color: white;
    border: 0;
    padding: 0.65rem 1.3rem;
    border-radius: 0.45rem;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }
  .bp-cust-pay:disabled,
  .bp-cust-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bp-cust-fineprint {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0.3rem 0 0;
  }
`;
