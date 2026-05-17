/**
 * app/cards/mine/[slug]/leads/leads/types.ts — Wire shapes for the
 * owner-facing leads list + AI enrichment.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

export type Enrichment = {
  company?: string;
  industry?: string;
  likelyRole?: string;
  companyDescription?: string;
  companyWebsite?: string;
  talkingPoints?: string[];
  confidence: "high" | "medium" | "low";
  notes?: string;
};

export type Lead = {
  id: string;
  email?: string;
  name?: string;
  message?: string;
  src?: string;
  country?: string;
  at: number;
  enrichment?: Enrichment;
};
