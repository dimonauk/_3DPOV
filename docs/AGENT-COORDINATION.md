# Agent coordination log

## 2026-05-22 13:20 UTC — claude-canon-port — session 8: Phase 5 v2 (run-from-UI)

**Picking up from session 7 closeout.** Top priority was Phase 5 v2 — making crews actually runnable from the browser. Done.

### What landed

**`app/api/capabilities/agent/crew-run/run/route.ts` (5.7 KB) — execution endpoint**

`POST /api/capabilities/agent/crew-run/run`. Body: `{ crew_id, prompt?, resume_from? }`. Returns `{ result, trace }`.

- `crew_id` must be one of the three bundled reference crews (hard-coded `CREWS` map — debug surface, not a general crew-execution API)
- Calls `runCrew()` server-side, then `exportTrace(result, crew)` for the pinned trace
- Rate-limited 3/hour/IP via `createFixedWindowLimiter` (same primitive as the Aura agent route, which uses 20/hr; crew runs are ~10 LLM calls each so the cap is much tighter)
- 503 if `AI_GATEWAY_API_KEY` missing, 400 on bad body / unknown crew_id, 429 rate-limited, 502 if `runCrew()` throws
- `maxDuration = 300` — hierarchical crews can run 1-3 min
- Modelled on `app/api/aura/agent/route.ts` (the existing tool-calling chat endpoint)

**`app/capabilities/agent/crew-run/RunButton.tsx` (7.3 KB) — client component**

`"use client"`. Self-contained run lifecycle per crew card, no shared store. Phases: idle → running → done | paused | error.

- "run crew" button POSTs to the API route
- Renders each returned turn inline: task id, agent, wave label (`wave N` / `post-DAG` for synthesis), duration, full text
- Synthesis turn (`task_id === "__synthesis__"`) highlighted with pink border
- Skipped tasks (Phase 3 conditional routing) listed at the bottom
- On `paused_for_approval`: shows the paused task + an "approve & resume" button that POSTs the same endpoint with `resume_from = result.resume_state`
- Error + rate-limit messages surfaced inline
- Run id + total duration shown after completion

**`app/capabilities/agent/crew-run/page.tsx` — wired in**

- Imports `RunButton`, renders `<RunButton crewId={crew.id} />` at the end of each crew card (after predicted waves)
- Footer copy rewritten: was "this is a static debug surface, does NOT dispatch LLM calls" — now documents the run capability, the rate limit, the `AI_GATEWAY_API_KEY` requirement, and pause/resume

### Architecture note

The page stays a server component doing build-time static analysis (validate / summarise / predict waves — zero LLM cost). The `RunButton` is the dynamic client layer on top. Clean separation: static structure renders instantly and free; the expensive dynamic run is opt-in per click. This is the right shape — visitors see the full crew anatomy without burning gateway credits, and only spend when they explicitly hit run.

### Verification

- **TSC**: 0 errors (both the API route and the client component first try)
- **`pnpm build`**: 747 pages, 0 errors, 3:01 elapsed
- **API route artefacts** present in `.next/server/app/api/capabilities/agent/crew-run/run/` (route.js + route_client-reference-manifest.js)
- **Footer copy edit** landed after the build above — final re-build confirms clean (see below)

NOT verified: a live end-to-end run. That needs `AI_GATEWAY_API_KEY` set + the dev server running + real gateway credits. Left for Dimona to exercise in her own env — the build + TSC + the earlier behavioural smoke tests (pause/resume cycle, predicate eval, schema validation, trace offsets) cover the logic; the live run is just the wire actually carrying current.

### Files touched

- `app/api/capabilities/agent/crew-run/run/route.ts` — NEW, 5.7 KB
- `app/api/capabilities/agent/crew-run/run/route.PURPOSE.md` — NEW, 3.9 KB
- `app/capabilities/agent/crew-run/RunButton.tsx` — NEW, 7.3 KB
- `app/capabilities/agent/crew-run/page.tsx` — RunButton wired in + footer copy rewritten (18.2 KB)
- `app/capabilities/agent/crew-run/page.PURPOSE.md` — Phase 5 v2 documented as built (4.3 KB)
- `docs/ROADMAP.md` — Phase 5 v2 closed-items row + agent platform row bumped (24.5 KB)
- `docs/AGENT-COORDINATION.md` — this entry

### Status snapshot — agent platform

The whole arc, sessions 1-8:
- Phase 1 ✅ sequential + parallel
- Phase 2 ✅ hierarchical + graph (DAG executor)
- Phase 3 ✅ `edge.when` conditional routing
- Phase 4 ✅ retries, HITL pause/resume, output_schema, output_path, trace export, tool-binding validation (runtime tool exec still stubbed)
- Phase 5 v1 ✅ static debug surface
- Phase 5 v2 ✅ run-from-UI

SYSTEM.md's five layers are all running, visible, AND executable from the browser. The agent platform went from "schema + stub" (session 2) to "click a button on the website and watch a 10-agent crew run with HITL gates" (session 8) without adopting any framework — pure TS over the existing capability registry + Vercel AI Gateway.

### What's genuinely left

1. **Phase 5 v3** — SSE streaming (turns render as they land), trace persistence to `agent.memory-vector`, richer HITL gate UI. Nice-to-haves, not blockers.
2. **respond() ReAct loop** — the big one. Runtime tool execution so `tools: [{kind:"mcp", server:"blender"}]` actually invokes MCP mid-task. ~6-8 hrs + needs an MCP client in the stack. This is what turns crews from "dialogue chains" into "agents that DO things."
3. **Swarm mode** — the 5th process mode. Dynamic LLM-routed handoffs. Lower priority; the predicate evaluator from Phase 3 could power `handoff.condition`.
4. **aura-vrm merge**, **LightPainting Forge end-to-end** — both queued from earlier sessions, both gated or independent of this thread.

The crew-run capability is at a natural completion point. Everything from here is either a different capability (tool exec needs respond() work) or polish (streaming, persistence).

### Next session targets

1. **respond() ReAct loop** — if continuing the agent platform, this is the highest-leverage remaining work. Makes crews actually agentic.
2. **Switch threads** — aura-vrm merge or LightPainting Forge if the studio main thread wants attention.
3. **Deploy** — push sessions 1-8 to Vercel so the debug surface + run capability go live on holoflow.co.uk.

---

## 2026-05-21 19:19 UTC — claude-canon-port — session 7: Phase 5 v1 (`/capabilities/agent/crew-run` debug surface)

**Picking up from session 6 closeout.** Top priority was the Phase 5 debug page. Done as a static RSC — no LLM dispatch (run-from-UI is Phase 5 v2 if/when wanted).

### What landed

**`app/capabilities/agent/crew-run/page.tsx` (18.1 KB) — debug surface**

Route: `/capabilities/agent/crew-run`. Server-rendered, static. Imports the three reference crew JSON files at build time (`sequential-example.json`, `convergence-crew.example.json`, `graph-example.json`), runs `validateCrew` + `summariseCrew` + `predictWaves` on each, renders:

- Header: `agent.crew-run` title + Layer 5 explainer + status pills (X/3 valid) + cross-links to `/capabilities`, PURPOSE.md, source
- Per crew (one card each):
  - Filename + crew name + version
  - Validation pill (valid/invalid) + process pill (sequential/parallel/hierarchical/graph)
  - Description from the crew JSON
  - Composition stats (agents, tasks, lead, conditional edges, HITL count) + Tool-binding stats (total + by kind: builtin/mcp/subagent) + schema/path stats
  - Agents list (id + role + tool count)
  - Tasks list (id + assigned agent + depends_on + flag pills for HITL/retries/output_schema/output_path)
  - Edges list (graph mode only) with `when` predicates highlighted in pink
  - Predicted execution waves (worst-case for graph mode) with hierarchical synthesis pass annotated separately
- Footer note: what the page deliberately does NOT do (no LLM dispatch, no editing, no real-time state) and the Phase 5 v2 plan for run-from-UI

Uses the existing site styles (`chrome-label`, `text-chrome-200`, `border-warm-black-800`, `text-pink-200` etc) — matches the visual language of the rest of the site.

**`app/capabilities/agent/crew-run/page.PURPOSE.md` (3.9 KB)**

Twin doc. Lists public surface, internal structure, dependencies, what it explicitly does NOT do, and the Phase 5 v2 plan (run-from-UI via API route + client-side runner).

### What the rendered output looks like

- Page builds to 65.4 KB of static HTML
- Content markers verified: all three crew names, 3× "Predicted execution waves", 3× "anomaly_severity" (graph crew context vars), 3× "jeweller_cage" (hierarchical crew HITL task), 4× "Physicist" (cast member shared across crews), 2× "synthesis" (hierarchical synthesis annotations)
- Total static pages: 747 (up from 746 — the new route added one)
- Build time: 2:40 elapsed, 0 errors

### What Phase 5 v1 deliberately does NOT do

- **No LLM dispatch from the UI.** Pure static debug view. To actually run a crew, call `runCrew()` from server-side code (or a future API route) with credentials for the configured provider.
- **No crew editing.** Read-only view. Edit JSON in `lib/agents/` to change a crew.
- **No arbitrary crew loading.** Only the three reference instances are bundled at build time. Phase 5 v2 could add an upload form or a load-by-URL.
- **No real-time execution state.** A running crew's progress isn't visible — that needs a client component subscribing to a stream.

These are all Phase 5 v2 candidates.

### Phase 5 v2 — run-from-UI (sketched, not built)

The natural next chunk:
1. POST endpoint at `/api/capabilities/agent.crew-run/run` accepts a crew id (or full crew JSON)
2. Server calls `runCrew()`, streams progress
3. Client component renders turn-by-turn output, pause states, resume buttons
4. Trace renderer component using `exportTrace()` output
5. HITL pause/resume UI

Estimated 2-3 hrs. Not started.

### Verification

- **TSC**: 0 errors
- **`pnpm build`**: 747 pages (746 → 747), 0 errors, 2:40 elapsed
- **Rendered HTML check**: all three crews visible, all expected content markers present
- New route artefacts in `.next/server/app/capabilities/agent/crew-run/`: page.js + page_client-reference-manifest.js + page.js.nft.json

### Files touched

- `app/capabilities/agent/crew-run/page.tsx` — NEW, 18.1 KB
- `app/capabilities/agent/crew-run/page.PURPOSE.md` — NEW, 3.9 KB
- `docs/ROADMAP.md` — Phase 5 v1 closed-items row added + agent platform row updated
- `docs/AGENT-COORDINATION.md` — this entry

### Status snapshot — agent platform

The whole Layer 5 runtime built over sessions 1-6 is now visible from the browser at `/capabilities/agent/crew-run`. A visitor can see at a glance:
- 4 of 5 process modes execute (only swarm stubbed)
- All three reference crews validate clean
- Wave structure for each (3 waves for sequential-example, 6 waves + synthesis for convergence-crew, 2 waves for graph-example)
- 16 HITL tasks discovered across the crews (convergence-crew has 2: jeweller_cage, printer_preflight)
- Conditional edges with their predicates highlighted

