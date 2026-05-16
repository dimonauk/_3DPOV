"""splat360.pipeline.ingest — materialise a submission into a work dir.

The API accepts URLs (Blob, S3, file://). Ingest downloads or copies
them to a per-job working directory in a predictable layout so the
later stages don't care where the source came from.

Layout produced:

    work/{job_id}/
        source/                 raw inputs as received
        frames/                 extracted video frames (if applicable)
        sfm/                    COLMAP working dir
        train/                  trainer working dir
        out/                    final artefacts

This module only fills `source/`.
"""

from __future__ import annotations

import shutil
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


@dataclass(frozen=True)
class IngestedSource:
    """Where each source asset landed on disk."""
    source_dir: Path
    files: list[Path]


def fetch_to(url: str, dest_dir: Path) -> Path:
    """Materialise a single URL into `dest_dir` and return the local
    path. Supports `file://`, `http(s)://`, and bare local paths.

    The filename preserves the URL basename; collisions get a numeric
    suffix.
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    parsed = urlparse(url)

    if parsed.scheme in ("", "file"):
        src = Path(parsed.path if parsed.scheme == "file" else url)
        name = src.name
        dest = _unique_dest(dest_dir / name)
        shutil.copy2(src, dest)
        return dest

    if parsed.scheme in ("http", "https"):
        name = Path(parsed.path).name or "download.bin"
        dest = _unique_dest(dest_dir / name)
        with urllib.request.urlopen(url) as resp, dest.open("wb") as f:
            shutil.copyfileobj(resp, f)
        return dest

    raise ValueError(f"Unsupported URL scheme: {parsed.scheme} ({url})")


def fetch_many(urls: list[str], dest_dir: Path) -> list[Path]:
    return [fetch_to(u, dest_dir) for u in urls]


def fetch_pairs(
    pairs: list[tuple[str, str]],
    dest_dir: Path,
) -> list[tuple[Path, Path]]:
    """Fetch (lens-a, lens-b) DNG pairs preserving the pair order."""
    out: list[tuple[Path, Path]] = []
    for i, (a_url, b_url) in enumerate(pairs):
        a = fetch_to(a_url, dest_dir / f"pair_{i:06d}_a")
        b = fetch_to(b_url, dest_dir / f"pair_{i:06d}_b")
        out.append((a, b))
    return out


def _unique_dest(p: Path) -> Path:
    if not p.exists():
        return p
    stem, suffix = p.stem, p.suffix
    i = 1
    while True:
        candidate = p.with_name(f"{stem}_{i}{suffix}")
        if not candidate.exists():
            return candidate
        i += 1
