"""splat360.pipeline.postprocess — PLY → .splat / .ksplat / .spz / .usdz conversions.

A trained 3DGS is a `.ply` with a specific element/property layout
(the INRIA encoding). Derived formats for mobile / web / iOS delivery:

  - **.splat**  (antimatter15 / mkkellogg) — 32 bytes per gaussian,
    LE binary, no compression. Widely supported.
  - **.ksplat** (mkkellogg "K-Splat") — packed format with optional
    16-bit quantisation. Used by the gaussian-splats-3d viewer.
  - **.spz**    (Niantic, Apache-2.0) — quantised + ZSTD-compressed
    (SPZ 4 uses 6 parallel streams for multicore decode). Roughly
    10× smaller than the equivalent PLY with no perceptible visual
    loss. Target format for mobile delivery.
    github.com/nianticlabs/spz
  - **.usdz**   (Apple, AR Quick Look) — requires splat → mesh first
    (Apple does NOT render gaussian splats natively). SuGaR is the
    OSS path: github.com/Anttwo/SuGaR.

## Conversion strategy

We prefer **one general-purpose converter** (3dgsconverter) over our
own per-format encoders, with the pure-numpy `.splat` writer as a
no-deps fallback:

  - `3dgsconverter` (francescofugazzi/3dgsconverter, MIT) — Python CLI
    that handles .ply ↔ .ksplat ↔ .splat ↔ .spz ↔ SOG ↔ CloudCompare ↔
    Parquet ↔ Compressed PLY in one tool. GPU-accelerated filtering
    (SOR, density). Install: `pip install 3dgsconverter`.
  - `supersplat` CLI (Apache-2.0) — alternative; used for ksplat and
    .glb mesh handoffs.
  - `spz` CLI (Niantic reference) — fallback for SPZ specifically.

If none of the CLIs are on PATH we fall back to:
  - pure-numpy `to_splat()` for `.splat`
  - Skip `.ksplat` and `.spz` (return `None` paths; caller decides
    whether that's a soft failure).

## USDZ path

USDZ generation from a splat is a two-step pipeline:

  1. **Splat → mesh** via SuGaR (`anttwo/sugar`) — Poisson
     reconstruction over the gaussians, ~minutes on a single GPU.
     Outputs `.ply` mesh + textures.
  2. **Mesh → USDZ** via `usd-core` (Pixar's Python bindings) or
     Apple's `usdzconvert` CLI (Xcode tools). Wraps mesh + textures
     into an AR-Quick-Look-compatible archive.

The default implementation here is a stub that returns `None` —
USDZ generation lands when the iOS AR path is prioritised.
"""

from __future__ import annotations

import struct
import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass(frozen=True)
class PostprocessResult:
    ply_path: Path
    splat_path: Path | None
    ksplat_path: Path | None
    spz_path: Path | None
    usdz_path: Path | None
    gaussian_count: int
    # Bytes-on-disk for each output, for delivery-cost reporting.
    bytes: dict[str, int] | None = None


