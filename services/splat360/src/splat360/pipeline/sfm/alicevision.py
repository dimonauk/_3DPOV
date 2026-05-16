"""splat360.pipeline.sfm.alicevision — AliceVision (Meshroom) wrapper.

AliceVision is MPL-2 photogrammetric C++ + CUDA. Meshroom is its
node-based GUI; this wrapper drives the same pipeline from the CLI
via `meshroom_batch` so we don't need the GUI installed.

## Invocation

We use Meshroom's built-in `photogrammetry` pipeline rather than a
hand-drawn `.mg` graph file. That keeps the install simple at the
cost of camera-model flexibility: only PINHOLE is covered. The
fisheye / spherical paths would need a custom graph and are a v2
concern.

    meshroom_batch \\
        --input <viewpoints_dir> \\
        --pipeline photogrammetry \\
        --output <out_dir> \\
        --paramOverrides CameraInit_1.intrinsics:focalLengthPx=<fx>

The `ConvertSfMFormat` node in the default photogrammetry pipeline
emits an `.abc` file. To get COLMAP-format output we add an
override that switches the format to `cameras.txt` style, OR we
post-process with `aliceVision_convertSfMFormat`. The latter ships
inside the Meshroom standalone — we call it as a follow-up step.

## Install

  github.com/alicevision/Meshroom/releases — Windows / Linux prebuilts.
  Pull the standalone `Meshroom-2024.x.0` zip; `meshroom_batch.exe`
  is at the root. Add that directory to PATH.

## Caveat

AliceVision is HEAVY. ~5GB install. Slowest of the five backends
(~3× COLMAP on the same input). Worth running as a quality oracle
for comparison runs; not the default backend for production.
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, SfmBackend, SfmInput, SfmResult, which


class AliceVision(SfmBackend):
    name = "alicevision"
    licence = "MPL-2.0"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE"})

    def __init__(
        self,
        meshroom_batch: str = "meshroom_batch",
        convert_format: str = "aliceVision_convertSfMFormat",
    ) -> None:
        self._batch = meshroom_batch
        self._convert = convert_format

    def is_available(self) -> bool:
        return which(self._batch) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, sfm_input: SfmInput) -> SfmResult:
        if not self.supports(sfm_input.camera_model):
            raise ValueError(
                f"alicevision (this wrapper) only supports PINHOLE; got {sfm_input.camera_model}. "
                "OPENCV_FISHEYE / SPHERICAL paths need a custom Meshroom graph (v2 concern)."
            )
        work = sfm_input.work_dir
        work.mkdir(parents=True, exist_ok=True)
        out_dir = work / "av_out"
        out_dir.mkdir(exist_ok=True)

        start = time.monotonic()

        # Build paramOverrides for the seed intrinsics. Meshroom's
        # PhotometricCalibration node accepts focal-length-in-pixels;
        # we hand it the seed and let the bundle adjuster refine.
        overrides: list[str] = []
        if sfm_input.camera_params:
            fx = sfm_input.camera_params[0]
            overrides += ["--paramOverrides", f"CameraInit_1.intrinsics:focalLengthPx={fx}"]

        subprocess.run(
            [
                self._batch,
                "--input", str(sfm_input.images_dir),
                "--pipeline", "photogrammetry",
                "--output", str(out_dir),
                *overrides,
            ],
            check=True,
        )

        # Find the StructureFromMotion node's .abc output and convert
        # to COLMAP format. Meshroom writes its node outputs under
        # MeshroomCache/<NodeName>/<hash>/.
        cache = out_dir / "MeshroomCache" / "StructureFromMotion"
        if not cache.exists():
            raise RuntimeError(
                f"alicevision SfM node produced no cache at {cache}"
            )
        latest_run = sorted(cache.iterdir(), key=lambda p: p.stat().st_mtime)[-1]
        abc_path = latest_run / "sfm.abc"
        if not abc_path.exists():
            # Some Meshroom versions name it differently.
            candidates = list(latest_run.glob("*.abc")) + list(latest_run.glob("*.json"))
            if not candidates:
                raise RuntimeError(f"No SfM output found in {latest_run}")
            abc_path = candidates[0]

        sparse = out_dir / "colmap"
        sparse.mkdir(exist_ok=True)
        if which(self._convert):
            subprocess.run(
                [
                    self._convert,
                    "--input", str(abc_path),
                    "--output", str(sparse / "model.colmap"),
                ],
                check=True,
            )
        runtime = time.monotonic() - start

        from .opensfm import _count_lines_in
        registered = _count_lines_in(sparse / "images.txt", header_only=True)
        return SfmResult(
            backend=self.name,
            sparse_dir=sparse,
            registered_images=registered,
            mean_reprojection_error=float("nan"),
            runtime_seconds=runtime,
            raw_outputs=(out_dir,),
        )
