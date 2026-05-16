# Vercel environment-variable inventory

Single source of truth for every environment variable Holoflow Studio
reads at runtime or build time. Scanned from the codebase under
`D:/.github/_3DPOV/` plus the bench-side `splat360` config that Vercel
forwards over Tailscale.

If you add a new `process.env.X` read anywhere in the codebase, add a
row here at the same time. The typed accessor in `lib/env.ts` and the
operator-facing `.env.example` should mirror this list.

---

## How to set on Vercel

The site uses the Vercel CLI for all env management. **Never** commit
`.env.local`. Production secrets live only in Vercel Project Settings.

```bash
# Add to a specific environment (production / preview / development)
vercel env add <NAME> production
vercel env add <NAME> preview
vercel env add <NAME> development

# List everything currently set on the project
vercel env ls

# Remove a var from one environment
vercel env rm <NAME> production

# Pull the current preview/dev set into a local .env.local for dev parity
vercel env pull .env.local
```

For multi-line secrets (e.g. PEM blocks, JSON service-account keys) use
`vercel env add <NAME> production < path/to/secret.txt` to avoid quoting
hell in the terminal. The Firebase admin JSON in particular must be a
single line — `lib/firebase/admin.ts` un-escapes `\n` inside the
private key at load time.

The project is managed with **pnpm**; the `vercel` CLI is invoked via
`pnpm dlx vercel <subcommand>` if it is not installed globally.

---

## 1. Core platform

Vercel-injected and site-wide identity vars.

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `VERCEL_PROJECT_PRODUCTION_URL` | server | injected by Vercel | `lib/utils.ts` (base URL for OG, sitemaps, absolute links) | Auto-set on every deploy. Do not override. |
| `VERCEL_URL` | server | injected by Vercel | `docs/vercel-setup.md` (referenced for preview URLs) | Auto-set on every deploy. |
| `NODE_ENV` | both | `development` / `production` | `lib/firebase/client.ts` (toggles App Check debug token) | Standard Node convention; set by Vercel. |
| `CI` | server | unset locally, set on Vercel | `vitest.config.ts` (toggles JUnit reporter) | Vercel injects this in build. |
| `PUBLIC_BASE_URL` | server | `https://holoflow.co.uk` | `app/api/cards/[slug]/wallet/apple/route.ts`, `scripts/ar-generate-qr.mjs`, `scripts/ar-generate-batch-qr.mjs` | Canonical site origin for AR card QR codes and Apple Wallet pass URLs. |
| `PUBLIC_DOMAIN` | server | `holoflow.co.uk` | `app/api/cards/[slug]/vcard/route.ts` | Bare hostname for vCard URL field. |
| `NEXT_PUBLIC_HOLO_WALK_ORIGIN` | client | `https://holoflow.co.uk` | `lib/holo-walk/qr.ts` | Origin baked into HoloWalk plaque QR codes. |
| `NEXT_PUBLIC_HOLOFLOW_DESKTOP_URL` | client | unset | `lib/studio/desktop.ts` | Override for the HoloFlow Desktop companion app discovery URL. |
| `HOLOFLOW_BASE_URL` | server (test only) | `http://localhost:3000` | `tests/e2e/run-sweep.mjs` | Base URL for the Playwright sweep. |
| `SITE_NAME` | server | `Holo-Flow Studio` | `components/icons/logo.tsx` | Branding string in the logo `aria-label`. |
| `COMPANY_NAME` | server | `Holo-Flow Studio` | `docs/vercel-setup.md` (referenced) | Branding string for footer / metadata. |
| `LOG_LEVEL` | both | `info` | `lib/log/index.ts` | One of `debug`, `info`, `warn`, `error`. Set per-environment; production usually `info`, preview `debug`. |

---

## 2. Firebase / Auth

