"use client";

/**
 * components/trail/trail-content.tsx — Thin orchestrator for /trail.
 *
 * Composes every section module under `./sections/` and threads the
 * current-sandbox scroll state from `./use-current-sandbox.ts` into
 * the nav so the progress counter follows the reader.
 *
 * Every section is its own module — see `./sections/`. Add a new
 * Act by writing `trail-act-N.tsx` and inserting it in the JSX
 * below + a new anchor in `trail-nav.tsx`.
 */

import { TrailAct1 } from "./sections/trail-act-1";
import { TrailAct2 } from "./sections/trail-act-2";
import { TrailAct3 } from "./sections/trail-act-3";
import { TrailAct4 } from "./sections/trail-act-4";
import { TrailAct5 } from "./sections/trail-act-5";
import { TrailFooter } from "./sections/trail-footer";
import { TrailHero } from "./sections/trail-hero";
import { TrailLearningHeader } from "./sections/trail-learning-header";
import { TrailManifesto } from "./sections/trail-manifesto";
import { TrailNav } from "./sections/trail-nav";
import { useCurrentSandbox } from "./use-current-sandbox";

export function TrailContent() {
  const currentSandbox = useCurrentSandbox();

  return (
    <div className="trail-container">
      <TrailNav currentSandbox={currentSandbox} />
      <TrailHero />
      <TrailManifesto />
      <TrailLearningHeader />
      <TrailAct1 />
      <TrailAct2 />
      <TrailAct3 />
      <TrailAct4 />
      <TrailAct5 />
      <TrailFooter />
    </div>
  );
}
