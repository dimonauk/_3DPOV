import "server-only";

/**
 * AI Universal Scanner — extract structured business-card fields
 * from a photo of a paper card, conference badge, LinkedIn QR
 * profile screenshot, or any other contact-bearing surface.
 *
 * Backed by Claude's vision capability via the Anthropic SDK.
 * Sends the image base64 + a structured-output prompt; receives
 * a JSON document matching the ExtractedCardFields shape below.
 *
 * Activates only when ANTHROPIC_API_KEY is set. Without the key
 * the API route returns 503 with a friendly message; the client
 * surfaces a "scanner unavailable" state, never silent failure.
 *
 * Privacy:
 *   - The image is sent ONCE to Anthropic for extraction and
 *     not persisted anywhere on our side. No image bytes hit
 *     Firestore or Vercel Blob.
 *   - Anthropic's data-usage policy (as of May 2026) is that
 *     consumer-API requests are NOT used for model training
 *     when you're on a paid plan; we surface a small note in
 *     the scanner UI to make this explicit to the user.
 *
 * Failure modes:
 *   - No key set            → 503 from API route, scanner UI shows fallback
 *   - Image too big         → reject client-side, max ~5 MB
 *   - Image is not a card   → model returns empty fields,
 *                             UI shows "couldn't read any fields,
 *                             type them manually"
 *   - Model API errors      → 502 with the underlying message
 */

import Anthropic from "@anthropic-ai/sdk";

export type ExtractedCardFields = {
  name?: string;
  role?: string;
  studio?: string; // company / organisation
  tagline?: string;
  email?: string;
  phone?: string;
  website?: string;
  /** Social handles found on the card; platform is e.g. "linkedin", "instagram", "x", "github". */
  handles?: Array<{ platform: string; handle: string; url?: string }>;
  /**
   * Confidence note from the model — surface to the user
   * so they know whether to double-check what was extracted.
   * One of: "high", "medium", "low".
   */
  confidence?: "high" | "medium" | "low";
  /** Anything the model wants to flag (e.g. "couldn't read phone clearly"). */
  notes?: string;
};

export function isScannerConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You extract contact information from images of business cards, conference badges, LinkedIn QR-share screenshots, and similar contact-bearing surfaces.

Return ONLY a JSON object matching this TypeScript type:

{
  name?: string;
  role?: string;
  studio?: string;          // company / organisation / studio
  tagline?: string;         // short personal motto if shown
  email?: string;
  phone?: string;           // include + and country code if visible
  website?: string;
  handles?: Array<{ platform: string; handle: string; url?: string }>;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

Guidance:
- Omit fields you cannot read. Do not invent.
- For handles, platform should be lowercase (linkedin, instagram, x, github, tiktok, youtube, threads, mastodon, etc.).
- For LinkedIn URLs, the handle is the last path segment (e.g. "in/dimona-dougherty" → "dimona-dougherty").
- "confidence" reflects how legible the card was overall.
- "notes" is optional — use it to flag specific ambiguities ("phone number partially obscured").
- DO NOT include any text outside the JSON object. No prose, no markdown fences, no commentary.`;

/**
 * Scan a card image. Throws on configuration / API error;
 * returns parsed extracted fields on success.
 */
export async function scanCardImage(
  imageBase64: string,
  mediaType:
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/gif" = "image/jpeg",
): Promise<ExtractedCardFields> {
  if (!isScannerConfigured()) {
    throw new Error("scanner_not_configured");
  }
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // claude-sonnet-4-5 (current best vision model as of May 2026).
  // If you upgrade later, only the model string changes here.
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extract the contact details from this image. Return ONLY the JSON object — no other text.",
          },
        ],
      },
    ],
  });

  // The model returns a single text block. Strip any accidental
  // markdown fencing and parse.
  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    throw new Error("no_text_response");
  }
  let text = textBlock.text.trim();
  // Strip ```json ... ``` fences if the model added them despite instructions.
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let parsed: ExtractedCardFields;
  try {
    parsed = JSON.parse(text) as ExtractedCardFields;
  } catch {
    throw new Error("invalid_json_response: " + text.slice(0, 200));
  }

  // Light validation — clamp to known shape, drop unexpected keys.
  const clean: ExtractedCardFields = {};
  if (typeof parsed.name === "string") clean.name = parsed.name.trim();
  if (typeof parsed.role === "string") clean.role = parsed.role.trim();
  if (typeof parsed.studio === "string") clean.studio = parsed.studio.trim();
  if (typeof parsed.tagline === "string") clean.tagline = parsed.tagline.trim();
  if (typeof parsed.email === "string") clean.email = parsed.email.trim().toLowerCase();
  if (typeof parsed.phone === "string") clean.phone = parsed.phone.trim();
  if (typeof parsed.website === "string") clean.website = parsed.website.trim();
  if (Array.isArray(parsed.handles)) {
    clean.handles = parsed.handles
      .filter(
        (h): h is { platform: string; handle: string; url?: string } =>
          typeof h?.platform === "string" && typeof h?.handle === "string",
      )
      .map((h) => ({
        platform: h.platform.toLowerCase().trim(),
        handle: h.handle.trim(),
        url: typeof h.url === "string" ? h.url.trim() : undefined,
      }));
  }
  if (
    parsed.confidence === "high" ||
    parsed.confidence === "medium" ||
    parsed.confidence === "low"
  ) {
    clean.confidence = parsed.confidence;
  }
  if (typeof parsed.notes === "string" && parsed.notes.trim()) {
    clean.notes = parsed.notes.trim();
  }

  return clean;
}
