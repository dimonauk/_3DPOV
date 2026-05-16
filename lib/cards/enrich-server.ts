import "server-only";

/**
 * AI Contact Enrichment — given an email + name + optional message,
 * infer company, industry, likely role, and talking points using
 * Vercel AI Gateway.
 *
 * One env var (`AI_GATEWAY_API_KEY`) replaces per-provider keys.
 * `generateObject` from the AI SDK enforces the Zod schema so we
 * never hand-parse JSON.
 *
 * Unlike commercial enrichment services (Clearbit / Apollo / PDL)
 * we lean on the LLM's general-knowledge reasoning. Pros: no extra
 * vendor, no per-lead cost beyond LLM usage, works on any domain.
 * Cons: no real-time signals (job changes, funding) — we capture
 * confidence + notes so users know when to double-check.
 *
 * Model selection:
 *   AI_GATEWAY_MODEL_TEXT  e.g. "google/gemini-3.1-flash-lite" (default)
 *
 * Privacy:
 *   - The enrichment prompt sends only the lead's name + email +
 *     optional message. Nothing else from our DB.
 *   - Result is persisted on the lead doc so we don't re-query the
 *     model on every dashboard load.
 *   - Owner can clear enrichment from the dashboard.
 */

import { generateObject } from "ai";
import { z } from "zod";

export const EnrichmentResultSchema = z.object({
  company: z
    .string()
    .optional()
    .describe("Inferred company name from email domain or context"),
  industry: z
    .string()
    .optional()
    .describe(
      "Inferred industry (e.g. 'FinTech', 'Healthcare', 'Creative Agency')",
    ),
  likelyRole: z
    .string()
    .optional()
    .describe(
      "Likely seniority + role function (e.g. 'Senior Software Engineer')",
    ),
  companyDescription: z
    .string()
    .optional()
    .describe("One-sentence description of the company if recognised"),
  companyWebsite: z
    .string()
    .optional()
    .describe("Best-guess company website URL"),
  talkingPoints: z
    .array(z.string())
    .max(5)
    .optional()
    .describe("2-3 short conversation hooks for the follow-up"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence in the overall enrichment"),
  notes: z
    .string()
    .optional()
    .describe("Caveats the model wants to flag"),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;

export function isEnrichmentConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

const TEXT_MODEL =
  process.env.AI_GATEWAY_MODEL_TEXT ?? "google/gemini-3.1-flash-lite";

const SYSTEM_PROMPT = `You enrich business-card leads by inferring company / role / industry from a name + email + optional message.

Guidance:
- Use the email domain as the PRIMARY signal for company identification.
- For well-known companies (large brands, recognisable startups), populate company / industry / description with high confidence.
- For obscure domains, set confidence "low" and SKIP company description rather than guess.
- For generic email providers (gmail, outlook, yahoo, hotmail, icloud, proton): set company = undefined, confidence = "low".
- "likelyRole" should pull from the message context (if any) OR from the name (e.g. "Dr. X" → medical/academic) OR be omitted.
- "talkingPoints" should be 2-3 short conversation hooks. SKIP when confidence is low.
- "notes" is optional — use to flag specific ambiguities.
- DO NOT invent contact details, URLs, or facts you don't have evidence for.`;

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

  const userPrompt = [
    name ? `Name: ${name}` : null,
    `Email: ${email}`,
    message ? `Message they sent: "${message}"` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { object } = await generateObject({
    model: TEXT_MODEL,
    schema: EnrichmentResultSchema,
    system: SYSTEM_PROMPT,
    prompt: `Enrich this lead:\n\n${userPrompt}`,
  });

  return object;
}
