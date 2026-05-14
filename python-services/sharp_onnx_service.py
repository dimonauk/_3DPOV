"""
python-services/sharp_onnx_service.py — FastAPI wrapper for SHARP-ONNX.

The ONNX-backed sibling of `sharp_service.py`. Same job-shaped HTTP
surface (POST /jobs, GET /jobs/{id}, GET /jobs/{id}/result, DELETE
/jobs/{id}) so the site's `viz.splat-generate` capability can swap
back-ends transparently. Differences from the PyTorch-CLI service:

  - In-process inference via onnxruntime; no subprocess.
  - InferenceSession loaded once at startup, reused across jobs (~3s
    cold-load → ~10s per frame on RTX 3080 Ti with CUDA EP).
  - Session is recreated on `CUDA failure` (error 700) so one bad job
    doesn't poison the rest of the queue.
  - Each job returns TWO files: the raw SHARP `.ply` (superset format,
    SHARP-specific trailing elements) and a `_std.ply` that's been
    stripped to the standard INRIA-3DGS layout for web renderers
    (sparkjsdev/spark, @mkkellogg/gaussian-splats-3d).

Run: `uvicorn sharp_onnx_service:app --host 0.0.0.0 --port 7845`

License posture: the underlying SHARP model is apple-amlr —
research-only. Outputs from this service must not reach commerce
surfaces; the `viz.splat-generate` provider tags every record
`research-only` so the commerce filter excludes them automatically.
"""

from __future__ import annotations

import json
import os
import queue
import sys
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse


def _add_nvidia_dll_paths() -> list[str]:
    """Stitch CUDA toolkit + pip nvidia-* DLL dirs into the Windows DLL
    search path before importing onnxruntime. Mirrors the loader in
    `D:/The_Hangar/engines/sharp-onnx/batch_cctv.py`."""
    added: list[str] = []
    if os.name != "nt":
        return added
    system_candidates = [
        Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.8/bin"),
        Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6/bin"),
        Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.4/bin"),
    ]
    for cuda_bin in system_candidates:
        if cuda_bin.is_dir() and (cuda_bin / "cublasLt64_12.dll").is_file():
            os.add_dll_directory(str(cuda_bin))
            os.environ["PATH"] = str(cuda_bin) + os.pathsep + os.environ.get("PATH", "")
            added.append(str(cuda_bin))
            break
    try:
        import importlib

        nvidia_pkg = importlib.import_module("nvidia")
        for ns_root_str in nvidia_pkg.__path__:
            ns_root = Path(ns_root_str)
            for entry in ns_root.iterdir():
                for candidate in (entry / "bin", entry):
                    if candidate.is_dir() and any(candidate.glob("*.dll")):
                        os.add_dll_directory(str(candidate))
                        os.environ["PATH"] = (
                            str(candidate) + os.pathsep + os.environ.get("PATH", "")
                        )
                        added.append(str(candidate))
                        break
    except (ImportError, FileNotFoundError, OSError):
        pass
    return added


_NVIDIA_DLL_DIRS = _add_nvidia_dll_paths()
import onnxruntime as ort  # noqa: E402

# Import inference + converter helpers from the bench engine.
_ENGINE_DIR = Path(
    os.environ.get(
        "SHARP_ONNX_ENGINE_DIR",
        "D:/The_Hangar/engines/sharp-onnx",
    ),
).resolve()
if not _ENGINE_DIR.is_dir():
    raise RuntimeError(
        f"engine dir not found: {_ENGINE_DIR}. Set SHARP_ONNX_ENGINE_DIR if "
        "the bench engine lives elsewhere.",
    )
sys.path.insert(0, str(_ENGINE_DIR))
from inference_onnx import preprocess_image, export_ply  # noqa: E402
from convert_sharp_ply import convert as convert_sharp_to_std  # noqa: E402

# ---------- config ----------

VERSION = "0.1.0"
DEFAULT_PORT = 7845

TMP_ROOT = Path(os.environ.get("SHARP_ONNX_TMP_DIR", "tmp/sharp-onnx")).resolve()
INPUT_DIR = TMP_ROOT / "in"
OUTPUT_DIR = TMP_ROOT / "out"
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = Path(
    os.environ.get("SHARP_ONNX_MODEL", str(_ENGINE_DIR / "sharp_fp16.onnx")),
).resolve()
if not MODEL_PATH.is_file():
    raise RuntimeError(
        f"ONNX model not found: {MODEL_PATH}. Set SHARP_ONNX_MODEL if the "
        "model lives elsewhere; download from pearsonkyle/Sharp-onnx on HF.",
    )

