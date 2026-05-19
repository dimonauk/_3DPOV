import type { ReactNode } from "react";

/**
 * The thin small-caps mono band that sits across the top of a section
 * or cover plate — the magazine-cover line that reads:
 *   "JOURNAL · ISSUE 03 · MAY 2026 · HOLOFLOW STUDIO"
 *
 * Pure server component. Renders nothing if every slot resolves
 * empty, so it's safe to drop in with no props.
 */
export type IssueBandProps = {
  /** Issue marker, e.g. "ISSUE 03". */
  issue?: string;
  /** Date label, e.g. "MAY 2026". */
  date?: string;
  /** Publisher / masthead. Defaults to "HOLOFLOW STUDIO". */
  publisher?: string;
  /** Optional section label slotted at the start, e.g. "JOURNAL". */
  label?: string;
};

export function IssueBand({
  issue,
  date,
  publisher = "HOLOFLOW STUDIO",
  label,
}: IssueBandProps) {
  // Build the ordered list of slot contents, drop empties, so the
  // CSS `span + span::before` dot separator is always correctly placed.
  const slots: ReactNode[] = [];
  if (label) slots.push(label);
  if (issue) slots.push(issue);
  if (date) slots.push(date);
  if (publisher) slots.push(publisher);

  if (slots.length === 0) return null;

  return (
    <div className="lux-issue-band">
      {slots.map((slot, i) => (
        <span key={i}>{slot}</span>
      ))}
    </div>
  );
}
