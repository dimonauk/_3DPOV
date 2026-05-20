import Link from "next/link";

import {
  type LaunchPath,
  launchChipLabel,
  launchHref,
} from "lib/play/families";

/**
 * PlayBar — the prominent "play now" CTA used on the per-system
 * focused view. Renders every launchable path as a side-by-side
 * button row, with the preferred path first. Coming-soon paths
 * render as a disabled chip.
 *
 * Server component. No state; the buttons are plain navigation links.
 */
export type PlayBarProps = {
  launches: LaunchPath[];
};

function buttonClasses(launch: LaunchPath): string {
  switch (launch.kind) {
    case "emulatorjs":
      return "border-pink-200/40 bg-pink-200/[0.07] text-pink-200 hover:bg-pink-200/[0.12]";
    case "webxr-retroarch":
      return "border-pink-200/60 bg-pink-200/[0.10] text-pink-200 hover:bg-pink-200/[0.16]";
    case "bench-bridge":
      return "border-chrome-400/40 bg-warm-black-900/60 text-chrome-100 hover:border-pink-200/30 hover:text-pink-200";
    case "comingSoon":
      return "border-warm-black-700 bg-warm-black-900/40 text-chrome-500 cursor-not-allowed";
  }
}

export function PlayBar({ launches }: PlayBarProps) {
  if (launches.length === 0) {
    return (
      <div className="mt-6 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 text-sm text-chrome-500">
        No launch path wired yet. The system is catalogued; the launcher
        lands when the bench gets to it.
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {launches.map((launch, i) => {
        const href = launchHref(launch);
        const cls = `inline-flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-sm transition-colors ${buttonClasses(
          launch,
        )}`;
        const inner = (
          <>
            <span className="chrome-label tracking-widest">
              {launchChipLabel(launch)}
            </span>
            {href ? <span aria-hidden>&rarr;</span> : null}
          </>
        );
        if (!href) {
          return (
            <span key={i} className={cls} aria-disabled="true">
              {inner}
            </span>
          );
        }
        return (
          <Link key={i} href={href} className={cls}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

export default PlayBar;
