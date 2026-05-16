# 360 Camera File Formats — Reference

Canonical map of consumer / prosumer 360 cameras and the file
formats they emit. Drives the adapter selection in
`splat360/adapters/`.

Two questions every adapter must answer:

1. **Stitched or unstitched at write-time?** — Affects which
   splat360 camera-model path applies (A fisheye-pair, B spherical,
   C cubemap).
2. **Where does the telemetry live?** — Inline MP4 box, SRT sidecar,
   EXIF on stills, or nowhere.

## Quick-lookup table

| Camera family | Native video | Native photo | Proxy / sidecar | Stitched at write? | Telemetry | splat360 path (best) | Adapter status |
|---|---|---|---|---|---|---|---|
| **DJI Avata 360** | `.OSV` (DJI_*) | `.DNG` pair (rare) / `.JPG` | `.LRF`, `.SRT` | **No** (dual-fisheye in container) | `.SRT` sidecar + MP4 box | A (fisheye-pair) via OSV split | wired (`avata360.py`) |
| **DJI Osmo 360** | `.OSV` (CAM_*) | `.DNG` pair / `.JPG` | `.LRF` | **No** (dual-fisheye) | MP4 box | A (fisheye-pair) via OSV split | wired (`osmo360.py`) |
| **Antigravity A1** | `.MP4` (pending verification) | `.DNG` / `.JPG` | TBD | Likely both modes | TBD | A or B | not wired |
| **Insta360 X4 / X5 / X3 / ONE X / X2 / X3** | `.insv` (dual stream) | `.insp` (dual-fisheye in one file) | `.lrv`, `.thm` | **No** | EXIF + custom INS box | A via Insta360 SDK | not wired |
| **Insta360 ONE R / RS / RS 1-inch** | `.insv` | `.insp` | `.lrv`, `.thm` | No | EXIF + INS box | A | not wired |
| **Insta360 ONE / Nano S** | `.insv` | `.insp` | — | No | EXIF | A | not wired |
| **Insta360 Pro / Pro 2 / Titan** | `.insv` × 6 or 8 (one per lens) | `.dng` × N (per lens RAW) | `.lrv`, `.tnl` | **No** (per-lens streams) | EXIF + Pro metadata | A (multi-lens rig) | not wired |
| **GoPro MAX** | `.360` (EAC dual hemisphere) | `.jpg` (equirect in-camera) + `.gpr` (RAW dual hemisphere) | `.LRV`, `.THM` | **No** (EAC, two hemispheres) | GPMF in MP4 | A via reframe | not wired |
| **GoPro Fusion** | `GPFR<id>.MP4` (front) + `GPBK<id>.MP4` (back) | `GPFR*.jpg` + `GPBK*.jpg` | `.LRV`, `.WAV` audio | **No** (paired files) | GPMF in MP4 | A (paired fisheye) | not wired |
| **Ricoh Theta Z1** | `.MP4` (equirect, in-camera stitched) | `.JPG` (equirect) + `.DNG` (**dual-fisheye in one DNG**) | — | **Photo: No** (DNG) / **Video: Yes** | EXIF + GPMF-ish XMP | A (Z1 DNG) / B (Z1 video) | not wired |
| **Ricoh Theta X** | `.MP4` (equirect) | `.JPG` (equirect) | — | Yes | EXIF | B | not wired |
| **Ricoh Theta V / SC / SC2 / S** | `.MP4` (equirect) | `.JPG` (equirect) | — | Yes | EXIF | B | not wired |
| **Kandao QooCam 8K / 8K Enterprise** | `.mp4` (dual-fisheye side-by-side) | `.jpg` / `.dng` (dual-fisheye) | — | **No** (side-by-side) | EXIF | A via ffmpeg split | not wired |
| **Kandao Obsidian R / S / Pro** | per-camera `.mp4` × 4 or 6 | per-camera `.dng` × N | — | No | EXIF | A (multi-cam rig) | not wired |
| **Kandao QooCam (original 4K)** | `.mp4` dual-fisheye | `.jpg` / `.dng` | — | No | EXIF | A | not wired |
| **Garmin VIRB 360** | paired `.MP4` (front / back) | paired `.JPG` | — | No | GPMF in MP4 | A | not wired |
| **Samsung Gear 360 (2017 / 2016)** | `.mp4` dual-fisheye side-by-side | `.jpg` dual-fisheye | — | No | EXIF | A via ffmpeg split | not wired |
| **LG 360 CAM (R105)** | `.mp4` dual-fisheye | `.jpg` dual-fisheye | — | No | EXIF | A | not wired |
| **Nikon KeyMission 360** | `.mp4` (equirect, in-camera) | `.jpg` (equirect) | — | Yes | EXIF | B | not wired |
| **Pilot Era / Pilot One (Labpano)** | `.mp4` + `.pano` | `.jpg` + `.pano` | — | Mixed | EXIF + .pano sidecar | B (in-camera stitched) | not wired |
| **HumanEyes Vuze / Vuze XR / Vuze+** | per-camera `.mp4` × 8 (Vuze) / 2 (XR) | per-camera `.jpg` | — | No | EXIF | A | not wired |
| **Z CAM K1 Pro / V1 Pro** | `.mp4` / `.mov` (ProRes or H.265) dual-fisheye | `.jpg` / `.dng` | — | No | EXIF | A | not wired |
| **Lenovo Mirage Camera (3D 180°)** | `.mp4` stereo SBS | `.jpg` stereo | — | Yes (stereo, not 360) | EXIF | not 360 — skip | n/a |

