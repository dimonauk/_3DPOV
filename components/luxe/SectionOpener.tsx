import { IssueBand } from "./IssueBand";
import { EditionNumeral } from "./EditionNumeral";

/**
 * Composite header for magazine-style index pages (`/articles`,
 * `/journal`, `/tutorials`). Stacks the IssueBand at the top, an
 * EditionNumeral pulled to the left, an optional strapline beside it,
 * and a strong hairline rule beneath the lot.
 *
 * Self-positioning — drop it in as the first child of the page's main
 * container and let the surrounding layout supply horizontal padding.
 */
export type SectionOpenerProps = {
  /** Issue marker forwarded to IssueBand, e.g. "ISSUE 03". */
  issue?: string;
  /** Date label forwarded to IssueBand, e.g. "MAY 2026". */
  date?: string;
  /** The numeral shown in the big outlined display type. */
  numeral: string;
  /** Section label, e.g. "ARTICLES". Doubles as the band label and
   *  the small-caps tag under the numeral. */
  sectionLabel: string;
  /** Optional one-line strapline placed to the right of the numeral
   *  on md+ screens, beneath it on mobile. */
  strapline?: string;
};

export function SectionOpener({
  issue,
  date,
  numeral,
  sectionLabel,
  strapline,
}: SectionOpenerProps) {
  return (
    <header className="w-full">
      <IssueBand issue={issue} date={date} label={sectionLabel} />

      <div className="flex flex-col gap-6 pt-12 pb-10 md:flex-row md:items-end md:justify-between md:gap-10 md:pt-16 md:pb-14">
        <EditionNumeral numeral={numeral} label={sectionLabel} align="left" />
        {strapline && (
          <p className="max-w-md font-display text-lg leading-snug text-chrome-200 md:text-xl">
            {strapline}
          </p>
        )}
      </div>

      <div className="lux-hairline-strong" />
    </header>
  );
}
