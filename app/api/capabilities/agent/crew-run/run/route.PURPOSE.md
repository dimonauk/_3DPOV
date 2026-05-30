# `route.ts` — purpose twin (`POST /api/capabilities/agent/crew-run/run`)

## Role

The execution endpoint behind the `agent.crew-run` debug surface. The
`run crew` button on `/capabilities/agent/crew-run` POSTs here; this
route calls `runCrew()` server-side and returns the result + a pinned
trace.

This is the bridge that makes the Layer-5 crew runtime actually
runnable from the browser — the runtime built across sessions 1-6 was
server-only library code with no HTTP surface until this.

## Contract

**POST** body:
```ts
{
  crew_id: "sequential-example" | "convergence-crew" | "graph-example",
  prompt?: string,              // optional crew brief, ≤2000 chars
  resume_from?: CrewResumeState // round-trip from a paused_for_approval result
}
```

**200** response:
```ts
{
  result: CrewRunResult,  // discriminated by status
  trace: CrewTrace        // from exportTrace(result, crew)
}
```

**Failure modes:**
- `503 ai_gateway_not_configured` — `AI_GATEWAY_API_KEY` missing from env
- `400 invalid_body` — body isn't JSON
- `400 invalid_crew_id` — crew_id not one of the three bundled refs
- `429 rate_limited` — 3 runs/hour/IP exceeded
- `502 crew_run_threw` — `runCrew()` threw (typically upstream LLM error)

## Why only three crews

The `CREWS` map hard-codes the three reference instances bundled at
build time. This is a debug surface, not a general crew-execution API —
arbitrary crew upload would need auth + validation + abuse controls
that aren't worth building for an internal tool. If a real
crew-execution API is wanted later, it's a separate route with its own
threat model.

## Rate limiting

3/hour/IP via `createFixedWindowLimiter` (same primitive as the Aura
agent route, which uses 20/hour). Much tighter cap here because a
hierarchical crew is ~10 LLM calls — an order of magnitude more
expensive than a single chat turn. Auto-upgrades to Upstash Redis when
`UPSTASH_REDIS_*` env is present; falls back to in-memory otherwise.

## maxDuration

300s. Hierarchical crews run all worker waves then a synthesis pass —
the convergence-crew (9 tasks + synthesis) can take 1-3 minutes
depending on provider latency. On Vercel this requires a plan tier that
permits long functions; on Hobby (10s cap) long crews will time out.

## Depends on

- `lib/capabilities/agent/crew-run` — `runCrew`, `CrewDefinition`,
  `CrewResumeState`
- `lib/capabilities/agent/crew-trace` — `exportTrace`
- `lib/agents/*.json` — the three reference crews (statically imported)
- `lib/log` — `withRouteLogging`, `errToObject`
- `lib/rate-limit/fixed-window` — `createFixedWindowLimiter`

## Does not

- **Does not stream.** Returns the full result after the crew completes.
  Turn-by-turn streaming (SSE) would be Phase 5 v3 — lets the UI show
  turns as they land instead of waiting for the whole run.
- **Does not persist traces.** The trace is returned to the caller but
  not written anywhere. A future enhancement: write through
  `agent.memory-vector` so runs become searchable history.
- **Does not authenticate.** Rate-limited by IP only, like the Aura
  agent route. Fine for a debug surface; revisit if it ever handles
  sensitive crews.
- **Does not run arbitrary crews.** Only the three bundled refs.
- **Does not execute tools.** Even though the crews declare tool
  bindings, runtime tool execution needs the ReAct loop in `respond()`
  (not yet built). Crews run as pure dialogue chains for now.

## Bordering files

- `app/capabilities/agent/crew-run/page.tsx` — the debug surface that
  calls this route
- `app/capabilities/agent/crew-run/RunButton.tsx` — the client component
  that POSTs here
- `app/api/aura/agent/route.ts` — the sibling route this was modelled on
- `lib/capabilities/agent/crew-run.PURPOSE.md` — the capability twin
