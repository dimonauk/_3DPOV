# Tech stack + architecture overview

What the studio runs on and why. Pair with `docs/ARCHITECTURE.md`
(the four canonical rules) and `AGENTS.md` (orientation).

---

## Render + hosting

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15.6.0-canary.60** — App Router, Server Components | Pinned to canary for PPR + useCache + `cacheLife` access |
| Bundler | **Turbopack** (`next build --turbopack`) | The default; we don't run the webpack code path |
| Experiments | `experimental.ppr = true` + `experimental.useCache = true` | Partial Prerendering + the new caching primitive |
| Runtime | Vercel Functions (Fluid Compute), Node.js 24 LTS | Default 300s function timeout |
| Hosting | **Vercel**, production from branch `main` → `holoflow.co.uk` | Project `prj_OL8EhE56VIv8tu88mbNReC4rzy19`, team `dimonauk-9379s-projects` |
| Package manager | **`pnpm`** (lockfile is `pnpm-lock.yaml`) | Never `npm`. Vercel runs `pnpm install --frozen-lockfile`. |
| Language | TypeScript strict | `pnpm exec tsc --noEmit` must exit 0 |
| Styling | Tailwind CSS + custom `chrome-*` utilities | Tokens in `app/globals.css` |
| Fonts | `next/font/google` — Cormorant Garamond (display), Inter (body), JetBrains Mono | Pre-loaded, swap-on-display |

### Render pipeline (canon as of 2026-05-22)

The page convention under PPR is **sync shell + async Suspense
children**. After the recent canary debugged the wrong way:

- **No `export const dynamic = "force-dynamic"`** on page.tsx. It
  causes 200 + zero-body hangs in this Next/Turbopack/PPR combo.
- The default page export is a **synchronous function**. Even if
  the page reads a Promise prop like `searchParams` or `params`, pass
  the Promise down into a Suspense child and await it there. An async
  parent component blocks the streaming SSR flush.
- Async data fetches live in **child async server components**
  wrapped in `<Suspense fallback={…}>`. The shell streams immediately;
  data fills in.
- Reference shapes: `app/page.tsx` (top-of-file comment explains it),
  `app/aerial/page.tsx`, `app/drops/page.tsx`, `app/news/page.tsx`.

API route handlers can use `export const dynamic = "force-dynamic"`
freely — that's only a problem on page.tsx files.

---

## Data + storage

| System | Used for | Env / config |
|---|---|---|
| **Vercel Blob (public)** | User-uploaded GLB / USDZ / images | `BLOB_READ_WRITE_TOKEN` |
| **Vercel Blob (private)** | Admin media library, sensitive uploads | `PRIVATE_BLOB_READ_WRITE_TOKEN` |
| **Firebase Auth + Firestore** | Magic-link sign-in, drops, leads, orders, watcher inbox | `FIREBASE_ADMIN_SERVICE_ACCOUNT` (server) + 7 × `NEXT_PUBLIC_FIREBASE_*` (client) |
| **Upstash Redis** | Rate-limit windows + the polymaths watcher feed | `KV_REST_API_URL` + `KV_REST_API_TOKEN`. Falls back to in-memory limiter / on-disk JSON snapshot when unset. |
| **Shopify** | Legacy product catalogue + the footer/header menus + `/[page]/*` content pages | `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_ACCESS_TOKEN` |
| **Stripe** | Bureau orders, drop claims, AR-card payments (in progress) | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Resend** | Transactional email (lead captures, order confirms, printfiles intake) | `RESEND_API_KEY` (+ `RESEND_INBOUND_WEBHOOK_SECRET` for the printfiles inbound) |
| **Sanity** | CMS content for selected long-form pages (in progress) | `@sanity/client` |

Capability-gated env vars (Apple Wallet, Google Wallet, Klaviyo,
Plausible, etc.) live in `docs/cards-infrastructure.md`. Every
gated surface returns a friendly `503 service-unavailable` when its
env isn't set — nothing crashes.

---

## AI providers (BYOK, multi-routed)

The studio routes LLM traffic through **Vercel's AI Gateway** as the
primary path, with direct provider APIs and a Tailscale-side gateway
as fallbacks. BYOK means the operator's keys live in Vercel /
Aperture rather than each capability holding its own credentials.

