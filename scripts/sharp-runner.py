#!/usr/bin/env python3
"""
sharp-runner.py

Step 2 of the local SHARP pipeline. Iterates over every staged image
(.jpg / .png) that does not already have a matching .ply in the output
directory and runs Apple SHARP inference against each one, writing a
.ply gaussian-splat reconstruction plus a sidecar .meta.json.

Important: this script does NOT vendor SHARP itself. You must install
SHARP per the upstream README at https://github.com/apple/ml-sharp,
and either pip-install it into the same environment this script runs
in, or set --sharp-repo to the path of a local checkout so we can add
it to sys.path.

The actual SHARP inference call below is a thin extrapolation from the
public README and the model card at huggingface.co/apple/Sharp. If
SHARP's exposed API differs from the call sketched here, edit
`run_sharp_inference` in this file — the rest of the orchestration
(progress, sidecar metadata, idempotency, PLY point count) does not
change.

Run:
    python scripts/sharp-runner.py \
        --staging ./tmp/staging \
        --output ./tmp/splats \
        --sharp-repo /path/to/ml-sharp \
        --model apple/Sharp

Python 3.12. See scripts/requirements.txt.
"""

from __future__ import annotations

import argparse
import json
import os
import struct
import sys
import time
import traceback
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


IMAGE_EXTS = {".jpg", ".jpeg", ".png"}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Batch-run Apple SHARP over staged CCTV / 360 stills."
    )
    parser.add_argument(
        "--staging",
        required=True,
        type=Path,
        help="Input directory of staged .jpg/.png frames.",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Output directory for .ply gaussian-splat files.",
    )
    parser.add_argument(
        "--sharp-repo",
        type=Path,
        default=None,
        help=(
            "Optional path to a local clone of apple/ml-sharp. If given, "
            "it is prepended to sys.path before importing SHARP."
        ),
    )
    parser.add_argument(
        "--model",
        default="apple/Sharp",
        help="SHARP checkpoint id or local path. Default: apple/Sharp.",
    )
    parser.add_argument(
        "--device",
        default=None,
        help="Torch device, e.g. cuda, cuda:0, cpu. Default: auto-detect.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional cap on number of images this run.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-run SHARP even if a .ply already exists for an input.",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Discovery & idempotency
# ---------------------------------------------------------------------------


def find_pending(
    staging: Path, output: Path, force: bool
) -> list[Path]:
    if not staging.exists():
        return []
    pending: list[Path] = []
    for p in sorted(staging.iterdir()):
        if not p.is_file():
            continue
        if p.suffix.lower() not in IMAGE_EXTS:
            continue
        ply_path = output / (p.stem + ".ply")
        if ply_path.exists() and not force:
            continue
        pending.append(p)
    return pending


# ---------------------------------------------------------------------------
# PLY introspection
# ---------------------------------------------------------------------------


def read_ply_point_count(ply_path: Path) -> int | None:
    """Parse the PLY header and return the vertex element count.

    Works for both ASCII and binary PLY files. Returns None if the
    header cannot be parsed.
    """
    try:
        with open(ply_path, "rb") as fh:
            # PLY files start with the ASCII magic 'ply\n'
            magic = fh.readline().strip()
            if magic != b"ply":
                return None
            for _ in range(256):  # generous header line budget
                line = fh.readline()
                if not line:
                    return None
                txt = line.strip().decode("ascii", errors="ignore")
                if txt.startswith("element vertex "):
                    parts = txt.split()
                    if len(parts) >= 3 and parts[2].isdigit():
                        return int(parts[2])
                if txt == "end_header":
                    return None
        return None
    except OSError:
        return None


# ---------------------------------------------------------------------------
# SHARP inference
# ---------------------------------------------------------------------------


@dataclass
class SharpRuntime:
    model_id: str
    device: str
    sharp_version: str
    # Opaque handle returned by SHARP's load function. Typed loosely so
    # this script keeps importing even if the user has not yet installed
    # SHARP — the actual inference call will raise a clear error.
    model: object


def load_sharp(model_id: str, device: str | None, sharp_repo: Path | None) -> SharpRuntime:
    """Load SHARP. Adjust the import path here to match the upstream API.

    Per the upstream README at apple/ml-sharp, the expected entry
    points are roughly:

        from sharp import SharpPipeline
        pipe = SharpPipeline.from_pretrained("apple/Sharp")
        pipe.to(device)
        ply_bytes = pipe.infer(image)  # or pipe(image)

    If SHARP's actual surface differs, change the body of this
    function and `run_sharp_inference` below.
    """
    if sharp_repo is not None:
        sys.path.insert(0, str(sharp_repo.resolve()))

    try:
        import torch  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "torch is not installed in this environment. "
            "Install per scripts/requirements.txt."
        ) from exc

    chosen_device = device or ("cuda" if torch.cuda.is_available() else "cpu")

    try:
        # Imported lazily so the script can at least show --help even if
        # SHARP is not installed yet.
        from sharp import SharpPipeline  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "Could not import the `sharp` package. Either pip-install "
            "Apple SHARP into this environment, or pass --sharp-repo "
            "pointing at a local clone of github.com/apple/ml-sharp."
        ) from exc

    pipeline = SharpPipeline.from_pretrained(model_id)
    pipeline.to(chosen_device)

    sharp_version = getattr(pipeline, "version", None) or model_id

    return SharpRuntime(
        model_id=model_id,
        device=chosen_device,
        sharp_version=str(sharp_version),
        model=pipeline,
    )


