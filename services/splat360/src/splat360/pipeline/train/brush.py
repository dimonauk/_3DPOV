"""splat360.pipeline.train.brush — Brush (Rust) 3DGS trainer wrapper.

Brush is an MIT-licensed Rust 3DGS trainer that runs on Vulkan / Metal /
DX12 instead of CUDA. Useful for two reasons:

  1. No Python ML stack required — single binary, no CUDA/torch.
  2. Runs on AMD / Apple Silicon / older NVIDIA cards that the gsplat
     stack refuses.

## Invocation

    brush --data <colmap_dir> --output <out_dir> --iters <N>

Brush reads the same COLMAP layout as nerfstudio's COLMAP parser:

    colmap_dir/
        images/
        sparse/0/

Output is `<out_dir>/scene.ply`.

## Camera-model support

Mainline Brush expects pinhole intrinsics. OPENCV_FISHEYE works after
undistortion (Brush does NOT undistort itself, so the caller must do
it — for our use, OPENCV_FISHEYE captures should have been undistorted
upstream or we pick a different trainer).

## Install

  github.com/ArthurBrussee/brush — prebuilt binaries (Win/Mac/Linux),
  or `cargo install brush-cli`.
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, Licence, TrainBackend, TrainInput, TrainResult, count_gaussians, which


class Brush(TrainBackend):
    name = "brush"
    licence: Licence = "commercial-ok"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE"})

    def __init__(self, binary: str = "brush") -> None:
        self._binary = binary

    def is_available(self) -> bool:
        return which(self._binary) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, train_input: TrainInput) -> TrainResult:
        if not self.supports(train_input.camera_model):
            raise ValueError(
                f"brush does not support camera model {train_input.camera_model}; "
                "undistort upstream or pick nerfstudio."
            )
        data = self._prepare(train_input)
        out_dir = train_input.work_dir / "brush_out"
        out_dir.mkdir(parents=True, exist_ok=True)

        start = time.monotonic()
        subprocess.run(
            [
                self._binary,
                "--data", str(data),
                "--output", str(out_dir),
                "--iters", str(train_input.iterations),
            ],
            check=True,
            timeout=train_input.timeout_seconds,
        )
        runtime = time.monotonic() - start

        ply_path = out_dir / "scene.ply"
        if not ply_path.exists():
            # Brush has shipped a few output names across versions; try
            # the alternatives before giving up.
            alts = list(out_dir.glob("*.ply"))
            if not alts:
                raise RuntimeError(f"brush produced no .ply at {out_dir}")
            ply_path = alts[0]

        return TrainResult(
            backend=self.name,
            ply_path=ply_path,
            gaussian_count=count_gaussians(ply_path),
            train_seconds=runtime,
            licence=self.licence,
            raw_outputs=(out_dir,),
        )

    def _prepare(self, ti: TrainInput) -> Path:
        data = ti.work_dir / "brush_data"
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
