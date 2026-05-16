"""splat360.pipeline.sfm.base — common SfM types and helpers.

Every SfM backend exposes the same interface so the orchestrator can
swap them without branching. Differences (binary name, camera-model
support, output format) live behind each backend's `run`.
"""

from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Protocol, runtime_checkable


ColmapModel = Literal["OPENCV_FISHEYE", "SPHERICAL", "PINHOLE"]


@dataclass(frozen=True)
class SfmInput:
    """Inputs every backend agrees on."""
    images_dir: Path
    work_dir: Path                   # backend writes its scratch here
    camera_model: ColmapModel
    # Per-camera intrinsics. For OPENCV_FISHEYE this is (fx, fy, cx, cy,
    # k1, k2, k3, k4). For PINHOLE it's (fx, fy, cx, cy). For SPHERICAL
    # it's empty (the model takes no params; width/height define the
    # projection).
    camera_params: tuple[float, ...]
    image_width: int
    image_height: int
    # Optional GPS / pose priors as a CSV produced by pipeline.metadata.
    priors_csv: Path | None = None
    # Optional rig constraint for fisheye-pair captures. List of
    # (image_a_filename, image_b_filename) pairs that share a position
    # and have a known relative rotation. Backends that understand rig
    # constraints (alicevision, hloc with rig extension) honour this;
    # others ignore it.
    rig_pairs: tuple[tuple[str, str], ...] = ()


@dataclass(frozen=True)
class SfmResult:
    backend: str
    sparse_dir: Path                 # COLMAP-format sparse model
    registered_images: int
    mean_reprojection_error: float
    runtime_seconds: float
    # Backend-native artefacts left in `work_dir` for debugging. Opaque.
    raw_outputs: tuple[Path, ...] = ()


@runtime_checkable
class SfmBackend(Protocol):
    """Each backend file exposes a class with this shape."""
    name: str
    licence: str

    def is_available(self) -> bool:
        """True iff the backend's binary/binaries are on PATH."""
        ...

    def supports(self, model: ColmapModel) -> bool:
        """True iff this backend accepts the given camera model."""
        ...

    def run(self, sfm_input: SfmInput) -> SfmResult:
        """Run SfM. Writes sparse model into sfm_input.work_dir."""
        ...


def which(binary: str) -> str | None:
    """Resolve a binary on PATH (Windows-aware)."""
    return shutil.which(binary)
