"""splat360.api.video_3d — pinhole video → 3D Gaussian Splat route.

Satisfies the bench-side contract documented in
`D:/.github/_3DPOV/lib/capabilities/viz/splat-generate.server.ts` for
the `hangar-gsplat` provider:

    POST /video3d/jobs
        multipart: video=<bytes>, params=<JSON string>
        params = { frameStride, trainer, sfm, iterations }
        returns: { jobId, etaSeconds }

    GET /video3d/jobs/{jobId}
        returns: { state, gaussianCount, frameCount, registeredImages,
                   sfmDurationSeconds, trainDurationSeconds, ... }

    GET /video3d/jobs/{jobId}/result/std
        returns: standard-3DGS PLY bytes

Why a separate router from `api.jobs`: the existing 360 jobs route
speaks a JSON submission with URL refs (the upload happens out-of-band
via the media library). The video pipeline accepts raw multipart
uploads so Vercel can stream the video bytes straight to the bench
without staging them in Blob first. Different submission shape, same
service.

Auth: shared bearer token (`SPLAT_VIDEO_AUTH_TOKEN`). Empty disables
auth — bench-local dev only. Same posture as `sharp-onnx-bench`.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Annotated, Literal

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, ValidationError

from ..config import Config, from_env
from ..jobs.video_3d_store import VideoJob, VideoJobStore
from ..pipeline.video_3d import run_job


log = logging.getLogger("splat360.video_3d.api")

router = APIRouter(prefix="/video3d", tags=["video3d"])


# --- request / response shapes ----------------------------------------------

class VideoJobParams(BaseModel):
    """Per-job knobs. Matches the `params` field the Vercel client
    JSON-encodes into the multipart form."""
    frameStride: int = Field(default=10, ge=1, le=120)
    trainer: Literal["gsplat", "brush"] = "gsplat"
    sfm: Literal["colmap", "glomap"] = "colmap"
    iterations: int = Field(default=30_000, ge=1_000, le=200_000)


class SubmitResponse(BaseModel):
    jobId: str
    etaSeconds: int


class StatusResponse(BaseModel):
    """GET /jobs/{jobId} payload.

    Field names match the Vercel client's `JobStatus` type so the
    response can be consumed without a renaming layer.
    """
    state: Literal["queued", "running", "done", "error", "cancelled"]
    frameCount: int | None = None
    registeredImages: int | None = None
    gaussianCount: int | None = None
    sfmDurationSeconds: float | None = None
    trainDurationSeconds: float | None = None
    code: str | None = None
    message: str | None = None


# --- auth -------------------------------------------------------------------

def verify_bearer(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Bearer-token check. Empty `SPLAT_VIDEO_AUTH_TOKEN` env disables
    auth (bench-local dev). When set, every request must carry
    `Authorization: Bearer <token>`.

    Identical to the SHARP-ONNX bench posture — keeping the shape lets
    operators reuse the same Tailscale Funnel token-rotation runbook.
    """
    config: Config = getattr(request.app.state, "config", None) or from_env()
    expected = config.video_3d_auth_token
    if not expected:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid bearer token")


# --- dependency wiring ------------------------------------------------------

def _store(request: Request) -> VideoJobStore:
    return request.app.state.video_3d_store


def _config(request: Request) -> Config:
    # Lifespan stashes a Config; in unit tests we fall back to env so
    # the route can run against a stripped-down app instance.
    return getattr(request.app.state, "config", None) or from_env()


# --- helpers ----------------------------------------------------------------

def _to_status(job: VideoJob) -> StatusResponse:
    return StatusResponse(
        state=job.state,
        frameCount=job.frame_count,
        registeredImages=job.registered_images,
        gaussianCount=job.gaussian_count,
        sfmDurationSeconds=job.sfm_duration_seconds,
        trainDurationSeconds=job.train_duration_seconds,
        code=job.code,
        message=job.message,
    )


def _estimate_eta_seconds(params: VideoJobParams) -> int:
    """Crude eta seed for the submit response. Real implementation
    will weight by video duration and the bench's recent throughput.
    Foundation phase: a constant that scales with iteration count."""
    # ~3ms / iteration is roughly what gsplat does on a 3090 at 1080p.
    return int(60 + 0.003 * params.iterations)


# --- handlers ---------------------------------------------------------------

