"use client";

/**
 * app/agents/crew/crew-runner/use-crew-run.ts — Form-state + submit
 * hook for the crew runner.
 *
 * Owns:
 *   - the form state machine (description, orchestrator, specialist
 *     selection, expected-output)
 *   - input validation (description non-empty, ≥1 specialist,
 *     orchestrator must be a member of the crew)
 *   - the POST to /api/agents/crew with the operator's bearer token
 *   - the SubmitStatus state machine (idle / running / error / done)
 *
 * Returns `{ form, status, isRunning, setField, toggleSpecialist,
 * submit }` so the orchestrator file only owns the JSX layout.
 */

import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";

import {
  INITIAL_FORM,
  type ClientCrewRun,
  type FormState,
  type SubmitStatus,
} from "./types";

export type UseCrewRun = {
  form: FormState;
  status: SubmitStatus;
  isRunning: boolean;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleSpecialist: (slug: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useCrewRun(user: User | null): UseCrewRun {
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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

  return { form, status, isRunning, setField, toggleSpecialist, submit };
}

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
