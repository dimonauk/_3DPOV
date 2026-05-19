"use client";

/**
 * <MermaidBlock /> — Renders a Mermaid chart from a string.
 *
 * Client component. Mermaid pulls a multi-megabyte parser graph plus
 * a DOM-dependent render path, so the library is dynamic-imported
 * once on mount and the rendered SVG is injected via
 * `dangerouslySetInnerHTML`. Pages that never instantiate this
 * component never pay for the bundle.
 *
 * Theme matches the chrome aesthetic — pink accents on a near-black
 * background, monospace labels. Pass `theme="light"` for a cream
 * variant suitable for printable docs.
 *
 * Usage from a server-component article:
 *
 *   <MermaidBlock
 *     chart={`graph LR
 *       A[Camera] --> B[Buffer]
 *       B --> C[Inference]
 *       C --> D[Display]`}
 *     caption="The capture loop, top-level."
 *     label="Fig. M1"
 *   />
 *
 * Renderer reference: https://mermaid.js.org/
 */

import { useEffect, useId, useRef, useState } from "react";

export type MermaidBlockProps = {
  /** Mermaid source. Any chart type Mermaid supports. */
  chart: string;
  /** Optional figure label, e.g. "Fig. M1". */
  label?: string;
  /** Optional caption rendered below the chart. */
  caption?: string;
  /** Visual theme. Defaults to the chrome/dark studio palette. */
  theme?: "chrome" | "light";
  /** Optional CSS max-width hint, e.g. "640px". */
  maxWidth?: string;
};

const CHROME_INIT_CONFIG = {
  theme: "base" as const,
  themeVariables: {
    background: "transparent",
    primaryColor: "#1a1a1d",
    primaryTextColor: "#f1efe8",
    primaryBorderColor: "#f4a8b8",
    lineColor: "#f4a8b8",
    secondaryColor: "#262629",
    tertiaryColor: "#1a1a1d",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "13px",
  },
  flowchart: { htmlLabels: true, curve: "basis" },
  sequence: { actorMargin: 50, mirrorActors: false },
  startOnLoad: false,
  securityLevel: "loose" as const,
};

const LIGHT_INIT_CONFIG = {
  theme: "base" as const,
  themeVariables: {
    background: "#f6f1e7",
    primaryColor: "#f6f1e7",
    primaryTextColor: "#1a1a1d",
    primaryBorderColor: "#1a1a1d",
    lineColor: "#1a1a1d",
    secondaryColor: "#e8e0d0",
    tertiaryColor: "#f6f1e7",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "13px",
  },
  startOnLoad: false,
  securityLevel: "loose" as const,
};

export function MermaidBlock({
  chart,
  label,
  caption,
  theme = "chrome",
  maxWidth = "720px",
}: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackId = useId().replace(/:/g, "_");
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize(
          theme === "light" ? LIGHT_INIT_CONFIG : CHROME_INIT_CONFIG,
        );
        const { svg } = await mermaid.render(
          `mermaid-${fallbackId}`,
          chart.trim(),
        );
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRendered(true);
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
  }, [chart, fallbackId, theme]);

  const wrapperClass =
    theme === "light"
      ? "mermaid-block mermaid-block--light"
      : "mermaid-block mermaid-block--chrome";

  return (
    <figure className={wrapperClass} style={{ maxWidth }}>
      <style>{`
        .mermaid-block {
          margin: 1.75rem auto;
          padding: 1rem 1.25rem;
          border-radius: 0.6rem;
          overflow: hidden;
        }
        .mermaid-block--chrome {
          background: #0e0e10;
          border: 1px solid rgba(244, 168, 184, 0.18);
        }
        .mermaid-block--light {
          background: #f6f1e7;
          border: 1px solid #1a1a1d;
        }
        .mermaid-block__canvas {
          display: flex;
          justify-content: center;
          min-height: 80px;
        }
        .mermaid-block__canvas svg {
          max-width: 100%;
          height: auto;
        }
        .mermaid-block__fallback {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          color: rgba(241, 239, 232, 0.55);
          white-space: pre;
          overflow-x: auto;
        }
        .mermaid-block__error {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          color: #ff8585;
          padding: 0.4rem 0;
        }
        .mermaid-block__caption {
          margin-top: 0.6rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          color: ${theme === "light" ? "#1a1a1d" : "rgba(241,239,232,0.65)"};
        }
        .mermaid-block__label {
          font-weight: 600;
          margin-right: 0.5rem;
          color: ${theme === "light" ? "#1a1a1d" : "#f4a8b8"};
        }
      `}</style>
      <div ref={containerRef} className="mermaid-block__canvas" aria-live="polite">
        {!rendered && !error && (
          <pre className="mermaid-block__fallback" aria-hidden="true">
            {chart.trim()}
          </pre>
        )}
      </div>
      {error && (
        <div className="mermaid-block__error">Mermaid: {error}</div>
      )}
      {(label || caption) && (
        <figcaption className="mermaid-block__caption">
          {label && <span className="mermaid-block__label">{label}</span>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default MermaidBlock;
