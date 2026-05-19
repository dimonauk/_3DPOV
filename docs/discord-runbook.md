# Discord integration — setup runbook

Production-grade runbook for wiring the studio Discord. Mirrors the
Patreon stack: **Firebase custom claims are the source of truth**, and
Discord roles are downstream — applied automatically by a bot whose
role-grants are tagged with audit-log reasons so the studio can see
who applied what.

For the canon (tier names, Reader+ legacy clause) see
[`synthesis/24-hangar-patreon-data.md`](../synthesis/24-hangar-patreon-data.md)
and the Patreon runbook at [`patreon-runbook.md`](./patreon-runbook.md).

---

## Architecture at a glance

```
Patreon webhook  ──►  /api/patreon/webhook
                            │
                            ▼
                  applyTier()  ──► Firebase custom claims
                            │       { tier, patreonId, ... }
                            │
                            ▼
                  maybePropagateDiscord(uid)
                            │
                            ▼
                  syncDiscordRoleForUid(uid)
                            │
                            ├─ check guild membership (404 → defer)
                            ├─ compute desired role from tier
                            ├─ remove stale studio-managed roles
                            └─ add the desired role (PUT, with
                               X-Audit-Log-Reason header)
```

The same `syncDiscordRoleForUid` is called:
- After every Patreon webhook (real-time)
- At the end of the Patreon OAuth callback (when a user links Patreon)
- At the end of the Discord OAuth callback (when a user links Discord)
- From the Re-sync button (`POST /api/discord/resync`)
- From the daily cron reconciler (`GET /api/cron/discord-reconcile`)

---

## What's built

| File | Role |
|---|---|
| `lib/discord/types.ts` | DiscordUser, DiscordGuildMember, OAuth response shapes |
| `lib/discord/role-map.ts` | Tier → role-ID resolver + invite URL accessor |
| `lib/discord/rate-limit.ts` | REST client honouring Discord's `retry_after` on 429 |
| `lib/discord/preflight.ts` | Startup config check; refuses to run without bot token + guild ID |
| `lib/discord/sync-role.ts` | The core sync function; tags every change with audit-log reason |
| `app/api/discord/oauth/start/route.ts` | Begins user-link flow |
| `app/api/discord/oauth/callback/route.ts` | Verifies state, exchanges code, persists `discord_user_id`, fires initial sync |
| `app/api/discord/disconnect/route.ts` | Clears link + best-effort role cleanup |
| `app/api/discord/resync/route.ts` | User-initiated re-sync (the Re-sync button) |
| `app/api/discord/invite-url/route.ts` | Read-only env passthrough; rotate invite without redeploying |
| `app/api/cron/discord-reconcile/route.ts` | Daily full sweep — drift safety net |
| `app/rookery/discord/page.tsx` | Public connect page |
| `app/rookery/discord/connect-client.tsx` | Connect/disconnect/resync UI |
| `lib/patreon/firebase-sync.ts` | Lazy-imports `syncDiscordRoleForUid` post-apply / post-revoke |
| `app/api/patreon/oauth/callback/route.ts` | Same lazy-import after the OAuth-side claim write |

---

## Setup, in order

### 1. Create the bot application

1. Go to
   [`discord.com/developers/applications`](https://discord.com/developers/applications)
   → **New Application**. Name: `Holo-Flow Studio (Site link)`.
2. **Bot** tab → Reset Token → copy → `DISCORD_BOT_TOKEN`.
3. Same Bot tab → **Privileged Gateway Intents** → enable
   **Server Members Intent**. The role-sync needs this to read guild
   membership.
   - Apps in fewer than 100 guilds can toggle without approval.
   - Once you cross 75 guilds you'll need to apply. This isn't a
     concern for a studio's own server.
4. **OAuth2** tab → URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: **Manage Roles**, **Create Instant Invite**
   - Copy the generated URL, open it, select the studio server.

### 2. Set up the studio Discord server

1. **Create four roles** in Server Settings → Roles. Names exact:
   `Reader+`, `Member`, `Patron`, `Atelier`. Pick distinguishable colours.
2. **Bot role hierarchy** — drag the bot's auto-created role (named
   `Holo-Flow Studio`) **above** all four tier roles. If the bot's
   role is below any tier role, Discord 403s the role assignment
   silently from the API perspective; the bot can't manage roles
   higher than itself.
