# Local 360 Capture Inventory — Sovereign-PC

Snapshot of what's on disk as of probe-run 2026-05-15. Drives
the choice of validation material for splat360 Phase 2.

## Headline counts

| Extension | Count | Camera | Drive |
| --- | --- | --- | --- |
| `.OSV` | 106 | DJI Avata 360 + DJI Osmo 360 (mix) | E:\ |
| `.LRF` | 94 | DJI proxy (matched to .OSV) | E:\ |
| `.SRT` | ~50 | DJI telemetry sidecars | E:\ |
| `.DNG` | 1 | DJI Osmo 360 RAW still | E:\ |
| `.insv` | 1 | Insta360 video | D:\ |
| `.insp` | 3 | Insta360 photo | C:\OneDrive |
| `.360` | 0 | (no GoPro MAX footage) | — |
| `.gpr` | 0 | (no GoPro RAW) | — |

## Where it lives

### `E:\Video\` — main DJI 360 capture root

Mostly flat-file storage of `.OSV` + `.LRF` + `.SRT` triples. Mix of
two cameras distinguishable by filename prefix:

- **`DJI_<ts>_<id>_D.*`** → DJI Avata 360 (flight)
- **`CAM_<ts>_<id>_D.*`** → DJI Osmo 360 (handheld)

The `_D` suffix means dual-lens / 360 mode (versus single-lens `_F`).

Sample paths:

```text
E:\Video\CAM_20251230183150_0002_D.OSV       (Osmo 360, Dec 2025)
E:\Video\DJI_20260425163803_0005_D.OSV       (Avata 360, Apr 2026)
E:\Video\DJI_20260425163803_0005_D.LRF       (matching proxy)
E:\Video\CAM_20260212151400_0011_D.DNG       (Osmo 360 RAW still)
```

### `E:\Video\Airy\`

DJI Avata 360 flight footage with `.SRT` telemetry sidecars (and
some `.MP4` clips that are likely DJI Studio exports — equirect
stitched output).

### `E:\Video\Cee Cee\` / `Dunster Castle` / `Manchester Convention Centre` / `Taunton`

Project / shoot-named folders. Mix of `.LRF` and edit outputs. Look
inside each for the original `.OSV` if planning to re-process.

### `E:\Video\MiniP\`

`DJI_20260429145623_0002_D.MP4` — single MP4. The `_D` suffix on a
plain `.MP4` (not `.OSV`) is unusual — could be a different DJI cam
(Osmo Pocket 3?) or already-stitched output.

### `E:\Video\Osmo\` and `E:\Video\Osmo 360\`

Curated subsets of the main capture. Some duplication with `E:\Video\`
root.

### `E:\Video\Resolve\DJI Raw\`

`.OSV` + `.LRF` + `.SRT` triples in a DaVinci Resolve project context.

### `E:\Video\Resolve\DJI Studio\`

Numbered subdirs (`7`, `8`, ..., `22`) — DJI Studio working files.
Likely contains intermediate stitched equirect output. Has
`cache/shader/shader_cache.bin` and `deflicker_license/license.bin`.

### `E:\Video\Resolve\Antigravity\Studio\`

Empty `Studio` subdir — Antigravity A1 capture in progress, no
footage yet.

### `D:\Downloads\VID_20251106_103702_057-004.insv`

Single Insta360 X-series video clip in Downloads. The `-004` suffix
suggests this is segment 4 of a longer recording (Insta360 splits
long clips into ~4GB segments).

### `C:\Users\dimon\OneDrive\Documents\DCIM\Camera01\`

Three Insta360 `.insp` stills from August 2025:

```text
IMG_20250825_220130_00_001.insp
IMG_20250825_220130_00_002.insp
IMG_20250825_220130_00_003.insp
```

The OneDrive `DCIM\Camera01` path suggests these were synced from
a phone-paired Insta360.

## Post-reorg layout (2026-05-15)

After running `splat360-reorganize-media.bat`, the unstitched media
lives at:

```text
E:\Video\Unstitched\
  DJI_Avata_360\    7 files (DJI_*_D.OSV / .mov / .MP4)
  DJI_Osmo_360\    51 files (CAM_*_D.OSV / .LRF / .DNG / .JPG)
  Insta360\         (empty — .insv stays in D:\Downloads, .insp in OneDrive)
```

OSV format confirmed as ISO BMFF (`ftyp isom iso2 mp41`) → ffmpeg
opens them directly, no DJI Studio dependency for the splat360 path.

## Validation recommendations

For splat360 Phase 2 (first job — see `install/README.md`), the best
capture to pick:

**Option A (default — proves the wedge)** — pick a short Osmo 360 `.OSV`,
ffmpeg-split into two fisheye streams, feed as path A:

```powershell
# In C:\claude_scripts\:
splat360-prep-test-capture.bat "E:\Video\Unstitched\DJI_Osmo_360\CAM_20251230183150_0002_D.OSV"
splat360-submit-test-job.bat "D:\The_Hangar\engines\splat360\test-captures\CAM_20251230183150_0002_D\job-payload.json"
```

The prep script auto-detects OSV → fisheye-pair mode, splits the
side-by-side dual fisheye via ffmpeg crop, extracts SRT telemetry to
CSV, and writes the job payload. The submit script POSTs and tails
events until the splat lands.

**Option B (easier — no DJI Studio)** — pre-stitch the OSV to equirect
with ffmpeg v360, then cubemap-reproject in the orchestrator:

```powershell
splat360-prep-test-capture.bat "E:\Video\Unstitched\DJI_Osmo_360\CAM_20251230183150_0002_D.OSV" -StitchFirst -Camera osmo360
```

`-StitchFirst` runs `splat360-stitch-osv-to-equirect.ps1` first (pure
ffmpeg v360 dfisheye → equirect, no DJI Studio), then extracts equirect
frames and writes a cubemap-strategy payload.

If you already have a stitched MP4 (from DJI Studio or anywhere else):

```powershell
splat360-prep-test-capture.bat "path\to\stitched.MP4" -Mode equirect -Camera osmo360
```

**Option C (Insta360)** — the `.insv` in `D:\Downloads`:

```powershell
splat360-prep-test-capture.bat "D:\Downloads\VID_20251106_103702_057-004.insv" -Camera insta360-x
```

## What's missing

Cameras with no footage on disk (yet):

- GoPro MAX (`.360`) — useful corpus to test the EAC unwrap path
- Ricoh Theta Z1 / X (`.DNG` dual-fisheye / `.JPG` equirect)
- Kandao (any model)
- Antigravity A1 — folder exists, no captures yet

If you want full backend coverage from real footage, capture one
test clip per camera you own and drop it in `E:\Video\<camera>\`.