@router.post(
    "/jobs",
    response_model=SubmitResponse,
    dependencies=[Depends(verify_bearer)],
)
async def submit(
    request: Request,
    background_tasks: BackgroundTasks,
    video: Annotated[UploadFile, File()],
    params: Annotated[str, Form()],
) -> SubmitResponse:
    """Accept a video upload + JSON-encoded params, enqueue a job.

    The Vercel client sends `params` as a string (JSON-encoded) inside
    the multipart form because FastAPI can't bind a Pydantic model
    directly from a form field. We parse it here.
    """
    config = _config(request)
    store = _store(request)

    try:
        parsed = VideoJobParams.model_validate_json(params)
    except ValidationError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"invalid params: {exc.errors()}",
        )

    # Size check before draining the upload — content-length is
    # client-supplied and may lie, so we also enforce a hard cap as we
    # stream to disk.
    declared = video.size
    cap_bytes = config.video_3d_max_upload_mb * 1024 * 1024
    if declared is not None and declared > cap_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"video exceeds {config.video_3d_max_upload_mb} MB cap",
        )

    # Create the job record. The work_dir is patched in after store
    # creation because the store mints the job_id — chicken-and-egg.
    job_root = config.video_3d_work_root
    job_root.mkdir(parents=True, exist_ok=True)

    job = store.create(
        # Placeholder paths — rewritten below once we know the id.
        video_path=job_root / "_pending" / "video.bin",
        work_dir=job_root / "_pending",
        frame_stride=parsed.frameStride,
        trainer=parsed.trainer,
        sfm=parsed.sfm,
        iterations=parsed.iterations,
    )

    work_dir = job_root / job.id
    work_dir.mkdir(parents=True, exist_ok=True)
    video_filename = video.filename or "video.bin"
    video_path = work_dir / Path(video_filename).name
    written = await _stream_to_disk(video, video_path, cap_bytes)
    log.info("video_3d submit: job=%s bytes=%d trainer=%s sfm=%s",
             job.id, written, parsed.trainer, parsed.sfm)

    # Patch the job with the real paths now that we know them.
    store.update(job.id, work_dir=work_dir, video_path=video_path)

    background_tasks.add_task(run_job, job.id, store, config)

    return SubmitResponse(
        jobId=job.id,
        etaSeconds=_estimate_eta_seconds(parsed),
    )


@router.get(
    "/jobs/{job_id}",
    response_model=StatusResponse,
    response_model_exclude_none=True,
    dependencies=[Depends(verify_bearer)],
)
async def status(job_id: str, request: Request) -> StatusResponse:
    job = _store(request).get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"unknown job {job_id}")
    return _to_status(job)


@router.get(
    "/jobs/{job_id}/result/std",
    dependencies=[Depends(verify_bearer)],
)
async def result_std(job_id: str, request: Request) -> FileResponse:
    """Stream the standard-3DGS PLY for a completed job.

    Returns 404 if the job is unknown, 409 if it's not yet done. The
    409 lets the Vercel client distinguish "wrong id" from "not ready"
    without scraping the status endpoint.
    """
    job = _store(request).get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"unknown job {job_id}")
    if job.state != "done" or job.result_path is None:
        raise HTTPException(
            status_code=409,
            detail=f"job {job_id} is in state {job.state!r}, not 'done'",
        )
    if not job.result_path.exists():
        # Shouldn't happen — the pipeline only marks done after write.
        # Treat as 500 so it's loud.
        raise HTTPException(
            status_code=500,
            detail=f"result file missing on disk: {job.result_path}",
        )
    return FileResponse(
        path=job.result_path,
        media_type="application/octet-stream",
        filename=f"{job_id}.ply",
    )


@router.post(
    "/jobs/{job_id}/cancel",
    dependencies=[Depends(verify_bearer)],
)
async def cancel(job_id: str, request: Request) -> JSONResponse:
    """Request cancellation. The pipeline driver checks the flag at
    stage boundaries. Not in the strict Vercel contract — added as a
    courtesy for operators poking at the bench directly."""
    store = _store(request)
    ok = store.request_cancel(job_id)
    if not ok:
        job = store.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail=f"unknown job {job_id}")
        raise HTTPException(
            status_code=409,
            detail=f"job {job_id} is in state {job.state!r}; not cancellable",
        )
    return JSONResponse({"ok": True})


# --- streaming helper -------------------------------------------------------

async def _stream_to_disk(upload: UploadFile, dest: Path, cap_bytes: int) -> int:
    """Stream the uploaded video to `dest`, capping at `cap_bytes`.

    Returns the byte count written. Raises 413 if the client streams
    past the cap regardless of what content-length claimed.
    """
    written = 0
    chunk_size = 1 << 20  # 1 MiB
    with dest.open("wb") as f:
        while True:
            chunk = await upload.read(chunk_size)
            if not chunk:
                break
            written += len(chunk)
            if written > cap_bytes:
                f.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"video stream exceeded {cap_bytes} byte cap",
                )
            f.write(chunk)
    await upload.close()
    return written
