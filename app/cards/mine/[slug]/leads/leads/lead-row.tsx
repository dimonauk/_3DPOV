"use client";

/**
 * app/cards/mine/[slug]/leads/leads/lead-row.tsx — Single table
 * row for a lead, plus the expanded enrichment detail row that
 * sits beneath it.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import React from "react";

import type { Lead } from "./types";

export function LeadRow({
  lead,
  isEnriching,
  isExpanded,
  onEnrich,
  onClearEnrichment,
  onToggleExpand,
}: {
  lead: Lead;
  isEnriching: boolean;
  isExpanded: boolean;
  onEnrich: (leadId: string, force?: boolean) => void;
  onClearEnrichment: (leadId: string) => void;
  onToggleExpand: (leadId: string) => void;
}) {
  const e = lead.enrichment;
  return (
    <React.Fragment>
      <tr>
        <td>{lead.at ? new Date(lead.at).toLocaleString() : "—"}</td>
        <td>{lead.name ?? <span className="lm-faint">—</span>}</td>
        <td>
          {lead.email ? (
            <a href={`mailto:${lead.email}`}>{lead.email}</a>
          ) : (
            <span className="lm-faint">—</span>
          )}
        </td>
        <td className="lm-message">
          {lead.message ?? <span className="lm-faint">—</span>}
        </td>
        <td>
          {lead.src ? (
            <code>{lead.src}</code>
          ) : (
            <span className="lm-faint">(direct)</span>
          )}
        </td>
        <td>{lead.country ?? <span className="lm-faint">?</span>}</td>
        <td className="lm-ai">
          {e ? (
            <button
              onClick={() => onToggleExpand(lead.id)}
              className={`lm-badge lm-conf-${e.confidence}`}
              title="Toggle enrichment details"
            >
              {e.company ?? "enriched"} {isExpanded ? "▴" : "▾"}
            </button>
          ) : (
            <button
              onClick={() => onEnrich(lead.id)}
              disabled={isEnriching || !lead.email}
              className="lm-enrich"
              title={
                lead.email
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
                onClick={() => onEnrich(lead.id, true)}
                disabled={isEnriching}
                className="lm-mini-btn"
              >
                {isEnriching ? "Re-enriching…" : "🔁 Re-run"}
              </button>
              <button
                onClick={() => onClearEnrichment(lead.id)}
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
}
