/**
 * app/atelier/modal-lattice/modal-lattice/types.ts — Types +
 * dropdown registries for the lattice deformer.
 *
 * Extracted from modal-lattice-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

export type Kernel = "linear" | "bspline" | "cardinal" | "catmull";

export const KERNELS: ReadonlyArray<{ id: Kernel; label: string; hint: string }> =
  [
    {
      id: "linear",
      label: "Linear",
      hint: "Trilinear. The cheap, faceted one.",
    },
    {
      id: "bspline",
      label: "B-spline",
      hint: "Cubic, smoothing. Doesn't pass through points.",
    },
    {
      id: "cardinal",
      label: "Cardinal",
      hint: "Interpolating with tension. Crisp.",
    },
    {
      id: "catmull",
      label: "Catmull-Rom",
      hint: "Interpolating, tangent-continuous. Cloth-like.",
    },
  ];

export type Shape = "sphere" | "torus" | "icosa";

export const SHAPES: ReadonlyArray<{ id: Shape; label: string }> = [
  { id: "sphere", label: "Sphere" },
  { id: "torus", label: "Torus" },
  { id: "icosa", label: "Icosahedron" },
];

export type LatticeDims = { u: number; v: number; w: number };

export const INITIAL_DIMS: LatticeDims = { u: 4, v: 4, w: 4 };
