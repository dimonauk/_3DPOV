/**
 * lib/agents/crew/index.ts — Public surface of the crew core.
 *
 * Single import point. Route handlers, server actions, and other
 * server-side callers should reach for `Crew` / `runCrew` from here:
 *
 *   import { Crew, runCrew, type Specialist, type CrewRun } from "lib/agents/crew";
 *
 * Server-only — re-exports server-only modules. Do not import from a
 * client component; the bundler will fail loudly if you try.
 */

import "server-only";

export { Crew, runCrew } from "./crew";

export type {
  Specialist,
  Task,
  ToolCall,
  ToolHandler,
  ToolRegistry,
  CrewStep,
  CrewRun,
  RunCrewInput,
} from "./types";
