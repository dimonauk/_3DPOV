import type { SidecarStatus } from "../types";
import { TAB_DEFS } from "../types";

export function OverviewTab({ status }: { status: SidecarStatus }) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-2xl text-chrome-100">What the workshop holds</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-400">
          Six surfaces, one bench. Each surface is a sub-tab on the
          left. The same Toolbox runs on the studio&rsquo;s
          machine at port 5138; this chamber mirrors the layout so a
          visitor can read the inventory of installed tools, the
          generator forms, and the round-trip flow even when the
          sidecar is asleep.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {TAB_DEFS.filter((t) => t.id !== "overview").map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-4"
          >
            <span className="font-mono text-lg leading-none text-pink-200">{t.glyph}</span>
            <div className="min-w-0">
              <dt className="text-sm text-chrome-100">{t.label}</dt>
              <dd className="mt-1 text-xs text-chrome-400">{t.hint}</dd>
            </div>
          </div>
        ))}
      </dl>

      {status.kind === "offline" ? (
        <aside className="rounded-sm border border-warm-black-700 bg-warm-black-900 p-4 text-xs text-chrome-400">
          <p className="text-chrome-200">Want the live surface?</p>
          <p className="mt-1">
            Start the sidecar on the bench:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 font-mono text-[11px] text-emerald-200">
{`cd D:\\The_Hangar\\engines\\holoflow-services
.\\start.bat`}
          </pre>
          <p className="mt-2">
            First run: <code className="font-mono text-chrome-200">pip install -r requirements.txt</code> first.
          </p>
        </aside>
      ) : null}
    </div>
  );
}
