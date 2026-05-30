/**
 * app/api/splatter/bench/[...path]/route.ts — bench passthrough.
 *
 * Any path under /api/splatter/bench/* is forwarded to the desktop
 * sidecar (via Tailscale Funnel). Lets browser code call:
 *
 *   POST /api/splatter/bench/api/preflight   -> bench /api/preflight
 *   POST /api/splatter/bench/api/coverage    -> bench /api/coverage
 *   GET  /api/splatter/bench/api/jobs        -> bench /api/jobs
 *
 * Returns 503 if the bench env vars aren't set.
 */

import { NextResponse } from "next/server";

const BASE = process.env.SPLATTER_BENCH_URL ?? "";
const TOKEN = process.env.SPLATTER_BENCH_TOKEN ?? "";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function forward(
  req: Request,
  params: { path?: string[] },
): Promise<Response> {
  if (!BASE) {
    return NextResponse.json(
      { error: "Splatter bench not configured (SPLATTER_BENCH_URL)." },
      { status: 503 },
    );
  }
  const sub = (params.path ?? []).join("/");
  const search = new URL(req.url).search;
  const url = `${BASE}/${sub}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  if (TOKEN) headers.set("authorization", `Bearer ${TOKEN}`);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const res = await fetch(url, init);
    const body = await res.arrayBuffer();
    return new Response(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "bench unreachable", detail: String(err) },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forward(req, await ctx.params);
}
export async function POST(req: Request, ctx: Ctx) {
  return forward(req, await ctx.params);
}
export async function PUT(req: Request, ctx: Ctx) {
  return forward(req, await ctx.params);
}
export async function DELETE(req: Request, ctx: Ctx) {
  return forward(req, await ctx.params);
}
