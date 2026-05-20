# Colour science and perceptual mathematics — the bench reference

The foundational physics-and-perception document for Holoflow Studio's
printing, display, and photography verticals. Where
`PHYSICS_AND_OPTICS.md` covers the geometric, wave, and sub-wavelength
optics of *what light does between source and surface*, this document
covers *what happens once those photons land in an eye, a sensor, or
an ink layer* — the perceptual side of the same physics.

This file is the canonical reference cited by the codex entry
`colour-science-and-perception`, the long-exposure work, the print
bureau workflow, and the forthcoming `printing-pipeline-mathematics`
deep-dive. When this file goes over 300 lines it splits per
`ARCHITECTURE.md` Rule 1, with the print-specific material moving to
its own file.

## 1. Light as wavelength and spectrum

Visible light is the slice of the electromagnetic spectrum between
about **380nm** (deep violet) and **780nm** (deep red). Everything
outside that band is invisible at the retina, though much of it is
detectable on a typical CMOS sensor — IR-cut filters in front of
camera sensors exist because near-IR leaks badly into the red channel
without one.

A physical light source is described by its **spectral power
distribution (SPD)**: a curve giving the radiant power emitted at each
wavelength, in watts per nanometre per steradian per square metre. A
few canonical SPDs the bench encounters:

| Source | Shape | Notes |
|---|---|---|
| CIE D65 (daylight) | broad, slight blue lean | the standard illuminant for sRGB |
| Tungsten (3200K) | smooth, red-weighted | warm cast under photo lamps |
| Fluorescent (CFL) | spiky line spectrum | metamerism trap |
| LED white (phosphor-converted) | blue spike + broad yellow lump | most domestic and stage LEDs |
| 532nm laser | single narrow spike | green laser pointer |
| sRGB display green | three narrowish peaks (R, G, B subpixels) | metameric match to laser green |

The 532nm laser and the display "green" produce the same response in
the eye. They do not produce the same response in a spectrometer, on
a print, or under a different illuminant. This phenomenon —
**metamerism** — is the first lesson the bench learns the moment it
tries to colour-match a printed image to the monitor it was edited
on. The print's ink reflects the room's SPD; the monitor emits a
fixed SPD; the two only match for a viewer whose cones happen to
integrate them to the same triple of L/M/S responses.

## 2. The human visual system

### Receptors

The retina has two photoreceptor populations:

- **Rods** — about 120 million per eye, distributed mostly outside
  the fovea. Single pigment (rhodopsin), peak sensitivity ~498 nm.
  Active at low light, saturated above ~0.01 cd/m². Greyscale only.
- **Cones** — about 6 million per eye, concentrated in the fovea.
  Three pigments at three peak sensitivities:

| Cone | Peak (nm) | Colloquial label |
|---|---|---|
| L | ~560 | "red" (peak is in yellow-green) |
| M | ~530 | green |
| S | ~420 | blue-violet |

The L cone's peak is in yellow-green, not red. Redness is recovered
by the brain comparing L against M — the cones overlap heavily, and
the cortical machinery is in the *difference* business, not the
*absolute* business. This is why the entire downstream visual
pathway is opponent: red–green, blue–yellow, light–dark.

### The CIE 2° standard observer (1931)

The colour-matching functions \( \bar{x}(\lambda), \bar{y}(\lambda),
\bar{z}(\lambda) \) of the CIE 1931 standard observer encode the
relative response of a "typical" human observer's cones, measured
across seventeen British observers in the Wright & Guild experiments
of 1928–1929. The functions are tabulated at every 5 nm and are the
foundation on which every subsequent colour space is built.

For an SPD \( S(\lambda) \), the CIE XYZ tristimulus values are
literal integrals against those matching functions:

```
X = ∫ S(λ) · x̄(λ) dλ
Y = ∫ S(λ) · ȳ(λ) dλ
Z = ∫ S(λ) · z̄(λ) dλ
```

