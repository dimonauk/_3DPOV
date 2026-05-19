# Patreon integration — setup runbook

This is the runbook for wiring up the new **Holo-Flow Studio** Patreon
(separate from the personal `patreon.com/dimonauk`). Includes the
gotchas surfaced from the Patreon Developers forum and the Patreon
plugin CVE (2024), so the next person doing this doesn't trip the same
wires.

For the canon shape (two-Patreon strategy, tier names, reader+ legacy
clause) see [`synthesis/22-patreon-research.md`](../synthesis/22-patreon-research.md),
[`synthesis/23-the-patreon-as-it-stands.md`](../synthesis/23-the-patreon-as-it-stands.md),
and [`synthesis/24-hangar-patreon-data.md`](../synthesis/24-hangar-patreon-data.md).

---

## What's already built

| File | Role |
|---|---|
| `lib/patreon/types.ts` | Wire shapes for member/tier/identity + `StudioTierClaim` |
| `lib/patreon/tier-map.ts` | Patreon tier IDs → `member/patron/atelier` |
| `lib/patreon/firebase-sync.ts` | `applyTier`/`revokeTier` against Firebase custom claims |
| `lib/patreon/post-drop-teaser.ts` | Post a tier-locked drop teaser to Patreon |
| `lib/patreon/webhook-idempotency.ts` | Firestore-backed dedupe for out-of-order webhooks |
| `lib/patreon/refresh-token.ts` | Creator-token refresh with 24h-window caching |
| `lib/patreon/preflight.ts` | Startup config validation; refuses to run with empty secret |
| `lib/patreon/tier-claim.ts` | Server-side claim reader + tier-rank helpers |
| `app/api/patreon/webhook/route.ts` | HMAC-MD5-verified webhook receiver |
| `app/api/patreon/oauth/start/route.ts` | OAuth flow start |
| `app/api/patreon/oauth/callback/route.ts` | OAuth flow finish + legacy reader+ clause |
| `app/api/patreon/disconnect/route.ts` | User-initiated unbind |
| `app/api/cron/patreon-reconcile/route.ts` | Daily full-membership sync |
| `app/rookery/patreon/page.tsx` | Public connect page |
| `app/rookery/patreon/connect-client.tsx` | Connect/disconnect form |
| `components/patreon/patreon-gate.tsx` | `<PatreonGate tier="patron">` content gate |

---

## Setup, in order

### 1. Create the studio campaign

