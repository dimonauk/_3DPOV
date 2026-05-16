#!/usr/bin/env python3
"""batch_cctv.py — Run SHARP-ONNX over the Holoflow CCTV staging tree.

Walks `scripts/cctv-staging/<location>/*.jpg` under the Holoflow site
repo, runs SHARP gaussian-splatting inference for each frame, writes
`<basename>.ply` next to the source. Idempotent on filename — re-running
skips frames that already have a `.ply` result.

GPU-accelerated via onnxruntime's CUDAExecutionProvider when available;
falls back to DML (DirectML, Windows GPU-vendor-neutral) then CPU.
Unlike the stock `inference_onnx.py`, this script loads the InferenceSession
ONCE and reuses it across all frames — for a 90-frame batch this avoids
89 redundant model loads (each ~1.3 GB).

License note: the underlying SHARP model is apple-amlr — research-only.
Outputs are not safe for commercial use. The studio's commercial path is
InstantMesh (Apache-2.0); see scripts/cctv-mesh-batch.ts.

Usage:
    python batch_cctv.py [--staging <path>] [--model <path>] \
        [--limit N] [--decimate 0.5] [--depth-scale 1.0] [--dry-run]
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path


def _add_nvidia_dll_paths() -> list[str]:
    """Add NVIDIA DLLs (CUDA toolkit + cuDNN + cublas + nvrtc) to the
    Windows DLL search path so onnxruntime's CUDA EP can find them.
    Must run BEFORE `import onnxruntime`.

    Two DLL sources are stitched together:
      - the SYSTEM CUDA Toolkit (typically C:\\Program Files\\NVIDIA GPU
        Computing Toolkit\\CUDA\\v12.x\\bin\\) — provides cudart, cublas,
        cublasLt, curand, etc. plus the transitive C++ runtime deps
        onnxruntime's CUDA EP loader needs to resolve.
      - the pip-installed `nvidia-*` packages (nvidia/cudnn/bin/,
        nvidia/cublas/bin/, etc.) — provides cuDNN 9.x which the system
        Toolkit does not bundle.

    Both `add_dll_directory` AND `os.environ["PATH"]` are updated so the
    DLL is findable by every loader (some go through PATH, others go
    through the explicit add_dll_directory list).
    """
    added: list[str] = []

    # System CUDA Toolkit candidates (newest first).
    system_candidates = [
        Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.8/bin"),
        Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6/bin"),
        Path("C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.4/bin"),
    ]
    for cuda_bin in system_candidates:
        if cuda_bin.is_dir() and (cuda_bin / "cublasLt64_12.dll").is_file():
            os.add_dll_directory(str(cuda_bin))
            os.environ["PATH"] = str(cuda_bin) + os.pathsep + os.environ.get("PATH", "")
            added.append(str(cuda_bin))
            break

    # pip-shipped NVIDIA libs (cuDNN especially — system Toolkit lacks this).
    try:
        import importlib

        nvidia_pkg = importlib.import_module("nvidia")
        for ns_root_str in nvidia_pkg.__path__:
            ns_root = Path(ns_root_str)
            for entry in ns_root.iterdir():
                for candidate in (entry / "bin", entry):
                    if candidate.is_dir() and any(
                        candidate.glob("*.dll")
                    ):
                        os.add_dll_directory(str(candidate))
                        os.environ["PATH"] = (
                            str(candidate) + os.pathsep + os.environ.get("PATH", "")
                        )
                        added.append(str(candidate))
                        break
    except (ImportError, FileNotFoundError, OSError):
        pass
    return added


_NVIDIA_DLL_DIRS = _add_nvidia_dll_paths()

import numpy as np  # noqa: E402
import onnxruntime as ort  # noqa: E402

# Import helpers from the local inference script (canonical from HF).
sys.path.insert(0, str(Path(__file__).parent))
from inference_onnx import preprocess_image, export_ply  # noqa: E402

DEFAULT_STAGING = Path("D:/.github/_3DPOV/scripts/cctv-staging")
DEFAULT_MODEL = Path(__file__).parent / "sharp_fp16.onnx"


def make_session(model_path: Path) -> ort.InferenceSession:
    """Build a single InferenceSession with the best available provider."""
    available = ort.get_available_providers()
    preferred: list[str] = []
    if "CUDAExecutionProvider" in available:
        preferred.append("CUDAExecutionProvider")
    if "DmlExecutionProvider" in available:
        preferred.append("DmlExecutionProvider")
    preferred.append("CPUExecutionProvider")

    opts = ort.SessionOptions()
    opts.log_severity_level = 3  # Errors only.
    if _NVIDIA_DLL_DIRS:
        print(f"NVIDIA DLL dirs added: {len(_NVIDIA_DLL_DIRS)}")
    session = ort.InferenceSession(str(model_path), opts, providers=preferred)
    print(f"Available providers: {available}")
    print(f"Selected providers: {session.get_providers()}")
    return session


def unpack_outputs(raw_outputs: list[np.ndarray]) -> dict[str, np.ndarray]:
    """Mirror inference_onnx.run_inference's output-naming behaviour."""
    outputs: dict[str, np.ndarray] = {}
    names = [
        "mean_vectors_3d_positions",
        "singular_values_scales",
        "quaternions_rotations",
        "colors_rgb_linear",
        "opacities_alpha_channel",
    ]
    if len(raw_outputs) == 1:
        concat = raw_outputs[0]
        sizes = [3, 3, 4, 3, 1]
        start = 0
        for name, size in zip(names, sizes):
            outputs[name] = concat[:, :, start : start + size]
            start += size
    elif len(raw_outputs) == 5:
        for name, out in zip(names, raw_outputs):
            outputs[name] = out
    return outputs


