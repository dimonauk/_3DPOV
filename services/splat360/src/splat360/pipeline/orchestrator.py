"""splat360.pipeline.orchestrator — run the eight stages for one variant.

A `Variant` is a (sfm_backend, trainer_backend) pair, chosen by the
job payload or by the auto-picker. The orchestrator runs all eight
pipeline stages for one variant and emits a `VariantResult`.

For comparison runs, the orchestrator is called once per variant; the
compare module aggregates results.

## Stage list

    1. ingest      pipeline.ingest.fetch_*
    2. metadata    pipeline.metadata.extract_dji_video_telemetry / extract_dng_gps
    3. frames      pipeline.frames.extract  (video only)
    4. camera      pipeline.camera_model.decide
    5. prepare     fisheye-pair preserves DNGs; equirect-* reprojects to cubemap if
                   camera_model.path == "cubemap"
    6. sfm         pipeline.sfm.<backend>.run
    7. train       pipeline.train.<backend>.run
    8. post        pipeline.postprocess.run
"""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal

from . import camera_model, cubemap, frames, ingest, metadata, postprocess
from . import sfm as sfm_registry
from . import train as train_registry
from .sfm.base import SfmInput
from .train.base import TrainInput


SourceKind = Literal["fisheye-pair", "equirect-video", "equirect-image-set"]


@dataclass(frozen=True)
class Variant:
    sfm: str         # SfM backend name (key in sfm_registry)
    trainer: str     # Trainer backend name (key in train_registry)
    strategy: Literal["auto", "fisheye-pair", "equirect", "cubemap"] = "auto"


@dataclass
class StageTiming:
    name: str
    seconds: float


@dataclass
class VariantResult:
    variant: Variant
    job_dir: Path
    camera_path: Literal["fisheye-pair", "equirect", "cubemap"]
    sfm_backend: str
    trainer_backend: str
    registered_images: int
    gaussian_count: int
    sfm_seconds: float
    train_seconds: float
    ply_path: Path | None
    splat_path: Path | None
    ksplat_path: Path | None
    stages: list[StageTiming] = field(default_factory=list)
    error: str | None = None

    def as_dict(self) -> dict:
        d = asdict(self)
        d["job_dir"] = str(self.job_dir)
        d["ply_path"] = str(self.ply_path) if self.ply_path else None
        d["splat_path"] = str(self.splat_path) if self.splat_path else None
        d["ksplat_path"] = str(self.ksplat_path) if self.ksplat_path else None
        d["variant"] = asdict(self.variant)
        return d


@dataclass(frozen=True)
class JobSpec:
    job_id: str
    work_root: Path
    source_kind: SourceKind
    # For fisheye-pair: list of (lens_a_path, lens_b_path) local Paths.
    fisheye_pairs: tuple[tuple[Path, Path], ...] = ()
    # For equirect-video: a single local video path.
    equirect_video: Path | None = None
    # For equirect-image-set: list of local image paths.
    equirect_images: tuple[Path, ...] = ()
    # Camera identity (drives the adapter for telemetry).
    camera: str = "generic"
    frame_fps: float = 1.0


def run_variant(spec: JobSpec, variant: Variant) -> VariantResult:
    """Run one variant end to end. Catches per-stage errors and
    returns a VariantResult with `error` set rather than raising,
    so comparison runs survive one variant's failure."""
    job_dir = spec.work_root / spec.job_id / f"{variant.sfm}__{variant.trainer}"
    job_dir.mkdir(parents=True, exist_ok=True)
    stages: list[StageTiming] = []

    try:
        # ---- 2/3. metadata + frames ------------------------------------
        priors_csv = _extract_priors(spec, job_dir, stages)
        images_dir = _materialise_images(spec, job_dir, stages)

        # ---- 4. camera model decision ----------------------------------
        spherical_available = "opensfm" in sfm_registry.available() or \
                              "alicevision" in sfm_registry.available()
        decision = camera_model.decide(
            source_kind=spec.source_kind,
            strategy=variant.strategy,
            trainer="gsplat" if variant.trainer in {"nerfstudio", "gaussian-splatting"} else "brush",
            spherical_sfm_available=spherical_available,
        )

        # ---- 5. prepare (cubemap reproject if needed) ------------------
        if decision.path == "cubemap":
            t0 = time.monotonic()
            images_dir = _cubemap_all(images_dir, job_dir / "cube_faces")
            stages.append(StageTiming("cubemap-reproject", time.monotonic() - t0))

        # ---- 6. SfM ----------------------------------------------------
        sfm_backend = sfm_registry.get(variant.sfm)
        # Build camera_params for the chosen camera model.
        first_img = next(iter(images_dir.iterdir()))
        w, h = _read_image_size(first_img)
        camera_params = _seed_camera_params(decision.colmap_model, w, h)

        sfm_result = sfm_backend.run(
            SfmInput(
                images_dir=images_dir,
                work_dir=job_dir / "sfm",
                camera_model=decision.colmap_model,
                camera_params=camera_params,
                image_width=w,
                image_height=h,
                priors_csv=priors_csv,
            )
        )
        stages.append(StageTiming("sfm", sfm_result.runtime_seconds))

        # ---- 7. train --------------------------------------------------
        trainer = train_registry.get(variant.trainer)
        train_result = trainer.run(
            TrainInput(
                images_dir=images_dir,
                sparse_dir=sfm_result.sparse_dir,
                work_dir=job_dir / "train",
                camera_model=decision.colmap_model,
            )
        )
        stages.append(StageTiming("train", train_result.train_seconds))

        # ---- 8. post ---------------------------------------------------
        t0 = time.monotonic()
        post = postprocess.run(train_result.ply_path, job_dir / "out")
        stages.append(StageTiming("postprocess", time.monotonic() - t0))

        return VariantResult(
            variant=variant,
            job_dir=job_dir,
            camera_path=decision.path,
            sfm_backend=sfm_result.backend,
            trainer_backend=train_result.backend,
            registered_images=sfm_result.registered_images,
            gaussian_count=train_result.gaussian_count,
            sfm_seconds=sfm_result.runtime_seconds,
            train_seconds=train_result.train_seconds,
            ply_path=train_result.ply_path,
            splat_path=post.splat_path,
            ksplat_path=post.ksplat_path,
            stages=stages,
        )

    except Exception as exc:
        return VariantResult(
            variant=variant,
            job_dir=job_dir,
            camera_path="cubemap",  # unknown; placeholder
            sfm_backend=variant.sfm,
            trainer_backend=variant.trainer,
            registered_images=0,
            gaussian_count=0,
            sfm_seconds=0.0,
            train_seconds=0.0,
            ply_path=None,
            splat_path=None,
            ksplat_path=None,
            stages=stages,
            error=f"{type(exc).__name__}: {exc}",
        )