def to_splat(ply_path: Path, out_path: Path) -> Path:
    """Convert a 3DGS PLY to the `.splat` binary format.

    Layout per gaussian (32 bytes LE):
      float32 x, y, z        (12 bytes)
      float32 sx, sy, sz     (12 bytes)  scales (linear, not log)
      uint8   r, g, b, a     ( 4 bytes)  color from SH band 0 + opacity
      uint8   rw, rx, ry, rz ( 4 bytes)  quaternion, sign-encoded to 0..255

    The PLY stores scales in log-space and SH coefficients; we recover
    linear scales and apply the standard SH→RGB transform for band 0.
    """
    verts = _read_3dgs_ply(ply_path)
    n = verts.shape[0]
    out = bytearray(32 * n)

    # SH band 0 → RGB. C0 = 0.28209479177387814.
    c0 = 0.28209479177387814
    r = (verts["f_dc_0"] * c0 + 0.5).clip(0.0, 1.0)
    g = (verts["f_dc_1"] * c0 + 0.5).clip(0.0, 1.0)
    b = (verts["f_dc_2"] * c0 + 0.5).clip(0.0, 1.0)
    a = 1.0 / (1.0 + np.exp(-verts["opacity"]))  # sigmoid

    sx = np.exp(verts["scale_0"])
    sy = np.exp(verts["scale_1"])
    sz = np.exp(verts["scale_2"])

    qw = verts["rot_0"]
    qx = verts["rot_1"]
    qy = verts["rot_2"]
    qz = verts["rot_3"]
    qn = np.sqrt(qw * qw + qx * qx + qy * qy + qz * qz) + 1e-12
    qw, qx, qy, qz = qw / qn, qx / qn, qy / qn, qz / qn

    for i in range(n):
        struct.pack_into(
            "<3f3f4B4B", out, i * 32,
            float(verts["x"][i]), float(verts["y"][i]), float(verts["z"][i]),
            float(sx[i]), float(sy[i]), float(sz[i]),
            int(r[i] * 255), int(g[i] * 255), int(b[i] * 255), int(a[i] * 255),
            int(qw[i] * 127 + 128), int(qx[i] * 127 + 128),
            int(qy[i] * 127 + 128), int(qz[i] * 127 + 128),
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(out)
    return out_path


def _have(binary: str) -> bool:
    import shutil
    return shutil.which(binary) is not None


def convert_via_3dgsconverter(
    ply_path: Path,
    out_path: Path,
    target_format: str,
    binary: str = "3dgsconverter",
) -> Path | None:
    """One-shot conversion via `3dgsconverter` (francescofugazzi, MIT).

    Real package name on disk is `gsconverter` (`pip install
    git+https://github.com/francescofugazzi/3dgsconverter.git`); the CLI
    is exposed as both `3dgsconverter` and `gsconverter`. We default to
    the former because it disambiguates from PlayCanvas's splat-transform.

    `target_format` is one of: `3dgs`, `cc`, `ksplat`, `splat`, `spz`,
    `sog`, `parquet`, `compressed_ply`. The CLI flag is
    `--target_format` (with underscore) — easy to get wrong; verified
    against v0.8.2 in-house 2026-05-15.

    Returns the output path on success, None if the binary is absent.
    """
    if not _have(binary):
        return None
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            binary,
            "--input", str(ply_path),
            "--output", str(out_path),
            "--target_format", target_format,
            "--force",  # idempotent overwrite of an existing output
        ],
        check=True,
    )
    return out_path if out_path.exists() else None


def to_ksplat_via_supersplat(
    ply_path: Path,
    out_path: Path,
    supersplat_binary: str = "supersplat",
) -> Path | None:
    """Best-effort conversion via SuperSplat CLI if installed.

    Returns the output path on success, None if the binary is absent.
    """
    if not _have(supersplat_binary):
        return None
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            supersplat_binary, "convert",
            "--input", str(ply_path),
            "--output", str(out_path),
            "--format", "ksplat",
        ],
        check=True,
    )
    return out_path if out_path.exists() else None


