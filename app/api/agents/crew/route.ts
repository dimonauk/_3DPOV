/**
 * POST /api/agents/crew — Run a multi-agent crew end-to-end.
 *
 * One-line role: accept a task description from an operator, assemble
 * a crew of specialists (Aura + Marcel + Coco + Scribe + Penny by
 * default), and block until `runCrew` has produced a `CrewRun`. The
 * full trail + synthesised output comes back as JSON.
 *
 * # Auth posture
 *
 * Operator-gated. Same pattern as `/api/admin/tiers`:
 *
 *   Authorization: Bearer <Firebase ID token>
 *
 * The token's email must be on the ADMIN_EMAILS allow-list, OR the
 * token must carry a `role: "operator"` custom claim. Public visitors
 * absolutely cannot hit this — running a crew chains five LLM calls
 * and burns real tokens.
 *
 * # Body
 *
 *   {
 *     description: string,                   // required, the task
 *     orchestrator?: string,                 // default "aura"
 *     specialistSlugs?: string[],            // default = all five
 *     expectedOutput?: string,                // optional shape hint
 *   }
 *
 * # Runtime
 *
 *   - `dynamic = "force-dynamic"` — never cached.
 *   - `maxDuration = 300` — the dispatch loop can run five LLM calls
 *     back-to-back; the 60s default isn't enough.
 *   - NOT `export const runtime = "nodejs"` — that conflicts with
 *     experimental.useCache project-wide. `dynamic = "force-dynamic"`
 *     + maxDuration is enough to keep this route on Node.
 *
 * # No streaming
 *
 * The runner is blocking. We `await runCrew(...)` and return the full
 * `CrewRun`. Streaming each step as an SSE event is a follow-up; the
 * current contract is one POST → one JSON body.
 */

import { NextResponse } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";
import { createLogger } from "lib/log";

// Parallel agents own `lib/agents/crew/crew.ts` and `lib/agents/
// specialists/index.ts`. If they haven't landed when this file is
// type-checked, the imports below will fail loudly — that's the
// intended signal to wait for the other agents to ship.
// TODO: cross-check the import shape when crew + specialists land.
import { runCrew } from "lib/agents/crew/crew";
import { allSpecialists, getSpecialist } from "lib/agents/specialists";
import type { Specialist, Task } from "lib/agents/crew/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api.agents.crew");

const DEFAULT_ORCHESTRATOR = "aura";
const MAX_DESCRIPTION_CHARS = 4000;
const MAX_EXPECTED_OUTPUT_CHARS = 1000;
const MAX_SPECIALIST_COUNT = 12;

// ---------------------------------------------------------------------
// Body shape + guards
// ---------------------------------------------------------------------

type CrewRequestBody = {
  description?: unknown;
  orchestrator?: unknown;
  specialistSlugs?: unknown;
  expectedOutput?: unknown;
};

type ValidatedBody = {
  description: string;
  orchestrator: string;
  specialistSlugs: string[] | null;
  expectedOutput: string | null;
};

function validateBody(raw: CrewRequestBody): ValidatedBody | { error: string } {
  if (typeof raw.description !== "string" || raw.description.trim().length === 0) {
    return { error: "description_required" };
  }
  const description = raw.description.trim().slice(0, MAX_DESCRIPTION_CHARS);

  let orchestrator = DEFAULT_ORCHESTRATOR;
  if (raw.orchestrator !== undefined && raw.orchestrator !== null) {
    if (typeof raw.orchestrator !== "string" || raw.orchestrator.trim().length === 0) {
      return { error: "orchestrator_invalid" };
    }
    orchestrator = raw.orchestrator.trim().toLowerCase();
  }

  let specialistSlugs: string[] | null = null;
  if (raw.specialistSlugs !== undefined && raw.specialistSlugs !== null) {
    if (!Array.isArray(raw.specialistSlugs)) {
      return { error: "specialistSlugs_not_array" };
    }
    if (raw.specialistSlugs.length === 0) {
      return { error: "specialistSlugs_empty" };
    }
    if (raw.specialistSlugs.length > MAX_SPECIALIST_COUNT) {
      return { error: "specialistSlugs_too_many" };
    }
    const slugs: string[] = [];
    for (const s of raw.specialistSlugs) {
      if (typeof s !== "string" || s.trim().length === 0) {
        return { error: "specialistSlug_not_string" };
      }
      slugs.push(s.trim().toLowerCase());
    }
    specialistSlugs = slugs;
  }

  let expectedOutput: string | null = null;
  if (raw.expectedOutput !== undefined && raw.expectedOutput !== null) {
    if (typeof raw.expectedOutput !== "string") {
      return { error: "expectedOutput_not_string" };
    }
    const trimmed = raw.expectedOutput.trim();
    if (trimmed.length > 0) {
      expectedOutput = trimmed.slice(0, MAX_EXPECTED_OUTPUT_CHARS);
    }
  }

  return { description, orchestrator, specialistSlugs, expectedOutput };
}

