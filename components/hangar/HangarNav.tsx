"use client";

/**
 * components/hangar/HangarNav.tsx
 *
 * Sticky tab strip for the Hangar showcase. Tab list mirrors the 12
 * nav items in public/hangar-v2.html (Home → Timeline → About).
 *
 * Receives the active tab id and an onNavigate callback so the page
 * shell owns routing/state — the nav itself is presentational.
 */

const TABS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "home", label: "Home" },
  { id: "gallery", label: "Gallery" },
  { id: "sculpture", label: "Sculpture" },
  { id: "software", label: "Software" },
  { id: "light", label: "Light Painting" },
  { id: "poi", label: "Poi & Flow" },
  { id: "journal", label: "Journal" },
  { id: "kb", label: "Knowledge Base" },
  { id: "demos", label: "Demos" },
  { id: "whimsy", label: "Whimsy" },
  { id: "timeline", label: "Timeline" },
  { id: "about", label: "About" },
];

export type HangarNavProps = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function HangarNav({ activeId, onNavigate }: HangarNavProps) {
  return (
    <nav className="sticky top-0 z-[200] border-b border-[rgba(255,61,31,0.12)] bg-[var(--wire,#1a1a2e)]">
      <div className="flex items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="shrink-0 px-[18px] py-[14px] font-[Syne,_sans-serif] text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--paper,#f5f2ec)] hover:text-[var(--acc,#ff3d1f)]"
        >
          ◈ HANGAR
        </button>
        {TABS.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onNavigate(t.id)}
              aria-current={active ? "page" : undefined}
              className={[
                "shrink-0 whitespace-nowrap border-l border-[rgba(255,255,255,0.04)] px-[16px] py-[14px] font-mono text-[10px] uppercase tracking-[0.15em] transition-colors duration-150",
                active
                  ? "bg-[rgba(255,61,31,0.08)] text-[var(--acc,#ff3d1f)]"
                  : "text-[var(--paper,#f5f2ec)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--acc,#ff3d1f)]",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
