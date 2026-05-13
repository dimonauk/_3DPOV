# SHARP service &mdash; the runbook

A small FastAPI wrapper around Apple SHARP, sitting on the studio's
3080 Ti machine. The site's `commerce.sharp-job` TypeScript capability
talks to this service over the studio's local network; jobs come in as
images, come out as gaussian-splat `.ply` files. The service is the
seam between the public site and the studio's GPU.

## Why this exists

The browser-side depth-estimation path (`viz.depth-estimation`) is the
freebie &mdash; lower quality, but it runs on the visitor's own machine
and costs the studio nothing. SHARP is the editioned-quality version:
the file the studio sells as a numbered piece. SHARP requires a GPU
the visitor does not have, so the work happens on the bench and the
site posts the image up. This file is the operator-side documentation
for the bench end.

The pipeline itself is documented in `docs/SHARP_PIPELINE.md`. This
runbook covers how to start, stop, and configure the service that
wraps it.

## Prerequisites

The service is `sharp_service.py` &mdash; one file, FastAPI + uvicorn,
no other Python deps beyond the SHARP install you already have for
`docs/SHARP_PIPELINE.md`.

Python 3.12 is canonical for the studio (3.14 is too new for PyTorch
wheels as of 2026). Install the three packages the wrapper needs:

```sh
C:/Users/dimon/AppData/Local/Programs/Python/Python312/python.exe ^
  -m pip install fastapi uvicorn python-multipart
```

SHARP itself must already be installed and runnable as
`python -m sharp.infer ...` from the working directory the service
points at &mdash; see `docs/SHARP_PIPELINE.md` for that setup.

## Environment variables

The service reads the following at startup:

| Variable | Default | What it controls |
| --- | --- | --- |
| `SHARP_TMP_DIR` | `tmp/sharp` | Where uploaded images and rendered `.ply` files land. Relative paths resolve from the working directory. |
| `SHARP_PYTHON` | `python` | The Python binary used to call SHARP. Point this at the venv interpreter if the venv is not active. |
| `SHARP_MODULE` | `sharp.infer` | The `-m` argument to SHARP. Override if the upstream module path changes. |
| `SHARP_CHECKPOINT` | `./checkpoints/sharp-base.pt` | Path to the SHARP weights (downloaded via `huggingface-cli` per the pipeline doc). |
| `SHARP_WORKING_DIR` | `.` | Working directory for the SHARP subprocess. Typically the `ml-sharp` repo root. |
| `SHARP_CORS_ORIGINS` | `http://localhost:3000,https://holoflow.co.uk` | Comma-separated list of origins allowed to POST jobs. |

The TS client reads `SHARP_SERVICE_URL` (default `http://localhost:7842`)
&mdash; that lives in the site's `lib/env.ts`, not here.

## Starting the service

```sh
# From the python-services/ directory:
cd D:\.github\_3DPOV\python-services

# Activate the SHARP venv first (so SHARP itself is importable):
D:\path\to\ml-sharp\.venv\Scripts\activate

# Then start the wrapper:
uvicorn sharp_service:app --host 0.0.0.0 --port 7842
```

The service binds `0.0.0.0:7842` so the studio's other machines on the
local network (and the development laptop running the site) can reach
it. The `--reload` flag is fine in development; omit it for production.

## Stopping the service

Ctrl-C in the terminal. In-flight jobs receive a Windows
`CTRL_BREAK_EVENT` and a 5-second grace period before SIGKILL. No
state is persisted &mdash; on restart, the in-memory job dictionary
resets. The `tmp/sharp/in/` and `tmp/sharp/out/` directories survive
the restart and can be cleared by hand when the bench gets full.

## Cross-origin from holoflow.co.uk

The TS client lives on `https://holoflow.co.uk` (and `localhost:3000`
in development). Both origins are in the default `SHARP_CORS_ORIGINS`
list and the FastAPI `CORSMiddleware` is wired to allow `GET`, `POST`,
`DELETE`, and `OPTIONS` from them. The browser preflight succeeds; the
multipart POST follows; no proxy is needed.

The service does not implement authentication in v0.1. It binds on a
private interface inside the studio's network and is not exposed to
the public internet. When a public-facing edition workflow lands, an
HMAC header (or a Tailscale-fronted ingress) goes here first.

## systemd / start-stop story

This service is a Windows-side process for now; the canonical launcher
will be a small `start_sharp_service.bat` that activates the venv and
runs uvicorn. The Hangar's `BOOT_UNIFIED.ps1` layer-3 (`api_services`)
is the eventual home, alongside Ollama and ComfyUI. Until then, start
it by hand &mdash; the service is one terminal window.

On Linux (when the bench moves), the equivalent is a tiny systemd unit:

```ini
[Unit]
Description=SHARP service
After=network.target

[Service]
ExecStart=/path/to/venv/bin/uvicorn sharp_service:app --host 0.0.0.0 --port 7842
WorkingDirectory=/path/to/python-services
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

- **`sharp executable not found`** &mdash; the wrapper could not run
  `python -m sharp.infer`. Activate the SHARP venv, or set
  `SHARP_PYTHON` to the venv's interpreter.
- **`sharp exited 0 but no output file`** &mdash; SHARP ran but did
  not write to the expected path. Check `SHARP_CHECKPOINT` and the
  pipeline doc's notes on minimum input resolution (~1024 long edge).
- **Browser fetches fail with a CORS error** &mdash; the origin is
  not in `SHARP_CORS_ORIGINS`. Add it and restart.
- **`positionInQueue` is wrong** &mdash; the wrapper maintains job
  order by insertion into `JOBS`; cancelled jobs stay in the dict so
  the count includes them as terminal-state slots. This is fine for
  the v0.1 single-worker shape.

When the service is down, the site catches the typed
`SharpServiceUnreachableError` from `commerce.sharp-job` and falls back
to the free in-browser depth-estimation path. The visitor sees a small
inline note: "premium conversion needs the studio's GPU &mdash; using
the free in-browser version instead." Nothing breaks.
