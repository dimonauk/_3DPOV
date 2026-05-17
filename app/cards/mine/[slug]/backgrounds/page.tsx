"use client";

/**
 * /cards/mine/[slug]/backgrounds — virtual background download page.
 *
 * Lets the owner preview and download three variants:
 *   • bottomBar — gradient + name/role bar + QR
 *   • gradient  — gradient + faint studio wordmark
 *   • minimal   — pure brand gradient
 *
 * Three resolutions:
 *   • 1080p (1920×1080) — Zoom / Meet / Teams default
 *   • 720p  (1280×720)  — older laptops, faster downloads
 *   • 4K    (3840×2160) — broadcasts, projectors
 *
 * Each background is generated server-side on demand and cached for
 * one hour at the edge. No persistent storage — re-render is cheap.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "components/auth/auth-provider";

type Variant = "bottomBar" | "gradient" | "minimal";
type Size = "1080p" | "720p" | "4k";

const VARIANTS: Array<{ key: Variant; label: string; desc: string }> = [
  {
    key: "bottomBar",
    label: "Branded bar",
    desc: "Gradient + name/role ribbon + QR. Best for video calls.",
  },
  {
    key: "gradient",
    label: "Wordmark",
    desc: "Gradient with a faint studio name in the centre.",
  },
  {
    key: "minimal",
    label: "Pure gradient",
    desc: "Brand colours only. Subtle, no text.",
  },
];

export default function CardBackgroundsPage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [size, setSize] = useState<Size>("1080p");
  const [showQr, setShowQr] = useState(true);
  const [cacheBust, setCacheBust] = useState(Date.now());

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) router.replace("/signin");
  }, [auth.loading, auth.user, router]);

  const urlFor = (variant: Variant) =>
    `/api/cards/${slug}/background.png?variant=${variant}&size=${size}&showQr=${showQr ? 1 : 0}&cb=${cacheBust}`;

  if (auth.loading) return <main className="bg-root">Loading…</main>;

  return (
    <main className="bg-root">
      <header className="bg-head">
        <div>
          <div className="bg-crumb">
            <Link href="/cards/mine">← Your cards</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/analytics`}>Analytics</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/leads`}>Leads</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/settings`}>Settings</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/embed`}>Embed</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/signature`}>Signature</Link>
          </div>
          <h1>{slug} — virtual backgrounds</h1>
          <p className="bg-sub">
            Brand-coloured backgrounds for Zoom, Google Meet, Microsoft Teams,
            and OBS. Generated on the fly from your card&rsquo;s palette.
          </p>
        </div>
      </header>

      <section className="bg-controls">
        <label className="bg-field">
          Resolution
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as Size)}
            className="bg-input"
          >
            <option value="1080p">1080p (1920×1080)</option>
            <option value="720p">720p (1280×720)</option>
            <option value="4k">4K (3840×2160)</option>
          </select>
        </label>
        <label className="bg-field bg-check">
          <input
            type="checkbox"
            checked={showQr}
            onChange={(e) => setShowQr(e.target.checked)}
          />
          Include QR code
        </label>
        <button
          type="button"
          onClick={() => setCacheBust(Date.now())}
          className="bg-btn"
        >
          ↻ Refresh
        </button>
      </section>

      <section className="bg-grid">
        {VARIANTS.map((v) => (
          <article key={v.key} className="bg-tile">
            <img src={urlFor(v.key)} alt={`${v.label} background preview`} />
            <div className="bg-tile-meta">
              <h2>{v.label}</h2>
              <p>{v.desc}</p>
              <a href={urlFor(v.key)} download={`${slug}-${v.key}-${size}.png`} className="bg-btn-primary">
                Download
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-tips">
        <h2>Setting it up</h2>
        <p><strong>Zoom:</strong> Settings → Background & Effects → + → choose the downloaded PNG.</p>
        <p><strong>Microsoft Teams:</strong> More → Background effects → Add new → upload the PNG.</p>
        <p><strong>Google Meet:</strong> ⋮ → Apply visual effects → Background → upload custom.</p>
        <p><strong>OBS Studio:</strong> Add → Image source → point at the downloaded file.</p>
      </section>

      <style jsx>{`
        .bg-root {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .bg-head {
          margin-bottom: 2rem;
        }
        .bg-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .bg-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .bg-crumb a:hover {
          opacity: 1;
        }
        .bg-sub {
          opacity: 0.7;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          max-width: 40rem;
        }
        .bg-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: flex-end;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 0.75rem;
        }
        .bg-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          opacity: 0.85;
        }
        .bg-check {
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }
        .bg-input {
          padding: 0.5rem 0.7rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0.4rem;
          color: inherit;
          font-size: 0.9rem;
        }
        .bg-btn {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          opacity: 0.85;
        }
        .bg-btn:hover {
          opacity: 1;
        }
        .bg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .bg-tile {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bg-tile img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          display: block;
        }
        .bg-tile-meta {
          padding: 1rem 1.25rem;
        }
        .bg-tile-meta h2 {
          margin: 0 0 0.25rem;
          font-size: 1.05rem;
        }
        .bg-tile-meta p {
          margin: 0 0 0.85rem;
          opacity: 0.7;
          font-size: 0.85rem;
        }
        .bg-btn-primary {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #ff6fb5;
          color: white;
          border-radius: 999px;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .bg-tips {
          padding: 1.25rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.75rem;
          font-size: 0.9rem;
        }
        .bg-tips h2 {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
        }
        .bg-tips p {
          margin: 0.4rem 0;
          opacity: 0.85;
        }
      `}</style>
    </main>
  );
}
