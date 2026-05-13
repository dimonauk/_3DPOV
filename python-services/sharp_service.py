"""
python-services/sharp_service.py — FastAPI wrapper around Apple SHARP.

Wraps the SHARP CLI (`python -m sharp.infer ...`, see docs/SHARP_PIPELINE.md)
in a small HTTP service so the site's `commerce.sharp-job` TypeScript
capability can submit jobs from the studio's local network. v0.1: jobs are
in-memory, one background worker thread, no persistence.

Run: `uvicorn sharp_service:app --host 0.0.0.0 --port 7842`
"""

from __future__ import annotations

import json
import os
import queue
import shutil
import signal
import subprocess
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

# ---------- config ----------

VERSION = "0.1.0"
TMP_ROOT = Path(os.environ.get("SHARP_TMP_DIR", "tmp/sharp")).resolve()
INPUT_DIR = TMP_ROOT / "in"
OUTPUT_DIR = TMP_ROOT / "out"
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SHARP_PYTHON = os.environ.get("SHARP_PYTHON", "python")
SHARP_MODULE = os.environ.get("SHARP_MODULE", "sharp.infer")
SHARP_CHECKPOINT = os.environ.get("SHARP_CHECKPOINT", "./checkpoints/sharp-base.pt")
SHARP_WORKING_DIR = os.environ.get("SHARP_WORKING_DIR", ".")

DEFAULT_ORIGINS = "http://localhost:3000,https://holoflow.co.uk"
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("SHARP_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]

# ---------- job model ----------


@dataclass
class Job:
    job_id: str
    image_path: Path
    output_path: Path
    output_format: str  # "ply" or "spz"
    meta: dict[str, Any]
    state: str = "queued"  # queued | running | done | error | cancelled
    submitted_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    progress_pct: float = 0.0
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    size_bytes: int = 0


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
            "submittedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(job.submitted_at)),
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
            "format": job.output_format,
            "sizeBytes": job.size_bytes,
            "durationSeconds": round(duration, 2),
        }
    if job.state == "cancelled":
        return {"state": "cancelled"}
    return {
        "state": "error",
        "message": job.error_message or "unknown error",
        "code": job.error_code or "UNKNOWN",
    }


# ---------- worker ----------


def _gpu_available() -> bool:
    return shutil.which("nvidia-smi") is not None


def _terminate(proc: subprocess.Popen[str]) -> None:
    try:
        if os.name == "nt":
            proc.send_signal(signal.CTRL_BREAK_EVENT)  # type: ignore[attr-defined]
        else:
            proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    except Exception:
        pass


def _run_sharp(job: Job) -> None:
    job.started_at = time.time()
    job.state = "running"
    job.progress_pct = 1.0
    cmd = [
        SHARP_PYTHON, "-m", SHARP_MODULE,
        "--image", str(job.image_path),
        "--output", str(job.output_path),
        "--checkpoint", SHARP_CHECKPOINT,
    ]
    try:
        proc = subprocess.Popen(
            cmd, cwd=SHARP_WORKING_DIR,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        )
        while True:
            if job.state == "cancelled":
                _terminate(proc)
                return
            line = proc.stdout.readline() if proc.stdout else ""
            if line == "" and proc.poll() is not None:
                break
            if line:
                # Heuristic progress: bump on every stdout line, cap at 95.
                job.progress_pct = min(95.0, job.progress_pct + 2.5)
        rc = proc.wait()
        if job.state == "cancelled":
            return
        if rc != 0:
            job.state = "error"
            job.error_message = f"sharp exited with code {rc}"
            job.error_code = "SHARP_EXIT_NONZERO"
            return
        if not job.output_path.exists():
            job.state = "error"
            job.error_message = "sharp exited 0 but no output file"
            job.error_code = "SHARP_NO_OUTPUT"
            return
        job.size_bytes = job.output_path.stat().st_size
        job.progress_pct = 100.0
        job.state = "done"
    except FileNotFoundError as e:
        job.state = "error"
        job.error_message = f"sharp executable not found: {e}"
        job.error_code = "SHARP_NOT_INSTALLED"
    except Exception as e:  # pragma: no cover
        job.state = "error"
        job.error_message = f"worker crash: {e}"
        job.error_code = "WORKER_CRASH"
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
        _run_sharp(job)
        JOB_QUEUE.task_done()


threading.Thread(target=_worker_loop, name="sharp-worker", daemon=True).start()

# ---------- FastAPI ----------

app = FastAPI(title="SHARP service", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": VERSION,
        "queue_depth": _queue_depth(),
        "gpu_available": _gpu_available(),
    }


@app.post("/jobs")
async def submit_job(image: UploadFile = File(...), meta: str = Form("{}")) -> JSONResponse:
    try:
        parsed_meta = json.loads(meta) if meta else {}
        if not isinstance(parsed_meta, dict):
            raise ValueError("meta must be a JSON object")
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"invalid meta JSON: {e}")
    output_format = parsed_meta.get("outputFormat") or "ply"
    if output_format not in ("ply", "spz"):
        raise HTTPException(status_code=400, detail="outputFormat must be ply or spz")
    job_id = str(uuid.uuid4())
    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in (".png", ".jpg", ".jpeg", ".webp"):
        suffix = ".png"
    image_path = INPUT_DIR / f"{job_id}{suffix}"
    output_path = OUTPUT_DIR / f"{job_id}.{output_format}"
    with image_path.open("wb") as f:
        while True:
            chunk = await image.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    job = Job(job_id=job_id, image_path=image_path, output_path=output_path,
              output_format=output_format, meta=parsed_meta)
    with JOBS_LOCK:
        JOBS[job_id] = job
    JOB_QUEUE.put(job_id)
    return JSONResponse(
        {"jobId": job_id, "state": "queued", "positionInQueue": _position_in_queue(job_id)}
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
    if not job.output_path.exists():
        raise HTTPException(status_code=410, detail="result file missing on disk")
    media = "model/spz" if job.output_format == "spz" else "application/octet-stream"
    return FileResponse(path=str(job.output_path), media_type=media, filename=job.output_path.name)


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
