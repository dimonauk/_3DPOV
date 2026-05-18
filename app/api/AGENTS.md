# app/api/ — signpost

Route handlers. Every directory with a `route.ts` is an HTTP endpoint.
Every directory WITHOUT a `route.ts` is just an organisational
grouping.

## Layout

```
app/api/
  admin/                   Operator-only routes — verify Firebase token + isAdminEmail()
    media/[id]/            PATCH (retire) / DELETE / GET single media item
    media/upload/          POST direct-to-Blob upload token
    printfiles/[id]/status/  POST { status } status transitions
    wardrobe/upload-token/ POST direct-to-Blob upload token for VRM uploads
    import/                Google Drive / Photos imports

  ai/                      LLM-touching routes
    google/generate-image/ Imagen via Gemini

  atelier/                 Per-chamber server endpoints
    cube-composer/generate-panorama/
    pattern-prototype/generate-textile/

  aura/                    Aura companion endpoints
    agent/                 Tool-aware chat (parseAuraStream protocol)
    chat/                  Bare chat (deprecated; agent/ is the path)
    holo-walk-banter/      Location-aware banter
    narrate/               One-shot narration
    watch/                 Multimodal "look at this clip"

  bureau/                  Print bureau
    quote/                 POST { request } → stateless price
    order/                 POST { request, customer, ship } → order + PI
    fulfilled/[orderId]/   POST { tracking } operator marks shipped

  cards/[slug]/            AR card actions
    chat/                  Per-card chat (uses card's voice + bible)
    leads/[leadId]/enrich/ Operator lead enrichment
  cards/bulk-import/       Batch ingest
  cards/scan/              Camera scan → identify
  cards/scan/upload-token/ Pre-signed Blob upload
  cards/upload-glb/        Operator GLB upload
  cards/upload-usdz/       Operator USDZ upload

  chrono-protocol/score/   Game score persistence

  clothing-reverse/analyze/ Atelier chamber callback

  co-drawing/suggest/      Atelier callback

  contact/                 Public contact form

  cron/                    Vercel cron handlers (gated by CRON_SECRET)
    rookery-pending-emails/  Daily nurture-email sweep
    sweep-scan-temp/         Daily temp-asset janitor

  csp-report/              CSP violation collector

  gdpr/request/            GDPR subject-access endpoint

  healthz/                 Liveness probe (public)

  holo-walk/generate-splat/  Sculpture splat ingest

  inverse-kata/            Kata pose matcher
    orchestrate/           Multi-pose orchestrator

  log/                     Client-side log forwarder

  newsletter/              Public signup

  play/progress/           Game progress persistence

  print-check/             Print-readiness verdict (geometry probe)

  printfiles/intake/       Resend Inbound webhook listener
  printfiles/[id]/pay/     Customer payment for a printfile quote

  revalidate/              Shopify revalidate webhook
  sanity/revalidate/       Sanity CMS revalidate webhook

  rookery/onboarding/      Member onboarding email trigger

  stripe/webhook/          Stripe event router (verifies signature)

  viz/splat-generate/      Capability-routed splat generation
```

## Conventions

1. **`export const dynamic = "force-dynamic";`** on every route that
   reads request headers, cookies, query params, IP, etc.

2. **`createLogger("api.<dotted-namespace>")`** — namespace matches
   the route path. Vercel runtime logs grep cleanly.

3. **Bearer-token auth** for admin routes:
   ```ts
   const token = bearer(req);
   if (!token) return NextResponse.json({ error: "missing bearer" }, { status: 401 });
   const decoded = await verifyIdToken(token);
   if (!isAdminEmail(decoded.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
   ```

4. **Rate limit at the route boundary** for visitor-facing AI calls.
   `createFixedWindowLimiter` + `.consume(key)` BEFORE the LLM call.

5. **Return Errors as JSON with consistent shape:**
   ```ts
   { error: "<kebab-code>", message?: string, ... }
   ```

6. **Cron route handshake:**
   ```ts
   const sig = req.headers.get("authorization");
   if (sig !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
   }
   ```
   Vercel injects this header automatically on cron-triggered
   invocations. Without `CRON_SECRET` set in env, the cron route
   401s every fire (deliberate — fail loud, not silently process
   anonymous calls).

7. **Idempotency on email sends** — Resend's `Idempotency-Key` header
   dedupes within 24h. Stable key: `<scope>:<recipient>` or
   `<scope>:<orderId>`.

## Adding a new route

1. Create `app/api/<...>/route.ts`
2. Export `GET` / `POST` / `PATCH` / etc. async functions
3. Add `export const dynamic = "force-dynamic";` if needed
4. Set up logger + rate-limit + auth as above
5. Capability calls go through `lib/capabilities/<kind>/<verb>` —
   don't reach into bench services directly from the route.
