/**
 * Patreon Creator API v2 wire shapes.
 *
 * Hand-rolled because Patreon's official TS types ship with `any`
 * everywhere and we want noUncheckedIndexedAccess to actually mean
 * something. Only the fields we touch are modelled — the rest of the
 * envelope is preserved as `Record<string, unknown>` so type guards
 * can narrow defensively.
 */

import "server-only";

export type PatreonResourceRef = {
  id: string;
  type: string;
};

export type PatreonRelationshipToMany = {
  data?: PatreonResourceRef[];
};

export type PatreonRelationshipToOne = {
  data?: PatreonResourceRef | null;
};

export type PatreonRelationships = Record<
  string,
  PatreonRelationshipToMany | PatreonRelationshipToOne | undefined
>;

export type PatreonMemberAttributes = {
  email?: string | null;
  full_name?: string | null;
  patron_status?:
    | "active_patron"
    | "declined_patron"
    | "former_patron"
    | null;
  last_charge_status?: string | null;
  lifetime_support_cents?: number | string | null;
  currently_entitled_amount_cents?: number | null;
  pledge_relationship_start?: string | null;
};

export type PatreonMember = {
  id: string;
  type: "member";
  attributes?: PatreonMemberAttributes;
  relationships?: {
    currently_entitled_tiers?: PatreonRelationshipToMany;
    campaign?: PatreonRelationshipToOne;
    user?: PatreonRelationshipToOne;
  };
};

export type PatreonTierAttributes = {
  title?: string | null;
  amount_cents?: number | null;
};

export type PatreonTier = {
  id: string;
  type: "tier";
  attributes?: PatreonTierAttributes;
};

export type PatreonCampaignRef = {
  id: string;
  type: "campaign";
};

export type PatreonIdentityAttributes = {
  email?: string | null;
  full_name?: string | null;
};

export type PatreonIdentity = {
  id: string;
  type: "user";
  attributes?: PatreonIdentityAttributes;
  relationships?: {
    memberships?: PatreonRelationshipToMany;
  };
};

export type PatreonIncluded =
  | PatreonMember
  | PatreonTier
  | { id: string; type: string; attributes?: Record<string, unknown> };

export type PatreonWebhookEnvelope = {
  data: PatreonMember;
  included?: PatreonIncluded[];
  links?: Record<string, string>;
};

export type PatreonIdentityEnvelope = {
  data: PatreonIdentity;
  included?: PatreonIncluded[];
};

export type PatreonMembersListEnvelope = {
  data: PatreonMember[];
  included?: PatreonIncluded[];
  links?: {
    next?: string;
  };
  meta?: {
    pagination?: {
      cursors?: { next?: string };
      total?: number;
    };
  };
};

export type PatreonOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type PatreonWebhookEventName =
  | "members:create"
  | "members:update"
  | "members:delete"
  | "members:pledge:create"
  | "members:pledge:update"
  | "members:pledge:delete";

export const PATREON_WEBHOOK_EVENTS: ReadonlySet<PatreonWebhookEventName> =
  new Set<PatreonWebhookEventName>([
    "members:create",
    "members:update",
    "members:delete",
    "members:pledge:create",
    "members:pledge:update",
    "members:pledge:delete",
  ]);

export function isPatreonWebhookEvent(
  value: string,
): value is PatreonWebhookEventName {
  return PATREON_WEBHOOK_EVENTS.has(value as PatreonWebhookEventName);
}

export type StudioTier = "member" | "patron" | "atelier";

export type StudioTierClaim = StudioTier | "reader-plus";

export type TierClaimPayload = {
  tier: StudioTierClaim | null;
  tierStartedAt: string | null;
  lifetimePledgeCents: number;
  patreonId: string | null;
};