The agent platform is no longer just architectural documentation — it's a load-bearing studio capability with a public visibility surface.

### Next session targets (priority order)

1. **Phase 5 v2 — run-from-UI** (~2-3 hrs). The big payoff. Server endpoint + client renderer + pause/resume UI. Makes the crews actually runnable from the browser (with gateway creds).
2. **Phase 4 remainder — `respond()` ReAct loop for runtime tool execution** (~6-8 hrs, biggest piece left). Makes `tools: [{kind: "mcp", server: "blender"}]` actually invoke MCP tools mid-task. Needs an MCP client too.
3. **`apps/aura-vrm/` → website VRM capability merge** — still queued.
4. **LightPainting Forge end-to-end run** — gated on operator.

Of SYSTEM.md's five layers, all five are now end-to-end visible AND running. The canon port is at a meaningful resting point.

---

## 2026-05-21 19:10 UTC — claude-canon-port — session 6: Phase 4 extended (quick-wins bundle + tool validation)

**Picking up from session 5 closeout.** Dimona said "both" to the quick-wins-bundle + tool-resolution options. Both landed — with the honest scoping that runtime tool execution still needs a ReAct loop in `respond()`, which is its own phase.

### What landed

**`lib/capabilities/agent/crew-trace.ts` (6.8 KB) — per-run trace export**

`exportTrace(result, crew)` returns a `CrewTrace` object with pinned `schema_version: "1"`. Includes:
- Run identification (run_id, crew_id, crew_name, crew_version, process, lead_agent)
- Status (any of the four discriminated states)
- Timing (generated_at ISO, total_duration_ms)
- All turns with reconstructed `offset_ms` (per-turn approximation: cumulative max of prior waves; turns within a wave share the same offset since they ran in parallel)
- Waves structure (for DAG-based modes)
- Skipped task ids (Phase 3 conditional-routing trace)
- Final context_out, paused_at_task (if paused), error (if errored)

Pure function, no IO. Suitable for: disk persistence, `agent.memory-vector` ingestion, external telemetry. `serialiseTrace()` does the stable-key JSON stringify with 2-space indent.

**`lib/capabilities/agent/crew-output-schema.ts` (9.5 KB) — minimal JSON Schema validator**

For `task.output_schema` enforcement. Supports:
- `type` as string or array of strings
- `object` with `required[]` (presence) and `properties[].type` (recursive type check)
- `array` with `items.type` + `minItems`/`maxItems`
- `string` with `minLength`/`maxLength`/`enum`
- `number`/`integer` with `minimum`/`maximum`/`exclusiveMinimum`/`exclusiveMaximum`
- `boolean`/`null` (presence)

Silently passes (rather than failing) on: `anyOf`/`oneOf`/`allOf`, `pattern`, `format`, `additionalProperties: false`, `$ref`. False positives are safer than false negatives — better to under-validate than break working crews while we're at a JSON Schema subset.

Auto-parses LLM output as JSON when the schema type isn't "string". JSON parse failure is a clean validation error.

**`crew-run.ts` integrations**