| Provider | Models | How it's wired | When it's used |
|---|---|---|---|
| **Vercel AI Gateway** | `anthropic/claude-*`, `zai/*`, `openai/*`, `google/*` (BYOK in Vercel settings) | `lib/llm/gateway.ts` — REST over `https://ai-gateway.vercel.sh/v1/chat/completions` with `AI_GATEWAY_API_KEY` | Default for agents + Aura + scanner + enricher; one auth, model-string routing |
| **Google Gemini** | `gemini-2.5-flash`, `gemini-3.1-flash-lite` | `@google/genai` direct SDK in `lib/aura/gemini.ts` | Vision tasks (image inputs / vision-keyword routing); cheap text-only when configured |
| **Aperture (Tailscale)** | `claude-opus-4-7`, `claude-sonnet-4-6`, `gpt-5.4-pro`, `gpt-5.4-mini` | OpenAI-/Anthropic-compatible at `https://ai.tail99b2a4.ts.net/v1`, key in the Aperture admin UI | Bench-only / tailnet-only paths; not used from production by default |
| **Ollama** | Local models (`dolphin-mistral`, etc.) | `ai-sdk-ollama` + the Tailscale proxy from the bench | `preferLocal` flag in `lib/agents/model-router.ts`; visitor-local via `@mlc-ai/web-llm` in select chambers |
| **Anthropic direct** | Anthropic API | Fallback when `AI_GATEWAY_API_KEY` is unset but `ANTHROPIC_API_KEY` is | Local dev mostly |
| **Z.ai direct** | Z.ai OpenAI-compatible endpoint | Fallback when `AI_GATEWAY_API_KEY` is unset but `ZAI_API_KEY` is | Local dev mostly |

The fallback chain (per `lib/llm/gateway.ts`):

1. `AI_GATEWAY_API_KEY` set → Vercel AI Gateway.
2. Else `ANTHROPIC_API_KEY` set + `anthropic/*` model → Anthropic
   direct.
3. Else `ZAI_API_KEY` set + `zai/*` model → Z.ai direct.
4. Else throw `gateway-unavailable` and the caller falls back to
   Gemini (which has its own direct SDK + key).

The model-routing decision itself is pure: `lib/agents/model-router.ts`
takes the agent slug + the user prompt + a `preferLocal` flag, returns a
`ModelChoice`. No I/O in the router; the caller wires the choice into
whichever client it needs. Routes:

- `anthropic/claude-opus-4-7` — code-heavy
- `google/gemini-2.5-flash` — vision (image input / vision keyword)
- `ollama/dolphin-mistral` — creative prose AND `preferLocal`
- `anthropic/claude-sonnet-4-6` — creative prose (no local) / default
- `openai/gpt-5.4-nano` — quick lookup (short query, no code)

---

## 3D, media, AR

This is the heavyweight half of the stack. Most of these are
visitor-side and code-split, not loaded on every page.

| Concern | Library | Notes |
|---|---|---|
| WebGL / WebGPU scene graph | **Three.js** + **`@react-three/fiber`** | R3F v9, three v0.18x |
| WebXR (VR/AR sessions) | **`@react-three/xr`** v6 | The HoloWalk + WebXR chambers |
| Post-processing | **`@react-three/postprocessing`** | Bloom, foil-sheen, cel-post, vignette, DoF |
| Gaussian splats | **`@sparkjsdev/spark`** + **`@mkkellogg/gaussian-splats-3d`** | `/splats/*`, splat-walker chamber |
| Native `<model-viewer>` | **`@google/model-viewer`** | The AR-card embed + fallback viewer |
| VRM avatars | **`@pixiv/three-vrm`** v3 | Aura's body model + the wardrobe system |
| Image-target AR | **`mind-ar-js`** + a sharp+canvas worker | The HoloWalk plaque pipeline; see `holoflow-ar-targets` skill |
| Video pipeline | **`@ffmpeg/ffmpeg`** + **`mediabunny`** | Browser-side video assembly |
| Server-side canvas | **`@napi-rs/canvas`** v1 | OG images, social cards, thumbnail render. NOT node-canvas — see `holoflow-canvas-server` skill. |
| Local on-device LLM | **`@mlc-ai/web-llm`** | A handful of chambers run a model in the visitor's browser instead of round-tripping |
| Browser ONNX | **`onnxruntime-node`** + **`@huggingface/transformers`** | Inference for the bench-bridge surfaces |
| TTS (browser) | **`kokoro-js`** | Aura's voice pipeline |
| Maps | **`maplibre-gl`** | HoloWalk geo overlay |

