/**
 * app/admin/drops/new/new-drop/transform.ts
 *
 * Pure converters between the form state and the API payload.
 *   parseChain: split a comma/newline-separated parentage chain.
 *   toPublishInput: coerce numeric fields + assemble DropPublishInput.
 */

import type { DropPublishInput } from "lib/drops/types";

import type { FormState } from "./types";

export function parseChain(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function toPublishInput(state: FormState): DropPublishInput {
  const limitedSize = Number.parseInt(state.limitedSizeText, 10);
  const safeLimited =
    Number.isFinite(limitedSize) && limitedSize >= 0 ? limitedSize : 0;
  const chain = parseChain(state.parentageChainText);
  const input: DropPublishInput = {
    title: state.title.trim(),
    summary: state.summary.trim(),
    genomeId: state.genomeId.trim(),
    edition: {
      unique: true,
      limitedSize: safeLimited,
      openEnabled: state.openEnabled,
    },
    tierIncluded: {
      member: state.tierIncludedMember,
      patron: state.tierIncludedPatron,
      atelier: state.tierIncludedAtelier,
    },
    firstRefusalRadius: state.firstRefusalRadius,
    passkitEnabled: state.passkitEnabled,
  };
  if (chain.length > 0) input.parentageChain = chain;
  return input;
}
