/**
 * app/atelier/pattern-prototype/pattern-logic.ts — Mock FreeSewing
 * pattern executor + Gemini draft call.
 *
 * Extracted from pattern-prototype-client.tsx. The chamber feeds the
 * visitor's prompt to Gemini with PATTERN_SYSTEM_INSTRUCTION, gets back
 * a JS string defining `draftPattern(measurements, options)`, then
 * runs that inside a `new Function(...)` sandbox with the Point + Path
 * classes hand-rolled here. Output is an SVG path-data string the
 * editor renders.
 */

import { GoogleGenAI } from "@google/genai";

import { createLogger } from "lib/log";

import type {
  MeasurementSet,
  PatternGenerationResult,
} from "./types";

const log = createLogger("atelier:pattern-prototype:logic");

export class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}
  shift(angle: number, distance: number): Point {
    const rad = (angle * Math.PI) / 180;
    return new Point(
      this.x + Math.cos(rad) * distance,
      this.y + Math.sin(rad) * distance,
    );
  }
}

export class Path {
  private ops: string[] = [];
  move(p: Point): Path {
    this.ops.push(`M ${p.x} ${p.y}`);
    return this;
  }
  line(p: Point): Path {
    this.ops.push(`L ${p.x} ${p.y}`);
    return this;
  }
  curve(cp1: Point, cp2: Point, p: Point): Path {
    this.ops.push(`C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${p.x} ${p.y}`);
    return this;
  }
  close(): Path {
    this.ops.push("Z");
    return this;
  }
  asPathstring(): string {
    return this.ops.join(" ");
  }
}

export function executePatternLogic(
  code: string,
  measurements: MeasurementSet,
  options: Record<string, number>,
): string {
  if (!code) return "";
  try {
    const fullCode = `
      ${code}
      if (typeof draftPattern === 'function') {
        return draftPattern(measurements, options);
      }
      return "";
    `;
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function(
      "measurements",
      "options",
      "Point",
      "Path",
      fullCode,
    );
    const out = fn(measurements, options, Point, Path);
    return typeof out === "string" ? out : "";
  } catch (err) {
    log.warn("pattern execution failed", { err: String(err) });
    return "";
  }
}

export const PATTERN_SYSTEM_INSTRUCTION = `ROLE: You are the Pattern Logic Engine.
OBJECTIVE: Translate user inputs into executable pattern logic using a simplified FreeSewing mock.
OUTPUT FORMAT: Output ONLY raw JavaScript. No markdown. One function named draftPattern(measurements, options).
CLASSES AVAILABLE:
- Point(x, y) with method .shift(angle, distance)
- Path() with methods .move(Point), .line(Point), .curve(cp1, cp2, p), .close(), .asPathstring()
TEMPLATE:
function draftPattern(measurements, options) {
  const part = { points: {}, paths: {} };
  const waistRadius = (measurements.waist / (2 * Math.PI)) * (options.waistFit || 1.0);
  part.points.center = new Point(0, 0);
  part.points.waist = part.points.center.shift(90, waistRadius);
  part.points.hem = part.points.waist.shift(90, 100 * (options.length || 0.5));
  part.paths.seam = new Path().move(part.points.waist).line(part.points.hem).close();
  return part.paths.seam.asPathstring();
}
CONSTRAINTS: Valid ES6. No markdown fences. Tailor curves to the garment type.`;

export async function generatePattern(
  prompt: string,
  apiKey: string,
): Promise<PatternGenerationResult> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: PATTERN_SYSTEM_INSTRUCTION,
      temperature: 0.1,
    },
  });
  let code = response.text ?? "";
  code = code.replace(/```javascript|```js|```/g, "").trim();
  return { code, baseDesign: "Custom", garmentType: "Ensemble" };
}
