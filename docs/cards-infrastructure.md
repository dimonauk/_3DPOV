# Holo-Flow Studio — Cards platform infrastructure

This document captures every environment variable, external service, and
operational dependency needed to run the full Cards stack at
`holoflow.co.uk/c/*`, plus the optional features that activate when
specific env vars are set.

## Always-on (already provisioned)

| Service                    | Required env var(s)                       | Notes                                                                 |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Vercel hosting             | (none)                                    | Auto-deploys from `dimonauk/_3DPOV@holoflow-commerce`                 |
| Vercel Blob (public)       | `BLOB_READ_WRITE_TOKEN`                   | User-uploaded GLB/USDZ models                                         |
| Vercel Blob (private)      | `PRIVATE_BLOB_READ_WRITE_TOKEN`           | Admin media library                                                   |
| Firebase Auth + Firestore  | `FIREBASE_ADMIN_SERVICE_ACCOUNT` (JSON)   | Project `gen-lang-client-0149679024`                                  |
| Firebase Auth client       | 7× `NEXT_PUBLIC_FIREBASE_*`               | Google sign-in for `/cards/design` and `/cards/mine`                  |

All seven are set in Vercel Production + Preview + Development.

## Optional (graceful fallthrough when missing)

These features activate the moment their env vars land. None are
required for the platform to function.

### Lead notification email — `RESEND_API_KEY`

When set, every lead captured on `/c/<slug>` fires an email to the
card's `contact.email` via the Resend API. Without it, leads still
land in Firestore at `cards/<slug>/leads/<id>` and surface in
`/cards/mine/<slug>/leads`.

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_ADDRESS=Holo-Flow <leads@holoflow.co.uk>   # optional, defaults shown
```

Setup:
1. Sign up at resend.com (free tier: 100 emails/day, 3000/month).
2. Verify a sending domain — for `leads@holoflow.co.uk`, add the
   CNAME records Resend gives you to your DNS.
3. Generate an API key.
4. Add `RESEND_API_KEY` to Vercel env.

### IP-hashing salt — `IP_HASH_SALT`

**Required in production.** Salt mixed with visitor IPs before SHA-256
hashing, so we can rate-limit and dedupe without storing raw IPs.
`hashIp()` (in `lib/cards/ip-hash.ts`) throws when `NODE_ENV ===
"production"` and the var is missing — the deploy fails fast instead
of silently using a predictable salt. In development it falls back to
`holoflow-dev-only-do-not-ship`.

```
IP_HASH_SALT=<long random string, e.g. `openssl rand -hex 32`>
```

### Apple Wallet pass — five env vars

When all five are set, the `/c/<slug>` landing shows an "Add to
Apple Wallet" button on iOS/macOS Safari, and the endpoint
`/api/cards/<slug>/wallet/apple` returns a signed `.pkpass`. Without
them, the endpoint returns 503 with a friendly message and the
button stays hidden.

```
APPLE_PASS_TYPE_ID=pass.co.uk.holoflow.cards
APPLE_TEAM_ID=ABCD1234EF             # your 10-char Apple Developer Team ID
APPLE_PASS_CERT_PEM=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
APPLE_PASS_KEY_PEM=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_WWDR_CERT_PEM=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----