Firebase web SDK config (intentionally public — security comes from
Firestore Rules, not key secrecy) plus the server-only admin
credentials.

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | client | **required** for Firebase | `lib/firebase/client.ts` | Browser Firebase SDK init. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | client | required | `lib/firebase/client.ts` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | client | required | `lib/firebase/client.ts` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | client | required | `lib/firebase/client.ts` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | client | required | `lib/firebase/client.ts` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | client | required | `lib/firebase/client.ts` | |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | client | optional | `.env.example` only | Google Analytics measurement id; site does not currently read it from code. |
| `NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY` | client | optional | `lib/firebase/client.ts` | Enables App Check via reCAPTCHA v3 when set. |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` | client | optional (dev only) | `lib/firebase/client.ts` | When set in dev, registers an App Check debug token so localhost passes App Check enforcement. Never set in production. |
| `NEXT_PUBLIC_FIREBASE_FUNCTIONS_BASE` | client | optional | `lib/firebase/functions.ts` | Override base URL for callable Cloud Functions. |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | server | optional | `lib/firebase/admin.ts`, `app/api/chrono-protocol/score/route.ts`, `app/api/chrono-protocol/leaderboard/route.ts`, `app/api/play/progress/route.ts` | Single-line JSON of the service-account key. Required for any admin-SDK write path (operator import, leaderboard writes, progress sync). When unset, the routes degrade gracefully (return 503 or no-op). |
| `FIREBASE_ADMIN_PROJECT_ID` | server | optional | `lib/firebase/admin.ts` | Explicit project id for Workload Identity Federation when ADC can't derive it. |
| `GOOGLE_APPLICATION_CREDENTIALS` | server | injected by Vercel Google Cloud integration | `lib/firebase/admin.ts` | File path to the ADC config. Presence flips admin.ts to `applicationDefault()` instead of the JSON-key path. |
| `GOOGLE_CLOUD_PROJECT` / `GCP_PROJECT` / `GCLOUD_PROJECT` | server | injected by Vercel Google Cloud integration | `lib/firebase/admin.ts` | Fallback chain for the WIF project id. |

---

## 3. AI providers

LLM (chat + image + video + 3D gen) and TTS providers. All server-only;
no AI keys are exposed to the client. The site routes everything
through `lib/env.ts` (typed accessor) and `lib/llm/gateway.ts` (model
selection).

### Google AI (Gemini, Imagen, Veo)

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `GOOGLE_AI_API_KEY` | server | optional (graceful fallback) | `lib/aura/gemini.ts`, `lib/capabilities/agent/dialogue.ts`, `lib/capabilities/agent/banter.ts` | Aura's chat / banter brain. Without it, both capabilities return a polite "(brain is offline)" fallback and the cast stays mute. |
| `GOOGLE_AI_API_KEY_GEN` | server | optional | `lib/env.ts` (`googleGenApiKey()`) | Separate key for image / video / mesh generation, billed against a different GCP project. Preferred over `GOOGLE_AI_API_KEY` by the gen routes when set. |
| `GOOGLE_AI_PROJECT_ID` | server | optional | declared in `lib/env.ts` | For Vertex-style routing if/when wired. |
| `GOOGLE_AI_MODEL` | server | `gemini-2.5-flash` | `lib/capabilities/agent/banter.ts`, `lib/capabilities/agent/dialogue.ts` | Override default chat model. |
| `GOOGLE_IMAGEN_MODEL` | server | provider default | declared in `lib/env.ts` | Imagen model override. |
| `GOOGLE_IMAGE_EDIT_MODEL` | server | provider default | declared in `lib/env.ts` | Gemini image-edit model override. |
| `GOOGLE_VEO_MODEL` | server | provider default | declared in `lib/env.ts` | Veo video-gen model override. |
| `GEMINI_API_KEY` | (historic) | n/a | `app/atelier/co-drawing/PURPOSE.md`, `app/atelier/pattern-prototype/pattern-prototype-client.tsx` (comments) | **Not actually read** — referenced only in comments documenting the migration away from client-side keys. The current code uses `GOOGLE_AI_API_KEY` via server routes. |

### AI Gateway / direct Anthropic / Z.ai / OpenAI

The Vercel AI Gateway is the preferred path — one team key, any model.
When unset, the helper falls back to direct provider keys.

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `AI_GATEWAY_API_KEY` | server | optional (preferred) | `lib/llm/gateway.ts` | Vercel AI Gateway team key. Single auth header for any model. |
| `ANTHROPIC_API_KEY` | server | optional fallback | `lib/llm/gateway.ts` | Direct Anthropic API key — used only when the gateway key is absent. |
| `ZAI_API_KEY` | server | optional fallback | `lib/llm/gateway.ts` | Direct Z.ai API key — used only when the gateway key is absent. |
| `LLM_DEFAULT_AGENT_PROVIDER` | server | provider-chooser default | declared in `lib/env.ts` | One of `gemini` \| `anthropic` \| `zai`. Aura's chat picks this each turn unless the caller passes `provider:` explicitly. |
| `LLM_ANTHROPIC_MODEL` | server | `anthropic/claude-sonnet-4-7` | `lib/llm/gateway.ts` | Default Anthropic model. |
| `LLM_ZAI_MODEL` | server | `zai/glm-4.5-air` | `lib/llm/gateway.ts` | Default Z.ai model. |
| `LLM_OPENAI_MODEL` | server | `openai/gpt-4o-mini` | `lib/llm/gateway.ts` | Default OpenAI model when routed via gateway. |

### TTS providers (ElevenLabs + local)

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `ELEVENLABS_API_KEY` | server | optional | `lib/capabilities/audio/tts-providers/elevenlabs.ts` | Studio-quality voice for Aura. Without it, `audio.tts` falls back to the browser Web Speech API. |
| `ELEVENLABS_DEFAULT_VOICE_ID` | server | optional | declared in `lib/env.ts` | Default voice ID for ElevenLabs calls. |
| `KOKORO_BASE_URL` | server | `http://localhost:8888` | declared in `lib/env.ts` | Override host for the local Kokoro TTS service (the Hangar VRM AI bridge). |
| `F5_BASE_URL` | server | `http://localhost:8000` | declared in `lib/env.ts` | Override host for the local F5-TTS service. |