Y, by construction, is luminance — the perceived brightness of the
SPD weighted by the photopic eye's sensitivity to each wavelength.

### Photopic, scotopic, and mesopic vision

| Regime | Luminance | Receptors | Colour? |
|---|---|---|---|
| Photopic | > ~3 cd/m² | cones | full |
| Mesopic | ~0.001 – 3 cd/m² | both | degraded |
| Scotopic | < ~0.001 cd/m² | rods only | none |

Long-exposure light-painting performances put the performer in the
mesopic regime (their pupils are dilated, the surrounding scene is
near-dark, they navigate by the LED trails themselves) but put the
camera squarely in the photopic regime, integrating across the
exposure. The camera sees colours the performer doesn't, which is
one of the reasons long-exposure photography always feels slightly
hallucinatory in the playback.

### Cortical processing

Three feats of cortical processing matter to the bench:

1. **Colour constancy.** A white sheet of paper looks white under
   tungsten, daylight, and fluorescent illumination despite its
   reflected SPD changing dramatically. The visual system normalises
   against the illuminant.
2. **Simultaneous contrast.** A grey patch surrounded by red looks
   green-tinged; the same patch surrounded by green looks red-tinged.
   Demonstrated in Albers' *Interaction of Color* (1963) with
   uncomfortable clarity.
3. **Edwin Land's retinex theory** (Scientific American, December
   1977). Proposes that the cortex computes lightness independently
   in three wavelength bands and recombines them. Both explains the
   constancy result and motivates the edge-aware tone-mapping
   algorithms that make modern HDR processing work.

## 3. Colour spaces — the taxonomy

Every colour space is a coordinate system on the same underlying
psychophysical territory. Device-independent spaces describe colour
absolutely; device-dependent spaces describe what some particular
display or printer can actually produce.

### CIE XYZ — the universal reference

The lingua franca. Every other space converts to it via a 3×3 matrix
(plus, for non-linear spaces, a transfer function). The XYZ
primaries are not real colours — they are mathematical primaries
chosen so all visible colours have non-negative coordinates and so
that Y is luminance.

### CIE xyY chromaticity

XYZ flattened to two chromaticity coordinates plus luminance:

```
x = X / (X + Y + Z)
y = Y / (X + Y + Z)
```

Plotting (x, y) for every monochromatic wavelength from 380 to 780nm
traces the famous horseshoe curve. The gamut of any RGB space is a
**triangle** inside that horseshoe with vertices at the space's
three primaries; the white point sits inside the triangle.

### sRGB

Defined by HP and Microsoft in 1996; standardised as IEC 61966-2-1.
Primaries identical to Rec.709 HDTV. Transfer function:

```
V_linear = (V_srgb ≤ 0.04045) ? V_srgb / 12.92
                              : ((V_srgb + 0.055) / 1.055)^2.4
```

The linear segment near black avoids the numerical pathology of a
pure power function at zero; the 2.4-power segment dominates the
rest of the range with an effective overall gamma of ~2.2.

### Rec.709 vs Rec.2020

Rec.709 (HDTV, 1990) shares primaries with sRGB but uses a slightly
different transfer (BT.1886 gamma 2.4 in the studio environment).
Rec.2020 (UHD, 2012) moves the red, green, and blue primaries
substantially closer to the spectral locus, enclosing about 75% of
visible chromaticities versus sRGB's ~35%. Almost no consumer display
can fully reproduce Rec.2020; it is an *aspirational* container.

### DCI-P3

Cinema standard (2007) adopted by Apple from the iPhone 7 Plus
onward. Roughly 25% wider gamut than sRGB, with the additional
coverage skewed toward saturated reds and oranges. Every modern Mac
display, every recent iPhone, and the Apple Vision Pro render
DCI-P3-tagged content in its native gamut.

### Adobe RGB and ProPhoto RGB

