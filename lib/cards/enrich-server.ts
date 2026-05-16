import "server-only";

/**
 * AI Contact Enrichment — given an email + name, infer company,
 * likely role, industry, and talking points using Claude's
 * general-knowledge reasoning.
 *
 * Unlike commercial enrichment services (Clearbit / Apollo / People
 * Data Labs) we don't query an enrichment DB — we lean entirely on
 * Claude's training data + reasoning. Pros:
 *   • No extra vendor or API key
 *   • No per-lead cost beyond Claude usage
 *   • Works for any email domain instantly
 * Cons:
 *   • No real-time signals (job changes, funding events, etc.)
 *   • Can hallucinate — we capture confidence + label uncertain
 *     enrichments so the user knows whether to trust them
 *
 * Activates only when ANTHROPIC_API_KEY is set (same env var that
 * powers the AI Universal Scanner). Without it the endpoint returns
 * 503 and the dashboard hides the Enrich button.
 *
 * Privacy:
 *   - The enrichment prompt sends only what we already have on the
 *     lead (name + email + optional message). Nothing else.
 *   - Result is stored on the lead doc in Firestore for re-display
 *     without re-querying Claude.
 *   - Owner can clear enrichment via UI to remove from Firestore.
 */

import Anthropic from "@anthropic-ai/sdk";

export type EnrichmentResult = {
  /** Inferred company name based on email domain or context. */
  company?: string;
  /** Inferred industry (e.g. "FinTech", "Healthcare", "Creative Agency"). */
  industry?: string;
  /** Likely seniority + role function (e.g. "Senior Software Engineer"). */
  likelyRole?: string;
  /** One-sentence description of the company, if recognised. */
  companyDescription?: string;
  /** Best-guess company website. */
  companyWebsite?: string;
  /** Suggested talking points for the follow-up message. */
  talkingPoints?: string[];
  /** Confidence in the overall enrichment. */
  confidence: "high" | "medium" | "low";
  /** Any caveats the model wants to flag. */
  notes?: string;
}

export function isEnrichmentConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You enrich business-card leads by inferring company / role / industry from a name + email + optional message.

Return ONLY a JSON object matching this TypeScript type:

{
  company?: string;
  industry?: string;
  likelyRole?: string;
  companyDescription?: string;
  companyWebsite?: string;
  talkingPoints?: string[];
  confidence: "high" | "medium" | "low";
  notes?: string;
}

Guidance:
- Use the email domain as the primary signal for company identification.
- For well-known companies (large brands, recognisable startups), populate company / industry / description with high confidence.
- For obscure domains, set confidence "low" and skip company description rather than guess.
- For generic email providers (gmail, outlook, yahoo, hotmail, icloud, proton): set company = undefined, confidence = "low".
- "likelyRole" should pull from the message context (if any) OR from the name (e.g., "Dr. X" suggests medical/academic) OR be omitted.
- "talkingPoints" should be 2-3 short conversation hooks based on the company / industry / context. Skip when confidence is low.
- "notes" is optional — use to flag specific ambiguities or possible mistakes.
- DO NOT invent contact details, URLs, or facts you don't have evidence for.
- DO NOT include any text outside the JSON object. No prose, no markdown fences.`;

export async function enrichLead({
  name,
  email,
  message,
}: {
  name?: string;
  email: string;
  message?: string;
}): Promise<EnrichmentResult> {
  if (!isEnrichmentConfigured()) {
    throw new Error("enrichment_not_configured");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt = [
    name ? `Name: ${name}` : null,
    `Email: ${email}`,
    message ? `Message they sent: "${message}"` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Enrich this lead. Return ONLY the JSON object — no other text.\n\n${userPrompt}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    throw new Error("no_text_response");
  }
  let text = textBlock.text.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let parsed: EnrichmentResult;
  try {
    parsed = JSON.parse(text) as EnrichmentResult;
  } catch {
    throw new Error("invalid_json_response: " + text.slice(0, 200));
  }

  // Validate + sanitise.
  const clean: EnrichmentResult = {
    confidence:
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : "low",
  };
  if (typeof parsed.company === "string" && parsed.company.trim()) {
    clean.company = parsed.company.trim();
  }
  if (typeof parsed.industry === "string" && parsed.industry.trim()) {
    clean.industry = parsed.industry.trim();
  }
  if (typeof parsed.likelyRole === "string" && parsed.likelyRole.trim()) {
    clean.likelyRole = parsed.likelyRole.trim();
  }
  if (
    typeof parsed.companyDescription === "string" &&
    parsed.companyDescription.trim()
  ) {
    clean.companyDescription = parsed.companyDescription.trim();
  }
  if (
    typeof parsed.companyWebsite === "string" &&
    parsed.companyWebsite.trim()
  ) {
    clean.companyWebsite = parsed.companyWebsite.trim();
  }
  if (Array.isArray(parsed.talkingPoints)) {
    clean.talkingPoints = parsed.talkingPoints
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .slice(0, 5);
  }
  if (typeof parsed.notes === "string" && parsed.notes.trim()) {
    clean.notes = parsed.notes.trim();
  }

  return clean;
}
