"use client";

/**
 * components/hooks/useHeadPose.ts — React hook wrapping the input.headpose capability.
 *
 * One-line role: subscribe to the input slice's head-pose for component consumers, with auto-start on mount.
 * Full purpose in useHeadPose.PURPOSE.md.
 */

import { useEffect } from "react";

import { useInputStore, type HeadPose, type HeadPoseSource } from "lib/state/input";
import { startHeadpose, stopHeadpose } from "lib/capabilities/input/headpose";
import { createLogger, errToObject } from "lib/log";

const log = createLogger("hooks.useHeadPose");

export type UseHeadPoseOptions = {
  /** Tracker to start. Default "mouse" — the only implemented source in v0.1. */
  source?: HeadPoseSource;
  /** If true, the hook does NOT auto-start the capability. Callers manage lifecycle externally. */
  manual?: boolean;
};

export type UseHeadPoseResult = {
  pose: HeadPose;
  source: HeadPoseSource;
};

/**
 * Subscribe to the head-pose slice. By default also starts the
 * `input.headpose` capability on mount with the requested source and
 * stops it on unmount. Pass `{ manual: true }` to skip the auto-start
 * (useful when a parent component owns the capability lifecycle).
 */
export function useHeadPose(options: UseHeadPoseOptions = {}): UseHeadPoseResult {
  const pose = useInputStore((s) => s.headPose);
  const source = useInputStore((s) => s.headPoseSource);

  useEffect(() => {
    if (options.manual) return;
    const requested = options.source ?? "mouse";
    try {
      startHeadpose({ source: requested });
    } catch (err) {
      log.warn("failed to start tracker", { err: errToObject(err) });
    }
    return () => stopHeadpose();
  }, [options.manual, options.source]);

  return { pose, source };
}
