# Holoflow Studio — Ship Plan

Status as of 2026-05-18 ~17:00 UTC. Sprint exit + roadmap to a fully-
shipped product.

This document is a **run-through plan** — every phase is a sequence of
concrete tasks you can tick through. Estimates are calendar-time at
~3 hrs/day. Skip any task whose value doesn't match the current
priority; phases are ordered by ROI, not by hard dependency.

## Where we are right now

- **`holoflow.co.uk` is live and serving.** Home, /atelier (~20
  chambers), /capabilities (50+ entries), /cards (AR-card scan + Aura
  chat), /holo-walk (QR + AR), /aerial, /catalogue, /play, /articles
  /journal /tutorials, /admin/* operator console.
- **Production branch:** `holoflow-commerce`.
- **Latest production deploy:** `f6aabb5` (printfiles engine + bureau
  MVP quote flow + admin/wardrobe + Aura set_emotion + ~150 sprint
  commits since 2026-05-17). Building as of writing.
- **Critical env vars set on Vercel:** `CRON_SECRET`, `ADMIN_EMAILS`,
  `NEXT_PUBLIC_ADMIN_EMAILS`, `UPSTASH_REDIS_REST_URL` +
  `UPSTASH_REDIS_REST_TOKEN`.
- **Still un-wired in env:** Ollama bench bridge,
  `RESEND_INBOUND_WEBHOOK_SECRET`, Stripe keys, Apple/Google Wallet
  certs, Klaviyo, Sanity tokens.

---

## Phase 0 — Stabilise (today / tomorrow morning)

Goal: leave the sprint in a green state. ~2-3 hrs.

- [ ] Watch `dpl_GDf4oHoizLoc6AD5tKa1RXfvf2qA` (commit `f6aabb5`)
      reach READY. If it errors, diagnose via `holoflow-deploy-debug`
      runbook and `holoflow-deploy-mcp-loop`.
- [ ] Smoke-test live: `/`, `/atelier`, `/capabilities`,
      `/cards/dimona`, `/bureau/test-item`, `/admin/printfiles`.
- [ ] Verify the cron entries fired:
      - `/api/cron/rookery-pending-emails` 00:00 UTC daily
      - `/api/cron/sweep-scan-temp` 04:00 UTC daily
- [ ] Delete the orphan `claude/printfiles-engine` remote branch
      (push landed on commerce directly). `git push origin --delete
      claude/printfiles-engine`.
- [ ] Resolve the leftover `claude/holoflow-drive-photos-splat-ladder`
      branch — either delete or rebase forward for the next sprint.
- [ ] Set up the Resend Inbound webhook on resend.com/inbound:
      - Domain: `holoflow.co.uk`
      - Address: `printfiles@holoflow.co.uk`
      - Forward URL: `https://holoflow.co.uk/api/printfiles/intake`
      - Copy webhook secret → Vercel env
        `RESEND_INBOUND_WEBHOOK_SECRET`
- [ ] Verify Namecheap forwards `printfiles@holoflow.co.uk` to the
      Resend Inbound address (Resend gives you a unique forward
      address per inbound rule).
- [ ] Send a real STL email to `printfiles@holoflow.co.uk` from a
      test inbox. Confirm:
      - Listener returns 200
      - Order appears in `/admin/printfiles`
      - File downloadable from Blob
      - Gracious reply lands in the test inbox
      - Operator packet lands in `dimona@holoflow.co.uk`

---

## Phase 1 — Commerce loop completion (this week)

Goal: turn the print bureau + printfiles engine into a working revenue
pipe. ~10-15 hrs across the week.

### 1.1 Bureau order step (after the quote)

The bureau MVP shipped today does quotes. Next: Stripe Payment Intent
+ Firestore order record + Resend confirmation.

- [ ] `app/api/bureau/order/route.ts` — POST { quoteId, customer,
      shipTo, paymentMethodId } → creates Stripe Payment Intent,
      creates Firestore `bureau_orders/{id}`, returns
      `clientSecret`.
- [ ] `lib/bureau/order.ts` — order shape, status enum
      ("pending-payment", "paid", "printing", "shipped", "delivered",
      "refunded"), Firestore writers.
- [ ] `app/bureau/checkout/[orderId]/page.tsx` — Stripe Elements
      checkout. On confirmed payment, navigate to `/bureau/order/
      [orderId]/done`.
- [ ] `app/api/stripe/webhook/route.ts` — `payment_intent.succeeded`
      → mark order paid + send confirmation email.
- [ ] Resend confirmation template for bureau orders. Subject + body
      mirroring the existing rookery templates.
- [ ] `app/api/bureau/fulfilled/[orderId]/route.ts` — operator-only,
      marks "shipped" + sends tracking email with Royal Mail / DPD
      number.

### 1.2 Printfiles farm wiring

Currently uses `manual` provider (emails operator a packet). Pick one
of the API-based farms and wire it.

- [ ] Decide on the farm. **Recommendation: Slant3D.** They have a
      proper REST API designed for drop-shipping (POST order, get
      tracking, no minimum), reasonable per-unit cost on FDM, US
      shipping included. Treatstock has a wider provider network but
      no clean POD API.
- [ ] `lib/printfarm/slant3d.ts` (or `/treatstock.ts`) implementing
      the `PrintfarmProviderModule` interface (already in place).
- [ ] Quote endpoint: POST farm's quote API with bounding box +
      triangle count → get back price options (material × infill ×
      colour).
- [ ] Replace the "we'll send a quote shortly" promise in
      `lib/printfiles/reply.ts` with the actual quote + Stripe link.
- [ ] `app/api/printfiles/[id]/pay/route.ts` — payment intent for
      the quoted printfile. On payment confirmed → forward to farm.
- [ ] Tracking webhook from farm → mark order "shipped" + email
      customer.

### 1.3 Wallet pass generation

Env-vars exist (`APPLE_PASS_*` + `GOOGLE_WALLET_*`); code paths partial.

- [ ] `lib/wallet/apple.ts` — wrap `passkit-generator` to mint a
      .pkpass from a sculpture + order id.
- [ ] `lib/wallet/google.ts` — wrap Google Wallet SDK for an
      "Add to Wallet" link.
- [ ] `app/api/cards/[slug]/wallet/apple/route.ts` — returns the
      .pkpass binary.
- [ ] `app/api/cards/[slug]/wallet/google/route.ts` — returns the
      JWT URL.
- [ ] Add "Add to Apple Wallet" / "Add to Google Pay" buttons on
      `/c/[slug]` card page.

---

## Phase 2 — Hangar ports (next 2 weeks)

Goal: bring the high-value prototypes from `D:\The_Hangar` into
Holoflow as live chambers. Each is its own 2-4 hr atomic port.

The Hangar holds ~40 prototypes; many are sketches. The portable ones
fit one of these categories:
- **Chamber** — drops into `/atelier/<name>` as a single page
- **Pipeline** — drops into `/pipelines/<name>` (existing pattern)
- **Capability** — registers in `lib/capabilities/<kind>/<verb>`

### 2.1 High-value chamber ports

Pick by ROI; the user knows which their visitors want most.

- [ ] **threadlogic-ai-pattern-prototyper** — already partially
      ported as `/atelier/pattern-prototype`. Confirm full feature
      parity vs. `D:\The_Hangar\apps\prototypes\threadlogic-ai-pattern-prototyper`.
- [ ] **shape-of-it** — knotted-sphere chamber spine. Status:
      `/atelier/shape-of-it` exists with `lib/shape-of-it/` data
      registry (chambers, labyrinth, mound, threads). Confirm parity.
- [ ] **dollhouse-1** — Imagen-driven scene generator with character
      bible. Ported as `/atelier/dollhouse`. Confirm full bible
      coverage.
- [ ] **light-dancer-ai-blueprint-tutorial** — flow-toy moves
      tutorial system. Not yet ported. Would fit `/tutorials/`.
- [ ] **flowarts-academy-vr** — VR poi tutorial. Could ship as
      `/atelier/flowarts-academy-vr` if WebXR-ready.
- [ ] **poi-sculptor** — already ported.
- [ ] **modal-lattice-resolution-v2** — already ported as
      `/atelier/modal-lattice`.
- [ ] **3d-cosplay-marketplace** — full commerce surface; large.
      Probably DON'T port as a chamber; mine the data model for
      product cards instead.
- [ ] **neo-london-chrono-protocol** — already ported.
- [ ] **clothing-reverse-engineer** — already ported.
- [ ] **fabric-calculator** + **sewing-cost-calculator** — small
      utility chambers; would land under `/atelier/textile/cost`.
- [ ] **ai-quilting-designer** — could be a chamber under
      `/atelier/quilt-designer` (already ported? confirm).
- [ ] **ai-video-repurposing-workflow** — pipeline pattern; fits
      `/pipelines/video-repurpose`.
- [ ] **light-weaver** — already ported (`/atelier/light-weaver`).
- [ ] **screenshot-studio** — small chamber for marketing OG
      images. `/atelier/screenshot-studio`.
- [ ] **prompt-foundry** — prompt-engineering scratch surface.
      Defer; lower public-visitor value.
- [ ] **agent-town** — already ported.
- [ ] **dolly-portfolio** — likely contains assets / patterns
      worth absorbing into the existing portfolio surfaces, not a
      port itself.
- [ ] **dolly-protocol-generator** — utility; defer.
- [ ] **temporalstory-engine** — narrative scaffolding; defer
      until you decide whether to expose it.
- [ ] **lightpainting-forge** — Already ported as `/atelier/
      lightpainting-forge`. Confirm.
- [ ] **light-dancer-ai-blueprint-tutorial** — duplicate above; skip.

### 2.2 Bench-service ports (already partially in place)

These are the long-running services that live on Sovereign-PC and
the site reaches via Tailscale Funnel + bearer token.

- [x] `sharp-onnx` bench service — live, wired to `viz.splat-generate`
      `sharp-onnx` provider.
- [ ] **Ollama bench bridge** — env vars (`OLLAMA_SERVICE_URL`,
      `OLLAMA_AUTH_TOKEN`) defined; sidecar + FastAPI proxy not yet
      stood up. ~30-60 min. See `holoflow-bench-bridge` skill.
      Wires `agent.dialogue-ollama` capability (free per-call LLM).
- [ ] **ComfyUI bench bridge** — env vars
      (`COMFYUI_SERVICE_URL`, `COMFYUI_AUTH_TOKEN`) defined;
      Tailscale Funnel sidecar to expose port 8188 not yet stood up.
      ~30-60 min. Unlocks `viz.generate-comfyui` (Flux1-dev / Wan /
      Hunyuan3D / SDXL-360 / Flux-equirect workflows).
- [ ] **splat360 bench service** — env vars
      (`SPLAT360_SERVICE_URL`, `SPLAT360_AUTH_TOKEN`) defined; bench
      engine at `D:\The_Hangar\engines\splat360\` still in
      development. Unlocks `viz.splat-generate-360` (Avata 360 /
      Osmo 360 → splat).
- [ ] **TripoSR bench service** — `D:\The_Hangar\engines\TripoSR\`.
      Already exposed? Confirm. Would back a `viz.image-to-mesh-fast`
      capability.
- [ ] **TRELLIS** — `D:\The_Hangar\engines\TRELLIS\`. Image → mesh
      with PBR. Heavier than TripoSR; longer compute.
- [ ] **ml-sharp** — `D:\The_Hangar\engines\ml-sharp\`. Wraps the
      research-only SHARP path (apple-amlr licence). Already partial.
- [ ] **HY-WU** — `D:\The_Hangar\engines\HY-WU\`. Confirm what this
      is + whether the site should call it.
- [ ] **CUDA-Agent** — `D:\The_Hangar\engines\CUDA-Agent\`. Confirm.
- [ ] **soundscape-engine** — `D:\The_Hangar\engines\soundscape-
      engine\`. Could expose as a sound-design chamber. Defer.

### 2.3 Capability stubs to wire to real providers

The `lib/capabilities/` registry has ~50 entries; many are
foundation-phase stubs. Pick by visitor-facing surface need:

- [ ] `viz.thumbnail-splat` — `card-fast` provider live. The
      `splat-real` provider needs the HoloFlow Desktop endpoint at
      `localhost:8390/api/thumbnails/splat`.
- [ ] `agent.memory-vector` — Firestore vector field +
      `text-embedding-004` from `@google/genai`. Needs gcloud
      Firestore composite index.
- [ ] `viz.splat-generate-360` — see splat360 above.
- [ ] `viz.generate-comfyui` — see ComfyUI above.

---

## Phase 3 — DollyOS surface (optional, 1-2 weeks)

Goal: expose DollyOS — the faux-OS PWA — as a hosted experience under
holoflow.co.uk/dollyos OR keep it standalone at a sibling domain.

DollyOS lives at `D:\The_Hangar\Dolly_OS\` and runs locally on port
5139. It's a Vite + WebGPU TSL React app — not Next.js. Porting paths:

- [ ] **Option A — Sibling domain.** Stand DollyOS up at
      `dollyos.holoflow.co.uk` as a separate Vercel project. Keeps
      the build pipelines independent.
- [ ] **Option B — Subroute via rewrites.** Vercel rewrite rule
      from `/dollyos/*` to the standalone Vite build, hosted as a
      static asset folder under `public/dollyos/`.
- [ ] **Option C — Iframe embed.** Single page at `/dollyos` that
      iframes the running DollyOS instance. Simpler; loses URL
      polish.

The user has historically preferred Option A pattern (separate Vercel
project per app). Confirm before committing.

DollyOS bits that could land on the main Holoflow site WITHOUT a full
port:

- [ ] **Aura's character bible (`lib/cast/aura.ts`)** — already in
      Holoflow as the Aura companion. Sync the bible between repos
      so updates propagate.
- [ ] **Charming Academy cohort** — Penny, Baby, Marcel, etc.
      Already partially present in `/academy/`. Confirm + expand.
- [ ] **ParallaxStage hemisphere system** — 10-shell concentric
      stage. Could be a `/atelier/parallax-stage` chamber.
- [ ] **VolumetricVoid + MultiplaneViewport** — WebGPU TSL scene.
      Could expose as a "deep-time" surface (`/void` or similar).
- [ ] **Portal hands** — gestural interaction primitive. Reusable in
      AR card surfaces; defer.

---

## Phase 4 — Polish + launch (week 3+)

- [ ] **Klaviyo wiring** — env var `NEXT_PUBLIC_KLAVIYO_COMPANY_ID`
      set; on-site tracking script not yet loaded. Wire into
      `app/layout.tsx` if you want server-side opt-in newsletters.
- [ ] **Sanity CMS** — env vars set; integration partial. Decide
      whether journal/articles continue as static MDX-style React
      components or move to Sanity. Recommend STATIC — the current
      `components/articles/entries/*.tsx` pattern is working and
      simpler. Sanity for product-catalogue items maybe.
- [ ] **Plausible analytics** — env var
      `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set; script not yet in layout.
      Easy 5-min job.
- [ ] **Email signup re-validation** — newsletter signup currently
      hits `/api/newsletter` which just logs. Wire to Klaviyo OR
      Resend audiences for actual list-building.
- [ ] **404 / 500 pages** — design custom pages matching the
      Holoflow voice (catalogue-mode, dry).
- [ ] **Sitemap + robots.txt** — `app/sitemap.ts` and
      `app/robots.ts` for SEO surface.
- [ ] **OpenGraph cards** — every public route should have a
      generated OG image via `@napi-rs/canvas` (see
      `holoflow-canvas-server` skill). Many already do; audit.
- [ ] **Cookie banner** — needed for EU visitors using Plausible
      (Plausible is GDPR-compliant + cookieless, so this might not
      be needed; confirm in their docs).
- [ ] **GDPR data-request endpoint** — `POST /api/gdpr/request` to
      receive subject-access requests. Pipe to operator email.
- [ ] **Status page** — `/status` page showing the bench services'
      health (sharp-onnx, ComfyUI, Ollama). Pulls `/healthz` from
      each via Tailscale. Already partially built at `/api/healthz`.

---

## Appendix A — Known tech debt

- **AuraCompanion re-modularisation** — re-split happened in
  commit `5326c50` (parallel agent) after the merge took the
  monolith. Verify wardrobe + tool-call features survived.
- **`@vercel/config` / `vercel.ts`** — removed because it broke
  every deploy (catalogue #7 in `holoflow-deploy-debug`). Re-test
  only when Vercel announces the v0.5.0 CLI fix.
- **Resend Inbound full HMAC verify** — listener checks header
  presence only; full Svix HMAC verification deferred to a follow-up
  commit. Set `RESEND_INBOUND_SKIP_SIGNATURE=1` for dev testing only.
- **Modular pieces under `components/ar/aura-companion/`** — the
  modular split was redone after the monolith was merged in; confirm
  no orphan files remain.

## Appendix B — Bench-side checklist (Sovereign-PC)

These services need to run on the Hangar bench for the corresponding
capabilities to come alive:

| Service | Port | Status | Wires |
|---|---|---|---|
| sharp-onnx | 7845 | ✅ Live | `viz.splat-generate` sharp-onnx provider |
| ComfyUI | 8188 | 🟡 Running, not exposed | `viz.generate-comfyui` |
| Ollama | 11434 | 🟡 Running, not exposed | `agent.dialogue-ollama` + `agent.banter` |
| splat360 | 8390 | 🟡 In dev | `viz.splat-generate-360` hangar-360 provider |
| TripoSR | 7844 | ❓ Confirm | `viz.image-to-mesh-fast` (future) |
| TRELLIS | ? | ❓ Confirm | `viz.image-to-mesh-pbr` (future) |
| HoloFlow Desktop | 8390 | ❓ Not built | `viz.thumbnail-splat` splat-real, `ar.compile-target` subprocess |

For each "🟡 Running, not exposed": needs Tailscale Funnel sidecar
(template at `D:\Tools\tailscale-sharp-onnx\`) + bearer-token wrapper
+ Vercel env vars set.

## Appendix C — Suggested ordering for the next 7 working days

| Day | Focus |
|---|---|
| Day 1 (today) | Phase 0 finishes — Resend Inbound + smoke-test printfiles |
| Day 2 | Phase 1.1 — Bureau order/payment flow (Stripe Payment Intent) |
| Day 3 | Phase 1.1 cont. — Stripe webhook + confirmation email |
| Day 4 | Phase 2.2 — Ollama bench bridge + ComfyUI bench bridge |
| Day 5 | Phase 1.2 — Pick Slant3D / Treatstock + wire farm provider |
| Day 6 | Phase 1.3 — Wallet pass generation |
| Day 7 | Phase 4 — Polish (Plausible, sitemap, OG, 404/500) |

Adjust by what unblocks revenue first vs. what feels good to ship.
The bureau order flow is the highest-ROI move because it turns the
existing print-bureau plan into an actual revenue line.
