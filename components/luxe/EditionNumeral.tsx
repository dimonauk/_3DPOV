/**
 * Large outlined display numeral for section openers and issue covers.
 * Sits as a self-positioning block — pair it with `SectionOpener` for
 * the standard magazine-index header treatment, or drop it solo at the
 * top of a long page when a number is the visual anchor.
 */
export type EditionNumeralProps = {
  /** The numeral itself. Accepts string or number, e.g. "03" or 3. */
  numeral: string | number;
  /** Optional small-caps label below the numeral, e.g. "ARTICLES". */
  label?: string;
  /** Horizontal alignment within the parent. Defaults to "left". */
  align?: "left" | "center" | "right";
};

const alignmentClass: Record<
  NonNullable<EditionNumeralProps["align"]>,
  string
> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export function EditionNumeral({
  numeral,
  label,
  align = "left",
}: EditionNumeralProps) {
  return (
    <div className={`flex flex-col ${alignmentClass[align]}`}>
      <span className="lux-edition-numeral" aria-hidden>
        {numeral}
      </span>
      {label && (
        <span className="chrome-label mt-3 text-pink-200">{label}</span>
      )}
    </div>
  );
}
