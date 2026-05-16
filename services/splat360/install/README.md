# splat360 — Install

All install scripts live in `C:\claude_scripts\` (Hangar convention).
Each `.ps1` has a double-clickable `.bat` next to it. Logs land in
`D:\The_Hangar\logs\`.

## One-shot

Double-click **`C:\claude_scripts\splat360-install-all.bat`**.

Runs the seven steps below in order. Each child script self-elevates
if it needs to (only `splat360-install-system-deps.ps1` does — winget
in elevated context). The orchestrator passes `-NoPause` so it drives
the whole flow without waiting on keystrokes between steps.

## Step by step

| # | Script | Elevation | What it does |
| --- | --- | --- | --- |
| 1 | `splat360-probe.bat` | none | Lists what's already installed. Read-only. |
| 2 | `splat360-install-system-deps.bat` | admin | `winget install` FFmpeg + ExifTool. Falls back to direct download for ExifTool if winget fails. |
| 3 | `splat360-install-colmap.bat` | user | Latest COLMAP Windows-CUDA zip → `D:\Tools\splat360-deps\colmap\` → user PATH. |
| 4 | `splat360-install-glomap.bat` | user | Same flow for GLOMAP. Needs COLMAP installed first. |
| 5 | `splat360-install-brush.bat` | user | Same flow for Brush. |
| 6 | `splat360-install-python-env.bat` | user | Creates `.venv` in the repo with Python 3.12, detects CUDA, installs matching torch, installs splat360 (editable) and nerfstudio. |
| 7 | `splat360-install-3dgsconverter.bat` | user | `pip install 3dgsconverter` into the splat360 venv. One CLI for `.ply ↔ .ksplat ↔ .splat ↔ .spz ↔ SOG`. Primary format converter for the postprocess stage. |
| 8 | `splat360-install-opensplat.bat` | user | Latest OpenSplat Windows-CUDA zip → `D:\Tools\splat360-deps\opensplat\` → user PATH. Fifth trainer backend, no CUDA-Python dep. |
| 9 | `splat360-install-opensfm.bat` | user | Pulls Mapillary's OpenSfM Docker image and writes a Windows-path-translating wrapper to `D:\Tools\splat360-deps\opensfm\`. Requires Docker Desktop running. |
| 10 | `splat360-install-hloc.bat` | user | Creates a sidecar venv at `.venv-hloc\`, installs torch + pycolmap + hloc. Persists `SPLAT360_HLOC_PYTHON` user env var so the main service can find it. |
| 11 | `splat360-install-alicevision.bat` | user | Downloads Meshroom standalone (~5 GB) and adds `meshroom_batch.exe` to user PATH. Uses Meshroom's built-in `--pipeline photogrammetry` (no custom graph needed). |
| 12 | `splat360-install-sugar.bat` | user | Clones SuGaR (`Anttwo/SuGaR`) for the splat→mesh→USDZ pipeline. Persists `SPLAT360_SUGAR_REPO`. The diff-gaussian-rasterization CUDA submodule needs a manual build from a Visual Studio Build Tools shell — instructions logged. |
| 13 | `splat360-verify.bat` | user | Starts the service on 8390, hits `/health`, reports the live list of backends, stops the service. |

## Install locations

- **Service repo**: `D:\The_Hangar\engines\splat360\`
- **Service venv**: `D:\The_Hangar\engines\splat360\.venv\`
- **Downloaded tools**: `D:\Tools\splat360-deps\{colmap, glomap, brush, exiftool}\`
- **Logs**: `D:\The_Hangar\logs\splat360-*.log`
- **PATH entries added**: user-scoped only (no system PATH modification)

## What still needs manual install

These need either a paid licence or research-only acceptance — the
scripts will not attempt them:

- **Postshot** — proprietary, requires a Jawset Postshot licence. Default expected path:
  `C:\Program Files\Jawset Postshot\bin\postshot-cli.exe`.
- **Inria 3DGS reference** — research-only licence. Clone
  `github.com/graphdeco-inria/gaussian-splatting` and build the
  CUDA submodules manually, then set `SPLAT360_INRIA_3DGS_REPO`
  to the repo path. Outputs are quality-comparison oracle only;
  never used on commerce surfaces.

## Per-backend caveats

- **OpenSfM (Docker)** — the wrapper translates only paths under `D:\`
  (mounts `D:\:/mnt/d` into the container). Keep splat360's `work_root`
  on `D:\`. Other drives need a wrapper edit.
- **hloc** — lives in a sidecar venv to avoid fighting nerfstudio's
  torch pins. The main service finds it via `SPLAT360_HLOC_PYTHON`
  (set automatically by the installer). Reset that env var if you
  move the venv.
- **AliceVision** — this wrapper uses the built-in `photogrammetry`
  pipeline, which is PINHOLE-only. Fisheye and spherical paths need
  a custom Meshroom `.mg` graph (v2 concern).
- **OpenSplat (AGPL-3.0)** — outputs (the `.ply`) are commercially
  usable; the binary itself carries copyleft when redistributed.
  Service-only use (we run it on our bench, visitors get the splats)
  is fine. Don't bundle the binary with anything we ship publicly.
- **SuGaR (research licence)** — the trainer is research-only.
  Extracted meshes are usable for the iOS USDZ fallback path on the
  HoloWalk trail (Dimona's own captures, not commerce-track).
  Diff-gaussian-rasterization needs a manual CUDA build from a
  VS Build Tools shell — `pip install ./submodules/diff-gaussian-rasterization`.
- **3dgsconverter** — the splat360 postprocess stage tries this CLI
  first for every format, falls back to per-format converters
  (pure-numpy `.splat`, `spz` CLI, `supersplat`) when it's absent.
  Strongly recommended even though it's "optional".

## Adopted OSS — credit list

splat360 stands on the work of:

- **COLMAP** (BSD-3) — `github.com/colmap/colmap`
- **GLOMAP** (BSD-3) — `github.com/colmap/glomap`
- **OpenSfM** (BSD) — `github.com/mapillary/OpenSfM`
- **hloc** (MIT) — `github.com/cvg/Hierarchical-Localization`
- **AliceVision / Meshroom** (MPL-2.0) — `github.com/alicevision/Meshroom`
- **nerfstudio + gsplat** (Apache-2.0) — `github.com/nerfstudio-project/`
- **Brush** (MIT) — `github.com/ArthurBrussee/brush`
- **OpenSplat** (AGPL-3.0) — `github.com/pierotofy/opensplat`
- **3dgsconverter** (MIT) — `github.com/francescofugazzi/3dgsconverter`
- **Niantic SPZ** (Apache-2.0) — `github.com/nianticlabs/spz`
- **SuGaR** (research) — `github.com/Anttwo/SuGaR`
- **FFmpeg** (LGPL/GPL) — `ffmpeg.org`
- **ExifTool** (Perl/GPL) — `exiftool.org`
- **mkkellogg/GaussianSplats3D** (MIT) — three.js WebXR splat renderer (Holoflow side)

## Troubleshooting

**`/health` is up but `sfm_available` is empty.**
Open a new PowerShell window — installs add to user PATH, but the
currently-running shell still has the old PATH cached.

**nerfstudio install fails on torch version mismatch.**
Run `nvidia-smi`, note the driver version. Edit
`splat360-install-python-env.ps1` and force `$cudaSuffix = "cu118"`
or `"cu121"` manually. Re-run.

**COLMAP install report claims no Windows-CUDA asset in latest release.**
The COLMAP team sometimes ships only the source tag without
pre-builts; pin a known-good earlier release manually by editing
the script.

**winget says it's not recognised.**
Install "App Installer" from the Microsoft Store and re-run.
