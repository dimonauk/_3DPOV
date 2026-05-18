/**
 * app/atelier/breeding-floor/breeding-floor/types.ts — Chamber-local
 * genome wrapper + lineage entry shape + tunable constants.
 *
 * Extracted from breeding-floor-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { Genome } from "lib/evolution";

export const POPULATION_SIZE = 12;
export const LINEAGE_DEPTH = 5;
export const MUTATION_RATE = 0.25;

export type ChamberGenome = Genome & {
  /** Stable client-side id for React keys (separate from the breeding
   * sequenceId which collides easily after a mutate + breed cycle). */
  uid: string;
};

export type LineageEntry = {
  generation: number;
  thumbs: Array<{ uid: string; colour: string; favourite: boolean }>;
};
