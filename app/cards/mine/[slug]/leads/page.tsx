"use client";

/**
 * /cards/mine/[slug]/leads — owner-facing leads list.
 *
 * Fetches /api/cards/[slug]/leads/list with the user's Firebase ID
 * token. Renders the leads as a table with the most recent first.
 * One-click CSV export for follow-up in any CRM or spreadsheet.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-provider";

type Lead = {
  id: string;
  email?: string;
  name?: string;
  message?: string;
  src?: string;
  country?: string;
  at: number;
};

export default function CardLeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const auth = useAuth();
  const router = useRouter();
  // See cards/mine/[slug]/analytics/page.tsx for the React.use() rationale.
  const { slug } = use(params);

  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [truncated, setTruncated] = useState(false);
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
        const res = await fetch(`/api/cards/${slug}/leads/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 403) setError("This isn't your card.");
          else if (res.status === 404) setError("Card not found.");
          else setError("Couldn't load leads.");
          return;
        }
        const body = (await res.json()) as {
          leads: Lead[];
          truncated: boolean;
        };
        setLeads(body.leads);
        setTruncated(body.truncated);
      } catch {
        setError("Couldn't load leads.");
      }
    })();
  }, [auth.loading, auth.user, slug, router]);

  const exportCsv = async () => {
    if (!auth.user) return;
    const token = await auth.user.getIdToken();
    const res = await fetch(`/api/cards/${slug}/leads/list?format=csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holoflow-leads-${slug}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  };

  if (auth.loading || (!leads && !error)) {
    return <main className="lm-root">Loading…</main>;
  }
  if (error) {
    return (
      <main className="lm-root">
        <p>{error}</p>
        <Link href="/cards/mine">← Back to your cards</Link>
      </main>
    );
  }

  return (
    <main className="lm-root">
      <header className="lm-head">
        <div>
          <div className="lm-crumb">
            <Link href="/cards/mine">← Your cards</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/analytics`}>Analytics</Link>
          </div>
          <h1>{slug} — leads</h1>
          <p className="lm-sub">
            {leads!.length} lead{leads!.length === 1 ? "" : "s"} captured.
          </p>
        </div>
        <div className="lm-actions">
          {leads!.length > 0 && (
            <button onClick={exportCsv} className="lm-action">
              ⬇ Export CSV
            </button>
          )}
          <Link href={`/c/${slug}`} className="lm-action">
            View card →
          </Link>
        </div>
      </header>

      {leads!.length === 0 ? (
        <div className="lm-empty">
          <p>No leads yet.</p>
          <p className="lm-empty-tip">
            Anyone who fills out the “Leave your details” form on{" "}
            <Link href={`/c/${slug}`}>/c/{slug}</Link> shows up here. You'll
            also receive an email if RESEND_API_KEY is configured.
          </p>
        </div>
      ) : (
        <div className="lm-table-wrap">
          <table className="lm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Source</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {leads!.map((l) => (
                <tr key={l.id}>
                  <td>{l.at ? new Date(l.at).toLocaleString() : "—"}</td>
                  <td>{l.name ?? <span className="lm-faint">—</span>}</td>
                  <td>
                    {l.email ? (
                      <a href={`mailto:${l.email}`}>{l.email}</a>
                    ) : (
                      <span className="lm-faint">—</span>
                    )}
                  </td>
                  <td className="lm-message">
                    {l.message ?? <span className="lm-faint">—</span>}
                  </td>
                  <td>
                    {l.src ? (
                      <code>{l.src}</code>
                    ) : (
                      <span className="lm-faint">(direct)</span>
                    )}
                  </td>
                  <td>{l.country ?? <span className="lm-faint">?</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {truncated && (
        <p className="lm-warn">
          Showing the most recent 1000 leads. Export CSV to see everything.
        </p>
      )}

      <style jsx>{`
        .lm-root {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .lm-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .lm-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .lm-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .lm-crumb a:hover {
          opacity: 1;
        }
        .lm-sub {
          opacity: 0.65;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
        }
        .lm-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .lm-action {
          background: transparent;
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          text-decoration: none;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .lm-empty {
          padding: 3rem 2rem;
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
        }
        .lm-empty-tip {
          opacity: 0.65;
          max-width: 32rem;
          margin: 1rem auto 0;
          font-size: 0.9rem;
        }
        .lm-empty-tip a {
          color: inherit;
        }
        .lm-table-wrap {
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.75rem;
        }
        .lm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .lm-table th,
        .lm-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .lm-table th {
          background: rgba(255, 255, 255, 0.03);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
        }
        .lm-message {
          max-width: 30rem;
          white-space: pre-wrap;
        }
        .lm-faint {
          opacity: 0.4;
        }
        .lm-table code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .lm-warn {
          margin-top: 1rem;
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