### Splat / 3D providers (Luma + research)

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `LUMA_API_KEY` | server | optional (route returns 503 if missing) | `lib/capabilities/viz/splat-providers/luma-genie.server.ts` | Luma Genie 3D-from-text key. |
| `LUMA_API_URL` | server | `https://api.lumalabs.ai` | `lib/capabilities/viz/splat-providers/luma-genie.server.ts` | Override only if Luma changes API base. |

---

## 4. Bench bridges (Tailscale → Sovereign-PC)

These are how the Vercel deploy reaches GPU services running on the
bench. Pattern: Tailscale Funnel exposes the service at
`<name>.tail99b2a4.ts.net`; a shared bearer token authenticates the
Vercel function as the legitimate caller. See
`holoflow-bench-bridge` skill for the deployment recipe.

Every bench bridge follows the same `*_SERVICE_URL` + `*_AUTH_TOKEN`
naming, and every server impl is the `*.server.ts` half of a capability.

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `SHARP_ONNX_SERVICE_URL` | server | `http://localhost:7845` | `lib/capabilities/viz/splat-providers/sharp-onnx.server.ts` | SHARP single-image-to-splat bench service. |
| `SHARP_ONNX_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/splat-providers/sharp-onnx.server.ts` | Shared bearer for the SHARP service. |
| `SHARP_SERVICE_URL` | server | declared in `lib/env.ts` | declared only | Older naming (kept in env type union for migration); current code uses `SHARP_ONNX_SERVICE_URL`. |
| `SHARP_VIDEO_SERVICE_URL` | server | declared in `lib/env.ts` | declared only | SHARP video-to-4D service (commerce.sharp-video-job, not yet wired through `*.server.ts`). |
| `SPLAT_VIDEO_SERVICE_URL` | server | `http://localhost:7846` | `lib/capabilities/viz/splat-providers/hangar-gsplat.server.ts` | Video-to-3D-splat bench service (pinhole video → gsplat .ply). |
| `SPLAT_VIDEO_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/splat-providers/hangar-gsplat.server.ts`, splat360 `config.py` (`video_3d_auth_token`) | Shared bearer; same token must be set on both Vercel and the bench. |
| `SPLAT_4D_SERVICE_URL` | server | `http://localhost:7847` | `lib/capabilities/viz/splat-providers/hangar-4dgs.server.ts` | Video-to-4D-splat bench service (4DGaussians temporal fit). |
| `SPLAT_4D_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/splat-providers/hangar-4dgs.server.ts`, splat360 `config.py` (`video_4d_auth_token`) | Shared bearer. |
| `TRIPOSR_SERVICE_URL` | server | `http://localhost:8390` (DEFAULT_SERVICE_URL in source) | `lib/capabilities/viz/image-to-3d.server.ts` | TripoSR image-to-mesh bench service. |
| `TRIPOSR_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/image-to-3d.server.ts`, splat360 `config.py` (`triposr_auth_token`) | Shared bearer. |
| `TRELLIS_SERVICE_URL` | server | `http://localhost:8390` (DEFAULT_SERVICE_URL in source) | `lib/capabilities/viz/text-to-3d.server.ts` | TRELLIS text/image-to-mesh bench service. |
| `TRELLIS_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/text-to-3d.server.ts`, splat360 `config.py` (`trellis_auth_token`) | Shared bearer. |
| `SPLAT360_SERVICE_URL` | server | `http://localhost:8390` | `lib/capabilities/viz/thumbnail-providers/splat-real.server.ts` | 360-splat thumbnail-render bench service. |
| `SPLAT360_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/thumbnail-providers/splat-real.server.ts`, splat360 `config.py` (`thumbnail_auth_token`) | Shared bearer. |
| `MESH_SERVICE_URL` | server | declared in `lib/env.ts` | declared only | InstantMesh service (commercial-safe alternative to SHARP). Not yet wired through `*.server.ts`. |
| `COMFYUI_URL` | server | `http://localhost:8188` | `app/api/comfy-layered/[...path]/route.ts` | ComfyUI base URL for the layered-generation proxy route. |
| `COMFYUI_SERVICE_URL` | server | `http://localhost:8188` | `lib/capabilities/viz/generate-comfyui.server.ts` | ComfyUI base for the capability path. The route var and the capability var are deliberately separate — the route was bench-prototype-era; consolidate when convenient. |
| `COMFYUI_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/viz/generate-comfyui.server.ts` | Shared bearer for ComfyUI. |
| `OLLAMA_SERVICE_URL` | server | `http://localhost:11434` | `lib/capabilities/agent/dialogue-ollama.server.ts` | Ollama base for the local-LLM dialogue path. |
| `OLLAMA_AUTH_TOKEN` | server | empty (auth disabled) | `lib/capabilities/agent/dialogue-ollama.server.ts` | Shared bearer for Ollama bridge. |

