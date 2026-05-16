"""splat360.pipeline.camera_model — choose the SfM camera-model path.

This is the load-bearing decision of the whole pipeline. Quality and
SfM cost differ by an order of magnitude across the three paths.

## The three paths

### A. fisheye-pair (OPENCV_FISHEYE)
Two correlated fisheye images per shot with a shared rig position and
fixed relative rotation. COLMAP supports OPENCV_FISHEYE natively;
the rig constraint is enforced post-hoc via image_pair priors.

  Pros: no stitch contamination, honest k1..k4 distortion model,
        2× image count, best quality at the equator.
  Cons: needs RAW DNG pair source.

### B. equirect (SPHERICAL)
One equirect image per shot, spherical bundle adjustment. Mainline
COLMAP does NOT have a SPHERICAL camera model — this path requires
either OpenMVG/hloc (recommended) or a COLMAP fork. When neither is
available, this path falls back to path C internally.

  Pros: simplest input, native to source.
  Cons: tooling complexity; stitch seam present in data.

### C. cubemap (PINHOLE × 6)
Equirect reprojected to six 90° pinhole faces. Each face is a normal
camera; mainline COLMAP works without modification.

  Pros: universal compatibility, mature SfM tooling.
  Cons: 6× image count → O(N²) feature matching is 36× larger.

## Selection rule

The function below is pure — no side effects, no env reads. Decision
order:

  1. Explicit `strategy` other than `auto` → honour it (validated).
  2. Source kind:
       fisheye-pair          → path A
       equirect-{video,image-set}, trainer=brush → path C
                                   (Brush only takes COLMAP/PINHOLE input)
       equirect-{video,image-set}, trainer=gsplat,
           and OpenMVG/hloc available → path B
       equirect-{video,image-set}, otherwise → path C
  3. If trainer requires pinhole input and the chosen path is B,
     upgrade to C.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


CameraPath = Literal["fisheye-pair", "equirect", "cubemap"]
ColmapModel = Literal["OPENCV_FISHEYE", "SPHERICAL", "PINHOLE"]
Trainer = Literal["gsplat", "brush"]
SourceKind = Literal["fisheye-pair", "equirect-video", "equirect-image-set"]
Strategy = Literal["auto", "fisheye-pair", "equirect", "cubemap"]


@dataclass(frozen=True)
class CameraModelDecision:
    path: CameraPath
    colmap_model: ColmapModel
    reason: str


# Trainers that accept non-pinhole COLMAP camera models.
_SPHERICAL_AWARE_TRAINERS: frozenset[Trainer] = frozenset({"gsplat"})


def decide(
    source_kind: SourceKind,
    strategy: Strategy = "auto",
    trainer: Trainer = "gsplat",
    spherical_sfm_available: bool = False,
) -> CameraModelDecision:
    """Pick the camera-model path.

    `spherical_sfm_available`: True iff OpenMVG or hloc with spherical
    support is on PATH. Caller (orchestrator) probes the environment
    and sets this. Pure function otherwise.
    """
    # 1. Honour an explicit override, with a sanity check.
    if strategy == "fisheye-pair":
        if source_kind != "fisheye-pair":
            raise ValueError(
                f"strategy=fisheye-pair requires source.kind=fisheye-pair, got {source_kind}"
            )
        return CameraModelDecision(
            path="fisheye-pair",
            colmap_model="OPENCV_FISHEYE",
            reason="explicit strategy override",
        )
    if strategy == "equirect":
        if not spherical_sfm_available:
            return CameraModelDecision(
                path="cubemap",
                colmap_model="PINHOLE",
                reason="equirect requested but no spherical SfM available; falling back to cubemap",
            )
        return CameraModelDecision(
            path="equirect",
            colmap_model="SPHERICAL",
            reason="explicit strategy override",
        )
    if strategy == "cubemap":
        return CameraModelDecision(
            path="cubemap",
            colmap_model="PINHOLE",
            reason="explicit strategy override",
        )

    # 2. Auto: derive from source.kind, trainer, and env.
    if source_kind == "fisheye-pair":
        return CameraModelDecision(
            path="fisheye-pair",
            colmap_model="OPENCV_FISHEYE",
            reason="fisheye-pair source → highest-quality OPENCV_FISHEYE path",
        )

    # source_kind is one of the equirect variants.
    if trainer not in _SPHERICAL_AWARE_TRAINERS:
        return CameraModelDecision(
            path="cubemap",
            colmap_model="PINHOLE",
            reason=f"trainer={trainer} only accepts pinhole; reprojecting via cubemap",
        )
    if spherical_sfm_available:
        return CameraModelDecision(
            path="equirect",
            colmap_model="SPHERICAL",
            reason="equirect source + spherical-aware SfM + spherical-aware trainer",
        )
    return CameraModelDecision(
        path="cubemap",
        colmap_model="PINHOLE",
        reason="no spherical SfM on PATH; defaulting to cubemap (universally compatible)",
    )
