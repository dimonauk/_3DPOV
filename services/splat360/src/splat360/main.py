"""splat360.main — FastAPI entry.

Mounts the job API. Owns lifespan management for the job store
and the GPU queue: both live on `app.state` and survive across
requests.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import jobs, video_3d
from .config import from_env
from .jobs.queue import GpuQueue
from .jobs.store import JobStore
from .jobs.video_3d_store import VideoJobStore


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = from_env()
    cfg.work_root.mkdir(parents=True, exist_ok=True)
    cfg.out_root.mkdir(parents=True, exist_ok=True)
    cfg.video_3d_work_root.mkdir(parents=True, exist_ok=True)
    store = JobStore(cfg.work_root / "splat360.sqlite")
    queue = GpuQueue(store, cfg.out_root)
    queue.start()
    app.state.store = store
    app.state.queue = queue
    app.state.config = cfg
    # The video → 3D splat (`hangar-gsplat`) pipeline keeps its own
    # in-process store. Foundation phase: process-lifetime memory is
    # fine; SQLite-backed persistence is a future pass.
    app.state.video_3d_store = VideoJobStore()
    try:
        yield
    finally:
        # The asyncio.Task in queue cancels on event-loop shutdown.
        pass


app = FastAPI(
    title="splat360",
    version="0.1.0",
    description="360-camera-first Gaussian Splat service",
    lifespan=lifespan,
)

# CORS — when splat360 runs locally as HoloFlow Desktop, holoflow.co.uk
# (and tailnet/dev hosts) need to talk to it from the browser. The
# allow-list reads from env so production tailnet deploys can lock
# down. Default development list covers the studio's public + local
# surfaces.
_DEFAULT_ALLOWED_ORIGINS = ",".join(
    [
        "https://holoflow.co.uk",
        "https://www.holoflow.co.uk",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
)
_allowed_origins = [
    o.strip()
    for o in os.environ.get("SPLAT360_CORS_ORIGINS", _DEFAULT_ALLOWED_ORIGINS).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,  # bearer-token only; no cookies
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(video_3d.router)


@app.get("/health")
async def health() -> dict[str, object]:
    """Liveness probe with backend availability summary."""
    from .pipeline import sfm as sfm_registry
    from .pipeline import train as train_registry
    return {
        "status": "ok",
        "sfm_available": sfm_registry.available(),
        "train_available": train_registry.available(),
    }


@app.get("/video3d/ready")
async def video_3d_ready() -> dict[str, object]:
    """Readiness probe for the pinhole video → 3D splat pipeline.

    Reports binary availability for ffmpeg + the SfM/trainer pair
    that `hangar-gsplat` calls out to. Separate from `/health` so
    operators can wire it into a distinct Tailscale Funnel probe
    without conflating the 360 pipeline's readiness with the video
    pipeline's.
    """
    import shutil as _shutil
    cfg = app.state.config if hasattr(app.state, "config") else None
    ffmpeg = cfg.ffmpeg_bin if cfg else "ffmpeg"
    colmap = cfg.colmap_bin if cfg else "colmap"
    glomap = cfg.glomap_bin if cfg else "glomap"
    return {
        "status": "ok",
        "ffmpeg": _shutil.which(ffmpeg) is not None,
        "colmap": _shutil.which(colmap) is not None,
        "glomap": _shutil.which(glomap) is not None,
        "fake_mode": bool(cfg and cfg.video_3d_fake_mode),
    }
