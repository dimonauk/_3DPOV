# `page.tsx` — purpose twin (route `/capabilities/agent/crew-run`)

## Role

The debug surface for the `agent.crew-run` capability. A visitor
arriving at `/capabilities/agent/crew-run` sees the three
reference crew instances loaded from `lib/agents/`, validated,
summarised, and with their predicted execution waves rendered.

This is the lens onto Layer 5 of SYSTEM.md — the multi-agent
crew runtime. It complements `/capabilities` (the index of every
brick) by going deep on ONE capability.

## Public surface

- Route `/capabilities/agent/crew-run`.
- Default export `CrewRunDebugPage` (RSC).
- `metadata` export for SEO.

## What it shows per crew

- Filename + crew name + version + process mode
- Validation status (green pill if `validateCrew()` passes)
- Description (from the crew JSON)
- Composition stats (agents, tasks, lead, conditional edges, HITL count)
- Tool-binding stats (total + by kind: builtin/mcp/subagent)
- Schema/persistence stats (`output_schema`, `output_path` task counts)
- Agents list (id, role, tool count)
- Tasks list (id, assigned agent, depends_on, HITL/retries/schema/path flags)
- Edges list (graph mode only) with `when` predicates highlighted
- Predicted execution waves (worst-case for graph mode; perfect for hierarchical)
- Synthesis pass note for hierarchical crews

## Internal

- `slots` — the three reference JSON imports, statically bundled.
- `analyseAll()` — runs `validateCrew`, `summariseCrew`, `predictWaves`
  on each. Pure computation, no IO at runtime.
- `StatusPill` / `ProcessPill` / `StatRow` / `CrewCard` — render helpers
  inline in the file. Small enough not to warrant their own components.

## Depends on

- `lib/capabilities/agent/crew-run` — `validateCrew`, `summariseCrew`,
  `predictWaves`, `CrewDefinition` type.
- `lib/agents/sequential-example.json`
- `lib/agents/convergence-crew.example.json`
- `lib/agents/graph-example.json`
- `components/layout/footer`
- 
ext/link`r
- ./RunButton — the client component for running crews

## Run-from-UI (Phase 5 v2 — BUILT 2026-05-21)

Each crew card now renders a `<RunButton crewId={crew.id} />` (client
component, `RunButton.tsx`). It POSTs to
`/api/capabilities/agent/crew-run/run`, which calls `runCrew()`
server-side and returns `{ result, trace }`. The button:
- Shows a running state while the crew dispatches
- Renders each turn inline (task id, agent, wave, duration, text)
- Highlights the synthesis turn for hierarchical crews
- Lists skipped tasks (Phase 3 conditional routing)
- On `paused_for_approval`, shows an "approve & resume" button that
  round-trips the `resume_state` back into the same endpoint

The static analysis (validate / summarise / predict waves) stays — it
renders at build time with no LLM cost. The run button is the dynamic
layer on top.

## Does not

- **Does not edit crews.** Read-only debug view (apart from running
  them). To add or modify a crew, edit the JSON in `lib/agents/`.
- **Does not load arbitrary crews.** Only the three reference instances
  are bundled. A "load crew by URL" or upload form would need its own
  auth + abuse controls.
- **Does not stream turns.** The run button waits for the whole crew to
  complete, then renders all turns at once. Turn-by-turn streaming (SSE)
  would be Phase 5 v3.
- **Does not persist traces.** Returned to the browser, not written
  anywhere. Future: write through `agent.memory-vector`.

## Future (Phase 5 v3 — streaming + persistence)

- Server-Sent Events so turns render as they land (better UX for
  hierarchical crews that take 1-3 min)
- Persist traces via `agent.memory-vector` → searchable run history
- A real HITL gate UI (inspect the paused task's output, edit context,
  then resume) rather than a blind approve
- Arbitrary crew upload with validation + auth

## Bordering files

- `lib/capabilities/agent/crew-run.ts` — runtime
- `lib/capabilities/agent/crew-run.PURPOSE.md` — capability purpose twin
- `lib/capabilities/agent/crew-predicate.ts` — `edge.when` evaluator
- `lib/capabilities/agent/crew-trace.ts` — pinned trace export
- `lib/capabilities/agent/crew-output-schema.ts` — task output validator
- `lib/agents/crew-schema.json` — the data schema
- `app/capabilities/page.tsx` — the all-capabilities index that links here
- `docs/SYSTEM.md` § Layer 5 — the architectural context
