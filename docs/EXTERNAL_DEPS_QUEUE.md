# External-dep queue — what each blocked gap needs from the operator

Capabilities + features that are coded but inert until something
operator-side lands. Each entry names: the gap, the artefact in the
repo, what's needed externally, the env vars, and the success-check
that proves the gap closed.

## 1. ComfyUI workflows — `viz.generate-comfyui`

- **In repo**: [lib/capabilities/viz/generate-comfyui.ts](../lib/capabilities/viz/generate-comfyui.ts)
  + `.server.ts` + `.PURPOSE.md`. Five workflow IDs enumerated
  (Flux1 image, WAN T2V video, Hunyuan3D mesh, SDXL/Flux equirect 360).
  Server throws `service-unavailable` until both env vars are set AND
  workflow JSONs are present in `etc/comfyui-workflows/`.
- **Needs operator-side**:
  - ComfyUI running on the bench (`D:/The_Hangar/engines/comfyui/`,
    port 8188).
  - Tailscale Funnel exposing it at `https://comfyui.tail99b2a4.ts.net`
    (see `holoflow-bench-bridge` skill for the pattern — matches
    `sharp-onnx-bench`).
  - Workflow JSONs exported from ComfyUI for each of the five enums,
    committed under `etc/comfyui-workflows/{flux1-image,wan-t2v-video,
    hunyuan3d-mesh,sdxl-equirect-360,flux-equirect-360}.json`.
- **Env vars**: `COMFYUI_SERVICE_URL`, `COMFYUI_AUTH_TOKEN`.
- **Success check**: `POST /api/viz/generate-comfyui` with a Flux1
  workflow returns a Vercel Blob URL of the rendered PNG in < 60s.

## 2. Splat-360 — `viz.splat-generate-360`

- **In repo**: [lib/capabilities/viz/splat-generate-360.ts](../lib/capabilities/viz/splat-generate-360.ts)
  + `.server.ts` + `.PURPOSE.md`. Type surface locked; `hangar-360`
  provider stub awaits the splat360 alpha.
- **Needs operator-side**:
  - Splat360 service alpha-complete at
    `D:/The_Hangar/engines/splat360/` (port 8390). Pipeline stages
    (`camera_model`, `sfm`, `train`) must return a finished `.ply`.
  - Tailscale Funnel at `https://splat360.tail99b2a4.ts.net`.
- **Env vars**: `SPLAT360_SERVICE_URL`, `SPLAT360_AUTH_TOKEN`.
- **Success check**: submit a fisheye-pair from an Avata 360 capture,
  poll until done, get a Vercel-Blob-hosted `.ply` URL back.

## 3. HoloFlow Desktop helper — `viz.thumbnail-splat` (`splat-real`)

- **In repo**: [lib/capabilities/viz/thumbnail-splat.server.ts](../lib/capabilities/viz/thumbnail-splat.server.ts).
  Router now silently falls back to `card-fast` when `splat-real`
  raises `provider-unavailable` (commit `d27f083`). Canonical
  thumbnails still depend on the desktop helper.
- **Needs operator-side**:
  - A small Electron / Tauri app on the operator's workstation that
    spins up a headless Chromium, loads
    `https://holoflow.co.uk/holo-walk/{id}/embed`, screenshots the
    splat at a fixed camera, returns the PNG. Exposes the same
    Tailscale endpoint pattern at `/api/thumbnails/splat`.
- **Env vars**: re-uses the splat360 connection.
- **Success check**: thumbnails on the media library shelf for
  bench-rendered splats show real geometry, not the chrome poster.

## 4. Ollama bench wiring — `agent.dialogue-ollama`

- **In repo**: [lib/capabilities/agent/dialogue-ollama.ts](../lib/capabilities/agent/dialogue-ollama.ts)
  + `.server.ts` (both untracked). Third LLM provider next to Gemini +
  WebGPU.
- **Needs operator-side**:
  - Ollama running on the bench with `llama3.1:8b` + `qwen2.5:7b`
    pulled.
  - Tailscale Funnel exposing port 11434 at
    `https://ollama.tail99b2a4.ts.net`.
- **Env vars**: `OLLAMA_SERVICE_URL`, `OLLAMA_AUTH_TOKEN`,
  `OLLAMA_DEFAULT_MODEL`.
- **Success check**: Aura `/api/aura/chat` with provider=`ollama` in
  the request returns a streamed completion routed through Ollama.

## 5. Firestore vector index — `agent.memory-vector`

- **In repo**: [lib/capabilities/agent/memory-vector.ts](../lib/capabilities/agent/memory-vector.ts)
  + `.server.ts` + `.PURPOSE.md`. Embed-and-store via Gemini
  `text-embedding-004`, recall via Firestore `findNearest` cosine.
  Recall raises `vector-index-missing` with the exact gcloud command
  when the index isn't there.
- **Needs operator-side** (one-time per Firebase project):
  ```sh
  gcloud firestore indexes composite create \
    --collection-group=memory --query-scope=COLLECTION \
    --field-config=vector-config='{"dimension":"768","flat":"{}"}',field-path=embedding
  ```
- **Env vars**: re-uses `GOOGLE_AI_API_KEY` (already in `.env.example`)
  + Firebase Admin creds (already wired).
