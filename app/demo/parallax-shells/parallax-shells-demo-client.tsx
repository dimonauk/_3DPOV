"use client";

/**
 * app/demo/parallax-shells/parallax-shells-demo-client.tsx — Client for the parallax-shells demo.
 *
 * One-line role: wire useHeadPose + useParallaxFromHeadpose + ParallaxShells with placeholder content.
 * Full purpose in parallax-shells-demo-client.PURPOSE.md.
 */

import type { ReactNode } from "react";

import { ParallaxShells } from "components/world/parallax-shells";
import { useParallaxFromHeadpose } from "components/world/use-parallax-from-headpose";
import { useHeadPose } from "components/hooks/useHeadPose";

const SHELL_PALETTE = [
  "#3a1a55", // 1 — innermost (Aura's body)
  "#54225f",
  "#6a2a66",
  "#7e3266",
  "#8e3a64",
  "#9c4360", // 6 — middle
  "#a64e5c",
  "#ad5a58",
  "#b16753", // 9 — London caricature
  "#b3744e", // 10 — outermost (workshop frame)
];

const SHELL_LABELS = [
  "1 · aura's body",
  "2",
  "3",
  "4",
  "5 · academy",
  "6",
  "7",
  "8",
  "9 · london",
  "10 · workshop",
];

function ShellPlaceholder({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}): ReactNode {
  const size = 60 + n * 8;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="flex items-center justify-center rounded-sm border font-mono text-xs"
        style={{
          width: `${size}%`,
          height: `${size}%`,
          borderColor: color,
          color: color,
          backgroundColor: `${color}10`,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function ParallaxShellsDemoClient() {
  useHeadPose({ source: "mouse" });
  useParallaxFromHeadpose({ strength: 80 });

  const shells = SHELL_LABELS.map((label, i) => {
    const n = i + 1;
    const color = SHELL_PALETTE[i] ?? "#ff66cc";
    return <ShellPlaceholder key={n} n={n} label={label} color={color} />;
  });

  return <ParallaxShells shells={shells} depthStep={140} className="h-full w-full" />;
}
