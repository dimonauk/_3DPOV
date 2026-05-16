"use client";

/**
 * /cards/mine/[slug]/embed — owner-facing snippet generator.
 *
 * Shows the iframe HTML the owner can paste into:
 *   • Their own website
 *   • Notion / Medium / Substack (HTML embed blocks)
 *   • WordPress (raw HTML widget)
 *   • Email signature footers (some clients render iframes; many don't)
 *
 * Lets them tweak width, height, and aspect-ratio responsiveness.
 * Includes a live preview so they can see what's getting pasted.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "components/auth/auth-provider";

export default function CardEmbedSnippetPage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [origin, setOrigin] = useState("https://holoflow.co.uk");
  const [width, setWidth] = useState<string>("100%");
  const [height, setHeight] = useState<number>(640);
  const [responsive, setResponsive] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) router.replace("/signin");
  }, [auth.loading, auth.user, router]);

  const embedUrl = `${origin}/c/${slug}/embed`;

  const iframeSnippet = responsive
    ? `<div style="position:relative;width:${width === "100%" ? "100%" : width + "px"};max-width:${width === "100%" ? "640px" : width + "px"};margin:0 auto">
  <div style="position:relative;width:100%;padding-bottom:${(height / 480 * 75).toFixed(2)}%">
    <iframe
      src="${embedUrl}"
      style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px"
      title="Holo-Flow card embed"
      loading="lazy"
      allow="camera; xr-spatial-tracking"
    ></iframe>
  </div>
</div>`
    : `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  style="border:0;border-radius:12px"
  title="Holo-Flow card embed"
  loading="lazy"
  allow="camera; xr-spatial-tracking"
></iframe>`;

  const scriptSnippet = `<script async src="${origin}/embed.js" data-card="${slug}" data-height="${height}"></script>
<div data-holoflow-card="${slug}"></div>`;

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setFlash(`${label} copied to clipboard`);
      setTimeout(() => setFlash(null), 2000);
    });
  };

  if (auth.loading) return <main className="es-root">Loading…</main>;

  return (
    <main className="es-root">
      <header className="es-head">
        <div>
          <div className="es-crumb">
            <Link href="/cards/mine">← Your cards</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/analytics`}>Analytics</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/leads`}>Leads</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/settings`}>Settings</Link>
          </div>
          <h1>{slug} — embed</h1>
          <p className="es-sub">
            Drop this on any website to render your card inline. Loads only
            when scrolled into view, transparent background, works on every
            browser that supports iframes.
          </p>
        </div>
        <Link href={`/c/${slug}/embed`} className="es-action" target="_blank">
          Preview ↗
        </Link>
      </header>

      <section className="es-section">
        <h2>Size</h2>
        <div className="es-controls">
          <label className="es-field">
            Width
            <select
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="es-input"
            >
              <option value="100%">100% (responsive)</option>
              <option value="320">320 px</option>
              <option value="480">480 px</option>
              <option value="640">640 px</option>
              <option value="800">800 px</option>
            </select>
          </label>
          <label className="es-field">
            Height
            <input
              type="number"
              value={height}
              onChange={(e) =>
                setHeight(Math.max(300, Math.min(1200, +e.target.value || 0)))
              }
              min={300}
              max={1200}
              step={20}
              className="es-input es-input-num"
            />
            px
          </label>
          <label className="es-field es-check">
            <input
              type="checkbox"
              checked={responsive}
              onChange={(e) => setResponsive(e.target.checked)}
            />
            Aspect-ratio responsive wrapper
          </label>
        </div>
      </section>

      <section className="es-section">
        <h2>iframe snippet</h2>
        <p className="es-help">
          Paste this anywhere that accepts HTML — your own site, Notion
          /embed block, Medium HTML cards, WordPress raw-HTML widgets.
        </p>
        <pre className="es-code">{iframeSnippet}</pre>
        <button
          onClick={() => copy(iframeSnippet, "iframe snippet")}
          className="es-btn"
        >
          Copy iframe snippet
        </button>
      </section>

      <section className="es-section">
        <h2>Script tag (auto-resizing)</h2>
        <p className="es-help">
          For sites you control fully — drop the script tag and a target div,
          and the card embed loads with automatic height adjustment.
        </p>
        <pre className="es-code">{scriptSnippet}</pre>
        <button
          onClick={() => copy(scriptSnippet, "Script snippet")}
          className="es-btn"
        >
          Copy script snippet
        </button>
      </section>

      <section className="es-section">
        <h2>Live preview</h2>
        <div className="es-preview">
          <iframe
            src={`/c/${slug}/embed`}
            style={{
              width: width === "100%" ? "100%" : `${width}px`,
              height: `${height}px`,
              border: 0,
              borderRadius: 12,
              background: "#0a0a0f",
            }}
            title="Embed preview"
            loading="lazy"
            allow="camera; xr-spatial-tracking"
          />
        </div>
      </section>

      {flash && <div className="es-toast">{flash}</div>}

      <style jsx>{`
        .es-root {
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .es-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .es-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .es-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .es-crumb a:hover {
          opacity: 1;
        }
        .es-sub {
          opacity: 0.65;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          max-width: 36rem;
        }
        .es-action {
          color: inherit;
          text-decoration: none;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 0.9rem;
        }
        .es-section {
          margin-bottom: 3rem;
        }
        .es-section h2 {
          font-size: 1.1rem;
          margin: 0 0 0.5rem;
        }
        .es-help {
          opacity: 0.7;
          font-size: 0.9rem;
          margin: 0 0 0.75rem;
        }
        .es-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .es-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          opacity: 0.85;
        }
        .es-input {
          padding: 0.5rem 0.7rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0.4rem;
          color: inherit;
          font-size: 0.9rem;
          font-family: inherit;
        }
        .es-input-num {
          width: 6rem;
        }
        .es-check {
          flex-direction: row;
          align-items: center;
        }
        .es-code {
          background: rgba(0, 0, 0, 0.5);
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: pre;
          line-height: 1.45;
          color: #e0e0f0;
        }
        .es-btn {
          margin-top: 0.5rem;
          padding: 0.55rem 1rem;
          border-radius: 999px;
          background: transparent;
          color: inherit;
          border: 1px solid currentColor;
          font-size: 0.85rem;
          cursor: pointer;
          opacity: 0.85;
        }
        .es-btn:hover {
          opacity: 1;
        }
        .es-preview {
          border: 1px dashed rgba(255, 255, 255, 0.15);
          padding: 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
        }
        .es-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 0.7rem 1.3rem;
          border-radius: 999px;
          font-size: 0.85rem;
          z-index: 99;
        }
      `}</style>
    </main>
  );
}
