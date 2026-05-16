"""splat360.pipeline.sfm.opensfm — Mapillary's OpenSfM wrapper.

OpenSfM is BSD-licensed Python SfM, used in production at Mapillary
on planet-scale street-level 360 imagery. The spherical solver has
been hardened on millions of clips. For path B (equirect SPHERICAL),
this is the recommended backend.

## Pipeline

OpenSfM operates on a "dataset" directory:

    dataset/
        images/                 the input images
        config.yaml             camera_model + params + flags
        camera_models.json      per-camera intrinsics

CLI invocations (each is a subprocess):

    opensfm extract_metadata <dataset>
    opensfm detect_features <dataset>
    opensfm match_features <dataset>
    opensfm create_tracks <dataset>
    opensfm reconstruct <dataset>
    opensfm export_colmap <dataset>     # → dataset/colmap_export/

The COLMAP export is what we hand to trainers downstream.

## Camera models

OpenSfM supports `spherical`, `perspective`, `fisheye`, `dual` (a
fisheye + spherical hybrid), and others. We map:

    PINHOLE         → opensfm projection_type=perspective
    SPHERICAL       → opensfm projection_type=spherical

OPENCV_FISHEYE is NOT supported by this wrapper (use COLMAP / hloc /
AliceVision for path A).

## Install

  pip install opensfm  # may need libceres + boost on Linux
  # On Windows, OpenSfM has historically been painful; running it
  # under WSL is the path of least resistance.
"""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

from .base import ColmapModel, SfmBackend, SfmInput, SfmResult, which


class OpenSfm(SfmBackend):
    name = "opensfm"
    licence = "BSD-2-Clause"
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE", "SPHERICAL"})

    def __init__(self, binary: str = "opensfm") -> None:
        self._binary = binary

    def is_available(self) -> bool:
        return which(self._binary) is not None

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, sfm_input: SfmInput) -> SfmResult:
        if not self.supports(sfm_input.camera_model):
            raise ValueError(
                f"opensfm does not support camera model {sfm_input.camera_model}"
            )

        dataset = sfm_input.work_dir / "opensfm_dataset"
        (dataset / "images").mkdir(parents=True, exist_ok=True)
        # Symlink — OpenSfM reads from dataset/images/.
        for img in sfm_input.images_dir.iterdir():
            target = dataset / "images" / img.name
            if not target.exists():
                try:
                    target.symlink_to(img)
                except OSError:
                    # Windows w/o symlink privilege — fall back to copy.
                    import shutil
                    shutil.copy2(img, target)

        # Per-camera-model config + intrinsics.
        if sfm_input.camera_model == "SPHERICAL":
            config = {"processes": 8, "use_exif_size": False}
            cameras = {
                "v2 generic spherical 1 1 spherical": {
                    "projection_type": "spherical",
                    "width": sfm_input.image_width,
                    "height": sfm_input.image_height,
                }
            }
        else:  # PINHOLE
            fx, fy, cx, cy = sfm_input.camera_params[:4]
            config = {"processes": 8, "use_exif_size": False}
            cameras = {
                "v2 generic perspective 1 1 perspective": {
                    "projection_type": "perspective",
                    "width": sfm_input.image_width,
                    "height": sfm_input.image_height,
                    "focal": fx / sfm_input.image_width,  # OpenSfM's normalised focal
                    "k1": 0.0,
                    "k2": 0.0,
                }
            }
        (dataset / "config.yaml").write_text(
            "\n".join(f"{k}: {v}" for k, v in config.items()),
            encoding="utf-8",
        )
        (dataset / "camera_models_overrides.json").write_text(
            json.dumps(cameras), encoding="utf-8",
        )

        start = time.monotonic()
        for stage in ("extract_metadata", "detect_features", "match_features",
                      "create_tracks", "reconstruct", "export_colmap"):
            subprocess.run([self._binary, stage, str(dataset)], check=True)
        runtime = time.monotonic() - start

        export = dataset / "colmap_export"
        if not export.exists():
            raise RuntimeError(
                f"opensfm export_colmap produced no output at {export}"
            )

        registered = _count_lines_in(export / "images.txt", header_only=True)
        return SfmResult(
            backend=self.name,
            sparse_dir=export,
            registered_images=registered,
            mean_reprojection_error=float("nan"),
            runtime_seconds=runtime,
            raw_outputs=(dataset,),
        )


def _count_lines_in(path: Path, header_only: bool = False) -> int:
    if not path.exists():
        return 0
    n = 0
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.split()
            if header_only:
                # Image header rows start with an integer image id and
                # have 10 columns (QW QX QY QZ TX TY TZ CAMERA_ID NAME).
                if len(parts) >= 10 and parts[0].isdigit():
                    n += 1
            else:
                n += 1
    return n