## Format detail — the formats you actually have

### `.OSV` (DJI Osmo Smart Video)

The DJI Avata 360 and Osmo 360 native container for dual-fisheye 360
mode. ISO BMFF (MP4-family) with custom DJI boxes identifying it as
unstitched dual-fisheye. The two lens streams may be:

- **Side-by-side** in a single video track (most common), or
- **Two video tracks** in one container.

DJI Studio (desktop) and DJI Mimo (mobile) consume `.OSV` natively
and emit equirect MP4 or extract still frames. To bypass the
proprietary stitcher and feed splat360 path A directly:

```text
ffmpeg -i CAM_xxx_D.OSV -map 0:v:0 -filter:v "crop=w/2:h:0:0" lens_a.mp4
ffmpeg -i CAM_xxx_D.OSV -map 0:v:0 -filter:v "crop=w/2:h:w/2:0" lens_b.mp4
```

(crop coords depend on the layout — DJI changes between firmware
versions; verify per-clip.)

**Filename pattern.**

- DJI Avata 360 (flight): `DJI_<YYYYMMDDHHMMSS>_<NNNN>_D.OSV`
- DJI Osmo 360 (handheld): `CAM_<YYYYMMDDHHMMSS>_<NNNN>_D.OSV`

The trailing `_D` denotes **dual-lens / 360 mode**. Single-lens mode
writes `.MP4` with `_F` (forward) or similar suffix.

### `.LRF` (DJI Low-Resolution File)

H.264 MP4 proxy, same baseline name as the OSV. Resolution is
typically 720p or 1080p at the same framerate. Used by DJI Mimo /
Studio for preview-quality playback. **Skip for splat work** —
training on the proxy gives a low-quality splat.

### `.SRT` (DJI Telemetry Sidecar)

SubRip Text file with per-frame telemetry payload — GPS, IMU, focal
length, ISO, shutter, gimbal angles, drone heading. Same baseline name
as the `.OSV` / `.MP4`. Example:

```text
1
00:00:00,000 --> 00:00:00,033
<font size="36">FrameCnt: 1, DiffTime: 33ms
2026-04-25 16:13:27,512
[iso : 100] [shutter : 1/240.0] [fnum : 190] [ev : 0] [ct : 5600]
[color_md : default] [focal_len : 240] [latitude: 53.7891234] [longitude: -2.4567891]
[rel_alt: 12.345 abs_alt: 153.456]
</font>
```

