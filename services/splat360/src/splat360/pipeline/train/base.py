"""splat360.pipeline.train.base — common training types."""

from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Protocol, runtime_checkable


ColmapModel = Literal["OPENCV_FISHEYE", "SPHERICAL", "PINHOLE"]
Licence = Literal["commercial-ok", "research-only", "proprietary-licence-required"]


@dataclass(frozen=True)
class TrainInput:
    images_dir: Path
    sparse_dir: Path             # COLMAP-format sparse model (from any SfM backend)
    work_dir: Path
    camera_model: ColmapModel    # what the sparse model uses
    iterations: int = 30_000
    timeout_seconds: int = 10_800
    gpu_index: int = 0


@dataclass(frozen=True)
class TrainResult:
    backend: str
    ply_path: Path
    gaussian_count: int
    train_seconds: float
    licence: Licence             # the trainer's, not the output's
    raw_outputs: tuple[Path, ...] = ()


@runtime_checkable
class TrainBackend(Protocol):
    name: str
    licence: Licence

    def is_available(self) -> bool: ...

    def supports(self, model: ColmapModel) -> bool: ...

    def run(self, train_input: TrainInput) -> TrainResult: ...


def which(binary: str) -> str | None:
    return shutil.which(binary)


def count_gaussians(ply_path: Path) -> int:
    """Read PLY header to recover the element vertex count.

    Cheaper than loading the whole file when we just want the count.
    """
    if not ply_path.exists():
        return 0
    with ply_path.open("rb") as f:
        for _ in range(64):
            line = f.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace").strip()
            if text.startswith("element vertex"):
                try:
                    return int(text.split()[-1])
                except (ValueError, IndexError):
                    return 0
            if text == "end_header":
                break
    return 0
