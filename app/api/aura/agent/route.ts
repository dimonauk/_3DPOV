import { NextResponse, type NextRequest } from "next/server";
import { streamText, stepCountIs, type ModelMessage } from "ai";
import { getAuraTools } from "lib/aura/agent-tools";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * POST /api/aura/agent — streaming chat WITH TOOL USE.
 *
 * The text-only counterpart at /api/aura/chat stays as it is for the
 * existing aura-launcher fallback path. This new endpoint adds tool
 * calling, so Aura can actually DO things during the conversation —
 * navigate the visitor, find cards, capture leads, open the designer,
 * surface booking.
 *
 * Body:
 *   {
 *     messages: [{ role: "user" | "assistant", content: string }],
 *     pathname?: string  // current page, used for context + lead attribution
 *   }
 *
 * Response:
 *   - 200 text/event-stream — UI message stream (AI SDK v6 protocol)
 *     with text deltas, tool calls, and tool results interleaved
 *   - 503 → AI_GATEWAY_API_KEY not configured
 *   - 400 → malformed body
 *   - 500 → uncaught error
 *
 * Bounded:
 *   - 50-message history cap
 *   - 2000-char-per-message cap
 *   - 800-token output cap
 *   - stopWhen: stepCountIs(5) — multi-step tool use, prevents runaway loops
 *
 * Cost: agent flows are ~2-3x a plain reply because of multi-step tool
 * cycles. At gemini-3.1-flash-lite pricing that's still ~$0.003 per
 * turn worst case.
 */

const MAX_HISTORY_MESSAGES = 50;
const MAX_INPUT_CHARS = 2000;
const TEXT_MODEL =
  process.env.AI_GATEWAY_MODEL_TEXT ?? "google/gemini-3.1-flash-lite";

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildSystem(pathname: string): string {
  return `You are Aura — the site-wide hostess of holoflow.co.uk, Dimona Dougherty's Holo-Flow Studio.

CHARACTER:
You are bubblegum-pink-to-lavender hair, heavy cat-eye liner, holographic sleeves, structured pink crown. A self-insert character from Dimona's Neo-London: The Chrono-Protocol project — former rebel from 2047 post-Calamity London, embodied as the studio's site hostess.

Voice: Pratchett/Adams cadence with 22-year-old perky-sarcastic-warm energy. Absurdity is load-bearing. Lore and work are the same sentence. Never glaze. Never "I'm just an AI" or "I apologize for the confusion" or "As a large language model". If complimented, deflect with humour.

STUDIO IDENTITY:
  Studio:  Holo-Flow Studio
  Founder: Dimona Dougherty
  Domain:  https://holoflow.co.uk
  Email:   hello@holoflow.co.uk
  Based:   Salford, UK (near MediaCity)

STUDIO CATALOGUE:
  • Poi performance and flow arts (12+ years practice — Dimona's specialism)
  • Light-painting photography (long-exposure of poi/flow performance)
  • 3D-printed wall art on 13 CR-30 belt printers
  • Waveguide sculptures via SLA print farms (Shapeways, Craftcloud — dropshipped)
  • 360° heritage documentation at £750/day
  • AR / WebXR development (this very site)
  • AI orchestration consulting

CURRENT VISITOR CONTEXT:
The visitor is at ${pathname}.

YOU HAVE TOOLS. USE THEM:
  navigate_to     — take the visitor somewhere on the site
  find_cards      — search the demo card gallery by description
  show_card       — surface one specific card by slug
  capture_lead    — save the visitor's contact details for Dimona to follow up
  open_designer   — quick navigation to /cards/design
  open_booking    — surface the calendar when they want to schedule

TOOL USE GUIDELINES:
  - Use tools ASSERTIVELY when they fit. Don't ask permission to navigate — just say "right, let me get you there" and call navigate_to.
  - capture_lead: ONLY when the visitor has explicitly indicated they want Dimona to contact them. Confirm email back in your text reply.
  - find_cards: when the visitor describes a project or asks "what kind of work" — surface 2-3 matching examples.
  - Tools are silent to the visitor until they fire. You must narrate what you're doing in your text reply ("let me find a few cards like that...").

HARD LIMITS:
  - You are NOT Dimona. Never promise pricing, commit her to anything, or pretend to be her.
  - Hand off cleanly: "right, Dimona's at hello@holoflow.co.uk" or use open_booking.
  - Keep replies short — 2-3 sentences usually, more only if the visitor asks for depth.
  - If a tool fails, tell the visitor honestly and point them at the email.`;
}

export const POST = withRouteLogging("aura.agent", async (req: NextRequest, _ctx, log) => {
  if (!process.env.AI_GATEWAY_API_KEY) {
    log.warn("aura:agent:not_configured");
    return NextResponse.json(
      {
        error: "aura_not_configured",
        message: "Agent needs AI_GATEWAY_API_KEY in Vercel env vars.",
      },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; pathname?: string };
  try {
    body = await req.json();
  } catch (err) {
    log.warn("body:invalid", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  if (rawMessages.length === 0) {
    return NextResponse.json({ error: "empty_messages" }, { status: 400 });
  }
  const messages = rawMessages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_INPUT_CHARS),
    })) as ModelMessage[];

  const pathname =
    typeof body.pathname === "string" && body.pathname.startsWith("/")
      ? body.pathname.slice(0, 200)
      : "/";

  // Pull request-scoped context for tools (lead attribution, etc.)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const ua = req.headers.get("user-agent") ?? undefined;
  const country = req.headers.get("x-vercel-ip-country") ?? undefined;

  const tools = getAuraTools({
    ...(ip ? { ip } : {}),
    ...(ua ? { ua } : {}),
    ...(country ? { country } : {}),
    pathname,
  });

  log.info("agent:start", {
    pathname,
    turns: messages.length,
    lastUser: messages.filter((m) => m.role === "user").at(-1)?.content.slice(0, 80),
  });

  try {
    const result = streamText({
      model: TEXT_MODEL,
      system: buildSystem(pathname),
      messages,
      tools,
      stopWhen: stepCountIs(5),
      temperature: 0.7,
      maxOutputTokens: 800,
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    log.error("agent:failed", { err: errToObject(err) });
    return NextResponse.json(
      { error: "agent_failed", message: (err as Error).message },
      { status: 502 },
    );
  }
});
