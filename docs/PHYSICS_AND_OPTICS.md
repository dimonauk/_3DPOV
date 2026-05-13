# Physics and optics — the bench reference

The physical principles every sculpture in the studio depends on.
Snell's Law, total internal reflection, Fresnel reflectance, thin-film
interference, diffraction, caustics. None of these are decoration;
each is a load-bearing mechanism in at least one piece on the shelf.

This file is the canonical reference for the optics. The articles
named at the bottom cite it; the visualisers at
`/visualiser/total-internal-reflection` and
`/visualiser/caustic-projector` are interactive variants of two
sections below.

When this file goes over 300 lines, it splits per `ARCHITECTURE.md`
Rule 1.

## The three optical regimes

Every interaction between light and a printed object falls into one
of three regimes, set by the ratio of feature size `d` to wavelength
`λ` (400–700 nm for visible light).

| Regime | Condition | What happens | Where it lives in the studio |
| --- | --- | --- | --- |
| Geometric | d ≫ λ (features > ~10 µm) | Light travels in straight rays. Reflection, refraction, caustics. | Waveguide tubes, lens surfaces, caustic projectors. |
| Wave | d ≈ λ (features ~100 nm – 10 µm) | Diffraction, interference, structural colour. | Thin-film iridescence, diffraction gratings, gyroid photonic crystals (in nature). |
| Sub-wavelength | d ≪ λ (features < ~100 nm) | Effective-medium behaviour — the structure acts as a homogeneous material with custom optical properties. | Not yet printable on consumer SLA. |

Consumer SLA at ~19 µm XY sits at the boundary of geometric and wave.
That is the budget the bench works inside.

## Refractive indices the bench works at

| Material | n | Notes |
| --- | --- | --- |
| Air | 1.000 | Reference. |
| Water | 1.333 | Submerged-sculpture case. |
| Standard clear UV resin | 1.46–1.52 | Elegoo, Anycubic standard. |
| Formlabs Clear v4 | 1.51 | Industry reference for high-clarity resin. |
| High-IOR optical resin | 1.55–1.65 | Specialty, more expensive, ~2× the trapped-light yield over 50 mm. |
| PMMA (acrylic) | 1.49 | CNC alternative. |
| Diamond | 2.42 | Maximum TIR trapping — not printable. |

The number that matters in almost every calculation below is **n ≈
1.50** — the working assumption for clear SLA resin in air.

## Snell's Law

The fundamental refraction equation. When light crosses a boundary
between media of indices `n₁` and `n₂`:

```text
n₁ · sin(θ₁) = n₂ · sin(θ₂)
```

`θ₁` is the angle of incidence (measured from the surface normal);
`θ₂` is the angle of refraction. Both are signed quantities of the
normal, not the surface.

## Total internal reflection and the critical angle

When light travels from a denser medium into a less dense one, there
exists a **critical angle** `θc` beyond which all light is reflected
back. None escapes. This is the mechanism behind every waveguide in
the studio — and the reason a resin pendant glows from inside rather
than dimming.

```text
θc = arcsin(n₂ / n₁)
```

Worked at resin → air (`n₁ = 1.50`, `n₂ = 1.00`):

```text
θc = arcsin(1.00 / 1.50) = arcsin(0.667) = 41.8°
```

So any ray hitting the resin-air boundary at more than 41.8° from the
normal cannot leave — it bounces back into the resin and continues
along the waveguide.

The critical-angle table, with the percentage of incident hemisphere
above which TIR occurs:

| n₁ → n₂ | θc | % of hemisphere trapped |
| --- | --- | --- |
| 1.46 → 1.00 | 43.2° | 68.0% |
| 1.50 → 1.00 | 41.8° | 70.6% |
| 1.52 → 1.00 | 41.1° | 71.7% |
| 1.60 → 1.00 | 38.7° | 74.9% |
| 1.50 → 1.33 (resin → water) | 62.5° | 42.1% |

A 7% increase in trapped-hemisphere fraction (1.46 → 1.60) compounds
over a 50 mm waveguide into roughly twice the light delivered to the
far end. This is why material choice is load-bearing, not finish.

**Minimum bend radius** that preserves TIR in a tube of cross-section
radius `r`:

```text
R_min ≈ r / (1 - sin(θc))
```

At `r = 1 mm`, `θc = 41.8°` → `R_min ≈ 3.0 mm`. A 2 mm-diameter resin
tube bends to a 3 mm radius and still guides. This sets the
geometric envelope every internal channel in the catalogue lives
inside.

## Fresnel reflectance

TIR is the limit case. Below the critical angle, some light reflects
and some transmits. At normal incidence (head-on):

```text
R = ((n₁ - n₂) / (n₁ + n₂))²
```

Resin → air: `R = (0.5 / 2.5)² = 0.04 = 4%`.