### Bench-side companion (`splat360` service)

The bench-side FastAPI service at
`D:/The_Hangar/engines/splat360/src/splat360/config.py` reads these
directly. The shared bearer tokens above MUST match on both sides.
The other vars below tune bench behaviour and are set in the
**bench's** `.env`, not Vercel — listed here for completeness.

`SPLAT360_WORK`, `SPLAT360_OUT`, `SPLAT360_FFMPEG`, `SPLAT360_EXIFTOOL`,
`SPLAT360_COLMAP`, `SPLAT360_GLOMAP`, `SPLAT360_BRUSH`, `SPLAT360_GPU`,
`SPLAT360_TRAIN_TIMEOUT`, `SPLAT360_MAX_IMAGES`,
`SPLAT360_VIDEO_3D_WORK`, `SPLAT360_VIDEO_3D_MAX_UPLOAD_MB`,
`SPLAT360_VIDEO_3D_MAX_DURATION_SECONDS`, `SPLAT360_VIDEO_3D_FAKE`,
`SPLAT360_VIDEO_4D_WORK`, `SPLAT360_VIDEO_4D_MAX_UPLOAD_MB`,
`SPLAT360_VIDEO_4D_MAX_DURATION_SECONDS`, `SPLAT360_VIDEO_4D_FAKE`,
`TRIPOSR_INSTALL_ROOT`, `TRIPOSR_PYTHON`, `TRIPOSR_WORK_ROOT`,
`TRIPOSR_TIMEOUT_SECONDS`, `TRIPOSR_FAKE`,
`TRELLIS_INSTALL_ROOT`, `TRELLIS_PYTHON`, `TRELLIS_WORK_ROOT`,
`TRELLIS_TIMEOUT_SECONDS`, `TRELLIS_FAKE`,
`SPLAT360_THUMBNAIL_BACKEND`, `SPLAT360_THUMBNAIL_TIMEOUT_SECONDS`.

