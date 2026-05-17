import "server-only";

/**
 * Aura's tool box. Each tool turns her from a chatbot into an agent —
 * she can navigate, surface cards, capture leads, open the designer,
 * trigger booking flow. The AI Gateway model (Gemini flash-lite by
 * default) decides which tool to call based on the conversation.
 *
 * Tool execute() functions return structured results. Every result has
 * two parts:
 *
 *   - `summary`: human-readable string the LLM sees and weaves into
 *     its next text reply ("right, I'm taking you to the designer")
 *   - `action`: optional structured payload the CLIENT consumes to do
 *     side effects (router.push, render card chip, fire toast). Server
 *     can't navigate the browser; client does it from the stream.
 *
 * Client-side tool result handlers live in
 *   components/aura/aura-launcher.tsx -> handleToolResult()
 *
 * NEW TOOLS — to add a tool:
 *   1. Define schema with Zod
 *   2. Implement execute() — be defensive, never throw
 *   3. Add the corresponding client-side handler in aura-launcher
 *   4. Document the action's `kind` field below
 *
 * CLIENT ACTION TYPES:
 *   navigate            { kind: "navigate", path: string }
 *   showCards           { kind: "showCards", cards: CardSummary[] }
 *   showCard            { kind: "showCard", card: CardSummary }
 *   openBooking         { kind: "openBooking", purpose?: string }
 *   leadCaptured        { kind: "leadCaptured", id: string }
 *   scannerOpen         { kind: "scannerOpen" }
 */

import { tool } from "ai";
import { z } from "zod";
import { getAllCards, getCard } from "lib/ar/cards";
import { createCardLead } from "lib/cards/leads-server";

/** Lightweight card row Aura surfaces to the visitor. */
type CardSummary = {
  slug: string;
  name: string;
  role?: string;
  studio?: string;
  tagline?: string;
  primary: string;
  qrPath: string;
  url: string;
};

function cardToSummary(c: {
  slug: string;
  name: string;
  role: string;
  studio?: string;
  tagline?: string;
  brand: { primary: string };
}): CardSummary {
  return {
    slug: c.slug,
    name: c.name,
    role: c.role,
    studio: c.studio,
    tagline: c.tagline,
    primary: c.brand.primary,
    qrPath: `/cards/${c.slug}/qr.svg`,
    url: `/c/${c.slug}`,
  };
}

/**
 * Build the tool set for site-wide Aura. Pass in request-scoped values
 * (visitor IP, UA, country, optional uid) so tools that write data can
 * attribute it correctly.
 */
