"""splat360.pipeline.frames — FFmpeg frame extraction.

Decimates a video to stills at a target fps. For SfM, 1 fps is plenty
when the camera moves at human walking pace; faster motion or
finer-detail capture warrants higher fps.

Shells out to a system ffmpeg. No bindings, no transcoding library
deps. The frames are emitted as JPEGs at quality 2 (FFmpeg's qscale
2 ≈ JPEG quality ~92).
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ExtractedFrames:
    out_dir: Path
    count: int
    fps: float
    source_video: Path


def extract(
    video: Path,
    out_dir: Path,
    fps: float = 1.0,
    ffmpeg_bin: str = "ffmpeg",
    qscale: int = 2,
) -> ExtractedFrames:
    """Extract frames from `video` into `out_dir/frame_%06d.jpg`.

    Raises CalledProcessError if ffmpeg fails. Returns the count of
    frames written.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    pattern = out_dir / "frame_%06d.jpg"
    cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-loglevel", "warning",
        "-i", str(video),
        "-vf", f"fps={fps}",
        "-q:v", str(qscale),
        str(pattern),
    ]
    subprocess.run(cmd, check=True)

    count = sum(1 for _ in out_dir.glob("frame_*.jpg"))
    if count == 0:
        raise RuntimeError(f"ffmpeg produced no frames from {video}")
    return ExtractedFrames(
        out_dir=out_dir,
        count=count,
        fps=fps,
        source_video=video,
    )


def probe_duration_seconds(video: Path, ffprobe_bin: str = "ffprobe") -> float:
    """Return clip duration in seconds via ffprobe."""
    result = subprocess.run(
        [
            ffprobe_bin,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())
