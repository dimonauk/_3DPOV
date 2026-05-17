"use client";

/**
 * app/play/agent-town/agent-town/inspect-panel.tsx — Right-side
 * aside: inspect card for the selected townie, latest banter turns,
 * scrolling event log.
 *
 * Extracted from agent-town-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { BanterTurn } from "lib/capabilities/agent/banter";
import type { CastMemberId } from "lib/cast";

import type { LogLine, Townie } from "./types";

export function InspectPanel({
  selectedTownie,
  turns,
  rosterById,
  logLines,
}: {
  selectedTownie: Townie | null;
  turns: BanterTurn[];
  rosterById: Map<CastMemberId, Townie>;
  logLines: LogLine[];
}) {
  return (
    <aside className="w-full max-w-sm shrink-0 lg:w-80">
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
        <div className="chrome-label mb-2 text-chrome-500">inspect</div>
        {selectedTownie ? (
          <div className="space-y-2 text-sm">
            <div
              className="font-mono text-base"
              style={{ color: selectedTownie.colour }}
            >
              {selectedTownie.name}
            </div>
            <div className="text-xs text-chrome-400">
              {selectedTownie.role}
            </div>
            <div className="text-xs text-chrome-300">
              <span className="text-chrome-500">task </span>
              {selectedTownie.task}
            </div>
            <div className="text-xs text-chrome-300">
              <span className="text-chrome-500">mood </span>
              {selectedTownie.mood}
            </div>
            <div className="text-xs text-chrome-300">
              <span className="text-chrome-500">status </span>
              {selectedTownie.status}
            </div>
          </div>
        ) : (
          <p className="text-xs text-chrome-500">
            click a shape on the floor to inspect.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
        <div className="chrome-label mb-2 text-chrome-500">latest banter</div>
        {turns.length === 0 ? (
          <p className="text-xs text-chrome-500">
            no banter yet. press the button below the floor.
          </p>
        ) : (
          <ol className="space-y-2 text-xs">
            {turns.map((turn, i) => {
              const speaker = rosterById.get(turn.speaker as CastMemberId);
              const colour = speaker?.colour ?? "#c8d8e8";
              return (
                <li key={i} className="text-chrome-200">
                  <span className="font-mono" style={{ color: colour }}>
                    {speaker?.name ?? turn.speaker}
                  </span>
                  <span className="text-chrome-500"> ({turn.emotion})</span>
                  <span>: {turn.text}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
        <div className="chrome-label mb-2 text-chrome-500">event log</div>
        <ol className="max-h-64 space-y-1 overflow-y-auto pr-1 text-[11px] text-chrome-400">
          {logLines.map((line, i) => (
            <li key={i}>
              <span className="text-chrome-600">[{line.ts}]</span> {line.text}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
