# `crew-run.ts` — purpose twin

## Role

The `agent.crew-run` capability — orchestrated multi-agent runs over the crew schema at `lib/agents/crew-schema.json`.

**Phase 1 LANDED 2026-05-21**: sequential + parallel process modes execute real LLM dispatches via `agent.dialogue`'s `respond()`.

**Phase 2 LANDED 2026-05-21**: hierarchical + graph process modes implemented via a shared topological-DAG executor. Hierarchical adds a final synthesis pass by the lead_agent.

**Phase 3 LANDED 2026-05-21**: graph-mode conditional routing via `edge.when` predicates. Safe recursive-descent expression evaluator in `crew-predicate.ts` (zero deps, no `eval()`). Skipped tasks tracked in `CrewRunResult.ok.skipped_task_ids`. Transitive skipping propagates through downstream deps. Verified end-to-end on `graph-example.json` under both high-severity and low-severity scenarios.

**Phase 4 EXTENDED 2026-05-21**: 

1. `task.retries` honoured per task (default 1 = two total attempts).
2. `human_in_the_loop` task gating — after a HITL task completes, the run returns `status: "paused_for_approval"` with a `resume_state` that round-trips back into `input.resume_from`. Works across DAG-based modes. Verified on convergence-crew (two HITL gates): three-run pause/resume cycle completes all 9 tasks.
3. `task.output_schema` validation via minimal JSON Schema validator (`crew-output-schema.ts`). Supports object/array/string/number/integer/boolean/null types, `required` keys on objects, `minLength`/`maxLength`/`enum` on strings, `minimum`/`maximum`/`exclusiveMinimum`/`exclusiveMaximum` on numbers, `items.type` + `minItems`/`maxItems` on arrays. Validation failures throw → retry loop catches → next attempt. NOT supported (silently passes): anyOf/oneOf/allOf, pattern, format, additionalProperties:false, $ref. Full Ajv is a future addition.
4. `task.output_path` filesystem persistence. After successful task completion, if the path is set AND we're running in Node (not edge), write the task's text to disk (creates parent dirs). Best-effort: failures log a warning but don't fail the task.
5. Per-run trace export via `exportTrace(result, crew)` in `crew-trace.ts`. Returns a pinned `CrewTrace` object with `schema_version: "1"`, all turns with reconstructed `offset_ms`, waves, skipped tasks, context_out. Suitable for storage (disk, `agent.memory-vector`, telemetry).
6. Design-time tool-binding validation. `validateCrew()` now walks every `agent.tools[]` and shape-checks each binding (builtin → non-empty `name`; mcp → non-empty `server` + `tool`; subagent → `agent_id` must exist in `crew.agents[]`). Catches misconfigured tools at crew load, not at runtime. `summariseCrew()` surfaces `tools_total`, `tools_by_kind`, `tasks_with_output_schema`, `tasks_with_output_path`, `tasks_with_hitl`.

What's STILL NOT in Phase 4:
- **Runtime tool execution.** Agents can declare tools and we validate the bindings, but `respond()` doesn't yet pass tools to the LLM or detect tool-call responses. Real tool calling needs a ReAct loop on top of `respond()` — its own phase.
- **`agent.effort_budget` enforcement.** Token + tool-call caps. Needs token counts threaded back from `respond()`.
- **Full Ajv.** Current validator handles the common JSON Schema subset; full Ajv is mechanical work.

Swarm mode still returns `not_implemented_yet` — it requires LLM-routed dynamic handoffs that aren't worth implementing without a calling use case.

## Public surface

- **Types matching the crew schema exactly** (lead_agent, assigned_agent, version required, etc.):
  `CrewProcessMode`, `CrewToolBinding`, `CrewAgentDefinition`, `CrewTask`,
  `CrewHandoff`, `CrewEdge`, `CrewDefinition`.
- **Run-time:** `CrewRunInput`, `CrewTurn` (now with optional `wave` field), `CrewRunResult`
  (three discriminated states: `ok` / `error` / `not_implemented_yet`; `ok` includes optional `waves` for DAG-based modes).
