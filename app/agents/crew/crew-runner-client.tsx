"use client";

/**
 * app/agents/crew/crew-runner-client.tsx — Operator form + trail
 * viewer for the crew runner.
 *
 * Thin orchestrator: owns the JSX layout only. Form state + submit
 * lives in `./crew-runner/use-crew-run.ts`; presentational sub-fields
 * in `./crew-runner/form-fields.tsx`; trail rendering in
 * `./crew-runner/trail-view.tsx`; shared types in
 * `./crew-runner/types.ts`.
 *
 * # Auth
 *
 * The outer page already verified the `__session` cookie on the
 * server. This form additionally attaches `Authorization: Bearer
 * <idToken>` because that's what the API route gates on. Token comes
 * from the same `useAuth()` + `getIdToken()` path
 * `/admin/drops/new` uses.
 */

import { useAuth } from "components/auth/auth-provider";

import { Checkbox, Field, Spinner, StatusBlock } from "./crew-runner/form-fields";
import { RunView } from "./crew-runner/trail-view";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SPECIALIST_OPTIONS,
  TEXTAREA_CLASS,
} from "./crew-runner/types";
import { useCrewRun } from "./crew-runner/use-crew-run";

export function CrewRunnerClient({
  operatorEmail,
}: {
  operatorEmail: string;
}) {
  const { user } = useAuth();
  const {
    form,
    status,
    isRunning,
    setField,
    toggleSpecialist,
    submit,
  } = useCrewRun(user);

  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={submit}
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
            title="Orchestrator"
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
