"use client";

import { useEffect, useState } from "react";

import type { BenchInfo } from "lib/splatter/types";

export function useBenchInfo() {
  const [info, setInfo] = useState<BenchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/splatter/scout");
        if (!r.ok) {
          throw new Error(`bench status ${r.status}`);
        }
        const data = (await r.json()) as BenchInfo;
        if (alive) {
          setInfo(data);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return {
    info,
    error,
    loading: info === null && error === null,
  };
}

export function BenchStatusBanner({
  info,
  error,
  loading,
}: {
  info: BenchInfo | null;
  error: string | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 text-sm text-chrome-300">
      {loading ? (
        <div>Checking bench connectivity…</div>
      ) : error ? (
        <div className="text-red-400">Bench status error: {error}</div>
      ) : info ? (
        <div className="space-y-2">
          <div>
            Bench:{" "}
            <span
              className={info.reachable ? "text-emerald-400" : "text-amber-400"}
            >
              {info.reachable ? "reachable" : "offline"}
            </span>
          </div>
          <div className="text-chrome-400">
            URL:{" "}
            <code className="text-chrome-200">
              {info.base_url ?? "not configured"}
            </code>
          </div>
          <div className="text-chrome-400">
            Version:{" "}
            <code className="text-chrome-200">{info.version ?? "—"}</code>
          </div>
        </div>
      ) : null}
    </div>
  );
}
