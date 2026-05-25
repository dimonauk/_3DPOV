/**
 * ScrollIndicator — bouncing 30px gradient bar + mono label.
 * Sits at the bottom-centre of the hero. Uses holoflow-bob keyframe
 * (defined in globals.css).
 */

export function ScrollIndicator({ label = "Scroll" }: { label?: string }) {
  return (
    <div className="holoflow-bob flex flex-col items-center gap-1">
      <span className="h-8 w-px bg-gradient-to-b from-lavender-400 to-transparent" />
      <span className="font-mono text-[0.42rem] uppercase tracking-[0.26em] text-chrome-500">
        {label}
      </span>
    </div>
  );
}