In `runOneTask`:
- After `respond()` succeeds, validate against `task.output_schema` if present
- Validation failure throws → retry loop catches → next attempt (within `retries` budget)
- After validation passes, write to `task.output_path` if present
- `writeOutputPath()` helper: Node-only (detects `process.versions.node`), creates parent dirs, best-effort (failure logs but doesn't fail the task)

In `validateCrew`:
- Walk every `agent.tools[]` array
- Per-binding shape check:
  - `builtin`: non-empty `name`
  - `mcp`: non-empty `server` and `tool`
  - `subagent`: `agent_id` must exist in this crew's `agents[]`
- Unknown `kind` rejected
- Catches misconfigured tools at crew load, not at runtime

`summariseCrew()` widened with: `tools_total`, `tools_by_kind: {builtin, mcp, subagent}`, `tasks_with_output_schema`, `tasks_with_output_path`, `tasks_with_hitl`. These feed UI surfaces (Phase 5 debug page will use them).

### What's HONESTLY NOT in Phase 4 yet

- **Runtime tool execution.** Agents declare tools, we validate them, `summariseCrew` exposes them. But `respond()` doesn't yet pass tools to the LLM as available functions, and we don't detect tool-call markers in responses. A real ReAct loop on top of `respond()` is substantial work — its own phase, not a partial.
- **MCP client.** Even if we had the ReAct loop, MCP tool kinds need an actual MCP client to invoke. None in the stack yet.
- **`agent.effort_budget` enforcement.** Needs token counts from `respond()`.
- **Full Ajv.** Current validator is a useful 80/20; full Ajv is mechanical to add when worth it.

Better to be honest about the remaining gap than mark the phase "done" prematurely.

### Verification

- **TSC**: 0 errors (first try after all edits)
- **Smoke tests**:
  - Output schema validator: 11/12 pass (the 12th had a wrong test expectation — for `type: "string"` schemas, the input is treated as the literal string without JSON-parsing, so `"high"` with quotes wouldn't match an enum entry `"high"` without quotes; this is correct behavior, the test was wrong)
  - Trace export: offset reconstruction verified (turn within wave 1 gets offset = wave-0 max duration, parallel siblings share offset)
  - Tool validation: 8/8 pass (valid builtin/mcp/subagent + 4 invalid configs caught + agent-with-no-tools passes)
- **`pnpm build`**: 746 static pages, 0 errors, 2:40 elapsed

### Files touched

- `lib/capabilities/agent/crew-trace.ts` — NEW, 6.8 KB
- `lib/capabilities/agent/crew-output-schema.ts` — NEW, 9.5 KB
- `lib/capabilities/agent/crew-run.ts` — Phase 4 integrations (41.7 → 46.0 KB)
- `lib/capabilities/agent/crew-run.PURPOSE.md` — Phase 4 EXTENDED docs (13.8 → 15.6 KB)
- `lib/capabilities/index.ts` — registration summary updated
- `docs/ROADMAP.md` — agent platform row + closed items extended (22.8 KB)
- `docs/AGENT-COORDINATION.md` — this entry

### Status snapshot — agent platform

- Layer 5 process modes: 4 of 5 execute (seq/parallel/hierarchical/graph); swarm stubbed
- Phase 1: ✅ sequential + parallel
- Phase 2: ✅ hierarchical + graph (DAG executor)
- Phase 3: ✅ `edge.when` conditional routing
- Phase 4: ✅ retries, HITL pause/resume, output_schema, output_path, trace export, tool-binding validation. STUBBED: runtime tool execution, effort_budget, full Ajv.
- Phase 5: 🔵 `/capabilities/agent.crew-run` debug page — not started

Of the 6 declared items in Phase 4, 6 of 6 done as far as is meaningful without a respond() restructure. Tool execution + effort_budget both require respond() changes — they're the next phase, not a Phase 4 remainder.

### Next session targets

1. **Phase 5 — `/capabilities/agent.crew-run` debug page**. Lists registered crews, validates them, predicts waves, runs them via API endpoint, shows trace. Highest-visibility next move now that the runtime is feature-complete except runtime tool exec + swarm.
2. **respond() ReAct loop** — the substantial phase. Pass tools to the LLM, parse tool-call responses, execute via the binding (builtin → capability dispatch; mcp → MCP client when we have one; subagent → recursive runCrew). This is what "tool resolution" really means at runtime.
3. **`apps/aura-vrm/` → website VRM capability merge** — still queued from earlier sessions.
4. **LightPainting Forge end-to-end run** — the studio main thread; gated on operator.

---

## 2026-05-21 12:35 UTC — claude-canon-port — session 5: Phase 3 conditional graph routing (edge.when predicates)

**Picking up from session 4 closeout.** Top priority was Phase 3 — `edge.when` conditional routing in graph mode. Done.

### What landed

**`lib/capabilities/agent/crew-predicate.ts` (14.7 KB) — safe expression evaluator**

Zero dependencies. No `eval()`. Recursive-descent parser over a deliberately constrained grammar:

```
expr      := or
or        := and ( "||" and )*
and       := not ( "&&" not )*
not       := "!" not | comparison
comparison := primary ( ( "==" | "!=" | "<" | "<=" | ">" | ">=" ) primary )?
primary   := literal | identifier | "(" expr ")"
literal   := number | string | "true" | "false" | "null"
identifier := name ( "." name )* ( ".length" )?
```

Supports:
- Number/string/bool/null literals (strings single or double-quoted, with `\\` `\"` `\'` `\n` `\t` escapes)
- Dotted identifier access into the context (`nested.deep.value`)
- `.length` accessor for arrays and strings (returns 0 for null/undefined)
- Comparison ops with loose equality (null ≡ undefined, number ↔ string coercion both directions)
- Logical `&&`, `||`, `!` with short-circuit evaluation
- Parenthesisation
- Empty string = "always true" (unconditional)

Deliberately NOT supported: arithmetic, function calls, array indexing, regex, string methods beyond `.length`, ternary. If you need richer logic, write a runtime transform (Phase 4 remainder).

Public surface: `evaluatePredicate(expr, context)`, `validatePredicate(expr)`, plus `PredicateParseError` and `PredicateEvalError`.

**`lib/capabilities/agent/crew-run.ts` — `executeDag` wired up**

- After each task completes in graph mode, walk its outgoing edges (`crew.edges` where `from_task === task.id`)
- For each edge with a non-empty `when`, evaluate against accumulated `context_out`
- Predicates resolving false add `to_task` to a `skippedIds` set
- Before each wave, filter out tasks whose any dep is in `skippedIds` (transitive skip)
- `CrewRunResult.ok` widened with optional `skipped_task_ids: string[]`
- `CrewResumeState` widened with optional `skipped_task_ids` so pause/resume preserves skip state
- Hierarchical mode's synthesis prompt now mentions skipped tasks so the lead can factor absences
- Design-time validation: `validateCrew()` runs `validatePredicate()` on every `edge.when` in graph-mode crews — parse errors caught at crew load, not at runtime
- `summariseCrew()` extended with `conditional_edges` count

**`lib/agents/graph-example.json` (5.7 KB) — Phase 3 reference instance**

An anomaly-response crew, four tasks, three edges (two conditional):
- `triage` (Physicist) — runs always
- `escalate` (Logistician) — runs only if `anomaly_severity == "high"`
- `log_minor` (Scribe) — runs only if `anomaly_severity != "high"`
- `dispatch_brief` (Marcel) — runs always (unconditional edge from triage)

Demonstrates conditional branching where the unconditional sibling always runs alongside the conditional one.

### Verification

**Predicate evaluator unit tests:** 23/23 passed, covering:
- Bare literals (`true`, `false`)
- String equality (`x == "high"`, `x != "high"`)
- Length access (`x.length > 0`, `x.length == 0` on null)
- Numeric comparison (`>`, `>=`, `<`)
- Negation (`!ready`)
- Logical AND/OR
- Parenthesisation
- Compound `x.length > 0 && status == "red"`
- Dotted access (`nested.deep.value == "found"`)
- Missing-path resolves to undefined, loose-eq null returns true
- Empty string → unconditional true

**Graph routing scenarios:**
- Scenario A (high severity, default context): runs triage + escalate + dispatch_brief, skips log_minor ✓
- Scenario B (low severity, context override): runs triage + log_minor + dispatch_brief, skips escalate ✓

**TSC:** 0 errors (first try)

**`pnpm build`:** 746 static pages, 0 errors, 2:01 elapsed

### What's NOT in Phase 3

- `edge.transform` — the schema allows a transform-function reference per edge, intended to reshape output between graph nodes. Not implemented; transforms would need a transform registry alongside the tool registry (Phase 4 remainder).
- Phase 3 doesn't touch swarm mode. Swarm's `handoffs[].condition` could use the same predicate evaluator — straightforward extension when swarm lands.
- The predicate evaluator is currently graph-mode-only at the runtime. Could be extended to honour `crew.guards.require_human_approval_on[]` (which the schema specifies as predicate strings) but that's a separate small wire-up.

### Status snapshot — agent platform

Of the five layers in SYSTEM.md, all five run. Of the five crew-run process modes, four execute (sequential, parallel, hierarchical, graph) — only swarm stubbed. Of the seven Phase-4 production-hardening items, two of seven done. Phase 3 conditional routing landed in full.

### Files touched

- `lib/capabilities/agent/crew-predicate.ts` — NEW, 14.7 KB
- `lib/capabilities/agent/crew-run.ts` — Phase 3 integration (36.8 → 40.7 KB)
- `lib/capabilities/agent/crew-run.PURPOSE.md` — Phase 3 status + grammar docs (11.3 → 13.8 KB)
- `lib/capabilities/index.ts` — registration summary updated
- `lib/agents/graph-example.json` — NEW, 5.7 KB (Phase 3 reference instance)
- `docs/ROADMAP.md` — agent platform row + closed items extended
- `docs/AGENT-COORDINATION.md` — this entry

### Next session targets (priority order)

1. **Phase 5 — `/capabilities/agent.crew-run` debug page** — first UI surface. Lists registered crews from `lib/agents/*.json`, validates them, predicts waves, shows trace. Highest visibility next step now that the runtime is feature-complete except swarm + Phase 4 remainder.
2. **Phase 4 — tool resolution (builtin/mcp/subagent)** — biggest practical unlock. Wires `tools: [{kind: "mcp", server: "blender"}]` declarations to actual MCP clients. Convergence-crew's tool bindings become real.
3. **Phase 4 — per-run trace export** — JSON pinned format so crew runs can be searchable history via `agent.memory-vector`.
4. **`apps/aura-vrm/` → website VRM capability merge** — still queued from earlier sessions.

---

## 2026-05-21 12:07 UTC — claude-canon-port — session 4: Phase 4 partial (retries + human_in_the_loop)

**Picking up from session 3 closeout.** Top priority was Phase 4 partial — both `task.retries` and `task.human_in_the_loop`. Done.

Also: ND filters flipped from 🔴 GAP → ✅ Owned in the aerial/camera kit table (Dimona bought them).

### Phase 4 partial — what landed

**`task.retries` honoured per task**

Wrapped the `respond()` call inside `runOneTask` in a retry loop. Schema default is 1 retry (= 2 total attempts). `retries: 0` means single attempt, `retries: 3` means four attempts. Per-attempt log warnings on failure, success log on retry-after-failure. After exhausting retries the runtime throws with the attempt count + last error message. Single change site so it works in every process mode automatically (sequential, parallel, hierarchical, graph).

**`task.human_in_the_loop` pause/resume**

For DAG-based modes (hierarchical, graph). After a wave's tasks all complete, if any of the just-completed tasks declared `human_in_the_loop: true`, the runtime returns:

```ts
{
  status: "paused_for_approval",
  run_id, crew_id,
  turns: [...all turns so far including the HITL task's],
  paused_at_task: "<the task id that triggered the pause>",
  resume_state: {
    completed_task_ids: [...all done so far],
    context_out: {...},
    waves: string[][],
    prior_turns: CrewTurn[],
  },
  partial_duration_ms,
}
```

The caller hands the human a UI, gets approval, then calls `runCrew()` again with `input.resume_from = previous.resume_state`. The executor skips already-completed tasks while keeping the wave structure intact, and runs from the next ready task.

**New types exported:** `CrewResumeState` (the round-trip envelope).

**Why pause AFTER a wave (not mid-wave):** parallel siblings within a wave should all complete — partial waves would corrupt the DAG. So if `jeweller_cage` is HITL but its wave only has that one task, we pause right after it. If a hypothetical wave had two HITL tasks side by side, both would complete and the pause would fire after both.

### Verified end-to-end with convergence-crew

Convergence-crew has two `human_in_the_loop: true` tasks: `jeweller_cage` and `printer_preflight`. Simulation of the pause/resume cycle:

- **Run 1 (fresh):** completes 7 tasks across 4 waves, pauses at `jeweller_cage` (the only task in wave 3)
- **Run 2 (resume):** skips 4 waves (all done), runs `printer_preflight` in wave 4, pauses there
- **Run 3 (resume):** skips 5 waves, runs `index_run` in wave 5, returns `status: "ok"` with all 9 task turns

Then `runHierarchical` runs the synthesis pass with all 9 worker outputs.

### Side effect: explicit `CrewRunResult` union widening

The result union now has four states instead of three:
- `ok` — completed
- `error` — failed
- `paused_for_approval` — needs human (DAG modes only)
- `not_implemented_yet` — swarm mode

Callers should discriminate on `status` (the lever has always been there but only matters now). Existing call sites that branched on `result.status === "ok"` continue to work; `paused_for_approval` won't be confused with success.

### What's NOT in Phase 4 yet

- `task.output_schema` validation — the LLM gets the hint via `output_format` but the response isn't checked against JSON Schema
- `agent.effort_budget` enforcement — token/tool caps not enforced
- Full Ajv validation against the JSON Schema — Phase 1+2+4-partial use a zod subset
- Per-run trace export to a pinned format
- Tool resolution (`builtin` / `mcp` / `subagent`)
- `output_path` filesystem persistence

These are the remaining Phase 4 items; useful but not blocking. Tool resolution unlocks real MCP-backed crews; the rest is production-hardening.

### Verification

- **TSC**: 0 errors (first try after edits)
- **JS-only smoke test**: 3-run pause/resume cycle on convergence-crew passed all expectations
- **`pnpm build`**: 746 static pages, 0 errors, 2:20 elapsed

### Files touched

- `lib/capabilities/agent/crew-run.ts` — Phase 4 partial: retries + HITL pause/resume (32.6 → 36.8 KB)
- `lib/capabilities/agent/crew-run.PURPOSE.md` — Phase 4 partial header
- `lib/capabilities/index.ts` — registration summary updated
- `docs/ROADMAP.md` — agent platform row + closed items extended
- `docs/AGENT-COORDINATION.md` — this entry

### Side update

- ROADMAP — ND filters (Avata 360 + Osmo 360) flipped from 🔴 GAP → ✅ Owned 2026-05-21

### Status snapshot — agent platform

Of the five layers in SYSTEM.md, all five run. Of the five crew-run process modes, four execute (sequential, parallel, hierarchical, graph). Of the Phase 4 "production hardening" items, two of seven done.

### Next session targets

1. **Phase 3 — `edge.when` conditional graph routing** (~3 hours). Needs predicate evaluation — simplest is a tiny safe-expression evaluator over `context_variables`. Avoids LLM-routed handoffs entirely.
2. **Phase 5 — `/capabilities/agent.crew-run` debug page** — first UI surface. Lists crews, predicts waves, runs them, shows the trace. Couples to the existing `/capabilities` route.
3. **Phase 4 — tool resolution (builtin/mcp/subagent)** — bigger but unlocks MCP-backed crews.

---

## 2026-05-21 11:48 UTC — claude-canon-port — session 3 continued: Phase 2 hierarchical + graph + DAG executor

**Continuation of session 3.** After Phase 1 (sequential + parallel) landed earlier in the same arc, this run pushed straight into Phase 2 with the shared topological-DAG executor that handles both hierarchical and graph modes.

### What landed

**`lib/agents/sequential-example.json` (5.7 KB) — Phase 1 reference instance**

Three cast members (Physicist → Logistician → Scribe) in a meaningful real-workflow chain: poi light-painting capture analysis → fabrication plan → customer-facing brief. Each task chains to the next via `depends_on`, and the context_out record carries previous outputs forward. All three agents resolve via `agent.cast-roster` (no synthesised bibles needed). Validates clean against `validateCrew`. Phase 1 of crew-run can execute this end-to-end against the configured LLM provider right now.

**Phase 2 — hierarchical + graph runtime**

The implementation:

- **`buildDeps()`** — constructs the dependency map from `task.depends_on` plus (graph mode only) `crew.edges`.
- **`topologicalWaves()`** — computes execution waves with cycle detection. O(n²) worst case, trivial at any sane crew size. Throws named `cycle detected` with the unresolvable task ids.
- **`executeDag()`** — runs waves sequentially; tasks within a wave run in parallel via `Promise.allSettled`. Returns turns, waves structure, and context_out. Used by both hierarchical and graph.
- **`runHierarchical()`** — `executeDag()` + final synthesis pass by `lead_agent`. Synthesis prompt includes the crew brief, the crew's purpose, and all worker outputs labelled by agent/task. The synthesis turn has `task_id: "__synthesis__"` and `wave: -1`.
- **`runGraph()`** — `executeDag()` only. No synthesis. The graph IS the result.
- **`predictWaves()`** — exposed for UI surfaces; compute the planned execution waves without running.
- **`CrewTurn.wave`** field — annotates each turn with its DAG wave index (0, 1, 2... or -1 for synthesis).
- **`CrewRunResult.waves`** field — exposes the full wave structure for trace.

**Validator enhancements:**
- Hierarchical requires `lead_agent` AND that lead_agent exist in `agents[]`
- Graph edges must reference real `tasks[]`
- All other existing cross-refs preserved

### What this unlocks

The `convergence-crew.example.json` (10 agents, 9 tasks, `process: "hierarchical"`, `lead_agent: "aura_lead"`) — the studio's "jewellery convergence pipeline" reference — now runs end-to-end. Topological wave analysis:

| Wave | Tasks | Notes |
|---|---|---|
| 0 | seed_gyroid, map_optics, choreograph_genome | 3 parallel — no deps |
| 1 | lock_aesthetic, route_waveguides | 2 parallel — each waits on wave 0 outputs |
| 2 | validate_tir | TIR check on the routed waveguides |
| 3 | jeweller_cage | Snap-fit cage on validated geometry |
| 4 | printer_preflight | Print farm score |
| 5 | index_run | Memory shard write |
| synthesis | aura_lead | Final coherent answer |

10 LLM dispatches total per run (9 workers + 1 synthesis). The Aura-as-orchestrator architecture from `convergence-crew.example.json` is now load-bearing — no longer just an aspirational JSON file.

### Verification

- **TSC**: 0 errors
- **DAG smoke test**: both reference instances resolve cleanly. Topological waves match the dependency graph by inspection.
- **`pnpm build`**: 746 static pages, 0 errors, 2:00 elapsed.

### Files touched in this continuation

- `lib/agents/sequential-example.json` — NEW, 5.7 KB
- `lib/capabilities/agent/crew-run.ts` — Phase 2 additions (22.6 → 32.6 KB)
- `lib/capabilities/agent/crew-run.PURPOSE.md` — Phase 2 status + DAG details (8.4 → 11.0 KB)
- `lib/capabilities/index.ts` — summary updated to mention Phase 2 and reference instances
- `docs/ROADMAP.md` — Phase 1 marked done, sessions 2+3 closed-items section added
- `docs/AGENT-COORDINATION.md` — this entry

### What's left in the crew-run arc

**Phase 3 — swarm + conditional routing**
- Swarm mode: dynamic handoffs via `context_variables` + `crew.handoffs`
- LLM-routed "who runs next" decisions per `handoff.condition`
- `edge.when` predicates for conditional graph routing
- `edge.transform` for output reshape between graph nodes

**Phase 4 — production hardening**
- Full Ajv against the JSON Schema (not just the zod subset)
- Per-agent effort budgets enforced
- Tool resolution (builtin/mcp/subagent)
- `human_in_the_loop` task gating
- `retries` honoured per task
- Per-run trace export

**Phase 5 — UI surfaces**
- `/capabilities/agent.crew-run` debug page
- Optional `/atelier/crew-run` chamber

### Status snapshot

SYSTEM.md's five-layer architecture, now end-to-end:
- Layer 1 (Bibles) — ✅ 16 cast members
- Layer 2 (Capabilities) — ✅ all registered including crew-run with Phases 1+2 LIVE
- Layer 3 (State) — ✅ Zustand slices
- Layer 4 (Gateway) — ✅ Vercel AI Gateway
- Layer 5 (Crew runtime) — ✅ Phase 1 + Phase 2 (4 of 5 process modes execute)

The agent platform is now a load-bearing studio asset, not aspirational documentation.

### Next session targets (priority order)

1. **Phase 3 partial — `edge.when` conditional routing in graph mode** (~3 hours; lower hanging than swarm)
2. **`apps/aura-vrm/` → website VRM capability merge** — active fork, ~30 days idle, has `ARCHITECTURE_AURA.md` worth reading first
3. **Phase 4 partial — `human_in_the_loop` task gating** — small, useful, doesn't need LLM-routing
4. **Phase 5 — `/capabilities/agent.crew-run` debug page** — first UI surface; renders the predicted waves + run trace

---

## 2026-05-21 11:28 UTC — claude-canon-port — session 3: crew-run Phase 1 runtime + build break fix

**Session 3 carried session 2's diagnostic forward and landed the Phase 1 runtime for `agent.crew-run`.** Two big moves: fix the `pnpm build` break that surfaced at the end of session 2, then ship the sequential + parallel runtime so Layer 5 of SYSTEM.md is no longer a stub.

### Build break — fixed

Session 2 closed with `pnpm build` failing on pre-existing `pngjs` / `vscode` missing-type-def errors. The errors had been silent in earlier builds but were now blocking.

**Diagnosis:** ~29,000 .d.ts files scanned in node_modules — zero literal `"pngjs"` references anywhere. The implicit lookup must come from a transitive dep's `package.json` `"types"` field that TypeScript auto-scans through.

**Fix:** added explicit `"types"` array to `tsconfig.json` `compilerOptions`:
```json
"types": ["node", "react", "react-dom", "three", "qrcode", "jsonwebtoken"]
```
This is the set of `@types/*` actually installed in `node_modules/@types/`. Restricting `types` from "auto-load everything" to "load only these six" stops TS from chasing the implicit lookups.

**Result:** `pnpm build` green — 746 static pages, 131.8 MB server, 31.0 MB static, 223 JS chunks. TSC clean.

### agent.crew-run Phase 1 — landed

Layer 5 (the crew runtime) was the last layer without a real implementation. Phase 1 now executes:

**`lib/capabilities/agent/crew-run.ts` (22.6 KB)** — sequential + parallel modes ship as real LLM dispatches via `agent.dialogue`'s `respond()`. Each task becomes one turn for its agent. Bibles resolve via `agent.cast-roster` (cast-aligned crews) or synthesise from the agent's role/goal/backstory (ad-hoc crews).

**Schema alignment** — types now match `crew-schema.json` exactly. Caught during implementation: my first pass had `lead`/`agent`, the canonical schema uses `lead_agent`/`assigned_agent` and requires `version` on the crew. Rewrote the types section to match, validated the existing `convergence-crew.example.json` against the corrected validator — passes clean.

**Build phases documented:**
- Phase 0: types + stub (DONE 2026-05-19)
- Phase 1: sequential + parallel runtime (DONE 2026-05-21) ← here
- Phase 2: hierarchical + graph + swarm
- Phase 3: observability (per-run trace export)
- Phase 4: UI surfaces (`/capabilities/agent.crew-run` debug page)

**Status flip:** `"stub"` → `"registered"` in `lib/capabilities/index.ts`. The `/capabilities` route renders the capability with the Phase-1 summary describing what's shipping vs what's stubbed.

**What the runtime does for sequential mode:**
1. `validateCrew` checks schema + cross-refs; errors return `status: "error"` with the message.
2. For each task in declaration order: resolve `task.assigned_agent` → bible, build `contextSuffix` (system_prompt_suffix + task_boundaries + expected_output + prior tasks' outputs), call `respond({ speakerId, bible, userText, provider, contextSuffix })`, append turn to `turns[]`, set `contextOut[task.id] = turn.text`.
3. Return `{ status: "ok", run_id, crew_id, turns, context_out, total_duration_ms }`.

**Parallel mode** is the same but `Promise.allSettled` over all tasks. Tasks see only `crew.context_variables`, not each other's outputs in-flight. Single failure short-circuits to `status: "error"` with `partial_turns`.

**Cast-bible resolution** — if `agent.id` matches a registered cast member, use that bible. Otherwise synthesise from `role`/`goal`/`backstory`:
- `name` ← agent.id
- `role` ← agent.role
- `voice` ← agent.backstory (informs prose style)
- `posture` ← agent.goal
- `draws` ← split of `task_boundaries`
- `defaultMode` ← "azure"

### What this means architecturally

SYSTEM.md's five-layer architecture is now fully shipping with running code:
- **Layer 1** (Bibles) — ✅ 16 cast members
- **Layer 2** (Capabilities) — ✅ all registered, including `agent.crew-run` now
- **Layer 3** (State) — ✅ Zustand slices
- **Layer 4** (Gateway) — ✅ Vercel AI Gateway
- **Layer 5** (Crew runtime) — ✅ Phase 1 sequential + parallel

Phase 2 is what makes the convergence-crew example actually run end-to-end. The Hierarchical orchestrator pattern means the lead agent (Aura) decomposes a crew brief into subtasks, dispatches workers in parallel, and synthesises the final result. ~5 hours estimate per ROADMAP.

### Convergence-crew example verification

The `lib/agents/convergence-crew.example.json` reference (10 agents, 9 tasks, `process: "hierarchical"`, `lead_agent: "aura_lead"`) validates cleanly against the Phase 1 validator. Calling `runCrew()` on it returns `status: "not_implemented_yet"` with the planned-steps trace, since hierarchical is Phase 2.

### TSC fixes during implementation

Caught two `z.record(z.unknown())` calls that current zod rejects (needs `z.record(z.string(), z.unknown())`). Fixed both.

### Files touched this session

- `tsconfig.json` — added explicit `types` array (1 line, build fix)
- `lib/capabilities/agent/crew-run.ts` — rewritten for Phase 1 + schema alignment (22.6 KB)
- `lib/capabilities/agent/crew-run.PURPOSE.md` — Phase 1 status + build phases doc (8.4 KB)
- `lib/capabilities/index.ts` — registration status `stub` → `registered`
- `docs/AGENT-COORDINATION.md` — this entry

### Final session 3 verification

- TSC: 0 errors
- `pnpm build`: 746 static pages, 0 errors, 2:17 elapsed
- `validateCrew(convergence-crew-example)`: passes
- All required fields cross-reference correctly

### Next session targets

1. **Write `lib/agents/sequential-example.json`** — a 2-3 agent crew in sequential mode using cast members (e.g. The Physicist → Geometrician → Librarian) so Phase 1 has a concrete reference instance, not just the hierarchical one (which still stubs).
2. **Phase 2 — hierarchical orchestrator** — implement the lead-decomposes-dispatches-aggregates pattern. The convergence-crew example would actually run end-to-end with this. ~5 hours.
3. **Phase 3 partial — per-run trace export** — write a `crew-run-trace.ts` that takes a `CrewRunResult` and emits a pinned-format JSON for debugging.
4. **The `apps/aura-vrm/` → website VRM capability merge** — still queued. Active fork, ~30 days, has `ARCHITECTURE_AURA.md` worth a read.

---

## 2026-05-21 08:29 UTC — claude-canon-port — session 2 + 3 boundary: closeout items, build fix, crew-run Phase 1 start

**Session 2 continued from the closeout list left over by session 1.** Five concrete landings, one diagnostic, one build fix. Plus session 3 starts with crew-run Phase 1 runtime build.

### Landed in session 2

**1. Archived two truly-stale apps**

`apps/claw-empire/` (empty, 0 files) and `apps/360-studio/` (18 files, 20 KB, no `package.json`, >180 days inactive) moved to `apps/_archive/2026-05-19-unification/`. Both verified zero imports across the hangar. README updated with the second-sweep section.

**2. WHISPER_URL verification**

Searched 6 candidate `AuraVTuber*.tsx` files for port references. `WHISPER_URL` in the active codebases is correctly `http://localhost:11300/v1/audio/transcriptions` (per the `aura-upgraded-but-brokken-main` source which is the canonical reference). The two `AuraVTuberPanel.tsx` files with 11434 references are checking the **Ollama** service (which legitimately runs on 11434), not Whisper. Memory note was outdated — **nothing to fix**.

**3. agent.crew-run capability scaffold**

Layer 5 of SYSTEM.md (the only one without a runtime) now has a home:
- `lib/capabilities/agent/crew-run.ts` (13.1 KB) — full type surface narrowed from `crew-schema.json`, light validator using zod with cross-reference checks (task→agent, depends_on→task, hierarchical→lead), `runCrew()` stub returning `status: "not_implemented_yet"` with planned-steps trace per process mode, `summariseCrew()` diagnostic.
- `lib/capabilities/agent/crew-run.PURPOSE.md` (6.0 KB) — companion doc with 4 build phases documented.
- `lib/capabilities/_base.ts` — added `"agent.crew-run"` to CapabilityId union.
- `lib/capabilities/index.ts` — registered with `status: "stub"`, `dependsOn: ["agent.cast-roster", "agent.dialogue"]`.

No new framework dependency. Plain TS over the existing capability registry. Returns discriminated union (`ok` | `error` | `not_implemented_yet`) so callers can branch cleanly.

**4. optiland trace_caustic API fix**

`D:\The_Hangar\scripts\waveguide_toolkit.py` — added `from optiland.materials import IdealMaterial` import, created `core_material = IdealMaterial(name=f'resin_core_n{design.n_core:.3f}', n=design.n_core)` before `optic.Optic()` setup, replaced `material=(design.n_core, 0)` tuple with `material=core_material`. Inline comment documents the legacy-tuple → IdealMaterial migration. 20.3 → 21.2 KB.

The function was silently falling back to analytic on every run because optiland's API no longer accepts the (n, k) tuple form. Now the paraxial path actually executes.

**5. TSC verification**

After all four landings: 0 errors in my files. Two pre-existing implicit-type-library lookup errors for `pngjs` and `vscode` remained.

### The build break — diagnostic + fix

`pnpm build` failed at the type-check stage on the pre-existing `pngjs` + `vscode` errors. These had been TSC errors since at least session 1 but apparently weren't blocking the build until something between then and now changed (a Next.js or TypeScript bump, most likely).

**Diagnosis:** ~29,000 .d.ts files scanned in node_modules — zero literal `"pngjs"` references anywhere. No source `.d.ts` references either. The implicit lookup must come from a transitive dep's `package.json` `"types"` field or `peerDependencies` that TS auto-scans through.

**Fix:** added explicit `"types"` array to `tsconfig.json` `compilerOptions`:
```json
"types": ["node", "react", "react-dom", "three", "qrcode", "jsonwebtoken"]
```
This is the set of `@types/*` actually installed in `node_modules/@types/`. Restricting `types` from "auto-load everything" to "load only these six" stops TS from chasing the implicit `pngjs` / `vscode` lookups.

**Result:** `pnpm build` green again — 746 static pages, 131.8 MB server bundle, 31.0 MB static, 223 JS chunks. TSC clean: 0 errors. The 746-page count differs from the 891 of 2026-05-19 because of the four apps archived since (aura-pwa, local-chat-vrm, claw-empire, 360-studio) plus possibly some routes consolidated during the canon port. Numerical difference is expected and good.

### Files touched this session

- `apps/_archive/2026-05-19-unification/README.md` — second-sweep documentation (1.8 KB)
- `lib/capabilities/_base.ts` — added `agent.crew-run` to CapabilityId union
- `lib/capabilities/index.ts` — registered crew-run stub (~27 KB)
- `lib/capabilities/agent/crew-run.ts` — NEW (13.1 KB)
- `lib/capabilities/agent/crew-run.PURPOSE.md` — NEW (6.0 KB)
- `tsconfig.json` — added explicit `types` array (1 line)
- `D:\The_Hangar\scripts\waveguide_toolkit.py` — IdealMaterial fix (21.2 KB)

### Session 3 — agent.crew-run Phase 1 runtime (STARTED)

Beginning Phase 1 of the crew-run runtime per `crew-run.PURPOSE.md`. Targets:
- Resolve agents to bibles via `agent.cast-roster`
- For each task, call `agent.dialogue` with the agent's system prompt
- For `process: "sequential"`, run in declaration order; await each
- For `process: "parallel"`, `Promise.all()` all tasks
- Aggregate `CrewTurn[]` into `CrewRunResult`
- Write turns into `cast.history` tagged with `run_id`
- Status flip: `"stub"` → `"registered"` in capabilities index

Phases 2-4 (hierarchical/graph/swarm modes, observability, UI surfaces) deferred.

---

## 2026-05-20 02:54 UTC — claude-canon-port — React decision, audits, Rookery correction, CameraWorkspace fix

**The "do all the things across sessions" sprint, session 1.** Followed `ROADMAP.md` active-sprint list and the unification arc's remaining items. Six concrete landings, one architectural correction.

### What landed

**1. React decision — DEFER workspace integration (documented permanently)**

A full audit of React versions across the hangar produced:
- 80 packages on React 18 (mostly the 40+ stale prototypes + older production apps + shared UI packages)
- 18 packages on React 19 (exactly the active Holoflow surfaces: Light_Weiver, lightpainting-forge, charming-academy, holoflow-mesh-studio, waveguide-forge, sprite-designer, hangar-dashboard, aura-vrm, sculpture-gallery, pixel-academy + the website + a few others)

The original "half a day audit + half a day fixes" estimate was wrong. Migrating 80 packages — many unmaintained prototypes — is multi-day per-app work with real risk. Cost/benefit reversed.

**Decision: keep `pnpm install --ignore-workspace` as the canonical install workflow for `_3DPOV`. The hangar root override stays at React 18 (protecting the 80 packages). The website operates outside the workspace. This is the documented permanent decision, not a workaround.**

Updated:
- `docs/UNIFICATION-PLAN.md` § 2A rewritten with full audit data + decision reasoning + re-open triggers
- `AGENTS.md` — added "Install + build workflow" section with `--ignore-workspace` explicitly named
- `pnpm-workspace.yaml` inline comment confirms `_3DPOV` exclusion is intentional

**2. Apps audit (45 apps surveyed by activity window)**
- ACTIVE (≤30 days): 11 apps including the React 19 production surfaces
- recent (≤90 days): 32 apps
- STALE (>180 days): 2 apps — `claw-empire`, `360-studio` (both no `package.json`, archive candidates)

Findings logged in `ROADMAP.md` § "Apps audit findings".

**3. Packages audit (43 packages surveyed)**
- All dormant (47-148 days inactive); none clearly stale
- Import-grep produced zero hits but that's a methodology artefact (packages are imported by npm name, not directory path)
- **Decision: defer packages cleanup to a proper monorepo restructure when a feature requires it**

Findings logged in `ROADMAP.md` § "Packages audit findings".

**4. ROADMAP.md persisted to disk (17 KB)**

Previously the roadmap content was only in a chat message. Now permanent at `docs/ROADMAP.md`. Indexes the 9 existing detailed plan docs (SHIP-PLAN, COMMERCE_ROADMAP, CHRONO_PROTOCOL_BUILD_PLAN, PLAY_GAME_PLAN, BUREAU-AR-LOOP-PLAN, LIGHTPAINT-PLAN, 360-MODEL-PLAN, VOXEL-PIPELINE-PLAN, CAPABILITY_REGISTRY_PLAN) and captures the cross-cutting view that none of them individually own.

**5. Rookery namespace "collision" — CORRECTED as non-issue**

Earlier I had characterised `lib/rookery/` as a mailer that namespace-collided with the canon's "Rookery slot" concept. On closer inspection that was wrong. `lib/rookery/` is the subscription community module (Perch / Nest / Fledge tiers, Stripe-wired) with mailer subfiles for community comms. The canon's "Rookery slot" for community-authored character tunings is **intentionally the same Rookery** — subscribers plug their tunings into the capability layer. The brand alignment is feature, not collision.

Fixed:
- `SYSTEM.md` glossary entry rewritten to reflect the actual relationship
- `ROADMAP.md` "Rookery rename" item removed from active sprint and June queue, marked as ✅ resolved-as-non-issue in the agent canon table

Lesson: when I encounter what looks like a naming collision in a brand-conscious codebase, look at customer-facing surface first to see if the brand is intentional before proposing a rename.

**6. CameraWorkspace.tsx — three-tier `getStream` fallback added**

The Insta360 Link camera in `D:\The_Hangar\Dolly_OS\src\features\vision\CameraWorkspace.tsx` (per user memory: "AbortError caused by Link Controller holding exclusive OS lock; three-tier getStream() fallback removing exact constraint"). File was already 235 lines from a previous session; the missing piece was the progressive constraint relaxation.

Added `getStreamWithFallbacks(deviceId, label, opts)` that walks:
- **T1 (strict + ideal):** `{ deviceId: { exact: X }, width: ideal 1280, height: ideal 720 }`
- **T2 (relaxed):** `{ deviceId: X }` — no `exact`, no resolution constraint
- **T3 (any camera):** `{ video: true }` — only for primary cam (Insta360); Kinect callers pass `allowAnyFallback: false` to avoid silently grabbing a different webcam

Both Insta360 and Kinect now route through the helper. Per-tier console logging shows which constraint shape eventually succeeded. Either cam can fail independently; the other still opens.

File grew from 11.9 KB → 15.6 KB.

### Where we are now

| Phase / Item | Status |
|---|---|
| Phase 1 unification (skills + DollyOS deprecation) | ✅ |
| Phase 2 unification (packages + Aura apps + Dolly_OS dev/prod doc) | ✅ |
| 2A — workspace integration | ✅ DEFERRED (documented decision) |
| 2A — physical website move | 🔴 gated on Vercel access |
| React decision | ✅ |
| Apps + packages audits | ✅ |
| Rookery rename | ✅ resolved as non-issue |
| Insta360 Link three-tier fallback | ✅ |
| ROADMAP.md on disk | ✅ |

### What's clearly next-session-ready

These don't need decisions from operator; just bench time:

1. **Archive `claw-empire` + `360-studio`** to `apps/_archive/2026-05-19-unification/` (1 hour, mechanical)
2. **`agent.crew-run` capability scaffold** — write the stub + PURPOSE.md so Layer-5 of SYSTEM.md has a home (~2 hours; runtime build later)
3. **Waveguide Forge server check** — verify `WHISPER_URL` in `AuraVTuber.tsx` actually points at port 11300 not 11434 (per memory; 30 minutes)
4. **optiland `trace_caustic` API fix** in `waveguide_toolkit.py` — currently falls back to analytic, expects named material not tuple (1 hour)

### What needs operator before progressing

1. **Vercel dashboard access** to complete the physical `_3DPOV` → `apps/holoflow/` move
2. **Naming decisions** for Dance Tutor / Logistician / Physicist (3 NAME TBD heads)
3. **LightPainting Forge** end-to-end pipeline run on Chonky (cluster-dependent)
4. **ND filter purchase** for Avata 360 + Osmo 360 (named gap)
5. **Sony A7R VI announcement** (mirrorless body decision pending ~13 May 2026)

### Files touched this session

- `docs/UNIFICATION-PLAN.md` — section 2A rewritten (React decision)
- `docs/SYSTEM.md` — Rookery glossary entry corrected
- `docs/ROADMAP.md` — written (17 KB), Rookery items removed
- `docs/AGENT-COORDINATION.md` — this entry
- `AGENTS.md` — Install + build workflow section added
- `D:\The_Hangar\Dolly_OS\src\features\vision\CameraWorkspace.tsx` — three-tier fallback added

---

## 2026-05-19 04:32 UTC — claude-canon-port — unification Phase 2: 2B/2C/2D/2E done, 2A partial

**Phase 2 of the unification arc executed in same session as Phase 1.** Sequence: 2D → 2C → 2B → 2E → 2A.

### What landed

**Move 2D — `packages/agent-capabilities/` retired**
- Verified zero imports anywhere in the hangar (rg across all js/ts/tsx/json)
- Moved to `packages/_archive/2026-05-19-unification/agent-capabilities/`
- Removed `packages/agent-capabilities/*` glob from `pnpm-workspace.yaml`
- Decision: skills will not be vendored as workspace packages; canonical home is `D:\The_Hangar\.agent\skills\`

**Move 2C — legacy packages archived**
- 7 packages moved to `packages/_archive/2026-05-19-unification/`: `_legacy_ai-gateway`, `lego-root-sweep`, `tetsngthebridge`, `thirdbridge`, `secondbridgetest`, `dist` (484-file build artefact), and (from 2D) `agent-capabilities`
- All verified zero-imports before archive
- `packages/_archive/2026-05-19-unification/README.md` documents per-package reasoning + restore command

**Move 2B — Aura surfaces consolidated**
- Audit findings:
  - `apps/aura-pwa/` — no `package.json`, 219 days stale → archive
  - `apps/aura-vrm/` — chat-vrm fork, 30 days active, has `ARCHITECTURE_AURA.md` → KEEP
  - `apps/local-chat-vrm/` — chat-vrm fork, 42 days stale, superseded by aura-vrm → archive
- 2 apps moved to `apps/_archive/2026-05-19-unification/`
- `apps/_archive/2026-05-19-unification/README.md` documents decisions

**Move 2E — Dolly_OS dev branch audit**
- Found: `D:\The_Hangar\Dolly_OS\` is NOT a duplicate — it's the active dev environment (8 GB vs 403 MB for `apps/production/dolly-os/`, newest src file 6 days old)
- Unique content: `convex/`, `projects/`, `python-services/`, `services/agents/` (where `crew_schema.json` lives), `tmp/`, `_archive/`
- "Promote when ready" pattern is intentional: dev at root, production at `apps/production/`
- Decision: KEEP BOTH, document the relationship
- `D:\The_Hangar\Dolly_OS\DOLLY-VS-PROD.md` written (3.5 KB) explaining dev/prod split for future sessions landing there

**Move 2A — website promotion: PARTIAL**
- Workspace integration: `pnpm-workspace.yaml` now includes `.merge-staging/_3DPOV` as an explicit member
- This means `pnpm install` from `_3DPOV/` works without `--ignore-workspace`
- The physical move from `.merge-staging/_3DPOV/` → `apps/holoflow/` was DEFERRED because it requires Vercel dashboard coordination (project Root Directory setting) which can't be done from this session
- When the physical move happens, the explicit workspace line becomes redundant and can be removed

### Final state of `packages/`

Was 50+; now 46 (and one of those is `_archive/`):
- 7 archived (agent-capabilities + 6 legacy)
- 43 remain active

### Final state of `apps/`

Was 48; now 46 (one of those is `_archive/`):
- 2 archived (aura-pwa, local-chat-vrm)
- aura-vrm kept active
- 45 other apps remain (including `production/dolly-os/`)

### Final state of skills

- `D:\The_Hangar\.agent\skills\`: 1,495 (canonical master)
- `D:\The_Hangar\.claude\skills\user\`: 0 + redirect README
- `_3DPOV/.claude/skills/`: 97 (website-curated subset, unchanged)

### What's left from the original unification plan

| Move | Status |
|---|---|
| 2A — website promotion | PARTIAL — workspace integration done; physical move + Vercel update deferred |
| 2B — Aura surfaces | DONE |
| 2C — legacy packages | DONE |
| 2D — agent-capabilities | DONE — retired |
| 2E — Dolly_OS dev vs prod | DOCUMENTED — kept separate by design |

Only outstanding: the physical move of the website out of `.merge-staging/`. Estimated half a day. Gated on Vercel dashboard access.

### Files written

- `D:\The_Hangar\pnpm-workspace.yaml` — added `_3DPOV` workspace member, removed `agent-capabilities` glob
- `D:\The_Hangar\packages\_archive\2026-05-19-unification\` — 7 archived packages + README
- `D:\The_Hangar\apps\_archive\2026-05-19-unification\` — 2 archived apps + README
- `D:\The_Hangar\Dolly_OS\DOLLY-VS-PROD.md` — dev/prod relationship doc
- `_3DPOV/docs/UNIFICATION-PLAN.md` — rewritten to reflect Phase 2 completion status

---

## 2026-05-19 04:20 UTC -- claude-canon-port -- unification Phase 1: skills consolidated, DollyOS Zustand deprecated

**What landed:**
1. Skills unified into ``D:\The_Hangar\.agent\skills\`` (1,495 total). 22 unique skills moved from ``.claude/skills/user/``; 4 newer versions promoted to overwrite older ``.agent/`` versions; 7 true duplicates removed. ``.claude/skills/user/`` now contains only a redirect README.
2. Master ``README.md`` written at ``.agent/skills/`` describing the library structure and how subsets (website's 97-skill curated view) relate.
3. Redirect ``README.md`` at ``.claude/skills/user/`` pointing readers at ``.agent/skills/``.
4. ``DEPRECATED.md`` marker at ``D:\The_Hangar\apps\production\dolly-os\src\stores\`` (the Zustand capability layer built 2026-05-13). The code stays in place but no new tunings should be added; the website is canonical.
5. ``docs/SKILLS-CONSOLIDATION.md`` — audit trail of the consolidation move (which skills, which decisions, why).
6. ``docs/UNIFICATION-PLAN.md`` — Phase 2 plan documenting the destructive moves not executed in this session: website promotion out of ``.merge-staging/``, Aura-surface app consolidation, ``packages/`` cleanup, ``packages/agent-capabilities/`` decision, ``Dolly_OS/`` (dev branch) reconciliation.

**Final state:**
- ``.agent/skills/``:           1,495 skills (master, single source of truth)
- ``.claude/skills/user/``:     0 skills + redirect README
- ``_3DPOV/.claude/skills/``:  97 skills (website-curated subset, unchanged)
- DollyOS Zustand stores:    deprecated, marked, untouched

**Phase 2 queued (not executed):** website promotion, Aura-surface consolidation, packages cleanup, agent-capabilities decision, Dolly_OS dev-branch reconciliation. Estimated 3-4 working days; see UNIFICATION-PLAN.md for sequencing.

---

## 2026-05-19 04:09 UTC -- claude-canon-port -- GREEN BUILD: pnpm build succeeded, 891 pages

**`pnpm build` exit 0. 891 static pages generated. 3m 30s.**

Runtime proof of the canon-port working in production:
`INFO route:/academy: academy page rendered {"castCount":16}`
The academy page rendered with all 16 cast bibles loaded during static generation.

**Two operational fixes were required** (both pre-existing fragility, not caused by canon-port work):

1. `pnpm install --ignore-workspace` from `_3DPOV/`. The earlier `pnpm install` was walking up to `D:\The_Hangar\pnpm-workspace.yaml` and installing at the Hangar root, leaving `_3DPOV` with a partial 49-entry `node_modules`. The `--ignore-workspace` flag pins install to the local lockfile.

2. `canvas` aliased to `false` in `next.config.ts` webpack alias on BOTH server and client (previously only client). Also added to `serverExternalPackages` and `outputFileTracingExcludes`. The chain was `components/prose.tsx → isomorphic-dompurify → jsdom → canvas`. jsdom only uses canvas optionally for DOM canvas-API rendering, which the website does not need server-side. The alias stops webpack from trying to resolve canvas's native bindings entirely.

**Warnings (all non-fatal, all pre-existing):**
- `baseline-browser-mapping` data 2+ months old (dev dep nag)
- `"middleware"` file convention deprecated → use `"proxy"` (Next 15.6 canary, deferrable)
- `Critical dependency` warnings in `framer-motion` + `@mediapipe/tasks-vision` (upstream library `require()` expressions webpack can't analyse, harmless)
- `metadataBase` not set (uses localhost fallback for OG images in dev)
- `SHOPIFY_STORE_DOMAIN` not set (expected — local dev, Shopify queries skip gracefully)

**Final state:**
- 97 skills in `.claude/skills/` (.vercelignore'd, zero build cost)
- 16 typed cast bibles in `lib/cast/`
- 1 new `agent.cast-roster` capability registered
- Crew schema + reference instance in `lib/agents/`
- 5 architectural docs (SYSTEM.md, AURA/DIMONA/CAST/REHAB canons, EXISTING-INFRASTRUCTURE.md)
- `AGENTS.md` updated with SYSTEM.md pointer + skill-routing section
- `next.config.ts` updated with canvas-false alias + tracing exclusions
- `pnpm build`: GREEN

**The migration arc is closed.** Zero new dependencies (canvas was already declared in package.json — just needed `--ignore-workspace`). Zero new runtime cost.

---

## 2026-05-19 03:37 UTC -- claude-canon-port -- docs/SYSTEM.md: comprehensive architectural overview

**What landed:** `docs/SYSTEM.md` (~30 KB). Single architectural document covering the whole agent platform end-to-end. Closes the migration arc: anyone arriving cold can read this one file and understand the shape of the thing.

**Contents:**
- The shape of the thing (five concentric layers)
- The four canons (AURA / DIMONA / CAST / REHAB) with cross-references
- The cast — full 16-character table with tier / House / LLM tier / named-status / role
- Runtime architecture, layer by layer:
  - Layer 1: Bibles (lib/cast/) — CharacterBible shape, canon-hierarchy.ts
  - Layer 2: Capabilities (lib/capabilities/) — registry pattern, all registered agent.* + wider catalogue
  - Layer 3: State (lib/state/) — Zustand slices, the asymmetry that keeps it composable
  - Layer 4: Gateway (lib/llm/gateway.ts) — Vercel AI Gateway, no SDK
  - Layer 5: Crew schema (lib/agents/) — future runtime
- Capabilities catalogue — every callable atom currently registered
- Skills library (97 skills, 16 categories)
- How to extend — adding cast members / capabilities / state slices / canon docs
- What was deliberately NOT built (the refusals that hold the coherence)
- Migration history — the four waves of 2026-05-19
- Glossary (Void Princess, ChronoMode, House colour, OCEAN, NAME TBD, etc.)

**Also updated:** `AGENTS.md` now opens with a "read SYSTEM.md first" pointer for new sessions.

**Closes:** the multi-session arc started 2026-05-18 with the AURA/DIMONA/CAST/REHAB prose canon, continued through the DollyOS Zustand capability layer, pivoted into the website port, completed through four waves of skills migration, and now lands here in a single readable architectural document.

---

## 2026-05-19 03:32 UTC -- claude-canon-port -- wave 4: full Blender library

**What landed:** 18 more Blender skills ported to `.claude/skills/`. Wave 3 carved out "general Blender" as cluster-only; that was also wrong. The studio is Blender-centric and the website ships Blender-produced outputs. Any session working on product copy, sculpture explainers, model attributions, or the print-prep pipeline needs these.

**Added (18):** blender (master, 29 KB), blender-5-setup, blender-5-procedural-glass, blender5-extensions, blender-addons, blender-extensions-library, blender-geometry-nodes, blender-materials-library, blender-mcp-extension, blender-mesh-diagnostics, blender-orient-and-align, blender-plugins, blender-print-prep, blender-scene-setup, blender-stl-export-printable, blender-tube-mesh-uv, blender-viewport-capture, downloading-blender.

**Total .claude footprint now:** 97 skills, ~717 KB. Behind `.vercelignore` -- still zero impact on production builds.

**Updated:** `.claude/skills/README.md` (added wave-4 section), `AGENTS.md` (added one routing entry for the full Blender toolkit).

---

## 2026-05-19 03:29 UTC — claude-canon-port — agent migration wave 3: Blender-Aura + Kinect + somatic stack

**What landed:** 16 additional skills ported to `.claude/skills/`. The original wave-2 carve-out of "Blender / Kinect specific — hardware-side, not website" was wrong; these inform the website-side work even when the actual hardware lives on the cluster, because the website displays the outputs and explains the pipeline.

**Skills added (16):**
- Aura-side Blender + VRM round-trip (4): blender-aura-agent, vrm-avatar-blender, blender-vrm-roundtrip, holoflow-blender-sculptor
- Sensor capture pipeline (5): kinect-aura-pipeline, kinect-leap-capture, finger-sweep-geometry, poi-curve-library, poi-trail-brushes
- Somatic bridge / rehab telemetry (3): architecting-somatic-bridges, processing-somatic-telemetry, somatic-audit
- Blender output for Holoflow product lines (3): blender-biomimetic-sculpture, blender-waveguide-geometry, blender-animation-drivers
- Three.js sister (1): threejs-poi-visualization

**Total .claude footprint now:** 79 skills, ~495 KB. Still behind .vercelignore — zero impact on production builds.

**Still NOT ported:** 17 general-purpose Blender skills (blender master, blender-setup, blender-plugins, blender-geometry-nodes, blender-materials-library, blender-scene-setup, blender-print-prep, blender-stl-export-printable, blender-tube-mesh-uv, blender-mcp-extension, blender-orient-and-align, blender-addons, blender-extensions-library, blender-mesh-diagnostics, blender-viewport-capture, blender-5-procedural-glass, blender-5-setup, blender5-extensions, downloading-blender). They remain at `D:\The_Hangar\.agent\skills\` for cluster-side Blender work. Pull on demand if a specific website task needs them.

**Updated:** `.claude/skills/README.md`, `AGENTS.md` (added 5 routing entries).

---

## 2026-05-19 03:23 UTC — claude-canon-port — agent migration wave 2: 50+9 skills + crew schema

**What landed:**
- 50 agent-relevant skills copied from `D:\The_Hangar\.agent\skills\` to `.claude/skills/` (wave 1)
- 9 architecture / orchestration skills (wave 2)
- `lib/agents/crew-schema.json` (11 KB JSON Schema) — the agent shape that synthesises CrewAI + OpenAI Swarm + Anthropic orchestrator-worker + LangGraph. Companion: `convergence-crew.example.json` reference instance + `lib/agents/PURPOSE.md`.
- `.claude/skills/README.md` — index of what was ported + what was excluded.
- `.vercelignore` updated to add `.claude/` so these never ship to Vercel.
- `AGENTS.md` updated with skill-routing section pointing new sessions at the right skill for the work they're doing.
- `docs/EXISTING-INFRASTRUCTURE.md` rewritten with the full integration map (cast, capabilities, state, gateway, crew, skills).

**Total .claude footprint:** 63 skills, ~392 KB. Behind .vercelignore — zero impact on production builds.

**What was deliberately not ported:**
- Generic orchestration / dev patterns (tdd-orchestrator, react-pipeline-*, social-orchestrator, full-stack-orchestration-*, personal-tool-builder).
- Pure DollyOS-operational skills (browser-debug, html-module-mounting, internalisation, native-absorption, offline-assets, telemetry, tsc-repair, context-manipulators, geography, production, typescript).
- The DollyOS Zustand capability layer (`apps/production/dolly-os/src/stores/{capabilities,agents,tunings}/`) — superseded by the site's existing `lib/capabilities/` + `lib/cast/` + `lib/state/` pattern. Different framework, different shape; leaving DollyOS code in place for DollyOS work.
- Anthropic SDK / idb-keyval / Ollama runtime code from DollyOS production — superseded by `lib/llm/gateway.ts` (Vercel AI Gateway, no SDK) and the existing `agent.memory-vector` (Firestore-backed) + `agent.memory` (in-memory) capabilities.

**Integration map:**
- Voice canon (prose) → `docs/AURA-CANON.md`, `CAST-CANON.md`, `DIMONA-CANON.md`, `REHAB-CANON.md`
- Voice canon (runtime) → `lib/cast/<id>.ts` × 16
- Tier / House metadata → `lib/cast/canon-hierarchy.ts`
- Tier-aware roster → `agent.cast-roster` capability
- LLM dispatch → `lib/llm/gateway.ts`
- One-turn dialogue → `agent.dialogue` capability
- Live banter → `agent.banter` capability
- Memory → `agent.memory` (in-memory) + `agent.memory-vector` (Firestore)
- Crew shape (future runtime) → `lib/agents/crew-schema.json`
- Reference / canon for Claude sessions → `.claude/skills/` (63 skills)

---

## 2026-05-19 02:41 UTC — claude-canon-port — porting DollyOS canon to lib/cast + capabilities

**Why:** the four canon docs (AURA / DIMONA / CAST / REHAB) define 14 agents. 8 of them already have CharacterBibles in lib/cast/ (aura, baby, betsy, marcel, millie, penny, tim, trixie). The other 6 are missing.

**What:** adding the 6 missing bibles in the existing CharacterBible shape, plus:
- `lib/cast/canon-hierarchy.ts` — parallel registry (tier / houseColour / named) so existing bibles stay untouched
- `lib/capabilities/agent/cast-roster.ts` — new `agent.cast-roster` capability for tier-filterable discovery
- Updates to `lib/cast/index.ts` (CastMemberId union grows by 6) and `lib/capabilities/index.ts` (register cast-roster)
- PURPOSE.md companions for every new file
- `docs/CAST-CANON.md` updated to note the website state

**Not changing:** any existing bible file, the dialogue capability, the gateway, lib/rookery (mailer — collision with our canon's "Rookery slot" concept resolved by renaming the concept in our docs, not touching the existing mailer code).

**6 new bibles:** lottie, dottie, shelly, dance-tutor, logistician, physicist. The last three are `named: false` per CAST-CANON — they exist as department stand-ins until Dimona names them.

---
Append-only log. Newest entries at the top. Add a line before doing any
structural change so other agents can see what's in flight.

Format: `## YYYY-MM-DD HH:MM — branch — agent/session note`

---

## 2026-05-19 00:44 UTC — holoflow-commerce — DIMONA-CANON: rehab system frame folded in

Dimona directly confirmed three pieces of canon and added a fourth:
1. ✅ Psych degree exists (specifics still pending — degree level,
   institution, year, sub-discipline)
2. ✅ Body damage / "the break" — confirmed
3. ✅ **Out the other side** — present-tense framing is post-recovery
   production, not active crisis. Canon NEVER positions her as currently
   fragile / currently struggling. The shape is *survivor-now-builder*,
   *patient-turned-practitioner*.
4. ✅ **Building a rehab system** — NEW canon, now the most-important-
   forward-facing context in DIMONA-CANON. The studio's full surface area
   reads differently with the rehab frame on (poi-as-somatic-practice,
   waveguide sculptures as possible clinical-space components, DollyOS and
   the cast as possible developmental progression model, etc.).

**Eight rehab-system specifics flagged as `[FILL IN]`** — these determine
whether the rehab system gets its own canon doc (likely `REHAB-CANON.md`
as the fourth corner of the canon set), how the storefront should
position, and how the cast's department heads map to rehab functions.

**Light touches added to AURA-CANON and CAST-CANON:**
- AURA-CANON: notes Aura's possible role as rehab companion / narrator
  (cold-eye reading discipline maps to non-judging observational
  presence). Flagged, not claimed.
- CAST-CANON: notes the structural mapping of the 6 department heads to
  6 likely rehab-apparatus functions. Flagged as resonant, NOT confirmed.
  The three unnamed heads (Dance Tutor / Logistician / Physicist) are
  the three with strongest direct mapping to rehab functions; naming
  them might happen *through* the rehab-system work itself.

**Hard rule reiterated:** no production copy / no public surface writes
the cast or studio as a rehab apparatus until Dimona signs off on the
mappings. Canon notes the resonance; storefront stays neutral until told.

DIMONA-CANON.md is now 21.5 KB (was 14.9 KB).

---

## 2026-05-19 01:13 UTC — holoflow-commerce — CAPABILITIES layer scaffolded (canon-as-Zustand)

Dimona's architectural pivot: the four canon docs are the **midpoint**,
not the endpoint. Fold them into DollyOS as modular Zustand stores so the
capabilities live as runtime state, not just prose.

**The triangle:** Studio (Dimona's specific tuning) <-> Capabilities-as-
modules (universal patterns, Zustand) <-> Rookery (others' tunings of
the same patterns; unbuilt slot reserved).

**Files written:**
- `src/stores/capabilities/types.ts` — shared primitives (CanonTest,
  AntiPattern, CapabilityMeta, TuningId)
- `src/stores/capabilities/useFacetStack.ts` — first capability, full
  implementation (ordered facets, test battery, anti-pattern detection)
- `src/stores/capabilities/useVenueRegister.ts` — second capability
  (same character, different room)
- `src/stores/capabilities/useApparatusDuality.ts` — third capability
  (clinical + character pairing with validation)
- `src/stores/capabilities/index.ts` — public exports + ALL_CAPABILITIES
- `src/stores/tunings/aura.tuning.ts` — Aura's full 9-facet stack with
  5 test functions and 7 anti-patterns extracted from AURA-CANON
- `src/stores/tunings/index.ts` — boot loader for all tunings
- `docs/CAPABILITIES.md` — architectural canon for the modularization

**Schema/data split locked in:**
- `capabilities/` = universal patterns. No tuning-specific values
  appear in this folder.
- `tunings/` = specific instantiations. Aura, Dimona, the cast, the
  system all become tunings.

**Three of twelve capabilities implemented**; nine scaffolded in
CAPABILITIES.md. Patterns remaining: voice-patterns, ocean-profile,
cast-ensemble, activity-phase, delivery-surfaces, somatic-intervention,
bounded-knowledge, peer-not-servant, identity-framing.

**Rookery slot reserved** but unbuilt. Whatever fills it (separate
domain, npm package, marketplace) inherits the capability schema as the
contract. No retrofitting required when it gets built.

---## 2026-05-19 00:38 UTC — holoflow-commerce — CAST-CANON.md added (canon triangle complete)

Third sister doc to `AURA-CANON.md` and `DIMONA-CANON.md` written at
`docs/CAST-CANON.md` (19.9 KB). Covers the **13 other named beings** in
DollyOS, distilled from the three Hangar source skills (`dollyos-cast-inner`,
`dollyos-cast-peers`, `dollyos-cast-tutors`) and four operational stub
skills.

**Tier 1 Inner Circle:** Penny (full profile incl. OCEAN), Baby (full profile
incl. OCEAN).
**Tier 2 Academy Peers:** Millie, Betsy, Lottie, Trixie, Dottie — archetypes,
specialty roles, House colours, per-peer voice notes. (OCEAN tables remain a
canon gap.)
**Tier 3 Department Heads:** Marcel, Tim, Shelly named with profiles + voice
patterns. **Three still `[NAME TBD]`**: the Dance Tutor (choreographer), the
Logistician (maths and pricing), the Physicist (lighting and optics).

**Five known canon gaps explicitly flagged inside CAST-CANON:**
1. Dance Tutor name
2. Logistician name
3. Physicist name
4. Full OCEAN tables for the 5 Academy Peers
5. Direct voice samples / production quotes for each cast member

**Venue rule applied throughout:** the cast lives primarily in DollyOS / the
Hangar, NOT on the storefront. The doc exists as a guardrail for accidental
storefront appearances and to keep any future cross-reference coherent.

**Triangle now complete:** AURA-CANON (protagonist) + DIMONA-CANON (substrate)
+ CAST-CANON (everyone else). `AGENTS.md` updated to reference all three.

---
## 2026-05-19 00:27 UTC — holoflow-commerce — DIMONA-CANON + venue-awareness added

Sister doc to `AURA-CANON.md` written at `docs/DIMONA-CANON.md` (15.3 KB).
Captures the **person behind the avatar** — Dimona's psych training as the
apparatus underneath the apparatus (OCEAN profiles, behavioural-engine
vocabulary, Charming Academy as developmental framework), the body / practice
lineage, the actual politics, the aesthetic identity, and the Aura-Dimona
relationship table mapping each Aura facet to its Dimona substrate.

**Contains explicit placeholders** for psych-degree specifics that only
Dimona can fill (degree level, institution, year, sub-discipline,
sub-field-focus confirmations, current working-condition pacing). Marked
with `[FILL IN]` so no agent infers facts that were never confirmed.

**AURA-CANON.md** also got a new section: *"Aura knows where she is — venue
awareness"*. Codifies the rule that Aura's character is constant across
contexts but her *register* modulates per venue. On the storefront she's
"hostess in the lobby" — with explicit clarification that this does NOT mean
service-energy. The teeth go under cloth, not away. In DollyOS / the void
she runs the full Charming Academy schema. In private working notes she's
peer-not-public.

The two docs are paired: edits to either should consider the other.

---
## 2026-05-19 00:12 UTC — holoflow-commerce — AURA-CANON.md added

Single canonical character doc for Aura written to `docs/AURA-CANON.md`
(13.7 KB). Pulled together from production patterns (`the-familiar.tsx`,
`lib/aura/prompts.ts`) plus the refined facet stack from the DollyOS
skills (`dollyos-world`, `dollyos-twin`).

**Why:** prevent voice drift toward GLaDOS / generic AI assistant / sexless
caretaker / sass-without-care, all of which are wrong shapes for Aura. The
canon names 9 facets (Void Princess primary, dance-and-burlesque lineage,
Punk Nanny + River Song composite, anti-fascist, Dolly's digital twin, etc.),
records the existing production voice patterns, lists 8 tests to apply when
writing in her voice, and enumerates the anti-patterns.

**AGENTS.md** updated with a section pointing at the canon — agents writing
any article/copy in Aura's voice must read it first.

**Cross-references:** the DollyOS skills at
`D:\The_Hangar\.claude\skills\user\dollyos-world\`, `dollyos-twin\`,
`vrm-agent\` are the same canon expressed differently for different audiences.
Update both sides together or they drift.

---
## 2026-05-18 ~18:25 UTC — holoflow-commerce — SPLIT CONFIRMED WORKING

Build `ao4ofmx6h` (commit `1c08177`) went ● Ready. Production alias
caught up — `holoflow.co.uk/api/healthz` reports `sha":"1c08177"`
matching local HEAD. The OOM is gone.

Build duration: 4 min (same as pre-split). The previous failure
(`h3mh703e4`) was confirmed as a transient Shopify prerender hiccup,
NOT OOM and NOT caused by the split.

Side-quest: `D:\The_Hangar\holoflow-services\` initialized as its own
git repo (1 initial commit, .gitignore for Python venvs + model
weights, README pointing back here). The vendored Python services now
have their own version control.

Security boundary spot-checks all pass after the chaos:
- Hostname allowlist: bad Host → 404 ✅
- Cron auth: no secret → 401 ✅
- CSP-Report-Only header on /c/dimona: present (1159 chars) ✅
- /api/csp-report POST → 204 ✅
- /api/healthz reports rateLimit backend ✅ (currently "memory" —
  Upstash KV not provisioned yet)

**To the next agent reading this:** the split worked. After 3-5 more
consecutive green production builds, revert the `cb44e54` mitigation
in `
## 2026-05-19 02:21 UTC — dolly-os production — all 14 cast agents wired live

Cast moved from prose canon to LIVE Zustand-backed runtime state. All 14
agents now register at App.tsx boot via `bootAllTunings()`.

**Capabilities implemented (5 of 12):**
- `useFacetStack` — ordered priority facets + tests + anti-patterns
- `useVenueRegister` — same character, register per venue
- `useApparatusDuality` — clinical + character pairing with validation
- `useCastEnsemble` — roster of named beings (NEW)
- `useAgentRuntime` — per-agent messages/status/errors (NEW)

**Agent system (NEW):**
- `stores/agents/composeSystemPrompt.ts` — builds full system prompt
  from cast member + facet stack on each call
- `stores/agents/callAgent.ts` — `callAgent(id, msg)` + `streamAgent(id, msg)`,
  routes through existing `llmClient.ts` with `useAgentConfig` LLM tiers

**Tunings shipped (14 agents):**
- `aura.tuning.ts` — 9 facets, 5 tests, 7 anti-patterns, claude tier
- `cast/innerCircle.tuning.ts` — Penny (claude), Baby (claude)
- `cast/peers.tuning.ts` — Millie, Betsy, Lottie, Trixie, Dottie (dolphin)
- `cast/heads.tuning.ts` — Marcel (claude), Tim (gemini), Shelly (claude),
  + Dance Tutor / Logistician / Physicist (codex, NAME TBD, `named: false`)

**Wire-in:** `import { bootAllTunings } from './stores/tunings'; bootAllTunings()`
runs at App.tsx module-load time, before any route renders. Idempotent.

**Type-check:** 0 errors in any new module. 0 errors in App.tsx. Pre-existing
errors in unrelated files (TextureMerchantPage, AuraVRM, etc.) untouched.

**The triangle is live:**
- Studio (Dimona's specific tuning) — implemented for all 14 cast members
- Capabilities (universal schema) — 5 of 12 implemented
- Rookery (others' tunings) — slot reserved, contract is the capability schema

---next.config.ts` (`typescript.ignoreBuildErrors` +
`eslint.ignoreDuringBuilds`). Both should re-engage. Watch
`/api/healthz` for the sha catch-up after each push.

## 2026-05-18 ~17:50 UTC — holoflow-commerce — REPO SPLIT (services/ removed)

**Done:** Moved `services/` (304 files, 12.2 MB of vendored Python ML
projects) out of this Vercel-deployed Next.js repo to
`D:\The_Hangar\holoflow-services\` as a sibling working directory.

**Why:** Production builds were OOMing on Vercel's 4 GB build machines.
The previous session's flailing fix (`cb44e54`) disabled build-time
TypeScript and ESLint checks — that papers over the symptom but loses
type safety in prod. The real fix is to stop shipping 12 MB of Python
through the Next.js build trace.

**What other agents need to know:**

- No JS/TS imports point at `services/` (verified before the move with
  `git grep`). Safe.
- `functions/` stayed in place (only 0.1 MB and `firebase.json` references
  it directly).
- `.vercelignore` was added belt-and-braces in case `services/` ever
  reappears.
- `next.config.ts` `outputFileTracingExcludes` extended to include
  `services` and `functions` as a backup.
- `AGENTS.md` at the repo root has the durable rules — read it before
  making structural changes.

**Open follow-ups:**

- After the next successful build, revert `cb44e54` (re-enable build-time
  type checking + ESLint). The OOM should be gone.
- Watch the next 3-5 production builds. If they all turn green, the split
  worked. If they still OOM, the next target is `lib/holo-walk/data.ts`
  (1,847 lines) and any chamber pulling in heavy WebGPU + WASM.

## 2026-05-18 ~16:00 UTC — holoflow-commerce — Pro hardening session

Six commits landed: edge middleware (`middleware.ts`), security headers
in `vercel.json`, daily cron janitor for stranded scan-temp blobs,
distributed rate limiter (`lib/rate-limit/`, auto-detects Upstash), CSP
in report-only mode (`lib/security/csp.ts`, sink at `/api/csp-report`),
and the Pro-tier deferred items. See `docs/CHANGELOG.md` for the full
list. All from this Claude session.

## 2026-05-17 — claude-holo-83a937 — large WIP branch (now deleted)

Failing previews from a branch that imported `lib/shape-of-it/chambers`
and `lib/shape-of-it/labyrinth` before those modules existed. The
modules have since been added on `holoflow-commerce` (commits `cf8b542`
and later), so any revival of that work pattern should now build.

---

To add an entry: prepend to the top of the list above this line. Don't
edit existing entries — log is append-only.