---

## 5. Commerce / 3rd party

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | server | **required** | `lib/shopify/_internal.ts`, `lib/shopify-policies.ts`, `lib/utils.ts` | The myshopify.com domain (or custom). Build fails without it. |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | server | **required** | `lib/shopify/_internal.ts` | Storefront API token. Build fails without it. |
| `SHOPIFY_REVALIDATION_SECRET` | server | required for webhooks | `app/api/revalidate/route.ts` | Shopify webhook → revalidation route shared secret. |
| `SHOPIFY_WEBHOOK_HMAC_SECRET` | server | optional | `app/api/revalidate/route.ts` | Optional HMAC verification on Shopify webhook bodies. |
| `SHOPIFY_VENDOR_METAOBJECT_HANDLE` | server | optional | `lib/print-vendors/shopify-source.ts` | Metaobject handle for print-vendor catalog. |
| `NEXT_PUBLIC_KLAVIYO_COMPANY_ID` | client | optional | `components/analytics/klaviyo.tsx` | Klaviyo on-site tracking. No-op until set. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | client | optional | `components/analytics/plausible.tsx` | Plausible analytics domain. No-op until set. |
| `RESEND_API_KEY` | server | optional | `lib/rookery/mailer.ts`, `lib/cards/leads-server.ts`, `app/api/rookery/onboarding/route.ts` | Resend transactional email API key. |
| `RESEND_FROM_ADDRESS` | server | `Holo-Flow <leads@holoflow.co.uk>` | `lib/cards/leads-server.ts` | From-address for lead notification mails. |
| `EMAIL_PROVIDER` | server | unset | `lib/rookery/mailer.ts`, `app/api/rookery/onboarding/route.ts` | Provider selector (e.g. `resend`). |
| `EMAIL_FROM` | server | falls back to a hard-coded default in `mailer.ts` | `lib/rookery/mailer.ts` | From-address for Rookery (members) mail. |
| `EMAIL_REPLY_TO` | server | falls back to a hard-coded default | `lib/rookery/mailer.ts` | Reply-to for Rookery mail. |
| `ORDER_FROM_EMAIL` | server | required at call-site | `app/api/contact/route.ts` | From-address for contact-form forwards. |
| `CONTACT_INBOX_EMAIL` | server | optional | declared in `lib/env.ts` | Inbox the contact form forwards to. |

### Apple Wallet (`.pkpass` AR cards)

All required together when issuing Apple Wallet passes.

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `APPLE_PASS_TYPE_ID` | server | required | `lib/wallet/apple-pkpass.ts` | Pass type identifier (reverse-DNS). |
| `APPLE_TEAM_ID` | server | required | `lib/wallet/apple-pkpass.ts` | Apple developer team id. |
| `APPLE_PASS_CERT_PEM` | server | required | `lib/wallet/apple-pkpass.ts` | Signing cert PEM. |
| `APPLE_PASS_KEY_PEM` | server | required | `lib/wallet/apple-pkpass.ts` | Signing key PEM. |
| `APPLE_WWDR_CERT_PEM` | server | required | `lib/wallet/apple-pkpass.ts` | Apple WWDR intermediate cert PEM. |
| `APPLE_PASS_KEY_PASSPHRASE` | server | optional | `lib/wallet/apple-pkpass.ts` | Passphrase if the signing key is encrypted. |
| `APPLE_PASS_WEB_SERVICE_URL` | server | optional | `lib/wallet/apple-pkpass.ts` | Optional pass-update web service URL. |

### Vercel Blob (operator media uploads)

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | server | injected when Blob store is enabled in Vercel | `app/api/cards/upload-glb/route.ts`, `app/api/cards/upload-usdz/route.ts`, `lib/capabilities/media/library-blob.ts`, `scripts/cards-bulk-upload.mjs` | Auto-injected by Vercel; routes return 503 if missing. |
| `PRIVATE_BLOB_READ_WRITE_TOKEN` | server | optional | `lib/capabilities/media/library-blob.ts` | Second token for a private-bucket Blob store, when separation is needed. |