APPLE_PASS_KEY_PASSPHRASE=<if your private key is encrypted>
APPLE_PASS_WEB_SERVICE_URL=https://holoflow.co.uk/api/wallet/apple/v1   # optional, for pass updates
```

Setup:
1. Sign up at developer.apple.com — $99/yr Apple Developer Program.
2. In the Apple Developer portal:
   - Identifiers → "+" → Pass Type IDs → register `pass.co.uk.holoflow.cards`
   - Generate a certificate for that Pass Type ID
3. Download the Apple WWDR intermediate cert from
   https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
4. Convert all three to PEM with `openssl`:
   ```sh
   # Pass cert (from the .cer Apple gives you)
   openssl x509 -inform der -in pass.cer -out pass-cert.pem

   # Private key (from the keychain export .p12)
   openssl pkcs12 -in pass.p12 -nocerts -nodes -out pass-key.pem

   # WWDR cert
   openssl x509 -inform der -in AppleWWDRCAG3.cer -out wwdr.pem
   ```
5. Paste each PEM as a single env var in Vercel. Newlines stay literal;
   passkit-generator handles them.

## Webhook receiver targets

Set per-card from `/cards/mine/<slug>/settings`. No global env vars
needed — each card has its own webhook URL and HMAC secret in
Firestore at `cards/<slug>.webhook`.

Compatible receivers:
- **Zapier** — "Webhooks by Zapier" → "Catch Hook" trigger
- **Make.com** — Webhooks module → custom webhook
- **n8n** — Webhook node, POST
- **IFTTT** — Webhooks service, "make a web request" trigger receiver
- **Custom** — anywhere that accepts HTTPS POST + JSON body

Receivers verify the signature:
```js
// pseudocode
const expected = "sha256=" + hmacSha256(secret, `${timestamp}.${body}`);
if (constantTimeEquals(req.headers["x-holoflow-signature"], expected)) {
  // trusted — process the event
}
```

## Firestore composite indexes

Required for the analytics + leads queries:

```
cards/{slug}/events   orderBy: at DESC
cards/{slug}/leads    orderBy: at DESC
cards/{slug}/webhook-log   orderBy: at DESC
```

Subcollection single-field indexes are auto-created. The composite
on `(ownerUid ASC, updatedAt DESC)` for the main `cards/{slug}` doc
is in `firestore.indexes.json` and was deployed via
`firebase deploy --only firestore:indexes`.

## Deployment commands

Push the code → Vercel auto-builds.

```sh
cd D:\The_Hangar\.merge-staging\_3DPOV
git push origin holoflow-commerce
git push hfs holoflow-commerce:main
```

Deploy Firestore rules:
```sh
firebase deploy --only firestore:rules --project gen-lang-client-0149679024
```

Deploy Firestore indexes (only when `firestore.indexes.json` changes):
```sh
firebase deploy --only firestore:indexes --project gen-lang-client-0149679024
```

## Quick verification after deploy

1. `holoflow.co.uk/c/protean-apex` — landing renders, branded QR
   visible, "Save to wallet" and "Add to Apple Wallet" (if iOS +
   configured) buttons present, lead form collapsed.
2. `holoflow.co.uk/wallet` — empty state on first visit; save a
   card from `/c/<slug>`, refresh, see it appear.
3. Sign in → `/cards/mine` — Analytics, Leads, Settings buttons
   on every card tile.
4. `/cards/mine/<your-slug>/settings` — webhook form renders.
   Save a Zapier "Catch Hook" URL, click "Send test event", verify
   it lands in Zapier.
5. `/cards/mine/<your-slug>/analytics` — view counts increase as
   you scroll `/c/<slug>` in another tab.
6. Submit a lead via `/c/<slug>` form → check `/cards/mine/<slug>/leads`
   shows it; check email arrives (if `RESEND_API_KEY` set); check
   the webhook fired (if URL set).

## Feature ↔ pricing map (2026 market)

| Capability                            | Competitor → list price       | Holo-Flow status  |
| ------------------------------------- | ------------------------------ | ----------------- |
| Scan analytics + UTM source           | Uniqode → $49/mo               | ✓ built-in        |
| Country/device breakdown              | Uniqode → $99/mo               | ✓ built-in        |
| Lead capture + CRM export             | Blinq → $5-15/user/mo          | ✓ CSV + Resend    |
| Editable-after-print URLs             | Universal across category      | ✓ /cards/mine     |
| Personal wallet of saved cards        | V1CE → $197 flat               | ✓ /wallet         |
| Webhooks + Zapier bridge              | Uniqode Plus → $99/mo          | ✓ /settings       |
| Apple Wallet pass                     | Popl Premium tier              | ✓ env-gated       |
| Branded QR per card                   | Flowcode → $60/mo              | ✓ qr-code-styling |
| Batch QR / print-run tracking         | Uniqode Plus → $99/mo          | ✓ batch script    |
| HMAC-signed delivery                  | Uniqode Enterprise             | ✓ built-in        |
| WebXR + hand-locked AR                | No commercial competitor       | ✓ unique          |
| AR scene recording                    | No commercial competitor       | ✓ MediaRecorder   |
| WebXR plane visualisation             | No commercial competitor       | ✓ ARCore planes   |
| Multi-card per user                   | Blinq team plans               | ✓ /cards/design   |

Where the table says "✓ unique" or "no commercial competitor", those
are the Holo-Flow specific features that don't exist in the AR
business card or QR code space.
