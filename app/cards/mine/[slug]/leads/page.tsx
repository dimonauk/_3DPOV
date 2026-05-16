"use client";

/**
 * /cards/mine/[slug]/leads — owner-facing leads list with AI enrichment.
 *
 * Fetches /api/cards/[slug]/leads/list with the user's Firebase ID
 * token. Renders the leads as a table with the most recent first.
 * One-click CSV export for follow-up in any CRM or spreadsheet.
 *
 * Per-row "Enrich" button uses Claude vision-API to infer company,
 * industry, likely role, and talking points from the lead's email +
 * name + message. Enrichment is persisted to the lead doc in
 * Firestore so subsequent visits don't re-hit the API.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-provider";

type Enrichment = {
  company?: string;
  industry?: string;
  likelyRole?: string;
  companyDescription?: string;
  companyWebsite?: string;
  talkingPoints?: string[];
  confidence: "high" | "medium" | "low";
  notes?: string;
};

type Lead = {
  id: string;
  email?: string;
  name?: string;
  message?: string;
  src?: string;
  country?: string;
  at: number;
  enrichment?: Enrichment;
};

export default function CardLeadsPage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Lead ids currently being enriched */
  const [enriching, setEnriching] = useState<Set<string>>(new Set());
  /** Lead ids currently expanded in the table */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  /** Brief flash message for errors / status */
  const [flash, setFlash] = useState<string | null>(null);

  const loadLeads = async () => {
    if (!auth.user) return;
    try {
      const token = await auth.user.getIdToken();
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
  };

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace("/signin");
      return;
    }
    void loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.user, slug, router]);

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const enrich = async (leadId: string, force = false) => {
    if (!auth.user) return;
    setEnriching((prev) => new Set(prev).add(leadId));
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch(
        `/api/cards/${slug}/leads/${leadId}/enrich`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ force }),
        },
      );
      const body = (await res.json()) as {
        ok?: boolean;
        enrichment?: Enrichment;
        error?: string;
        message?: string;
      };
      if (!res.ok || !body.enrichment) {
        if (body.error === "enrichment_not_configured") {
          flashToast(
            "AI enrichment needs ANTHROPIC_API_KEY in Vercel env vars.",
          );
        } else {
          flashToast(body.message ?? "Enrichment failed.");
        }
        return;
      }
      // Patch the lead in place.
      setLeads((prev) =>
        prev
          ? prev.map((l) =>
              l.id === leadId ? { ...l, enrichment: body.enrichment! } : l,
            )
          : prev,
      );
      // Auto-expand the just-enriched row.
      setExpanded((prev) => new Set(prev).add(leadId));
    } catch {
      flashToast("Network error.");
    } finally {
      setEnriching((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  const clearEnrichment = async (leadId: string) => {
    if (!auth.user) return;
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch(
        `/api/cards/${slug}/leads/${leadId}/enrich`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setLeads((prev) =>
          prev
            ? prev.map((l) =>
                l.id === leadId ? { ...l, enrichment: undefined } : l,
              )
            : prev,
        );
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
        flashToast("Enrichment cleared.");
      }
    } catch {
      flashToast("Network error.");
    }
  };

  const toggleExpand = (leadId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

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
            Click 🪄 to enrich any row with company / role context (uses
            Claude).
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
            Anyone who fills out the &ldquo;Leave your details&rdquo; form on{" "}
            <Link href={`/c/${slug}`}>/c/{slug}</Link> shows up here. You&rsquo;ll
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
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {leads!.map((l) => {
                const isEnriching = enriching.has(l.id);
                const isExpanded = expanded.has(l.id);
                const e = l.enrichment;
                return (
                  <React.Fragment key={l.id}>
                    <tr>
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
                      <td className="lm-ai">
                        {e ? (
                          <button
                            onClick={() => toggleExpand(l.id)}
                            className={`lm-badge lm-conf-${e.confidence}`}
                            title="Toggle enrichment details"
                          >
                            {e.company ?? "enriched"}{" "}
                            {isExpanded ? "▴" : "▾"}
                          </button>
                        ) : (
                          <button
                            onClick={() => enrich(l.id)}
                            disabled={isEnriching || !l.email}
                            className="lm-enrich"
                            title={
                              l.email
                                ? "Enrich this lead with AI"
                                : "Need an email to enrich"
                            }
                          >
                            {isEnriching ? "…" : "🪄 Enrich"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && e && (
                      <tr>
                        <td colSpan={7} className="lm-enrich-detail">
                          <div className="lm-enrich-grid">
                            {e.company && (
                              <div>
                                <strong>Company</strong>
                                <div>{e.company}</div>
                                {e.companyWebsite && (
                                  <a
                                    href={
                                      e.companyWebsite.startsWith("http")
                                        ? e.companyWebsite
                                        : `https://${e.companyWebsite}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lm-link"
                                  >
                                    {e.companyWebsite.replace(/^https?:\/\//, "")} ↗
                                  </a>
                                )}
                              </div>
                            )}
                            {e.industry && (
                              <div>
                                <strong>Industry</strong>
                                <div>{e.industry}</div>
                              </div>
                            )}
                            {e.likelyRole && (
                              <div>
                                <strong>Likely role</strong>
                                <div>{e.likelyRole}</div>
                              </div>
                            )}
                            {e.companyDescription && (
                              <div className="lm-enrich-wide">
                                <strong>About the company</strong>
                                <div>{e.companyDescription}</div>
                              </div>
                            )}
                            {e.talkingPoints && e.talkingPoints.length > 0 && (
                              <div className="lm-enrich-wide">
                                <strong>Talking points</strong>
                                <ul>
                                  {e.talkingPoints.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {e.notes && (
                              <div className="lm-enrich-wide lm-enrich-note">
                                <strong>⚠ Notes</strong>
                                <div>{e.notes}</div>
                              </div>
                            )}
                          </div>
                          <div className="lm-enrich-actions">
                            <button
                              onClick={() => enrich(l.id, true)}
                              disabled={isEnriching}
                              className="lm-mini-btn"
                            >
                              {isEnriching ? "Re-enriching…" : "🔁 Re-run"}
                            </button>
                            <button
                              onClick={() => clearEnrichment(l.id)}
                              className="lm-mini-btn lm-mini-danger"
                            >
                              Clear
                            </button>
                            <span className="lm-conf-label">
                              Confidence: <strong>{e.confidence}</strong>
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {truncated && (
        <p className="lm-warn">
          Showing the most recent 1000 leads. Export CSV to see everything.
        </p>
      )}

      {flash && <div className="lm-toast">{flash}</div>}

      <style jsx>{`
        .lm-root {
          max-width: 1400px;
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
          max-width: 38rem;
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
          vertical-align: top;
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
        .lm-ai {
          white-space: nowrap;
        }
        .lm-table code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .lm-enrich {
          background: rgba(255, 111, 181, 0.12);
          color: inherit;
          border: 1px solid rgba(255, 111, 181, 0.4);
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .lm-enrich:hover:not(:disabled) {
          background: rgba(255, 111, 181, 0.2);
        }
        .lm-enrich:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .lm-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: inherit;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.78rem;
          cursor: pointer;
          white-space: nowrap;
          max-width: 9rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lm-conf-high {
          border-color: rgba(0, 200, 130, 0.4);
        }
        .lm-conf-medium {
          border-color: rgba(255, 193, 7, 0.4);
        }
        .lm-conf-low {
          border-color: rgba(255, 82, 82, 0.35);
        }
        .lm-enrich-detail {
          background: rgba(255, 111, 181, 0.04);
        }
        .lm-enrich-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem 1.5rem;
          padding: 0.5rem 0 1rem;
        }
        .lm-enrich-grid strong {
          display: block;
          font-size: 0.7rem;
          opacity: 0.55;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .lm-enrich-grid > div {
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .lm-enrich-wide {
          grid-column: 1 / -1;
        }
        .lm-enrich-note {
          color: #ffcc66;
        }
        .lm-enrich-grid ul {
          margin: 0;
          padding-left: 1.25rem;
        }
        .lm-enrich-grid li {
          margin-bottom: 0.35rem;
        }
        .lm-link {
          font-size: 0.82rem;
          opacity: 0.75;
          color: inherit;
        }
        .lm-link:hover {
          opacity: 1;
        }
        .lm-enrich-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .lm-mini-btn {
          background: transparent;
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          font-size: 0.78rem;
          cursor: pointer;
        }
        .lm-mini-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .lm-mini-danger {
          border-color: rgba(255, 82, 82, 0.3);
          color: #ff8585;
        }
        .lm-conf-label {
          margin-left: auto;
          opacity: 0.65;
          font-size: 0.78rem;
        }
        .lm-warn {
          margin-top: 1rem;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
        }
        .lm-toast {
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
