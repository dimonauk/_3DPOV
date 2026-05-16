"""splat360.adapters.avata360 — DJI Avata 360 specifics.

## Sensor

Two 64MP 1/1.1" CMOS, f/1.9, ~200° FOV per lens. Pixel pitch 2.4 μm.
In 360 mode the lenses rotate so one points up and one points down;
in single-lens mode one lens faces forward. We only care about 360
mode here.

## Files

  - **RAW stills**: two DNG files per shot, time-correlated. Pre-stitch.
  - **JPEG stills**: 120MP equirect, in-camera stitched.
  - **Video**: H.265 MP4 at 8K60 (360 mode) or 4K60 (single-lens).
    Telemetry is embedded in the MP4 itself (not as SRT).

## Fisheye prior

Initial OPENCV_FISHEYE intrinsics seeded for a 200° FOV lens at
sensor full-width. COLMAP / hloc / AliceVision refine during BA.

Sensor width 9.07mm (1/1.1" CMOS), 200° FOV equivalent:
  fx ≈ fy ≈ image_width / (2 * tan(100°))  (negative for super-wide)
For OPENCV_FISHEYE the model handles it via the k1..k4 distortion;
we seed fx=fy=image_width/2 and let the solver pull it in.
"""

from __future__ import annotations

from pathlib import Path

from ..pipeline import metadata as _md


# Seed intrinsics for OPENCV_FISHEYE on Avata 360 pre-stitch DNG.
# Filled in once we have a calibrated capture; foundation values below.
SEED_FISHEYE_INTRINSICS_PIXELS_PER_HALFWIDTH = 0.5  # fx = width * this
SEED_FISHEYE_DISTORTION = (0.0, 0.0, 0.0, 0.0)      # k1..k4


def extract_video_telemetry(mp4: Path) -> list[_md.PoseRecord]:
    """Delegate to the generic DJI telemetry extractor."""
    return _md.extract_dji_video_telemetry(mp4)


def extract_dng_gps(dng: Path) -> _md.PoseRecord | None:
    """Read GPS from one Avata 360 DNG."""
    return _md.extract_dng_gps(dng)


def seed_intrinsics(image_width: int, image_height: int) -> tuple[float, ...]:
    """(fx, fy, cx, cy, k1, k2, k3, k4) seed for OPENCV_FISHEYE."""
    f = image_width * SEED_FISHEYE_INTRINSICS_PIXELS_PER_HALFWIDTH
    return (
        f, f,
        image_width / 2.0, image_height / 2.0,
        *SEED_FISHEYE_DISTORTION,
    )