**Adobe RGB (1998)** extends sRGB's green primary outward, capturing
more saturated greens — useful for print, where CMYK inks reach
greens sRGB cannot encode. **ProPhoto RGB (2000)** goes further
still, with primaries pulled so far out that two of them are
mathematically outside the visible spectrum. ProPhoto's gamut
encloses essentially every colour any printer can produce; this is
why photographers use it as a working space for 16-bit RAW editing.

### CIELAB and LCh

CIELAB (1976) is engineered so that Euclidean distance in the space
approximates **perceived** colour difference, expressed as **ΔE**.
The conversion from XYZ to LAB is non-linear (cube-root scaling
inside the L, a, b coordinates) and references a white point —
typically D65 for the studio.

| ΔE | Perceptual reading |
|---|---|
| < 1 | indistinguishable to trained observer |
| 1–2 | just-noticeable difference on careful inspection |
| 2–3 | noticeable; acceptable for print reproduction |
| 3–5 | clearly different |
| > 5 | obviously different colour |

**LCh** is the cylindrical form: L for lightness, C for chroma
(distance from the neutral axis), h for hue angle. The studio
soft-proofs in LCh because the perceptual axes match how an artist
reasons about colour — "warm it up by a degree, drop the chroma a
notch" — far better than RGB ever does.

## 4. Gamma, tone curves, and the linear-light rule

### Why gamma exists

The eye's luminance sensitivity is approximately logarithmic in the
photopic range. Cathode-ray tubes in 1960s broadcast television
happened to have an electrical-input-to-light-output response close
to a 2.5 power law. Encoding video with the inverse curve before
transmission produced subjectively even quantisation steps and
matched the CRT's native response on the receiving end. The
historical accident and the perceptual fact lined up well enough
that the convention stuck. Charles Poynton's *Digital Video and
HDTV* (Morgan Kaufmann, 2003) is the definitive history.

### The cardinal rule

**All physically correct image processing — lighting, blending,
filtering, anti-aliasing — must be done in linear-light space.**
Then encode to gamma for display. Failing to do so produces the
classic "brown midpoint between red and green" bug, because the
sRGB encoding compresses the dark end and a naïve average pulls
the result perceptually downward.

The studio's WebGPU/TSL shaders honour this:
- Sample sRGB textures with `srgb` decode (gives linear floats).
- All maths in linear.
- `renderer.outputColorSpace = SRGBColorSpace` re-encodes on output.

### HDR transfer functions

**PQ** (SMPTE ST 2084) targets absolute luminance from 0 to 10,000
cd/m², with the dark end finely quantised to match the eye's
contrast sensitivity. **HLG** (Hybrid Log-Gamma, BBC/NHK 2014) is
relative — the bottom half of the curve is gamma-like for
backwards compatibility with SDR displays, the top half is
logarithmic for highlight headroom.

The print pipeline is bounded by paper's dynamic range (around
1:200 reflective contrast for the best baryta papers, closer to
1:100 for Photo Rag), so the studio does not master HDR output for
the print bench. The Looking Glass Portrait pipeline in The
Hangar's holographic stack is HDR-aware on the WebGPU side; the
volumetric content has the headroom even if the final display
doesn't.

## 5. ICC profiles and the end-to-end pipeline

An **ICC profile** is a binary file (a few hundred kilobytes
typically) describing how a particular device maps between its
native colour space and a profile connection space (PCS), usually
CIE XYZ or LAB. Every monitor has one; every printer has one *per
paper-and-ink combination*; every camera has a profile per RAW
interpretation.

The colour-management module (CMM) in the OS chains profiles
together to translate from source to destination, applying a
**rendering intent**:

| Intent | Behaviour |
|---|---|
| Perceptual | preserves relationships; compresses out-of-gamut to fit |
| Relative colorimetric | clips out-of-gamut to the boundary; preserves in-gamut |
| Saturation | maximises chroma; least faithful to original |
| Absolute colorimetric | preserves white point; used for proofing |

### The studio's pipeline

