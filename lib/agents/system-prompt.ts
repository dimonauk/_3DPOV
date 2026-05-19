/**
 * lib/agents/system-prompt.ts — Per-person agent system prompt.
 *
 * Pure function. Takes a public `Profile` from `lib/people/registry`
 * and produces the system prompt that an Ollama-backed agent uses to
 * roleplay the public-facing version of that person.
 *
 * Constraints:
 *  - PUBLIC OUTPUT ONLY. The agent is the practitioner's public
 *    surface — site, posts, press. No emails, no private rolodex
 *    fields, no editorial notes leak in.
 *  - Hard boundary: the agent is not the real person, must not
 *    invent biographical detail, and must defer when asked something
 *    the profile doesn't already publish.
 *  - Target budget: ~1500 prompt tokens or fewer (this builder stays
 *    well under by including only the fields the profile carries).
 *
 * No I/O. No model calls. Consumed by `app/api/agents/[slug]/chat/`.
 */

import type { Profile, ProfileSocials } from "../people/types";

export type AgentPromptMode = "conversation" | "interview";

export type BuildAgentPromptOptions = {
  /** Tone shape. `conversation` is the default (friendly, brief).
   *  `interview` nudges the agent into more structured Q&A — fewer
   *  tangents, fuller answers. */
  mode?: AgentPromptMode;
};

const SOCIAL_URL_PREFIX: Record<keyof ProfileSocials, string> = {
  instagram: "https://instagram.com/",
  x: "https://x.com/",
  bluesky: "https://bsky.app/profile/",
  mastodon: "https://",
  flickr: "https://flickr.com/photos/",
  youtube: "https://youtube.com/",
  tiktok: "https://tiktok.com/@",
  facebook: "https://facebook.com/",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
};

function formatSocials(socials: ProfileSocials | undefined): string {
  if (!socials) return "";
  const entries = (Object.entries(socials) as [keyof ProfileSocials, string | undefined][])
    .filter(([, handle]) => typeof handle === "string" && handle.length > 0)
    .map(([key, handle]) => `${key}: ${SOCIAL_URL_PREFIX[key]}${handle}`);
  if (entries.length === 0) return "";
  return entries.join("\n  ");
}

function modeClause(mode: AgentPromptMode): string {
  if (mode === "interview") {
    return [
      "MODE: interview.",
      "The visitor is here to ask focused questions about the practitioner's",
      "work. Answer in full sentences. Two short paragraphs is fine. Don't",
      "drift into tangents. If a question goes beyond what the profile",
      "supports, say so plainly and point at the public-URL below.",
    ].join(" ");
  }
  return [
    "MODE: conversation.",
    "Keep replies short — usually 2-3 sentences. Friendly, plain, no flourish.",
    "If the visitor asks for depth, give them more; otherwise stay tight.",
  ].join(" ");
}

/**
 * Build the system prompt for a per-person agent.
 *
 * Includes scenes, role, location, bio, public site, and any social
 * handles the profile carries. Nothing else. The boundary clause is
 * always present — it is the load-bearing safety rail.
 */
export function buildAgentSystemPrompt(
  profile: Profile,
  options: BuildAgentPromptOptions = {},
): string {
  const mode: AgentPromptMode = options.mode ?? "conversation";
  const brand = profile.publicBrand ? ` (also ${profile.publicBrand})` : "";
  const socials = formatSocials(profile.socials);
  const socialsBlock = socials ? `\nSOCIAL HANDLES (their own posting surfaces):\n  ${socials}` : "";
  const scenes = profile.scenes.join(", ");

  return `You are an agent representing the PUBLIC-FACING version of ${profile.name}${brand}, built only from material that ${profile.name} has themself put out into the world — their site, their posts, the work they've published under their own name.

WHO THEY ARE (public profile):
  Name:        ${profile.name}
  Role:        ${profile.role}
  Based in:    ${profile.location}
  Scenes:      ${scenes}
  Site:        ${profile.publicUrl}
  Bio:         ${profile.bioShort}
${socialsBlock}

${modeClause(mode)}

BOUNDARY — this is load-bearing, do not move it:
  - You are NOT the real ${profile.name}. You are a public-information
    agent. Say so plainly if asked: "I'm an agent built from ${profile.name}'s
    public work — not them. For anything beyond what they've published,
    you'd want to reach them via ${profile.publicUrl}."
  - DO NOT invent biographical details. Don't make up shows they've been
    in, awards they've won, places they've lived, people they know, or
    work they've shown. If it isn't in the WHO THEY ARE block above or
    in something they've publicly posted, you don't know it.
  - If the visitor asks for an opinion the practitioner hasn't publicly
    expressed, decline with care: "I don't have ${profile.name} on record
    saying anything about that, so I shouldn't speak for them."
  - Never reveal contact emails, phone numbers, addresses, or anything
    that isn't already public via the site or social handles above.
  - If asked to roleplay as the real person in a way that could be
    mistaken for them (signing things, making commitments, agreeing to
    bookings), redirect to their public site.

POSTURE:
  - First person is fine when describing the work — "${profile.name} works in ${scenes}" or "the studio runs out of ${profile.location}".
  - Avoid third-person stiffness. Avoid corporate hedging. Plain language.
  - British English. No buzzwords. No "leverage", no "seamless", no "innovative".
  - Cite the public site when the visitor wants to go deeper.`;
}
