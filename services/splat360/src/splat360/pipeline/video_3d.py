"""splat360.pipeline.video_3d — pinhole video → 3D Gaussian Splat.

This is the bench-side half of the Vercel `hangar-gsplat` provider
declared in `D:/.github/_3DPOV/lib/capabilities/viz/splat-generate.server.ts`.
Foundation phase: pipeline stages are stubs with explicit TODO blocks
describing the exact subprocess invocations the real implementation
will perform.

Three stages, driven sequentially:

    1. extract_frames  ffmpeg -vf fps=... in.mp4 frame_%06d.jpg
    2. run_sfm         colmap | glomap exhaustive_matcher + mapper
    3. train_splat     gsplat | brush training to standard-3DGS PLY

Each stage updates the `VideoJobStore` so the GET status endpoint
reflects current progress without the route handler needing to peek
inside the pipeline.

`run_job` is the entrypoint the route handler hands off to. It's the
only async-aware surface; the stage functions are plain sync so they
can be called from worker threads via `asyncio.to_thread` or
substituted with mocks in tests.
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

from ..config import Config
from ..jobs.video_3d_store import VideoJob, VideoJobStore


log = logging.getLogger("splat360.video_3d")


# Error codes — these mirror the SHARP-ONNX bench convention so the
# Vercel client's `provider-unavailable` / `generation-failed`
# discriminator code can map them uniformly.
ERR_FRAME_EXTRACTION = "FRAME_EXTRACTION_FAILED"
ERR_SFM = "SFM_FAILED"
ERR_TRAIN = "TRAIN_FAILED"
ERR_CANCELLED = "CANCELLED"
ERR_INTERNAL = "INTERNAL"


@dataclass(frozen=True)
class SfmResult:
    """Output of the SfM stage. Mirrors `pipeline.sfm.base.SfmResult`
    but stays local to this module so the video pipeline doesn't drag
    in the 360-stack types (which carry COLMAP-model assumptions the
    pinhole-only path doesn't need)."""
    sparse_dir: Path
    registered_images: int
    runtime_seconds: float


# ---------------------------------------------------------------------------
# Stage 1: frames
# ---------------------------------------------------------------------------

def extract_frames(
    video_path: Path,
    out_dir: Path,
    stride: int,
    ffmpeg_bin: str = "ffmpeg",
) -> list[Path]:
    """Decimate `video_path` to JPEG stills in `out_dir`.

    `stride` follows the Vercel contract: "every Nth frame". ffmpeg
    expresses this via the `select` filter, not `fps`. fps would
    re-time to wall-clock rate; select preserves the original frame
    indices we want for SfM.

    TODO (real implementation):
        cmd = [
            ffmpeg_bin, "-hide_banner", "-loglevel", "warning",
            "-i", str(video_path),
            "-vf", f"select=not(mod(n\\,{stride}))",
            "-vsync", "vfr",
            "-q:v", "2",
            str(out_dir / "frame_%06d.jpg"),
        ]
        subprocess.run(cmd, check=True)
        Then glob frame_*.jpg into a list, sorted.

    Foundation-phase stub: write nothing, return empty list. The
    pipeline driver short-circuits to error if the list is empty.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    # TODO: subprocess ffmpeg as described above. For now, no-op.
    _ = (video_path, stride, ffmpeg_bin)
    return sorted(out_dir.glob("frame_*.jpg"))


# ---------------------------------------------------------------------------
# Stage 2: SfM
# ---------------------------------------------------------------------------

def run_sfm(
    frames_dir: Path,
    sfm_kind: str,
    work_dir: Path,
    colmap_bin: str = "colmap",
    glomap_bin: str = "glomap",
) -> SfmResult:
    """Run COLMAP or GLOMAP over the extracted frames.

    The SfM backend produces a sparse reconstruction in COLMAP's text
    format — cameras.txt, images.txt, points3D.txt — which both gsplat
    and Brush ingest directly. We register count from `images.txt` (one
    header line per registered image).

    TODO (COLMAP — BSD-3, the default):
        feature_extractor:
            {colmap_bin} feature_extractor \\
              --database_path {work_dir}/database.db \\
              --image_path {frames_dir} \\
              --ImageReader.camera_model PINHOLE \\
              --ImageReader.single_camera 1 \\
              --SiftExtraction.use_gpu 1
        sequential_matcher (video → frames are time-ordered):
            {colmap_bin} sequential_matcher \\
              --database_path {work_dir}/database.db \\
              --SiftMatching.use_gpu 1
        mapper:
            {colmap_bin} mapper \\
              --database_path {work_dir}/database.db \\
              --image_path {frames_dir} \\
              --output_path {work_dir}/sparse
        model_converter (TXT export so trainers can parse without
            binary readers):
            {colmap_bin} model_converter \\
              --input_path {work_dir}/sparse/0 \\
              --output_path {work_dir}/sparse/0 \\
              --output_type TXT
        Expected output: {work_dir}/sparse/0/{cameras,images,points3D}.txt
        Registered count: lines in images.txt that start with a digit
        and have >= 10 whitespace-separated fields.

    TODO (GLOMAP — BSD-3, the faster matcher swap):
        Same feature_extractor step.
        Then:
            {glomap_bin} mapper \\
              --database_path {work_dir}/database.db \\
              --image_path {frames_dir} \\
              --output_path {work_dir}/sparse
        Skip the COLMAP `mapper` and `sequential_matcher` calls —
        GLOMAP does global SfM in one shot. model_converter step is
        identical.

    Foundation-phase stub: synthesise an empty sparse dir, count zero
    registered images.
    """
    work_dir.mkdir(parents=True, exist_ok=True)
    sparse_dir = work_dir / "sparse" / "0"
    sparse_dir.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    # TODO: subprocess the SfM tool. For now, no-op.
    _ = (frames_dir, sfm_kind, colmap_bin, glomap_bin)
    return SfmResult(
        sparse_dir=sparse_dir,
        registered_images=0,
        runtime_seconds=time.monotonic() - start,
    )


# ---------------------------------------------------------------------------
# Stage 3: train
# ---------------------------------------------------------------------------

def train_splat(
    sfm_result: SfmResult,
    frames_dir: Path,
    out_dir: Path,
    trainer: str,
    iterations: int,
    gpu_index: int = 0,
) -> tuple[Path, int, float]:
    """Train a 3D Gaussian Splat from the SfM output.

    Returns `(ply_path, gaussian_count, train_seconds)`.

    TODO (gsplat — Apache-2.0, the default trainer):
        gsplat-cli accepts COLMAP-format sparse dirs directly:
            python -m gsplat.scripts.simple_trainer \\
              --data_dir {frames_dir} \\
              --result_dir {out_dir} \\
              --colmap_path {sfm_result.sparse_dir} \\
              --max_steps {iterations} \\
              --eval_steps -1
        gsplat emits `ckpts/point_cloud.ply` in standard 3DGS PLY format
        (XYZ + scale + rotation + opacity + SH coeffs). No SHARP→std
        conversion needed — that's only required for the single-image
        pinhole branch where Apple SHARP emits a non-standard PLY with
        baked-in image embeddings.
        Gaussian count: header field "element vertex N".

    TODO (Brush — MIT, the alternate trainer):
        Brush is a Rust-based 3DGS trainer with a CLI surface roughly:
            {brush_bin} train \\
              --dataset colmap \\
              --data {sfm_result.sparse_dir.parent.parent} \\
              --iterations {iterations} \\
              --output {out_dir}/result.ply
        Brush also emits standard 3DGS PLY (it was designed for the
        same viewers gsplat targets), so no conversion needed.

    Foundation-phase stub: write a minimal placeholder PLY with zero
    gaussians. The shape lets the contract test exercise the download
    endpoint without a real trainer installed.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    ply_path = out_dir / "result.ply"
    start = time.monotonic()
    # TODO: subprocess the trainer as described above. For now, stub.
    _write_placeholder_ply(ply_path, gaussian_count=0)
    _ = (sfm_result, frames_dir, trainer, iterations, gpu_index)
    return ply_path, 0, time.monotonic() - start


def _write_placeholder_ply(path: Path, gaussian_count: int) -> None:
    """Emit a syntactically valid standard-3DGS PLY header with the
    given vertex count and no body. Lets `/result/std` return real
    bytes during foundation phase so contract tests can verify the
    download surface end-to-end.
    """
    header = (
        "ply\n"
        "format binary_little_endian 1.0\n"
        f"element vertex {gaussian_count}\n"
        "property float x\n"
        "property float y\n"
        "property float z\n"
        "property float opacity\n"
        "end_header\n"
    )
    path.write_bytes(header.encode("ascii"))


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

async def run_job(
    job_id: str,
    store: VideoJobStore,
    config: Config,
) -> None:
    """Run all three stages for a queued job.

    Pulls the job record from the store, runs each stage in a worker
    thread, updates the store as it progresses. Catches stage errors
    and marks the job `error` with a contract-shaped code/message.

    Cancellation: checked at stage boundaries by reading the
    `cancel_requested` flag. The current ffmpeg/colmap/gsplat
    subprocesses don't get killed mid-stage in this scaffold — that's
    a future pass once a process handle is plumbed through.
    """
    job = store.get(job_id)
    if job is None:
        log.warning("run_job called for unknown job %s", job_id)
        return

    if config.video_3d_fake_mode:
        await _run_fake(job, store)
        return

    store.mark_running(job_id)

    try:
        # Stage 1: frames
        if _cancelled(store, job_id):
            return
        frames_dir = job.work_dir / "frames"
        frame_paths = await asyncio.to_thread(
            extract_frames, job.video_path, frames_dir, job.frame_stride,
            config.ffmpeg_bin,
        )
        if not frame_paths:
            store.mark_error(
                job_id, ERR_FRAME_EXTRACTION,
                "ffmpeg produced no frames (stub or empty video)",
            )
            return
        store.update(job_id, frame_count=len(frame_paths))

        # Stage 2: SfM
        if _cancelled(store, job_id):
            return
        sfm_work = job.work_dir / "sfm"
        sfm_result = await asyncio.to_thread(
            run_sfm, frames_dir, job.sfm, sfm_work,
            config.colmap_bin, config.glomap_bin,
        )
        store.update(
            job_id,
            registered_images=sfm_result.registered_images,
            sfm_duration_seconds=sfm_result.runtime_seconds,
        )
        if sfm_result.registered_images == 0:
            # Foundation phase: real implementation will treat this as
            # a hard failure. Stub leaves it as zero and continues so
            # the contract test can flow through.
            log.info("job %s: SfM registered 0 images (stub)", job_id)

        # Stage 3: train
        if _cancelled(store, job_id):
            return
        train_out = job.work_dir / "train"
        ply_path, gaussian_count, train_seconds = await asyncio.to_thread(
            train_splat, sfm_result, frames_dir, train_out,
            job.trainer, job.iterations, config.gpu_index,
        )
        store.update(
            job_id,
            gaussian_count=gaussian_count,
            train_duration_seconds=train_seconds,
        )

        store.mark_done(job_id, ply_path)

    except subprocess.CalledProcessError as exc:
        log.exception("video_3d job %s: subprocess failed", job_id)
        # Map to a coarse stage error based on where we are. The
        # store's last successful update tells us which stage:
        current = store.get(job_id)
        code = ERR_INTERNAL
        if current is not None:
            if current.frame_count is None:
                code = ERR_FRAME_EXTRACTION
            elif current.sfm_duration_seconds is None:
                code = ERR_SFM
            else:
                code = ERR_TRAIN
        store.mark_error(job_id, code, f"subprocess failed: {exc}")
    except Exception as exc:  # noqa: BLE001 — coarse catch by design
        log.exception("video_3d job %s: unhandled error", job_id)
        store.mark_error(job_id, ERR_INTERNAL, f"{type(exc).__name__}: {exc}")


def _cancelled(store: VideoJobStore, job_id: str) -> bool:
    job = store.get(job_id)
    if job is None:
        return True
    if job.cancel_requested:
        store.mark_cancelled(job_id)
        return True
    return False


async def _run_fake(job: VideoJob, store: VideoJobStore) -> None:
    """Test/CI short-circuit: skip all subprocess work, emit a
    placeholder PLY immediately. Activated via SPLAT360_VIDEO_3D_FAKE.
    Lets the contract test exercise the route surface without ffmpeg /
    COLMAP / gsplat being installed."""
    store.mark_running(job.id)
    train_out = job.work_dir / "train"
    train_out.mkdir(parents=True, exist_ok=True)
    ply_path = train_out / "result.ply"
    _write_placeholder_ply(ply_path, gaussian_count=0)
    store.update(
        job.id,
        frame_count=0,
        registered_images=0,
        gaussian_count=0,
        sfm_duration_seconds=0.0,
        train_duration_seconds=0.0,
    )
    store.mark_done(job.id, ply_path)


# Avoid the unused-import lint while keeping shutil available for the
# future real-pipeline implementation (cleanup of partial outputs).
_ = shutil
