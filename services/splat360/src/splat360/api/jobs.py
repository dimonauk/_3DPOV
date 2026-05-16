"""splat360.api.jobs — job submission, status, result.

The API surface is intentionally narrow:

    POST  /api/jobs              create a job
    GET   /api/jobs              list recent jobs
    GET   /api/jobs/{id}         job state
    GET   /api/jobs/{id}/events  progress log

The submission body declares the source and a list of variants to run.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ..config import from_env
from ..jobs.queue import GpuQueue, QueuedJob
from ..jobs.store import JobStore
from ..pipeline import ingest
from ..pipeline.orchestrator import JobSpec, Variant


router = APIRouter()


# --- request / response shapes ----------------------------------------------

class FisheyePairSource(BaseModel):
    kind: Literal["fisheye-pair"] = "fisheye-pair"
    pairs: list[tuple[str, str]] = Field(
        description="(lens-a-url, lens-b-url) tuples, time-ordered",
    )
    camera: Literal["avata360", "osmo360", "insta360-x"] = "avata360"


class EquirectVideoSource(BaseModel):
    kind: Literal["equirect-video"] = "equirect-video"
    url: str
    frame_fps: float = 1.0
    camera: Literal["avata360", "osmo360", "insta360-x", "theta", "gopro-max", "generic"] = "generic"


class EquirectImageSetSource(BaseModel):
    kind: Literal["equirect-image-set"] = "equirect-image-set"
    urls: list[str]
    camera: Literal["avata360", "osmo360", "insta360-x", "theta", "gopro-max", "generic"] = "generic"


SubmitSource = FisheyePairSource | EquirectVideoSource | EquirectImageSetSource


class VariantSpec(BaseModel):
    sfm: Literal["colmap", "glomap", "opensfm", "hloc", "alicevision"]
    trainer: Literal["nerfstudio", "brush", "gaussian-splatting", "postshot"]
    strategy: Literal["auto", "fisheye-pair", "equirect", "cubemap"] = "auto"


class SubmitJob(BaseModel):
    source: SubmitSource
    variants: list[VariantSpec] = Field(
        default_factory=list,
        description="Variants to run. Empty list = single auto-picked variant.",
    )


class JobStateResponse(BaseModel):
    id: str
    phase: str
    progress: float
    error: str | None = None
    result: dict | None = None


# --- dependency wiring ------------------------------------------------------

def _store(request: Request) -> JobStore:
    return request.app.state.store


def _queue(request: Request) -> GpuQueue:
    return request.app.state.queue


# --- handlers ---------------------------------------------------------------

@router.post("", response_model=JobStateResponse)
async def submit(body: SubmitJob, request: Request) -> JobStateResponse:
    cfg = from_env()
    store = _store(request)
    queue = _queue(request)

    job_id = store.create_job(body.model_dump())

    # Materialise inputs to the job's source dir up-front so the queue
    # worker doesn't need network access mid-run.
    source_dir = cfg.work_root / job_id / "source"
    source_dir.mkdir(parents=True, exist_ok=True)

    src = body.source
    spec_kwargs: dict = {
        "job_id": job_id,
        "work_root": cfg.work_root,
        "source_kind": src.kind,
        "camera": getattr(src, "camera", "generic"),
    }
    if isinstance(src, FisheyePairSource):
        pairs = ingest.fetch_pairs(src.pairs, source_dir)
        spec_kwargs["fisheye_pairs"] = tuple(pairs)
    elif isinstance(src, EquirectVideoSource):
        video = ingest.fetch_to(src.url, source_dir)
        spec_kwargs["equirect_video"] = video
        spec_kwargs["frame_fps"] = src.frame_fps
    elif isinstance(src, EquirectImageSetSource):
        imgs = ingest.fetch_many(list(src.urls), source_dir)
        spec_kwargs["equirect_images"] = tuple(imgs)
    else:  # pragma: no cover — exhaustive union
        raise HTTPException(status_code=400, detail=f"Unknown source kind: {src}")

    spec = JobSpec(**spec_kwargs)

    variants = [
        Variant(sfm=v.sfm, trainer=v.trainer, strategy=v.strategy)
        for v in body.variants
    ] or _auto_variants(src)
    if not variants:
        raise HTTPException(status_code=400, detail="No variant could be auto-picked.")

    await queue.submit(QueuedJob(job_id=job_id, spec=spec, variants=tuple(variants)))

    return JobStateResponse(id=job_id, phase="queued", progress=0.0)


@router.get("", response_model=list[JobStateResponse])
async def list_recent(request: Request) -> list[JobStateResponse]:
    store = _store(request)
    rows = store.list_recent()
    return [
        JobStateResponse(
            id=r.id,
            phase=r.phase,
            progress=r.progress,
            error=r.error,
            result=json.loads(r.result_json) if r.result_json else None,
        )
        for r in rows
    ]


@router.get("/{job_id}", response_model=JobStateResponse)
async def status(job_id: str, request: Request) -> JobStateResponse:
    store = _store(request)
    row = store.get_job(job_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return JobStateResponse(
        id=row.id,
        phase=row.phase,
        progress=row.progress,
        error=row.error,
        result=json.loads(row.result_json) if row.result_json else None,
    )


@router.get("/{job_id}/events")
async def events(job_id: str, request: Request) -> dict:
    store = _store(request)
    row = store.get_job(job_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return {"events": store.events(job_id)}


# ---------------------------------------------------------------------------

def _auto_variants(source: SubmitSource) -> list[Variant]:
    """Default variant when the caller didn't supply one. Conservative
    choice: COLMAP + nerfstudio, strategy=auto."""
    return [Variant(sfm="colmap", trainer="nerfstudio", strategy="auto")]
