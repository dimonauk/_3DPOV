"use client";

/**
 * app/cards/mine/[slug]/leads/leads/use-leads.ts — Owner-side state
 * machine for the leads list. Owns the leads array, expanded-row
 * set, in-flight enrichment set, transient flash banner, and the
 * enrich/clear/csv handlers. Bounces every call through the
 * Firebase ID token from useAuth.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

import type { Enrichment, Lead } from "./types";

export function useLeads(slug: string) {
  const auth = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Lead ids currently being enriched */
  const [enriching, setEnriching] = useState<Set<string>>(new Set());
  /** Lead ids currently expanded in the table */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  /** Brief flash message for errors / status */
  const [flash, setFlash] = useState<string | null>(null);

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

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

  const enrich = async (leadId: string, force = false) => {
    if (!auth.user) return;
    setEnriching((prev) => new Set(prev).add(leadId));
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch(`/api/cards/${slug}/leads/${leadId}/enrich`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        enrichment?: Enrichment;
        error?: string;
        message?: string;
      };
      if (!res.ok || !body.enrichment) {
        if (body.error === "enrichment_not_configured") {
          flashToast(
            "AI enrichment needs AI_GATEWAY_API_KEY in Vercel env vars.",
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
      const res = await fetch(`/api/cards/${slug}/leads/${leadId}/enrich`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  return {
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
  };
}
