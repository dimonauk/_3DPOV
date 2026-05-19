# app/ — signpost

Next.js 15 App Router. Every directory is a route (or a layout/page
unit). Two registers of code live here:

| Register | Where | Notes |
|---|---|---|
| **Public pages** | `app/<route>/page.tsx` | Server components by default; client islands marked `"use client"` |
| **API routes** | `app/api/.../route.ts` | Always Node runtime; gateway to lib/ helpers |

## Layout

```
app/
  layout.tsx                  Root layout (analytics, fonts, providers)
  page.tsx                    Home — light painted in the air
  error.tsx                   Global error boundary (server)
  not-found.tsx               404
  sitemap.ts + robots.ts      SEO
  globals.css                 Tailwind layer

  api/                        Route handlers — see app/api/AGENTS.md
  admin/                      Operator console (gated)
  atelier/                    ~20+ generative-art chambers
  cards/                      AR card surfaces (data + UIs)
  c/[slug]/                   Short-form AR card link
  holo-walk/                  Sculpture AR + QR plaques
  bureau/                     Print bureau (fine-art prints)
  capabilities/               Registry index page
  edit/                       Web 360 editor (drop-zone + viewer)
  pipelines/                  lipsync + mood-face demos
  stage/                      The studio's stage (Aura's home)
  status/                     Public service-health probe
  articles/ journal/          MDX-style React articles + journal
    tutorials/
  ...
```

## Conventions

1. **Page → client component split.** A `page.tsx` is server-rendered;
   its `*-client.tsx` sibling holds the `"use client"` body. Pages
   stay under ~80 lines (metadata + data fetch + JSX glue). Client
   files split further when they cross ~280 lines (see
   `holoflow-modularise-300`).

2. **Force-dynamic on routes that read req headers.** Add
   `export const dynamic = "force-dynamic";` to any route that touches
   `headers()`, `cookies()`, request IP, etc. Without it Next caches
   the response and your auth gate stops firing.

3. **Robots-deny on admin pages.** Add
   `metadata: { robots: { index: false, follow: false } }` to every
   `/admin/*` page.

4. **Operator gate goes in the layout, not the page.** `app/admin/
   layout.tsx` wraps everything under `/admin/*` with the Firebase
   auth check + `isAdminEmail()` predicate. Don't duplicate the gate
   in each page.

5. **Use the rate-limit helper on every visitor-facing AI route.**
   The route handler reaches `createFixedWindowLimiter()` from
   `lib/rate-limit/fixed-window` BEFORE calling any LLM/image-gen
   capability.

## API route layout

```
app/api/
  admin/                    Operator-only (verifyIdToken + isAdminEmail)
    media/...               Media library CRUD
    wardrobe/...            Aura outfit uploads
    printfiles/[id]/        Order status transitions
    bureau/...              (future)
  ai/                       LLM-touching routes (Gemini, MLC etc.)
  atelier/                  Per-chamber server routes
  aura/                     Aura-companion endpoints
  bureau/                   Print bureau (quote, order, webhook, fulfilled)
  cards/                    AR card actions (chat, scan, upload)
  cron/                     Vercel cron handlers
  csp-report/               CSP violation collector
  gdpr/request/             GDPR subject-access endpoint
  healthz/                  Liveness probe
  holo-walk/                Sculpture AR endpoints
  inverse-kata/             Kata matcher (chamber callback)
  log/                      Client log forwarder
  newsletter/ contact/      Form submission handlers
  printfiles/intake/        Resend Inbound webhook listener
  printfiles/[id]/pay/      Customer payment for a printfile quote
  revalidate/               Shopify/Sanity webhook revalidations
  rookery/                  Member onboarding email triggers
  stripe/webhook/           Stripe event router
  viz/                      Capability-routed visual-export endpoints
```

## When a new feature lands

1. Add the page under `app/<route>/page.tsx`
2. Add API route(s) under `app/api/<...>/route.ts`
3. Capability impls go in `lib/capabilities/<kind>/<verb>.{ts,server.ts}`
4. Reference docs go in `docs/`

The `/capabilities` page auto-discovers entries registered in
`lib/capabilities/index.ts`; no UI update needed.
