"use client";

/**
 * app/atelier/inverse-kata/inverse-kata/use-match.ts — State machine
 * for Phase A (heuristic matcher) + Phase B (LLM orchestrator). The
 * hook returns both states + the two POST handlers; the host wires
 * pointer events that mutate the drawing state itself.
 *
 * Extracted from inverse-kata-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useEffect, useState } from "react";

import type {
  InverseKataResult,
  Vec2,
} from "lib/capabilities/inverse-kata/match";
import { createLogger } from "lib/log";

import type { OrchestratorResult, OrchestratorState, State } from "./types";

const log = createLogger("atelier:inverse-kata:match");

export function useMatch() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [orch, setOrch] = useState<OrchestratorState>({ kind: "idle" });

  // Reset orchestrator whenever a fresh phase-A result lands.
  useEffect(() => {
    if (state.kind === "drawing" || state.kind === "matching") {
      setOrch({ kind: "idle" });
    }
  }, [state.kind]);

  const runMatch = useCallback(
    async (points: Vec2[], timing: number[]) => {
      if (points.length < 4) {
        setState({
          kind: "error",
          message:
            "Trail too short — draw a longer line (at least 4 sample points).",
        });
        return;
      }
      setState({ kind: "matching", points, timing });
      try {
        // Pass a default trailScale of 0.005 metres-per-pixel (i.e. the
        // canvas represents a ~3.6m × 2.4m volume). This is only used when
        // the matcher needs to infer duration from length; we always pass
        // timing here so it's mostly informational.
        const res = await fetch("/api/inverse-kata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            points,
            timing,
            trailScale: 0.005,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          let message = `HTTP ${res.status}`;
          try {
            const parsed = JSON.parse(text) as { error?: string };
            if (parsed.error) message = parsed.error;
          } catch {
            if (text.length > 0 && text.length < 300) message = text;
          }
          setState({ kind: "error", message });
          return;
        }
        const json = (await res.json()) as { result?: InverseKataResult };
        if (!json.result) {
          setState({
            kind: "error",
            message: "Server replied without a result.",
          });
          return;
        }
        setState({ kind: "ready", points, timing, result: json.result });
      } catch (err) {
        log.error("match failed", { err });
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Match failed.",
        });
      }
    },
    [],
  );

  const onAskLlm = useCallback(async () => {
    if (state.kind !== "ready") return;
    setOrch({ kind: "thinking" });
    try {
      const res = await fetch("/api/inverse-kata/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: state.points,
          timing: state.timing,
          phaseAResult: state.result,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed.error) message = parsed.error;
        } catch {
          if (text.length > 0 && text.length < 300) message = text;
        }
        setOrch({ kind: "error", message });
        return;
      }
      const json = (await res.json()) as { result?: OrchestratorResult };
      if (!json.result) {
        setOrch({ kind: "error", message: "Empty LLM result." });
        return;
      }
      setOrch({ kind: "ready", result: json.result });
    } catch (err) {
      log.error("orchestrate failed", { err });
      setOrch({
        kind: "error",
        message: err instanceof Error ? err.message : "LLM call failed.",
      });
    }
  }, [state]);

  const onClear = useCallback(() => {
    setState({ kind: "idle" });
    setOrch({ kind: "idle" });
  }, []);

  return { state, setState, orch, runMatch, onAskLlm, onClear };
}
