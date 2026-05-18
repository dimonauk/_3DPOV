/**
 * app/bureau/[itemId]/bureau/types.ts — Local picker-state types.
 * Per ARCHITECTURE.md Rule 1 + holoflow-modularise-300.
 */

import type {
  EditionChoice,
  PaperChoice,
  Quote,
  SizeChoice,
} from "lib/bureau/types";

export type PickerSelection = {
  sizeChoice: SizeChoice;
  paperChoice: PaperChoice;
  edition: EditionChoice;
};

export type QuoteState =
  | { kind: "idle" }
  | { kind: "fetching" }
  | { kind: "ready"; quote: Quote }
  | { kind: "error"; message: string };
