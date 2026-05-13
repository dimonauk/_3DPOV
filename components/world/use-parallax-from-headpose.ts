"use client";

/**
 * components/world/use-parallax-from-headpose.ts — Drives world.parallax from input.headPose.
 *
 * One-line role: subscribe to head-pose, write per-shell offsets to the world slice so ParallaxShells renders the right layered motion.
 * Full purpose in use-parallax-from-headpose.PURPOSE.md.
 */

import { useEffect } from "react";

import { useInputStore } from "lib/state/input";
import { useWorldStore, shellScale, type ShellIndex } from "lib/state/world";

const SHELL_INDICES: ShellIndex[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type UseParallaxFromHeadposeOptions = {
  /** Pixel multiplier for the outermost shell. Default 60. */
  strength?: number;
  /** Invert horizontal direction (default false — outer shells drift opposite to head yaw, classic parallax). */
  invertX?: boolean;
  /** Invert vertical direction (default false). */
  invertY?: boolean;
};

/**
 * Subscribe to `input.headPose` and write per-shell parallax offsets
 * to `world.parallax`. Each shell's offset scales by `shellScale(n)`
 * so shell 10 (closest) moves the most and shell 1 (deepest) moves
 * the least — classic multiplane parallax.
 */
export function useParallaxFromHeadpose(
  options: UseParallaxFromHeadposeOptions = {},
): void {
  const headPose = useInputStore((s) => s.headPose);
  const setParallax = useWorldStore((s) => s.setParallax);
  const strength = options.strength ?? 60;
  const xSign = options.invertX ? 1 : -1;
  const ySign = options.invertY ? -1 : 1;

  useEffect(() => {
    for (const n of SHELL_INDICES) {
      const factor = shellScale(n);
      setParallax(n, {
        x: xSign * headPose.yaw * strength * factor,
        y: ySign * headPose.pitch * strength * factor,
      });
    }
  }, [headPose, setParallax, strength, xSign, ySign]);
}
