# `/edit` → print — the A2 photo print pipeline

Companion to [PURPOSE.md](./PURPOSE.md). Documents the operator-side
workflow that picks up where the editor's "Render for print" feature
hands off: from a rendered PNG/TIFF, through Topaz Photo AI, into
Canon Professional Print & Layout, out onto A2 paper.

The editor renders pixels. This doc covers everything between those
pixels and a print on the wall.

## 1. Hardware

### Canon imagePROGRAF PRO-1100

Canon's current 17-inch desktop photo printer, successor to the
PRO-1000. Maximum sheet width 17 in (A2 short edge). Native paper
sizes A4, A3, A3+, A2; cut-sheet and roll-feed (roll up to ~600mm for
panoramas). Native resolution 2400 × 1200 dpi. Twelve-ink LUCIA PRO
pigment set with chroma optimiser. See the
[official spec page](https://www.canon.co.uk/printers/imageprograf-pro-1100/specifications/)
for the full sheet of numbers.

The print head is a single-pass 1.28-inch FINE head with air-feed-in
suction — for our purposes that means it tolerates heavyweight fine-art
papers without jamming, which the desktop pro-photo segment historically
didn't.

### Connection options

| Mode | Use when | Trade-off |
| --- | --- | --- |
| USB-C | A2 TIFFs at full resolution; long unattended runs | Lowest latency, no Wi-Fi interruption mid-print on a 200 MB file |
| Wi-Fi (5 GHz preferred) | Day-to-day photo prints from any machine on the LAN | Fine for ICC-profiled work; an intermittent 5 GHz drop in the middle of a print does not corrupt the spool but can delay it |
| Ethernet (1 GbE) | Studio install with a wall drop | Most reliable; recommended if the printer lives at a fixed desk |

Wi-Fi is fine for ICC-profiled photo work. USB-C is for the absolute
lowest latency on huge files — a full A2 16-bit TIFF can be ~600 MB, and
a flaky wireless link will turn a 6-minute print into a 12-minute one.

### LUCIA PRO 12-colour ink

The PRO-1100 carries CMYK (cyan, magenta, yellow, black), photo-cyan
and photo-magenta (for low-density colour gradients without dot
visibility), grey and photo-grey (for neutral-toned monochrome and
shadow detail), red and blue (extends the gamut into rich saturated
primaries that CMYK alone can't reach), matte-black (loaded
automatically when matte paper is selected), and a chroma optimiser —
a clear coat that levels gloss differential and improves perceived
black depth on glossy / lustre stocks.

This matters for the Holoflow surfaces: skin tones in HoloWalk POV
stills, sky gradients in 360 reframes, and shadow-side detail in splat
renders all live in the parts of the gamut where extra-light inks and
the red/blue primaries earn their keep.

## 2. Software

### Canon Professional Print & Layout (PSP)

The right driver UI for this printer. Free download from canon.com.
Available for Windows and macOS. PSP is layered on top of the standard
print driver and adds the dialogs needed for serious photo work: paper
preset, ICC profile selection, print preview with real soft-proof,
black point compensation, perceptual / relative-colorimetric intent
toggle, and a hard-edge crop tool.

Print directly from Photoshop / Affinity / Lightroom only if you
already have a colour-managed workflow you trust. For everything else,
PSP gives the most reliable A2-on-Canon-paper result.

### Topaz Photo AI

Already installed at `C:\Program Files\Topaz Labs LLC\` — confirmed in
[already-installed-tools.md](../../../../The_Hangar/engines/splat360/docs/already-installed-tools.md).
The upscale, denoise, and sharpen models are the workflow's "do I have
enough pixels?" insurance policy.

Integration is "open from PSP": Topaz registers itself as an "Edit in…"
hook, so a render from the editor can flow PNG → Topaz → PSP without
hand-shuffling files around.

### Color profiles (.icc)

The PRO-1100 ships ICC profiles for the official Canon paper line.
Common loadouts:

| Paper | ICC profile name (Canon-supplied) |
| --- | --- |
| Photo Paper Pro Premium Matte | `Canon PRO-1100 PMm1` |
| Photo Paper Pro Platinum | `Canon PRO-1100 PT` |
| Photo Paper Pro Luster | `Canon PRO-1100 LU` |
| Heavyweight Fine Art Smooth | `Canon PRO-1100 HFA-S` |
| Premium Fine Art Rough | `Canon PRO-1100 PFA-R` |

The Canon installer drops these into the system ICC store
automatically. Third-party paper makers (Hahnemühle, Canson Infinity,
Ilford / Galerie, Moab, Awagami) publish their own ICCs against the
PRO-1100 — download from the manufacturer's site and drop into
`C:\Windows\System32\spool\drivers\color\` on Windows or
`~/Library/ColorSync/Profiles/` on macOS. Do not assume a profile from
a previous Canon model will translate; the LUCIA PRO ink set on the
PRO-1100 is not gamut-identical to the PRO-1000.

## 3. Resolution math

Pixel dimensions for the common A-series sizes, by quality tier.

Sources:
[a2-size.com (A2 in pixels)](https://www.a2-size.com/a2-size-in-pixels/),
[PrintUpscale (A2 at 300 dpi)](https://printupscale.com/pixels/a2-at-300-dpi).

| Paper | Quality tier | PPI | Pixel dimensions |
| --- | --- | --- | --- |
| A4 | Photo | 300 | 2480 × 3508 |
| A4 | Pro | 600 | 4961 × 7016 |
| A3 | Photo | 300 | 3508 × 4961 |
| A3 | Pro | 600 | 7016 × 9921 |
| A2 | Poster | 150 | 2480 × 3508 |
| A2 | Photo | 220 | 3639 × 5145 |
| A2 | Pro | 300 | 4961 × 7016 |

### Viewing distance — why "Pro" is sometimes overkill

The retina-limit rule of thumb:

- A2 viewed at 30 cm (close inspection, a photo book or framed at desk
  distance): 300 PPI delivers detail at the retinal limit. Below
  ~220 PPI the operator can resolve individual halftone clusters.
- A2 viewed at 1 m (typical gallery / hallway distance): 200 PPI is
  the inflection point. Above that, additional pixels stop adding
  perceived sharpness.
- A2 viewed at 3 m (large-room wall art): 150 PPI suffices. The eye
  can no longer resolve sub-millimetre detail.

For HoloWalk gallery-format prints — viewed at 1-2 m — the **Photo
(220 PPI)** tier is the right default. **Pro (300 PPI)** is for
photo-book-format inspection or editioned prints where the buyer will
get nose-to-paper.

## 4. Source coverage from a 360 reframe

A 360 reframe carves a slice out of an equirectangular source. The
question is whether that slice has enough native pixels to fill the
target print, or whether it needs an upscale pass.

**The math.** Source equirect width `W`, reframe FOV `φ` in degrees:

```
effective_slice_pixels = W × (φ / 360)
```

Current camera fleet:

| Camera | Equirect W |
| --- | --- |
| DJI Avata 360 | 7680 |
| DJI Osmo 360 | 7680 |
| Insta360 X4 | 7680 |
| Ricoh Theta Z1 | 6720 |

Coverage table assuming `W = 7680` (the common case) against the A2
Pro target (4961 px on the long edge):

| Reframe FOV | Source slice pixels | A2 Pro (4961) native? | With Topaz 2× | With Topaz 4× |
| --- | --- | --- | --- | --- |
| 30° (telephoto) | 640 | no | partial | yes |
| 60° (portrait) | 1280 | no | yes (1.9×) | yes |
| 75° (normal) | 1600 | no | yes (1.6×) | yes |
| 110° (wide) | 2347 | yes (with mild upscale) | excellent | overkill |
| 150° (ultra wide) | 3200 | yes | overkill | overkill |
| 180° (fisheye) | 3840 | yes | overkill | overkill |

**Take-away.** The typical 75° "normal-lens" reframe needs a 2-4×
upscale to hit A2 Pro. From 110° wide upward, the native pixels are
already there and Topaz is unnecessary — the equirect simply has more
information at the edges of the slice than the centre, and the wider
the slice, the more native data feeds the print. Run Topaz only when
the table says you need it.

## 5. The workflow — editor to print

End-to-end, what the operator actually does.

1. **Reframe in the editor.** Drop the source onto `/edit`, drag yaw /
   pitch / FOV until the view is right, set the active keyframe.
2. **Render for print.** Open the "Render for print" panel. Pick
   **A2 / Photo (220 PPI, 3639 × 5145)** for normal use, or **A2 / Pro
   (300 PPI, 4961 × 7016)** for close-inspection work. The editor
   tile-renders the view at the target pixel dimensions — this is not
   a screenshot; it is a render at the requested resolution.
3. **Download or save.** Click "Render → file". On Chrome / Edge the
   File System Access API lets the operator save directly to a chosen
   directory; on Firefox / Safari the file downloads to the default
   downloads folder. Format is PNG by default; switch to TIFF for the
   16-bit path.
4. **Topaz pass (if needed).** Open Topaz Photo AI, drop the PNG, use
   the "Standard v2" model with 2× or 4× upscale per the table in §4.
   If the table says the native render is already over target, skip
   Topaz entirely — upscaling pixels that don't need upscaling
   introduces artefacts.
5. **Save as 16-bit TIFF.** From Topaz, save the upscaled result as
   `.tif` (16-bit, no compression). The 16-bit depth matters for the
   smooth-gradient regions (sky, shadow, skin) where 8-bit shows
   banding under LUCIA PRO's wider gamut.
6. **Open Canon Professional Print & Layout.** New project → "Photo
   print" → load the TIFF.
7. **Paper preset.** Pick the preset that matches the paper *actually
   loaded in the printer*. This is the single biggest cause of
   "the print looks wrong" — a Pro Luster preset on Pro Premium Matte
   paper will look dull and warm because the ink density profile is
   tuned to a different substrate.
8. **Colour management.** Set "ICC profile = printer/paper preset" in
   PSP. Make sure the application is *not* also managing colour —
   double-profiling washes the image out.
9. **Print size = A2.** No scaling, no fit-to-page. The render and the
   paper are already the same aspect; let PSP place 1:1.
10. **Print quality = Highest.** This is the slow mode (6-9 passes per
    band) and is the only mode that earns the full 2400 × 1200 dpi.
    Time per A2 page at Highest: 5-8 min depending on paper and
    coverage. Don't open the lid mid-print.

## 6. Colour management caveats

- **Soft-proof before printing.** In Topaz, Photoshop, or Affinity
  Photo, load the destination ICC and toggle gamut warning. Anything
  flagged out-of-gamut needs decision: re-grade in the editor, or
  accept the clipping. The PRO-1100 with LUCIA PRO clips less than
  most desktop printers, but it still clips.
- **The editor renders in sRGB by default.** This is the safe default
  and matches what the user sees in the viewport. For wide-gamut print
  targets the editor could render in Display-P3 or even Adobe RGB —
  flagged as a **v2 concern**, not currently wired. If you need
  wide-gamut today, render the same view at high resolution as PNG
  and grade up to P3 in Affinity before the Topaz step.
- **"Printer manages colours" must be OFF in PSP.** "Application
  manages colours" must be ON. Reverse this and the colours go dull —
  this is the single most common operator error.
- **The chroma optimiser is automatic.** Don't disable it on glossy /
  lustre papers; you lose the perceived black depth.

## 7. Paper choices

Three Canon papers cover the HoloWalk + editor output surface:

- **Photo Paper Pro Platinum** — high-gloss, deep blacks, vivid
  colour. Best for splat-render stills and sculpture documentation
  where punch matters. The chroma optimiser earns its keep here.
- **Photo Paper Pro Premium Matte** — neutral matte, no glare, holds
  fine type cleanly. Best for narrative pages and the journal /
  tutorial print drops where text and image share the page.
- **Heavyweight Fine Art Smooth** — cotton-rag-feel substrate,
  gallery-grade, accepts a signature and a chop. Best for editioned
  pieces sold from the print bar.

**Hahnemühle for serious editioned work.** For the editioned-IP
track on holoflow.co.uk, Canon's own fine-art line is a baseline,
not a ceiling. **Hahnemühle Photo Rag Baryta** (a baryta-coated
cotton rag with a near-glossy surface and matte-paper black depth) or
**Hahnemühle Photo Rag UltraSmooth** (the smoothest pure cotton in the
range) materially out-class the Canon line on touch, weight, and
edition feel. ICCs are published on hahnemuehle.com against the
PRO-1100.

## 8. Cross-reference

- [PURPOSE.md](./PURPOSE.md) — the editor's overall scope and the
  Render-for-print feature's place in it
- `lib/studio/print-export.ts` — the tile-render and file-save logic
  driving the "Render → file" button
- `lib/studio/topaz-handoff.ts` — the "Edit in Topaz" handoff and
  return path
- [already-installed-tools.md](../../../../The_Hangar/engines/splat360/docs/already-installed-tools.md)
  — notes Topaz Photo AI is installed on Sovereign-PC, along with the
  rest of the local production stack
