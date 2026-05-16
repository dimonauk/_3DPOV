"""splat360.pipeline.metadata — extract GPS/IMU from DJI captures.

DJI Avata 360 and Osmo 360 write a custom metadata box to their MP4
output (not SRT, unlike older DJI drones). ExifTool 13+ parses that
box and emits per-sample GPS + IMU records.

For RAW DNG pairs, GPS lives in standard EXIF tags. ExifTool reads
those too.

This module is a thin wrapper. Output is normalised to a `PoseRecord`
list that the SfM stage consumes as priors.
"""

from __future__ import annotations

import csv
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class PoseRecord:
    """One GPS/IMU sample. Any field may be None if the source didn't
    carry it."""
    timestamp_iso: str       # ISO-8601 UTC
    gps_lat: float | None
    gps_lon: float | None
    gps_alt: float | None    # metres above ellipsoid
    gps_hdop: float | None   # horizontal dilution of precision
    gyro_x: float | None     # rad/s
    gyro_y: float | None
    gyro_z: float | None
    image_index: int | None  # if known, the frame this prior applies to


def extract_dji_video_telemetry(
    mp4: Path,
    exiftool_bin: str = "exiftool",
) -> list[PoseRecord]:
    """Pull per-sample telemetry from a DJI MP4.

    Uses the `-ee` (extract embedded) and `-G3:1` (subdocument
    grouping) flags. Returns one PoseRecord per telemetry sample.
    """
    cmd = [
        exiftool_bin,
        "-ee",
        "-G3:1",
        "-api", "LargeFileSupport=1",
        "-json",
        str(mp4),
    ]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    payload = json.loads(result.stdout)
    # ExifTool returns a list of dicts when called with -json; we asked
    # for one file so payload[0] is what we want.
    if not payload:
        return []
    doc = payload[0]

    # ExifTool emits keys like 'Doc1:GPSLatitude', 'Doc2:GPSLatitude', ...
    # one per telemetry sample. We collect by doc-id then build records.
    samples: dict[str, dict[str, str]] = {}
    for key, value in doc.items():
        if ":" not in key:
            continue
        doc_id, tag = key.split(":", 1)
        if not doc_id.startswith("Doc"):
            continue
        samples.setdefault(doc_id, {})[tag] = value

    records: list[PoseRecord] = []
    for doc_id in sorted(samples.keys(), key=lambda k: int(k[3:])):
        s = samples[doc_id]
        records.append(
            PoseRecord(
                timestamp_iso=str(s.get("GPSDateTime") or s.get("SampleTime") or ""),
                gps_lat=_maybe_float(s.get("GPSLatitude")),
                gps_lon=_maybe_float(s.get("GPSLongitude")),
                gps_alt=_maybe_float(s.get("GPSAltitude")),
                gps_hdop=_maybe_float(s.get("GPSHPositioningError")),
                gyro_x=_maybe_float(s.get("GyroX")),
                gyro_y=_maybe_float(s.get("GyroY")),
                gyro_z=_maybe_float(s.get("GyroZ")),
                image_index=None,
            )
        )
    return records


def extract_dng_gps(
    dng: Path,
    exiftool_bin: str = "exiftool",
) -> PoseRecord | None:
    """Pull GPS from a single DNG (or any EXIF-bearing still)."""
    cmd = [
        exiftool_bin,
        "-json",
        "-GPSLatitude",
        "-GPSLongitude",
        "-GPSAltitude",
        "-GPSHPositioningError",
        "-DateTimeOriginal",
        str(dng),
    ]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    payload = json.loads(result.stdout)
    if not payload:
        return None
    s = payload[0]
    if "GPSLatitude" not in s:
        return None
    return PoseRecord(
        timestamp_iso=str(s.get("DateTimeOriginal", "")),
        gps_lat=_maybe_float(s.get("GPSLatitude")),
        gps_lon=_maybe_float(s.get("GPSLongitude")),
        gps_alt=_maybe_float(s.get("GPSAltitude")),
        gps_hdop=_maybe_float(s.get("GPSHPositioningError")),
        gyro_x=None,
        gyro_y=None,
        gyro_z=None,
        image_index=None,
    )


def write_priors_csv(records: list[PoseRecord], out_path: Path) -> Path:
    """Dump priors to CSV for the SfM stage to ingest."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "timestamp_iso",
                "gps_lat", "gps_lon", "gps_alt", "gps_hdop",
                "gyro_x", "gyro_y", "gyro_z",
                "image_index",
            ]
        )
        for r in records:
            w.writerow(
                [
                    r.timestamp_iso,
                    r.gps_lat, r.gps_lon, r.gps_alt, r.gps_hdop,
                    r.gyro_x, r.gyro_y, r.gyro_z,
                    r.image_index,
                ]
            )
    return out_path


def _maybe_float(v: object) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
