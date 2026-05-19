# HoloFlow_Loop_Orchestrator — service runbook

A FastAPI service that drives the four-stage genome pipeline:

```
Genesis  →  Bake  →  Audit  →  Fitness
```

Each new genome the studio publishes runs this loop. Stages are
in-process today (one worker thread, in-memory job state); subsequent
versions will fan out to Blender on Swift (Bake), the Sieve VLM
endpoint (Audit), and the fitness scorer in `fitness.py`.

## Run

```bash
cd python-services
uvicorn loop_orchestrator:app --host 0.0.0.0 --port 7846
```

Pick a token:

```bash
export LOOP_ORCHESTRATOR_TOKEN=$(openssl rand -hex 32)
```

Optional env:
- `LOOP_ORCHESTRATOR_PORT` (default 7846)
- `LOOP_ORCHESTRATOR_ALLOWED_ORIGINS` (CSV; default `*`)

## Endpoints

All require `Authorization: Bearer ${LOOP_ORCHESTRATOR_TOKEN}` when the
token is set; without a token, dev mode permits anonymous calls.

### `GET /health`

No auth. Returns version + auth-configured flag + in-flight job count.

### `POST /jobs`

Body: `{ "seed": int (0..2^31-1), "kingdom": <one of 8 kingdom names> }`.

Returns `{ "id": "...", "stage": "queued" }`. The worker thread picks
the job up immediately and walks it through Genesis → Bake → Audit →
Fitness. On Audit failure the job stops at `failed` with
`reason: audit_rejected`.

### `GET /jobs/{job_id}`

Returns the full job record (stage, genome, baked URLs, audit verdict,
fitness vector, history of stage transitions).

### `GET /jobs?limit=N`

List recent jobs, newest first. `limit` clamped to 1..500.

## Expose to the website

Same pattern as the SHARP service:

```powershell
tailscale serve --bg --https=443 --set-path=/loop http://localhost:7846
```

Or via the docker sidecar template at `D:\Tools\tailscale-sharp`.

On the website side, set:
- `LOOP_ORCHESTRATOR_URL=https://chonky.tail99b2a4.ts.net/loop`
- `LOOP_ORCHESTRATOR_BEARER_TOKEN=<the openssl rand -hex 32 value>`

## Wiring downstream services

Each stage worker today is a stub. The TODOs in `loop_orchestrator.py`
name the real call:

- **Bake** — POST to `blender-mcp` on Swift
  (`http://swift.tail99b2a4.ts.net:7847/render`) with the genome JSON;
  receive `still_url` + `stl_url`.
- **Audit** — POST to `SIEVE_SERVICE_URL/v1/sieve` (same endpoint the
  site's `sieve-gate` calls).
- **Fitness** — call `fitness.py:score(genome, baked_still_path)` in
  the same process.

## State persistence (v0.2)

In-memory `JOBS: dict[str, Job]` is fine for one operator at one drop
per week. When the cadence rises, swap for SQLite at
`tmp/loop-jobs.sqlite` — schema:

```sql
CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    stage TEXT NOT NULL,
    seed INTEGER NOT NULL,
    kingdom TEXT NOT NULL,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    genome_json TEXT,
    baked_still_url TEXT,
    baked_stl_url TEXT,
    audit_summary TEXT,
    audit_pass INTEGER,
    fitness_vector_json TEXT,
    error TEXT,
    history_json TEXT NOT NULL
);
```

## See also

- `python-services/genome.py` — Genesis-stage genome sampler
- `python-services/fitness.py` — Fitness-stage scorer
- `lib/drops/sieve-gate.ts` — site-side Sieve consumer; same protocol
  the orchestrator's Audit stage uses
- `lib/drops/oracle-gate.ts` — Printability gate; runs against the
  baked still URL the orchestrator populates
- Manifesto §07 — full canonical description of the four-stage loop
