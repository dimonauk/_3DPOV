/**
 * Page-folio label — the small mono numeric tag used in the margins
 * or footers of section pages. Drop one in at the bottom of a long
 * page so the reader has the magazine-style cue that they've reached
 * the foot of the spread.
 */
export type LuxFolioProps = {
  /** The page label, e.g. "p.04". The caller controls the format. */
  page: string;
  /** Optional context line shown next to the page number. */
  context?: string;
};

export function LuxFolio({ page, context }: LuxFolioProps) {
  return (
    <span className="lux-folio">
      <span>{page}</span>
      {context && (
        <span className="ml-3 text-chrome-500">{context}</span>
      )}
    </span>
  );
}
