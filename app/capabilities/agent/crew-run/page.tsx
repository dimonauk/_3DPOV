import Footer from "components/layout/footer";
import Link from "next/link";
import {
  validateCrew,
  summariseCrew,
  predictWaves,
  type CrewDefinition,
} from "lib/capabilities/agent/crew-run";
import sequentialExample from "lib/agents/sequential-example.json";
import convergenceCrew from "lib/agents/convergence-crew.example.json";
import graphExample from "lib/agents/graph-example.json";
import { RunButton } from "./RunButton";

export const metadata = {
  title: "agent.crew-run — debug surface",
  description:
    "Inspect multi-agent crew definitions: validation status, summary stats, and predicted execution waves. The lens onto Layer 5 of the SYSTEM.md architecture — coordinated dispatch of declared agents across sequential, parallel, hierarchical, and graph process modes.",
};

// ── Data assembly (build-time / RSC) ─────────────────────────────────

type CrewSlot = {
  filename: string;
  raw: unknown;
};

const slots: CrewSlot[] = [
  { filename: "sequential-example.json", raw: sequentialExample },
  { filename: "convergence-crew.example.json", raw: convergenceCrew },
  { filename: "graph-example.json", raw: graphExample },
];

type CrewAnalysis = {
  filename: string;
  raw: unknown;
  validated: ReturnType<typeof validateCrew>;
  crew: CrewDefinition | null;
  summary: ReturnType<typeof summariseCrew> | null;
  waves: { ok: true; waves: string[][] } | { ok: false; error: string } | null;
};

function analyseAll(): CrewAnalysis[] {
  return slots.map(({ filename, raw }) => {
    const validated = validateCrew(raw);
    const crew = validated.ok ? validated.crew : null;
    const summary = crew ? summariseCrew(crew) : null;
    const waves = crew ? predictWaves(crew) : null;
    return { filename, raw, validated, crew, summary, waves };
  });
}

// ── Tiny render helpers ──────────────────────────────────────────────

function StatusPill({ ok }: { ok: boolean }) {
  const cls = ok
    ? "border-pink-200/60 text-pink-200"
    : "border-warm-black-700 text-chrome-400";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}
    >
      {ok ? "valid" : "invalid"}
    </span>
  );
}

function ProcessPill({ process: p }: { process: string }) {
  return (
    <span className="rounded-sm border border-warm-black-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-chrome-300">
      {p}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-warm-black-800 py-2 text-xs">
      <span className="chrome-label">{label}</span>
      <span className="font-mono text-chrome-200">{value}</span>
    </div>
  );
}

