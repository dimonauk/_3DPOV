/**
 * app/atelier/clothing-reverse/clothing-reverse/types.ts — Types
 * mirroring the /api/clothing-reverse/analyze response shape.
 *
 * Extracted from clothing-reverse-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

export type GarmentMeasurement = {
  name: string;
  value: number;
  unit: "cm" | "inches";
  confidence: number;
};

export type PatternPiece = {
  name: string;
  shape: "rectangle" | "trapezoid" | "curve" | "complex";
  estimatedWidth: number;
  estimatedHeight: number;
  cutCount: number;
  grainline: "lengthwise" | "crosswise" | "bias";
};

export type Material = {
  type: string;
  amount: number;
  unit: "m" | "yd";
  notes: string;
};

export type GarmentAnalysis = {
  garment: {
    type: string;
    style: string;
    description: string;
    features: string[];
    era: string;
    occasion: string[];
  };
  measurements: GarmentMeasurement[];
  construction: {
    seams: string[];
    closures: string[];
    details: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
  };
  materials: Material[];
  pattern: { pieces: PatternPiece[] };
  colors: { hex: string; name: string; percentage: number }[];
  metadata: {
    confidence: number;
    processingTime: number;
    modelVersion: string;
  };
};

export type ConstructionStep = {
  step: number;
  title: string;
  description: string;
  techniques: string[];
  estimatedTime: number;
  difficulty: "easy" | "medium" | "hard";
};

export type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | {
      kind: "ready";
      analysis: GarmentAnalysis;
      instructions: ConstructionStep[];
      durationMs: number;
    }
  | {
      kind: "error";
      message: string;
      code?: string;
      retryAfterSec?: number;
    };
