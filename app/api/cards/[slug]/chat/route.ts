import { NextResponse, type NextRequest } from "next/server";
import { getCard } from "lib/ar/cards";
import {
  streamAuraReplyWithTools,
  isAuraConfigured,
  type ChatMessage,
} from "lib/cards/aura-server";
import { getCardAuraTools } from "lib/cards/aura-card-tools";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * POST /api/cards/[slug]/chat — stream a chat reply from the card's
 * Aura companion, with tool use.
 *
 * Body:
 *   { messages: [{ role: "user" | "assistant", content: string }] }
 *
 * Response:
 *   - 200 text/event-stream — AI SDK v6 UI message stream protocol
 *     with text + tool calls + tool results interleaved
 *   - 404 → unknown card
 *   - 422 → card has no vrmPersona (chat not enabled)
 *   - 503 → AI_GATEWAY_API_KEY not configured
 *
 * Tools are card-scoped: leads go to THIS card's collection, booking
 * uses THIS card's calendar.url, find_related_cards excludes this
 * slug. See lib/cards/aura-card-tools.ts.
 */

export const maxDuration = 60;

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
          message: "Chat needs AI_GATEWAY_API_KEY in Vercel env vars.",
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
      return NextResponse.json({ error: "empty_messages" }, { status: 400 });
    }

    // Request-scoped context for lead attribution.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined;
    const ua = req.headers.get("user-agent") ?? undefined;
    const country = req.headers.get("x-vercel-ip-country") ?? undefined;

    const tools = getCardAuraTools({
      card,
      ...(ip ? { ip } : {}),
      ...(ua ? { ua } : {}),
      ...(country ? { country } : {}),
    });

    log.info("chat:start", {
      slug,
      turns: messages.length,
      lastUser: messages
        .filter((m) => m.role === "user")
        .at(-1)
        ?.content.slice(0, 80),
    });

    try {
      const result = streamAuraReplyWithTools({
        card,
        messages,
        tools,
      });
      return result.toUIMessageStreamResponse();
    } catch (err) {
      log.error("chat:failed", { slug, err: errToObject(err) });
      return NextResponse.json(
        { error: "chat_failed", message: (err as Error).message },
        { status: 502 },
      );
    }
  },
);
