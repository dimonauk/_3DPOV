import "server-only";

/**
 * Card-scoped tools for the per-card Aura companion that lives in the
 * Avatar tab of /c/[slug]. Unlike the site-wide agent (lib/aura/agent-
 * tools.ts), every tool here is bound to ONE specific card — leads go
 * to THAT card's collection, the booking URL is THAT card's calendar,
 * vcard is THAT card's contact, "find related cards" excludes the
 * current card from results.
 *
 * Five tools:
 *   capture_lead         scoped to this card's leads collection
 *   find_related_cards   gallery search excluding this card
 *   download_vcard       surfaces /api/cards/[slug]/vcard
 *   book_a_call          uses card.calendar.url if set
 *   save_to_wallet       triggers Apple/Google Wallet buttons inline
 *
 * Tool results follow the same { summary, action } shape as
 * lib/aura/agent-tools.ts — summary goes back to the model, action
 * gets handled client-side by AuraCompanion.tsx.
 */

import { tool } from "ai";
import { z } from "zod";
import type { Card } from "lib/ar/types";
import { getAllCards } from "lib/ar/cards";
import { createCardLead } from "lib/cards/leads-server";
import { isAppleWalletConfigured } from "lib/wallet/apple-pkpass";
import { isGoogleWalletConfigured } from "lib/wallet/google-wallet";
import {
  ALL_ANIMATIONS,
  type AnimationName,
} from "lib/vrm/animationMap";
import wardrobeData from "../../data/wardrobe.json";

type WardrobeOutfit = {
  slug: string;
  label: string;
  url: string;
  bytes: number;
};
const WARDROBE_OUTFITS: WardrobeOutfit[] = wardrobeData.outfits;
const OUTFIT_SLUG_LIST = WARDROBE_OUTFITS.map((o) => o.slug);
const OUTFIT_DESCRIPTIONS: Record<string, string> = {
  "baby-pink-spice":
    "Aura's default — pink crop top + pleated skirt, bubblegum-pink hair, cute and approachable",
  "bunny-top":
    "Casual cute — bunny-themed crop top, soft palette, low-key playful",
  "kawaii-potion":
    "Witchy / potion-shop aesthetic — pastel purples and pinks, slightly theatrical",
  "pink-blouse-purple-plaid-skirt":
    "Preppy schoolgirl — pink blouse with a purple plaid skirt, structured",
  "pink-coat":
    "Outdoor / cold-weather — pink overcoat layered over the base outfit",
  "purple-dance":
    "Dance-floor / performance — purple dance outfit, energetic, made for movement",
  "ready-player-one":
    "Cyber / VR — futuristic streetwear, the gamer-poet vibe",
};

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

function cardToSummary(c: Card): CardSummary {
  const summary: CardSummary = {
    slug: c.slug,
    name: c.name,
    role: c.role,
    primary: c.brand.primary,
    qrPath: `/cards/${c.slug}/qr.svg`,
    url: `/c/${c.slug}`,
  };
  if (c.studio) summary.studio = c.studio;
  if (c.tagline) summary.tagline = c.tagline;
  return summary;
}

/**
 * Build the per-card tool set. The card object is closed over by
 * each execute() so tools are inherently scoped.
 */
