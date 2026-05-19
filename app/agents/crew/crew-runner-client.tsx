"use client";

/**
 * app/agents/crew/crew-runner-client.tsx — Form + trail viewer for the
 * crew runner.
 *
 * One-line role: collect a task description (+ orchestrator,
 * specialist multi-select, expected output), POST it to
 * `/api/agents/crew` with the operator's Firebase ID token, and
 * render the returned `CrewRun.trail` as a vertical timeline plus the
 * synthesised output in a "Result" pane.
 *
 * # Auth
 *
 * The outer page already verified the `__session` cookie on the
 * server. The form additionally attaches `Authorization: Bearer
 * <idToken>` because that's what the API route gates on. The token
 * comes from the same `useAuth()` + `getIdToken()` path
 * `/admin/drops/new` uses.
 *
 * # Trail rendering
 *
 *   - plan       chrome (the planner thinking out loud)
 *   - delegate   pink (handing work to another specialist)
 *   - tool       amber (a tool call — web search, lookup, etc.)
 *   - answer     emerald (a specialist's answer text)
 *   - stop       warm-black-700 (terminal step, usually maxIterations)
 *
 * Each step body is collapsible — long planner reasoning shouldn't
 * dominate the column.
 *
 * # Output
 *
 * Rendered as `<pre>` for now. `react-markdown` isn't in deps; when
 * it lands we swap the body of `ResultPane`. The pane is wrapped in
 * `.whitespace-pre-wrap` so prose still reads.
 *
 * # Voice
 *
 * The form copy is workshop-register (catalogue/operator, not
 * Princess). The hero on the parent page does the voice work.
 */

import { useMemo, useState, type FormEvent } from "react";

import { useAuth } from "components/auth/auth-provider";

// ---------------------------------------------------------------------
// Local trail / run shapes — mirror lib/agents/crew/types.ts.
//
// We don't import the server-only types module from the client because
// it's marked `import "server-only"`. The shapes here are a
// structural mirror; if the server types drift, this file fails
// loudly at the first `step.kind` switch.
// ---------------------------------------------------------------------

type ClientCrewStep =
  | {
      kind: "plan";
      by: string;
      reasoning: string;
    }
  | {
      kind: "delegate";
      by: string;
      to: string;
      subtask: string;
    }
  | {
      kind: "tool";
      by: string;
      tool: string;
      args: unknown;
      result?: unknown;
      error?: string;
    }
  | {
      kind: "answer";
      by: string;
      text: string;
    }
  | {
      kind: "stop";
      reason: string;
    };

type ClientCrewRun = {
  taskId: string;
  trail: ClientCrewStep[];
  output: string;
  ok: boolean;
  iterations: number;
  totalUsage: { inputTokens: number; outputTokens: number };
};

// ---------------------------------------------------------------------
// Available specialists — the five canonical cast members. Keep this
// list aligned with `lib/agents/cast.ts` and the parallel
// `lib/agents/specialists` module. When new agents land, add them
// here AND in the cast bible.
// ---------------------------------------------------------------------

const SPECIALIST_OPTIONS = [
  { slug: "aura", displayName: "Aura" },
  { slug: "marcel", displayName: "Marcel" },
  { slug: "coco", displayName: "Coco" },
  { slug: "scribe", displayName: "The Scribe" },
  { slug: "penny", displayName: "Penny" },
] as const;

const DEFAULT_ORCHESTRATOR = "aura";

// ---------------------------------------------------------------------
// Styling tokens (mirror /admin/drops/new for consistency)
// ---------------------------------------------------------------------

