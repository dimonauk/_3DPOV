/**
 * app/splatter/jobs/page.tsx — recent jobs from the bench.
 */

"use client";

import { useEffect, useState } from "react";

import {
    BenchStatusBanner,
    useBenchInfo,
} from "components/splatter/BenchStatus";

interface Job {
  id: string;
  phase: string;
  progress: number;
  error: string | null;
  result: unknown;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const {
    info: benchInfo,
    error: benchError,
    loading: benchLoading,
  } = useBenchInfo();

  useEffect(() => {
    if (!benchInfo?.reachable) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/splatter/bench/api/jobs");
        if (!r.ok) throw new Error(`${r.status}`);
        const data = (await r.json()) as Job[];
        if (alive) {
          setJobs(data);
          setErr(null);
        }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      }
    };
    void tick();
    const id = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [benchInfo?.reachable]);

  return (
    <article className="mx-auto max-w-5xl px-6 py-20">
      <div className="chrome-label">Splatter · Jobs</div>
      <h1 className="mt-4 text-4xl">Recent jobs</h1>
      <p className="mt-3 max-w-2xl text-chrome-300">
        Live view of the bench sidecar&rsquo;s job queue.
      </p>

      <div className="mt-8">
        <BenchStatusBanner
          info={benchInfo}
          error={benchError}
          loading={benchLoading}
        />
      </div>

      {err && <div className="mt-4 text-sm text-red-400">bench: {err}</div>}

      <table className="mt-8 w-full overflow-hidden rounded-sm bg-warm-black-900/30">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-chrome-400">
            <th className="border-b border-warm-black-800 px-4 py-3">ID</th>
            <th className="border-b border-warm-black-800 px-4 py-3">Phase</th>
            <th className="border-b border-warm-black-800 px-4 py-3">
              Progress
            </th>
            <th className="border-b border-warm-black-800 px-4 py-3">Error</th>
          </tr>
        </thead>
        <tbody className="text-sm text-chrome-200">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-chrome-400">
                No jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((j) => (
              <tr key={j.id}>
                <td className="border-b border-warm-black-800 px-4 py-2">
                  <code className="text-chrome-100">{j.id}</code>
                </td>
                <td className="border-b border-warm-black-800 px-4 py-2">
                  {j.phase}
                </td>
                <td className="border-b border-warm-black-800 px-4 py-2">
                  {Math.round(j.progress * 100)}%
                </td>
                <td className="border-b border-warm-black-800 px-4 py-2 text-red-400">
                  {j.error ?? ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </article>
  );
}
