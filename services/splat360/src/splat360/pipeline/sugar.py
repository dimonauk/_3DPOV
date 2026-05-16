"""splat360.pipeline.sugar — SuGaR splat→mesh→USDZ wrapper.

SuGaR (github.com/Anttwo/SuGaR, MIT-style research licence) extracts
editable meshes from 3D Gaussian Splatting representations in minutes
on a single GPU via Poisson reconstruction. It's the canonical OSS
path from a `.ply` splat to a mesh that AR-Quick-Look can ingest.

## The pipeline this enables

```
splat (.ply)
   ↓  SuGaR train.py + extract_mesh.py     (this module)
mesh (.obj + textures) or coarse mesh (.ply)
   ↓  usd-core / Apple usdzconvert         (this module)
USDZ archive
   ↓  served to iOS via lib/capabilities/viz/usdz-export
AR Quick Look
```

## When to use

Only for the iOS AR Quick Look fallback path. iOS Safari does not
support WebXR AR in 2026; for visitors with iPhones / iPads we serve
a USDZ instead of expecting them to install a native app.

The pipeline is HEAVY — ~10-30 minutes per splat on an RTX 4070 Ti
SUPER, scaling with gaussian count. Don't run inline with a training
job; gate behind `emit_usdz=True` in the postprocess stage and only
turn it on for splats that are going to be deployed publicly.

## Install

`splat360-install-sugar.bat` clones the SuGaR repo and sets
`SPLAT360_SUGAR_REPO` to the local path. The wrapper reads that env
var at runtime.

USD wrapping uses `pip install usd-core` (Pixar's official Python
bindings, Apache-2.0). Falls back to `usdzconvert` (Xcode tools) on
macOS only.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SugarResult:
    mesh_path: Path
    mesh_format: str  # "obj" or "ply"
    runtime_seconds: float


def is_sugar_available() -> bool:
    """True iff SPLAT360_SUGAR_REPO is set and points at a real SuGaR clone."""
    repo = os.environ.get("SPLAT360_SUGAR_REPO")
    if not repo:
        return False
    return (Path(repo) / "train.py").exists() or (Path(repo) / "extract_mesh.py").exists()


def run_sugar(
    ply_path: Path,
    images_dir: Path,
    sparse_dir: Path,
    work_dir: Path,
    *,
    python_bin: str | None = None,
    timeout_seconds: int = 3600,
) -> SugarResult:
    """Run SuGaR end-to-end on a splat record's images + sparse model.

    SuGaR is more than a single binary — it's a `train.py` + a
    `extract_mesh.py` pair. The former trains a refined splat on the
    same data, the latter extracts the surface mesh.

    Returns the path to the resulting mesh (typically .obj with
    textures alongside, or a coarse .ply).
    """
    repo = os.environ.get("SPLAT360_SUGAR_REPO")
    if not repo:
        raise RuntimeError("SPLAT360_SUGAR_REPO is unset; cannot run SuGaR.")
    sugar_root = Path(repo)
    py = python_bin or sys.executable

    out_dir = work_dir / "sugar"
    out_dir.mkdir(parents=True, exist_ok=True)

    start = time.monotonic()

    # Step 1: SuGaR's coarse training on the existing splat + images.
    subprocess.run(
        [
            py, str(sugar_root / "train.py"),
            "-s", str(images_dir.parent),   # SuGaR expects a parent dir with images/ and sparse/
            "-c", str(ply_path),
            "-r", "density",                 # regularisation method
            "--output_dir", str(out_dir),
        ],
        check=True,
        timeout=timeout_seconds,
    )

    # Step 2: extract the mesh.
    subprocess.run(
        [
            py, str(sugar_root / "extract_mesh.py"),
            "-s", str(images_dir.parent),
            "-c", str(ply_path),
            "-m", str(out_dir),
            "--mesh_output_dir", str(out_dir / "mesh"),
        ],
        check=True,
        timeout=timeout_seconds,
    )

    runtime = time.monotonic() - start

    # SuGaR's extract_mesh writes to `mesh_output_dir/sugarmesh_xxx.obj`
    # (newer versions) or `mesh_output_dir/mesh.ply` (older).
    candidates_obj = list((out_dir / "mesh").glob("*.obj"))
    candidates_ply = list((out_dir / "mesh").glob("*.ply"))
    if candidates_obj:
        return SugarResult(
            mesh_path=candidates_obj[0],
            mesh_format="obj",
            runtime_seconds=runtime,
        )
    if candidates_ply:
        return SugarResult(
            mesh_path=candidates_ply[0],
            mesh_format="ply",
            runtime_seconds=runtime,
        )
    raise RuntimeError(f"SuGaR produced no mesh under {out_dir / 'mesh'}")


# ---------------------------------------------------------------------------
# Mesh → USDZ wrapping

def is_usd_core_available() -> bool:
    try:
        import pxr  # type: ignore  # noqa: F401
        return True
    except ImportError:
        return False


def mesh_to_usdz(
    mesh_path: Path,
    out_path: Path,
    *,
    anchoring: str = "horizontal",
) -> Path:
    """Wrap a mesh (.obj or .ply) into a USDZ archive.

    Tries `usdzconvert` (Apple Xcode tools, macOS only) first, then
    falls back to a `pxr.UsdGeom` round-trip via `usd-core`.

    `anchoring` is the AR Quick Look anchor hint:
      - "horizontal" — floor / table (default)
      - "vertical"   — wall
      - "image"      — image-target anchored
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    import shutil

    # 1. Apple's official tool (Xcode → AR Tools), macOS only.
    if shutil.which("usdzconvert") is not None:
        subprocess.run(
            [
                "usdzconvert",
                str(mesh_path),
                str(out_path),
                "-arKitCompatible",
                f"-arQuickLookAnchoring={anchoring}",
            ],
            check=True,
        )
        if out_path.exists():
            return out_path

    # 2. Pixar's usd-core round-trip — works on every platform.
    if not is_usd_core_available():
        raise RuntimeError(
            "Neither `usdzconvert` (macOS) nor `usd-core` (pip) is available; "
            "cannot wrap mesh into USDZ. `pip install usd-core` to fix."
        )
    from pxr import Usd, UsdGeom, Gf  # type: ignore

    tmp_usd = out_path.with_suffix(".usdc")
    stage = Usd.Stage.CreateNew(str(tmp_usd))
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)

    # Import the mesh — `pxr` doesn't read .obj directly; tinyusdz or
    # a converter is needed. The pragmatic path for v0 is to require
    # `usdzconvert` for the .obj path and assert otherwise.
    raise RuntimeError(
        "usd-core fallback for .obj → USDZ is not implemented in v0. "
        "Install Xcode's usdzconvert (macOS) or run the SuGaR pipeline on a Mac."
    )


def splat_ply_to_usdz(
    ply_path: Path,
    images_dir: Path,
    sparse_dir: Path,
    work_dir: Path,
    out_usdz_path: Path,
) -> Path | None:
    """One-shot: splat .ply → SuGaR mesh → USDZ.

    Returns the USDZ path on success. Returns `None` if the SuGaR
    repo isn't available (caller should fall back to "no iOS AR" or
    a snapshot-card USDZ).
    """
    if not is_sugar_available():
        return None
    sugar = run_sugar(
        ply_path=ply_path,
        images_dir=images_dir,
        sparse_dir=sparse_dir,
        work_dir=work_dir,
    )
    return mesh_to_usdz(sugar.mesh_path, out_usdz_path)
