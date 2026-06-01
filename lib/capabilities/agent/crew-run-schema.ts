/**
 * crew-run-schema.ts — Zod validation for crew definitions.
 */
import { z } from "zod";
import type { CrewDefinition } from "./crew-run-types";
import { validatePredicate } from "./crew-predicate";

const CrewAgentSchema = z.object({
  id: z.string().min(1), role: z.string().min(1), goal: z.string().min(1),
  backstory: z.string().min(1), model: z.string().optional(),
  provider: z.enum(["gemini", "openai", "anthropic", "zai"]).optional(),
  tools: z.array(z.unknown()).optional(),
  max_iterations: z.number().int().positive().optional(),
  allow_delegation: z.boolean().optional(),
  delegate_to: z.array(z.string()).optional(),
  memory: z.unknown().optional(), effort_budget: z.unknown().optional(),
  output_format: z.string().optional(), task_boundaries: z.string().optional(),
  system_prompt_suffix: z.string().optional(),
});
const CrewTaskSchema = z.object({
  id: z.string().min(1), description: z.string().min(1),
  assigned_agent: z.string().min(1),
  depends_on: z.array(z.string()).optional(),
  expected_output: z.string().min(1),
  output_path: z.string().optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
  async_execution: z.boolean().optional(),
  human_in_the_loop: z.boolean().optional(),
  retries: z.number().int().min(0).optional(),
});

const CrewDefinitionSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), version: z.string().min(1),
  description: z.string().optional(), tenant_id: z.string().optional(),
  lineage: z.unknown().optional(),
  process: z.enum(["sequential", "parallel", "hierarchical", "graph", "swarm"]),
  lead_agent: z.string().optional(), shared_memory: z.unknown().optional(),
  context_variables: z.record(z.string(), z.unknown()).optional(),
  agents: z.array(CrewAgentSchema).min(1),
  tasks: z.array(CrewTaskSchema).min(1),
  handoffs: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
  guards: z.unknown().optional(),
});

export function validateCrew(
  crew: unknown,
): { ok: true; crew: CrewDefinition } | { ok: false; error: string } {
  const result = CrewDefinitionSchema.safeParse(crew);
  if (!result.success) return { ok: false, error: result.error.message };
  const c = result.data as CrewDefinition;
  const agentIds = new Set(c.agents.map((a) => a.id));
  for (const t of c.tasks) {
    if (!agentIds.has(t.assigned_agent) && t.assigned_agent !== "auto")
      return { ok: false, error: `task ${t.id} references unknown agent ${t.assigned_agent}` };
  }
  const taskIds = new Set(c.tasks.map((t) => t.id));
  for (const t of c.tasks) {
    for (const d of t.depends_on ?? []) {
      if (!taskIds.has(d)) return { ok: false, error: `task ${t.id} depends on unknown task ${d}` };
    }
  }
  if (c.process === "hierarchical" && !c.lead_agent)
    return { ok: false, error: "process=hierarchical requires lead_agent" };
  if (c.process === "hierarchical" && c.lead_agent && !agentIds.has(c.lead_agent))
    return { ok: false, error: `hierarchical lead_agent "${c.lead_agent}" not in agents[]` };
  if (c.process === "graph" && c.edges) {
    for (const e of c.edges) {
      if (!taskIds.has(e.from_task)) return { ok: false, error: `edge from_task "${e.from_task}" not in tasks[]` };
      if (!taskIds.has(e.to_task))   return { ok: false, error: `edge to_task "${e.to_task}" not in tasks[]` };
      if (e.when != null) {
        const err = validatePredicate(e.when);
        if (err) return { ok: false, error: `edge ${e.from_task}→${e.to_task} invalid when: ${err}` };
      }
    }
  }
  for (const agent of c.agents) {
    for (const tool of (agent.tools ?? []) as unknown[]) {
      if (typeof tool !== "object" || tool === null)
        return { ok: false, error: `agent ${agent.id} malformed tool binding` };
      const t = tool as { kind?: string };
      if (t.kind === "builtin") {
        if (typeof (tool as { name?: unknown }).name !== "string")
          return { ok: false, error: `agent ${agent.id} builtin tool missing name` };
      } else if (t.kind === "mcp") {
        const m = tool as { server?: unknown; tool?: unknown };
        if (typeof m.server !== "string") return { ok: false, error: `agent ${agent.id} mcp missing server` };
        if (typeof m.tool   !== "string") return { ok: false, error: `agent ${agent.id} mcp missing tool` };
      } else if (t.kind === "subagent") {
        const s = tool as { agent_id?: unknown };
        if (typeof s.agent_id !== "string") return { ok: false, error: `agent ${agent.id} subagent missing agent_id` };
        if (!agentIds.has(s.agent_id))
          return { ok: false, error: `agent ${agent.id} subagent unknown agent_id "${s.agent_id}"` };
      } else {
        return { ok: false, error: `agent ${agent.id} tool unknown kind "${t.kind ?? "<missing>"}"` };
      }
    }
  }
  return { ok: true, crew: c };
}
