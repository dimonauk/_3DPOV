"""splat360.pipeline.train.nerfstudio — splatfacto wrapper.

nerfstudio is Apache-2.0; its `splatfacto` model wraps gsplat for
3D Gaussian Splatting training. Commercially friendly, well-maintained,
and the de facto reference Python trainer in 2025-2026.

## Invocation

We use the COLMAP data parser path:

    ns-train splatfacto colmap \\
        --data <work_dir> \\
        --output-dir <work_dir>/runs \\
        --max-num-iterations <N> \\
        --pipeline.model.cull_alpha_thresh 0.005

For the `colmap` parser, the input directory layout must be:

    work_dir/
        images/         (symlinks to actual images)
        sparse/0/       (cameras.txt, images.txt, points3D.txt)

Our `prepare()` builds that layout.

## Camera-model support

Limited to what gsplat ingests via the COLMAP parser: PINHOLE and
COLMAP's pinhole-family models. OPENCV_FISHEYE inputs are accepted
(nerfstudio undistorts internally). SPHERICAL is NOT supported.

## Install

    pip install nerfstudio
    # plus a CUDA torch matching the driver
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, Licence, TrainBackend, TrainInput, TrainResult, count_gaussians, which


class Nerfstudio(TrainBackend):
    name = "nerfstudio"
    licence: Licence = "commercial-ok"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE", "OPENCV_FISHEYE"})

    def __init__(self, binary: str = "ns-train", export_binary: str = "ns-export") -> None:
        self._train = binary
        self._export = export_binary

    def is_available(self) -> bool:
        return which(self._train) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, train_input: TrainInput) -> TrainResult:
        if not self.supports(train_input.camera_model):
            raise ValueError(
                f"nerfstudio does not support camera model {train_input.camera_model}"
            )
        data = self._prepare(train_input)
        runs = data / "runs"
        runs.mkdir(parents=True, exist_ok=True)

        start = time.monotonic()
        subprocess.run(
            [
                self._train, "splatfacto", "colmap",
                "--data", str(data),
                "--output-dir", str(runs),
                "--max-num-iterations", str(train_input.iterations),
                "--viewer.quit-on-train-completion", "True",
            ],
            check=True,
            timeout=train_input.timeout_seconds,
        )

        # Find the latest run dir; nerfstudio writes <method>/<timestamp>/.
        run_dirs = sorted(runs.rglob("config.yml"), key=lambda p: p.stat().st_mtime)
        if not run_dirs:
            raise RuntimeError("nerfstudio produced no config.yml")
        config = run_dirs[-1]

        # Export the splat to PLY.
        ply_path = train_input.work_dir / "splat.ply"
        subprocess.run(
            [
                self._export, "gaussian-splat",
                "--load-config", str(config),
                "--output-dir", str(train_input.work_dir),
            ],
            check=True,
        )
        # ns-export writes to <output-dir>/splat.ply — already where we want it.
        runtime = time.monotonic() - start

        return TrainResult(
            backend=self.name,
            ply_path=ply_path,
            gaussian_count=count_gaussians(ply_path),
            train_seconds=runtime,
            licence=self.licence,
            raw_outputs=(runs,),
        )

    def _prepare(self, ti: TrainInput) -> Path:
        """Build the data dir layout that ns-train colmap expects."""
        data = ti.work_dir / "ns_data"
        (data / "images").mkdir(parents=True, exist_ok=True)
        sparse = data / "sparse" / "0"
        sparse.mkdir(parents=True, exist_ok=True)

        for img in ti.images_dir.iterdir():
            target = data / "images" / img.name
            if not target.exists():
                try:
                    target.symlink_to(img)
                except OSError:
                    import shutil
                    shutil.copy2(img, target)

        for name in ("cameras.txt", "images.txt", "points3D.txt"):
            src = ti.sparse_dir / name
            if src.exists():
                target = sparse / name
                if not target.exists():
                    try:
                        target.symlink_to(src)
                    except OSError:
                        import shutil
                        shutil.copy2(src, target)
        return data
