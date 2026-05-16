/**
 * app/api/comfy-layered/[...path]/route.ts — server-side proxy.
 *
 * Forwards browser calls from the Comfy Layered chamber to the ComfyUI
 * bench named by the `COMFYUI_URL` env var (default
 * `http://localhost:8188`). Keeps the env server-only so it doesn't
 * leak into the client bundle and sidesteps direct-from-browser CORS.
 *
 * The chamber's contract — `/api/chains`, `/api/chains/:id/params`,
 * `/api/presets`, `/api/generate`, `/api/jobs/:id` — is preserved
 * one-for-one; this route just rewrites `/api/comfy-layered/<rest>`
 * into `${COMFYUI_URL}/api/<rest>` and pipes the response back.
 *
 * If the bench is unreachable the chamber surfaces a "bench
 * unreachable" banner instead of crashing.
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api:comfy-layered.proxy");

const COMFY_BASE = (
  process.env["COMFYUI_URL"] ?? "http://localhost:8188"
).replace(/\/$/, "");

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(
  req: Request,
  ctx: RouteContext,
  method: string,
): Promise<Response> {
  const { path } = await ctx.params;
  const tail = (path ?? []).map(encodeURIComponent).join("/");
  const search = new URL(req.url).search;
  const target = `${COMFY_BASE}/api/${tail}${search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    body = await req.arrayBuffer();
  }

  try {
    const res = await fetch(target, { method, headers, body });
    const buf = await res.arrayBuffer();
    const out = new NextResponse(buf, { status: res.status });
    const ct = res.headers.get("content-type");
    if (ct) out.headers.set("content-type", ct);
    return out;
  } catch (err) {
    log.warn("bench unreachable", { target, method, err });
    return NextResponse.json(
      { error: "bench unreachable", target },
      { status: 502 },
    );
  }
}

export function GET(req: Request, ctx: RouteContext) {
  return forward(req, ctx, "GET");
}

export function POST(req: Request, ctx: RouteContext) {
  return forward(req, ctx, "POST");
}

export function PUT(req: Request, ctx: RouteContext) {
  return forward(req, ctx, "PUT");
}

export function DELETE(req: Request, ctx: RouteContext) {
  return forward(req, ctx, "DELETE");
}
