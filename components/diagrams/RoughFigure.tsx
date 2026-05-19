"use client";

/**
 * <RoughFigure /> — Renders a hand-sketched SVG via Rough.js.
 *
 * Client component. Rough.js draws hand-drawn-style primitives into
 * an SVG element. The library is dynamic-imported on mount so pages
 * that don't use this component pay no bundle cost.
 *
 * The figure is described as a list of typed primitives — `line`,
 * `rectangle`, `circle`, `ellipse`, `path`, `polygon`, `text`. Each
 * primitive accepts an `options` object for stroke/fill/roughness
 * overrides per the Rough.js API. Sketchy where IKEA-style is
 * precise; pairs well with journal-entry illustrations and rough
 * concept diagrams in articles.
 *
 * Usage from a server-component article:
 *
 *   <RoughFigure
 *     width={320}
 *     height={200}
 *     shapes={[
 *       { kind: "rectangle", x: 40, y: 40, w: 80, h: 60 },
 *       { kind: "circle", cx: 200, cy: 100, diameter: 60 },
 *       { kind: "line", x1: 0, y1: 100, x2: 320, y2: 100,
 *         options: { strokeLineDash: [5, 5] } },
 *     ]}
 *     caption="A sketch of the bench layout."
 *     label="Fig. R1"
 *   />
 *
 * Rough.js reference: https://roughjs.com/
 */

import { useEffect, useRef, useState } from "react";

// Local mirror of the Rough.js options shape, kept loose so callers
// don't have to import the library type just to set options.
export type RoughOptions = Record<string, unknown>;

export type RoughShape =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; options?: RoughOptions }
  | { kind: "rectangle"; x: number; y: number; w: number; h: number; options?: RoughOptions }
  | { kind: "circle"; cx: number; cy: number; diameter: number; options?: RoughOptions }
  | { kind: "ellipse"; cx: number; cy: number; w: number; h: number; options?: RoughOptions }
  | { kind: "polygon"; points: Array<[number, number]>; options?: RoughOptions }
  | { kind: "path"; d: string; options?: RoughOptions }
  | { kind: "text"; x: number; y: number; content: string; fontSize?: number; fontFamily?: string; fill?: string };

export type RoughFigureProps = {
  width: number;
  height: number;
  shapes: RoughShape[];
  label?: string;
  caption?: string;
  /** Background — cream by default for the IKEA-adjacent look. */
  background?: string;
  /** Default stroke colour applied to all primitives unless they override. */
  defaultStroke?: string;
  /** Default stroke width. */
  defaultStrokeWidth?: number;
  /** Rough.js global roughness. Higher = more wobble. */
  roughness?: number;
  /** Optional CSS max-width hint, e.g. "320px". */
  maxWidth?: string;
};

export function RoughFigure({
  width,
  height,
  shapes,
  label,
  caption,
  background = "#f6f1e7",
  defaultStroke = "#1a1a1d",
  defaultStrokeWidth = 1.8,
  roughness = 1.4,
  maxWidth,
}: RoughFigureProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rough = (await import("roughjs")).default;
        if (cancelled || !svgRef.current) return;
        const svg = svgRef.current;
        // Clear any previous run (effect re-runs on prop change).
        while (svg.lastChild) svg.removeChild(svg.lastChild);
        const rc = rough.svg(svg, { options: { roughness } });
        const baseOpts: RoughOptions = {
          stroke: defaultStroke,
          strokeWidth: defaultStrokeWidth,
          roughness,
        };
        for (const shape of shapes) {
          const node = drawShape(rc, svg, shape, baseOpts);
          if (node) svg.appendChild(node);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shapes, defaultStroke, defaultStrokeWidth, roughness]);

  return (
    <figure className="rough-figure" style={{ maxWidth }}>
      <style>{`
        .rough-figure {
          margin: 1.5rem auto;
          padding: 0.6rem;
          border-radius: 0.5rem;
        }
        .rough-figure__canvas {
          width: 100%;
          height: auto;
          border-radius: 0.4rem;
        }
        .rough-figure__caption {
          margin-top: 0.5rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          color: rgba(241, 239, 232, 0.7);
        }
        .rough-figure__label {
          font-weight: 600;
          margin-right: 0.5rem;
          color: #f4a8b8;
        }
        .rough-figure__error {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          color: #ff8585;
          padding: 0.4rem 0;
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="rough-figure__canvas"
        style={{ background }}
        role="img"
        aria-label={caption ?? label ?? "Hand-sketched figure"}
      />
      {error && <div className="rough-figure__error">Rough: {error}</div>}
      {(label || caption) && (
        <figcaption className="rough-figure__caption">
          {label && <span className="rough-figure__label">{label}</span>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

type RoughSvg = {
  line: (x1: number, y1: number, x2: number, y2: number, options?: RoughOptions) => SVGGElement;
  rectangle: (x: number, y: number, w: number, h: number, options?: RoughOptions) => SVGGElement;
  circle: (cx: number, cy: number, diameter: number, options?: RoughOptions) => SVGGElement;
  ellipse: (cx: number, cy: number, w: number, h: number, options?: RoughOptions) => SVGGElement;
  polygon: (points: Array<[number, number]>, options?: RoughOptions) => SVGGElement;
  path: (d: string, options?: RoughOptions) => SVGGElement;
};

function drawShape(
  rc: RoughSvg,
  svg: SVGSVGElement,
  shape: RoughShape,
  baseOpts: RoughOptions,
): SVGElement | null {
  const merge = (extra?: RoughOptions): RoughOptions => ({
    ...baseOpts,
    ...(extra ?? {}),
  });
  switch (shape.kind) {
    case "line":
      return rc.line(shape.x1, shape.y1, shape.x2, shape.y2, merge(shape.options));
    case "rectangle":
      return rc.rectangle(shape.x, shape.y, shape.w, shape.h, merge(shape.options));
    case "circle":
      return rc.circle(shape.cx, shape.cy, shape.diameter, merge(shape.options));
    case "ellipse":
      return rc.ellipse(shape.cx, shape.cy, shape.w, shape.h, merge(shape.options));
    case "polygon":
      return rc.polygon(shape.points, merge(shape.options));
    case "path":
      return rc.path(shape.d, merge(shape.options));
    case "text": {
      const t = document.createElementNS(svg.namespaceURI, "text") as SVGTextElement;
      t.setAttribute("x", String(shape.x));
      t.setAttribute("y", String(shape.y));
      t.setAttribute("font-family", shape.fontFamily ?? "ui-monospace, SFMono-Regular, Menlo, monospace");
      t.setAttribute("font-size", String(shape.fontSize ?? 12));
      t.setAttribute("fill", shape.fill ?? (baseOpts.stroke as string) ?? "#1a1a1d");
      t.textContent = shape.content;
      return t;
    }
  }
}

export default RoughFigure;
