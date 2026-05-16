"""splat360.pipeline.train.gaussian_splatting_inria — Inria reference 3DGS.

The original 3D Gaussian Splatting from Inria/GraphDeco:
github.com/graphdeco-inria/gaussian-splatting. This is the paper's
canonical implementation — quality gold standard.

## LICENCE WARNING

The Inria 3DGS code is RESEARCH-USE-ONLY. Outputs of the trainer are
fine to keep and view, but the trainer itself is **not commercial-
licensed**. The Hangar commerce track must NEVER use a `.ply` whose
trainer was Inria 3DGS for sale. The TrainResult below carries
`licence="research-only"` precisely so the orchestrator can filter
this trainer out of any production batch and reserve it for
quality-comparison runs.

## Invocation

The reference repo ships a CLI:

    python <repo>/train.py -s <data> -m <output> --iterations <N>

Data layout:

    data/
        images/
        sparse/0/
        # (no points3D.txt → reads sparse/0/ as COLMAP binary)

Output:

    output/
        point_cloud/iteration_<N>/point_cloud.ply

## Camera-model support

PINHOLE only. OPENCV_FISHEYE captures must be undistorted upstream.

## Install

    git clone https://github.com/graphdeco-inria/gaussian-splatting --recursive
    # build the diff-gaussian-rasterization and simple-knn submodules
    # — needs CUDA 11.8 / 12.x and the matching torch.
    pip install -r requirements.txt

The wrapper expects the repo path in env `SPLAT360_INRIA_3DGS_REPO`.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

from .base import ColmapModel, Licence, TrainBackend, TrainInput, TrainResult, count_gaussians


class GaussianSplattingInria(TrainBackend):
    name = "gaussian-splatting"
    licence: Licence = "research-only"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE"})

    def __init__(self, python_bin: str | None = None, repo_dir: Path | None = None) -> None:
        self._python = python_bin or sys.executable
        env_repo = os.environ.get("SPLAT360_INRIA_3DGS_REPO")
        self._repo = repo_dir or (Path(env_repo) if env_repo else None)

    def is_available(self) -> bool:
        return self._repo is not None and (self._repo / "train.py").exists()

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, train_input: TrainInput) -> TrainResult:
        if not self.supports(train_input.camera_model):
            raise ValueError(
                f"gaussian-splatting does not support camera model {train_input.camera_model}"
            )
        if self._repo is None:
            raise RuntimeError(
                "SPLAT360_INRIA_3DGS_REPO is unset; cannot run gaussian-splatting."
            )
        data = self._prepare(train_input)
        out_dir = train_input.work_dir / "inria_out"
        out_dir.mkdir(parents=True, exist_ok=True)

        start = time.monotonic()
        subprocess.run(
            [
                self._python, str(self._repo / "train.py"),
                "-s", str(data),
                "-m", str(out_dir),
                "--iterations", str(train_input.iterations),
                "--quiet",
            ],
            check=True,
            timeout=train_input.timeout_seconds,
        )
        runtime = time.monotonic() - start

        # Output: out_dir/point_cloud/iteration_<N>/point_cloud.ply
        iters = out_dir / "point_cloud"
        if not iters.exists():
            raise RuntimeError(f"inria 3dgs produced no point_cloud dir at {iters}")
        latest = sorted(iters.iterdir(), key=lambda p: p.stat().st_mtime)[-1]
        ply_path = latest / "point_cloud.ply"
        if not ply_path.exists():
            raise RuntimeError(f"inria 3dgs produced no .ply at {ply_path}")

        return TrainResult(
            backend=self.name,
            ply_path=ply_path,
            gaussian_count=count_gaussians(ply_path),
            train_seconds=runtime,
            licence=self.licence,
            raw_outputs=(out_dir,),
        )

    def _prepare(self, ti: TrainInput) -> Path:
        data = ti.work_dir / "inria_data"
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