DEFAULT_ORIGINS = "http://localhost:3000,https://holoflow.co.uk"
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("SHARP_ONNX_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]

# Required bearer token. The service runs over Tailscale Funnel —
# i.e. publicly reachable on the internet (with TLS) — so this token
# is the actual gate. Set in env on the bench AND mirrored to Vercel
# project env as SHARP_ONNX_AUTH_TOKEN. Empty means no auth (only
# safe when AllowFunnel is false in serve-config.json).
SHARP_ONNX_AUTH_TOKEN = os.environ.get("SHARP_ONNX_AUTH_TOKEN", "").strip()

# ---------- job model ----------


@dataclass
class Job:
    job_id: str
    image_path: Path
    raw_ply_path: Path
    std_ply_path: Path
    meta: dict[str, Any]
    state: str = "queued"  # queued | running | done | error | cancelled
    submitted_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    progress_pct: float = 0.0
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    raw_bytes: int = 0
    std_bytes: int = 0
    gaussian_count: int = 0


JOBS: dict[str, Job] = {}
JOB_QUEUE: "queue.Queue[str]" = queue.Queue()
JOBS_LOCK = threading.Lock()


def _queue_depth() -> int:
    with JOBS_LOCK:
        return sum(1 for j in JOBS.values() if j.state == "queued")


def _position_in_queue(job_id: str) -> int:
    with JOBS_LOCK:
        pos = 0
        for j in JOBS.values():
            if j.job_id == job_id:
                return pos
            if j.state == "queued":
                pos += 1
        return 0


def _serialise(job: Job) -> dict[str, Any]:
    if job.state == "queued":
        return {
            "state": "queued",
            "positionInQueue": _position_in_queue(job.job_id),
            "submittedAt": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(job.submitted_at),
            ),
        }
    if job.state == "running":
        eta: Optional[float] = None
        if job.progress_pct > 1 and job.started_at is not None:
            elapsed = time.time() - job.started_at
            eta = max(0.0, (elapsed / job.progress_pct) * (100 - job.progress_pct))
        return {"state": "running", "progressPct": round(job.progress_pct, 2), "etaSeconds": eta}
    if job.state == "done":
        duration = (job.finished_at or 0) - (job.started_at or job.submitted_at)
        return {
            "state": "done",
            "resultUrl": f"/jobs/{job.job_id}/result",
            "stdResultUrl": f"/jobs/{job.job_id}/result/std",
            "gaussianCount": job.gaussian_count,
            "rawBytes": job.raw_bytes,
            "stdBytes": job.std_bytes,
            "durationSeconds": round(duration, 2),
            "licence": "research-only",
        }
    if job.state == "cancelled":
        return {"state": "cancelled"}
    return {
        "state": "error",
        "message": job.error_message or "unknown error",
        "code": job.error_code or "UNKNOWN",
    }


# ---------- inference session ----------


def _make_session() -> ort.InferenceSession:
    """Build a single InferenceSession with the best available provider."""
    available = ort.get_available_providers()
    preferred: list[str] = []
    if "CUDAExecutionProvider" in available:
        preferred.append("CUDAExecutionProvider")
    if "DmlExecutionProvider" in available:
        preferred.append("DmlExecutionProvider")
    preferred.append("CPUExecutionProvider")
    opts = ort.SessionOptions()
    opts.log_severity_level = 3
    return ort.InferenceSession(str(MODEL_PATH), opts, providers=preferred)


_session: ort.InferenceSession = _make_session()
_session_lock = threading.Lock()


def _unpack_outputs(raw_outputs: list[np.ndarray]) -> dict[str, np.ndarray]:
    names = [
        "mean_vectors_3d_positions",
        "singular_values_scales",
        "quaternions_rotations",
        "colors_rgb_linear",
        "opacities_alpha_channel",
    ]
    outputs: dict[str, np.ndarray] = {}
    if len(raw_outputs) == 1:
        concat = raw_outputs[0]
        sizes = [3, 3, 4, 3, 1]
        start = 0
        for name, size in zip(names, sizes):
            outputs[name] = concat[:, :, start : start + size]
            start += size
    elif len(raw_outputs) == 5:
        for name, out in zip(names, raw_outputs):
            outputs[name] = out
    return outputs


# ---------- worker ----------


def _run_inference(job: Job) -> None:
    global _session
    job.started_at = time.time()
    job.state = "running"
    job.progress_pct = 5.0
    try:
        image, focal_length_px, image_shape = preprocess_image(job.image_path)
        job.progress_pct = 20.0
        inputs = {
            "image": image.astype(np.float32),
            "disparity_factor": np.array(
                [job.meta.get("disparityFactor", 1.0)], dtype=np.float32,
            ),
        }
        with _session_lock:
            try:
                raw = _session.run(None, inputs)
            except Exception as run_err:
                err_str = str(run_err)
                if "CUDA failure" in err_str or "illegal memory access" in err_str:
                    # Session is poisoned; recreate before re-raising.
                    try:
                        _session = _make_session()
                    except Exception:
                        pass
                raise
        job.progress_pct = 70.0
        outputs = _unpack_outputs(raw)
        export_ply(
            outputs,
            job.raw_ply_path,
            focal_length_px,
            image_shape,
            float(job.meta.get("decimate", 1.0)),
            float(job.meta.get("depthScale", 1.0)),
        )
        job.progress_pct = 85.0
        n_verts, raw_bytes, std_bytes = convert_sharp_to_std(
            job.raw_ply_path, job.std_ply_path,
        )
        job.gaussian_count = n_verts
        job.raw_bytes = raw_bytes
        job.std_bytes = std_bytes
        job.progress_pct = 100.0
        job.state = "done"
    except Exception as err:
        job.state = "error"
        job.error_message = str(err)
        job.error_code = (
            "CUDA_CONTEXT_CORRUPTED"
            if "CUDA failure" in str(err) or "illegal memory access" in str(err)
            else "INFERENCE_FAILED"
        )
    finally:
        job.finished_at = time.time()