### Sanity CMS

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | client | optional (presence enables Sanity) | `lib/sanity/client.ts`, `sanity/sanity.config.ts`, `app/studio/[[...tool]]/page.tsx` | Sanity project id. |
| `NEXT_PUBLIC_SANITY_DATASET` | client | `production` | `lib/sanity/client.ts`, `sanity/sanity.config.ts`, `app/studio/[[...tool]]/page.tsx` | Sanity dataset name. |
| `SANITY_API_READ_TOKEN` | server | optional | `lib/sanity/client.ts` | Read token for draft / private content. |
| `SANITY_REVALIDATE_SECRET` | server | required for revalidation webhook | `app/api/sanity/revalidate/route.ts` | Sanity webhook shared secret. |

### Google OAuth (operator import flows)

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | server | required for `/admin/import/google/*` | `lib/integrations/google/oauth.ts`, `app/api/admin/import/google/start/route.ts` | Google OAuth client id (Photos Picker + Drive scopes). |
| `GOOGLE_OAUTH_CLIENT_SECRET` | server | required for `/admin/import/google/*` | `lib/integrations/google/oauth.ts`, `app/api/admin/import/google/start/route.ts` | OAuth client secret. |
| `GOOGLE_OAUTH_REDIRECT_URI` | server | derived from request origin | `app/api/admin/import/google/start/route.ts` | Optional explicit override. |
| `NEXT_PUBLIC_DRIVE_API_KEY` | client | optional | `lib/integrations/google/drive.ts` | Public Google Drive API key for picker UI. |

### Map tiles & external assets

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_MAPLIBRE_TILES_URL` | client | open OSM raster fallback | `app/holo-walk/holo-walk-map-client.tsx` | Tile URL for HoloWalk map. Falls back to public OSM tiles (rate-limited, not for production). |
| `NEXT_PUBLIC_MODEL_BASE_URL` | client | `""` (relative) | `lib/three-d.ts` | CDN base URL for product GLB files. When unset, models resolve under `/models/{handle}.glb` from `public/models/`. |

---

## 6. Logging / observability

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `LOG_LEVEL` | both | `info` | `lib/log/index.ts` | One of `debug`, `info`, `warn`, `error`. |
| `CI` | server | unset / set by Vercel | `vitest.config.ts` | Selects the JUnit reporter for test runs. |

Vercel's own runtime logs are accessed via the dashboard or
`vercel logs <deployment>` — no env vars required.

---

## 7. Other

| Name | Scope | Default | Used in | Notes |
|---|---|---|---|---|
| `IP_HASH_SALT` | server | `holoflow-default-salt` | `lib/cards/leads-server.ts`, `lib/cards/analytics-server.ts` | Salt for hashing visitor IPs in AR card analytics (privacy: we store the hash, not the IP). Override in production with a long random string. |
| `ROLLUP_WATCH` | build | unset | `services/softxels/rollup.config.js`, `services/softxels/example/rollup.config.js` | Rollup internal — toggles minification in the softxels sub-package. |
| `SKIP_MIND` | script | unset | `scripts/ar-build-all.mjs` | When `1`, skips the mind-ar target compile in the AR build script. |
| `SHARP_SERVICE_URL`, `SHARP_VIDEO_SERVICE_URL`, `MESH_SERVICE_URL` | server | declared in `lib/env.ts` | declared only, no server impl yet | Reserved for forthcoming SHARP-photo, SHARP-video, and InstantMesh bench bridges. |

---

## Currently unset on this Vercel project (gaps)

<!--
TODO operator:
Run `vercel env ls` from D:/.github/_3DPOV/ and paste the diff between
this inventory and what's actually set on the project. Mark each gap as
one of:
  - intentional (e.g. ANTHROPIC_API_KEY is unset because we route via
    AI_GATEWAY_API_KEY)
  - missing-and-blocking (a required var is genuinely absent — flag for
    immediate set)
  - missing-and-degraded (an optional var that disables a feature — note
    which feature)
The aim is for someone reading this section to know within 10 seconds
which surfaces of the site are dark on production.
-->

(awaiting first `vercel env ls` run)
