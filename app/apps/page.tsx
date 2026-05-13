import Footer from "components/layout/footer";
import Link from "next/link";

import { listApps, appTags, type AppEntry } from "lib/apps";

export const metadata = {
  title: "Apps — every callable surface in the studio",
  description:
    "The studio's app launcher. Demos, visualisers, tools, and the Chrono-Protocol prototype, surfaced as discrete launchable experiences. Grouped by pillar; ChronoMode register named where it applies.",
};

function gateClass(gate: AppEntry["gate"]): string {
  if (gate === "open") return "border-warm-black-800 text-chrome-400";
  if (gate === "rookery") return "border-pink-200/40 text-pink-200";
  return "border-warm-black-700 text-chrome-400 italic";
}

const MODE_COLOR: Record<NonNullable<AppEntry["mode"]>, string> = {
  amber: "#ffcc00",
  azure: "#0099ff",
  amethyst: "#9900ff",
  crimson: "#ff3344",
  veridian: "#00cc66",
};

function AppCard({ app }: { app: AppEntry }) {
  return (
    <Link
      href={app.href}
      className="group rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5 transition-colors hover:border-pink-200/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg text-chrome-100 group-hover:text-pink-100">
            {app.name}
          </h3>
          {app.mode && (
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: MODE_COLOR[app.mode] }}
            >
              {app.mode}
            </span>
          )}
        </div>
        <div
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${gateClass(app.gate)}`}
        >
          {app.gate}
        </div>
      </div>
      <p className="mt-3 text-sm text-chrome-300">{app.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-mono text-chrome-500">{app.kind}</span>
        <span className="text-chrome-400 group-hover:text-pink-200">
          launch &rarr;
        </span>
      </div>
    </Link>
  );
}

export default function AppsPage() {
  const all = listApps();
  const tags = appTags();

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The launcher</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          {all.length} apps,
          <br />
          all in one place.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Every callable surface the studio has built &mdash; demos,
          visualisers, tools, the Chrono-Protocol prototype &mdash;
          surfaced as discrete launchable experiences. Click any card
          to enter. The pillars below group them; the ChronoMode chip
          on a card names which register the experience holds.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Most apps are{" "}
          <span className="text-chrome-400">open</span> &mdash; free,
          no account. Some will be{" "}
          <span className="text-pink-200">rookery</span>-gated
          (subscription) or{" "}
          <span className="text-chrome-400 italic">purchase</span>-gated
          (one-time) when the Stripe wave lands.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; home
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            registry
          </Link>
          <Link
            href="/pipelines"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            pipelines
          </Link>
        </div>

        {tags.map((tag) => {
          const entries = all.filter((a) => a.tag === tag);
          return (
            <section key={tag} className="mt-16">
              <div className="chrome-label">{tag}</div>
              <h2 className="mt-3 text-2xl text-chrome-100">
                {entries.length} app{entries.length === 1 ? "" : "s"}
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {entries.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          );
        })}
      </article>
      <Footer />
    </>
  );
}
