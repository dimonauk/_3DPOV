"""splat360.pipeline.train.postshot — Jawset Postshot CLI wrapper.

Postshot is a proprietary commercial-friendly 3DGS trainer from Jawset
(jawset.com). Perceptual quality is consistently among the best in
the field; the trade-off is a per-seat licence.

We include it as a quality baseline / commerce-track production
trainer for users who own a Postshot licence.

## Invocation

    postshot-cli.exe train \\
        --input <colmap_dir> \\
        --output <output.psht> \\
        --iterations <N>

`.psht` is Postshot's training-format file. Export to PLY:

    postshot-cli.exe export-ply --input <output.psht> --output <splat.ply>

Both steps are subprocesses.

## Camera-model support

Postshot's CLI accepts COLMAP sparse models in PINHOLE form. We
restrict to PINHOLE here; fisheye captures get undistorted upstream.

## Install

  Default Windows path: C:\\Program Files\\Jawset Postshot\\bin\\postshot-cli.exe
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, Licence, TrainBackend, TrainInput, TrainResult, count_gaussians, which


_DEFAULT_WIN = Path(r"C:\Program Files\Jawset Postshot\bin\postshot-cli.exe")


class Postshot(TrainBackend):
    name = "postshot"
    licence: Licence = "proprietary-licence-required"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE"})

    def __init__(self, binary: str | None = None) -> None:
        if binary is not None:
            self._binary: str | None = binary
        elif _DEFAULT_WIN.exists():
            self._binary = str(_DEFAULT_WIN)
        else:
            self._binary = which("postshot-cli")

    def is_available(self) -> bool:
        return self._binary is not None and Path(self._binary).exists()

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, train_input: TrainInput) -> TrainResult:
        if not self.is_available():
            raise RuntimeError("postshot CLI not installed or not on PATH")
        if not self.supports(train_input.camera_model):
            raise ValueError(
                f"postshot does not support camera model {train_input.camera_model}"
            )
        assert self._binary is not None
        data = self._prepare(train_input)
        out_dir = train_input.work_dir / "postshot_out"
        out_dir.mkdir(parents=True, exist_ok=True)
        psht = out_dir / "scene.psht"
        ply_path = out_dir / "scene.ply"

        start = time.monotonic()
        subprocess.run(
            [
                self._binary, "train",
                "--input", str(data),
                "--output", str(psht),
                "--iterations", str(train_input.iterations),
            ],
            check=True,
            timeout=train_input.timeout_seconds,
        )
        subprocess.run(
            [
                self._binary, "export-ply",
                "--input", str(psht),
                "--output", str(ply_path),
            ],
            check=True,
        )
        runtime = time.monotonic() - start

        if not ply_path.exists():
            raise RuntimeError(f"postshot produced no .ply at {ply_path}")

        return TrainResult(
            backend=self.name,
            ply_path=ply_path,
            gaussian_count=count_gaussians(ply_path),
            train_seconds=runtime,
            licence=self.licence,
            raw_outputs=(out_dir,),
        )

    def _prepare(self, ti: TrainInput) -> Path:
        data = ti.work_dir / "postshot_data"
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