- **Success check**: a Firestore Functions Studio query against
  `users/{uid}/memory` returns documents with `embedding` as a
  `VectorValue`; the gcloud `indexes list` command shows the composite
  vector index as `STATE_READY`.

## 6. Stripe gate wiring — full Rookery tier enforcement

- **In repo**: see [docs/STRIPE_GATING.md](./STRIPE_GATING.md) for the
  full audit. Tier definitions, per-app gate metadata, pricing-status
  flags all present; SDK + checkout + webhook + subscription hook +
  gate components all missing.
- **Needs operator-side**:
  - Stripe account, products created for the three tiers (Perch
    recurring £6/mo, Nest recurring £12/mo, Fledge one-time £75),
    Price IDs in hand.
  - Webhook endpoint registered pointing at production
    `/api/rookery/webhook`.
- **Env vars**: see `STRIPE_GATING.md` and the matching block in
  `.env.example`.
- **Success check**: end-to-end purchase of a Fledge tier triggers
  the webhook, writes `users/{uid}.subscription` in Firestore, and
  `<RookeryGate>` unlocks the protected surface for that uid.

## 7. Rookery delayed-email cron

- **In repo**: [app/api/rookery/onboarding/route.ts](../app/api/rookery/onboarding/route.ts).
  Welcome email sends synchronously on signup. Day-3 and Day-7 sends
  declared in [lib/rookery/emails.ts](../lib/rookery/emails.ts) but
  not scheduled.
- **Needs operator-side**:
  - Add cron entries to `vercel.json`:
    ```json
    {
      "crons": [
        { "path": "/api/rookery/cron/day-3", "schedule": "0 9 * * *" },
        { "path": "/api/rookery/cron/day-7", "schedule": "0 9 * * *" }
      ]
    }
    ```
  - Create the two cron route handlers; each queries
    `subscribers` collection where `welcomeSentAt < (today − N days)`
    and sends the corresponding template via Resend.
- **Env vars**: `CRON_SECRET` (verifies Vercel-cron call signature),
  re-uses `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`.
- **Success check**: a test subscriber created 3 days ago receives
  the day-3 email at 09:00 UTC the next morning.

## 8. iOS USDZ files — for any product with the `3d` tag

- **In repo**: viewer wired (commit `8063177`), URL resolved via
  metafield `custom.model_3d_usdz` or convention `/models/{handle}.usdz`.
- **Needs operator-side**:
  - For each product with `tag: 3d`, upload the USDZ alongside the
    existing GLB (either as a `custom.model_3d_usdz` File metafield in
    Shopify admin, or into `public/models/` / the CDN under the same
    basename as the GLB).
  - Recommendation: produce USDZ from the GLB via Reality Composer or
    the open-source `usd-from-gltf` (`apple/USD` repo's `usd_from_gltf`
    converter) so geometry/materials match the GLB exactly.
- **Env vars**: none (re-uses `NEXT_PUBLIC_MODEL_BASE_URL`).
- **Success check**: load a 3D-tagged product page on iOS Safari, the
  "View in AR" pill appears top-right of the 3D view, tapping it
  launches Apple AR Quick Look with the model placeable in the room.

## 9. Articles registry split — remaining 41 entries

- **In repo**: see [docs/ARTICLES_REGISTRY_SPLIT.md](./ARTICLES_REGISTRY_SPLIT.md).
  Pattern proven (commit `7a971f9`) with `on-editioning-photographs`.
- **Needs**: a writing session (or several) to migrate the remaining
  41 entry files to the colocated `entry` named export. Largely
  mechanical but should be done in 5-10-entry commits with the trunk
  pieces last.
- **Env vars**: none.
- **Success check**: `lib/articles.tsx` < 100 lines; every file in
  `components/articles/entries/*.tsx` exports an `entry`; `pnpm test`
  + `pnpm test:e2e` clean.

## 10. Curriculum gaps — 6 new articles + 7 edits

- **In repo**: see [docs/BACKWARDS_DESIGN.md](./BACKWARDS_DESIGN.md)
  for the audit. The /play game's 12 levels need certain concepts
  buried in writing before each level can land as proof rather than
  puzzle. Highest priority: "The Practice in Eight Threads" (Aura
  voice, ~1200 words, sits on /about as a section) — closes the Full
  Weave level.
- **Needs**: writing sessions (Dimona + Aura voices per the matrix in
  the audit doc). Voice authority chain documented in the
  `holoflow-voice` skill.
- **Env vars**: none.
- **Success check**: each of the 12 /play levels has prose backing per
  the per-level prerequisite analysis in the doc.

---

## Cross-cutting notes

- **Tailscale bench bridge** (gaps 1, 2, 3, 4): all four bench services
  follow the same pattern documented in the `holoflow-bench-bridge`
  skill. The auth model is a shared bearer token in
  `<service>_AUTH_TOKEN` plus Tailscale Funnel restricting which clients
  can reach the upstream. When wiring a new bench service, replicate
  this rather than inventing a new auth pattern.

- **Capability registry** (every gap above): each capability already
  has its triplet (`<verb>.ts` + `<verb>.server.ts` +
  `<verb>.PURPOSE.md`) and is registered with the appropriate `status`.
  As gaps close, flip `status: "stub"` → `status: "registered"` in
  [lib/capabilities/index.ts](../lib/capabilities/index.ts) and the
  `/capabilities` browse route reflects the change automatically.