splat360 parses this into `PoseRecord` via `pipeline/metadata.py`.
For older DJI cams the SRT is the only telemetry source; on Avata 360
/ Osmo 360 the same data is also in the MP4 metadata box, but the SRT
is easier to parse.

### `.DNG` (DJI RAW Stills)

Adobe DNG-format raw. For Avata 360 / Osmo 360 in 360 photo RAW mode,
each shot produces **two DNGs — one per lens** (pre-stitch), with
shared GPS/IMU and time-correlated EXIF. This is the **highest-quality
input for splat360 path A** — no in-camera stitch contamination.

Filename pattern observed: `CAM_<ts>_<id>_D.DNG`. Pairs not always
visible from naming alone — match by `DateTimeOriginal` EXIF tag.

### `.insv` (Insta360 Video)

ISO BMFF (MP4-family) with custom INS boxes. **Two video tracks**
in one container — one per fisheye lens. Newer Insta360 cameras
(X4, X5) use H.265; older use H.264. Filename pattern:
`VID_<YYYYMMDD>_<HHMMSS>_<NN>_<index>.insv` for X-series.

Insta360 Studio is the official stitcher; for path A, extract the
two video tracks directly with `ffmpeg -map 0:v:0` / `0:v:1`.

### `.insp` (Insta360 Photo)

JPEG-family wrapped with INS metadata. **Dual-fisheye image in a
single file**, side-by-side. Pattern: `IMG_<YYYYMMDD>_<HHMMSS>_<NN>_<index>.insp`.
The "_NN" appears to increment per shot, "_index" per burst frame.

### `.lrv` / `.thm` (Insta360 + GoPro proxies)

Same-baseline low-resolution proxy + thumbnail. Skip for splat work.

### `.360` (GoPro MAX)

Heavily-modified MP4 with EAC (Equi-Angular Cubemap) packing of two
hemispheres. Not a standard codec — needs GoPro Player or
`gpmf-parser` to unpack. Cumbersome but possible.

### `.gpr` (GoPro RAW)

Adobe DNG + GoPro extensions. Generic image tools (rawpy, libraw)
can read it. For Fusion this is the dual-hemisphere RAW; for MAX
it's the unwrapped EAC-encoded sphere.

## Decisions for splat360

- **Default path for OSV** (the format you have most of): Path A
  via ffmpeg fisheye split. The two halves of an OSV become
  independent OPENCV_FISHEYE cameras with a rig constraint.
- **For Insta360 `.insv` / `.insp`**: same approach — two streams
  per file, rig-coupled. Adapter is a v2 task.
- **For Theta Z1 DNG**: dual-fisheye in one DNG. Crop in half,
  treat each as a fisheye. Same path A pattern.
- **For Theta X / V / SC**: only equirect available → path B
  (spherical SfM via OpenSfM) or path C (cubemap fallback).
- **For GoPro MAX `.360`**: needs the GoPro Player unwrap step
  first; punt to a v3 task unless we get a corpus of `.360`.
- **For Pilot Era and Vuze multi-camera rigs**: path A with N>2
  cameras per shot. Same rig-constraint pattern but more lenses.

## Files NOT to confuse with 360 footage

These extensions exist but are unrelated to 360 capture — flag and
skip during ingestion:

- `.dng` in game / model folders (Ultima 4, etc.)
- `.360` in retro-game folders (Daggerfall texture)
- `.wav` in software bundles
- `.bin` (millions of these in build artefacts)

## Sources

- DJI Osmo 360 / Avata 360 product pages (DJI, 2025–2026)
- Insta360 file-format community docs
- GoPro GPMF parser repo (`github.com/gopro/gpmf-parser`)
- Ricoh Theta API documentation
- Mapillary OpenSfM camera-model handling for street-level cameras
