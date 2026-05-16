"""splat360.adapters.osmo360 — DJI Osmo 360 specifics.

Handheld dual-lens 360 camera. Same DJI telemetry box format family
as Avata 360 but no flight-controller fields. GPS + IMU present;
no gimbal angles.

Differences from avata360:
  - Ground-level capture — slower pose change rate, simpler IMU prior
  - No flight log to cross-reference
  - Different lens calibration (different module)
"""

from __future__ import annotations

from pathlib import Path

from ..pipeline import metadata as _md


# Seed intrinsics for OPENCV_FISHEYE on Osmo 360 pre-stitch DNG.
SEED_FISHEYE_INTRINSICS_PIXELS_PER_HALFWIDTH = 0.5
SEED_FISHEYE_DISTORTION = (0.0, 0.0, 0.0, 0.0)


def extract_video_telemetry(mp4: Path) -> list[_md.PoseRecord]:
    return _md.extract_dji_video_telemetry(mp4)


def extract_dng_gps(dng: Path) -> _md.PoseRecord | None:
    return _md.extract_dng_gps(dng)


def seed_intrinsics(image_width: int, image_height: int) -> tuple[float, ...]:
    f = image_width * SEED_FISHEYE_INTRINSICS_PIXELS_PER_HALFWIDTH
    return (
        f, f,
        image_width / 2.0, image_height / 2.0,
        *SEED_FISHEYE_DISTORTION,
    )
