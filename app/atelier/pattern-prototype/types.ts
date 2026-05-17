/**
 * app/atelier/pattern-prototype/types.ts — Shared types for the
 * pattern-prototype chamber.
 *
 * Extracted from pattern-prototype-client.tsx so the sub-components
 * (icons, pattern-logic, chat-bot, eventually sidebar / studio-view /
 * textile-view / pattern-editor) can import them without pulling in
 * the main client component.
 */

export type AppMode =
  | "editorial"
  | "blueprint"
  | "playroom"
  | "archive"
  | "textile";

/**
 * Textile generation lifecycle — distinct from the Gemini SVG draft
 * because Flux1-dev runs on the studio bench (10-30s) rather than
 * browser→Google.
 */
export type TextileState =
  | { kind: "idle" }
  | { kind: "loading"; startedAt: number; prompt: string }
  | {
      kind: "ready";
      url: string;
      prompt: string;
      bytes: number;
      durationMs: number;
    }
  | { kind: "error"; message: string };

export type MeasurementSet = {
  bust: number;
  waist: number;
  hips: number;
  height: number;
};

export type OutfitState = {
  jacket: string;
  bottom: string;
  accessories: string[];
  color: string;
  pattern: "solid" | "dots" | "floral";
};

export type PatternGenerationResult = {
  code: string;
  garmentType: string;
  baseDesign: string;
};

export type ChatMessage = { role: "user" | "model"; text: string };