def run_sharp_inference(rt: SharpRuntime, image_path: Path, output_ply: Path) -> None:
    """One image -> one .ply on disk. Edit if SHARP's signature differs."""
    from PIL import Image  # type: ignore

    image = Image.open(image_path).convert("RGB")

    # Common shape in the SHARP README: pipeline returns a result object
    # with a `save_ply` method, or returns raw bytes. Try both.
    pipe = rt.model
    result = pipe(image) if callable(pipe) else pipe.infer(image)  # type: ignore[operator]

    if hasattr(result, "save_ply"):
        result.save_ply(str(output_ply))
        return
    if isinstance(result, (bytes, bytearray)):
        output_ply.write_bytes(bytes(result))
        return
    # Last resort: a dict {"ply": <bytes>}
    if isinstance(result, dict) and "ply" in result and isinstance(result["ply"], (bytes, bytearray)):
        output_ply.write_bytes(bytes(result["ply"]))
        return

    raise RuntimeError(
        "SHARP inference returned an unexpected shape. "
        "Edit run_sharp_inference() in scripts/sharp-runner.py to "
        "match your installed SHARP version."
    )


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------


def write_sidecar(
    output_ply: Path,
    source_image: Path,
    sharp_version: str,
    runtime_seconds: float,
    point_count: int | None,
) -> None:
    meta = {
        "sourceImage": str(source_image),
        "sourceImageBasename": source_image.name,
        "sharpVersion": sharp_version,
        "runtimeSeconds": round(runtime_seconds, 3),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "splatPointCount": point_count,
    }
    sidecar = output_ply.with_suffix(".meta.json")
    sidecar.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    staging: Path = args.staging
    output: Path = args.output
    output.mkdir(parents=True, exist_ok=True)

    pending = find_pending(staging, output, args.force)
    if args.limit is not None:
        pending = pending[: args.limit]

    print(f"sharp-runner: {len(pending)} image(s) pending in {staging}")
    if not pending:
        return 0

    try:
        rt = load_sharp(args.model, args.device, args.sharp_repo)
    except Exception as exc:
        print(f"sharp-runner: could not load SHARP — {exc}", file=sys.stderr)
        return 2

    print(f"sharp-runner: model={rt.model_id} device={rt.device} version={rt.sharp_version}")

    succeeded = 0
    failed = 0

    for idx, image_path in enumerate(pending, 1):
        output_ply = output / (image_path.stem + ".ply")
        t0 = time.monotonic()
        print(f"[{idx}/{len(pending)}] {image_path.name} -> {output_ply.name} ... ", end="", flush=True)
        try:
            run_sharp_inference(rt, image_path, output_ply)
            elapsed = time.monotonic() - t0
            pc = read_ply_point_count(output_ply)
            write_sidecar(output_ply, image_path, rt.sharp_version, elapsed, pc)
            pc_label = f"{pc} pts" if pc is not None else "pts:?"
            print(f"ok ({elapsed:.1f}s, {pc_label})")
            succeeded += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            elapsed = time.monotonic() - t0
            print(f"FAILED after {elapsed:.1f}s: {exc}")
            traceback.print_exc(file=sys.stderr)

    print(f"sharp-runner: done. succeeded={succeeded} failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
