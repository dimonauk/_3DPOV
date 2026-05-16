"""splat360.pipeline.train.opensplat — OpenSplat (C++, AGPL-3.0) wrapper.

OpenSplat (github.com/pierotofy/opensplat) is a production-grade 3DGS
trainer written in C++. Runs on CPU or GPU, Windows/Mac/Linux. Reads
COLMAP / OpenSfM / ODM / OpenMVG / nerfstudio project formats
directly — so any of our SfM backends can feed it.

## Why include this

  - **No CUDA-Python stack required.** Single C++ binary. Useful when
    nerfstudio's torch install is fighting the system or when we
    want to fan out training across more nodes than have a working
    Python ML env.
  - **AGPL-3.0 licence.** Outputs are usable commercially; the
    trainer binary itself carries AGPL obligations if redistributed.
    Service-only use (we run it on our own bench) is fine.
  - **OpenDroneMap-native input.** When the splat360 SfM stage emits
    ODM-format poses, OpenSplat ingests directly with no conversion
    glue. Future ODM integration is a one-line backend swap.

## Invocation

    opensplat <data-dir> [--num-iters N] [--output <output.ply>]

`data-dir` follows the COLMAP/OpenSfM/ODM convention:

    data/
        images/                 input images
        sparse/0/               cameras.txt, images.txt, points3D.txt

The default training writes `splat.ply` into `data-dir` unless
`--output` is supplied. We pass an explicit output path to keep the
working dir clean.

## Camera-model support

OpenSplat reads everything that's in the COLMAP sparse format — that
includes PINHOLE and OPENCV_FISHEYE. We restrict to those two here
to match the rest of our trainer registry; SPHERICAL goes through
cubemap reprojection before this trainer sees it.

## Install

  Windows release: github.com/pierotofy/opensplat/releases
  Linux:           build from source (CUDA optional) or use Docker
  Splat360 installer: `splat360-install-opensplat.bat`
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, Licence, TrainBackend, TrainInput, TrainResult, count_gaussians, which


class OpenSplat(TrainBackend):
    name = "opensplat"
    # AGPL-3.0 — outputs (.ply) are commercially usable; the binary
    # itself carries copyleft obligations. We run it server-side only,
    # never bundle it. Tagged commercial-ok on the output side.
    licence: Licence = "commercial-ok"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE", "OPENCV_FISHEYE"})

    def __init__(self, binary: str = "opensplat") -> None:
        self._binary = binary

    def is_available(self) -> bool:
        return which(self._binary) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, train_input: TrainInput) -> TrainResult:
        if not self.supports(train_input.camera_model):
            raise ValueError(
                f"opensplat does not support camera model {train_input.camera_model}; "
                "cubemap-reproject (PINHOLE) or use a different trainer."
            )
        data = self._prepare(train_input)
        ply_path = train_input.work_dir / "opensplat_scene.ply"

        start = time.monotonic()
        subprocess.run(
            [
                self._binary,
                str(data),
                "--num-iters", str(train_input.iterations),
                "--output", str(ply_path),
            ],
            check=True,
            timeout=train_input.timeout_seconds,
        )
        runtime = time.monotonic() - start

        if not ply_path.exists():
            # OpenSplat sometimes writes to `<data>/splat.ply` instead of
            # honouring --output (depends on the release). Search.
            candidates = list(data.glob("*.ply"))
            if not candidates:
                raise RuntimeError(f"opensplat produced no .ply under {data}")
            ply_path = candidates[0]

        return TrainResult(
            backend=self.name,
            ply_path=ply_path,
            gaussian_count=count_gaussians(ply_path),
            train_seconds=runtime,
            licence=self.licence,
            raw_outputs=(data,),
        )

    def _prepare(self, ti: TrainInput) -> Path:
        data = ti.work_dir / "opensplat_data"
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
