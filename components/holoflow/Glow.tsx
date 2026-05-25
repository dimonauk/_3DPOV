/**
 * Glow — pulsing box-shadow ring wrapper.
 *
 * Honors the glowEffects theme axis. When axis is "off", renders the
 * child unwrapped (no DOM change). When "on", applies the appropriate
 * .holoflow-glow-* keyframe animation.
 *
 *   <Glow color="mint"><Card>…</Card></Glow>
 *
 * The animation classes are defined in globals.css.
 */

"use client";

import { type ReactNode } from "react";

import { useTheme } from "lib/theme/store";

const CLS = {
  mint: "holoflow-glow-mint",
  pink: "holoflow-glow-pink",
  lilac: "holoflow-glow-lilac",
} as const;

export function Glow({
  color = "mint",
  className = "",
  children,
}: {
  color?: "mint" | "pink" | "lilac";
  className?: string;
  children: ReactNode;
}) {
  const enabled = useTheme((s) => s.selection.glowEffects) === "on";
  const cls = enabled ? `${CLS[color]} ${className}` : className;
  return <div className={cls}>{children}</div>;
}
