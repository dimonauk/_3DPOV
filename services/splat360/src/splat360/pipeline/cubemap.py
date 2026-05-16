"""splat360.pipeline.cubemap — equirectangular → cubemap reprojection.

Slices an equirectangular (spherical projection, 2:1 aspect) image into
six pinhole faces at 90° FOV. Each output face shares a position with
its siblings and is a normal pinhole camera that any SfM tool accepts.

## Conventions

  - Equirect input: W×H, W = 2H, theta along x (longitude), phi along y
    (latitude). theta=0 at image centre column; phi=0 at image centre row.
  - Face axes: right-handed, looking down -z is "forward".
        px = +X face (right)        nx = -X face (left)
        py = +Y face (up)           ny = -Y face (down)
        pz = +Z face (back)         nz = -Z face (forward)
  - Output face: face_size × face_size, pinhole intrinsics:
        fx = fy = face_size / 2   (90° FOV)
        cx = cy = face_size / 2

## Why this works for SfM

Each face is a valid pinhole image with known intrinsics. Adjacent
faces overlap slightly at the edges (we sample with a tiny FOV
overshoot) so feature matching across face boundaries succeeds. SfM
treats them as six independent cameras at the same physical point —
the bundle adjuster will recover the rig pose from feature matches
alone, or honour a rig constraint if we feed one in.

## Performance

cv2.remap with INTER_LANCZOS4 on a 2048-px face from an 8K equirect:
~30ms on CPU per face. Six faces × ~1800 video frames (one per shot
at 30s capture, 60fps decimated to 1fps) ≈ 5 minutes preprocessing.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import numpy as np

# cv2 is imported lazily to keep import-time light; the module is only
# useful when an actual capture is being processed.

CubeFace = Literal["px", "nx", "py", "ny", "pz", "nz"]
ALL_FACES: tuple[CubeFace, ...] = ("px", "nx", "py", "ny", "pz", "nz")


@dataclass(frozen=True)
class CubeFaceImage:
    face: CubeFace
    image: np.ndarray  # (face_size, face_size, 3) uint8 BGR
    # Pinhole intrinsics for this face. Same for every face produced
    # by the same call to `reproject`.
    fx: float
    fy: float
    cx: float
    cy: float


def _face_direction_grid(
    face: CubeFace,
    face_size: int,
    fov_overshoot: float,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Build (x, y, z) unit-ish vectors for every pixel of a cube face.

    `fov_overshoot` ≥ 1.0 — slight overshoot (e.g. 1.02) widens the
    face FOV beyond 90° so adjacent faces overlap. Helps feature
    matching across face seams.
    """
    # Pixel grid in [-1, 1] across the face, scaled by overshoot.
    span = fov_overshoot
    a = (2.0 * (np.arange(face_size, dtype=np.float32) + 0.5) / face_size - 1.0) * span
    b = (2.0 * (np.arange(face_size, dtype=np.float32) + 0.5) / face_size - 1.0) * span
    # u runs across columns (left→right), v runs across rows (top→bottom).
    u, v = np.meshgrid(a, b, indexing="xy")
    ones = np.ones_like(u)

    if face == "px":
        x, y, z = ones, -v, -u
    elif face == "nx":
        x, y, z = -ones, -v, u
    elif face == "py":
        x, y, z = u, ones, v
    elif face == "ny":
        x, y, z = u, -ones, -v
    elif face == "pz":
        x, y, z = u, -v, ones
    elif face == "nz":
        x, y, z = -u, -v, -ones
    else:
        raise ValueError(f"Unknown cube face: {face}")

    return x, y, z


def reproject_one(
    equirect: np.ndarray,
    face: CubeFace,
    face_size: int,
    fov_overshoot: float = 1.02,
) -> CubeFaceImage:
    """Sample one cube face from an equirect image.

    `equirect` is (H, W, 3) uint8 BGR; W must equal 2H.
    """
    import cv2  # local to keep module-import cheap

    h, w = equirect.shape[:2]
    if w != 2 * h:
        raise ValueError(
            f"Equirect must be 2:1 aspect, got {w}x{h}. "
            "Check the source — Avata 360 / Osmo 360 stitched output is 2:1."
        )

    x, y, z = _face_direction_grid(face, face_size, fov_overshoot)
    r = np.sqrt(x * x + y * y + z * z)
    # theta in [-pi, pi], phi in [-pi/2, pi/2]
    theta = np.arctan2(x, z)
    phi = np.arcsin(np.clip(y / r, -1.0, 1.0))

    # Equirect UV. theta=-pi → u=0; theta=+pi → u=W. phi=+pi/2 → v=0; phi=-pi/2 → v=H.
    u_map = (theta / (2.0 * np.pi) + 0.5) * w
    v_map = (0.5 - phi / np.pi) * h
    u_map = u_map.astype(np.float32)
    v_map = v_map.astype(np.float32)

    face_img = cv2.remap(
        equirect,
        u_map,
        v_map,
        interpolation=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_WRAP,  # theta wraps; phi clips
    )

    # 90° FOV pinhole intrinsics for the un-overshot face. With overshoot,
    # the effective focal length shrinks proportionally because the same
    # angular range is now packed into the same pixel count.
    half_fov = np.pi / 4.0 * fov_overshoot
    f = (face_size / 2.0) / np.tan(half_fov)
    cx = cy = face_size / 2.0

    return CubeFaceImage(face=face, image=face_img, fx=f, fy=f, cx=cx, cy=cy)


def reproject_all(
    equirect: np.ndarray,
    face_size: int = 2048,
    fov_overshoot: float = 1.02,
) -> list[CubeFaceImage]:
    """Sample all six cube faces."""
    return [reproject_one(equirect, face, face_size, fov_overshoot) for face in ALL_FACES]


def reproject_file(
    equirect_path: Path,
    out_dir: Path,
    face_size: int = 2048,
    fov_overshoot: float = 1.02,
    stem: str | None = None,
) -> list[Path]:
    """Read an equirect image file, write six cube face JPEGs.

    Output naming: `{stem}_{face}.jpg`, where stem defaults to the
    input filename without extension. Returns the six output paths in
    ALL_FACES order.
    """
    import cv2  # local

    equirect = cv2.imread(str(equirect_path), cv2.IMREAD_COLOR)
    if equirect is None:
        raise RuntimeError(f"Failed to read equirect image: {equirect_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    stem = stem or equirect_path.stem
    out_paths: list[Path] = []
    for cf in reproject_all(equirect, face_size, fov_overshoot):
        out_path = out_dir / f"{stem}_{cf.face}.jpg"
        cv2.imwrite(str(out_path), cf.image, [cv2.IMWRITE_JPEG_QUALITY, 95])
        out_paths.append(out_path)
    return out_paths


def face_intrinsics(face_size: int, fov_overshoot: float = 1.02) -> tuple[float, float, float, float]:
    """Return (fx, fy, cx, cy) for a face produced with these params.

    Useful for writing COLMAP cameras.txt entries without instantiating
    a full face image.
    """
    half_fov = np.pi / 4.0 * fov_overshoot
    f = (face_size / 2.0) / np.tan(half_fov)
    cx = cy = face_size / 2.0
    return f, f, cx, cy
