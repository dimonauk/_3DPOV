/**
 * crew-run-types.ts — All TypeScript types for the crew-run capability.
 * No runtime imports — this file is safe to import from anywhere.
 */

export type CrewProcessMode =
  | "sequential"
  | "parallel"
  | "hierarchical"
  | "graph"
  | "swarm";

export type CrewToolBinding =
  | { kind: "builtin"; name: string }
  | { kind: "mcp"; server: string; tool: string; default_payload?: Record<string, unknown> }
  | { kind: "subagent"; agent_id: string };

export type CrewAgentDefinition = {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  model?: string;
  provider?: import("./dialogue").AgentProvider;
  tools?: CrewToolBinding[];
  max_iterations?: number;
  allow_delegation?: boolean;
  delegate_to?: string[];
  memory?: { enabled?: boolean; scope?: "session" | "persistent" };
  effort_budget?: { max_tool_calls?: number; max_context_tokens?: number };
  output_format?: string;
  task_boundaries?: string;
  system_prompt_suffix?: string;
};

export type CrewTask = {
  id: string;
  description: string;
  assigned_agent: string;
  depends_on?: string[];
  expected_output: string;
  output_path?: string;
  output_schema?: Record<string, unknown>;
  async_execution?: boolean;
  human_in_the_loop?: boolean;
  retries?: number;
};

export type CrewHandoff = {
  from_agent: string;
  to_agent: string;
  condition?: string;
  context_passed?: string[];
  reason_template?: string;
};

export type CrewEdge = {
  from_task: string;
  to_task: string;
  when?: string;
  transform?: string;
};

export type CrewDefinition = {
  id: string;
  name: string;
  version: string;
  description?: string;
  tenant_id?: string;
  lineage?: { template_id?: string; locked_by?: string };
  process: CrewProcessMode;
  lead_agent?: string;
  shared_memory?: {
    backend?: "ephemeral" | "memory_shard" | "mind_palace_mcp" | "filesystem";
    namespace?: string;
    capacity_tokens?: number;
  };
  context_variables?: Record<string, unknown>;
  agents: CrewAgentDefinition[];
  tasks: CrewTask[];
  handoffs?: CrewHandoff[];
  edges?: CrewEdge[];
  guards?: {
    max_total_iterations?: number;
    max_wallclock_ms?: number;
    budget_usd?: number;
    require_human_approval_on?: string[];
  };
};

export type CrewRunInput = {
  crew: CrewDefinition;
  prompt?: string;
  total_effort_budget?: number;
  run_id?: string;
  resume_from?: CrewResumeState;
};

export type CrewResumeState = {
  completed_task_ids: string[];
  context_out: Record<string, unknown>;
  waves: string[][];
  prior_turns: CrewTurn[];
  skipped_task_ids?: string[];
};

export type CrewTurn = {
  run_id: string;
  agent_id: string;
  task_id: string;
  text: string;
  intent: string | null;
  mode: string | null;
  duration_ms: number;
  wave?: number;
};

export type CrewRunResult =
  | {
      status: "ok";
      run_id: string;
      crew_id: string;
      turns: CrewTurn[];
      context_out: Record<string, unknown>;
      total_duration_ms: number;
      waves?: string[][];
      skipped_task_ids?: string[];
    }
  | {
      status: "error";
      run_id: string;
      crew_id: string;
      error: string;
      partial_turns: CrewTurn[];
    }
  | {
      status: "paused_for_approval";
      run_id: string;
      crew_id: string;
      turns: CrewTurn[];
      paused_at_task: string;
      resume_state: CrewResumeState;
      partial_duration_ms: number;
    }
  | {
      status: "not_implemented_yet";
      run_id: string;
      crew_id: string;
      planned_steps: string[];
      see: string;
    };
