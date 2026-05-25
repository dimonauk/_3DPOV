/**
 * app/admin/drops/new/new-drop/types.ts
 *
 * Shared types + styling constants + INITIAL_STATE for the drop
 * publish form. Pure data. The form-friendly state shape mirrors
 * `DropPublishInput` but keeps numeric fields as strings (so the
 * `<input type="number">` element behaves) and coerces on submit.
 */

import {
  DEFAULT_EDITION_CONFIG,
  DEFAULT_FIRST_REFUSAL_RADIUS,
  DEFAULT_TIER_INCLUDED,
  type FirstRefusalRadius,
  type GateVerdict,
} from "lib/drops/types";

export type FormState = {
  title: string;
  summary: string;
  genomeId: string;
  parentageChainText: string;
  limitedSizeText: string;
  openEnabled: boolean;
  tierIncludedMember: boolean;
  tierIncludedPatron: boolean;
  tierIncludedAtelier: boolean;
  firstRefusalRadius: FirstRefusalRadius;
  passkitEnabled: boolean;
};

export const INITIAL_STATE: FormState = {
  title: "",
  summary: "",
  genomeId: "",
  parentageChainText: "",
  limitedSizeText: String(DEFAULT_EDITION_CONFIG.limitedSize),
  openEnabled: DEFAULT_EDITION_CONFIG.openEnabled,
  tierIncludedMember: DEFAULT_TIER_INCLUDED.member,
  tierIncludedPatron: DEFAULT_TIER_INCLUDED.patron,
  tierIncludedAtelier: DEFAULT_TIER_INCLUDED.atelier,
  firstRefusalRadius: DEFAULT_FIRST_REFUSAL_RADIUS,
  passkitEnabled: true,
};

export type SubmitStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | {
      kind: "gate-failed";
      message: string;
      oracle?: GateVerdict;
      sieve?: GateVerdict;
    }
  | {
      kind: "validation-failed";
      issues: ReadonlyArray<{ path: string; message: string }>;
    }
  | { kind: "error"; message: string }
  | { kind: "done"; dropId: string };

export const INPUT_CLASS =
  "w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 placeholder-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-60";
export const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[6rem] leading-relaxed`;
export const LABEL_CLASS = "chrome-label text-chrome-500";

export const RADIUS_LABEL: Record<FirstRefusalRadius, string> = {
  "parent-only": "Parent only",
  "parent+grandparent+siblings-of-parent":
    "Parent + grandparent + siblings of parent",
  "full-kingdom": "Full kingdom",
};
