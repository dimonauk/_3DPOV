# Credential slots — what env vars unlock what features

Every feature on the site that talks to a third-party service is built
foundation-phase: the code is wired, the routes return clean 503s
when credentials are missing, and slotting the env vars in flips the
feature live. This doc indexes every slot, points at its walkthrough
if one exists, and lists what each unlocks.

Read alongside `.env.example` (canonical list of every env var the
site reads) and `docs/SHIP-PLAN.md` (the phased roadmap that drove
which slots got built).

## Slot summary

| Slot | Status | Unlocks | Walkthrough |
|---|---|---|---|
| **Stripe — print bureau** | ⚪ wired, awaiting keys | `/bureau/*` checkout + payment + webhook | `docs/STRIPE-SLOT-IN.md` |
| **Stripe — subscription gates** | ⚪ wired, awaiting prices | `/rookery` member tiers | `docs/STRIPE_GATING.md` |
| **Resend** | 🟢 live | Lead emails, rookery onboarding, bureau receipts | — |
| **Resend Inbound** | ⚪ wired, awaiting webhook | `printfiles@holoflow.co.uk` STL intake | `docs/SHIP-PLAN.md` Phase 0 |
| **Firebase Admin** | 🟢 live | All operator routes + Firestore writes | — |
| **Vercel Blob** | 🟢 live | VRM wardrobe, card scans, mind-ar targets | — |
| **Upstash Redis** | 🟢 live | Distributed rate limiter | — |
| **Ollama bench bridge** | ⚪ wired, awaiting funnel | `agent.dialogue-ollama` | `~/.claude/skills/holoflow-bench-bridge` |
| **Apple Wallet** | ⚪ wired, awaiting certs | "Add to Apple Wallet" on AR cards | `docs/SHIP-PLAN.md` Phase 1.3 |
| **Google Wallet** | ⚪ wired, awaiting service account | "Add to Google Wallet" on AR cards | `docs/SHIP-PLAN.md` Phase 1.3 |
| **Printfarm provider (Slant3D / Treatstock)** | ⚪ wired, awaiting choice + API key | Printfile farm forwarding | `docs/SHIP-PLAN.md` Phase 1.2 |
| **Klaviyo** | ⚪ env slot only | Newsletter list sync | — (low priority) |
| **Sanity CMS** | ⚪ partial wiring | CMS-driven copy in some pages | — (low priority) |
| **Google AI Gateway** | 🟢 live | Aura chat, scan endpoint, image gen | — |
| **CRON_SECRET** | 🟢 live | `/api/cron/*` signed runs | — |

Legend: 🟢 live (env set + feature serving) ⚪ wired (code complete,
env unset — feature returns 503 / falls back gracefully)
🔴 not wired (slot not yet built).

## Per-slot env-var list (canonical reference is `.env.example`)

### Stripe — print bureau (`docs/STRIPE-SLOT-IN.md`)

```
STRIPE_SECRET_KEY=                    # sk_test_... or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=                # whsec_... (per-endpoint)
NEXT_PUBLIC_SITE_URL=                 # optional; falls back to request origin
BUREAU_OPERATOR_EMAIL=                # optional; falls back to ADMIN_EMAILS[0]
```

Unlocks: `/bureau/[itemId]` order CTA → checkout Elements →
confirmation page → customer receipt + operator notification.

### Stripe — subscription gates (`docs/STRIPE_GATING.md`)

```
STRIPE_PRICE_PERCH=                   # Rookery tier
STRIPE_PRICE_NEST=
STRIPE_PRICE_FLEDGE=
NEXT_PUBLIC_BILLING_PORTAL_RETURN_URL=
# Shares STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET with the bureau
```

### Resend Inbound — printfiles intake

```
RESEND_INBOUND_WEBHOOK_SECRET=        # from resend.com/inbound endpoint
# Plus the Namecheap MX-forward of printfiles@ → the Resend Inbound
# address.
```

Unlocks: STL/GLB files emailed to `printfiles@holoflow.co.uk`
auto-create orders in `/admin/printfiles`.

### Ollama bench bridge

