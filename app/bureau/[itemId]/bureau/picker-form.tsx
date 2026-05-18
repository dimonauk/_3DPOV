"use client";

/**
 * app/bureau/[itemId]/bureau/picker-form.tsx — Picker UI for the
 * print bureau. Three radio groups (size / paper / edition), one
 * "Get quote" button. Pure presentation — the orchestrator owns the
 * fetch + Quote state.
 *
 * Per ARCHITECTURE.md Rule 1.
 */

import {
  ALL_EDITIONS,
  ALL_PAPERS,
  ALL_SIZES,
  type EditionChoice,
  type PaperChoice,
  type SizeChoice,
} from "lib/bureau/types";
import {
  EDITION_DESCRIPTIONS,
  EDITION_LABELS,
  PAPER_LABELS,
  PAPER_NOTES,
  SIZE_DESCRIPTIONS,
  SIZE_LABELS,
} from "lib/bureau/pricing";

export function PickerForm({
  sizeChoice,
  paperChoice,
  edition,
  onSize,
  onPaper,
  onEdition,
  onSubmit,
  busy,
}: {
  sizeChoice: SizeChoice;
  paperChoice: PaperChoice;
  edition: EditionChoice;
  onSize: (v: SizeChoice) => void;
  onPaper: (v: PaperChoice) => void;
  onEdition: (v: EditionChoice) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <form
      className="bp-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="bp-fs">
        <legend>Size</legend>
        <div className="bp-options">
          {ALL_SIZES.map((s) => (
            <label
              key={s}
              className={
                "bp-opt" + (sizeChoice === s ? " bp-opt-active" : "")
              }
            >
              <input
                type="radio"
                name="size"
                value={s}
                checked={sizeChoice === s}
                onChange={() => onSize(s)}
              />
              <span className="bp-opt-label">{SIZE_LABELS[s]}</span>
              <span className="bp-opt-desc">{SIZE_DESCRIPTIONS[s]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="bp-fs">
        <legend>Paper</legend>
        <div className="bp-options">
          {ALL_PAPERS.map((p) => (
            <label
              key={p}
              className={
                "bp-opt" + (paperChoice === p ? " bp-opt-active" : "")
              }
            >
              <input
                type="radio"
                name="paper"
                value={p}
                checked={paperChoice === p}
                onChange={() => onPaper(p)}
              />
              <span className="bp-opt-label">{PAPER_LABELS[p]}</span>
              <span className="bp-opt-desc">{PAPER_NOTES[p]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="bp-fs">
        <legend>Edition</legend>
        <div className="bp-options">
          {ALL_EDITIONS.map((e) => (
            <label
              key={e}
              className={
                "bp-opt" + (edition === e ? " bp-opt-active" : "")
              }
            >
              <input
                type="radio"
                name="edition"
                value={e}
                checked={edition === e}
                onChange={() => onEdition(e)}
              />
              <span className="bp-opt-label">{EDITION_LABELS[e]}</span>
              <span className="bp-opt-desc">{EDITION_DESCRIPTIONS[e]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={busy} className="bp-submit">
        {busy ? "Computing quote…" : "Get quote"}
      </button>
    </form>
  );
}
