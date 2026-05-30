# `lib/agents/` — Crew schema for orchestrated agent runs

## Role

JSON Schema and reference instance for crew-shaped agent
orchestration. Ported from `D:\The_Hangar\Dolly_OS\services\agents\`
as canonical data. The schema synthesises CrewAI (role / goal /
backstory + tasks), OpenAI Swarm (handoffs + context_variables),
Anthropic orchestrator-worker (lead spawns parallel subagents with
objective / output / tools / boundaries), and LangGraph (explicit
process graph) into one shape.

## Files

- `crew-schema.json` — JSON Schema 2020-12 for crews + agents + tasks.
  The canonical agent shape: id, role, goal, backstory, model, tools
  (builtin / mcp / subagent), delegate_to, effort_budget,
  output_format, task_boundaries, system_prompt_suffix.
- `convergence-crew.example.json` — reference instance. The
  convergence-pipeline crew (Geometrician + Optics Sage +
  Choreographer + … under an Aura lead) showing the schema in use.

## Why ported

The `agent.dialogue` capability already consumes
`CharacterBible`-shaped data. A future crew-runtime capability
(orchestrator-worker fan-out, per
`.claude/skills/aura-swarm-orchestration/SKILL.md`) will consume the
crew shape directly. Having the schema here means any new crew
runtime can validate against it without re-deriving the contract.

## Does not

- **Does not implement a crew runner.** That's a future capability
  (proposed: `agent.crew-run`). The schema is the contract; the
  runtime is separate.
- **Does not auto-validate.** Validation happens when a crew
  runtime lands. The reference instance is the only validated
  example today.

## Bordering

- `lib/cast/` — bibles whose voice maps to a crew agent's
  `backstory` field via a future `toCrewAgent(memberId)` exporter.
- `lib/cast/canon-hierarchy.ts` — tier metadata; lead/worker
  assignment can route by tier.
- `lib/capabilities/agent/dialogue.ts` — the single-turn capability
  the crew runtime will compose.
- `.claude/skills/aura-swarm-orchestration/` — the architectural
  recommendation that justified borrowing this schema verbatim
  (browser-side TypeScript, no framework dependency).
- `.claude/skills/crewai/` — the CrewAI primer for the
  declarative-surface borrowing.
- `.claude/skills/convergence-crew/` — the prose canon for the
  convergence pipeline this reference instance encodes.