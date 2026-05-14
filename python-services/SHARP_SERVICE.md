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
plus Apple's `ml-sharp` installed alongside.

**Apple SHARP** lives at [apple/ml-sharp](https://github.com/apple/ml-sharp).
As of Dec 2025 it installs a `sharp` console script and is invoked as:

```sh
sharp predict -i <input_image_or_dir> -o <output_dir> [-c <checkpoint>]
```

Output is one or more `.ply` Gaussian-splat files in `<output_dir>`.

**License note:** the weights on Hugging Face (`apple/Sharp`) carry
Apple's `apple-amlr` (AI/ML Research) license &mdash; research and
sample-code use, **not commercial**. The studio&rsquo;s SHARP
commission path needs legal review before paid customer-facing use.
For internal experimentation and the CCTV pipeline the licence is
fine.

### Install

The README ships a canonical setup:

```sh
conda create -n sharp python=3.13
conda activate sharp
git clone https://github.com/apple/ml-sharp
cd ml-sharp
pip install -r requirements.txt
pip install -e .
```

Or the zero-clone path:

```sh
uvx --from=git+https://github.com/apple/ml-sharp sharp predict -i image.png -o ./out
```

Then the FastAPI wrapper&rsquo;s own deps:

```sh
pip install fastapi uvicorn python-multipart
```

### Checkpoint

The default checkpoint `sharp_2572gikvuh.pt` auto-downloads from the
Apple CDN to `~/.cache/torch/hub/checkpoints/` on first run
(~hundreds of MB). To pre-stage and avoid the cold-start download:

```sh
huggingface-cli download --include sharp_2572gikvuh.pt --local-dir . apple/Sharp
```

Then point `SHARP_CHECKPOINT` env var at the file path.

## Environment variables

The service reads the following at startup:

| Variable | Default | What it controls |
| --- | --- | --- |
| `SHARP_TMP_DIR` | `tmp/sharp` | Where uploaded images and rendered `.ply` files land. Relative paths resolve from the working directory. |
| `SHARP_BIN` | `sharp` | The `apple/ml-sharp` console script. Override if the binary isn&rsquo;t on `PATH` (e.g. absolute path to a venv&rsquo;s `bin/sharp`). |
| `SHARP_CHECKPOINT` | _(empty &mdash; auto-download)_ | Optional explicit path to `sharp_2572gikvuh.pt`. When unset, SHARP auto-downloads the checkpoint from the Apple CDN to `~/.cache/torch/hub/checkpoints/` on first run. |
| `SHARP_WORKING_DIR` | `.` | Working directory for the SHARP subprocess. Typically the `ml-sharp` repo root, or anywhere when invoking via `uvx`. |
| `SHARP_CORS_ORIGINS` | `http://localhost:3000,https://holoflow.co.uk` | Comma-separated list of origins allowed to POST jobs. |

The TS client reads `SHARP_SERVICE_URL` (default `http://localhost:7842`)
&mdash; that lives in the site's `lib/env.ts`, not here.

## Starting the service

```sh
# From the python-services/ directory:
cd D:\.github\_3DPOV\python-services

# Activate the conda env (or venv) that has both apple/ml-sharp + the
# wrapper's FastAPI deps installed (per Prerequisites above):
conda activate sharp
# or: D:\path\to\.venv\Scripts\Activate.ps1

# Confirm the SHARP CLI is on PATH:
sharp --help

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

- **`sharp executable not found`** &mdash; the `sharp` console script
  isn&rsquo;t on `PATH` in the active env. Activate the conda env / venv
  where `apple/ml-sharp` is installed, or set `SHARP_BIN` to the
  absolute path of the `sharp` binary.
- **`sharp exited 0 but no .ply found in output dir`** &mdash; SHARP
  ran but didn&rsquo;t write a splat. Most often: the checkpoint
  download was interrupted (`sharp_2572gikvuh.pt` truncated). Delete
  `~/.cache/torch/hub/checkpoints/sharp_2572gikvuh.pt` and re-run, or
  pre-stage with `huggingface-cli` and point `SHARP_CHECKPOINT` at
  the file. Also check the input image is readable + non-zero size.
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
