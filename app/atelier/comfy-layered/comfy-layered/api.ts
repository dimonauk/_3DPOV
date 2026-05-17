/**
 * app/atelier/comfy-layered/comfy-layered/api.ts — Thin fetch
 * wrapper for the same-origin ComfyUI proxy at /api/comfy-layered/*.
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md Rule 1.
 * Keeps the bench host server-only — the browser never sees the
 * COMFYUI_URL env value because every call goes through this proxy.
 */

export const PROXY_BASE = "/api/comfy-layered";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // path comes in as "/chains", "/jobs/abc", etc. — strip the leading
  // "/api" the original Vite wiring carried.
  const trimmed = path.replace(/^\/api/, "");
  const res = await fetch(`${PROXY_BASE}${trimmed}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.slice(0, 200) || `http ${res.status}`);
  }
  return res.json() as Promise<T>;
}
