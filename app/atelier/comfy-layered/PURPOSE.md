# app/atelier/comfy-layered — PURPOSE

## What this is

The studio's browser UI for queueing ComfyUI jobs with named prompt
layers. A regular ComfyUI prompt is a single blob of text; here the
prompt is composed from a chain of named layers — basic concepts,
relationships, rendering strategy, optimisation — each with its own
typed parameters. The operator picks a chain, dials each layer's
controls, presses **Run workflow**. The chamber posts a job to the
ComfyUI backend, polls until it lands, and shows the rendered image
with a download button.

This is a bench / studio surface, not a public-visitor capability.
It assumes the operator can reach a ComfyUI service directly from
their browser.

## Origin

Ported from the Vite + React 18 app at
`D:/The_Hangar/apps/comfy-layered-ai-ui/` (which served the same UI
on its own dev server). The port collapses to two files
(`page.tsx` + `comfy-layered-client.tsx`) and uses the Holoflow site
chrome / state / logger conventions instead of the Vite-era
free-standing styling.

What got dropped on the port:

- the **archive gallery** sidebar — that's the site's job through
  `lib/state/atelier-hooks` and the `<RecentOutputsDrawer>`, not a
  per-chamber concern.
- the **Sphere 360 viewer** (CSS + the commented-out three.js
  variant) — out of scope for a queueing UI; if the operator needs
  to inspect a panorama, the dedicated panorama chambers do it
  better.
- **lucide-react** icons — the site doesn't ship that dep; inline
  SVG and unicode glyphs serve the same role without an install.

What stayed: the layered-params model, the chain selector, presets,
workflow-kind switch, the seed / steps / cfg / model / dimensions
settings, the run / cancel / poll loop, preview-frame display.

## Backend contract

The browser talks to a server-side proxy at
`/api/comfy-layered/*`, which forwards to the ComfyUI bench at the
host named by the `COMFYUI_URL` env var (default
`http://localhost:8188` — the Hangar's local ComfyUI bench). The
bench must expose:

```text
GET    /api/chains                    -> { chains: ChainConfig[] }
GET    /api/chains/:id/params         -> Record<string, LayerParameter>
GET    /api/presets                   -> { presets: Preset[] }
POST   /api/generate                  -> { jobId }
GET    /api/jobs/:id                  -> JobStatus
DELETE /api/jobs/:id                  -> { cancelled }
```

If the proxy can't reach the bench it returns `502 { error: "bench
unreachable" }`; the chamber surfaces a banner and keeps the controls
editable so the operator can still build a request — just can't
submit it.

The Hangar's vanilla ComfyUI at `localhost:8188` does **not** speak
this contract out of the box; the Vite source app was paired with a
small backend shim (`apps/comfy-layered-ai-ui/dolly-app.json`
references the orchestrator) that maps the layered request onto
ComfyUI workflow JSON. The chamber is wire-compatible with that
shim; deploying both together is the documented setup. For a
direct-to-stock-ComfyUI variant, see
`lib/capabilities/viz/generate-comfyui.server.ts` (different shape,
single-blob prompts, the studio's main production path).

## Env

| var            | default                 | role                                                                                                       |
| -------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `COMFYUI_URL`  | `http://localhost:8188` | host the server-side proxy at `/api/comfy-layered/*` forwards to. server-only — does not enter the bundle. |

The server-side `COMFYUI_SERVICE_URL` + `COMFYUI_AUTH_TOKEN`
elsewhere in the codebase belong to the production capability layer
(Vercel → tailnet bench via Funnel) and are not used by this chamber.
This chamber is a developer / bench surface; production work should
go through the server-side capability.

## Voice

Terse, lowercase, mechanical body copy; sentence-case headings.
Plain-English action labels:

- "Run workflow" (not "Generate")
- "Cancel queue" (not "Stop job")
- "Add layer" / "Layered parameters" (not "Layer config")
- "bench unreachable" (not "API offline")

Follows the Holoflow voice library.
