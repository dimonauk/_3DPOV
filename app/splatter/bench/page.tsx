/**
 * app/splatter/bench/page.tsx — bench status + setup instructions.
 */

import { benchInfo } from "lib/splatter/bench-client";

export const dynamic = "force-dynamic";

export default async function BenchPage() {
  const info = await benchInfo();
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <div className="chrome-label">Splatter · Bench</div>
      <h1 className="mt-4 text-4xl">Bench status</h1>
      <p className="mt-3 max-w-2xl text-chrome-300">
        Heavy operations (SfM, training) run on a desktop sidecar — the
        Holoflow site proxies to it via Tailscale Funnel. Browser-only
        features (Scout, Viewer) work without it.
      </p>

      <section
        className={`mt-8 flex items-center gap-4 rounded-sm border-l-4 bg-warm-black-900/30 p-5 ${
          info.reachable ? "border-l-emerald-400" : "border-l-amber-400"
        }`}
      >
        <div
          className={`h-3 w-3 rounded-full ${
            info.reachable ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        <div>
          <h2 className="text-base text-chrome-100">
            {info.reachable ? "Bench reachable" : "Bench offline"}
          </h2>
          <div className="mt-1 text-xs text-chrome-400">
            URL: <code className="text-chrome-200">{info.base_url ?? "not configured"}</code>
            <br />
            Version: <code className="text-chrome-200">{info.version ?? "—"}</code>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base text-chrome-100">Wire it up</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-chrome-200">
          <li>
            Run the bundled sidecar on a machine reachable over Tailscale:
            <pre className="mt-2 overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-2 text-xs">
              splatter-sidecar --host 0.0.0.0 --port 8127 --announce-json
            </pre>
          </li>
          <li>
            Expose it via Tailscale Funnel (per the{" "}
            <code className="text-chrome-100">holoflow-bench-bridge</code> pattern):
            <pre className="mt-2 overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-2 text-xs">
              tailscale funnel --bg --https=443 8127
            </pre>
          </li>
          <li>
            Set the website env vars:
            <pre className="mt-2 overflow-auto rounded-sm border border-warm-black-800 bg-warm-black-950 p-2 text-xs">
{`SPLATTER_BENCH_URL=https://splatter.tail99b2a4.ts.net
SPLATTER_BENCH_TOKEN=<shared bearer>`}
            </pre>
          </li>
          <li>Reload this page — the dot should turn green.</li>
        </ol>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-base text-chrome-100">Needs the bench</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-chrome-300">
            <li>Pre-flight scorecard (OpenCV)</li>
            <li>Coverage globe (COLMAP sparse)</li>
            <li>AR export</li>
            <li>Jobs list / queue</li>
            <li>AI Scout&rsquo;s deep pass</li>
          </ul>
        </div>
        <div>
          <h2 className="text-base text-chrome-100">Works without it</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-chrome-300">
            <li>AI Scout (metadata + LLM enrichment)</li>
            <li>WebXR splat viewer</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
