# Sieve VLM service — runbook

A FastAPI service that answers a single question for every Holo-Flow
drop:

> Given this genome's rendered still + its parentage chain, does this
> piece meet Holo-Flow Studio's aesthetic + safety bar?

Per Manifesto §07 the Sieve is one of the bench-side judges in the
four-stage loop (Genesis → Bake → Audit → Fitness). The website's
[`lib/drops/sieve-gate.ts`](../lib/drops/sieve-gate.ts) is the
consumer; this service is what answers those calls.

## Run

```bash
cd python-services
uvicorn sieve_service:app --host 0.0.0.0 --port 7848
```

Pick a token (the website needs the exact same string in its env):

```bash
export SIEVE_BEARER_TOKEN=$(openssl rand -hex 32)
```

Optional env:

| Var | Default | Notes |
| --- | --- | --- |
| `SIEVE_SERVICE_PORT` | `7848` | One above `loop_orchestrator`'s 7846. |
| `SIEVE_BEARER_TOKEN` | _unset_ | If unset, runs in dev-permissive mode (matches `loop_orchestrator.py`). `/health` reports `auth_configured: false`. |
| `SIEVE_ALLOWED_ORIGINS` | `*` | CSV. |
| `SIEVE_VLM_PROVIDER` | `aperture` | `aperture` / `anthropic` / `local-llava`. |
| `SIEVE_VLM_MODEL` | `google/gemini-2.5-flash` | Routed through the chosen provider. |
| `SIEVE_PROMPT_FILE` | `prompts/sieve.txt` | Resolved relative to `python-services/` when not absolute. |
| `SIEVE_VERDICT_LOG_ENABLED` | `1` | Set `0` to disable on-disk audit log. |
| `SIEVE_VERDICT_LOG_DIR` | `tmp/sieve_verdicts` | One sub-dir per `genomeId`; one JSON file per judgement. |

## Endpoints

### `GET /health`

No auth. Returns:

```json
{ "ok": true, "version": "0.1.0", "auth_configured": true }
```

### `POST /v1/sieve`

Bearer auth required when `SIEVE_BEARER_TOKEN` is set.

Request:

```json
{ "genomeId": "gen-abc123", "bakedStillUrl": "https://..." }
```

`bakedStillUrl` is optional today — when the real VLM lands, an
omitted URL will trigger a lookup by `genomeId` from the canonical
store (Firestore-equivalent; the lookup is a TODO until the store is
decided).

Response (the wire shape `lib/drops/sieve-gate.ts` expects):

```json
{ "pass": true, "summary": "stub-verdict-pending-vlm-wiring" }
```

Or on a fail:

```json
{ "pass": false, "summary": "off-brand AI-slurry texture on left flank", "reason": "aesthetic-door-failed" }
```

`summary` is the human-readable one-liner the site surfaces. `reason`
is optional and only set when there's an internal code path the
operator should see (e.g. `provider-error-fallback`).

## Stub vs real

v0.1 is a stub: `run_vlm` returns
`{ pass: True, summary: "stub-verdict-pending-vlm-wiring" }` for any
genome, logs the request to stderr, and writes a verdict JSON to
`SIEVE_VERDICT_LOG_DIR`. This is enough for the website's sieve-gate
fail-open path to be exercised end-to-end.

When ready to wire the real VLM, edit `run_vlm` in `sieve_service.py`
(the TODO block names the steps):

1. Fetch the baked still from `bakedStillUrl`, or look up the URL by
   `genomeId` once the canonical store is decided.
2. Build the multimodal request from `load_prompt()` + the still
   image + the parentage-chain summary (add the chain to
   `SieveRequest` when v0.2 lands).
3. POST to the configured provider:
   - **aperture** — `https://ai.tail99b2a4.ts.net/v1/chat/completions`,
     `X-Provider-Override` + `X-Model-Override` headers per the
     Aperture gateway convention. Use `APERTURE_API_KEY`.
   - **anthropic** — Anthropic Messages API with `ANTHROPIC_API_KEY`.
   - **local-llava** — POST to a local Ollama / llama.cpp server.
4. Parse the JSON response. The prompt at `prompts/sieve.txt` enforces
   the exact shape, so parsing is `json.loads(content)`.
5. Return `Verdict(...)` with `provider` + `model` filled from env.
6. On any provider error, log + return a fail-closed `Verdict` with
   `note="provider-error-fallback"` so the site sees the cause.

The `Verdict` dataclass already carries `provider`, `model`,
`baked_still_url`, `judged_at`, and `note`, so the on-disk audit log
captures everything needed to re-grade a drop after the fact.

## Expose to the website

Same pattern as the SHARP / Loop services — host-level
`tailscale serve` or the docker sidecar at `D:\Tools\tailscale-sharp`.

Host-level (simplest):

```powershell
tailscale serve --bg --https=443 --set-path=/sieve http://localhost:7848
```

Docker sidecar variant: copy the `tailscale-sharp` template, point its
upstream at `host.docker.internal:7848`, and tag the resulting
hostname (e.g. `sieve.tail99b2a4.ts.net`) per the
`hangar-tailscale-https` skill.

On the website side, set:

- `SIEVE_SERVICE_URL=https://chonky.tail99b2a4.ts.net/sieve`
- `SIEVE_BEARER_TOKEN=<the openssl rand -hex 32 value>`

These are read by `lib/drops/sieve-gate.ts`. In non-prod the site
fail-opens with sentinel `sieve-wiring-pending` if either is unset;
in prod it fail-closes. So: set both before promoting a build to
production.

## Smoke tests

Health (no auth):

```bash
curl -sS http://localhost:7848/health | jq
```

Stub verdict (with token):

```bash
curl -sS -X POST http://localhost:7848/v1/sieve \
  -H "Authorization: Bearer $SIEVE_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"genomeId":"gen-smoketest","bakedStillUrl":"https://example.com/still.png"}' \
  | jq
```

Expected:

```json
{ "pass": true, "summary": "stub-verdict-pending-vlm-wiring" }
```

Verify the audit log landed:

```bash
ls tmp/sieve_verdicts/gen-smoketest/
```

Bad-token check (should be `401 bad bearer`):

```bash
curl -sS -X POST http://localhost:7848/v1/sieve \
  -H "Authorization: Bearer not-the-token" \
  -H "Content-Type: application/json" \
  -d '{"genomeId":"gen-x"}'
```

End-to-end against the deployed site (once Tailscale serve is up and
the website env is set), trigger a drop through the admin form and
check that the recorded reason is the stub summary rather than
`sieve-wiring-pending`.

## See also

- [`lib/drops/sieve-gate.ts`](../lib/drops/sieve-gate.ts) — the
  website-side consumer; defines the wire contract this service
  implements.
- [`python-services/loop_orchestrator.py`](./loop_orchestrator.py) —
  the four-stage pipeline; its Audit stage will call this service
  once the stub is swapped for the real VLM.
- [`python-services/LOOP_ORCHESTRATOR.md`](./LOOP_ORCHESTRATOR.md) —
  sibling runbook; same Tailscale Funnel pattern.
- `prompts/sieve.txt` — the fixed aesthetic + safety prompt.
- Manifesto §07 — canonical description of the four-stage loop and
  the Sieve's role in it.