3. **Don't add extra permissions to the bot.** Manage Roles + Create
   Instant Invite is everything it needs.
4. **Server Settings → Widget → enable** (optional; useful if you
   later want to embed a member-count widget on the site).
5. Enable **Developer Mode** in your own Discord client (User Settings
   → Advanced) so you can right-click → Copy IDs.
6. Right-click each tier role → Copy Role ID. Paste into:
   - `DISCORD_ROLE_READER_PLUS_ID`
   - `DISCORD_ROLE_MEMBER_ID`
   - `DISCORD_ROLE_PATRON_ID`
   - `DISCORD_ROLE_ATELIER_ID`
7. Right-click the server name → Copy Server ID. Paste into
   `DISCORD_GUILD_ID`.

### 3. Generate the public invite URL

In the channel settings of whatever channel you want supporters to
land in (recommend `#welcome` or `#general`), Invite → New invite.
Configure:
- **Expire after:** Never
- **Max number of uses:** No limit
- Copy the `https://discord.gg/XXXXX` URL. Paste into
  `DISCORD_GUILD_INVITE_URL`.

If you ever need to rotate the invite (e.g. it's been spammed), set a
new one, paste the new URL into the env var, redeploy is not needed
since `/api/discord/invite-url` reads at request time.

### 4. Register the OAuth client

Same Developer Portal application:
- **General Information** → Application ID → `DISCORD_OAUTH_CLIENT_ID`
- **OAuth2** → Client Secret → Reset Secret → `DISCORD_OAUTH_CLIENT_SECRET`
- **OAuth2** → Redirects → add:
  - `https://holoflow.co.uk/api/discord/oauth/callback`
  - `http://localhost:3000/api/discord/oauth/callback`
- `DISCORD_OAUTH_REDIRECT_URI=https://holoflow.co.uk/api/discord/oauth/callback`

### 5. Add the cron entry

In `vercel.json`'s `crons` array:

```json
{ "path": "/api/cron/discord-reconcile", "schedule": "30 4 * * *" }
```

30 minutes offset from the Patreon reconciler so they don't compete
for the same window. The route uses the same `CRON_SECRET` Bearer
header as the Patreon reconciler.

---

## The hacks (verified gotchas)

### #1 — Role hierarchy

Patreon's own Discord-integration docs are explicit: *"If the bot is
not above roles that you'd want it to manage, it will not be able to
assign roles."* Discord's role list is linear; you can manage anything
below your own role, but the bot must be above the four tier roles.

**Mitigation:** the runbook step 2.2 is mandatory. There's no
preflight check we can do server-side because reading the role
hierarchy requires the bot to be in the guild first.

### #2 — `MANAGE_ROLES` permission must NOT be edited after install

The Patreon-side docs say: *"Do not deselect or add any permissions to
the Patreon Bot! It has all of the permissions it needs."* Same for
the studio bot — Discord assigns permissions at install time; tweaking
them in the server-side role panel sometimes desyncs the bot's
effective permission set.

**Mitigation:** Set permissions via the OAuth2 URL generator (step 1.4),
NOT via the in-server role permissions panel. Don't touch the bot's
own role permissions in Server Settings after install.

### #3 — `Server Members Intent` is required

`syncDiscordRoleForUid` calls `GET /guilds/{id}/members/{user_id}`
to check if the user is in the guild. This requires the Server Members
privileged intent. Without it, the call returns 403 even with valid
auth.

**Mitigation:** step 1.3 — enable the intent. If skipped, the connect
flow lands the user on `?discord=pending-invite` even when they're in
the guild because the membership check 403s and we treat that the
same as 404.

### #4 — `guilds.join` scope is high-risk and unnecessary here

The `guilds.join` OAuth scope (combined with `bot`) lets your app
add a user to a guild without them seeing the invite. Discord
explicitly flags this as abuse-prone — there have been "giveaway"
bots forcing users into spam guilds, and Discord rate-limits unverified
apps to one guild via `/oauth2/authorize` per request. **Don't use it.**

**Mitigation:** the studio asks for `identify email` only. The user
joins the guild themselves via the invite URL we surface on the
connect page; the role applies the moment they're in.

### #5 — Honour Discord's `retry_after` on 429s

Discord uses per-route rate-limit buckets. On 429, the response body
includes `retry_after` in seconds (float). Exponential backoff is
WRONG here — you'll wait longer than needed. Honour the value Discord
returns, with a small fixed jitter to avoid thundering herds when
multiple syncs trigger simultaneously.

**Mitigation:** `lib/discord/rate-limit.ts:discordFetch()` reads
`retry_after` from the 429 body and waits exactly that long (plus
100ms jitter), then retries up to `maxRetries` times.

### #6 — Audit log compliance

Discord servers have an audit log that records role grants. By default
the log shows "Holo-Flow Studio bot added Patron role to UserName".
That's not enough context for a server admin investigating drift.

**Mitigation:** every role-change request from `sync-role.ts` and the
disconnect route sends an `X-Audit-Log-Reason` header with the format
`holoflow-sync: tier=<tier> uid=<firebase-uid>` (or
`holoflow-disconnect: uid=<...>`). The audit log now shows context for
every change, and the studio admin can trace any role back to its
trigger.

### #7 — Token storage minimum

Discord's own OAuth docs recommend storing only the absolute minimum.
The studio's flow goes one step further: we discard the user's
OAuth access token *immediately* after step 3 of the callback (the
`GET /users/@me` call). All subsequent role operations use the bot
token (a server-only secret); the user's OAuth token is never used
again, so storing it would create attack surface for zero benefit.

**Mitigation:** the callback explicitly never persists `tokens.access_token`
or `tokens.refresh_token`. Only the Discord `user.id` is persisted, in
the Firebase custom claim `discord_user_id`.

### #8 — Bot token rotation procedure

If the bot token leaks (e.g. accidentally committed to git):

1. Discord Developer Portal → Bot → Reset Token immediately.
2. Update `DISCORD_BOT_TOKEN` in Vercel Project Settings (Production
   and Preview both).
3. Redeploy. The cron reconciler at 04:30 UTC will catch any drift in
   the meantime; the per-event syncs from the Patreon webhook will
   fail-soft (logged warning, claim still applied in Firebase).

### #9 — Drift between Firebase claim and Discord role

Several ways drift can creep in:

- Server admin manually removes a tier role from someone.
- A new role is added to the four-tier set after launch.
- The bot loses MANAGE_ROLES temporarily (e.g. a server admin
  experimenting with permissions).

**Mitigation:** the daily cron reconciler (`/api/cron/discord-reconcile`)
iterates every Firebase user with a `discord_user_id` claim and re-runs
`syncDiscordRoleForUid` for each. The function is idempotent — if the
roles are already correct, nothing changes.

---

## Smoke tests after wiring

1. **Bot is in the guild and can talk to the API:**
   ```bash
   curl -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        "https://discord.com/api/v10/guilds/$DISCORD_GUILD_ID"
   ```
   Expect a 200 JSON of the guild. 403 means the bot isn't in the
   guild; 401 means the token is wrong.

2. **Role hierarchy is correct:**
   ```bash
   curl -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
        "https://discord.com/api/v10/guilds/$DISCORD_GUILD_ID/members/<your-own-discord-id>"
   ```
   Note the roles array. Try a sync against your own uid (must have a
   Firebase user with a tier claim set — e.g. via the admin claim
   panel). Verify the role is applied.

3. **Preflight check:**
   `curl -X POST https://holoflow.co.uk/api/discord/resync -H "Authorization: Bearer bad"`
   → expect 401 (not 503). If 503, preflight is failing — check env.

4. **OAuth link flow:** sign into the Rookery, visit `/rookery/discord`,
   click Connect Discord. After the bounce, the page should show
   "Linked" (or "Linked — but you're not in the server yet" with the
   invite URL).

5. **Disconnect flow:** click Disconnect. Confirm the role is removed
   from your Discord membership (refresh the server in the Discord
   client).

6. **Cron reconciler:**
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
        "https://holoflow.co.uk/api/cron/discord-reconcile?maxBatches=1"
   ```
   Expect a summary JSON. `synced` should reflect everyone whose
   roles needed updating (zero on a steady-state day).

---

## See also

- [`patreon-runbook.md`](./patreon-runbook.md) — the upstream tier-claim source
- [Discord Developer Docs](https://discord.com/developers/docs/intro) — REST + OAuth references
- [Privileged Intents Best Practices](https://support-dev.discord.com/hc/en-us/articles/6177533521047-Privileged-Intents-Best-Practices) — Discord's own guidance
