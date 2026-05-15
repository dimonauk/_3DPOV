"use client";

/**
 * /cards/mine/[slug]/analytics — owner-facing analytics dashboard.
 *
 * Client-rendered because auth in this app is client-side (Firebase
 * JS SDK with ID tokens). Fetches /api/cards/[slug]/analytics with
 * the user's ID token in Authorization: Bearer.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-provider";

type StatsResponse = {
  stats: {
    total: number;
    truncated: boolean;
    unique: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    byCountry: Record<string, number>;
    byDay: Record<string, number>;
    recent: Array<{ id: string; type: string; src?: string; at: number }>;
  };
  cardName: string;
};

const TYPE_LABELS: Record<string, string> = {
  view: "Card views",
  ar_launch: "AR launches",
  hand_lock: "Hand-lock activations",
  webxr: "WebXR sessions",
  vcard_download: "vCard downloads",
  recording: "AR recordings",
  lead_capture: "Leads captured",
};
const TYPE_ICONS: Record<string, string> = {
  view: "👁",
  ar_launch: "📷",
  hand_lock: "✋",
  webxr: "📍",
  vcard_download: "📇",
  recording: "🎥",
  lead_capture: "📬",
};

export default function CardAnalyticsPage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace("/signin");
      return;
    }
    (async () => {
      try {
        const token = await auth.user!.getIdToken();
        const res = await fetch(`/api/cards/${slug}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 403) setError("This isn't your card.");
          else if (res.status === 404) setError("Card not found.");
          else setError("Couldn't load analytics.");
          return;
        }
        setData((await res.json()) as StatsResponse);
      } catch {
        setError("Couldn't load analytics.");
      }
    })();
  }, [auth.loading, auth.user, slug, router]);

  if (auth.loading || (!data && !error)) {
    return <main className="cm-root">Loading…</main>;
  }
  if (error) {
    return (
      <main className="cm-root">
        <p>{error}</p>
        <Link href="/cards/mine">← Back to your cards</Link>
      </main>
    );
  }
  const stats = data!.stats;

  const days = Object.entries(stats.byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30);
  const maxDay = Math.max(1, ...days.map(([, v]) => v));
  const sources = Object.entries(stats.bySource).sort(([, a], [, b]) => b - a);
  const countries = Object.entries(stats.byCountry).sort(
    ([, a], [, b]) => b - a,
  );
  const types = Object.entries(stats.byType).sort(([, a], [, b]) => b - a);

  return (
    <main className="cm-root">
      <header className="cm-head">
        <div>
          <div className="cm-crumb">
            <Link href="/cards/mine">← Your cards</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/leads`}>Leads</Link>
          </div>
          <h1>{data!.cardName} — analytics</h1>
          <p className="cm-sub">
            Last 5000 events. Anonymous — IPs are hashed before storage.
          </p>
        </div>
        <Link href={`/c/${slug}`} className="cm-action">
          View card →
        </Link>
      </header>

      <section className="cm-tiles">
        <div className="cm-tile">
          <div className="cm-tile-big">{stats.total}</div>
          <div className="cm-tile-label">total events</div>
        </div>
        <div className="cm-tile">
          <div className="cm-tile-big">{stats.unique}</div>
          <div className="cm-tile-label">unique scanners</div>
        </div>
        <div className="cm-tile">
          <div className="cm-tile-big">{stats.byType.view ?? 0}</div>
          <div className="cm-tile-label">card views</div>
        </div>
        <div className="cm-tile">
          <div className="cm-tile-big">{stats.byType.ar_launch ?? 0}</div>
          <div className="cm-tile-label">AR launches</div>
        </div>
      </section>

      {types.length > 0 && (
        <section className="cm-section">
          <h2>Activity breakdown</h2>
          <ul className="cm-list">
            {types.map(([type, count]) => (
              <li key={type}>
                <span className="cm-list-icon">{TYPE_ICONS[type] ?? "•"}</span>
                <span className="cm-list-label">
                  {TYPE_LABELS[type] ?? type}
                </span>
                <span className="cm-list-bar-wrap">
                  <span
                    className="cm-list-bar"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </span>
                <span className="cm-list-count">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {days.length > 0 && (
        <section className="cm-section">
          <h2>Last 30 days</h2>
          <div className="cm-bars">
            {days.map(([day, count]) => (
              <div key={day} className="cm-bar">
                <div
                  className="cm-bar-fill"
                  style={{ height: `${(count / maxDay) * 100}%` }}
                  title={`${day}: ${count}`}
                />
                <div className="cm-bar-label">{day.slice(5)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className="cm-section">
          <h2>Sources (UTM)</h2>
          <ul className="cm-list">
            {sources.map(([src, count]) => (
              <li key={src}>
                <span className="cm-list-icon">🏷</span>
                <span className="cm-list-label">{src}</span>
                <span className="cm-list-bar-wrap">
                  <span
                    className="cm-list-bar"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </span>
                <span className="cm-list-count">{count}</span>
              </li>
            ))}
          </ul>
          <p className="cm-tip">
            Print different QRs per batch with{" "}
            <code>?src=batch-1</code> in the URL to compare runs.
          </p>
        </section>
      )}

      {countries.length > 0 && (
        <section className="cm-section">
          <h2>Countries</h2>
          <ul className="cm-list">
            {countries.map(([c, count]) => (
              <li key={c}>
                <span className="cm-list-icon">🌍</span>
                <span className="cm-list-label">{c}</span>
                <span className="cm-list-bar-wrap">
                  <span
                    className="cm-list-bar"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </span>
                <span className="cm-list-count">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.truncated && (
        <p className="cm-warn">
          Showing the most recent 5000 events. This card has more.
        </p>
      )}

      <style jsx>{`
        .cm-root {
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .cm-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .cm-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .cm-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .cm-crumb a:hover {
          opacity: 1;
        }
        .cm-sub {
          opacity: 0.65;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }
        .cm-action {
          color: inherit;
          text-decoration: none;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 0.9rem;
        }
        .cm-tiles {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .cm-tile {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1rem;
        }
        .cm-tile-big {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1;
        }
        .cm-tile-label {
          font-size: 0.85rem;
          opacity: 0.6;
          margin-top: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cm-section {
          margin-bottom: 2.5rem;
        }
        .cm-section h2 {
          font-size: 1.1rem;
          margin: 0 0 1rem;
          opacity: 0.9;
        }
        .cm-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .cm-list li {
          display: grid;
          grid-template-columns: 28px minmax(120px, 220px) 1fr 60px;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
        }
        .cm-list-icon {
          text-align: center;
        }
        .cm-list-bar-wrap {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          height: 6px;
          overflow: hidden;
          position: relative;
        }
        .cm-list-bar {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #ff6fb5, #b488e0);
        }
        .cm-list-count {
          text-align: right;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .cm-bars {
          display: flex;
          gap: 0.25rem;
          align-items: flex-end;
          height: 140px;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .cm-bar {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
        }
        .cm-bar-fill {
          width: 100%;
          background: linear-gradient(0deg, #ff6fb5, #b488e0);
          border-radius: 3px 3px 0 0;
          min-height: 2px;
        }
        .cm-bar-label {
          font-size: 0.6rem;
          opacity: 0.6;
          margin-top: 0.25rem;
          transform: rotate(-45deg);
          transform-origin: top right;
          white-space: nowrap;
        }
        .cm-tip {
          margin-top: 0.75rem;
          font-size: 0.8rem;
          opacity: 0.65;
        }
        .cm-tip code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }
        .cm-warn {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
        }
      `}</style>
    </main>
  );
}
