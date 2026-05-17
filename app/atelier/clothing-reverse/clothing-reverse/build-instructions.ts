/**
 * app/atelier/clothing-reverse/clothing-reverse/build-instructions.ts
 * — Pure helpers: derives a constructed sewing sequence from the
 * Gemini garment-analysis, formats the export payload, downloads
 * JSON. Identical to the Vite-app `generateInstructions()` in
 * services/garmentAI.ts that this chamber ports from.
 *
 * Extracted from clothing-reverse-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { ConstructionStep, GarmentAnalysis } from "./types";

export function buildInstructions(a: GarmentAnalysis): ConstructionStep[] {
  const steps: ConstructionStep[] = [
    {
      step: 1,
      title: "Prepare pattern and fabric",
      description: `Cut all ${a.pattern.pieces.length} pattern pieces from your fabric. Mark all notches and darts.`,
      techniques: ["Pattern cutting", "Fabric marking"],
      estimatedTime: 30,
      difficulty: "easy",
    },
    {
      step: 2,
      title: "Interface key pieces",
      description:
        "Apply fusible interfacing to neckline, armholes, and any areas that need structure.",
      techniques: ["Interfacing application"],
      estimatedTime: 15,
      difficulty: "easy",
    },
    {
      step: 3,
      title: "Sew darts and main seams",
      description: `Sew all darts first, then join the main seams: ${a.construction.seams.slice(0, 3).join(", ") || "shoulder, side"}.`,
      techniques: ["Dart sewing", "Seam finishing"],
      estimatedTime: 45,
      difficulty: "medium",
    },
    {
      step: 4,
      title: "Assemble the body",
      description:
        "Join the major sub-assemblies (bodice to skirt, sleeves to body, etc.) at their seam lines.",
      techniques: ["Seam matching"],
      estimatedTime: 20,
      difficulty: "medium",
    },
  ];

  if (a.construction.closures.length > 0) {
    steps.push({
      step: steps.length + 1,
      title: "Install closure",
      description: `Install the ${a.construction.closures[0]!.toLowerCase()}. Ensure proper alignment.`,
      techniques: ["Closure installation"],
      estimatedTime: 25,
      difficulty: "medium",
    });
  }

  steps.push({
    step: steps.length + 1,
    title: "Hem and finish",
    description:
      "Finish all raw edges with your preferred method. Hem the garment.",
    techniques: ["Hemming", "Edge finishing"],
    estimatedTime: 30,
    difficulty: "easy",
  });

  steps.push({
    step: steps.length + 1,
    title: "Final press",
    description:
      "Press all seams. Give the garment a final pressing. Inspect for missed stitches.",
    techniques: ["Pressing", "Quality control"],
    estimatedTime: 15,
    difficulty: "easy",
  });

  return steps;
}

export function formatForExport(
  a: GarmentAnalysis,
  steps: ConstructionStep[],
) {
  return {
    title: `${a.garment.style} ${a.garment.type} — pattern spec`,
    generatedAt: new Date().toISOString(),
    garment: a.garment,
    measurements: a.measurements,
    materials: a.materials,
    patternPieces: a.pattern.pieces,
    construction: a.construction,
    colors: a.colors,
    instructions: steps,
    metadata: a.metadata,
  };
}

export function downloadJson(filename: string, payload: unknown): Blob {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob;
}
