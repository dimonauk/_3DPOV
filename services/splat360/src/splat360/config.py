"""splat360.config — environment, paths, and hardware budgets.

Read once at startup. No mutation. Anything tunable per-job belongs in
the job payload, not here.
"""

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class Config:
    # Workspace roots.
    work_root: Path  # transient per-job scratch (frames, colmap dirs)
    out_root: Path   # final artefacts (.ply / .splat / .ksplat)

    # External binaries the pipeline shells out to.
    ffmpeg_bin: str
    exiftool_bin: str
    colmap_bin: str
    glomap_bin: str  # optional; falls back to colmap_bin if absent
    brush_bin: str   # optional; falls back to gsplat/nerfstudio

    # Hardware budgets.
    gpu_index: int               # CUDA device id
    train_timeout_seconds: int   # hard cap per job
    max_image_count: int         # rejected above this

    # --- video → 3D splat (`hangar-gsplat`) settings --------------------
    # These cover the pinhole-video entry point exposed by the
    # `/video3d/jobs` route. Separate budgets from the 360 path because
    # the video pipeline accepts much larger uploads (full clips, not
    # pre-stitched panoramas).
    video_3d_work_root: Path     # per-job scratch for the video pipeline
    video_3d_auth_token: str     # shared bearer; empty disables auth
    video_3d_max_upload_mb: int  # reject videos larger than this
    video_3d_max_duration_seconds: int  # reject clips longer than this
    video_3d_fake_mode: bool     # short-circuit pipeline for tests / CI


def from_env() -> Config:
    """Read the environment. Foundation phase: defaults only, no
    validation beyond presence."""
    work_root = Path(os.environ.get("SPLAT360_WORK", "./work"))
    return Config(
        work_root=work_root,
        out_root=Path(os.environ.get("SPLAT360_OUT", "./out")),
        ffmpeg_bin=os.environ.get("SPLAT360_FFMPEG", "ffmpeg"),
        exiftool_bin=os.environ.get("SPLAT360_EXIFTOOL", "exiftool"),
        colmap_bin=os.environ.get("SPLAT360_COLMAP", "colmap"),
        glomap_bin=os.environ.get("SPLAT360_GLOMAP", "glomap"),
        brush_bin=os.environ.get("SPLAT360_BRUSH", "brush"),
        gpu_index=int(os.environ.get("SPLAT360_GPU", "0")),
        train_timeout_seconds=int(os.environ.get("SPLAT360_TRAIN_TIMEOUT", "10800")),
        max_image_count=int(os.environ.get("SPLAT360_MAX_IMAGES", "3000")),
        video_3d_work_root=Path(
            os.environ.get("SPLAT360_VIDEO_3D_WORK", str(work_root / "video3d"))
        ),
        video_3d_auth_token=os.environ.get("SPLAT_VIDEO_AUTH_TOKEN", ""),
        video_3d_max_upload_mb=int(
            os.environ.get("SPLAT360_VIDEO_3D_MAX_UPLOAD_MB", "4096")
        ),
        video_3d_max_duration_seconds=int(
            os.environ.get("SPLAT360_VIDEO_3D_MAX_DURATION_SECONDS", "600")
        ),
        video_3d_fake_mode=os.environ.get(
            "SPLAT360_VIDEO_3D_FAKE", ""
        ).lower() in {"1", "true", "yes"},
    )