// ---------------------------------------------------------------------
// Task id — timestamp + random suffix, traceable in the trail
// ---------------------------------------------------------------------

function makeTaskId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `crew-${ts}-${rand}`;
}

// ---------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  // -- Auth ------------------------------------------------------------
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let operatorUid: string;
  let operatorEmail: string | null;
  let operatorRole: string | null = null;
  try {
    const decoded = await verifyIdToken(authHeader.slice("bearer ".length).trim());
    operatorUid = decoded.uid;
    operatorEmail = decoded.email?.toLowerCase() ?? null;
    const raw = decoded as unknown as Record<string, unknown>;
    operatorRole = typeof raw.role === "string" ? raw.role : null;
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  const isOperator = operatorRole === "operator" || isAdminEmail(operatorEmail);
  if (!isOperator) {
    log.warn("non-operator tried to run a crew", { operatorUid, operatorEmail });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // -- Body ------------------------------------------------------------
  let raw: CrewRequestBody;
  try {
    raw = (await req.json()) as CrewRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validated = validateBody(raw);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  // -- Specialist resolution -------------------------------------------
  let specialists: ReadonlyArray<Specialist>;
  if (validated.specialistSlugs === null) {
    specialists = allSpecialists;
  } else {
    const resolved: Specialist[] = [];
    const seen = new Set<string>();
    for (const slug of validated.specialistSlugs) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      const found = getSpecialist(slug);
      if (!found) {
        return NextResponse.json(
          { error: "specialist_unknown", slug },
          { status: 400 },
        );
      }
      resolved.push(found);
    }
    specialists = resolved;
  }

  // Orchestrator must be one of the chosen specialists, otherwise
  // `runCrew` won't know who's planning.
  const orchestratorPresent = specialists.some((s) => s.slug === validated.orchestrator);
  if (!orchestratorPresent) {
    return NextResponse.json(
      {
        error: "orchestrator_not_in_crew",
        orchestrator: validated.orchestrator,
        crew: specialists.map((s) => s.slug),
      },
      { status: 400 },
    );
  }

  // -- Task + run ------------------------------------------------------
  const taskId = makeTaskId();
  const task: Task = {
    id: taskId,
    description: validated.description,
  };
  if (validated.expectedOutput) {
    task.expectedOutput = validated.expectedOutput;
  }

  log.info("crew run starting", {
    taskId,
    operatorUid,
    orchestrator: validated.orchestrator,
    crew: specialists.map((s) => s.slug),
  });

  try {
    const run = await runCrew({
      task,
      specialists,
      orchestrator: validated.orchestrator,
    });
    log.info("crew run finished", {
      taskId,
      ok: run.ok,
      iterations: run.iterations,
      inputTokens: run.totalUsage.inputTokens,
      outputTokens: run.totalUsage.outputTokens,
    });
    return NextResponse.json(run, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("crew run threw", { taskId, message });
    return NextResponse.json(
      { error: "crew_run_failed", message, taskId },
      { status: 500 },
    );
  }
}