```
[Camera RAW]
   │  RAW converter (Lightroom)
   ▼
[ProPhoto RGB, 16-bit linear]
   │  edit
   ▼
[ProPhoto RGB, 16-bit linear, finalised]
   │  ┌────────────────────────────┐
   │  │ soft-proof against print   │
   │  │ ICC, perceptual intent     │
   │  └────────────────────────────┘
   ▼
[Output convergence]
   ├─► sRGB JPEG for the web
   ├─► DCI-P3 PNG for the Apple-tagged site assets
   └─► ProPhoto TIFF → Canon PRO-1100 driver → ICC-managed print
```

The studio runs an **Eizo CG2700S** as the calibrated working
monitor (covers 99% Adobe RGB, 98% DCI-P3, hardware LUT
calibration), a **Canon imagePROGRAF PRO-1100** as the print
engine, **Hahnemühle Photo Rag 308gsm** as the default substrate,
and an **X-Rite i1Studio** for annual recalibration of the lot. New
paper batches get a fresh profile measured on the i1Studio — not
because the paper has changed materially but because batch-to-batch
white-point drift can push midtones a couple of ΔE off target.

### Soft-proofing

Before any export, the image is converted (perceptual intent) to
the destination ICC profile. The screen previews the print's gamut
by simulating the colours that will fall outside it (the
"gamut-warning" overlay flags them). The artist makes one of three
choices for each out-of-gamut region:
- accept the desaturation the perceptual intent will apply;
- pull chroma down manually to keep the relationship between
  adjacent regions stable;
- live with the clipping if it's in a region the eye doesn't care
  about.

For light-painting prints with strong red traces, the third option
is rarely viable — clipped reds turn to mud. The studio's working
default is to pull chroma down by 5–10% in LCh on the most
saturated traces before soft-proof, then refine against the actual
proof print.

## 6. Holoflow-specific applications

### Long-exposure photography under battery sag

Voltage drop across a long shutter shifts addressable-LED colour
temperature noticeably — warmer reds, less blue — as constant-current
drivers fall out of regulation near the bottom of the discharge
curve. A piece begun on a fresh 18650 cell and finished on a flat
one carries the temperature drift visibly in the trace. The
studio's working notes for this live in the
`long-exposure-photography` codex entry; the colour-management
implication is that the print profile must hold for the warm end
of the captured spectrum. Photo Rag's natural-white substrate (no
OBA) suits the work better than a brilliant-white competitor that
would push the warm rim of every trace toward magenta.

### Print profiling for the PRO-1100 + Photo Rag stack

Canon ships ICC profiles for every Hahnemühle, Canson, and Awagami
paper they endorse. Hahnemühle ships their own profiles for every
Lucia EX inkset printer. The studio uses the Hahnemühle versions
for the Photo Rag stack (slightly more accurate for matte) and the
Canon versions for satin and gloss tests. New paper batches get
re-profiled; the studio keeps two A3 sheets per batch in reserve
for the calibration print.

### sRGB vs DCI-P3 for the Holoflow site

The site ships sRGB on the wire and tags DCI-P3 for the Apple
audience. The bulk of the user base is on iPhone or Mac. Apple
browsers honour DCI-P3 tagging and the saturated pinks in the
navigation, the deep violet hero accents, and the Aura nameplate
gradients all benefit from the wider gamut. Windows browsers fall
back to sRGB and the design still reads correctly — nothing critical
lives outside the sRGB triangle.

CSS-side this is `color: color(display-p3 1 0.4 0.7)` with an sRGB
fallback. The shadcn-derived design tokens in
`apps/holoflow-studio/styles/tokens.css` carry both.

### VRM materials and MToon calibration

The studio's VRoid-authored VRM avatars use **MToon** as their
shading model. MToon's base colour, shade colour, and rim colour
parameters are authored in sRGB but **sampled in linear inside the
shader**. Getting the boundary right is the difference between
Aura's hair rendering as the intended saturated violet and
rendering as a chalky lavender. The TSL implementation in the
Crystal honours sRGB decode on texture sample by default; the
legacy Three.js material code in the Holoflow site does the decode
manually with `texture.colorSpace = SRGBColorSpace`.

