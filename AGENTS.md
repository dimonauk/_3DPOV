# AGENTS.md — start here

You are a new agent (or a fresh Claude session) opening this repo.
This is the first file to read. It points at the other signposts; you
don't have to read everything.

## What this repo is

**Holoflow Studio** — public site at `https://holoflow.co.uk`. Next.js
15 (App Router) + Firebase + Vercel Blob + Resend + Stripe (in
progress). Hosts the studio's marketing surfaces, atelier chambers
(~20+ generative-art toys), AR cards (`/c/<slug>`), HoloWalk QR + AR
plaques, the print bureau, the printfiles intake engine, and Aura
(the studio's VRM-avatar companion).

Production branch: **`holoflow-commerce`** → triggers Vercel deploy
to `holoflow.co.uk`. Feature branches: **`claude/<slug>`**. PR to
commerce when ready to ship.

## ⚠️ DO NOT (load-bearing operational rules)

Several sessions operate concurrently. Read these before structural
changes:

1. **Do not re-add `services/` to this repo.** It was moved on
   2026-05-18 to fix repeated Vercel build OOM failures (12.2 MB,
   304 files of vendored Python that Next.js's file tracer was
   scanning on every build). If you need to reference the Python
   services from Next.js code, **call them over HTTP** (they run as
   local services with FastAPI / Flask), don't import them. Their
   new home: `D:\The_Hangar\holoflow-services\`.

2. **Do not delete `AGENTS.md`, `.vercelignore`, `docs/CHANGELOG.md`,
   or `docs/AGENT-COORDINATION.md`** — these are the only mechanisms
   for coordinating across sessions.

3. **Do not vendor large Python / ML projects into the Next.js repo.**
   If you find yourself needing one, put it in
   `D:\The_Hangar\holoflow-services\<name>\` and call it over HTTP.

4. **Do not flip `Content-Security-Policy-Report-Only` → enforce mode**
   without auditing violation logs first. The directive list in
   `lib/security/csp.ts` is intentionally permissive for the audit
   phase.

5. **Do not remove `lib/rate-limit/`.** It auto-detects Upstash and
   falls back to in-memory. The interface is stable; replace the
   backend if needed but keep the API.

6. **Do not push directly to `holoflow-commerce`** (except for
   `docs/`-only edits and the parallel-agent workflow). Open a PR for
   review.

## The map

```
holoflow.co.uk
  /                      home (gestural-photo stages, catalogue tease)
  /atelier               ~20+ chambers (each is a single page)
  /capabilities          registry of every typed atom in the system
  /cards/<slug>          AR card landing
  /c/<slug>              short AR card link
  /holo-walk/<id>        sculpture AR page (QR plaques resolve here)
  /holo-walk/<id>/qr     dynamic QR PNG for the printed sign
  /bureau                fine-art print bureau (chamber output → A2 print)
  /bureau/checkout/<id>  Stripe Elements checkout
  /drops                 editioned drops catalogue + claim pipeline
  /drops/<slug>          individual drop with PatreonGate
  /rookery               the forum
  /rookery/patreon       Patreon link / tier surface
  /rookery/discord       Discord link / tier-role surface
  /rookery/my-wallet     tier + Patreon + Discord status hub
  /atelier/printfiles    customer STL/GLB intake form (future v2)
  /edit                  web 360 editor (drop-zone + equirect viewer)
  /pipelines/...         lipsync + mood-face demos
  /admin/*               operator-only (Firebase auth + isAdminEmail)
    /admin/library       media uploads
    /admin/wardrobe      Aura's outfits (.vrm uploads)
    /admin/leads         AR card lead capture
    /admin/printfiles    POD order dashboard
    /admin/bureau        bureau order dashboard
    /admin/drops         drops admin list + withdraw
    /admin/drops/new     drop publish form (Oracle + Sieve gates)
    /admin/tiers         operator tier override
    /admin/watchers      OSS feed monitoring
  /news                  public OSS feed surface
  /status                public service-health probe
  /api/*                 route handlers — see app/api/AGENTS.md
```

## If you only read three things

1. **`AGENTS.md`** (this file) — top-level orientation
2. **`docs/SHIP-PLAN.md`** — what's done + what's left + phase ordering
3. **`docs/CLAUDE.md`** or the project's CLAUDE.md if one exists —
   agent rules

If you're debugging a deploy, read the `holoflow-deploy-debug` skill
runbook first (it loads automatically on deploy-failure triggers).

## Project layout

| Dir | What's there | Signpost |
|---|---|---|
| `app/` | Next.js routes (pages + API handlers + layouts) | `app/AGENTS.md` |
| `components/` | React components reused across pages | `components/AGENTS.md` |
| `lib/` | All the non-React code — types, server impls, helpers | `lib/AGENTS.md` |
| `lib/capabilities/` | The capability registry — every typed atom | `lib/capabilities/index.PURPOSE.md` |
| `lib/drops/` | Drop publish + claim + gates + edition logic | inline |
| `lib/patreon/` | Patreon webhook + OAuth + token refresh + tier-map | `docs/patreon-runbook.md` |
| `lib/discord/` | Discord bot sync + role-map + rate-limit | `docs/discord-runbook.md` |
| `lib/watchers/` | OSS feed monitoring sources + parser | inline |
| `scripts/` | One-off CLI tools (mind-ar compile, QR batch, etc.) | `scripts/AGENTS.md` |
| `python-services/` | Bench-side FastAPI services (run on Sovereign-PC) | `python-services/PROXY_BRIDGES.md` |
| `data/` | Static JSON used by both server + client (cards, wardrobe) | — |
| `public/` | Static assets served as-is at `/<path>` | — |
| `docs/` | Plans, decision records, operator walkthroughs | `docs/AGENTS.md` |
| `tests/` | Vitest unit tests + Playwright e2e sweep | `tests/AGENTS.md` if it exists |
| `etc/` | Non-code artefacts (ComfyUI workflow JSONs etc.) | — |
| `.claude/skills/` | Agent skills (user-level; loaded by trigger) | top of system prompt |

## Rules you should know before you touch code

1. **300-line cap on orchestrator files.** Every `*-client.tsx`,
   `page.tsx`, `route.ts`, large hook gets split into siblings when
   it exceeds ~280 lines. See the `holoflow-modularise-300` skill.
   Content registries (lib/<area>/<data>.ts pure-data files) are
   explicitly exempt.

2. **`pnpm` only.** Never `npm install`, `npm run`, etc. The repo's
   lockfile is `pnpm-lock.yaml` and `vercel.json` runs
   `pnpm install --frozen-lockfile`.

3. **`createLogger("namespace")` not `console.*`.** Every route +
   capability + bench-side wrapper uses `lib/log`'s logger so Vercel
   runtime logs are greppable by namespace. See the
   `holoflow-testing-logging` skill.

4. **`isAdminEmail()` not inline allow-lists.** Admin gating goes
   through `lib/auth/admin-emails`. Reads `ADMIN_EMAILS` env var.

5. **`createFixedWindowLimiter()` on every visitor-facing AI route.**
   Without it, an abuser can burn through Resend/Gemini quotas.

6. **Capability stubs return `service-unavailable`, never throw
   unhandled.** Foundation-phase pattern: surface code can call any
   capability; the stub returns a structured error the caller can
   surface gracefully to the visitor.

7. **`outputFileTracingExcludes` for heavy native deps.** If a new
   capability imports `@huggingface/transformers` or similar, audit
   `next.config.ts` to make sure the binary doesn't leak into every
   lambda. See `holoflow-capabilities-tracing` skill.

8. **Do not `export const runtime = "nodejs"` in route handlers.** It
   conflicts with `experimental.useCache`. Next picks Node.js
   automatically for routes that import server-only modules. See
   `holoflow-deploy-gotchas` #8.

## Build is fragile — known recovery patterns

`pnpm run build` has been OOMing on Vercel's default 4 GB build
machines. Recent fixes that landed:

- `next.config.ts` `outputFileTracingExcludes` for `onnxruntime-node`
  + `transformers` (commit `b7fad74`)
- Skipping build-time TS + ESLint checks (commit `cb44e54`,
  re-enabled in `0ebbae7`)
- Moving `services/` out of the repo (commit `09f19d3`) ← the main fix

If a build still OOMs:

- `lib/holo-walk/data.ts` (1,847 lines) — heavy data file
- Any new `app/atelier/*` chamber that pulls in `three` + WebGPU +
  heavy WASM
- Consider Vercel Enhanced Builds (8 GB RAM, paid) as a fallback

## How to find files that were moved

If you find a reference like `services/foo/bar.py` in docs, scripts,
or comments and the file isn't here:

```powershell
ls D:\The_Hangar\holoflow-services\foo\bar.py
```

That's where it lives now.

## How to push

```
git checkout holoflow-commerce
git pull --ff-only
git checkout -b claude/<short-slug>
# do work
pnpm exec tsc --noEmit                       # must exit 0
Remove-Item -Recurse -Force .next            # wipe stale validator
pnpm exec next build --webpack               # ~4–6 min, must be green
git add <files>
git commit -m "<scope>: <one-line> ..."
git push -u origin claude/<short-slug>
# Open PR via:
# https://github.com/dimonauk/_3DPOV/compare/holoflow-commerce...claude/<short-slug>
```

If you see "Dimona <dimonaauk@gmail.com>" commits land while you're
working: that's a parallel agent on the same branch. Load the
`parallel-agent-coordination` skill and follow its rules (pull
frequently, narrow blast radius).

## Coordination protocol

Before making any structural change (deleting routes, moving
directories, renaming top-level files, adding a new dependency that
pulls in >50 MB), **append a line to `docs/AGENT-COORDINATION.md`**
with:

- Date/time
- Your branch
- What you're about to do
- Why

Other agents can then read that and avoid stepping on it.

## Where to put new things

| Adding a... | Goes in |
|---|---|
| Public marketing page | `app/<route>/page.tsx` |
| Atelier chamber | `app/atelier/<name>/page.tsx` + `<name>-client.tsx` |
| API route handler | `app/api/<...>/route.ts` |
| Operator console page | `app/admin/<name>/page.tsx` (gated by `app/admin/layout.tsx`) |
| Capability | `lib/capabilities/<kind>/<verb>.ts` + `<verb>.server.ts` + `<verb>.PURPOSE.md` |
| Bench service | `python-services/<name>_service.py` + `start_<name>.ps1` |
| Shared lib code | `lib/<area>/<file>.ts` |
| Static asset | `public/<...>` |
| Content registry (data) | `lib/<area>/<data>.ts` (exempt from the 300-line cap) |
| One-off operator script | `scripts/<name>.mjs` + sibling `.md` |
| Decision doc / plan | `docs/<NAME>.md` |
| Skill (agent knowledge) | `~/.claude/skills/<name>/SKILL.md` (user-level, not repo) |

## Skills you'll likely need

Trigger-loaded by the harness when matched on the user's input. The
most important ones for this repo:

- `holoflow-deploy-debug` — Vercel deploy diagnostic runbook + catalogue
- `holoflow-deploy-gotchas` — recurring webpack/TS build failures
- `holoflow-deploy-mcp-loop` — Vercel MCP polling patterns
- `holoflow-modularise-300` — the 300-line file extraction rule
- `holoflow-capabilities-tracing` — capability-registry × @vercel/nft pitfalls
- `holoflow-bench-bridge` — exposing bench services to Vercel via Tailscale
- `holoflow-canvas-server` — `@napi-rs/canvas` (NOT `canvas`) for server-side image gen
- `holoflow-testing-logging` — logger + Vitest + Playwright conventions
- `holoflow-voice` — writing voice for the site
- `holoflow-vrm-locations` — where every .vrm file lives
- `holoflow-webgpu-llm` — browser-side LLM (`@mlc-ai/web-llm`)
- `holoflow-ar-targets` — mind-ar .mind binary compilation
- `holoflow-splat-vertical` — 3D Gaussian Splat architecture
- `parallel-agent-coordination` — when other agents are pushing too
- `do-then-ask` — Dimona's working-style preference (don't ask, do)

## Tone

Catalogue voice. Dry, specific, no marketing fluff. See
`holoflow-voice` skill for the calibrated examples.

## End state

This file should stay short-to-medium. New conventions go in the
appropriate skill or per-dir signpost. Update this index when a new
top-level directory lands.

Last updated: 2026-05-19 (post claude/skeleton-build merge — added
drops/patreon/discord/watchers map entries).
