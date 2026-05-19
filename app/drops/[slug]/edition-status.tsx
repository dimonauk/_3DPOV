import { isLimitedSoldOut } from "lib/drops/read";
import type { Drop } from "lib/drops/types";

/**
 * Server component. Renders the three-edition status block (Unique /
 * Limited / Open) with per-edition counts.
 *
 * Why this is a server component and not a client one: the underlying
 * counts come from Firestore via the parent page's Server Component
 * fetch — there's no live-updating subscription here. The numbers are
 * fresh-at-page-load. Buyers refresh between claims.
 */
export function DropEditionStatus({ drop }: { drop: Drop }) {
  const limitedSoldOut = isLimitedSoldOut(drop);
  const limitedRemaining = Math.max(
    0,
    drop.edition.limitedSize - drop.editionState.limitedClaimed,
  );

  return (
    <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
      <div
        className={`rounded border p-5 ${
          drop.editionState.uniqueClaimed
            ? "border-chrome-700 bg-warm-black-900/40 text-chrome-400"
            : "border-pink-300/40 bg-pink-300/5 text-chrome-100"
        }`}
      >
        <div className="chrome-label">Unique</div>
        <p className="mt-2 text-2xl">
          {drop.editionState.uniqueClaimed ? "Claimed" : "Open"}
        </p>
        <p className="mt-2 text-xs">
          One piece, ever. The studio signs and dates it on the base.
        </p>
      </div>

      <div
        className={`rounded border p-5 ${
          limitedSoldOut
            ? "border-chrome-700 bg-warm-black-900/40 text-chrome-400"
            : "border-amber-300/40 bg-amber-300/5 text-chrome-100"
        }`}
      >
        <div className="chrome-label">Limited</div>
        <p className="mt-2 text-2xl">
          {limitedSoldOut
            ? "Sold out"
            : `${limitedRemaining} of ${drop.edition.limitedSize}`}
        </p>
        <p className="mt-2 text-xs">
          Editioned and numbered. Atelier tier holds 25% during the
          first-refusal window.
        </p>
      </div>

      <div
        className={`rounded border p-5 ${
          drop.edition.openEnabled
            ? "border-emerald-300/40 bg-emerald-300/5 text-chrome-100"
            : "border-chrome-700 bg-warm-black-900/40 text-chrome-500"
        }`}
      >
        <div className="chrome-label">Open</div>
        <p className="mt-2 text-2xl">
          {drop.edition.openEnabled
            ? `${drop.editionState.openClaimed} sold`
            : "Not on this drop"}
        </p>
        <p className="mt-2 text-xs">
          Unbounded run. Same piece, lighter signing, ships in
          rotation.
        </p>
      </div>
    </div>
  );
}
