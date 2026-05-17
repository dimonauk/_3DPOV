/**
 * app/atelier/quilt-designer/quilt-designer/types.ts — Types shared
 * between the block library, the cell state, and the state hook.
 *
 * Extracted from quilt-designer-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type React from "react";

export type Swatch = { name: string; hex: string };

export type BlockRenderer = (
  primary: string,
  secondary: string,
  background: string,
) => React.ReactNode;

export type Block = {
  id: string;
  label: string;
  render: BlockRenderer;
};

export type Cell = {
  blockId: string;
  primary: string;
  secondary: string;
  background: string;
  rotation: 0 | 90 | 180 | 270;
};
