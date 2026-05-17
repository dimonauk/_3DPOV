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
 *
 * Orchestrator only. State + IO in leads/use-leads.ts; per-row
 * presentation in lead-row.tsx; styles in styles.ts; types in
 * types.ts. Per ARCHITECTURE.md Rule 1.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { use } from "react";

import { LeadRow } from "./leads/lead-row";
import { LEADS_STYLES } from "./leads/styles";
import { useLeads } from "./leads/use-leads";

export default function CardLeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // See cards/mine/[slug]/analytics/page.tsx for the React.use() rationale.
  const { slug } = use(params);

  const {
    auth,
    leads,
    truncated,
    error,
    enriching,
    expanded,
    flash,
    enrich,
    clearEnrichment,
    toggleExpand,
    exportCsv,
  } = useLeads(slug);

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
            <Link href={`/c/${slug}`}>/c/{slug}</Link> shows up here.
            You&rsquo;ll also receive an email if RESEND_API_KEY is configured.
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
              {leads!.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isEnriching={enriching.has(lead.id)}
                  isExpanded={expanded.has(lead.id)}
                  onEnrich={enrich}
                  onClearEnrichment={clearEnrichment}
                  onToggleExpand={toggleExpand}
                />
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

      {flash && <div className="lm-toast">{flash}</div>}

      {/* Global because styled-jsx's babel plugin needs static CSS in
          source to compute a scoped class hash; the lm-* class prefix
          is unique to this route so global injection won't collide. */}
      <style jsx global>{`${LEADS_STYLES}`}</style>
    </main>
  );
}
