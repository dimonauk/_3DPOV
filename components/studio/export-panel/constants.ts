/**
 * components/studio/export-panel/constants.ts — Default splat
 * training-variant + install-link constants for the export panel.
 *
 * Extracted from ExportPanel.tsx per ARCHITECTURE.md Rule 1.
 */

import type { SubmitVariant } from "./types";

export const DEFAULT_VARIANTS: SubmitVariant[] = [
  { sfm: "colmap", trainer: "nerfstudio", strategy: "auto" },
];

export const DESKTOP_INSTALL_URL = "https://holoflow.co.uk/desktop";
