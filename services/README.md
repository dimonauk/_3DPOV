# services/ — Holoflow Studio bench services

Bench-side services that the Vercel-hosted site dispatches to over
Tailscale Funnel. Each service runs on the studio bench (or any
operator's GPU host); the **contract** lives here so it travels with
the Vercel site source.

This is the unified home. Previously these lived under
`D:/The_Hangar/engines/*` and `D:/The_Hangar/tools/*` on the bench;
they've been migrated here so the contract sides (Vercel-side
capability stub + bench-side FastAPI route) live next to each other.
The bench still RUNS the service; only the source moved.

## Migration criterion

A capability belongs in `services/` if it satisfies **all three**:

1. **Web-runnable** — invokable over HTTP from a Vercel function. Async
   job queues are fine. Anything that needs a desktop GUI (Blender,
   DJI Studio, etc.) stays bench-only.
2. **Small enough to ship as source** — under ~100 MB excluding model
   weights and venvs (those are gitignored anyway). No ComfyUI installs.
3. **Has a matching `lib/capabilities/*` contract** on the Vercel side
   — or one is coming. If the site never talks to it, it doesn't belong
   here.

GPU-bound services (gsplat training, 4D-GS, SHARP inference) still need
to run on the studio bench (or an operator-hosted equivalent) — but
their source lives here so the Vercel-side contract docstrings can
point at a path in the same repo.

## What's here

| Service | Contract on Vercel side | Status |
| --- | --- | --- |
| [`splat360/`](./splat360/) | `viz.splat-generate-360` + `hangar-gsplat` provider | Foundation phase; pipeline stages stubbed |
| [`sharp-onnx/`](./sharp-onnx/) | `viz.splat-generate` `sharp-onnx` provider | Live; running the CCTV-to-3D batch |
| [`mesh-to-sdf/`](./mesh-to-sdf/) | (Vercel side TBD — small Python, could run as a Vercel Function) | Operational bench tool |
| [`lithophane/`](./lithophane/) | (Vercel side TBD — pairs with print-bar) | Operational bench tool |

## Migration backlog

See [`MIGRATION_BACKLOG.md`](./MIGRATION_BACKLOG.md) for the full
catalogue of bench services that satisfy the criterion above but
haven't been pulled in yet. 25+ candidates inventoried by an
exhaustive walk of `D:/The_Hangar/` on 2026-05-16.

## What's not migrating

These stay on the bench because they don't satisfy the criterion above:

- **ComfyUI engine + workflows** — too heavy for source-ship; lives on
  bench at `D:/The_Hangar/engines/comfyui/`.
- **Blender pipelines** — desktop-only.
- **Dolly_OS** — separate Vite app, not a bench service.
- **Local MCP servers** — bench-only interactive tools.

## Running a service locally

Each subdirectory has its own `pyproject.toml` / `package.json` /
`README.md`. The site's `lib/capabilities/*` server-side modules read
the service URL from env (e.g. `SPLAT_VIDEO_SERVICE_URL`,
`SHARP_ONNX_SERVICE_URL`) — point that at `http://localhost:<port>` for
bench-local dev or at the Tailscale Funnel hostname
(`*.tail99b2a4.ts.net`) for cross-network reach.

See the `holoflow-bench-bridge` skill for the Funnel + bearer-token
pattern.

## White-label posture

These services ship as part of Holoflow Studio. "Hangar"-specific
references in the original bench sources have been replaced with
generic terms ("the bench", "the studio") so the source reads cleanly
to a public audience. Local paths like `D:/The_Hangar/...` in code
comments have been updated to relative paths within this repo.