def _worker_loop() -> None:
    while True:
        job_id = JOB_QUEUE.get()
        with JOBS_LOCK:
            job = JOBS.get(job_id)
        if job is None or job.state == "cancelled":
            JOB_QUEUE.task_done()
            continue
        _run_inference(job)
        JOB_QUEUE.task_done()


threading.Thread(target=_worker_loop, name="sharp-onnx-worker", daemon=True).start()


# ---------- FastAPI ----------

app = FastAPI(title="SHARP-ONNX service", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Endpoints that bypass the bearer-token check (liveness probes, etc).
_AUTH_BYPASS_PATHS = frozenset({"/health"})


@app.middleware("http")
async def _require_bearer_token(request: Request, call_next):
    """Reject every request without a valid `Authorization: Bearer <token>`
    header when `SHARP_ONNX_AUTH_TOKEN` is set in env. Bypass for /health
    so Tailscale + uptime probes don't need credentials.

    When the token is unset (empty string), enforcement is OFF — fine
    for bench-local development but never run that way over Funnel.
    """
    if not SHARP_ONNX_AUTH_TOKEN:
        return await call_next(request)
    if request.url.path in _AUTH_BYPASS_PATHS:
        return await call_next(request)
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        return JSONResponse(
            {"error": "missing Authorization: Bearer <token>"},
            status_code=401,
        )
    presented = header[7:].strip()
    if presented != SHARP_ONNX_AUTH_TOKEN:
        return JSONResponse({"error": "invalid bearer token"}, status_code=401)
    return await call_next(request)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": VERSION,
        "queue_depth": _queue_depth(),
        "providers": _session.get_providers(),
        "model": MODEL_PATH.name,
        "nvidia_dll_dirs": len(_NVIDIA_DLL_DIRS),
    }


@app.post("/jobs")
async def submit_job(
    image: UploadFile = File(...),
    meta: str = Form("{}"),
) -> JSONResponse:
    try:
        parsed_meta = json.loads(meta) if meta else {}
        if not isinstance(parsed_meta, dict):
            raise ValueError("meta must be a JSON object")
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"invalid meta JSON: {e}")
    job_id = str(uuid.uuid4())
    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in (".png", ".jpg", ".jpeg", ".webp"):
        suffix = ".png"
    image_path = INPUT_DIR / f"{job_id}{suffix}"
    raw_ply_path = OUTPUT_DIR / f"{job_id}.ply"
    std_ply_path = OUTPUT_DIR / f"{job_id}_std.ply"
    with image_path.open("wb") as f:
        while True:
            chunk = await image.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    job = Job(
        job_id=job_id,
        image_path=image_path,
        raw_ply_path=raw_ply_path,
        std_ply_path=std_ply_path,
        meta=parsed_meta,
    )
    with JOBS_LOCK:
        JOBS[job_id] = job
    JOB_QUEUE.put(job_id)
    return JSONResponse(
        {
            "jobId": job_id,
            "state": "queued",
            "positionInQueue": _position_in_queue(job_id),
            "licence": "research-only",
        },
    )


@app.get("/jobs/{job_id}")
def get_job(job_id: str) -> dict[str, Any]:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"job {job_id} not found")
    return _serialise(job)


@app.get("/jobs/{job_id}/result")
def get_job_result(job_id: str) -> FileResponse:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"job {job_id} not found")
    if job.state != "done":
        raise HTTPException(status_code=409, detail=f"job is {job.state}, not done")
    if not job.raw_ply_path.exists():
        raise HTTPException(status_code=410, detail="raw .ply missing on disk")
    return FileResponse(
        path=str(job.raw_ply_path),
        media_type="application/octet-stream",
        filename=job.raw_ply_path.name,
    )


@app.get("/jobs/{job_id}/result/std")
def get_job_result_std(job_id: str) -> FileResponse:
    """The standard-3DGS-format PLY — what web renderers actually want."""
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"job {job_id} not found")
    if job.state != "done":
        raise HTTPException(status_code=409, detail=f"job is {job.state}, not done")
    if not job.std_ply_path.exists():
        raise HTTPException(status_code=410, detail="std .ply missing on disk")
    return FileResponse(
        path=str(job.std_ply_path),
        media_type="application/octet-stream",
        filename=job.std_ply_path.name,
    )


@app.delete("/jobs/{job_id}")
def cancel_job(job_id: str) -> dict[str, Any]:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"job {job_id} not found")
    if job.state in ("done", "error", "cancelled"):
        return {"state": job.state}
    job.state = "cancelled"
    return {"state": "cancelled"}