def infer_one(
    session: ort.InferenceSession,
    image_path: Path,
    out_path: Path,
    disparity_factor: float,
    decimate: float,
    depth_scale: float,
) -> None:
    """Run inference on one image, write its PLY."""
    image, focal_length_px, image_shape = preprocess_image(image_path)
    inputs = {
        "image": image.astype(np.float32),
        "disparity_factor": np.array([disparity_factor], dtype=np.float32),
    }
    raw = session.run(None, inputs)
    outputs = unpack_outputs(raw)
    export_ply(outputs, out_path, focal_length_px, image_shape, decimate, depth_scale)


def walk_frames(staging: Path):
    """Yield every .jpg in the staging tree.

    Walks both:
      - top-level loose .jpg files (from `cctv-fetch.ts`, which writes
        flat keyed by camera-id + timestamp)
      - per-location subdirectories (from `cctv-download-matched.ts`,
        which groups by HoloWalk location slug)

    Either layout produces a sibling .ply / _std.ply next to the source.
    """
    for entry in sorted(staging.iterdir()):
        if entry.is_file() and entry.suffix.lower() == ".jpg":
            yield entry
        elif entry.is_dir():
            for jpg in sorted(entry.glob("*.jpg")):
                yield jpg


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Batch SHARP-ONNX over Holoflow CCTV stills.",
    )
    parser.add_argument("--staging", type=Path, default=DEFAULT_STAGING)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--limit", type=int, default=None,
                        help="Process at most N frames (across all locations).")
    parser.add_argument("--decimate", type=float, default=1.0,
                        help="Decimation ratio 0..1 (1.0 keeps all gaussians).")
    parser.add_argument("--depth-scale", type=float, default=1.0)
    parser.add_argument("--disparity-factor", type=float, default=1.0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.staging.is_dir():
        print(f"ERROR: staging dir not found: {args.staging}")
        return 1
    if not args.model.is_file():
        print(f"ERROR: ONNX model not found: {args.model}")
        return 1

    frames = list(walk_frames(args.staging))
    if args.limit is not None:
        frames = frames[: args.limit]

    todo = [f for f in frames if not f.with_suffix(".ply").exists()]
    skipped = len(frames) - len(todo)

    print(
        f"{len(frames)} frames found · "
        f"{len(todo)} to process · "
        f"{skipped} already have .ply"
    )

    if args.dry_run:
        for f in todo:
            print(f"  would process: {f.relative_to(args.staging)}")
        return 0
    if not todo:
        print("Nothing to do.")
        return 0

    session = make_session(args.model)

    ok = 0
    fail = 0
    total_bytes = 0
    start = time.time()
    for i, frame in enumerate(todo):
        out = frame.with_suffix(".ply")
        elapsed = time.time() - start
        eta = (elapsed / max(1, i)) * (len(todo) - i) if i > 0 else 0.0
        rel = frame.relative_to(args.staging)
        print(
            f"\n[{i + 1}/{len(todo)}] {rel}  "
            f"elapsed={elapsed:.0f}s  eta={eta:.0f}s",
        )
        t0 = time.time()
        try:
            infer_one(
                session,
                frame,
                out,
                args.disparity_factor,
                args.decimate,
                args.depth_scale,
            )
            size = out.stat().st_size if out.exists() else 0
            total_bytes += size
            ok += 1
            print(f"  OK  {out.name}  {size / 1024:.0f} KB  in {time.time() - t0:.1f}s")
        except Exception as err:
            fail += 1
            print(f"  FAIL  {err}")
            # CUDA EP context corruption (error 700, illegal memory access)
            # poisons the session: every subsequent run().run fails with the
            # same error instantly. Recreate the session so the rest of the
            # batch can proceed. Costs ~3s per recovery (model reload) but
            # turns a cascade failure into a single-frame loss.
            err_str = str(err)
            if "CUDA failure" in err_str or "illegal memory access" in err_str:
                print("  (CUDA context corrupted - recreating InferenceSession)")
                try:
                    del session
                except Exception:
                    pass
                session = make_session(args.model)

    print(
        f"\nDone — {ok} ok, {fail} failed, "
        f"{skipped} skipped (already done), "
        f"{total_bytes / 1024 / 1024:.1f} MB written.",
    )
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
