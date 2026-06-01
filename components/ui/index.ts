/**
 * components/ui/index.ts
 *
 * Shared UI primitives usable anywhere in the site — not tied to
 * the holoflow section or the atelier. Re-exports the canonical
 * implementations so import paths stay stable even if internals move.
 *
 *   import { Card, ChromeLabel, SectionHeader, Chip } from "components/ui";
 *   import { AtelierToolPage }                        from "components/ui";
 *   import { useThreeScene, useAnimationLoop }        from "components/ui";
 */

// ── Layout primitives (from holoflow component system) ───────────────
export { Card, Chip, MetricCard }  from "components/holoflow";
export { ChromeLabel }             from "components/holoflow/ChromeLabel";
export { SectionHeader }           from "components/holoflow/SectionHeader";

// ── Atelier shell ────────────────────────────────────────────────────
export { AtelierToolPage }         from "components/atelier/tool-page";
export type {
  AtelierChip,
  AtelierNotes,
  AtelierToolPageProps,
}                                  from "components/atelier/tool-page";

// ── Canvas / Three.js hooks ──────────────────────────────────────────
export { useThreeScene }           from "hooks/useThreeScene";
export { useAnimationLoop }        from "hooks/useAnimationLoop";
export type {
  ThreeFrameCtx,
  UseThreeSceneOptions,
}                                  from "hooks/useThreeScene";
