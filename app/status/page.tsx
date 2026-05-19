/**
 * app/status/page.tsx — public health page.
 *
 * Surface for the bench services + key dependencies. Pings each in
 * parallel from the server side, renders the result as a table.
 * No auth — visitors and operators alike can check whether Aura's
 * voice is alive, whether the print bureau can quote, etc.
 *
 * Stub: lists every service we KNOW about; some return "unknown"
 * until their health endpoints land. Refreshes on every request
 * (no cache).
 */

import Link from "next/link";

import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status — Holo-Flow Studio",
  description:
    "Live status of the studio's services — Aura's voice, the print bureau, the bench bridges.",
};

const log = createLogger("status.page");

type ServiceCheck = {
  id: string;
  label: string;
  category: "site" | "bench" | "third-party" | "data";
  status: "ok" | "degraded" | "down" | "unknown" | "not-configured";
  detail: string;
};

async function probe(
  id: string,
  label: string,
  category: ServiceCheck["category"],
  url: string,
  authHeader?: string,
): Promise<ServiceCheck> {
  if (!url) {
    return { id, label, category, status: "not-configured", detail: "URL env not set" };
  }
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: authHeader ? { Authorization: authHeader } : undefined,
      // Short timeout — the page should render quickly even when one
      // upstream is unreachable.
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (res.ok) return { id, label, category, status: "ok", detail: `${res.status}` };
    if (res.status === 401)
      return {
        id,
        label,
        category,
        status: "degraded",
        detail: "401 — auth required, reachable",
      };
    return {
      id,
      label,
      category,
      status: "degraded",
      detail: `${res.status}`,
    };
  } catch (err) {
    log.warn("probe failed", { id, err: String(err) });
    return { id, label, category, status: "down", detail: "unreachable" };
  }
}

async function collectChecks(): Promise<ServiceCheck[]> {
  const sharpUrl = process.env.SHARP_ONNX_SERVICE_URL;
  const sharpToken = process.env.SHARP_ONNX_AUTH_TOKEN;
  const ollamaUrl = process.env.OLLAMA_SERVICE_URL;
  const comfyuiUrl = process.env.COMFYUI_SERVICE_URL;
  const splat360Url = process.env.SPLAT360_SERVICE_URL;

  const checks = await Promise.all([
    probe("site", "Holo-Flow site", "site", "https://holoflow.co.uk/api/healthz"),
    probe(
      "sharp-onnx",
      "SHARP-ONNX (splat generation)",
      "bench",
      sharpUrl ? `${sharpUrl}/health` : "",
      sharpToken ? `Bearer ${sharpToken}` : undefined,
    ),
    probe(
      "ollama",
      "Ollama (local LLM)",
      "bench",
      ollamaUrl ? `${ollamaUrl}/health` : "",
      process.env.OLLAMA_AUTH_TOKEN ? `Bearer ${process.env.OLLAMA_AUTH_TOKEN}` : undefined,
    ),
    probe(
      "comfyui",
      "ComfyUI (image/video/3D generation)",
      "bench",
      comfyuiUrl ? `${comfyuiUrl}/` : "",
    ),
    probe(
      "splat360",
      "splat360 (360-camera → splat)",
      "bench",
      splat360Url ? `${splat360Url}/health` : "",
    ),
  ]);
  return checks;
}

function statusClass(status: ServiceCheck["status"]): string {
  if (status === "ok") return "border-emerald-500/60 text-emerald-300";
  if (status === "degraded") return "border-amber-400/60 text-amber-200";
  if (status === "down") return "border-rose-400/60 text-rose-200";
  if (status === "not-configured") return "border-warm-black-700 text-chrome-500";
  return "border-warm-black-700 text-chrome-400";
}

export default async function StatusPage() {
  const checks = await collectChecks();
  const byCategory = checks.reduce<Record<string, ServiceCheck[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  const categoryOrder: Array<ServiceCheck["category"]> = [
    "site",
    "bench",
    "third-party",
    "data",
  ];

  const categoryLabel: Record<ServiceCheck["category"], string> = {
    site: "Site",
    bench: "Bench (Sovereign-PC services)",
    "third-party": "Third-party APIs",
    data: "Data stores",
  };

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">Status</span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Service health
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Live probe of the studio&rsquo;s services and dependencies.
            Refreshes on every page load. Probes time out after 3
            seconds.
          </p>
          <p className="text-xs text-chrome-500">
            Last checked:{" "}
            <span className="text-chrome-300">
              {new Date().toLocaleString("en-GB")}
            </span>
          </p>
        </header>

        {categoryOrder.map((cat) => {
          const group = byCategory[cat] ?? [];
          if (group.length === 0) return null;
          return (
            <section key={cat} className="flex flex-col gap-3">
              <h2 className="chrome-label text-chrome-300">
                {categoryLabel[cat]}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-baseline gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 px-4 py-3 text-sm"
                  >
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusClass(
                        c.status,
                      )}`}
                    >
                      {c.status}
                    </span>
                    <span className="text-chrome-100">{c.label}</span>
                    <span className="ml-auto text-xs text-chrome-400">
                      {c.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <footer className="flex justify-between border-t border-warm-black-700 pt-4 text-xs text-chrome-500">
          <Link href="/" className="hover:text-pink-200">
            ← Studio
          </Link>
          <span>Refresh the page to re-check</span>
        </footer>
      </div>
    </main>
  );
}
