/**
 * lib/poi-sculptor/anchor-paths.ts
 *
 * Catmull-Rom anchor paths that drive hand travel through the scene
 * while the local poi spin continues. Six choices.
 * Content registry — exempt from the 300-line cap.
 */

export type AnchorPath = {
  id: string;
  label: string;
  pts: [number, number, number][];
};

export const ANCHOR_PATHS: AnchorPath[] = [
  {
    id: "static",
    label: "Static",
    pts: [[0, 0, 0]],
  },
  {
    id: "diagonal",
    label: "Diagonal",
    pts: [
      [-1.2, -0.4, -0.5],
      [-0.4, 0.2, 0],
      [0.4, -0.1, 0],
      [1.2, 0.4, 0.5],
      [-1.2, -0.4, -0.5],
    ],
  },
  {
    id: "orbit",
    label: "Orbit",
    pts: [
      [1, 0, 0],
      [0, 0, 1],
      [-1, 0, 0],
      [0, 0, -1],
      [1, 0, 0],
    ],
  },
  {
    id: "figure8",
    label: "Figure 8",
    pts: [
      [-1.1, 0, 0],
      [-0.5, 0.5, 0.3],
      [0, 0, 0],
      [0.5, 0.5, -0.3],
      [1.1, 0, 0],
      [0.5, -0.5, 0.3],
      [0, 0, 0],
      [-0.5, -0.5, -0.3],
      [-1.1, 0, 0],
    ],
  },
  {
    id: "arc",
    label: "High Arc",
    pts: [
      [-1.2, -0.3, 0],
      [-0.6, 0.4, 0],
      [0, 0.9, 0],
      [0.6, 0.4, 0],
      [1.2, -0.3, 0],
      [0, -0.5, 0],
      [-1.2, -0.3, 0],
    ],
  },
  {
    id: "spiral",
    label: "Spiral",
    pts: [
      [0, 0, 0],
      [0.6, 0.3, 0],
      [1, 0, 0],
      [0.6, -0.4, 0.4],
      [0, 0, 0.6],
      [-0.6, 0.3, 0.3],
      [-0.8, 0, 0],
      [-0.4, -0.4, 0],
      [0, 0, 0],
    ],
  },
];
