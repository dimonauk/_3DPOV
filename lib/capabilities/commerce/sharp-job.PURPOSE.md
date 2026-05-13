# `sharp-job.ts` — purpose twin (capability `commerce.sharp-job`)

## Role

The studio's premium 2D-to-3D path, as a typed REST client. Submits a
single source image to the SHARP service running on the studio's 3080 Ti
machine, returns a handle the calling page can poll, cancel, or wait on
through to a finished `.ply` (or `.spz`). Pairs with the free in-browser
depth-estimation path; this one is the editioned-quality version that
ships behind a paywall.

## Public surface

- `submitSharpJob(input)` — async; returns a `SharpJobHandle` once the
  service has acknowledged the job and assigned an ID.
- `rehydrateJob(jobId)` — pure; reconstructs a handle from a stored ID
  after a page reload or session swap.
- `isSharpServiceAvailable()` — probe `/health`; returns `{ available,
  version?, reason? }`. Never throws.
- `SharpServiceUnreachableError` — typed error the UI translates to the
  "premium conversion needs the studio's GPU — using the free in-browser
  version instead" copy.
- Types: `SharpJobInput`, `SharpJobStatus`, `SharpJobHandle`.

## Internal

- `resolveBaseUrl()` — `envOrUndefined("SHARP_SERVICE_URL")` then
  documented default `http://localhost:7842`. Local-first: the env helper
  is `envOrUndefined`, not `envOrThrow`, so the absence of the var on a
  deployed Vercel build does not crash — it just means the fetch will fail
  with a typed `SharpServiceUnreachableError` the UI handles.
- `pollJob` / `cancelJob` / `waitForCompletion` — the three closures the
  handle captures. Each lives at module scope so `rehydrateJob` can hand
  them out without state.
- `narrowStatus` + the `pickNumber` / `pickString` helpers — narrow the
  service's JSON response into the discriminated `SharpJobStatus` union.
  Defensive: unknown states map to `state: "error"` so the UI always has
  a terminal frame to render.

## Depends on

- `lib/env` — `envOrUndefined("SHARP_SERVICE_URL")` for the service URL.
- The browser `fetch` + `FormData` + `Blob` APIs.
- The FastAPI service at `python-services/sharp_service.py` — the
  contract on the other end of the wire.

## Does not

- **Does not write to a state slice.** Job lifecycle is page-local —
  whichever page submits the job owns the handle, polls at its own
  cadence, and renders the status. There is no `commerce` slice yet; if
  the studio later needs cross-route job lists, that slice gets added and
  this capability gets a thin overload that writes through it.
- **Does not stream the result.** `done.resultUrl` is the URL the page
  hands to whatever splat renderer it uses (`splat-renderer` or
  `<model-viewer>` with the future spz path). This capability does not
  fetch the file itself.
- **Does not install npm packages.** The TS side ships with no new
  dependencies — `fetch` and `FormData` are platform.
- **Does not run on the server.** All calls are client-side; SHARP lives
  on the studio's local network. A Vercel build that cannot reach the
  studio gets `SharpServiceUnreachableError` and the UI degrades to the
  free path.

## Bordering files

- `python-services/sharp_service.py` — the FastAPI wrapper this client
  talks to. Their JSON shapes are paired; change one, change the other.
- `python-services/SHARP_SERVICE.md` — operator notes for the 3080 Ti
  machine (start, stop, env, pip line).
- `docs/SHARP_PIPELINE.md` — the canonical pipeline doc the service
  automates.
- `docs/LOCAL_SERVICES.md` — service-map entry for port 7842, degraded
  mode language, capability link.
- `lib/capabilities/viz/depth-estimation.ts` (future) — the free
  in-browser path the UI swaps to when this one is unreachable.
- `lib/capabilities/index.ts` — registration site for
  `commerce.sharp-job` (the user registers this serially after the new
  `commerce` `CapabilityKind` lands).

## How the studio voice flows through this file

The TS layer is silent — error messages are plain and pointed at the
operator (`sharp-job: service unreachable — ECONNREFUSED`). The page
that catches `SharpServiceUnreachableError` is where the voice lives:
"premium conversion needs the studio's GPU — using the free in-browser
version instead." The capability stays a thin REST client; copy is the
caller's job.