const INPUT_CLASS =
  "w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 placeholder-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-60";
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[8rem] leading-relaxed`;
const LABEL_CLASS = "chrome-label text-chrome-500";

// ---------------------------------------------------------------------
// Form / status state
// ---------------------------------------------------------------------

type FormState = {
  description: string;
  orchestrator: string;
  specialistSlugs: string[]; // empty array = "all"
  expectedOutput: string;
};

const INITIAL_FORM: FormState = {
  description: "",
  orchestrator: DEFAULT_ORCHESTRATOR,
  specialistSlugs: SPECIALIST_OPTIONS.map((s) => s.slug),
  expectedOutput: "",
};

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "error"; message: string }
  | { kind: "done"; run: ClientCrewRun };

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export function CrewRunnerClient({
  operatorEmail,
}: {
  operatorEmail: string;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  const isRunning = status.kind === "running";

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSpecialist = (slug: string) => {
    setForm((prev) => {
      const has = prev.specialistSlugs.includes(slug);
      const next = has
        ? prev.specialistSlugs.filter((s) => s !== slug)
        : [...prev.specialistSlugs, slug];
      return { ...prev, specialistSlugs: next };
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setStatus({
        kind: "error",
        message: "No signed-in user — refresh and sign in again.",
      });
      return;
    }
    if (form.description.trim().length === 0) {
      setStatus({ kind: "error", message: "Task description is required." });
      return;
    }
    if (form.specialistSlugs.length === 0) {
      setStatus({
        kind: "error",
        message: "Pick at least one specialist for the crew.",
      });
      return;
    }
    if (!form.specialistSlugs.includes(form.orchestrator)) {
      setStatus({
        kind: "error",
        message:
          "The orchestrator must be one of the selected specialists. " +
          "Either change the orchestrator or include them in the crew.",
      });
      return;
    }

    setStatus({ kind: "running" });

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? `Could not fetch id token: ${err.message}`
            : "Could not fetch id token.",
      });
      return;
    }

    const body: Record<string, unknown> = {
      description: form.description.trim(),
      orchestrator: form.orchestrator,
      specialistSlugs: form.specialistSlugs,
    };
    if (form.expectedOutput.trim().length > 0) {
      body.expectedOutput = form.expectedOutput.trim();
    }

    let res: Response;
    try {
      res = await fetch("/api/agents/crew", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Network error contacting the crew endpoint.",
      });
      return;
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      setStatus({
        kind: "error",
        message: `Crew endpoint returned a non-JSON ${res.status} response.`,
      });
      return;
    }

    if (res.status === 200 && isClientCrewRun(json)) {
      setStatus({ kind: "done", run: json });
      return;
    }

    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : `Crew run failed (${res.status}).`;
    setStatus({ kind: "error", message });
  };

  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-6 rounded-sm border border-warm-black-700 bg-warm-black-950 p-6"
      >
        <p className="chrome-label text-chrome-500">
          Signed in as <span className="text-pink-200">{operatorEmail}</span>
        </p>

        <Field
          label="Task description"
          hint="Plain English. Long-form is fine — describe what you want out the other end."
        >
          <textarea
            required
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            disabled={isRunning}
            placeholder="e.g. Draft a 400-word journal entry on why the studio cares about provenance, in Princess voice."
            className={TEXTAREA_CLASS}
          />
        </Field>

        <Field
          label="Orchestrator"
          hint="The specialist who plans and synthesises. Aura is the default — she's the one with the longest memory."
        >
          <select
            value={form.orchestrator}
            onChange={(e) => setField("orchestrator", e.target.value)}
            disabled={isRunning}
            className={INPUT_CLASS}
          >
            {SPECIALIST_OPTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.displayName}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="flex flex-col gap-3 rounded-sm border border-warm-black-700 p-4">
          <legend className={`${LABEL_CLASS} px-2`}>Crew</legend>
          <p className="text-[0.7rem] leading-relaxed text-chrome-400">
            Tick the specialists allowed at the table. The default is
            all five.
          </p>
          {SPECIALIST_OPTIONS.map((s) => (
            <Checkbox
              key={s.slug}
              label={s.displayName}
              checked={form.specialistSlugs.includes(s.slug)}
              disabled={isRunning}
              onChange={() => toggleSpecialist(s.slug)}
            />
          ))}
        </fieldset>

        <Field
          label="Expected output (optional)"
          hint="A shape contract for the planner — e.g. 'markdown article, 600-800 words, no headings'."
        >
          <textarea
            value={form.expectedOutput}
            onChange={(e) => setField("expectedOutput", e.target.value)}
            disabled={isRunning}
            placeholder="markdown article, 600-800 words, no headings"
            className={`${TEXTAREA_CLASS} min-h-[4rem]`}
          />
        </Field>

        <StatusBlock status={status} />

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isRunning}
            className="flex items-center gap-3 rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Spinner />
                Running…
              </>
            ) : (
              "Run the crew"
            )}
          </button>
        </div>
      </form>

      {status.kind === "done" ? <RunView run={status.run} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Run viewer — trail + result
// ---------------------------------------------------------------------

function RunView({ run }: { run: ClientCrewRun }) {
  return (
    <section className="flex flex-col gap-8">
      <RunHeader run={run} />
      <Trail steps={run.trail} />
      <ResultPane output={run.output} ok={run.ok} />
    </section>
  );
}

function RunHeader({ run }: { run: ClientCrewRun }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-sm border border-warm-black-700 bg-warm-black-950 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-chrome-400">
      <span>
        Task id <span className="text-chrome-200">{run.taskId}</span>
      </span>
      <span>
        Iterations <span className="text-chrome-200">{run.iterations}</span>
      </span>
      <span>
        In tokens{" "}
        <span className="text-chrome-200">{run.totalUsage.inputTokens}</span>
      </span>
      <span>
        Out tokens{" "}
        <span className="text-chrome-200">{run.totalUsage.outputTokens}</span>
      </span>
      <span>
        Status{" "}
        <span className={run.ok ? "text-emerald-200" : "text-pink-200"}>
          {run.ok ? "ok" : "stopped"}
        </span>
      </span>
    </div>
  );
}

function Trail({ steps }: { steps: ClientCrewStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-chrome-500">
        The crew didn&rsquo;t leave a trail. That shouldn&rsquo;t happen
        — check the server logs.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <TrailStep key={i} index={i} step={step} />
      ))}
    </ol>
  );
}

const STEP_KIND_STYLE: Record<ClientCrewStep["kind"], { bg: string; border: string; label: string }> = {
  plan: {
    bg: "bg-chrome-500/10",
    border: "border-chrome-400/30",
    label: "text-chrome-200",
  },
  delegate: {
    bg: "bg-pink-300/10",
    border: "border-pink-300/40",
    label: "text-pink-200",
  },
  tool: {
    bg: "bg-amber-300/10",
    border: "border-amber-300/40",
    label: "text-amber-200",
  },
  answer: {
    bg: "bg-emerald-300/10",
    border: "border-emerald-300/40",
    label: "text-emerald-200",
  },
  stop: {
    bg: "bg-warm-black-700/60",
    border: "border-warm-black-600",
    label: "text-chrome-400",
  },
};

function TrailStep({ index, step }: { index: number; step: ClientCrewStep }) {
  const style = STEP_KIND_STYLE[step.kind];
  const [open, setOpen] = useState(true);
  const speaker = useMemo(() => speakerLabel(step), [step]);

  return (
    <li
      className={`rounded-sm border ${style.border} ${style.bg} px-4 py-3 text-xs text-chrome-200`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-3 text-left">
          <span className={`chrome-label ${style.label}`}>
            {String(index + 1).padStart(2, "0")} &middot; {step.kind}
          </span>
          <span className="text-chrome-300">{speaker}</span>
        </span>
        <span className={`chrome-label ${style.label}`}>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="mt-3">{renderStepBody(step)}</div> : null}
    </li>
  );
}

function speakerLabel(step: ClientCrewStep): string {
  switch (step.kind) {
    case "plan":
    case "delegate":
    case "tool":
    case "answer":
      return step.by;
    case "stop":
      return "—";
  }
}

function renderStepBody(step: ClientCrewStep): React.ReactNode {
  switch (step.kind) {
    case "plan":
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-chrome-200">
          {step.reasoning}
        </p>
      );
    case "delegate":
      return (
        <div className="flex flex-col gap-1 leading-relaxed">
          <span className="text-chrome-400">
            → <span className="text-pink-200">{step.to}</span>
          </span>
          <p className="whitespace-pre-wrap text-chrome-200">
            {step.subtask}
          </p>
        </div>
      );
    case "tool":
      return (
        <div className="flex flex-col gap-2 leading-relaxed">
          <span className="text-amber-200">tool: {step.tool}</span>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-sm border border-warm-black-700 bg-warm-black-950 p-2 text-[0.7rem] text-chrome-300">
            args: {safeStringify(step.args)}
          </pre>
          {step.result !== undefined ? (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-sm border border-warm-black-700 bg-warm-black-950 p-2 text-[0.7rem] text-chrome-300">
              result: {safeStringify(step.result)}
            </pre>
          ) : null}
          {step.error ? (
            <p className="text-pink-200">error: {step.error}</p>
          ) : null}
        </div>
      );
    case "answer":
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-emerald-100">
          {step.text}
        </p>
      );
    case "stop":
      return (
        <p className="leading-relaxed text-chrome-400">
          Stopped &mdash; {step.reason}
        </p>
      );
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------
// Result pane — synthesised output. `<pre>` for now; swap for
// react-markdown when it lands in deps.
// ---------------------------------------------------------------------

function ResultPane({ output, ok }: { output: string; ok: boolean }) {
  const borderClass = ok ? "border-emerald-300/40" : "border-pink-300/40";
  const bgClass = ok ? "bg-emerald-300/5" : "bg-pink-300/5";
  const labelClass = ok ? "text-emerald-200" : "text-pink-200";
  return (
    <div
      className={`flex flex-col gap-3 rounded-sm border ${borderClass} ${bgClass} p-5`}
    >
      <span className={`chrome-label ${labelClass}`}>Result</span>
      {output.trim().length === 0 ? (
        <p className="text-xs italic text-chrome-400">
          (The crew returned an empty output. That&rsquo;s usually a
          sign the orchestrator gave up — check the trail above.)
        </p>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-chrome-100">
          {output}
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL_CLASS}>{label}</span>
      {hint ? (
        <span className="text-[0.65rem] leading-relaxed text-chrome-500">
          {hint}
        </span>
      ) : null}
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-chrome-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-pink-300"
      />
      {label}
    </label>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 animate-spin rounded-full border border-pink-200/40 border-t-pink-200"
    />
  );
}

function StatusBlock({ status }: { status: SubmitStatus }) {
  if (status.kind === "idle" || status.kind === "done") return null;
  if (status.kind === "running") {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-chrome-500/30 bg-chrome-500/5 p-3 text-xs text-chrome-200">
        <Spinner />
        <span className="leading-relaxed">
          The crew is talking. This can take a minute or two —
          they&rsquo;re thorough.
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
      <strong className="chrome-label text-pink-100">Error</strong>{" "}
      <span className="leading-relaxed">{status.message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Response narrowing
// ---------------------------------------------------------------------

function isClientCrewRun(value: unknown): value is ClientCrewRun {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.taskId !== "string") return false;
  if (!Array.isArray(v.trail)) return false;
  if (typeof v.output !== "string") return false;
  if (typeof v.ok !== "boolean") return false;
  if (typeof v.iterations !== "number") return false;
  const usage = v.totalUsage as Record<string, unknown> | undefined;
  if (
    !usage ||
    typeof usage.inputTokens !== "number" ||
    typeof usage.outputTokens !== "number"
  ) {
    return false;
  }
  return true;
}
