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
required for the platform to function — every endpoint returns a
friendly 503 with setup instructions when its env vars aren't set,
and the UI hides the corresponding buttons.

### Anthropic AI — `ANTHROPIC_API_KEY`

Single env var unlocks four features:

- **AI Universal Scanner** — photo of a paper card → autofill the
  designer form (`/cards/design`).
- **AI Contact Enrichment** — click 🪄 on any lead in
  `/cards/mine/<slug>/leads` to infer company / industry / role /
  talking points from the email + name.
- Activates the moment the env var lands; no other config needed.

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

Setup: console.anthropic.com → API Keys → create. Holo-Flow Studio
has credits provisioned from 17 May 2026.

### Resend — `RESEND_API_KEY`

When set, every lead captured on `/c/<slug>` fires an email to the
card's `contact.email` via the Resend API. Without it, leads still
land in Firestore at `cards/<slug>/leads/<id>` and surface in
`/cards/mine/<slug>/leads`.

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_ADDRESS=Holo-Flow <leads@holoflow.co.uk>   # optional
```

Setup:
1. Sign up at resend.com (free tier: 100 emails/day, 3000/month).
2. Verify a sending domain — add Resend's CNAME records to DNS.
3. Generate an API key.
4. Add `RESEND_API_KEY` to Vercel env.

### IP-hashing salt — `IP_HASH_SALT`

Optional salt mixed with visitor IPs before SHA-256 hashing. Without
it, the default constant is used (fine but predictable). Setting it
to a long random string adds defence against rainbow-table
correlation across deployments.

```
IP_HASH_SALT=<any 32+ char random string>
```

### Apple Wallet pass — five env vars

When all five are set, `/c/<slug>` on iOS/macOS Safari shows
"Add to Apple Wallet" and `/api/cards/<slug>/wallet/apple` returns
a signed `.pkpass`. Without them, the endpoint returns 503 with a
friendly message and the button stays hidden.

```
APPLE_PASS_TYPE_ID=pass.co.uk.holoflow.cards
APPLE_TEAM_ID=ABCD1234EF              # your 10-char Apple Developer Team ID
APPLE_PASS_CERT_PEM=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
APPLE_PASS_KEY_PEM=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_WWDR_CERT_PEM=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----

APPLE_PASS_KEY_PASSPHRASE=<if your private key is encrypted>
APPLE_PASS_WEB_SERVICE_URL=https://holoflow.co.uk/api/wallet/apple/v1   # optional
```

Setup (~30 min, $99/yr):
1. Sign up at developer.apple.com — $99/yr Apple Developer Program.
2. Identifiers → "+" → Pass Type IDs → register
   `pass.co.uk.holoflow.cards`.
3. Generate a certificate for that Pass Type ID.
4. Download Apple WWDR intermediate cert from
   https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer.
5. Convert all three to PEM with `openssl`:
   ```sh
   openssl x509 -inform der -in pass.cer -out pass-cert.pem
   openssl pkcs12 -in pass.p12 -nocerts -nodes -out pass-key.pem
   openssl x509 -inform der -in AppleWWDRCAG3.cer -out wwdr.pem
   ```
6. Paste each PEM as a single env var in Vercel.

### Google Wallet pass — four env vars

When all four are set, `/c/<slug>` on Android / Chrome desktop shows
"Add to Google Wallet" and `/api/cards/<slug>/wallet/google` returns
a signed JWT save URL. Combined with Apple Wallet, this covers
every wallet platform.

```
GOOGLE_WALLET_ISSUER_ID=3388000000022123456    # numeric, from Google Pay & Wallet Console
GOOGLE_WALLET_CLASS_ID=<issuerId>.holoflow_business_card
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=sa@<project>.iam.gserviceaccount.com
GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

Setup (~20 min, free):
1. Sign up at pay.google.com/business/console as a Wallet issuer.
2. Get your numeric Issuer ID from the console.
3. Create a Pass Class via the API or console:
   - Type: `genericClass`
   - ID: `<issuerId>.holoflow_business_card`
4. Create a service account in Google Cloud Console with the role
   "Wallet Object Issuer".
5. Generate a JSON key for the service account, paste the
   `client_email` and `private_key` into Vercel env vars.

Note: when pasting the private key into Vercel, newlines are usually
shown as `\n` escape sequences in the JSON export. The Wallet
library auto-converts those to real newlines before signing.

## Webhook receiver targets

Set per-card from `/cards/mine/<slug>/settings`. No global env vars
needed — each card has its own webhook URL and HMAC secret in
Firestore at `cards/<slug>.webhook`.

