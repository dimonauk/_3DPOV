/**
 * Post a TEASER-ONLY mirror of a new studio drop to the studio's
 * Patreon campaign.
 *
 * Why teaser-only: the canonical drop content (genome, mint window,
 * full provenance graph) lives on the studio site. The Patreon post
 * exists to ping Members that a drop went live and pull them back to
 * the site. We never duplicate body content there.
 *
 * The post is locked to Member tier and above. The lock is enforced
 * Patreon-side via the `tiers` relationship in the create-post call —
 * Reader (free) followers see the title + thumbnail but not the body.
 *
 * Wire shape: Patreon's posts endpoint expects JSON:API. The body uses
 * the campaign id from PATREON_STUDIO_CAMPAIGN_ID and the studio's API
 * key (a creator-level access token in PATREON_STUDIO_API_KEY).
 */

import "server-only";

import { createLogger } from "lib/log";

import { requireStudioCampaignId } from "./tier-map";

const log = createLogger("patreon.post-drop-teaser");

const PATREON_API = "https://www.patreon.com/api/oauth2/v2";

export type PostDropTeaserInput = {
  dropTitle: string;
  dropUrl: string;
  dropImageUrl?: string | null;
  teaserOverride?: string | null;
};

export type PostDropTeaserResult =
  | { ok: true; postId: string; url: string }
  | { ok: false; error: string; status?: number };

function buildTeaserBody(input: PostDropTeaserInput): string {
  if (input.teaserOverride && input.teaserOverride.trim().length > 0) {
    return input.teaserOverride.trim();
  }
  return [
    `A new drop just landed on the studio site: ${input.dropTitle}.`,
    "",
    "Full provenance + mint details inside the Rookery — link below.",
    "",
    input.dropUrl,
  ].join("\n");
}

export async function postDropTeaser(
  input: PostDropTeaserInput,
): Promise<PostDropTeaserResult> {
  const apiKey = process.env.PATREON_STUDIO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "PATREON_STUDIO_API_KEY not configured" };
  }
  const memberTierId = process.env.PATREON_TIER_MEMBER_ID;
  if (!memberTierId) {
    return { ok: false, error: "PATREON_TIER_MEMBER_ID not configured" };
  }
  let campaignId: string;
  try {
    campaignId = requireStudioCampaignId();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "missing-campaign",
    };
  }

  const body = {
    data: {
      type: "post",
      attributes: {
        title: input.dropTitle,
        content: buildTeaserBody(input),
        teaser_text: `New drop: ${input.dropTitle}`,
        post_type: "text",
        is_paid: false,
        post_metadata: input.dropImageUrl
          ? { image_url: input.dropImageUrl }
          : undefined,
      },
      relationships: {
        campaign: {
          data: { type: "campaign", id: campaignId },
        },
        access_rules: {
          data: [
            { type: "access-rule", id: "patrons-only" },
          ],
        },
        tiers: {
          data: [{ type: "tier", id: memberTierId }],
        },
      },
    },
  };

  let res: Response;
  try {
    res = await fetch(`${PATREON_API}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    log.error("network failure", {
      err: err instanceof Error ? err.message : String(err),
      title: input.dropTitle,
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "network-error",
    };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.warn("patreon refused post", {
      status: res.status,
      title: input.dropTitle,
      body: text.slice(0, 400),
    });
    return {
      ok: false,
      error: `patreon-${res.status}: ${text.slice(0, 200)}`,
      status: res.status,
    };
  }

  const json = (await res.json().catch(() => null)) as
    | { data?: { id?: string; links?: { self?: string } } }
    | null;
  const postId = json?.data?.id ?? "";
  const selfUrl = json?.data?.links?.self ?? "";
  log.info("teaser posted", { postId, title: input.dropTitle });
  return { ok: true, postId, url: selfUrl };
}