function CrewCard({ analysis }: { analysis: CrewAnalysis }) {
  const { filename, validated, crew, summary, waves } = analysis;
  const isValid = validated.ok;

  return (
    <article className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-warm-black-800 pb-4">
        <div>
          <div className="font-mono text-xs text-chrome-400">{filename}</div>
          {crew && (
            <h3 className="mt-1 text-xl text-chrome-100">
              {crew.name}{" "}
              <span className="font-mono text-xs text-chrome-400">
                v{crew.version}
              </span>
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusPill ok={isValid} />
          {crew && <ProcessPill process={crew.process} />}
        </div>
      </header>

      {!isValid && (
        <div className="rounded-sm border border-warm-black-700 bg-warm-black-950/60 p-4 font-mono text-xs text-chrome-400">
          {validated.error}
        </div>
      )}

      {crew && summary && (
        <>
          {crew.description && (
            <p className="mb-5 text-sm text-chrome-300">{crew.description}</p>
          )}

          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <div>
              <h4 className="chrome-label mb-2">Composition</h4>
              <StatRow label="Agents" value={summary.agents} />
              <StatRow label="Tasks" value={summary.tasks} />
              <StatRow
                label="Lead agent"
                value={crew.lead_agent ?? "—"}
              />
              <StatRow
                label="Conditional edges"
                value={summary.conditional_edges}
              />
              <StatRow
                label="HITL tasks"
                value={summary.tasks_with_hitl}
              />
            </div>
            <div>
              <h4 className="chrome-label mb-2">Tool bindings</h4>
              <StatRow label="Total" value={summary.tools_total} />
              <StatRow
                label="builtin"
                value={summary.tools_by_kind.builtin}
              />
              <StatRow label="mcp" value={summary.tools_by_kind.mcp} />
              <StatRow
                label="subagent"
                value={summary.tools_by_kind.subagent}
              />
              <StatRow
                label="With output_schema"
                value={summary.tasks_with_output_schema}
              />
              <StatRow
                label="With output_path"
                value={summary.tasks_with_output_path}
              />
            </div>
          </div>

          <div className="mt-6">
            <h4 className="chrome-label mb-2">Agents</h4>
            <ul className="space-y-2 text-xs">
              {crew.agents.map((a) => (
                <li
                  key={a.id}
                  className="rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-chrome-200">{a.id}</span>
                    {a.tools && a.tools.length > 0 && (
                      <span className="font-mono text-[10px] text-chrome-400">
                        {a.tools.length} tool
                        {a.tools.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-chrome-300">{a.role}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h4 className="chrome-label mb-2">Tasks</h4>
            <ul className="space-y-2 text-xs">
              {crew.tasks.map((t) => (
                <li
                  key={t.id}
                  className="rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-chrome-200">{t.id}</span>
                    <span className="font-mono text-[10px] text-chrome-400">
                      → {t.assigned_agent}
                    </span>
                  </div>
                  {t.depends_on && t.depends_on.length > 0 && (
                    <div className="mt-1 font-mono text-[10px] text-chrome-400">
                      depends_on: {t.depends_on.join(", ")}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.human_in_the_loop && (
                      <span className="rounded-full border border-warm-black-700 px-2 py-0.5 text-[9px] uppercase tracking-wider text-chrome-400">
                        HITL
                      </span>
                    )}
                    {typeof t.retries === "number" && t.retries !== 1 && (
                      <span className="rounded-full border border-warm-black-700 px-2 py-0.5 text-[9px] uppercase tracking-wider text-chrome-400">
                        retries: {t.retries}
                      </span>
                    )}
                    {t.output_schema && (
                      <span className="rounded-full border border-warm-black-700 px-2 py-0.5 text-[9px] uppercase tracking-wider text-chrome-400">
                        output_schema
                      </span>
                    )}
                    {t.output_path && (
                      <span className="rounded-full border border-warm-black-700 px-2 py-0.5 text-[9px] uppercase tracking-wider text-chrome-400">
                        output_path
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {crew.edges && crew.edges.length > 0 && (
            <div className="mt-6">
              <h4 className="chrome-label mb-2">Edges (graph mode)</h4>
              <ul className="space-y-1 text-xs">
                {crew.edges.map((e, idx) => (
                  <li
                    key={`${e.from_task}-${e.to_task}-${idx}`}
                    className="rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-2 font-mono"
                  >
                    <span className="text-chrome-200">{e.from_task}</span>
                    <span className="mx-2 text-chrome-500">→</span>
                    <span className="text-chrome-200">{e.to_task}</span>
                    {e.when && (
                      <span className="ml-3 text-pink-200">
                        when: {e.when}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <h4 className="chrome-label mb-2">Predicted execution waves</h4>
            {waves && waves.ok ? (
              <div className="space-y-2">
                {waves.waves.map((wave, idx) => (
                  <div
                    key={`wave-${idx}`}
                    className="flex flex-wrap items-baseline gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-2"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-chrome-400">
                      wave {idx}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {wave.map((id) => (
                        <span
                          key={id}
                          className="rounded-sm border border-warm-black-800 px-2 py-0.5 font-mono text-xs text-chrome-200"
                        >
                          {id}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
                {crew.process === "hierarchical" && crew.lead_agent && (
                  <div className="rounded-sm border border-pink-200/40 bg-warm-black-950/40 p-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-pink-200">
                      synthesis
                    </span>
                    <span className="ml-2 font-mono text-xs text-chrome-200">
                      {crew.lead_agent}
                    </span>
                    <span className="ml-2 text-[10px] text-chrome-400">
                      (post-DAG, wraps all worker outputs)
                    </span>
                  </div>
                )}
              </div>
            ) : waves && !waves.ok ? (
              <div className="font-mono text-xs text-chrome-400">
                cycle detected — {waves.error}
              </div>
            ) : null}
            {crew.process === "graph" && summary.conditional_edges > 0 && (
              <p className="mt-2 text-[10px] text-chrome-400">
                Note: graph mode with conditional edges — predicted waves
                represent the worst-case (every edge taken). Actual execution
                may skip downstream tasks based on{" "}
                <span className="font-mono text-chrome-300">edge.when</span>{" "}
                evaluation.
              </p>
            )}
          </div>

          <RunButton crewId={crew.id} />
        </>
      )}
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function CrewRunDebugPage() {
  const analyses = analyseAll();
  const total = analyses.length;
  const valid = analyses.filter((a) => a.validated.ok).length;

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">capability debug surface</div>
        <h1 className="mt-4 font-mono text-3xl leading-tight text-chrome-100 md:text-4xl">
          agent.crew-run
        </h1>
        <p className="mt-2 text-chrome-400">
          The lens onto Layer 5 of{" "}
          <Link
            href="https://github.com/holoflowstudio/holoflow-co-uk/blob/main/docs/SYSTEM.md"
            className="text-pink-200 underline underline-offset-4"
          >
            SYSTEM.md
          </Link>
          : multi-agent crews running over the schema at{" "}
          <span className="font-mono text-chrome-300">
            lib/agents/crew-schema.json
          </span>
          .
        </p>

        <p className="mt-6 max-w-2xl text-sm text-chrome-300">
          Four process modes execute end-to-end:{" "}
          <span className="font-mono text-chrome-200">sequential</span>,{" "}
          <span className="font-mono text-chrome-200">parallel</span>,{" "}
          <span className="font-mono text-chrome-200">hierarchical</span>{" "}
          (with a final synthesis pass by the lead agent), and{" "}
          <span className="font-mono text-chrome-200">graph</span> (with
          conditional <span className="font-mono">edge.when</span> routing).
          DAG modes share a topological executor with cycle detection,
          parallel waves, transitive-skip propagation, retries, and
          human-in-the-loop pause/resume. Task outputs can be validated
          against JSON Schema and persisted to disk. Tool bindings
          (builtin / mcp / subagent) are validated at design time;
          runtime tool execution awaits a ReAct loop in{" "}
          <span className="font-mono text-chrome-300">respond()</span>.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-xs text-chrome-300">
          <span className="rounded-sm border border-pink-200/60 px-3 py-1 text-pink-200">
            {valid}/{total} valid
          </span>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            ← all capabilities
          </Link>
          <Link
            href="https://github.com/holoflowstudio/holoflow-co-uk/blob/main/lib/capabilities/agent/crew-run.PURPOSE.md"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            PURPOSE.md
          </Link>
          <Link
            href="https://github.com/holoflowstudio/holoflow-co-uk/blob/main/lib/capabilities/agent/crew-run.ts"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            source
          </Link>
        </div>

        <section className="mt-12">
          <div className="chrome-label">Reference instances</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            {total} crew{total === 1 ? "" : "s"} in{" "}
            <span className="font-mono text-chrome-300">lib/agents/</span>
          </h2>

          <div className="mt-6 space-y-6">
            {analyses.map((a) => (
              <CrewCard key={a.filename} analysis={a} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Running a crew</div>
          <p className="mt-3">
            Each crew card has a <strong>run crew</strong> button. It POSTs
            to{" "}
            <span className="font-mono text-chrome-200">
              /api/capabilities/agent/crew-run/run
            </span>
            , which calls{" "}
            <span className="font-mono text-chrome-200">runCrew()</span>{" "}
            server-side against the configured provider and returns the
            result plus a pinned trace via{" "}
            <span className="font-mono text-chrome-200">
              exportTrace(result, crew)
            </span>
            . Turns render inline as they come back. Crews with{" "}
            <span className="font-mono text-chrome-300">human_in_the_loop</span>{" "}
            tasks pause for approval — hit{" "}
            <span className="text-pink-200">approve &amp; resume</span> to
            continue. Runs are rate-limited to 3/hour/visitor (they're
            expensive — a hierarchical crew is ~10 LLM calls).
          </p>
          <p className="mt-3 text-chrome-400">
            Requires{" "}
            <span className="font-mono text-chrome-300">
              AI_GATEWAY_API_KEY
            </span>{" "}
            in the deployment env — without it the run button returns a 503.
            Predicted waves above represent the worst-case execution graph
            (every edge taken); for graph-mode crews with conditional{" "}
            <span className="font-mono text-chrome-300">edge.when</span>{" "}
            predicates, actual runtime waves may be shorter as downstream
            tasks get skipped.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
