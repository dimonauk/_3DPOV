"""
python-services/mesh_service.py — FastAPI wrapper around InstantMesh.

Wraps the TencentARC/InstantMesh CLI in a small HTTP service so the
site's `commerce.mesh-job` capability (and the studio's batch scripts)
can submit single-image-to-mesh jobs from anywhere on the local
network. v0.1: jobs are in-memory, one background worker thread, no
persistence.

InstantMesh ships under Apache-2.0 — clean for commercial use, no
revenue gate. This is the studio's print-bar-safe alternative to
Apple SHARP (whose `apple-amlr` licence is research-only).

Output: glTF Binary (`.glb`) with embedded textures. InstantMesh
itself writes a `.obj` + `.mtl` + texture PNGs; the wrapper
post-converts to `.glb` via `trimesh` so downstream consumers
(Three.js viewer, the print-bar's print-farm partner API) get a
single self-contained file.

Run: `uvicorn mesh_service:app --host 0.0.0.0 --port 7844`
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
TMP_ROOT = Path(os.environ.get("MESH_TMP_DIR", "tmp/mesh")).resolve()
INPUT_DIR = TMP_ROOT / "in"
OUTPUT_DIR = TMP_ROOT / "out"
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# InstantMesh ships a `python run.py` entry point. The user must clone the
# repo and `pip install -r requirements.txt` against it; this wrapper
# subprocesses `python run.py` from MESH_WORKING_DIR.
MESH_PYTHON = os.environ.get("MESH_PYTHON", "python")
MESH_WORKING_DIR = os.environ.get(
    "MESH_WORKING_DIR", "./InstantMesh"
)
# `instant-mesh-base.yaml` fits within 12 GB VRAM on a 3080 Ti.
# `instant-mesh-large.yaml` needs ~16 GB.
MESH_CONFIG = os.environ.get("MESH_CONFIG", "configs/instant-mesh-base.yaml")

DEFAULT_ORIGINS = "http://localhost:3000,https://holoflow.co.uk"
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("MESH_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]

# ---------- job model ----------


@dataclass
class Job:
    job_id: str
    image_path: Path
    output_dir: Path
    output_path: Path  # final canonical .glb
    output_format: str  # "glb" (currently only output we serve)
    meta: dict[str, Any]
    state: str = "queued"
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
            "submittedAt": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(job.submitted_at)
            ),
        }
    if job.state == "running":
        eta: Optional[float] = None
        if job.progress_pct > 1 and job.started_at is not None:
            elapsed = time.time() - job.started_at
            eta = max(
                0.0, (elapsed / job.progress_pct) * (100 - job.progress_pct)
            )
        return {
            "state": "running",
            "progressPct": round(job.progress_pct, 2),
            "etaSeconds": eta,
        }
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


# ---------- post-conversion (OBJ → GLB) ----------


def _find_obj(output_dir: Path) -> Optional[Path]:
    """Locate the .obj InstantMesh produced. The repo organises output
    under <output_dir>/instant-mesh-base/meshes/<basename>.obj (or
    similar; structure can vary across upstream versions). Walk the
    directory and pick the largest .obj."""
    candidates = sorted(
        output_dir.rglob("*.obj"),
        key=lambda p: p.stat().st_size,
        reverse=True,
    )
    return candidates[0] if candidates else None


def _obj_to_glb(obj_path: Path, glb_path: Path) -> bool:
    """Convert an .obj (with .mtl + texture sidecars) to a single .glb
    via trimesh. Returns True on success."""
    try:
        import trimesh  # imported lazily so service starts without it
    except ImportError as e:
        raise RuntimeError(
            f"trimesh not installed in the active env: {e}. "
            "Install via `pip install trimesh pillow` in the InstantMesh env."
        ) from e
    mesh = trimesh.load(obj_path, force="mesh", process=False)
    glb_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(glb_path, file_type="glb")
    return glb_path.exists() and glb_path.stat().st_size > 0


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


def _run_mesh(job: Job) -> None:
    job.started_at = time.time()
    job.state = "running"
    job.progress_pct = 1.0
    # InstantMesh CLI:
    #   python run.py configs/instant-mesh-base.yaml <image>.png \
    #       --export_texmap --output_path <out_dir>
    cmd = [
        MESH_PYTHON,
        "run.py",
        MESH_CONFIG,
        str(job.image_path),
        "--export_texmap",
        "--output_path",
        str(job.output_dir),
    ]
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=MESH_WORKING_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        while True:
            if job.state == "cancelled":
                _terminate(proc)
                return
            line = proc.stdout.readline() if proc.stdout else ""
            if line == "" and proc.poll() is not None:
                break
            if line:
                # Heuristic progress: bump on every stdout line, cap at 90 to
                # leave room for the OBJ→GLB post-convert step.
                job.progress_pct = min(90.0, job.progress_pct + 3.0)
        rc = proc.wait()
        if job.state == "cancelled":
            return
        if rc != 0:
            job.state = "error"
            job.error_message = (
                f"InstantMesh run.py exited with code {rc}. "
                f"Check that {MESH_WORKING_DIR} is the InstantMesh repo, "
                f"that {MESH_CONFIG} exists, and that the checkpoint set "
                "downloaded successfully."
            )
            job.error_code = "MESH_EXIT_NONZERO"
            return
        obj_path = _find_obj(job.output_dir)
        if obj_path is None:
            job.state = "error"
            job.error_message = (
                "InstantMesh exited 0 but no .obj found under "
                f"{job.output_dir}. Often: rembg failed on the input image. "
                "Re-try with a clean foreground/background separation."
            )
            job.error_code = "MESH_NO_OUTPUT"
            return
        # Post-convert OBJ → GLB so consumers get one self-contained file.
        try:
            ok = _obj_to_glb(obj_path, job.output_path)
        except Exception as e:
            job.state = "error"
            job.error_message = f"OBJ→GLB conversion failed: {e}"
            job.error_code = "GLB_CONVERT_FAILED"
            return
        if not ok:
            job.state = "error"
            job.error_message = "trimesh exported an empty .glb"
            job.error_code = "GLB_EMPTY"
            return
        job.size_bytes = job.output_path.stat().st_size
        job.progress_pct = 100.0
        job.state = "done"
    except FileNotFoundError as e:
        job.state = "error"
        job.error_message = (
            f"InstantMesh entry point not found ({e}). "
            "Clone https://github.com/TencentARC/InstantMesh and set "
            "MESH_WORKING_DIR to the repo path. Then "
            "`pip install -r requirements.txt` inside it."
        )
        job.error_code = "MESH_NOT_INSTALLED"
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
        _run_mesh(job)
        JOB_QUEUE.task_done()


threading.Thread(
    target=_worker_loop, name="mesh-worker", daemon=True
).start()

# ---------- FastAPI ----------

app = FastAPI(title="Mesh service (InstantMesh)", version=VERSION)
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
        "config": MESH_CONFIG,
        "working_dir": MESH_WORKING_DIR,
    }


@app.post("/jobs")
async def submit_job(
    image: UploadFile = File(...), meta: str = Form("{}")
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
    output_dir = OUTPUT_DIR / job_id
    output_path = OUTPUT_DIR / f"{job_id}.glb"
    with image_path.open("wb") as f:
        while True:
            chunk = await image.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    job = Job(
        job_id=job_id,
        image_path=image_path,
        output_dir=output_dir,
        output_path=output_path,
        output_format="glb",
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
        }
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
        raise HTTPException(
            status_code=409, detail=f"job is {job.state}, not done"
        )
    if not job.output_path.exists():
        raise HTTPException(
            status_code=410, detail="result file missing on disk"
        )
    return FileResponse(
        path=str(job.output_path),
        media_type="model/gltf-binary",
        filename=job.output_path.name,
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
