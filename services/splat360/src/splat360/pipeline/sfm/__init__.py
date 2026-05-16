"""splat360.pipeline.sfm — Structure-from-Motion backend registry.

Five backends are wired here. The orchestrator picks one (or runs many
in a comparison) based on:

  1. Which camera model the camera_model decision chose.
  2. Which backends are available on PATH.
  3. The job's explicit `sfm_backends` list, if provided.

Backends:

| Backend       | Models                              | Licence | Strength |
|---------------|-------------------------------------|---------|----------|
| colmap        | PINHOLE, OPENCV_FISHEYE             | BSD-3   | C++ speed; mature SIFT |
| glomap        | PINHOLE, OPENCV_FISHEYE             | BSD-3   | Faster than COLMAP, same data model |
| opensfm       | PINHOLE, SPHERICAL                  | BSD     | Mapillary's; built for 360 |
| hloc          | PINHOLE, OPENCV_FISHEYE             | MIT     | Learned features (SuperPoint/LightGlue) |
| alicevision   | PINHOLE, OPENCV_FISHEYE, SPHERICAL  | MPL-2   | Film-VFX-grade; heavy install |
| realityscan   | PINHOLE                             | free <$1M / proprietary | Quality benchmark; native Radiance Field Transforms export |

"""

from __future__ import annotations

from typing import Iterable

from .base import (
    ColmapModel,
    SfmBackend,
    SfmInput,
    SfmResult,
)
from . import alicevision, colmap, glomap, hloc, opensfm, realityscan


_REGISTRY: dict[str, SfmBackend] = {
    "colmap": colmap.Colmap(),
    "glomap": glomap.Glomap(),
    "opensfm": opensfm.OpenSfm(),
    "hloc": hloc.Hloc(),
    "alicevision": alicevision.AliceVision(),
    "realityscan": realityscan.RealityScan(),
}


def get(name: str) -> SfmBackend:
    if name not in _REGISTRY:
        raise KeyError(f"Unknown SfM backend: {name}. Known: {sorted(_REGISTRY)}")
    return _REGISTRY[name]


def all_backends() -> dict[str, SfmBackend]:
    return dict(_REGISTRY)


def available() -> list[str]:
    """Names of backends whose binaries are on PATH."""
    return sorted(name for name, b in _REGISTRY.items() if b.is_available())


def supporting(model: ColmapModel) -> list[str]:
    """Names of backends that handle a given camera model, in
    registration order."""
    return [name for name, b in _REGISTRY.items() if b.supports(model)]


def pick(
    model: ColmapModel,
    preferred: Iterable[str] | None = None,
) -> SfmBackend:
    """Pick the first available backend that supports `model`,
    honouring a preference list if given."""
    candidates: list[str]
    if preferred is not None:
        candidates = [p for p in preferred if p in _REGISTRY]
    else:
        candidates = list(_REGISTRY.keys())
    for name in candidates:
        b = _REGISTRY[name]
        if b.supports(model) and b.is_available():
            return b
    raise RuntimeError(
        f"No available SfM backend supports {model}. "
        f"Available: {available()}; supporting: {supporting(model)}"
    )


__all__ = [
    "ColmapModel",
    "SfmBackend",
    "SfmInput",
    "SfmResult",
    "get",
    "all_backends",
    "available",
    "supporting",
    "pick",
]
