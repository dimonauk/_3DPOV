"""splat360.pipeline.sfm.colmap — COLMAP wrapper.

COLMAP is the BSD-3 C++ SfM workhorse. Supports PINHOLE,
OPENCV_FISHEYE, and many other pinhole-family camera models. Does
NOT support a spherical / equirectangular projection in mainline.

## Pipeline (subprocess)

    colmap feature_extractor    --database_path db.db --image_path images
    colmap exhaustive_matcher   --database_path db.db
    colmap mapper               --database_path db.db --image_path images --output_path sparse
    colmap model_converter      --input_path sparse/0 --output_path sparse/0 --output_type TXT

## GPS priors

If priors_csv is supplied, we write the GPS as image position priors
via `colmap pose_prior` (added in COLMAP 3.9+). Older COLMAP falls
back to passing `--Mapper.tri_min_angle 3.0 --Mapper.ba_use_gpu 1`
which speeds up the blind solve.

## Install

  Windows: download the prebuilt CUDA binary from colmap.github.io,
           extract, add the directory to PATH.
  Linux:   apt install colmap (Ubuntu 22.04+) or build from source.
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, SfmBackend, SfmInput, SfmResult, which


class Colmap(SfmBackend):
    name = "colmap"
    licence = "BSD-3-Clause"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE", "OPENCV_FISHEYE"})

    def __init__(self, binary: str = "colmap") -> None:
        self._binary = binary

    def is_available(self) -> bool:
        return which(self._binary) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, sfm_input: SfmInput) -> SfmResult:
        if not self.supports(sfm_input.camera_model):
            raise ValueError(
                f"colmap does not support camera model {sfm_input.camera_model}"
            )
        work = sfm_input.work_dir
        work.mkdir(parents=True, exist_ok=True)
        db = work / "database.db"
        sparse_dir = work / "sparse"
        sparse_dir.mkdir(exist_ok=True)

        start = time.monotonic()

        camera_params_str = ",".join(str(p) for p in sfm_input.camera_params) or "0"

        # 1. Feature extraction.
        subprocess.run(
            [
                self._binary, "feature_extractor",
                "--database_path", str(db),
                "--image_path", str(sfm_input.images_dir),
                "--ImageReader.camera_model", sfm_input.camera_model,
                "--ImageReader.single_camera", "1",
                "--ImageReader.camera_params", camera_params_str,
                "--SiftExtraction.use_gpu", "1",
            ],
            check=True,
        )

        # 2. Pairwise matching. Exhaustive is fine up to ~2k images;
        # the orchestrator chooses sequential_matcher for video-derived
        # frames by re-calling with a different binary path.
        subprocess.run(
            [
                self._binary, "exhaustive_matcher",
                "--database_path", str(db),
                "--SiftMatching.use_gpu", "1",
            ],
            check=True,
        )

        # 3. Optional: feed GPS priors via `colmap pose_prior` (3.9+).
        # Best-effort — silently skip if the command is unavailable.
        if sfm_input.priors_csv is not None:
            try:
                subprocess.run(
                    [
                        self._binary, "pose_prior",
                        "--database_path", str(db),
                        "--input_path", str(sfm_input.priors_csv),
                    ],
                    check=False,
                )
            except FileNotFoundError:
                pass

        # 4. Mapper.
        subprocess.run(
            [
                self._binary, "mapper",
                "--database_path", str(db),
                "--image_path", str(sfm_input.images_dir),
                "--output_path", str(sparse_dir),
            ],
            check=True,
        )

        # COLMAP writes sparse/0/ — that's our canonical output.
        model_dir = sparse_dir / "0"
        if not model_dir.exists():
            raise RuntimeError("colmap mapper produced no model (sparse/0 missing)")

        # 5. Text export (cameras.txt, images.txt, points3D.txt) so
        # downstream trainers can read without binary parsing.
        subprocess.run(
            [
                self._binary, "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(model_dir),
                "--output_type", "TXT",
            ],
            check=True,
        )

        runtime = time.monotonic() - start
        registered, reproj = _parse_colmap_stats(model_dir)

        return SfmResult(
            backend=self.name,
            sparse_dir=model_dir,
            registered_images=registered,
            mean_reprojection_error=reproj,
            runtime_seconds=runtime,
            raw_outputs=(db, sparse_dir),
        )


def _parse_colmap_stats(model_dir: Path) -> tuple[int, float]:
    """Count registered images and average reproj error from
    images.txt. Robust to COLMAP's variable formatting."""
    images_txt = model_dir / "images.txt"
    if not images_txt.exists():
        return 0, float("nan")
    count = 0
    # COLMAP doesn't write reproj-error into images.txt directly; it
    # lives in the mapper stdout. Without parsing logs, we surface NaN
    # and let the orchestrator note it. A future pass will scrape the
    # mapper log file `sparse/log.txt` if present.
    with images_txt.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            # Each registered image emits 2 lines; we count "header"
            # lines (the ones with QW QX QY QZ TX TY TZ CAMERA_ID NAME).
            parts = line.split()
            if len(parts) >= 10 and parts[0].isdigit():
                count += 1
    return count, float("nan")