### Gaussian-splat radiance encoding

A 3D Gaussian Splatting scene encodes per-Gaussian colour as
**zeroth-order spherical harmonics** — a single RGB triple — plus,
optionally, higher bands (typically up to degree 3) for
view-dependent appearance. The colour gamut of the encoding is
whatever the trainer wrote out, usually sRGB or linear-sRGB.

Saturated colours outside that triangle simply do not exist in the
splat. The studio's splat pipeline trains in linear-sRGB and
renders in DCI-P3 where the display permits; the wider primaries
help the warm rim-light passes in particular. Splats trained from
photographs of LED-lit performances exhibit the gamut limitation
visibly — the LEDs themselves were saturated narrowband emitters,
but the splat can only reproduce them up to the encoder's gamut.

## 7. The politics of who counts as a standard observer

The CIE 1931 colour-matching functions were measured against
seventeen observers — all British, all light-skinned, all viewing
through a 2° foveal aperture in the Wright & Guild experiments
(1928–1929). Subsequent revisions (the 1964 10° observer; the CIE
170-2 cone fundamentals of 2006) extended the sampling but did not
unseat the 1931 standard, which remains the coordinate system in
which every other colour space is defined.

The downstream effect, well documented in the film and
photographic-industry literature, is that black and brown skin were
not the implicit reference during the development of:

- consumer colour film stocks (Kodak's Shirley cards through the
  1990s);
- camera auto-exposure algorithms (the
  face-detection-into-skin-tone-correction pipeline well into the
  2010s);
- stage lighting design conventions (the warm "skin-tone" gels in
  every stagelight catalogue);
- early machine-learning face classifiers (Buolamwini & Gebru,
  *Gender Shades*, 2018).

The relevant references:

- Lorna Roth, "Looking at Shirley, the Ultimate Norm: Colour
  Balance, Image Technologies, and Cognitive Equity," *Canadian
  Journal of Communication* 34 (2009), 111–136.
- Joy Buolamwini and Timnit Gebru, "Gender Shades: Intersectional
  Accuracy Disparities in Commercial Gender Classification,"
  *Proceedings of Machine Learning Research* 81 (2018), 1–15.

The studio's stance: name skin tones honestly when the image is of
a person, in the catalogue copy and the alt text. Do not average
toward "neutral" in retouching unless the subject has asked for it.
When soft-proofing for print, eyeball the skin-tone region of the
gamut against the *print*, not against the screen alone. Photo Rag
holds warm brown midtones particularly well; the cheaper baryta
substrates the studio also stocks have a tendency to push warm
midtones cool, and the bench notes the shift in the photograph's
metadata when it ships.

## 8. References

- Günter Wyszecki and W. S. Stiles, *Color Science: Concepts and
  Methods, Quantitative Data and Formulae*, second edition (Wiley,
  1982; 2000 reprint with corrections). The canonical reference.
- CIE Publication 15 (1931 standard observer; current edition
  CIE 015:2018).
- Edwin Land, "The Retinex Theory of Color Vision," *Scientific
  American* 237 (December 1977), 108–128.
- Charles Poynton, *Digital Video and HDTV Algorithms and
  Interfaces* (Morgan Kaufmann, 2003; second edition 2012).
- Marc Levoy, Stanford CS178 *Computer Vision* lecture notes,
  open courseware.
- Lorna Roth, "Looking at Shirley" (2009).
- Buolamwini & Gebru, "Gender Shades" (2018).

## 9. Cross-references inside the studio's codex

- `hahnemuhle-photo-rag-308` — the default print substrate.
- `canon-imageprograf-pro-1100` — the print engine.
- `long-exposure-photography` — the capture side.
- `gaussian-splatting` — radiance encoding.
- `mtoon` — VRM avatar shading.
- *forthcoming* `printing-pipeline-mathematics` — ink coverage, dot
  gain, screen-vs-print gamut mapping in detail.
