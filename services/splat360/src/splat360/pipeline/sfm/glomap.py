"""splat360.pipeline.sfm.glomap — GLOMAP wrapper.

GLOMAP (2024-2025) is a global SfM that reuses COLMAP's database and
feature pipeline but replaces the incremental mapper with a global
solver. Roughly 5-10× faster than COLMAP on the same input with
comparable accuracy.

## Pipeline

GLOMAP needs a database from `colmap feature_extractor + matcher`
first; only the mapping stage is its own binary:

    colmap feature_extractor / exhaustive_matcher    → db.db
    glomap mapper --database_path db.db --image_path images --output_path sparse

So this backend chains: `colmap` for features + matches, `glomap`
for mapping. Both must be on PATH.

## Same camera-model coverage as COLMAP

PINHOLE and OPENCV_FISHEYE. Inherits COLMAP's lack of SPHERICAL.

## Install

  github.com/colmap/glomap — prebuilt Windows + Linux. Add to PATH
  alongside colmap.
"""

from __future__ import annotations

import subprocess
import time

from .base import ColmapModel, SfmBackend, SfmInput, SfmResult, which
from .colmap import _parse_colmap_stats


class Glomap(SfmBackend):
    name = "glomap"
    licence = "BSD-3-Clause"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE", "OPENCV_FISHEYE"})

    def __init__(self, colmap_binary: str = "colmap", glomap_binary: str = "glomap") -> None:
        self._colmap = colmap_binary
        self._glomap = glomap_binary

    def is_available(self) -> bool:
        return which(self._colmap) is not None and which(self._glomap) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, sfm_input: SfmInput) -> SfmResult:
        if not self.supports(sfm_input.camera_model):
            raise ValueError(
                f"glomap does not support camera model {sfm_input.camera_model}"
            )
        work = sfm_input.work_dir
        work.mkdir(parents=True, exist_ok=True)
        db = work / "database.db"
        sparse_dir = work / "sparse"
        sparse_dir.mkdir(exist_ok=True)

        start = time.monotonic()
        camera_params_str = ",".join(str(p) for p in sfm_input.camera_params) or "0"

        subprocess.run(
            [
                self._colmap, "feature_extractor",
                "--database_path", str(db),
                "--image_path", str(sfm_input.images_dir),
                "--ImageReader.camera_model", sfm_input.camera_model,
                "--ImageReader.single_camera", "1",
                "--ImageReader.camera_params", camera_params_str,
                "--SiftExtraction.use_gpu", "1",
            ],
            check=True,
        )
        subprocess.run(
            [
                self._colmap, "exhaustive_matcher",
                "--database_path", str(db),
                "--SiftMatching.use_gpu", "1",
            ],
            check=True,
        )
        subprocess.run(
            [
                self._glomap, "mapper",
                "--database_path", str(db),
                "--image_path", str(sfm_input.images_dir),
                "--output_path", str(sparse_dir),
            ],
            check=True,
        )

        # GLOMAP writes sparse/0/ in COLMAP binary format.
        model_dir = sparse_dir / "0"
        if not model_dir.exists():
            raise RuntimeError("glomap mapper produced no model (sparse/0 missing)")
        subprocess.run(
            [
                self._colmap, "model_converter",
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
