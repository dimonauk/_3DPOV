import type { Product } from "lib/shopify/types";

const METHOD_LABEL: Record<string, string> = {
  "method-traditional": "Traditional light painting",
  "method-led-pov": "Persistence-of-vision LED array",
  "method-drone-led": "Drone-mounted LED system",
};

function pickTag(tags: string[], pattern: RegExp): string | undefined {
  return tags.find((t) => pattern.test(t));
}

function editionSize(tags: string[]): string | null {
  const t = pickTag(tags, /^edition-\d+$/);
  return t ? `${t.split("-")[1]} + 2 AP` : null;
}

function method(tags: string[]): string | null {
  const t = tags.find((x) => x in METHOD_LABEL);
  return t ? METHOD_LABEL[t]! : null;
}

function fieldRecord(tags: string[]): { location?: string; hour?: string; date?: string } {
  // Tags of the form:
  //   loc-manchester-uk   →  Manchester, UK
  //   hour-23-00          →  23:00
  //   date-2025-09-21     →  21 September 2025
  const out: { location?: string; hour?: string; date?: string } = {};
  const loc = pickTag(tags, /^loc-/);
  if (loc) {
    out.location = loc
      .replace(/^loc-/, "")
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(", ")
      .replace(/, Uk$/, ", UK");
  }
  const hour = pickTag(tags, /^hour-\d{2}-\d{2}$/);
  if (hour) out.hour = hour.replace(/^hour-/, "").replace("-", ":");
  const date = pickTag(tags, /^date-\d{4}-\d{2}-\d{2}$/);
  if (date) {
    const parts = date.replace(/^date-/, "").split("-");
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    if (y && m && d) {
      out.date = `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    }
  }
  return out;
}

/**
 * Renders the editioning + field-record sidebar for photograph
 * products. Activates when the product has the `photo-print` tag; on
 * other products this component is never rendered (the product page
 * filters by tag before including it).
 *
 * Driven entirely by tags so that editing is done in Shopify admin —
 * no code changes per release.
 *
 *   photo-print                  → enables this sidebar
 *   edition-25                   → "Edition of 25 + 2 AP"
 *   method-led-pov               → "Persistence-of-vision LED array"
 *   loc-manchester-uk            → location line
 *   hour-23-00                   → hour line
 *   date-2025-09-21              → date line
 */
export function PhotographMeta({ product }: { product: Product }) {
  const ed = editionSize(product.tags);
  const m = method(product.tags);
  const fr = fieldRecord(product.tags);

  if (!ed && !m && !fr.location && !fr.hour && !fr.date) return null;

  return (
    <section className="mb-6 rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-5 text-sm text-chrome-200">
      <div className="chrome-label mb-3">Field record</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        {ed && (
          <>
            <dt className="text-chrome-500">Edition</dt>
            <dd className="font-mono">{ed}</dd>
          </>
        )}
        {m && (
          <>
            <dt className="text-chrome-500">Method</dt>
            <dd>{m}</dd>
          </>
        )}
        {fr.location && (
          <>
            <dt className="text-chrome-500">Location</dt>
            <dd>{fr.location}</dd>
          </>
        )}
        {fr.hour && (
          <>
            <dt className="text-chrome-500">Hour</dt>
            <dd className="font-mono">{fr.hour}</dd>
          </>
        )}
        {fr.date && (
          <>
            <dt className="text-chrome-500">Date</dt>
            <dd>{fr.date}</dd>
          </>
        )}
        <dt className="text-chrome-500">Certificate</dt>
        <dd>Signed, numbered, embossed</dd>
        <dt className="text-chrome-500">Ships from</dt>
        <dd>Salford, UK</dd>
      </dl>
    </section>
  );
}

export function isPhotographProduct(product: Product): boolean {
  return product.tags.includes("photo-print");
}