# ---------------------------------------------------------------------------
# helpers

def _extract_priors(spec: JobSpec, job_dir: Path, stages: list[StageTiming]) -> Path | None:
    t0 = time.monotonic()
    csv_path = job_dir / "priors.csv"
    records: list[metadata.PoseRecord] = []
    if spec.equirect_video is not None and spec.camera in {"avata360", "osmo360"}:
        try:
            records = metadata.extract_dji_video_telemetry(spec.equirect_video)
        except subprocess_error_types():
            records = []
    for a, _b in spec.fisheye_pairs:
        rec = metadata.extract_dng_gps(a)
        if rec is not None:
            records.append(rec)
    stages.append(StageTiming("metadata", time.monotonic() - t0))
    if not records:
        return None
    return metadata.write_priors_csv(records, csv_path)


def _materialise_images(spec: JobSpec, job_dir: Path, stages: list[StageTiming]) -> Path:
    images_dir = job_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    t0 = time.monotonic()

    if spec.source_kind == "equirect-video":
        if spec.equirect_video is None:
            raise ValueError("equirect-video source needs equirect_video set")
        frames.extract(spec.equirect_video, images_dir, fps=spec.frame_fps)
    elif spec.source_kind == "equirect-image-set":
        for src in spec.equirect_images:
            target = images_dir / src.name
            if not target.exists():
                try:
                    target.symlink_to(src)
                except OSError:
                    import shutil
                    shutil.copy2(src, target)
    elif spec.source_kind == "fisheye-pair":
        # DNG pair → two images per shot, named with shot index and lens.
        for i, (a, b) in enumerate(spec.fisheye_pairs):
            for lens, src in (("a", a), ("b", b)):
                target = images_dir / f"shot_{i:06d}_{lens}{src.suffix}"
                if not target.exists():
                    try:
                        target.symlink_to(src)
                    except OSError:
                        import shutil
                        shutil.copy2(src, target)
    else:
        raise ValueError(f"Unknown source kind: {spec.source_kind}")

    stages.append(StageTiming("materialise", time.monotonic() - t0))
    return images_dir


def _cubemap_all(equirect_dir: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    for img in sorted(equirect_dir.iterdir()):
        if img.suffix.lower() not in {".jpg", ".jpeg", ".png", ".tif", ".tiff"}:
            continue
        cubemap.reproject_file(img, out_dir, face_size=2048)
    return out_dir


def _read_image_size(path: Path) -> tuple[int, int]:
    import cv2
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError(f"Cannot read image: {path}")
    h, w = img.shape[:2]
    return w, h


def _seed_camera_params(model: str, w: int, h: int) -> tuple[float, ...]:
    if model == "PINHOLE":
        # For cubemap faces we know the exact intrinsics; for arbitrary
        # PINHOLE input we fall back to a 90° FOV seed.
        fx = fy = w / 2.0
        return (fx, fy, w / 2.0, h / 2.0)
    if model == "OPENCV_FISHEYE":
        fx = fy = w / 2.0
        return (fx, fy, w / 2.0, h / 2.0, 0.0, 0.0, 0.0, 0.0)
    if model == "SPHERICAL":
        return ()
    raise ValueError(f"Unknown camera model: {model}")


def subprocess_error_types() -> tuple[type[BaseException], ...]:
    """Centralised import so the orchestrator stays import-light."""
    import subprocess
    return (subprocess.CalledProcessError, FileNotFoundError)
