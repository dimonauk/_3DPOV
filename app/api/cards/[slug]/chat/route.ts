import { NextResponse, type NextRequest } from "next/server";
import { getCard } from "lib/ar/cards";
import {
  streamAuraReply,
  isAuraConfigured,
  type ChatMessage,
} from "lib/cards/aura-server";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * POST /api/cards/[slug]/chat — stream a chat reply from the card's
 * Aura companion.
 *
 * Body:
 *   { messages: [{ role: "user" | "assistant", content: string }] }
 *
 * Response:
 *   - 200 text/event-stream — Server-Sent Events with token-by-token
 *     delta. Use the AI SDK's `useChat` hook or read the stream
 *     manually.
 *   - 404 → unknown card
 *   - 422 → card has no vrmPersona (chat not enabled)
 *   - 503 → AI_GATEWAY_API_KEY not configured
 *   - 500 → uncaught error (X-Request-Id in body)
 *
 * No auth required — the chat is a public face of the card, like the
 * QR code or wallet pass. Costs are bounded by:
 *   - 50-message history cap
 *   - 2000-char-per-message cap
 *   - 400-token output cap per turn
 *
 * At gemini-3.1-flash-lite pricing that's ~$0.001/turn worst case.
 */

type Params = { params: Promise<{ slug: string }> };

export const POST = withRouteLogging<Params>(
  "cards.chat",
  async (req: NextRequest, { params }, log) => {
    const { slug } = await params;

    if (!isAuraConfigured()) {
      log.warn("aura:not_configured");
      return NextResponse.json(
        {
          error: "aura_not_configured",
          message:
            "Chat needs AI_GATEWAY_API_KEY in Vercel env vars. Set it and the feature activates.",
        },
        { status: 503 },
      );
    }

    let card;
    try {
      card = await getCard(slug);
    } catch (err) {
      log.error("getCard:threw", { slug, err: errToObject(err) });
      return NextResponse.json(
        { error: "card_lookup_failed", message: (err as Error).message },
        { status: 500 },
      );
    }
    if (!card) {
      log.info("card:not_found", { slug });
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (!card.ar?.vrmPersona) {
      log.info("aura:persona_missing", { slug });
      return NextResponse.json(
        {
          error: "no_persona",
          message: "This card has no Aura persona configured.",
        },
        { status: 422 },
      );
    }

    let body: { messages?: ChatMessage[] };
    try {
      body = await req.json();
    } catch (err) {
      log.warn("body:invalid", { err: errToObject(err) });
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      log.info("body:empty_messages");
      return NextResponse.json(
        { error: "empty_messages" },
        { status: 400 },
      );
    }

    log.info("chat:start", {
      slug,
      turns: messages.length,
      lastUser: messages
        .filter((m) => m.role === "user")
        .at(-1)
        ?.content.slice(0, 80),
    });

    try {
      const result = streamAuraReply({ card, messages });
      // Return the AI SDK's text stream as a text/event-stream Response.
      // toTextStreamResponse() handles SSE framing for us.
      return result.toTextStreamResponse();
    } catch (err) {
      log.error("chat:failed", { slug, err: errToObject(err) });
      return NextResponse.json(
        { error: "chat_failed", message: (err as Error).message },
        { status: 502 },
      );
    }
  },
);