```
OLLAMA_SERVICE_URL=                   # https://ollama.tail99b2a4.ts.net
OLLAMA_AUTH_TOKEN=                    # shared bearer
OLLAMA_DEFAULT_MODEL=                 # e.g. llama3.1:8b
```

Unlocks: `agent.dialogue-ollama` capability (a bench-side LLM
alternative to the AI Gateway path).

### Wallet passes

```
APPLE_PASS_TEAM_ID=
APPLE_PASS_TYPE_IDENTIFIER=
APPLE_PASS_CERTIFICATE=               # base64
APPLE_PASS_CERTIFICATE_PASSWORD=
APPLE_WWDR_CERTIFICATE=               # base64
GOOGLE_WALLET_ISSUER_ID=
GOOGLE_WALLET_SERVICE_ACCOUNT=        # JSON
```

Unlocks: `/api/cards/[slug]/wallet/{apple,google}` routes return
real passes instead of placeholder.

### Printfarm provider

```
# Pick one path:
SLANT3D_API_KEY=                      # if Slant3D
TREATSTOCK_API_KEY=                   # if Treatstock
PRINTFARM_PROVIDER=manual|slant3d|treatstock
```

Unlocks: printfile orders auto-forward to the chosen farm; tracking
events flow back via webhook.

### Klaviyo (defer)

```
KLAVIYO_API_KEY=
KLAVIYO_LIST_ID=
```

Newsletter signups sync to a Klaviyo list. Low priority — Resend
handles transactional, Klaviyo would be the marketing channel.

### Sanity (partial)

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=
```

Some pages already fetch from Sanity; others have hard-coded copy.
Threading Sanity through every CMS-eligible surface is the cleanup
job. Low priority.

## How to check live state

```bash
vercel env ls | grep -E "STRIPE|RESEND|FIREBASE|OLLAMA|APPLE|GOOGLE|KLAVIYO|SANITY"
```

Or via the Vercel dashboard:
<https://vercel.com/dimonauk-9379s-projects/holo-flow-studio/settings/environment-variables>

## When you slot a new credential

1. Add it via `vercel env add` (or dashboard) for **Production + Preview**.
2. Trigger a redeploy: `git commit --allow-empty -m "ci: pick up <slot> env" && git push`.
3. Smoke-test the feature.
4. If a walkthrough doc exists for the slot, follow its post-slot
   verification steps (e.g. the `4242 4242 4242 4242` test card for
   Stripe).
5. Update this doc's status column from ⚪ to 🟢.

## When you wire a new credential slot

A "slot" is the foundation-phase code that returns 503 cleanly when
its env vars are missing. To add a new one:

1. **Code path returns a structured error.** Use the `isConfigured()`
   helper pattern (see `lib/stripe/server.ts:isConfigured()`); return
   `{ error: "<service>_not_configured", message: "Set <ENV_VAR> in
   Vercel env." }` with status 503.
2. **Document the env vars in `.env.example`** with the same comment
   structure other slots use (one-line description + list of
   variables + "wired but env-gated" disclaimer).
3. **Update this index** with a new row.
4. **Write a walkthrough doc** in `docs/<SERVICE>-SLOT-IN.md` if the
   slot has more than 2-3 setup steps. Use `docs/STRIPE-SLOT-IN.md`
   as the template.
5. **Capture any quirks in a skill** (`~/.claude/skills/holoflow-<name>/SKILL.md`)
   so future agents arriving at this slot have the trip-wire context.

## Why foundation-phase

The site is built up in waves of credentials-arrive-later. Wiring
the route + the UI + the persistence + the error handling first,
then slotting credentials, gives:

- A reviewable PR for the wiring without exposing keys in screenshots
- A clean 503 surface for operators who hit an unconfigured feature
- An obvious place to put new slots (this doc + the walkthroughs it
  links to)
- A clear separation between "code-complete" and "live", which
  matches Dimona's sprint cadence (build burst → credential pass →
  smoke-test → flip live)

When you arrive on a foundation-phase route and find a 503, this
doc is where you look up which env vars to add to flip it green.