Compatible receivers:
- **Zapier** — "Webhooks by Zapier" → "Catch Hook" trigger
- **Make.com** — Webhooks module → custom webhook
- **n8n** — Webhook node, POST
- **IFTTT** — Webhooks service, "make a web request" trigger
- **Custom** — anywhere that accepts HTTPS POST + JSON body

Receivers verify the signature:
```js
const expected = "sha256=" + hmacSha256(secret, `${timestamp}.${body}`);
if (constantTimeEquals(req.headers["x-holoflow-signature"], expected)) {
  // trusted — process the event
}
```

## Firestore composite indexes

Required for the analytics + leads queries:

```
cards/{slug}/events       orderBy: at DESC
cards/{slug}/leads        orderBy: at DESC
cards/{slug}/webhook-log  orderBy: at DESC
cards/{slug}/audit        orderBy: at DESC
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

## Quick verification after deploy

1. `holoflow.co.uk/c/protean-apex` — landing renders, branded QR
   visible, both Wallet buttons (iOS / Android) appear when their
   env vars are set, lead form collapsed.
2. `holoflow.co.uk/wallet` — empty state on first visit.
3. Sign in → `/cards/mine` — Analytics, Leads, Settings, Embed,
   Signature, Backgrounds buttons on every tile, plus "+ Design a
   new card" and "📥 Bulk import CSV" at the bottom.
4. `/cards/mine/<your-slug>/settings` — webhook form, "Send test"
   button, delivery log.
5. `/cards/mine/<your-slug>/analytics` — view counts increase as
   you scroll `/c/<slug>` in another tab.
6. `/cards/mine/<your-slug>/leads` — fill the form once at
   `/c/<slug>`, see it appear, click 🪄 Enrich (works once
   `ANTHROPIC_API_KEY` is set).
7. `/cards/mine/<your-slug>/backgrounds` — three variants × three
   resolutions, all download as PNG.
8. `/cards/mine/import` — drop a CSV with name+role columns,
   import creates N cards.

## Feature ↔ pricing map (May 2026)

| Capability                            | Competitor → list price         | Holo-Flow status  |
| ------------------------------------- | -------------------------------- | ----------------- |
| Scan analytics + UTM source           | Uniqode → $49/mo                 | ✓ built-in        |
| Country/device breakdown              | Uniqode → $99/mo                 | ✓ built-in        |
| Lead capture + CRM export             | Blinq → $5-15/user/mo            | ✓ CSV + Resend    |
| Editable-after-print URLs             | Universal across category        | ✓ /cards/mine     |
| Personal wallet of saved cards        | V1CE → $197 flat                 | ✓ /wallet         |
| Webhooks + Zapier bridge              | Uniqode Plus → $99/mo            | ✓ /settings       |
| Apple Wallet pass                     | Popl Premium tier                | ✓ env-gated       |
| Google Wallet pass                    | Popl Premium tier                | ✓ env-gated       |
| Branded QR per card                   | Flowcode → $60/mo                | ✓ qr-code-styling |
| Batch QR / print-run tracking         | Uniqode Plus → $99/mo            | ✓ batch script    |
| HMAC-signed webhook delivery          | Uniqode Enterprise               | ✓ built-in        |
| Multi-card per user                   | Blinq team plans                 | ✓ /cards/design   |
| Bulk CSV card import                  | Uniqode Plus / Enterprise        | ✓ /cards/mine/import |
| Embed widget                          | Blinq feature                    | ✓ /c/[slug]/embed |
| Email signature generator             | Blinq Free / V1CE Premium        | ✓ /signature      |
| Calendar embed                        | Universal feature                | ✓ optional field  |
| AI Universal Scanner                  | Blinq Premium → $7.33/mo         | ✓ env-gated       |
| AI Contact Enrichment                 | Blinq Premium → $7.33/mo         | ✓ env-gated       |
| Card templates library                | Blinq Premium                    | ✓ 9 templates     |
| Virtual backgrounds                   | Blinq Free / V1CE Premium        | ✓ 3 variants × 3 resolutions |
| WebXR hit-test AR                     | No commercial competitor         | ✓ unique          |
| Hand-locked MediaPipe AR              | No commercial competitor         | ✓ unique          |
| AR scene recording                    | No commercial competitor         | ✓ MediaRecorder   |
| Gaussian Splatting viewer             | No commercial competitor         | ✓ unique          |
| VRM companion avatar                  | No commercial competitor         | ✓ unique          |
| GLB upload + USDZ auto-conversion     | No commercial competitor         | ✓ three.js exporter |

Where the table says "✓ unique" or "no commercial competitor", those
are the Holo-Flow specific features that don't exist elsewhere in
the AR business card or QR code space.