export function getAuraTools(opts: {
  ip?: string;
  ua?: string;
  country?: string;
  uid?: string | null;
  /** Where the chat is happening — used for `capture_lead` attribution */
  pathname?: string;
}) {
  return {
    // ---------------------------------------------------------------
    navigate_to: tool({
      description:
        "Take the visitor to a specific page on holoflow.co.uk. Use when the visitor wants to see something specific or you want to show them a part of the site. ONLY use real paths: /, /cards, /cards/design, /wallet, /shop, /atelier, /journal, /articles. Never invent paths.",
      inputSchema: z.object({
        path: z
          .string()
          .startsWith("/")
          .max(120)
          .describe(
            "Absolute path on holoflow.co.uk, e.g. /cards/design or /atelier",
          ),
        reason: z
          .string()
          .max(140)
          .describe(
            "One-sentence reason you're sending them there — visitor will see this",
          ),
      }),
      execute: async ({ path, reason }) => {
        return {
          summary: `Navigating the visitor to ${path}. Reason: ${reason}`,
          action: { kind: "navigate" as const, path, reason },
        };
      },
    }),

    // ---------------------------------------------------------------
    find_cards: tool({
      description:
        "Search the demo AR business card gallery for cards matching a description. Returns up to 5 cards with their slug, name, role, tagline. Use when the visitor asks about specific work, wants to see examples of cards, or describes a project type. Do NOT use for individual lookup — use show_card for that.",
      inputSchema: z.object({
        query: z
          .string()
          .max(140)
          .describe(
            "Free-text description of what the visitor is looking for, e.g. 'poi performance', 'heritage documentation', 'minimalist wall art'",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(5)
          .optional()
          .describe("How many cards to surface — default 3"),
      }),
      execute: async ({ query, limit }) => {
        try {
          const all = await getAllCards();
          const q = query.toLowerCase();
          const scored = all
            .filter((c) => c.public !== false)
            .map((c) => {
              const haystack = [
                c.name,
                c.role,
                c.studio,
                c.tagline,
                c.ar?.description,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              const tokens = q.split(/\s+/).filter((t) => t.length > 2);
              let score = 0;
              for (const t of tokens) {
                if (haystack.includes(t)) score += 1;
              }
              return { card: c, score };
            })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit ?? 3);

          const cards = scored.map((s) => cardToSummary(s.card));

          if (cards.length === 0) {
            return {
              summary: `No cards matched "${query}". The gallery has ${all.length} cards total — suggest the visitor browse /cards directly.`,
              action: null,
            };
          }
          return {
            summary: `Found ${cards.length} card(s) matching "${query}": ${cards
              .map((c) => `${c.name} (/c/${c.slug})`)
              .join(", ")}`,
            action: { kind: "showCards" as const, cards },
          };
        } catch (err) {
          return {
            summary: `Card search failed: ${(err as Error).message}`,
            action: null,
          };
        }
      },
    }),

    // ---------------------------------------------------------------
    show_card: tool({
      description:
        "Surface one specific demo card by slug, with its QR code and tagline. Use when the visitor names a card or you want to point them at a specific example. The slug is lowercase-hyphenated, e.g. 'dimona', 'protean-apex', 'late-bloom'.",
      inputSchema: z.object({
        slug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(80)
          .describe("Card slug, e.g. 'dimona' or 'protean-apex'"),
      }),
      execute: async ({ slug }) => {
        try {
          const card = await getCard(slug);
          if (!card) {
            return {
              summary: `No card with slug "${slug}". Available slugs include: dimona, protean-apex, genesis-spore, late-bloom.`,
              action: null,
            };
          }
          const summary = cardToSummary(card);
          return {
            summary: `Showing card "${card.name}" — ${card.tagline ?? card.role}. URL: /c/${slug}`,
            action: { kind: "showCard" as const, card: summary },
          };
        } catch (err) {
          return {
            summary: `Card lookup failed: ${(err as Error).message}`,
            action: null,
          };
        }
      },
    }),

    // ---------------------------------------------------------------
    capture_lead: tool({
      description:
        "Save the visitor's contact details so Dimona can follow up. Use when the visitor wants to be contacted, asks for a quote, says they want to work together, or you've qualified them as a real lead. ALWAYS confirm the email back to them in your reply. Email is the only required field.",
      inputSchema: z.object({
        email: z
          .string()
          .email()
          .max(320)
          .describe("Visitor's email address"),
        name: z
          .string()
          .max(200)
          .optional()
          .describe("Visitor's name if they've given it"),
        message: z
          .string()
          .max(2000)
          .optional()
          .describe(
            "Summary of what they want — the project, the question, the brief. Synthesise from the conversation so far.",
          ),
        intent: z
          .enum([
            "quote_request",
            "discovery_call",
            "general_enquiry",
            "press",
            "collab",
            "other",
          ])
          .optional()
          .describe("Why they're getting in touch"),
      }),
      execute: async ({ email, name, message, intent }) => {
        try {
          // Site-wide leads land on Dimona's card by default — she's
          // the studio owner and that's where she already monitors.
          const targetSlug = "dimona";
          const result = await createCardLead({
            slug: targetSlug,
            email,
            ...(name ? { name } : {}),
            ...(message ? { message } : {}),
            src: `aura-agent:${opts.pathname ?? "/"}${intent ? `:${intent}` : ""}`,
            ...(opts.ua ? { ua: opts.ua } : {}),
            ...(opts.country ? { country: opts.country } : {}),
            ...(opts.ip ? { ip: opts.ip } : {}),
          });
          if (!result.ok) {
            return {
              summary: `Couldn't save the lead: ${result.error}. Tell the visitor to email hello@holoflow.co.uk directly.`,
              action: null,
            };
          }
          return {
            summary: `Lead captured for ${email}${name ? ` (${name})` : ""}${intent ? `, intent: ${intent}` : ""}. ID: ${result.id}. Confirm to the visitor that Dimona has it.`,
            action: { kind: "leadCaptured" as const, id: result.id, email },
          };
        } catch (err) {
          return {
            summary: `Lead capture threw: ${(err as Error).message}. Tell the visitor to email hello@holoflow.co.uk directly.`,
            action: null,
          };
        }
      },
    }),

    // ---------------------------------------------------------------
    open_designer: tool({
      description:
        "Take the visitor to the AR card designer at /cards/design. Use when they want to create their own card. The designer has 9 templates and an AI scanner that autofills from a photo of an existing business card.",
      inputSchema: z.object({
        template_hint: z
          .string()
          .max(80)
          .optional()
          .describe("Optional starting template style — e.g. 'minimalist'"),
      }),
      execute: async ({ template_hint }) => {
        return {
          summary: `Opening the card designer${template_hint ? ` with a ${template_hint} template hint` : ""}.`,
          action: {
            kind: "navigate" as const,
            path: "/cards/design",
            reason: "Open the AR card designer",
          },
        };
      },
    }),

    // ---------------------------------------------------------------
    open_booking: tool({
      description:
        "Surface the calendar booking flow when the visitor wants to schedule a call with Dimona. The studio uses Cal.com. ONLY use when the visitor has clearly indicated they want to book a real call — not for casual interest.",
      inputSchema: z.object({
        purpose: z
          .string()
          .max(200)
          .optional()
          .describe(
            "What the call is about — passed through as the booking title",
          ),
      }),
      execute: async ({ purpose }) => {
        return {
          summary: `Surfacing the booking flow${purpose ? ` for: ${purpose}` : ""}.`,
          action: {
            kind: "openBooking" as const,
            ...(purpose ? { purpose } : {}),
          },
        };
      },
    }),
  };
}

export type AuraTools = ReturnType<typeof getAuraTools>;
