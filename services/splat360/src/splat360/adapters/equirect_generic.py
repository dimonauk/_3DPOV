"""splat360.adapters.equirect_generic — fallback for non-DJI 360 cameras.

Insta360 X-series, Ricoh Theta, GoPro Max, and any other equirect
source. No DJI telemetry box; GPS lives in standard EXIF if present.

Telemetry quality varies wildly between manufacturers. We extract
what's there and let the SfM stage's GPS-prior path either use it
or ignore it.
"""

from __future__ import annotations

from pathlib import Path

from ..pipeline import metadata as _md


def extract_video_telemetry(mp4: Path) -> list[_md.PoseRecord]:
    """Best-effort: try the DJI extractor; non-DJI files will return
    an empty list rather than error."""
    try:
        return _md.extract_dji_video_telemetry(mp4)
    except Exception:
        return []


def extract_image_gps(image: Path) -> _md.PoseRecord | None:
    return _md.extract_dng_gps(image)


def seed_intrinsics(image_width: int, image_height: int) -> tuple[float, ...]:
    """No intrinsics for SPHERICAL camera model."""
    return ()
