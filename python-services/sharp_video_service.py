"""
python-services/sharp_video_service.py — FastAPI wrapper around the
SHARP+4DGaussians video pipeline.

Wraps the multi-step 2D-video-to-4D pipeline used by the studio's
3080 Ti: ffmpeg-decodes the input video, runs the SHARP single-image
CLI per keyframe, fits the resulting splats with the 4DGaussians
temporal model, and stitches a stereo MP4 alongside the .4dgs bundle.

v0.1: jobs are in-memory, one background worker thread, no persistence.
Long-running by design — minutes per few-second clip. Cancellation is
honoured between frames.

Run: `uvicorn sharp_video_service:app --host 0.0.0.0 --port 7843`
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
TMP_ROOT = Path(os.environ.get("SHARP_VIDEO_TMP_DIR", "tmp/sharp-video")).resolve()
INPUT_DIR = TMP_ROOT / "in"
FRAMES_DIR = TMP_ROOT / "frames"
SPLATS_DIR = TMP_ROOT / "splats"
OUTPUT_DIR = TMP_ROOT / "out"
for d in (INPUT_DIR, FRAMES_DIR, SPLATS_DIR, OUTPUT_DIR):
    d.mkdir(parents=True, exist_ok=True)

FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")
SHARP_PYTHON = os.environ.get("SHARP_PYTHON", "python")
SHARP_MODULE = os.environ.get("SHARP_MODULE", "sharp.infer")
SHARP_CHECKPOINT = os.environ.get(
    "SHARP_CHECKPOINT", "./checkpoints/sharp-base.pt"
)
SHARP_WORKING_DIR = os.environ.get("SHARP_WORKING_DIR", ".")

FOURDGS_PYTHON = os.environ.get("FOURDGS_PYTHON", SHARP_PYTHON)
FOURDGS_MODULE = os.environ.get("FOURDGS_MODULE", "four_dgs.fit")
FOURDGS_WORKING_DIR = os.environ.get("FOURDGS_WORKING_DIR", SHARP_WORKING_DIR)

DEFAULT_ORIGINS = "http://localhost:3000,https://holoflow.co.uk"
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("SHARP_VIDEO_CORS_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]

# ---------- job model ----------


@dataclass
class VideoJob:
    job_id: str
    video_path: Path
    frames_dir: Path
    splats_dir: Path
    out_splat4d: Path
    out_stereo_mp4: Path
    out_usdz_keyframes: Path
    meta: dict[str, Any]
    keyframe_stride: int = 6
    want_splat4d: bool = True
    want_stereo_mp4: bool = True
    want_usdz_keyframes: bool = False
    state: str = "queued"  # queued | decoding | running | done | error | cancelled
    submitted_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    frames_total: Optional[int] = None
    frames_done: int = 0
    progress_pct: float = 0.0
    current_stage: str = "sharp"  # sharp | 4dgs-fit | stitch
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    size_bytes: int = 0


JOBS: dict[str, VideoJob] = {}
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


def _serialise(job: VideoJob) -> dict[str, Any]:
    if job.state == "queued":
        return {
            "state": "queued",
            "positionInQueue": _position_in_queue(job.job_id),
            "submittedAt": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(job.submitted_at)
            ),
        }
    if job.state == "decoding":
        return {
            "state": "decoding",
            "framesTotal": job.frames_total,
            "progressPct": round(job.progress_pct, 2),
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
            "framesDone": job.frames_done,
            "framesTotal": job.frames_total or 0,
            "progressPct": round(job.progress_pct, 2),
            "etaSeconds": eta,
            "currentFrameStage": job.current_stage,
        }
    if job.state == "done":
        duration = (job.finished_at or 0) - (job.started_at or job.submitted_at)
        bundle: dict[str, str] = {}
        if job.want_splat4d and job.out_splat4d.exists():
            bundle["splat4dUrl"] = f"/jobs/{job.job_id}/result/splat4d"
        if job.want_stereo_mp4 and job.out_stereo_mp4.exists():
            bundle["stereoMp4Url"] = f"/jobs/{job.job_id}/result/stereoMp4"
        if job.want_usdz_keyframes and job.out_usdz_keyframes.exists():
            bundle["usdzKeyframesUrl"] = (
                f"/jobs/{job.job_id}/result/usdzKeyframes"
            )
        return {
            "state": "done",
            "bundle": bundle,
            "framesTotal": job.frames_total or 0,
            "durationSeconds": round(duration, 2),
            "sizeBytes": job.size_bytes,
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


def _run_subprocess(
    job: VideoJob, cmd: list[str], cwd: str, on_progress: Optional[float] = None
) -> int:
    """Run a subprocess, honour cancellation, return its exit code."""
    proc = subprocess.Popen(
        cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    while True:
        if job.state == "cancelled":
            _terminate(proc)
            return -1
        line = proc.stdout.readline() if proc.stdout else ""
        if line == "" and proc.poll() is not None:
            break
        # Heuristic per-stage progress nudge; real progress comes from frame counter.
        if line and on_progress is not None:
            job.progress_pct = min(on_progress, job.progress_pct + 0.5)
    return proc.wait()


def _decode_frames(job: VideoJob) -> bool:
    job.state = "decoding"
    job.frames_dir.mkdir(parents=True, exist_ok=True)
    pattern = str(job.frames_dir / "frame_%06d.png")
    # Extract every Nth frame via ffmpeg select filter.
    select = f"select='not(mod(n\\,{job.keyframe_stride}))'"
    cmd = [
        FFMPEG_BIN,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(job.video_path),
        "-vf",
        select,
        "-vsync",
        "vfr",
        pattern,
    ]
    rc = _run_subprocess(job, cmd, cwd=str(TMP_ROOT), on_progress=10.0)
    if job.state == "cancelled":
        return False
    if rc != 0:
        job.state = "error"
        job.error_message = f"ffmpeg exited with code {rc}"
        job.error_code = "FFMPEG_EXIT_NONZERO"
        return False
    frames = sorted(job.frames_dir.glob("frame_*.png"))
    if not frames:
        job.state = "error"
        job.error_message = "ffmpeg produced no frames"
        job.error_code = "FFMPEG_NO_FRAMES"
        return False
    job.frames_total = len(frames)
    job.progress_pct = 10.0
    return True


def _sharp_per_frame(job: VideoJob) -> bool:
    job.state = "running"
    job.current_stage = "sharp"
    frames = sorted(job.frames_dir.glob("frame_*.png"))
    job.splats_dir.mkdir(parents=True, exist_ok=True)
    for idx, frame_path in enumerate(frames):
        if job.state == "cancelled":
            return False
        splat_path = job.splats_dir / f"{frame_path.stem}.ply"
        cmd = [
            SHARP_PYTHON,
            "-m",
            SHARP_MODULE,
            "--image",
            str(frame_path),
            "--output",
            str(splat_path),
            "--checkpoint",
            SHARP_CHECKPOINT,
        ]
        rc = _run_subprocess(job, cmd, cwd=SHARP_WORKING_DIR, on_progress=None)
        if job.state == "cancelled":
            return False
        if rc != 0 or not splat_path.exists():
            job.state = "error"
            job.error_message = f"sharp failed on frame {idx} (rc={rc})"
            job.error_code = "SHARP_FRAME_FAILED"
            return False
        job.frames_done = idx + 1
        # Per-frame progress: keyframes take 60% of the budget after decode.
        if job.frames_total:
            job.progress_pct = 10.0 + 60.0 * (job.frames_done / job.frames_total)
    return True


def _fit_4dgs(job: VideoJob) -> bool:
    if job.state == "cancelled":
        return False
    if not job.want_splat4d:
        return True
    job.current_stage = "4dgs-fit"
    cmd = [
        FOURDGS_PYTHON,
        "-m",
        FOURDGS_MODULE,
        "--splats",
        str(job.splats_dir),
        "--output",
        str(job.out_splat4d),
    ]
    rc = _run_subprocess(
        job, cmd, cwd=FOURDGS_WORKING_DIR, on_progress=85.0
    )
    if job.state == "cancelled":
        return False
    if rc != 0 or not job.out_splat4d.exists():
        job.state = "error"
        job.error_message = f"4DGaussians fit failed (rc={rc})"
        job.error_code = "FOURDGS_FIT_FAILED"
        return False
    job.progress_pct = max(job.progress_pct, 85.0)
    return True


def _stitch_stereo_mp4(job: VideoJob) -> bool:
    if job.state == "cancelled":
        return False
    if not job.want_stereo_mp4:
        return True
    job.current_stage = "stitch"
    # Placeholder: side-by-side MP4 stitch is downstream-tool-specific.
    # The 4DGS bundle ships a renderer config; here we copy the source
    # video as a stand-in so the route round-trips. Replace with a real
    # SBS renderer call when the 4DGS Python tool exposes one.
    cmd = [
        FFMPEG_BIN,
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(job.video_path),
        "-c",
        "copy",
        str(job.out_stereo_mp4),
    ]
    rc = _run_subprocess(job, cmd, cwd=str(TMP_ROOT), on_progress=95.0)
    if job.state == "cancelled":
        return False
    if rc != 0 or not job.out_stereo_mp4.exists():
        job.state = "error"
        job.error_message = f"stereo-MP4 stitch failed (rc={rc})"
        job.error_code = "STITCH_FAILED"
        return False
    job.progress_pct = max(job.progress_pct, 95.0)
    return True


def _run_pipeline(job: VideoJob) -> None:
    job.started_at = time.time()
    try:
        if not _decode_frames(job):
            return
        if not _sharp_per_frame(job):
            return
        if not _fit_4dgs(job):
            return
        if not _stitch_stereo_mp4(job):
            return
        if job.state == "cancelled":
            return
        total = 0
        for path in (job.out_splat4d, job.out_stereo_mp4, job.out_usdz_keyframes):
            if path.exists():
                total += path.stat().st_size
        job.size_bytes = total
        job.progress_pct = 100.0
        job.state = "done"
    except FileNotFoundError as e:
        job.state = "error"
        job.error_message = f"required executable missing: {e}"
        job.error_code = "EXEC_NOT_FOUND"
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
        _run_pipeline(job)
        JOB_QUEUE.task_done()


threading.Thread(
    target=_worker_loop, name="sharp-video-worker", daemon=True
).start()

# ---------- FastAPI ----------

app = FastAPI(title="SHARP video service", version=VERSION)
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
        "ffmpeg_available": shutil.which(FFMPEG_BIN) is not None,
    }


@app.post("/jobs")
async def submit_job(
    video: UploadFile = File(...), meta: str = Form("{}")
) -> JSONResponse:
    try:
        parsed_meta = json.loads(meta) if meta else {}
        if not isinstance(parsed_meta, dict):
            raise ValueError("meta must be a JSON object")
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"invalid meta JSON: {e}")
    keyframe_stride = int(parsed_meta.get("keyframeStride") or 6)
    if keyframe_stride < 1 or keyframe_stride > 60:
        raise HTTPException(
            status_code=400, detail="keyframeStride must be 1..60"
        )
    outputs = parsed_meta.get("outputs") or {}
    if not isinstance(outputs, dict):
        raise HTTPException(status_code=400, detail="outputs must be an object")
    job_id = str(uuid.uuid4())
    suffix = Path(video.filename or "").suffix.lower()
    if suffix not in (".mp4", ".mov", ".webm", ".mkv"):
        suffix = ".mp4"
    video_path = INPUT_DIR / f"{job_id}{suffix}"
    frames_dir = FRAMES_DIR / job_id
    splats_dir = SPLATS_DIR / job_id
    out_splat4d = OUTPUT_DIR / f"{job_id}.4dgs"
    out_stereo_mp4 = OUTPUT_DIR / f"{job_id}.stereo.mp4"
    out_usdz_keyframes = OUTPUT_DIR / f"{job_id}.keyframes.usdz"
    with video_path.open("wb") as f:
        while True:
            chunk = await video.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    job = VideoJob(
        job_id=job_id,
        video_path=video_path,
        frames_dir=frames_dir,
        splats_dir=splats_dir,
        out_splat4d=out_splat4d,
        out_stereo_mp4=out_stereo_mp4,
        out_usdz_keyframes=out_usdz_keyframes,
        meta=parsed_meta,
        keyframe_stride=keyframe_stride,
        want_splat4d=bool(outputs.get("splat4d", True)),
        want_stereo_mp4=bool(outputs.get("stereoMp4", True)),
        want_usdz_keyframes=bool(outputs.get("usdzKeyframes", False)),
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


_RESULT_MAP = {
    "splat4d": ("out_splat4d", "application/octet-stream"),
    "stereoMp4": ("out_stereo_mp4", "video/mp4"),
    "usdzKeyframes": ("out_usdz_keyframes", "model/vnd.usdz+zip"),
}


@app.get("/jobs/{job_id}/result/{kind}")
def get_job_result(job_id: str, kind: str) -> FileResponse:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"job {job_id} not found")
    if job.state != "done":
        raise HTTPException(
            status_code=409, detail=f"job is {job.state}, not done"
        )
    if kind not in _RESULT_MAP:
        raise HTTPException(status_code=404, detail=f"unknown result kind {kind}")
    attr, media = _RESULT_MAP[kind]
    path: Path = getattr(job, attr)
    if not path.exists():
        raise HTTPException(
            status_code=410, detail=f"{kind} result file missing on disk"
        )
    return FileResponse(path=str(path), media_type=media, filename=path.name)


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
