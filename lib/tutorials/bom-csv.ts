/**
 * Bill-of-Materials CSV generator for an Instructable tutorial.
 *
 * Pure function — no I/O, no React, no Next dependencies. Turns an
 * `InstructableMeta` into a CSV string with one row per supply (or
 * one row per supplier when a supply has multi-vendor sourcing).
 *
 * Consumed by:
 *   - app/api/tutorials/[slug]/bom.csv/route.ts (download endpoint)
 *   - Future: a print stylesheet for the Test Chamber sheet.
 *
 * Columns:
 *   category   "material" | "tool" | "provision" | "software" | "dependency"
 *   name       Supply / software / dependency name
 *   quantity   Free-form ("1×", "200 g", "1 kg spool"). Empty if absent.
 *   optional   "yes" / "" — true when `isOptional` is set.
 *   note       Per-supply note (truncated to 240 chars for spreadsheet sanity).
 *   supplier   Supplier name (or "" when no suppliers listed).
 *   sku        Vendor SKU (or "").
 *   price      Vendor price string (or "").
 *   url        Direct vendor URL (or single-link fallback `url`).
 */

import type {
  InstructableDependency,
  InstructableMeta,
  InstructableSoftware,
  InstructableSupply,
} from "./types";

const HEADER = [
  "category",
  "name",
  "quantity",
  "optional",
  "note",
  "supplier",
  "sku",
  "price",
  "url",
] as const;

/** Escape one CSV field per RFC 4180. */
function csvField(value: string | undefined): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: Array<string | undefined>): string {
  return values.map(csvField).join(",");
}

function clamp(text: string | undefined, max = 240): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function supplyRows(
  category: "material" | "tool" | "provision",
  items: InstructableSupply[] | undefined,
): string[] {
  if (!items || items.length === 0) return [];
  const rows: string[] = [];
  for (const item of items) {
    const optional = item.isOptional ? "yes" : "";
    const note = clamp(item.note);
    const hasSuppliers = item.suppliers && item.suppliers.length > 0;
    if (hasSuppliers) {
      for (const supplier of item.suppliers!) {
        rows.push(
          csvRow([
            category,
            item.name,
            item.quantity,
            optional,
            note,
            supplier.name,
            supplier.sku,
            supplier.price,
            supplier.url,
          ]),
        );
      }
    } else {
      rows.push(
        csvRow([
          category,
          item.name,
          item.quantity,
          optional,
          note,
          "",
          "",
          "",
          item.url ?? "",
        ]),
      );
    }
  }
  return rows;
}

function softwareRows(items: InstructableSoftware[] | undefined): string[] {
  if (!items || items.length === 0) return [];
  return items.map((s) =>
    csvRow([
      "software",
      s.name,
      s.version,
      "",
      clamp(s.note),
      "",
      "",
      s.cost,
      s.url,
    ]),
  );
}

function dependencyRows(
  items: InstructableDependency[] | undefined,
): string[] {
  if (!items || items.length === 0) return [];
  return items.map((d) =>
    csvRow([
      "dependency",
      d.name,
      d.version,
      "",
      clamp(d.purpose),
      d.registry,
      "",
      "",
      d.url,
    ]),
  );
}

/**
 * Render an Instructable's supplies + software + dependencies as a
 * single CSV blob with a header row.
 */
export function renderBomCsv(meta: InstructableMeta): string {
  const lines: string[] = [];
  lines.push(csvRow([...HEADER]));
  lines.push(...supplyRows("material", meta.supplies?.materials));
  lines.push(...supplyRows("tool", meta.supplies?.tools));
  lines.push(...supplyRows("provision", meta.supplies?.provisions));
  lines.push(...softwareRows(meta.software));
  lines.push(...dependencyRows(meta.dependencies));
  // RFC 4180 line ending; spreadsheet tools all accept this.
  return lines.join("\r\n") + "\r\n";
}