export function getCardAuraTools(opts: {
  card: Card;
  ip?: string;
  ua?: string;
  country?: string;
}) {
  const { card } = opts;
  const slug = card.slug;

  return {
    // ---------------------------------------------------------------
    capture_lead: tool({
      description:
        "Save the visitor's contact details to THIS CARD'S leads collection so the cardholder can follow up. Use when the visitor wants to be contacted, asks for a quote, or you've qualified them as a real lead. ALWAYS confirm the email back to them in your reply. Email is the only required field.",
      inputSchema: z.object({
        email: z.string().email().max(320).describe("Visitor's email"),
        name: z.string().max(200).optional().describe("Visitor's name if shared"),
        message: z
          .string()
          .max(2000)
          .optional()
          .describe(
            "What they want — synthesise from the conversation so far",
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
          const result = await createCardLead({
            slug,
            email,
            ...(name ? { name } : {}),
            ...(message ? { message } : {}),
            src: `aura-card:${slug}${intent ? `:${intent}` : ""}`,
            ...(opts.ua ? { ua: opts.ua } : {}),
            ...(opts.country ? { country: opts.country } : {}),
            ...(opts.ip ? { ip: opts.ip } : {}),
          });
          if (!result.ok) {
            return {
              summary: `Couldn't save the lead: ${result.error}. Point them at ${card.contact?.email ?? "the cardholder's email"} directly.`,
              action: null,
            };
          }
          return {
            summary: `Lead captured for ${email}${name ? ` (${name})` : ""}${intent ? `, intent: ${intent}` : ""}. ID: ${result.id}. Confirm to the visitor that ${card.name} has it.`,
            action: { kind: "leadCaptured" as const, id: result.id, email },
          };
        } catch (err) {
          return {
            summary: `Lead capture threw: ${(err as Error).message}. Point them at ${card.contact?.email ?? "the cardholder's email"} directly.`,
            action: null,
          };
        }
      },
    }),

    // ---------------------------------------------------------------
    find_related_cards: tool({
      description: `Search the wider Holo-Flow Studio card gallery for OTHER cards related to a description. Use when the visitor asks "what else has the studio done" or wants to see related work. NEVER returns the current card (${card.name}) — it's about pointing at adjacent work.`,
      inputSchema: z.object({
        query: z
          .string()
          .max(140)
          .describe(
            "Free-text description, e.g. 'similar to this one', 'poi performance', 'waveguide sculptures'",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(4)
          .optional()
          .describe("How many cards — default 3"),
      }),
      execute: async ({ query, limit }) => {
        try {
          const all = await getAllCards();
          const q = query.toLowerCase();
          const scored = all
            .filter((c) => c.public !== false && c.slug !== slug)
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
              for (const t of tokens) if (haystack.includes(t)) score += 1;
              return { card: c, score };
            })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit ?? 3);

          const cards = scored.map((s) => cardToSummary(s.card));
          if (cards.length === 0) {
            return {
              summary: `No related cards matched "${query}". The gallery has ${all.length - 1} other cards — suggest the visitor browse /cards.`,
              action: null,
            };
          }
          return {
            summary: `Found ${cards.length} related card(s) for "${query}": ${cards.map((c) => c.name).join(", ")}.`,
            action: { kind: "showCards" as const, cards },
          };
        } catch (err) {
          return {
            summary: `Search failed: ${(err as Error).message}`,
            action: null,
          };
        }
      },
    }),

    // ---------------------------------------------------------------
    download_vcard: tool({
      description: `Surface a download link for ${card.name}'s vCard (contact card file). Use when the visitor wants to save the cardholder's contact details to their phone's address book. The vCard contains name, role, email, phone, website, social handles.`,
      inputSchema: z.object({}),
      execute: async () => {
        const url = `/api/cards/${slug}/vcard`;
        return {
          summary: `Surfacing the vCard download link for ${card.name}. Tell the visitor to tap it to save the contact to their phone.`,
          action: {
            kind: "showVcard" as const,
            slug,
            url,
            name: card.name,
          },
        };
      },
    }),

    // ---------------------------------------------------------------
    book_a_call: tool({
      description: card.calendar?.url
        ? `Surface the calendar booking flow when the visitor wants to schedule a call with ${card.name}. Booking URL is ${card.calendar.url}. ONLY use when the visitor has clearly indicated they want to book — not casual interest.`
        : `${card.name} has not configured a calendar URL. If the visitor wants to book, point them at ${card.contact?.email ?? "the cardholder's email"} to request a time.`,
      inputSchema: z.object({
        purpose: z
          .string()
          .max(200)
          .optional()
          .describe("What the call is about — passed as the booking title"),
      }),
      execute: async ({ purpose }) => {
        if (!card.calendar?.url) {
          return {
            summary: `${card.name} has no calendar URL configured. Tell the visitor to email ${card.contact?.email ?? "the cardholder"} to set up a time.`,
            action: null,
          };
        }
        return {
          summary: `Surfacing the booking flow${purpose ? ` for: ${purpose}` : ""}. URL: ${card.calendar.url}`,
          action: {
            kind: "openBooking" as const,
            url: card.calendar.url,
            ...(purpose ? { purpose } : {}),
          },
        };
      },
    }),

    // ---------------------------------------------------------------
    save_to_wallet: tool({
      description: `Render inline buttons for the visitor to save ${card.name}'s card to their phone wallet (Apple Wallet on iOS, Google Wallet on Android). Use when the visitor asks to save the card, keep the contact, or wants something they can scan later.`,
      inputSchema: z.object({}),
      execute: async () => {
        const platforms: Array<"apple" | "google"> = [];
        if (isAppleWalletConfigured()) platforms.push("apple");
        if (isGoogleWalletConfigured()) platforms.push("google");
        if (platforms.length === 0) {
          return {
            summary: `Wallet integration isn't configured for this studio yet. Tell the visitor they can still bookmark the card URL or save the vCard via download_vcard.`,
            action: null,
          };
        }
        return {
          summary: `Showing wallet save options (${platforms.join(", ")}) for ${card.name}.`,
          action: {
            kind: "saveToWallet" as const,
            slug,
            platforms,
          },
        };
      },
    }),

    // ---------------------------------------------------------------
    play_animation: tool({
      description: `Trigger an emote/pose animation on ${card.name}'s VRM avatar. Use this WHENEVER you want to express something physically — clapping when you've found something good, looking around when searching, thinking when you need a moment, jumping for surprise, blushing when complimented, waving goodbye when the visitor leaves. The animation plays for ~3 seconds then auto-returns to idle. Choose from: Angry, Blush, Clapping, Goodbye, Jump, LookAround, Relax, Sad, Sleepy, Thinking. Be expressive — use this often, not sparingly.`,
      inputSchema: z.object({
        name: z
          .enum([
            "Angry",
            "Blush",
            "Clapping",
            "Goodbye",
            "Jump",
            "LookAround",
            "Relax",
            "Sad",
            "Sleepy",
            "Thinking",
          ])
          .describe(
            "Animation name — must match exactly one of the 10 emotes",
          ),
      }),
      execute: async ({ name }) => {
        if (!(ALL_ANIMATIONS as string[]).includes(name)) {
          return {
            summary: `Unknown animation "${name}". Valid: ${ALL_ANIMATIONS.join(", ")}.`,
            action: null,
          };
        }
        return {
          summary: `Playing the ${name} animation on ${card.name}'s avatar. Crossfades back to idle after the clip finishes.`,
          action: {
            kind: "playAnimation" as const,
            name: name as AnimationName,
          },
        };
      },
    }),

    // ---------------------------------------------------------------
    set_emotion: tool({
      description: `Declare your current emotional state. Call this EARLY in your turn — ideally as the FIRST tool call before anything else — so the avatar's body language matches the words you're about to say. The client maps your emotion to the right idle animation automatically; you don't need to pick the animation yourself (use play_animation only for specific big gestures like waving goodbye or jumping for joy). Pick the single emotion that best fits THIS reply, not your overall mood. Available emotions:
  happy, sad, angry, relaxed, curious, analytical, focused, nurturing, playful, mischievous, warm, concerned, approving, disapproving, surprised, firm, clinical, cold, neutral`,
      inputSchema: z.object({
        emotion: z
          .enum([
            "happy",
            "sad",
            "angry",
            "relaxed",
            "curious",
            "analytical",
            "focused",
            "nurturing",
            "playful",
            "mischievous",
            "warm",
            "concerned",
            "approving",
            "disapproving",
            "surprised",
            "firm",
            "clinical",
            "cold",
            "neutral",
          ])
          .describe("One emotion word that fits THIS reply's tone."),
      }),
      execute: async ({ emotion }) => {
        return {
          summary: `Emotional tone set to ${emotion}. The avatar's posture will reflect this.`,
          action: { kind: "setEmotion" as const, emotion },
        };
      },
    }),

    // ---------------------------------------------------------------
    change_outfit: tool({
      description: `Swap ${card.name}'s avatar into a different outfit from the studio wardrobe. Use when the visitor asks to see a different look, when the mood of the conversation shifts (dancing → purple-dance, going outside → pink-coat, gaming → ready-player-one), or when an outfit would visually reinforce what you're saying. The change is near-instant — animation continues mid-transition. Available outfits:
${OUTFIT_SLUG_LIST.map((s) => `  - ${s}: ${OUTFIT_DESCRIPTIONS[s] ?? "(outfit)"}`).join("\n")}`,
      inputSchema: z.object({
        slug: z
          .enum([
            "baby-pink-spice",
            "bunny-top",
            "kawaii-potion",
            "pink-blouse-purple-plaid-skirt",
            "pink-coat",
            "purple-dance",
            "ready-player-one",
          ])
          .describe("Outfit slug from the wardrobe registry"),
      }),
      execute: async ({ slug }) => {
        const outfit = WARDROBE_OUTFITS.find((o) => o.slug === slug);
        if (!outfit) {
          return {
            summary: `Unknown outfit "${slug}". Valid options: ${OUTFIT_SLUG_LIST.join(", ")}.`,
            action: null,
          };
        }
        return {
          summary: `Swapping ${card.name}'s avatar to the ${outfit.label} outfit. In your reply, briefly note what vibe this look has so the visitor connects the change to the conversation.`,
          action: {
            kind: "changeOutfit" as const,
            slug: outfit.slug,
            label: outfit.label,
            url: outfit.url,
          },
        };
      },
    }),
  };
}

export type CardAuraTools = ReturnType<typeof getCardAuraTools>;
