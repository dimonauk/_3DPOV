/**
 * Scoped CSS for `<Instructable>`. Kept in a sibling file so the
 * renderer stays under the 300-line cap and so the style sheet can
 * be inspected / overridden independently.
 *
 * Inline via `<style dangerouslySetInnerHTML={{ __html: STYLES }} />`
 * because the renderer is used inside Server Components, which can't
 * load styled-jsx.
 */
export const INSTRUCTABLE_STYLES = `
.instructable {
  margin-top: 4rem;
  border-top: 1px solid var(--color-warm-black-800);
  padding-top: 3rem;
}

.instructable__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
}

.instructable__chip {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-warm-black-700);
  border-radius: 2px;
  background: var(--color-warm-black-900);
  min-width: 7rem;
}

.instructable__chip-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-pink-200);
}

.instructable__chip-value {
  font-size: 0.95rem;
  color: var(--color-warm-black-50);
  line-height: 1.3;
}

.instructable__band {
  margin-top: 3rem;
}

.instructable__band-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-pink-200);
  margin-bottom: 1.25rem;
}

.instructable__supplies {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 700px) {
  .instructable__supplies {
    grid-template-columns: 1fr 1fr;
  }
}

.instructable__supply-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.instructable__supply-list-title {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-warm-black-100);
  margin-bottom: 0.5rem;
}

.instructable__supply {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--color-warm-black-50);
  font-size: 0.95rem;
  line-height: 1.5;
}

.instructable__supply::before {
  content: "·";
  color: var(--color-pink-200);
  flex-shrink: 0;
}

.instructable__supply-link {
  color: var(--color-warm-black-50);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.instructable__supply-link:hover {
  color: var(--color-pink-200);
}

.instructable__supply-note {
  color: var(--color-warm-black-100);
  font-size: 0.85rem;
}

.instructable__supply-optional {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-warm-black-100);
  margin-left: 0.5rem;
}

.instructable__steps {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.instructable__step {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: start;
  padding-top: 2rem;
  border-top: 1px solid var(--color-warm-black-800);
}

.instructable__step:first-child {
  border-top: none;
  padding-top: 0;
}

@media (min-width: 700px) {
  .instructable__step--with-image {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  .instructable__step--with-image.instructable__step--flip .instructable__step-body {
    order: 2;
  }
}

.instructable__step-number {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-pink-200);
  margin-bottom: 0.5rem;
}

.instructable__step-title {
  font-size: 1.35rem;
  color: var(--color-warm-black-50);
  margin: 0 0 0.75rem;
  line-height: 1.3;
}

.instructable__step-body p {
  color: var(--color-warm-black-50);
  line-height: 1.7;
  margin: 0 0 1em;
}

.instructable__step-body p:last-child {
  margin-bottom: 0;
}

.instructable__step-image {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border: 1px solid var(--color-warm-black-800);
  border-radius: 2px;
  background: var(--color-warm-black-950);
}

.instructable__step-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.instructable__step-credit {
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-warm-black-100);
}

.instructable__final {
  padding: 1.5rem;
  border: 1px solid var(--color-warm-black-700);
  border-radius: 2px;
  background: var(--color-warm-black-900);
  color: var(--color-warm-black-50);
  line-height: 1.6;
}

.instructable__variations {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.instructable__variations li {
  display: flex;
  gap: 0.5rem;
  color: var(--color-warm-black-50);
  line-height: 1.6;
}

.instructable__variations li::before {
  content: "→";
  color: var(--color-pink-200);
  flex-shrink: 0;
}

.instructable__trouble {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.instructable__trouble-item {
  padding: 1rem 1.25rem;
  border-left: 2px solid var(--color-pink-200);
  background: var(--color-warm-black-900);
}

.instructable__trouble-symptom {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-pink-200);
  margin-bottom: 0.5rem;
}

.instructable__trouble-cause,
.instructable__trouble-fix {
  margin: 0.25rem 0;
  color: var(--color-warm-black-50);
  line-height: 1.6;
}

.instructable__trouble-cause strong,
.instructable__trouble-fix strong {
  color: var(--color-pink-200);
  font-weight: 500;
}

/* IKEA-style figure strip — flat-line diagrams inside a step body */
.instructable__figures {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1.25rem 0 0.5rem;
  padding: 1rem;
  background: var(--color-warm-black-950);
  border: 1px solid var(--color-warm-black-700);
  border-radius: 0.4rem;
}
.instructable__figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.instructable__figure-frame {
  background: #f5f3ec;
  border-radius: 0.35rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.instructable__figure-frame img {
  width: 100%;
  height: auto;
  display: block;
}
.instructable__figure-caption {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--color-warm-black-300);
}
.instructable__figure-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-pink-200);
  flex-shrink: 0;
}
.instructable__figure-text {
  flex: 1;
}

/* Software + dependencies + prerequisites bands */
.instructable__prerequisites {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.instructable__prerequisites li {
  color: var(--color-warm-black-50);
  line-height: 1.5;
  padding-left: 1.25rem;
  position: relative;
}
.instructable__prerequisites li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--color-pink-200);
  font-size: 0.9rem;
}

.instructable__software,
.instructable__deps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.instructable__software-item {
  padding: 0.85rem 1rem;
  background: var(--color-warm-black-900);
  border-left: 2px solid var(--color-pink-200);
  border-radius: 0 0.3rem 0.3rem 0;
}
.instructable__software-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.95rem;
}
.instructable__software-link {
  color: var(--color-pink-200);
  font-weight: 500;
  text-decoration: none;
}
.instructable__software-link:hover {
  text-decoration: underline;
}
.instructable__software-version,
.instructable__software-cost {
  color: var(--color-warm-black-300);
  font-size: 0.8rem;
}
.instructable__software-platforms {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--color-warm-black-400);
  margin-top: 0.2rem;
}
.instructable__software-note {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  color: var(--color-warm-black-200);
  line-height: 1.5;
}

.instructable__dep {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-warm-black-200);
  padding: 0.4rem 0;
  border-bottom: 1px dashed var(--color-warm-black-800);
}
.instructable__dep code {
  background: var(--color-warm-black-900);
  padding: 0.05rem 0.3rem;
  border-radius: 0.2rem;
  color: var(--color-pink-200);
  font-size: 0.82rem;
}
.instructable__dep-link {
  text-decoration: none;
}
.instructable__dep-link:hover code {
  background: var(--color-warm-black-800);
}
.instructable__dep-registry {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--color-warm-black-400);
  text-transform: uppercase;
}
.instructable__dep-purpose {
  color: var(--color-warm-black-300);
}
.instructable__dep-version {
  color: var(--color-warm-black-300);
  font-size: 0.8rem;
}

/* Multi-supplier rows nested under a supply item */
.instructable__suppliers {
  margin: 0.35rem 0 0;
  padding: 0;
  padding-left: 1rem;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
}
.instructable__supplier {
  color: var(--color-warm-black-300);
}
.instructable__supplier-link {
  color: var(--color-pink-200);
  text-decoration: none;
}
.instructable__supplier-link:hover {
  text-decoration: underline;
}
.instructable__supplier-sku {
  font-family: var(--font-mono);
  color: var(--color-warm-black-400);
}
.instructable__supplier-price {
  color: var(--color-warm-black-300);
}

.instructable__supply-quantity {
  color: var(--color-warm-black-300);
  font-size: 0.85rem;
}
`;
