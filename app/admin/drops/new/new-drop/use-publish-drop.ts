"use client";

/**
 * app/admin/drops/new/new-drop/use-publish-drop.ts
 *
 * Form state machine + POST handler for the drop publish form.
 * Returns `{ state, status, setField, submit, isSubmitting }` so
 * the orchestrator stays presentational.
 */

import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import type { useRouter } from "next/navigation";

import {
  isDropResponse,
  isGateFailResponse,
  isValidationFailResponse,
} from "./response-guards";
import { toPublishInput } from "./transform";
import {
  INITIAL_STATE,
  type FormState,
  type SubmitStatus,
} from "./types";

type Router = ReturnType<typeof useRouter>;

export type UsePublishDrop = {
  state: FormState;
  status: SubmitStatus;
  isSubmitting: boolean;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function usePublishDrop(
  user: User | null,
  router: Router,
): UsePublishDrop {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  const setField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
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
    setStatus({ kind: "submitting" });

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

    const input = toPublishInput(state);

    let res: Response;
    try {
      res = await fetch("/api/admin/drops/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Network error contacting publish endpoint.",
      });
      return;
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      setStatus({
        kind: "error",
        message: `Publish endpoint returned a non-JSON ${res.status} response.`,
      });
      return;
    }

    if (res.status === 201 && isDropResponse(json)) {
      setStatus({ kind: "done", dropId: json.drop.id });
      router.refresh();
      return;
    }
    if (res.status === 400 && isGateFailResponse(json)) {
      const next: SubmitStatus = {
        kind: "gate-failed",
        message: json.message,
      };
      if (json.oracle) next.oracle = json.oracle;
      if (json.sieve) next.sieve = json.sieve;
      setStatus(next);
      return;
    }
    if (res.status === 400 && isValidationFailResponse(json)) {
      setStatus({ kind: "validation-failed", issues: json.issues });
      return;
    }
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : `Publish failed (${res.status}).`;
    setStatus({ kind: "error", message });
  };

  return {
    state,
    status,
    isSubmitting: status.kind === "submitting",
    setField,
    submit,
  };
}
