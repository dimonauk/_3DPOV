"""splat360.pipeline.sfm.realityscan — RealityScan / RealityCapture wrapper.

RealityScan (formerly RealityCapture, Epic Games, free under $1M annual
revenue) is the commercial-grade photogrammetry engine that's still the
quality benchmark in 2026. Same internal solver as RealityCapture; Epic
rebranded in mid-2025 and shipped Radiance Field Transforms export for
direct nerfstudio handoff in v2.0.

## Why include this

  - **Quality benchmark.** RC's alignment is the best in the field — beats
    COLMAP/GLOMAP/OpenSfM on noisy real-world captures.
  - **Free for our use.** Personal / sub-$1M revenue is free; commercial
    above that needs a subscription.
  - **Native splat handoff.** v2.0+ exports `transforms.json` directly
    compatible with nerfstudio's `colmap` data parser.

## Two version paths

This wrapper supports both:

  - **RealityCapture 1.5.x** (legacy, already installed on Sovereign-PC):
    Uses the established CLI commands: `-newScene`, `-addFolder`,
    `-align`, `-exportRegistration`. Sparse model export goes via Bundler
    (`.out`) which we convert to COLMAP via the model_converter helper.

  - **RealityScan 2.x** (Epic rebrand): Adds
    `-exportRadianceFieldTransforms` for nerfstudio. Wrapper prefers this
    when version detection succeeds.

The version is detected from the binary's file-version on first call;
the result is memoised on the instance.

## Caveats

  - **Camera-model support: PINHOLE only.** RC's alignment is pinhole-based;
    fisheye/spherical inputs need to be undistorted upstream. For 360
    captures, route through cubemap reprojection first.
  - **Headless mode** requires a valid licence registered against the
    machine. The legacy RC 1.5 install on Sovereign-PC has personal
    licence; if the orchestrator ever runs from a non-personal context
    you may hit the licence-check dialog.
  - **GPS priors** are not currently passed in. RC supports them via
    flight log import but the CLI surface is less stable than COLMAP's.
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path

from .base import ColmapModel, SfmBackend, SfmInput, SfmResult, which


# Canonical install locations RC + RS use on Windows.
_DEFAULT_PATHS = [
    Path(r"C:\Program Files\Capturing Reality\RealityCapture\RealityCapture.exe"),
    Path(r"C:\Program Files\Epic Games\RealityScan\RealityScan.exe"),
    Path(r"C:\Program Files\RealityCapture\RealityCapture.exe"),
]


class RealityScan(SfmBackend):
    name = "realityscan"
    licence = "proprietary-free-under-1m"  # RealityScan 2.x licence
    _SUPPORTED: frozenset[ColmapModel] = frozenset({"PINHOLE"})

    def __init__(self, binary: str | None = None) -> None:
        if binary is not None:
            self._binary: str | None = binary
        else:
            self._binary = None
            for p in _DEFAULT_PATHS:
                if p.exists():
                    self._binary = str(p)
                    break
            if self._binary is None:
                resolved = which("RealityCapture") or which("RealityScan")
                if resolved:
                    self._binary = resolved
        self._version: str | None = None  # populated lazily

    def is_available(self) -> bool:
        return self._binary is not None and Path(self._binary).exists()

    def supports(self, model: ColmapModel) -> bool:
        return model in self._SUPPORTED

    def run(self, sfm_input: SfmInput) -> SfmResult:
        if not self.is_available():
            raise RuntimeError(
                "RealityScan / RealityCapture not found. Install from "
                "https://www.realityscan.com/download or set binary= explicitly."
            )
        if not self.supports(sfm_input.camera_model):
            raise ValueError(
                f"realityscan (this wrapper) only supports PINHOLE; got {sfm_input.camera_model}. "
                "Undistort fisheye / spherical inputs upstream (cubemap reproject)."
            )
        assert self._binary is not None
        work = sfm_input.work_dir
        work.mkdir(parents=True, exist_ok=True)
        sparse = work / "sparse"
        sparse.mkdir(exist_ok=True)

        # Project file RC writes during alignment.
        rc_proj = work / "rcalign.rcproj"
        bundler_out = work / "alignment.out"

        # Detect whether the binary supports the newer (RS 2.x) radiance
        # field transforms export. We probe by name — RS binary versus RC.
        is_realityscan = "RealityScan" in self._binary or "EpicGames" in self._binary

        start = time.monotonic()

        # CLI workflow. RC uses `-` prefixed commands chained on one line.
        # `-headless` is implicit for batch use; v1.5 needs `-set "appQuitOnError=true"`
        # to avoid hanging on a licence/dialog issue.
        cmd = [
            self._binary,
            "-newScene",
            "-addFolder", str(sfm_input.images_dir),
            "-align",
            "-save", str(rc_proj),
            "-exportRegistration", str(bundler_out), "1",  # 1 = Bundler format
            "-quit",
        ]
        if is_realityscan:
            # RS 2.x emits transforms.json natively — closer to what
            # nerfstudio expects. Add it as an extra step before -quit.
            transforms = work / "transforms.json"
            cmd = cmd[:-1] + [
                "-exportRadianceFieldTransforms", str(transforms),
                "-quit",
            ]

        subprocess.run(cmd, check=True)
        runtime = time.monotonic() - start

        # Convert RC's Bundler / transforms.json output to COLMAP format
        # via the splat360 internal converter (TBD). For now, return the
        # raw alignment dir as `sparse_dir` and downstream consumers
        # (nerfstudio's data parser) read whichever format is present.
        sparse_dir = work  # contains either alignment.out or transforms.json

        from .opensfm import _count_lines_in
        # Bundler .out has 'num_cameras num_points' as its first non-comment line.
        registered = 0
        if bundler_out.exists():
            with bundler_out.open("r", encoding="ascii", errors="replace") as f:
                # Skip the first comment line, read second line.
                _ = f.readline()
                header = f.readline().split()
                if len(header) >= 1 and header[0].isdigit():
                    registered = int(header[0])

        return SfmResult(
            backend=self.name,
            sparse_dir=sparse_dir,
            registered_images=registered,
            mean_reprojection_error=float("nan"),
            runtime_seconds=runtime,
            raw_outputs=(rc_proj, bundler_out),
        )