1. From a fresh logged-in browser session (so you don't get the
   `/dimonauk` campaign's dashboard), go to
   [`patreon.com/create`](https://www.patreon.com/create).
2. Name it **Holo-Flow Studio**. Set the page URL to `holoflow-studio`
   (or whichever vanity is available — note: it cannot be changed
   easily later; the API uses the numeric campaign id, not the URL).
3. Branding: pull from `holoflow.co.uk` — same hero photo, same
   one-liner, same colour palette. Cross-link from the personal page
   in a top-pinned post: *"For the studio, that's [over here]."*
4. Set up the three tiers — names + monthly prices below. **Don't
   create more tiers than this** — three tiers is the studio's
   architectural lock per the canon interview; extra tiers fragment
   the entitlement graph.

   | Tier name | Monthly | Headline benefit |
   |---|---|---|
   | **Member** | £6 | On the perch. Early-view on drops; bench dispatches. |
   | **Patron** | £12 | First-refusal window on Limited editions; quarterly studio postcard; everything Member gets. |
   | **Atelier** | £25 | Bench-pass allocation (25% of every Limited edition reserved during the first-refusal window), plus everything below. |

5. Copy the numeric **campaign id**. To find it: visit
   `https://www.patreon.com/api/campaigns?include=creator` while
   logged into the new campaign's dashboard; the `data[0].id` is your
   id. Paste into `PATREON_STUDIO_CAMPAIGN_ID` env.
6. List tiers: `https://www.patreon.com/api/oauth2/v2/campaigns/<id>?include=tiers`
   (after step 3 below issues you a token). Each tier has a numeric
   `id`. Paste into `PATREON_TIER_MEMBER_ID`, `_PATRON_ID`, `_ATELIER_ID`.

### 2. Register an OAuth client

1. Visit
   [`patreon.com/portal/registration/register-clients`](https://www.patreon.com/portal/registration/register-clients)
   while logged in to the studio campaign.
2. Create a new client. Description / redirect URI:
   - **Name:** Holo-Flow Studio (Site link)
   - **Redirect URIs:** `https://holoflow.co.uk/api/patreon/oauth/callback`
     (and `http://localhost:3000/api/patreon/oauth/callback` for dev)
   - **Scopes:** `identity`, `identity[email]`, `identity.memberships`
3. Copy `Client ID`, `Client Secret`, `Creator Access Token`, `Creator
   Refresh Token` from the resulting page. The Creator tokens are
   single-paste-only — Patreon doesn't show them again after this
   page closes.
4. Paste into env:
   - `PATREON_OAUTH_CLIENT_ID`
   - `PATREON_OAUTH_CLIENT_SECRET`
   - `PATREON_OAUTH_REDIRECT_URI=https://holoflow.co.uk/api/patreon/oauth/callback`

### 3. Bootstrap the creator token in Firestore

1. Open Firebase Console → Firestore → create collection `patreon_creator_token`.
2. Create doc with ID `singleton`. Fields:
   - `access_token` (string) — paste the Creator Access Token from step 2.
   - `refresh_token` (string) — paste the Creator Refresh Token.
   - `expires_at` (string, ISO) — set to ~30 days from now (Patreon
     creator tokens last roughly a month). Use
     `new Date(Date.now() + 30*24*60*60*1000).toISOString()` in the
     browser console to generate.
   - `scope` (string) — `"identity identity[email] identity.memberships campaigns campaigns.members"` (whatever the page showed)
   - `refreshed_at` (string, ISO) — today.

After this, `lib/patreon/refresh-token.ts:getCreatorAccessToken()`
auto-refreshes when there's < 24h left on the cached token. The cron
reconciler at `app/api/cron/patreon-reconcile/route.ts` calls this on
every run.

### 4. Add the webhook

1. Patreon Creator → Settings → Webhooks → **Add webhook**.
2. URL: `https://holoflow.co.uk/api/patreon/webhook`
3. Trigger on all six member events:
   - `members:create`
   - `members:update`
   - `members:delete`
   - `members:pledge:create`
   - `members:pledge:update`
   - `members:pledge:delete`
4. Copy the **signing secret** Patreon shows after creating the
   webhook → paste into `PATREON_WEBHOOK_SECRET`.
5. Click **Send test** for `members:create` and watch your Vercel logs
   for `api.patreon.webhook` entries. A green test confirms the round
   trip — but **passes don't prove tier resolution**; only a real
   pledge does.

### 5. Add the Vercel cron entry

`vercel.json` already has a `crons` block (for the Rookery onboarding
sends). Append:

```json
{ "path": "/api/cron/patreon-reconcile", "schedule": "0 4 * * *" }
```

The reconciler paginates `/v2/campaigns/{id}/members` once a day at
04:00 UTC, applies tier for everyone with `patron_status: active_patron`,
and revokes for `former_patron`. This is the safety net for missed
webhooks.

---

## The hacks (verified gotchas)

### #1 — Empty webhook secret is forgeable-signature CVE

If `PATREON_WEBHOOK_SECRET` is blank, HMAC-MD5 of any body with the
empty-string key is **deterministic and trivially computable by anyone
on the public internet**. They can forge a valid
`X-Patreon-Signature` and POST arbitrary tier-claim events to your
webhook. Discourse's Patreon plugin had exactly this bug in 2024
(GHSA-frx4-wg35-4r68).

**Mitigation:** `lib/patreon/preflight.ts` refuses to start the
webhook if `PATREON_WEBHOOK_SECRET` is empty (returns 503 instead of
401). Also rejects secrets shorter than 24 chars with a warning. The
Patreon dashboard generates a long secret by default; **do not paste
a short one in there**, generate one with `openssl rand -hex 32` and
paste the same value both places.

### #2 — Webhook event ordering is not guaranteed

Patreon's webhook bus does not guarantee in-order delivery.
`members:pledge:create` can arrive after `members:pledge:update` for
the same member, and a naive last-write-wins handler would apply the
stale state on top of the fresh one.

**Mitigation:** `lib/patreon/webhook-idempotency.ts` uses a
transactional create in Firestore (`patreon_webhook_events/{key}`,
where `key = eventName:memberId:sha256(rawBody)[:32]`). Duplicates
short-circuit with a 200. Out-of-order *different-state* events still
process normally because the body hash differs; only true duplicates
(retries with the same payload) are deduped.

### #3 — Webhook retries on non-2xx

Patreon retries failed webhook deliveries (status code is the marker
of "failed"). A handler that 500s halfway through Firestore writes
and then succeeds on the retry will have applied side effects twice
unless idempotency catches it.

**Mitigation:** same as #2. The reservation happens *before* the
Firestore writes; the writes themselves are also idempotent (set with
merge, not append), so a partial first run + full retry converges
correctly.

### #4 — OAuth refresh-token rate limit returns `invalid_grant`

Calling `/oauth2/token?grant_type=refresh_token` too frequently
returns `401 {"error":"invalid_grant"}`. Verified on the Patreon
Developers forum — there's an internal rate limit on refreshes that
isn't documented.

**Mitigation:** `lib/patreon/refresh-token.ts` caches the access
token in Firestore with the expiry timestamp; it only refreshes when
there's < 24h of life left, OR when the caller passes `force: true`.
Multiple cron runs in the same day reuse the cached token. On a 401
from the API, callers can pass `force: true` to force one refresh —
but they should NOT loop on `force: true` if that also 401s; it
means the refresh token is actually invalid and needs re-bootstrapping
via the Developer Portal.

### #5 — OAuth scope grants are additive

When a user re-authorises with a smaller scope set, Patreon does
**not** reduce the grant; it grants the union of all previously
approved scopes. This is a footgun if the studio ever needs to ask
for fewer permissions later — the audit log will show the union, not
the requested-scope set.

**Implication:** we ask for `identity identity[email]
identity.memberships` once and don't change. If we ever needed to
add a scope (e.g. `campaigns.members` for client-side reconciler), we
would need users to re-link.

### #6 — `/v2/identity` is per-user rate-limited

The user-facing identity endpoint (used in the OAuth callback) can
rate-limit per-token when called repeatedly for the same user.

**Mitigation:** the OAuth callback only calls it once per link
session. The cron reconciler uses
`/v2/campaigns/{id}/members?include=...` instead — campaign-side
pagination, one call per page of 1000 members. At studio scale this
is one or two requests total.

### #7 — Personal-campaign event leakage

If both Patreons (the personal `/dimonauk` one and the studio one)
end up pointing webhooks at the same URL (easy to do by mistake when
testing), members:* events from the personal campaign would otherwise
apply tier claims to studio users.

**Mitigation:** the webhook calls `requireStudioCampaignId()` and
filters every event by `member.relationships.campaign.data.id`.
Events from any other campaign 200-acked with `skipped:"different_campaign"`.

### #8 — `access-rules` relationship in `posts` API is under-documented

`post-drop-teaser.ts` writes a synthetic `access-rules` relationship
alongside the `tiers` relationship when creating tier-locked posts.
Patreon's docs don't fully specify this; on the first live test, the
tiers gate is load-bearing — if Patreon rejects the access-rules
relationship with a 422, strip it from the request and re-test. The
tier gate alone is enough to lock the post.

---

## Smoke tests after wiring

After all env vars are set + the webhook is wired:

1. **Preflight check (no real money required):**
   `curl -sX POST https://holoflow.co.uk/api/patreon/webhook -H "x-patreon-event: members:create" -H "x-patreon-signature: bad" -d "{}"`
   → expect `401 invalid_signature` (NOT 503). If 503, preflight is
   failing — check env.

2. **Send-test from Patreon dashboard** → green response → webhook
   round-trip OK.

3. **Real pledge at the Member tier from a test account** → check
   Firebase Console → Authentication → that user → custom claims
   should now show `{ tier: "member", patreonId: "...", ... }`.

4. **OAuth link flow:** sign into the Rookery, visit
   `/rookery/patreon`, click Connect Patreon. After the bounce, the
   page should show your tier.

5. **Disconnect flow:** click Disconnect on the same page. Custom
   claims in Firebase Console should clear. The next time the
   reconciler runs, the claim re-applies from the Patreon side.

6. **Cron reconciler:** `curl -H "Authorization: Bearer $CRON_SECRET" https://holoflow.co.uk/api/cron/patreon-reconcile?limit=10`
   → expect a JSON summary listing applied/revoked.

---

## See also

- [`synthesis/22-patreon-research.md`](../synthesis/22-patreon-research.md) — API capability research
- [`synthesis/23-the-patreon-as-it-stands.md`](../synthesis/23-the-patreon-as-it-stands.md) — the live `/dimonauk` page
- [`synthesis/24-hangar-patreon-data.md`](../synthesis/24-hangar-patreon-data.md) — Hangar grep results
- [Patreon API docs](https://docs.patreon.com/) — JSON:API v2 spec
- [Patreon Developers Forum](https://www.patreondevelopers.com/) — search for current gotchas before debugging
- [`docs/the-drop-pipeline.md`](./the-drop-pipeline.md) — Patreon's place in the drop economics