- **Validator:** `validateCrew(crew)` — zod-based schema check plus cross-reference validation
  (task→agent, depends_on→task, hierarchical→lead_agent, lead in agents[], edges reference real tasks).
- **Entry point:** `runCrew(input)` — Phase 1 + 2 execute sequential, parallel, hierarchical, graph.
- **Diagnostic:** `summariseCrew(crew)` — quick stats. `predictWaves(crew)` — compute the topological waves without running.

## What runs vs what stubs

| Process mode | Phase | Status | Implementation |
|---|---|---|---|
| `sequential` | 1 | ✅ LIVE | Each task awaits the previous |
| `parallel` | 1 | ✅ LIVE | `Promise.allSettled` over all tasks |
| `hierarchical` | 2 | ✅ LIVE | Topological DAG + lead synthesis pass |
| `graph` | 2 | ✅ LIVE | Topological DAG + explicit `crew.edges` |
| `swarm` | 3 | 🔵 stub | LLM-routed handoffs — not yet implemented |

## The execution shapes

### Sequential
1. `validateCrew` checks schema + cross-refs.
2. For each task in declaration order: resolve agent → bible, build `contextSuffix` (system_prompt_suffix + task_boundaries + expected_output + prior tasks' outputs), call `respond()`, append turn, set `contextOut[task.id] = turn.text`.
3. Return `{ status: "ok", run_id, crew_id, turns, context_out, total_duration_ms }`.

### Parallel
Same as sequential but `Promise.allSettled`. Tasks see only `crew.context_variables`, not each other's in-flight outputs.

### Hierarchical
1. Run the topological DAG (same as graph below).
2. After all worker tasks complete, call `respond()` on the `lead_agent` with a synthesis prompt: the crew brief + all worker outputs + an instruction to integrate them.
3. The synthesis turn has `task_id: "__synthesis__"` and `wave: -1`.
4. Return all worker turns + synthesis turn. `context_out` includes `__synthesis__` key.

### Graph
1. Build dependency edges from `task.depends_on` AND `crew.edges` (graph-mode-only edge type).
2. Compute topological waves: each wave is a set of tasks whose deps are all complete.
3. Run waves sequentially; tasks WITHIN a wave run in parallel via `Promise.allSettled`.
4. Cycle detection throws with the unresolvable task names.

## Edge predicates (Phase 3, graph mode only)

Graph-mode crews can attach `when` predicates to edges in `crew.edges[]`. The runtime evaluates each outgoing edge's predicate after the `from_task` completes, against the accumulated `context_out`. False predicates mark the `to_task` as skipped — it never runs.

### Supported predicate grammar

```
expr      := or
or        := and ( "||" and )*
and       := not ( "&&" not )*
not       := "!" not | comparison
comparison := primary ( ( "==" | "!=" | "<" | "<=" | ">" | ">=" ) primary )?
primary   := literal | identifier | "(" expr ")"
literal   := number | string | "true" | "false" | "null"
identifier := name ( "." name )* ( ".length" )?
name      := [a-zA-Z_][a-zA-Z0-9_]*
```

### Examples

- `anomaly_severity == "high"` — string equality
- `score > 0.8` — number comparison
- `errors.length > 0` — array/string length access
- `ready && validated` — logical AND with short-circuit
- `(a == 1) || (b == 2)` — parenthesised disjunction
- `!ready` — negation
- `nested.deep.value == "found"` — dotted access into context objects

### Empty `when` = unconditional

If `edge.when` is missing, null, or empty/whitespace-only, the edge is unconditional. This is the default.

### Transitive skipping

If a task's predecessor (via `depends_on` or any incoming edge) is in the skipped set, the task is also skipped automatically. The runtime logs each transitive skip for trace clarity.

### What's deliberately NOT supported

- Arithmetic (`+`, `-`, `*`, `/`) — write a transform if you need it
- Function calls — write a transform
- Array indexing beyond `.length` — write a transform
- String methods (`.includes`, `.startsWith`, etc.) — write a transform
- Regex
- Ternary

The point is: if your predicate needs richer logic than this grammar, it shouldn't be in JSON config. Phase 3+ runtime transforms (Phase 4 remainder) cover that.

### Design-time validation

`validateCrew()` calls `validatePredicate()` on every `edge.when` during graph-mode validation. Parse errors are caught at crew load time, not at runtime.
## Cast-bible resolution

```ts
function resolveBible(agent: CrewAgentDefinition):
  | { bible: CharacterBible; from: "cast" }
  | { bible: CharacterBible; from: "synthesised" }
```

If `agent.id` matches a registered cast member (via `agent.cast-roster`), use that bible.
Otherwise build an ad-hoc bible from `role`/`goal`/`backstory`:

- `name` ← agent.id
- `role` ← agent.role
- `voice` ← agent.backstory (informs the LLM's prose style)
- `posture` ← agent.goal
- `draws` ← split of `agent.task_boundaries`
- `defaultMode` ← "azure"

Other CharacterBible fields (pronouns, aspects, relationships, etc.) are stubbed since they
serve the cast UI which ad-hoc agents bypass.

## DAG executor

The topological wave algorithm:

```
deps = { task.id → set(task.depends_on) ∪ (graph-mode: incoming edges) }
done = ∅
waves = []
while done < all_tasks:
  ready = { id : deps[id] ⊆ done }
  if ready == ∅: throw cycle
  waves.push(ready)
  done += ready
```

Worst case O(n²) for n tasks. n=9 (convergence-crew): trivial. n=100+: still trivial.

Verified topology for the two reference instances:

**`sequential-example.json`** (3 tasks, sequential — still uses DAG for validation):
- Wave 0: `analyse_optics`
- Wave 1: `plan_fabrication`
- Wave 2: `compose_brief`

**`convergence-crew.example.json`** (9 tasks, hierarchical):
- Wave 0: `seed_gyroid`, `map_optics`, `choreograph_genome` (3 parallel)
- Wave 1: `lock_aesthetic`, `route_waveguides` (2 parallel)
- Wave 2: `validate_tir`
- Wave 3: `jeweller_cage`
- Wave 4: `printer_preflight`
- Wave 5: `index_run`
- + synthesis pass by `aura_lead`

The hierarchical mode would run this end-to-end against the configured LLM provider with 6 worker waves + 1 synthesis call = 10 LLM dispatches total.

## Depends on

- `zod` — already in the dependency graph.
- `./dialogue` — `respond()` + `RespondResult` + `AgentProvider`.
- `./cast-roster` — `getMember()` for cast-aligned crews.
- `lib/cast/aura` — `CharacterBible` type.
- `lib/log` — `createLogger`.

## Does not

- **Does not run swarm mode.** Phase 3.
- **Does not honour `human_in_the_loop`** — Phase 2 runs without human-ack gates.
- **Does not honour `retries`** — first failure errors the run.
- **Does not write to `output_path`** — Phase 2 returns the trace; persistence is the caller's choice.
- **Does not enforce `effort_budget`** — token/tool caps not enforced.
- **Does not validate `output_schema`** — the output_format hint is passed to the LLM but
  the response isn't checked against a JSON Schema.
- **Does not evaluate `edge.when` predicates** — graph mode treats all declared edges as
  unconditional. Conditional graph routing is a Phase 3 item.
- **Does not honour `handoffs[]`** — those are swarm-mode dynamic transitions.
- **Does not LLM-route in hierarchical mode.** The lead doesn't decompose at runtime —
  the tasks are already declared. The lead's job is final synthesis. Deterministic.
- **Does not add framework dependencies.**
- **Does not own state.** Each `respond()` call writes to `cast.history[agentId]`.
- **Does not bypass the gateway.**

## Build phases

### Phase 0 — types + stub (DONE 2026-05-19)
- Types matching the schema
- `validateCrew` light validator
- `runCrew` returning `not_implemented_yet` with a trace
- `summariseCrew` for UI surfaces

### Phase 1 — sequential + parallel runtime (DONE 2026-05-21)
- Resolve agents to bibles via `agent.cast-roster`
- For each task, call `agent.dialogue` with the agent's system prompt
- For `process: "sequential"`, run in declaration order; await each
- For `process: "parallel"`, `Promise.all()` all tasks
- Aggregate `CrewTurn[]` into `CrewRunResult`
- Write turns into `cast.history` tagged with `run_id`
- Schema field names aligned exactly to `crew-schema.json`
- Convergence-crew example validates clean against `validateCrew`

### Phase 2 — hierarchical + graph (DONE 2026-05-21)
- Topological DAG executor shared by both modes
- `buildDeps()` constructs the dependency map (depends_on + graph edges)
- `topologicalWaves()` computes execution waves with cycle detection
- `executeDag()` runs waves sequentially; tasks-within-wave in parallel
- Hierarchical adds a final synthesis pass by `lead_agent`
- Graph honours `crew.edges` as additional unconditional dependencies
- Cycle detection throws with named unresolvable tasks
- `predictWaves()` exposed for UI surfaces (predict before running)
- `CrewTurn.wave` field annotates each turn with its DAG wave index
- `CrewRunResult.waves` field exposes the wave structure for trace

### Phase 3 — swarm + conditional routing
- Swarm mode: dynamic handoffs via `context_variables` + `crew.handoffs`
- Each agent decides who runs next (LLM-routed)
- `handoff.condition` evaluation (JSON-logic or natural-language)
- `edge.when` predicates for conditional graph routing
- `edge.transform` for output reshape between graph nodes

### Phase 4 — production hardening
- Full Ajv validation against the JSON Schema (Phase 1+2 use zod subset)
- Per-agent effort budgets enforced (max_tool_calls, max_context_tokens)
- Tool resolution (`builtin` → capability id, `mcp` → MCP client,
  `subagent` → another `runCrew()`)
- `human_in_the_loop` task gating
- `retries` honoured per task
- Per-run trace export (JSON; pinned format)
- Optional Firestore-backed run log (writes through `agent.memory-vector`
  so crew runs become searchable history)

### Phase 5 — UI surfaces
- `/capabilities/agent.crew-run` debug page showing the crew, the
  planned waves, the current state if running, the trace if done
- Optional `/atelier/crew-run` chamber for interactive crew design +
  execution

## Reference instances

| File | Process | Phase to run |
|---|---|---|
| `lib/agents/sequential-example.json` | sequential | ✅ Phase 1 — 3 cast members (Physicist → Logistician → Scribe) |
| `lib/agents/convergence-crew.example.json` | hierarchical | ✅ Phase 2 — 10 agents, 9 tasks, 6 waves + synthesis |

## Bordering files

- `lib/agents/crew-schema.json` — the JSON Schema (source of truth).
- `lib/agents/convergence-crew.example.json` — reference instance, hierarchical mode.
- `lib/agents/sequential-example.json` — reference instance, sequential mode.
- `lib/agents/PURPOSE.md` — explains the schema's origin.
- `lib/capabilities/_base.ts` — `CapabilityId` union includes `"agent.crew-run"`.
- `lib/capabilities/index.ts` — registers this capability with `status: "registered"`.
- `lib/capabilities/agent/cast-roster.ts` — sibling capability; resolves agent ids to bibles.
- `lib/capabilities/agent/dialogue.ts` — sibling capability; dispatches each agent's turns.
- `docs/SYSTEM.md` § Layer 5 — the architectural context.

## Memory

- Field names match `crew-schema.json` exactly. `lead_agent` not `lead`. `assigned_agent` not `agent`. `version` required.
- The convergence-crew example uses `process: "hierarchical"` which now runs end-to-end via Phase 2.
- Sequential-example is the Phase 1 reference; convergence-crew is the Phase 2 reference.
- Ad-hoc agents (not in the cast) work — the runtime synthesises a bible from role/goal/backstory.
- The hierarchical synthesis turn has `task_id: "__synthesis__"` — UI surfaces should treat this specially (it's not a declared task in the crew).
- The hierarchical synthesis is NOT LLM-routed dispatch. It's the lead summarising the workers. Worker dispatch is deterministic via the declared DAG.
- DAG cycles throw with named unresolvable tasks. If your crew "hangs", run `predictWaves()` first.
