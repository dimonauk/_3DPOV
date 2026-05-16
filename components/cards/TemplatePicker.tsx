"use client";

/**
 * TemplatePicker — grid of pre-designed starting points shown above
 * the card designer form.
 *
 * Each tile previews the template's brand palette as a gradient + the
 * starter role line. Click to apply — the parent editor receives the
 * template and sets the card's brand + role + tagline accordingly.
 *
 * Loads templates lazily from /api/templates on first render. While
 * loading the component renders nothing (no flicker, no empty state).
 *
 * The grid is collapsible — defaults to closed so the editor doesn't
 * dominate the page on load. A single tap opens it.
 */

import { useEffect, useState } from "react";

export type CardTemplate = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    textOnBrand: string;
    font: "display" | "serif" | "mono";
  };
  starter: {
    role: string;
    tagline: string;
  };
};

type Props = {
  onPick: (template: CardTemplate) => void;
  /** Open by default (default: false) */
  defaultOpen?: boolean;
};

export default function TemplatePicker({
  onPick,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [templates, setTemplates] = useState<CardTemplate[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || templates) return;
    void fetch("/api/templates")
      .then((res) => res.json())
      .then((body: { templates?: CardTemplate[] }) => {
        setTemplates(body.templates ?? []);
      })
      .catch(() => {
        setTemplates([]);
      });
  }, [open, templates]);

  return (
    <div className="tp-root">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tp-toggle"
      >
        <span aria-hidden>🎨</span>{" "}
        {open ? "Hide templates" : "Start from a template"}
        <span className="tp-sub">
          {open ? "" : "Pre-designed palettes for common roles"}
        </span>
      </button>

      {open && (
        <div className="tp-grid">
          {!templates && <p className="tp-loading">Loading templates…</p>}
          {templates &&
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveId(t.id);
                  onPick(t);
                }}
                className={`tp-tile ${activeId === t.id ? "tp-tile-active" : ""}`}
                style={{
                  background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})`,
                  color: t.palette.textOnBrand,
                }}
              >
                <span className="tp-name">{t.name}</span>
                <span className="tp-role">{t.starter.role}</span>
                <span className="tp-desc">{t.description}</span>
                <span
                  className="tp-accent"
                  style={{ background: t.palette.accent }}
                />
              </button>
            ))}
          {templates && templates.length === 0 && (
            <p className="tp-loading">No templates installed yet.</p>
          )}
        </div>
      )}

      <style jsx>{`
        .tp-root {
          margin-bottom: 1.5rem;
        }
        .tp-toggle {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
          padding: 0.85rem 1.2rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .tp-toggle:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .tp-sub {
          font-weight: 400;
          font-size: 0.8rem;
          opacity: 0.65;
        }
        .tp-grid {
          margin-top: 0.8rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.6rem;
        }
        .tp-tile {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.4rem;
          padding: 1rem 1.1rem;
          border-radius: 0.75rem;
          border: 2px solid transparent;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          aspect-ratio: 1.3;
          overflow: hidden;
          transition: transform 0.1s ease, border-color 0.15s ease;
        }
        .tp-tile:hover {
          transform: translateY(-2px);
        }
        .tp-tile-active {
          border-color: rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15);
        }
        .tp-name {
          font-weight: 700;
          font-size: 0.95rem;
          line-height: 1.2;
        }
        .tp-role {
          font-size: 0.8rem;
          opacity: 0.85;
        }
        .tp-desc {
          font-size: 0.7rem;
          opacity: 0.65;
          line-height: 1.4;
          margin-top: 0.25rem;
        }
        .tp-accent {
          position: absolute;
          bottom: 0.5rem;
          right: 0.7rem;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        .tp-loading {
          opacity: 0.6;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