Four percent reflects at every resin-air boundary at normal
incidence. After 10 internal surfaces, `(0.96)¹⁰ ≈ 66%` of the light
remains; after 20 surfaces, ~44%. Solid waveguides outperform hollow
channels because every cross-section of a hollow tube costs another
4%.

The full Fresnel equations (s and p polarisation) and Brewster's
angle (`θB = arctan(n₂/n₁)` — 33.7° resin → air, polarisation-zero
reflection) live in the source canon but are not load-bearing for
any current piece. Listed for completeness.

## Structural colour — colour without pigment

Pigment colour absorbs the wavelengths it does not show. Structural
colour redirects wavelengths without absorbing them. This is why
butterfly-wing blues stay vivid where indigo dye fades — the energy
is not lost as heat. The article
`articles/colour-without-pigment` covers the principle; this section
holds the equations.

Three mechanisms produce structural colour, all wave-regime:

| Mechanism | Equation | Natural example |
| --- | --- | --- |
| Thin-film interference | `2 · n · d · cos(θ) = (m + ½) · λ` for constructive reflection | Soap bubble, *Morpho* butterfly |
| Diffraction grating | `d · sin(θ_m) = m · λ` for the m-th order | Ctenophore comb rows, peacock barbules |
| Photonic crystal | `λ_gap ≈ 2 · n_eff · a / m` (band-gap centre) | *Callophrys rubi* gyroid, opal |

For a resin film at normal incidence, the first-order constructive
wavelength reduces to `λ = 4 · n · d`. The thickness-to-colour table:

| Film thickness | λ (n = 1.50) | Reflected colour |
| --- | --- | --- |
| 67 nm | 400 nm | Violet |
| 75 nm | 450 nm | Blue |
| 92 nm | 550 nm | Yellow |
| 108 nm | 650 nm | Red |

These thicknesses are below the printer's Z resolution (10 µm). The
bench can render the effect in Blender's Principled BSDF (the
`Thin Film Thickness` input, in nm) for preview, but the printed
object only carries thin-film colour at deliberately polished
sub-100 nm coatings — not from the resin geometry itself.

## Caustics

A caustic is the envelope a family of light rays accumulates on
after passing through a curved refractive or reflective surface.
The bright lattice at the bottom of a pool. The bright line inside
a cup of tea. The arc of a raindrop.

The inverse problem — *given a target light pattern on a wall, what
lens surface produces it as a caustic?* — is solved by optimal
transport, expressed as a Monge–Ampère equation:

```text
det(D²h) = f(x,y) / g(T(x,y)) · det(DT)
```

Where `h` is the lens height map, `f` is the source distribution,
`g` is the target distribution, and `T` is the transport map. The
solver returns `h(x,y)`; the bench prints it as a clear resin
surface. A point LED behind the lens projects the target pattern.

This is the engine of `articles/the-caustic-disc`. The visualiser at
`/visualiser/caustic-projector` runs the forward direction (lens →
projected pattern) interactively; the inverse direction runs offline
and produces the STL that goes to the printer.

## What the bench prints and what it doesn't

Every feature must be at least 2× the printer's XY resolution to
form reliably. At 19 µm XY:

| Feature | Required size | Status at 19 µm |
| --- | --- | --- |
| Waveguide tube walls | > 100 µm | Fully achievable. |
| Murray's-Law tube radius variation | 50–300 µm | Achievable with care. |
| Diffraction grating pitch | 38 µm minimum | At limit — large pitch only, subtle rainbow. |
| Whispering-gallery escape features | > 40 µm | Achievable. |
| Moiré lattice holes | > 76 µm | Reliable. |
| Gyroid unit cell (geometric mode) | > 76 µm | Achievable — geometric mode only, not photonic. |
| Thin-film interference layer | 67–108 nm | Not achievable on the printer. |
| True photonic band gap | ~300 nm unit cell | Not achievable. |

The progression to true structural colour depends on printer
resolution advancing. The physics does not change.

## Cross-links

- `articles/why-the-pendant-glows-from-the-inside` — TIR as the
  pendant's mechanism. The 41.8° critical angle lives here.
- `articles/colour-without-pigment` — the structural-colour
  argument, with butterfly and ctenophore as the natural examples.
- `articles/the-caustic-disc` — the Monge–Ampère caustic-lens build.
- `articles/the-convergence` — what enters the top of the pipeline
  and what comes out at the bottom; uses every mechanism in this
  file at least once.
- `/visualiser/total-internal-reflection` — interactive critical-
  angle / TIR demonstration.
- `/visualiser/caustic-projector` — forward caustic projection from
  a lens height map.

## Reading order

1. Snell + critical angle (TIR).
2. Fresnel reflectance at normal incidence.
3. Structural-colour mechanisms (thin-film + diffraction).
4. Caustics + the Monge–Ampère inverse problem.

The articles cited above are the public-voice variants. This file is
the equations and the named angles. When a sculpture description
needs a number, this is where the number is canonical.
