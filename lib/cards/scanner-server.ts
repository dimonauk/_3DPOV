import "server-only";

/**
 * AI Universal Scanner — extract contact fields from a photo of a
 * paper business card using the Vercel AI SDK + AI Gateway.
 *
 * The AI Gateway routes our `model` string ("openai/gpt-5.5" by
 * default) to whichever underlying provider is configured upstream.
 * One credential (`AI_GATEWAY_API_KEY`) replaces per-provider keys,
 * adds failover, caching, observability, and lets us swap models
 * without code changes.
 *
 * `generateObject` enforces the Zod schema server-side so we never
 * have to hand-parse JSON or strip markdown fences from a free-form
 * text response. If the model returns invalid shape, the AI SDK
 * throws — caught by the route's withRouteLogging wrapper.
 *
 * Model selection:
 *   AI_GATEWAY_MODEL_VISION  e.g. "openai/gpt-5.5" (default)
 *   AI_GATEWAY_MODEL_TEXT    used by enrichment (not here)
 *
 * Models can be swapped via env without redeploy code — useful for
 * cost-tuning or A/B between providers.
 *
 * Vision: the image is passed as a base64-encoded part inside a
 * multimodal user message. The AI Gateway adapts the format for the
 * chosen upstream provider.
 *
 * Privacy: image bytes are forwarded to the AI Gateway, which
 * forwards to the model provider. We do NOT persist the image
 * server-side. The extracted fields go straight back to the
 * authenticated user.
 */

import { generateObject } from "ai";
import { z } from "zod";

export const ExtractedCardFieldsSchema = z.object({
  name: z.string().optional().describe("Person's full name as printed on the card"),
  role: z.string().optional().describe("Job title or role"),
  studio: z
    .string()
    .optional()
    .describe("Company / studio / organisation name"),
  tagline: z
    .string()
    .optional()
    .describe("Short tagline or descriptor if present"),
  email: z.string().optional().describe("Primary email address"),
  phone: z.string().optional().describe("Primary phone number"),
  website: z.string().optional().describe("Primary website URL"),
  handles: z
    .array(
      z.object({
        platform: z
          .enum([
            "linkedin",
            "instagram",
            "twitter",
            "x",
            "github",
            "tiktok",
            "youtube",
            "facebook",
            "behance",
            "dribbble",
            "other",
          ])
          .describe("Social platform — use 'other' for unknowns"),
        handle: z.string().describe("@-handle or URL slug"),
        url: z.string().optional().describe("Full URL if printed on card"),
      }),
    )
    .optional()
    .describe("Social profiles printed on the card"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Overall confidence in extraction"),
  notes: z
    .string()
    .optional()
    .describe("Caveats: unclear fields, ambiguous text, etc."),
});

export type ExtractedCardFields = z.infer<typeof ExtractedCardFieldsSchema>;

export function isScannerConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

const VISION_MODEL =
  process.env.AI_GATEWAY_MODEL_VISION ?? "openai/gpt-5.5";

const SYSTEM_PROMPT = `You extract structured contact data from a photograph of a business card.

Rules:
- ONLY extract data that is visibly printed on the card. Do not invent or infer fields that aren't there.
- "handles" should contain any social profile printed on the card. Use platform="other" for unknown platforms.
- "confidence" reflects overall extraction quality:
    "high"   — every visible field extracted cleanly, no ambiguity
    "medium" — some fields readable but minor ambiguity (e.g. partial obscured text)
    "low"    — image is blurry, low contrast, or many fields are uncertain
- "notes" is OPTIONAL — only fill if you need to flag something the user should double-check.
- Return null/omit for any field you can't confidently extract — do NOT guess.`;

type ImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

/**
 * Scan a business card image. `imageBase64` is the raw base64 string
 * (without the `data:image/...;base64,` prefix — the caller strips it).
 */
export async function scanCardImage(
  imageBase64: string,
  mediaType: ImageMediaType = "image/jpeg",
): Promise<ExtractedCardFields> {
  if (!isScannerConfigured()) {
    throw new Error("scanner_not_configured");
  }

  // Build a multimodal user message: text instruction + image.
  // AI SDK v6 uses { type: 'image', image: ... } content parts.
  // The image can be a Uint8Array, Buffer, URL, or base64 data URL.
  const dataUrl = `data:${mediaType};base64,${imageBase64}`;

  const { object } = await generateObject({
    model: VISION_MODEL,
    schema: ExtractedCardFieldsSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract contact data from this business card. Return only fields you can confidently read.",
          },
          {
            type: "image",
            image: dataUrl,
          },
        ],
      },
    ],
  });

  return object;
}
