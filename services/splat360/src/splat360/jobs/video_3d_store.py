"""splat360.jobs.video_3d_store — in-process job store for the
pinhole video → 3D splat pipeline.

The 360 pipeline persists state through SQLite via `JobStore`. The
video pipeline is foundation-phase and the contract that Vercel speaks
(`splat-generate.server.ts`) is flat and short-lived — submit, poll,
download — so process-lifetime memory is enough. SQLite-backed
persistence is a future pass once the pipeline actually does work
worth surviving a service restart.

State machine mirrors the SHARP-ONNX bench service:
    queued -> running -> done
            \\-> error
            \\-> cancelled

Field names match the Vercel-side `JobStatus` shape so the route
handlers can just serialise the dataclass.
"""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal


VideoJobState = Literal["queued", "running", "done", "error", "cancelled"]


@dataclass
class VideoJob:
    """One submission to the video → 3D splat pipeline.

    The dataclass doubles as the GET response payload — the route
    handler strips internal-only fields (`video_path`, `result_path`)
    before returning. Default `None`s let the route handler skip
    keys with `exclude_none` on the way out.
    """
    id: str
    state: VideoJobState
    submitted_at: float
    # Submission params, echoed back so callers can verify what ran.
    frame_stride: int
    trainer: str
    sfm: str
    iterations: int
    # Filesystem layout for this job. Set at create time, populated as
    # the pipeline progresses.
    work_dir: Path
    video_path: Path
    result_path: Path | None = None
    # Stage outputs. None until the corresponding stage finishes.
    frame_count: int | None = None
    registered_images: int | None = None
    gaussian_count: int | None = None
    sfm_duration_seconds: float | None = None
    train_duration_seconds: float | None = None
    # Failure detail. Mirrors the SHARP-ONNX shape:
    #   { code: "FRAME_EXTRACTION_FAILED", message: "ffmpeg exited 1" }
    code: str | None = None
    message: str | None = None
    # Bookkeeping.
    started_at: float | None = None
    finished_at: float | None = None
    # Future cancellation hook. Pipeline driver polls this flag at
    # stage boundaries.
    cancel_requested: bool = False
    # Free-form scratchpad for pipeline stages (e.g. ffprobe duration,
    # COLMAP sparse path). Never returned to the caller.
    scratch: dict[str, Any] = field(default_factory=dict)


class VideoJobStore:
    """Thread-safe in-process map of jobId -> VideoJob.

    Lifetime: the FastAPI process. A `lifespan` hook constructs one
    and attaches it to `app.state.video_3d_store`. The pipeline driver
    runs in `asyncio.to_thread` (matching the 360 queue), so updates
    cross threads — hence the lock.
    """

    def __init__(self) -> None:
        self._jobs: dict[str, VideoJob] = {}
        self._lock = threading.Lock()

    def create(
        self,
        video_path: Path,
        work_dir: Path,
        frame_stride: int,
        trainer: str,
        sfm: str,
        iterations: int,
    ) -> VideoJob:
        job_id = uuid.uuid4().hex
        job = VideoJob(
            id=job_id,
            state="queued",
            submitted_at=time.time(),
            frame_stride=frame_stride,
            trainer=trainer,
            sfm=sfm,
            iterations=iterations,
            work_dir=work_dir,
            video_path=video_path,
        )
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> VideoJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job_id: str, **fields: Any) -> VideoJob | None:
        """Patch a job's mutable fields under the lock. Returns the
        updated job (or None if the id is unknown). Unknown field
        names raise — keeps typos loud rather than silently dropped.
        """
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            for k, v in fields.items():
                if not hasattr(job, k):
                    raise AttributeError(f"VideoJob has no field {k!r}")
                setattr(job, k, v)
            return job

    def mark_running(self, job_id: str) -> None:
        self.update(job_id, state="running", started_at=time.time())

    def mark_done(self, job_id: str, result_path: Path) -> None:
        self.update(
            job_id,
            state="done",
            result_path=result_path,
            finished_at=time.time(),
        )

    def mark_error(self, job_id: str, code: str, message: str) -> None:
        self.update(
            job_id,
            state="error",
            code=code,
            message=message,
            finished_at=time.time(),
        )

    def mark_cancelled(self, job_id: str) -> None:
        self.update(
            job_id,
            state="cancelled",
            finished_at=time.time(),
        )

    def request_cancel(self, job_id: str) -> bool:
        """Flip the cancel flag. The pipeline driver checks it between
        stages. Returns True if the job exists and is still in a
        cancellable state."""
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return False
            if job.state in {"done", "error", "cancelled"}:
                return False
            job.cancel_requested = True
            return True