def to_spz_via_cli(
    ply_path: Path,
    out_path: Path,
    spz_binary: str = "spz",
) -> Path | None:
    """Convert PLY → .spz via Niantic's reference CLI when installed.

    The `spz` CLI ships in both the `pip install spz-py` and the
    `npm install @niantic/spz` distributions; either provides a
    `spz convert` command with the same interface. Returns None if
    the binary is absent.
    """
    import shutil
    if shutil.which(spz_binary) is None:
        return None
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Both distributions accept: spz convert <input.ply> <output.spz>
    try:
        subprocess.run(
            [spz_binary, "convert", str(ply_path), str(out_path)],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError:
        # Older spz CLI used flags; try the alternative form.
        subprocess.run(
            [spz_binary, "--input", str(ply_path), "--output", str(out_path)],
            check=True,
        )
    return out_path if out_path.exists() else None


def to_spz_via_python(
    ply_path: Path,
    out_path: Path,
) -> Path | None:
    """Convert PLY → .spz via the spz_py Python binding if importable.

    Falls back gracefully — the import is local so the absence of the
    binding doesn't break import-time.
    """
    try:
        import spz  # type: ignore
    except ImportError:
        return None
    out_path.parent.mkdir(parents=True, exist_ok=True)
    spz.convert_ply(str(ply_path), str(out_path))
    return out_path if out_path.exists() else None


def to_usdz_snapshot_card(
    ply_path: Path,
    out_path: Path,
) -> Path | None:
    """Stub: emit a USDZ "snapshot card" for iOS AR Quick Look fallback.

    Apple's AR Quick Look does NOT render gaussian splats natively. The
    pragmatic fallback is a textured plane that shows a single rendered
    view of the splat at scale.

    Two viable implementations:

    1. Render a thumbnail frame from the .ply via a headless gsplat
       view, wrap in a USDZ via `pxr.UsdGeom` (`usd-core` pip package).
    2. Use SuperSplat's `splat-transform` to mesh the splat, then export
       USDZ via `usd-core` or Apple's `usdzconvert` CLI.

    Both require dependencies we don't ship by default. This function
    returns None when those deps are missing so the caller can fall
    back to "no iOS AR" gracefully.
    """
    try:
        from pxr import Usd, UsdGeom  # type: ignore  # noqa: F401
    except ImportError:
        return None
    # Implementation deferred: needs a thumbnail-render step that
    # itself needs the trained splat to render. Wire when the iOS-AR
    # wedge becomes a priority.
    return None


def run(
    ply_path: Path,
    out_dir: Path,
    *,
    emit_spz: bool = True,
    emit_usdz: bool = False,
) -> PostprocessResult:
    """Produce .splat (always), .ksplat / .spz / .usdz when tooling permits.

    Conversion preference order:

      1. `3dgsconverter` — one CLI, handles all formats. Prefer when present.
      2. `supersplat` CLI — for .ksplat.
      3. `spz` CLI — for .spz.
      4. Pure-numpy `to_splat` — always works, no deps. For .splat only.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = ply_path.stem

    # .splat — try 3dgsconverter first, fall back to pure-numpy.
    splat_path = convert_via_3dgsconverter(
        ply_path, out_dir / f"{stem}.splat", "splat",
    ) or to_splat(ply_path, out_dir / f"{stem}.splat")

    # .ksplat — try 3dgsconverter then supersplat.
    ksplat_path = convert_via_3dgsconverter(
        ply_path, out_dir / f"{stem}.ksplat", "ksplat",
    ) or to_ksplat_via_supersplat(ply_path, out_dir / f"{stem}.ksplat")

    # .spz — try 3dgsconverter then the spz CLI then the Python binding.
    spz_path: Path | None = None
    if emit_spz:
        spz_path = (
            convert_via_3dgsconverter(ply_path, out_dir / f"{stem}.spz", "spz")
            or to_spz_via_cli(ply_path, out_dir / f"{stem}.spz")
            or to_spz_via_python(ply_path, out_dir / f"{stem}.spz")
        )

    # .usdz — pipeline not wired yet; returns None unless SuGaR + USD are set up.
    usdz_path: Path | None = None
    if emit_usdz:
        usdz_path = to_usdz_snapshot_card(ply_path, out_dir / f"{stem}.usdz")

    sizes: dict[str, int] = {"ply": ply_path.stat().st_size}
    if splat_path and splat_path.exists():   sizes["splat"]  = splat_path.stat().st_size
    if ksplat_path and ksplat_path.exists(): sizes["ksplat"] = ksplat_path.stat().st_size
    if spz_path and spz_path.exists():       sizes["spz"]    = spz_path.stat().st_size
    if usdz_path and usdz_path.exists():     sizes["usdz"]   = usdz_path.stat().st_size

    return PostprocessResult(
        ply_path=ply_path,
        splat_path=splat_path,
        ksplat_path=ksplat_path,
        spz_path=spz_path,
        usdz_path=usdz_path,
        gaussian_count=_count_3dgs_vertices(ply_path),
        bytes=sizes,
    )


# ---------------------------------------------------------------------------
# Minimal PLY reader for 3DGS-encoded files.

_DTYPE_MAP = {
    "float": "f4",
    "float32": "f4",
    "double": "f8",
    "uchar": "u1",
    "uint8": "u1",
    "int": "i4",
    "uint": "u4",
    "short": "i2",
    "ushort": "u2",
}


def _read_3dgs_ply(path: Path) -> np.ndarray:
    """Read a 3DGS-encoded binary_little_endian PLY into a structured array."""
    with path.open("rb") as f:
        header_lines: list[bytes] = []
        while True:
            line = f.readline()
            header_lines.append(line)
            if line.strip() == b"end_header":
                break

        n = 0
        fields: list[tuple[str, str]] = []
        for raw in header_lines:
            text = raw.decode("ascii", errors="replace").strip()
            if text.startswith("element vertex"):
                n = int(text.split()[-1])
            elif text.startswith("property"):
                parts = text.split()
                # property <type> <name>
                ptype, pname = parts[1], parts[2]
                fields.append((pname, _DTYPE_MAP.get(ptype, "f4")))

        dt = np.dtype([(name, "<" + tp) for name, tp in fields])
        data = np.frombuffer(f.read(n * dt.itemsize), dtype=dt, count=n)
        return data


def _count_3dgs_vertices(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open("rb") as f:
        for _ in range(64):
            line = f.readline()
            if not line:
                break
            text = line.decode("ascii", errors="replace").strip()
            if text.startswith("element vertex"):
                try:
                    return int(text.split()[-1])
                except (ValueError, IndexError):
                    return 0
            if text == "end_header":
                break
    return 0
