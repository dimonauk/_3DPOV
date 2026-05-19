# lib/ — signpost

Everything that isn't a React component or a Next.js route. Pure code:
types, persistence, capability impls, helpers, integrations.

## The map

```
lib/
  ar/                      AR card types + provenance helpers
  atelier/                 Atelier chamber shared helpers (comfy job
                            responses, parse-error-response, state)
  aura/                    Aura-companion server helpers + Gemini wiring
  auth/                    isAdminEmail() predicate + tests
  bureau/                  Print bureau — pricing, quote, order, types
  capabilities/            THE registry. Every typed atom in the system.
                            See lib/capabilities/AGENTS.md
  cards/                   AR card analytics + bulk import + IP hash
  cast/                    Character bibles (Aura, Penny, etc.)
  chrono-protocol/         Game-loop constants (5-mode pie)
  evolution/               Genome → trait expansion (game engine)
  firebase/                Admin + client SDK init
  holo-walk/               Sculpture data, helpers, dynamic sculptures
  integrations/            Google OAuth, Drive, Photos
  log/                     The single logger. createLogger("ns").
  pipelines/               Pipeline (multi-step workflow) registry
  print-vendors/           Shopify Source plugin + studio-manchester
  printfarm/               Drop-ship POD providers (manual + slant3d
                            + treatstock + future)
  printfiles/              Customer STL/GLB intake engine
                            (directory + ingest + reply)
  procedural-city/         City generator (chamber data)
  rate-limit/              fixed-window limiter (Upstash + memory)
  rookery/                 Member email queue (onboarding + nurture)
  sanity/                  CMS fetch helpers
  security/                CSP config
  shape-of-it/             Chamber data (chambers + threads + labyrinth)
  shopify/                 Storefront API + cache
  state/                   Zustand slices (atelier, agent, aura, etc.)
  stripe/                  Stripe REST client (fetch-based, no SDK dep)
  studio/                  Web 360 editor — source-detection, stitch,
                            print-export, topaz-handoff, desktop
  vrm/                     animationController + animationMap
  wallet/                  Apple Wallet (.pkpass) + Google Wallet (JWT)
  webgpu-marching-cubes/   GPU marching cubes runner
```

## Where things go

| Adding a... | Goes in | Why |
|---|---|---|
| Capability | `lib/capabilities/<kind>/<verb>.{ts,server.ts,PURPOSE.md}` | The registry is the public surface |
| New persistence layer (Firestore doc) | `lib/<area>/<thing>.ts` with `FIRESTORE_COLLECTION` constant | Tests + dashboard reuse the constant |
| Integration with a third party | `lib/integrations/<vendor>/...` OR a top-level module if substantial | Stripe / Resend / Shopify get top-level dirs |
| Pure helper / utility | inline or `lib/<area>/<verb>.ts` | Avoid `lib/utils.ts` catch-all |
| Shared types | `lib/<area>/types.ts` | One types file per area |
| Content registry (data) | `lib/<area>/<data>.ts` — exempt from 300-line cap | These are pure data |

## Server-only modules

Files that touch the Firebase Admin SDK / Stripe / Resend / Firestore /
bench services start with `import "server-only";` so Next refuses to
let the client import them. Reasons to add it: any function that uses
`process.env.<SECRET>`, any function that calls
`requireFirebaseAdminDb()`, any function that reads a private Vercel
Blob.

## The capability registry

`lib/capabilities/` is the most important subsystem. Every typed atom
in the studio's stack registers there. The page at `/capabilities`
renders the index. The architecture:

- `lib/capabilities/_base.ts` — `CapabilityId` union + `register()`
- `lib/capabilities/index.ts` — calls `register({ id, name, status,
  load: () => import("./<kind>/<verb>") })` for every entry
- `lib/capabilities/<kind>/<verb>.ts` — the client surface (browser-safe)
- `lib/capabilities/<kind>/<verb>.server.ts` — server impl (Node-only)
- `lib/capabilities/<kind>/<verb>.PURPOSE.md` — operator/agent docs

Foundation-phase pattern: ship the `.ts` (surface) and `.PURPOSE.md`
first; throw `service-unavailable` until the `.server.ts` lands. Lets
the surface code call any capability without crashing.

## Logger convention

```ts
import { createLogger, errToObject } from "lib/log";
const log = createLogger("api.cards.scan");

log.info("scan started", { sender: senderAddress });
log.warn("rate limited", { sender: senderAddress, resetAt });
log.error("upstream failed", { err: errToObject(err) });
```

Namespaces are dot-separated paths from the file's role. Vercel
runtime logs are greppable by namespace.

## Rate-limit convention

```ts
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

const limiter = createFixedWindowLimiter({
  scope: "api.xyz",
  limit: 10,
  windowMs: 60 * 60 * 1000,
});

const rate = await limiter.consume(`ip:${clientIp(req)}`);
if (!rate.ok) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
```

Falls back to in-memory when `UPSTASH_REDIS_REST_URL` is unset.

## Admin gate convention

```ts
import { verifyIdToken } from "lib/firebase/admin";
import { isAdminEmail } from "lib/auth/admin-emails";

const token = bearer(req);
const decoded = await verifyIdToken(token);
if (!isAdminEmail(decoded.email)) {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}
```
