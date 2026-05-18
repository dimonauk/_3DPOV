# sort-equirectangulars

A small CLI agent that walks a folder of photos, reads each image's
dimensions with `sharp`, and sorts equirectangular 360° images out
from regular shots.

## What counts as equirectangular?

Aspect ratio ≈ 2:1, width ≥ minimum threshold. Every stitched 360
panorama is exactly 2:1: Insta360 X/Theta/GoPro MAX outputs, DJI
Avata 360 stitched JPEGs, Theta Z1 stills, etc.

Common shapes the script will correctly bucket:

| Aspect | Width × height examples | Bucket |
|---|---|---|
| 2.000 | 7680×3840, 6720×3360, 5760×2880, 7296×3648 | equirectangular |
| 1.500 | 6000×4000 (3:2 DSLR) | regular |
| 1.333 | 4032×3024 (iPhone 4:3) | regular |
| 1.778 | 3840×2160 (16:9 4K frame) | regular |
| 1.000 | 3840×3840 (DJI Avata 360 RAW dual-fisheye — NOT equirect) | regular |

The 3840×3840 case is the interesting one — see the
`dji-osv-format` skill. Dual-fisheye RAW frames look like a perfect
square, NOT a 2:1 equirect; they need a separate stitching pass before
they become equirect. This sorter correctly puts them in `regular/`
so they don't accidentally land on a 360 surface.

## Defaults

| Flag | Default | Purpose |
|---|---|---|
| operation | copy | Operator-safe; use `--move` to relocate |
| recursion | off | Walks one level; re-run on subdirs as needed |
| output | `<input>/equirectangular/` + `<input>/regular/` | Override with `--out <dir>` |
| min-width | 2048 px | Filter tiny 2:1 thumbnails (e.g. social cards) |
| aspect window | 1.95..2.05 | 2.5% tolerance — generous for slightly-cropped 360s |

## Examples

```sh
# Default: sort a folder in place, copy mode, no recursion
node scripts/sort-equirectangulors.mjs "D:\Pictures\2026-05-18-trafalgar"

# Preview without touching files
node scripts/sort-equirectangulars.mjs "D:\Pictures\2026-05-18-trafalgar" --dry-run

# Move (not copy) into a separate output tree, walking all subdirs
node scripts/sort-equirectangulars.mjs "D:\Pictures" --out "D:\sorted" --recurse --move

# Tighter aspect window (only TRUE 2:1, not slight crops)
node scripts/sort-equirectangulars.mjs "D:\Pictures\360s" --aspect 1.99..2.01

# Lower min-width to include 1080×540 thumbnails
node scripts/sort-equirectangulars.mjs "D:\Pictures" --min-width 1024
```

## Output

```
equirectangular: 14
    DJI_0123.JPG (7680×3840, aspect 2.000)
    DJI_0125.JPG (7680×3840, aspect 2.000)
    R0012345.JPG (6720×3360, aspect 2.000)
    ...
regular: 38
    IMG_0001.JPG (4032×3024, aspect 1.333)
    IMG_0002.JPG (4032×3024, aspect 1.333)
    DSC_0042.NEF (6000×4000, aspect 1.500)
    ...
skipped: 7  (non-image / no-dimensions)
```

Re-running the script on the same input dir is safe — files already
in `equirectangular/` or `regular/` subdirs are skipped automatically
(no infinite copy loops).

## Pairs well with

- `viz.splat-generate-360` capability — once the operator has the
  equirects sorted, batch-upload them to the splat360 bench service.
- `/edit` web 360 editor — drag the equirect folder into the
  DropZone and the source-detection sniffer (in
  `lib/studio/source-detection.ts`) classifies each one as
  `equirect-image` so they all open in the equirect viewer.
- `holoflow-bench-bridge` skill — when wiring a batch 360→splat
  pipeline, the operator runs this script first to filter the input
  set.

## Format support

JPG, PNG, TIFF, WebP, AVIF, HEIC (via sharp's libheif). DNG and other
RAW formats need a converter step first; the script silently skips
unsupported extensions and reports the skipped count at the end.

## Why a CLI script, not a web surface?

Operators tend to have 100+ images in a folder after a shoot. A
batch CLI on disk is faster to run + idempotent + scriptable. When
the web `/edit` surface needs the same logic, it imports from
`lib/studio/source-detection.ts` which does the same dimension-check
in the browser (no sharp needed; uses Image() decoding).