Bench-side heavy ML (Hunyuan3D, splat reconstruction, Whisper STT,
SDF mesh, etc.) lives in `D:\The_Hangar\holoflow-services\` and is
called over HTTP. **Do not vendor that code into this repo** —
AGENTS.md rule #1.

---

## Auth + commerce

| Concern | Stack | Notes |
|---|---|---|
| Sign-in | Firebase magic-link | `app/signin/*` |
| Session | Firebase Auth (server-verified via `firebase-admin`) | `lib/auth/*` |
| Admin gating | `isAdminEmail()` against `ADMIN_EMAILS` env | Never inline lists |
| Rate limiting | `lib/rate-limit/fixed-window` — Upstash + in-memory fallback | Auto-detects |
| Bot detection | (planned) Vercel BotID | Not yet wired |
| Payments | Stripe Elements + Payment Intents | `lib/stripe/*` + `app/api/stripe/webhook/route.ts` |
| Wallet passes | Apple Wallet + Google Wallet | Per-card opt-in via env vars |
| Email | Resend (transactional) + Klaviyo (newsletter) | Both gated by API key env vars |
| Webhooks | Stripe + Resend Inbound + Patreon + Discord | All HMAC-signature verified |
| CSP | `Content-Security-Policy-Report-Only` for now | `lib/security/csp.ts`; audit before flipping to enforce mode |

---

## Capability registry

This is the architectural spine. Every typed atom in the system —
"`media.list`", "`ar.compile-target`", "`agent.banter`",
"`viz.thumbnail-splat`", etc. — lives at
`lib/capabilities/<kind>/<verb>.ts`.

A capability:

- Is a pure-typed function (or small set of functions).
- Stays under 300 lines (Architecture Rule 1).
- Returns a typed result, including a structured
  `service-unavailable` error envelope. Never throws unhandled.
- Has a `.PURPOSE.md` next to it documenting its contract.
- Can have a separate `.server.ts` sibling for the heavy bench-side
  implementation; the public surface stays light.

The registry indexes them so `/capabilities` can render the full
list, and so any chamber or page can call any capability without
worrying about wiring.

State that crosses capabilities goes through **zustand stores** —
that's Architecture Rule 2.

Cross-references:

- `lib/capabilities/index.PURPOSE.md` — top of the registry
- `docs/ARCHITECTURE.md` — the four rules (300-line cap,
  capability-headlessness, genome loop, slash-command terminal)
- `docs/BACKWARDS_DESIGN.md` — the design discipline behind the
  registry shape

---

## Logging + observability

| Concern | How |
|---|---|
| App logs | `createLogger("namespace")` in `lib/log` | Every route + capability + bench wrapper. Never `console.*`. |
| Request id | `withRouteLogging()` adds an `X-Request-Id` header + propagates it into the logger | 8-char hex, greppable in Vercel runtime logs |
| Vercel | Built-in runtime logs + `mcp__claude_ai_Vercel__get_runtime_logs` for agents | Recent-24h window default |
| Analytics | `@vercel/analytics`, Speed Insights, Plausible, Klaviyo | All in `app/layout.tsx` |
| Healthz | `/api/healthz` returns sha + branch + rateLimit backend | No-store, per-request |

---

## Routes (high level)

See `AGENTS.md` for the full map. Highest-traffic surfaces:

- `/` — home (statement + hero hypercube + bands)
- `/atelier/*` — ~20+ chambers (one page each, code-split)
- `/capabilities` — registry of every typed atom
- `/c/<slug>` — AR-card landing (short link to `/cards/<slug>`)
- `/holo-walk/<id>` — sculpture AR page (QR plaques resolve here)
- `/bureau` — fine-art print bureau (chamber output → A2 print)
- `/drops` — editioned drops catalogue + claim pipeline
- `/rookery` — community forum + Patreon + Discord tier surface
- `/articles`, `/journal`, `/tutorials`, `/codex`, `/learn` — long-form
- `/news` — the polymaths watcher feed
- `/play/*` — game-hub style emulator + WebXR launcher
- `/admin/*` — operator-only Firebase-gated surfaces
- `/api/*` — route handlers; see `app/api/AGENTS.md`

---

## What's out of scope for this repo

- Bench-side Python ML services (`holoflow-services/` — sibling repo)
- Looking Glass Portrait + Swift laptop orchestration (the
  `finishing-school-protocol` skill governs that workflow)
- Blender + Comfy pipelines that produce assets (run on Sovereign-PC,
  output to Blob)
- Ollama + Aperture servers themselves (live on the tailnet)

If you find yourself wanting to import from any of those, that's a
sign it should be called over HTTP — bench-bridge pattern in the
`holoflow-bench-bridge` skill.

---

## See also

- **`AGENTS.md`** — top-level orientation
- **`docs/ARCHITECTURE.md`** — the four canonical rules
- **`docs/COMMIT-TO-MAIN.md`** — how to land a change on main
- **`docs/SHIP-PLAN.md`** — what's done + what's next
- **`docs/cards-infrastructure.md`** — full env-var contract for the
  AR-cards stack
- **`docs/vercel-setup.md`** — branch-to-deploy + env conventions on
  the Vercel side
- **`docs/TERMIUS-SETUP.md`** — SSH into the bench machines via
  Tailscale
- **`holoflow-deploy-debug` / `holoflow-deploy-gotchas` skills** —
  diagnosing failed deploys
