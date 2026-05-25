/**
 * app/bureau/checkout/[slug]/[edition]/checkout/styles.tsx
 *
 * Scoped CSS for the checkout surface. Inlined via
 * `<style dangerouslySetInnerHTML>` so the renderer can be used inside
 * a Server Component shell without styled-jsx.
 */

const CSS = `
.dcc-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.dcc-notice {
  padding: 1rem 1.1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  line-height: 1.5;
}
.dcc-muted {
  color: rgba(255, 255, 255, 0.7);
}
.dcc-error {
  padding: 0.85rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 130, 130, 0.4);
  background: rgba(255, 82, 82, 0.08);
  color: #ffb5b5;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}
.dcc-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: #ff6fb5;
  color: #1a0a1a;
  border: 0;
  padding: 0.85rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
}
.dcc-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.dcc-btn-ghost {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  color: #ff6fb5;
  border: 1px solid rgba(255, 111, 181, 0.5);
  padding: 0.75rem 1.4rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
}
.dcc-btn-ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.dcc-link {
  color: #ff6fb5;
  text-decoration: none;
  font-size: 0.88rem;
}
.dcc-link:hover {
  text-decoration: underline;
}
.dcc-fineprint {
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.3rem 0 0;
  line-height: 1.5;
}
.dcc-paid {
  background: rgba(60, 200, 120, 0.06);
  border: 1px solid rgba(60, 200, 120, 0.35);
  border-radius: 0.6rem;
  padding: 1.25rem 1.2rem;
}
.dcc-paid-tag {
  display: inline-block;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6fe8a3;
  background: rgba(60, 200, 120, 0.12);
  border: 1px solid rgba(60, 200, 120, 0.35);
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.7rem;
}
.dcc-paid-title {
  font-size: 1.15rem;
  margin: 0 0 0.85rem;
  font-weight: 600;
}
.dcc-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
  margin: 0 0 1rem;
}
.dcc-meta > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
  padding-bottom: 0.4rem;
}
.dcc-meta dt {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.dcc-meta dd {
  margin: 0;
}
.dcc-meta code {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.08rem 0.35rem;
  border-radius: 0.25rem;
  font-size: 0.78rem;
}
.dcc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}
.dcc-processing {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 1.25rem 1.1rem;
  background: rgba(255, 111, 181, 0.06);
  border: 1px solid rgba(255, 111, 181, 0.3);
  border-radius: 0.6rem;
}
.dcc-processing p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
}
.dcc-spinner {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 111, 181, 0.25);
  border-top-color: #ff6fb5;
  animation: dcc-spin 0.9s linear infinite;
}
@keyframes dcc-spin {
  to {
    transform: rotate(360deg);
  }
}
.dcc-fineprint code {
  background: rgba(0, 0, 0, 0.35);
  padding: 0.04rem 0.3rem;
  border-radius: 0.22rem;
}
`;

export function CheckoutStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
