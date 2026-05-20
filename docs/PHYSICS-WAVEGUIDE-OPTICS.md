# Waveguide optics — the deep dive

A polite agreement between light and a material: *stay inside, take
the long way round, come out where I tell you.* The agreement is
enforced by three equations and a small handful of named angles, and
once one understands those, the whole family of glowing-from-within
objects on the studio shelves stops being magic and becomes
bookkeeping — albeit bookkeeping with a flair for drama.

This file is the long-form companion to `PHYSICS_AND_OPTICS.md`. That
file holds the bench reference, the named angles, the working tables.
This file holds the derivations, the histories, the citations, and the
arguments about why each equation is load-bearing rather than
decorative.

## 1. Refractive index and the speed of light

The **refractive index** *n* of a medium is defined as the ratio of
the speed of light in vacuum *c* to its phase speed *v* in the medium:

```text
n = c / v
```

It is the parameter that quietly governs every other quantity in this
document. Air sits at *n* ≈ 1.0003 and is rounded to 1.000 for all
working purposes. Water sits at 1.333. Clear UV photopolymer resin at
the bench sits at 1.49–1.51 measured at the sodium D line (589 nm) —
slightly higher in the blue, slightly lower in the red, because *n*
is in general a function of wavelength. That wavelength dependence is
**dispersion** (Hecht, *Optics*, Ch. 3), and it is what makes a glass
prism throw a rainbow rather than a white slit.

For the present document, *n* will be taken at 589 nm unless stated
otherwise. The studio's working assumption — *n* ≈ 1.50 for clear
resin in air — is good to one part in a hundred for all the
geometrical-optics calculations that follow.

## 2. Snell's law from Fermat's principle

Snell's law arrives in most textbooks as a fait accompli:

```text
n₁ · sin(θ₁) = n₂ · sin(θ₂)
```

It is more satisfying as a consequence of **Fermat's principle of
least time**, formulated by Pierre de Fermat in 1662. The principle
states that light, given a choice of paths between two fixed
endpoints, takes the path for which the total optical length is
*stationary* — usually a minimum, occasionally a saddle, never a
generic maximum in well-behaved geometries.

Take two endpoints A and B on opposite sides of a flat interface
between media of indices *n₁* and *n₂*. Let *x* be the position at
which a candidate ray crosses the interface, and let the two leg
lengths be *L₁(x)* and *L₂(x)*. The total optical path length is

```text
S(x) = n₁ · L₁(x) + n₂ · L₂(x)
```

Setting dS/dx = 0 and using the geometry of the triangles
(sin θ₁ = horizontal component of L₁ / L₁, and similarly for L₂)
gives

```text
n₁ · sin(θ₁) - n₂ · sin(θ₂) = 0
```

— precisely Snell's law. The derivation is Euler–Lagrange equation
for a one-dimensional functional with one degree of freedom (the
crossing point). The light is not being clever; refraction is the
unique path that is stationary under small perturbations of the
crossing point.

Fermat's principle survives quantum mechanics: Feynman's path-integral
formulation reduces to it in the short-wavelength limit, with paths
near the stationary-action one contributing coherently and the rest
cancelling. This is the deep reason that geometric optics works at all
in a world that is really wave optics underneath. Born & Wolf
(*Principles of Optics*, Ch. 3) give the full WKB derivation.

## 3. Total internal reflection and the critical angle

Solve Snell's law for the angle at which light tries to leave a denser
medium:

```text
sin(θ₂) = (n₁ / n₂) · sin(θ₁)
```

If *n₁* > *n₂*, the right-hand side can exceed unity, at which point
the equation has no real solution for θ₂. The threshold is the
**critical angle** *θ_c*:

```text
θ_c = arcsin(n₂ / n₁)
```

Beyond *θ_c*, all incident energy reflects back into the denser
medium. This is **total internal reflection (TIR)**, and it is the
single most load-bearing optical mechanism in the studio's
sculpture line.

For clear resin in air (1.50 → 1.00) the critical angle is

```text
θ_c = arcsin(1.00 / 1.50) = arcsin(0.6667) = 41.81°
```

The solid-angle fraction of the internal hemisphere above the
critical angle is

```text
f_TIR = cos(θ_c) = √(1 - (n₂/n₁)²) = 0.7454
```

— a fraction shy of three-quarters of all internal ray directions are
trapped. Once light has entered the resin and lost enough of its
forward momentum to scatter into that hemisphere (by a roughened
surface, a tilted entry face, an extraction feature inside the bulk),
it cannot leave again except at chosen escape points.

TIR was described by Johannes Kepler in *Dioptrice* (1611) and
quantified after Snell published his sine law in 1621. The studio's
**waveguide-object** line, the **gyroid-surfaces** wall reliefs, and
every fibre-optic phone call from Tokyo to London all use the same
mechanism Kepler noticed in a water glass.

### The evanescent wave

A pedant's footnote: TIR is not quite as total as the geometric-optics
account makes it sound. The boundary conditions on Maxwell's equations
require the wave to penetrate a fraction of a wavelength into the less
dense medium as an **evanescent field** that decays exponentially.
Bring a second piece of glass within a few hundred nanometres and the
field couples through; this is **frustrated TIR**, the operating
principle of fingerprint scanners. For sculpture-scale geometry it
does not matter; for sub-micron contact between two polished resin
elements, it eventually will.

## 4. Fresnel equations and Brewster's angle

Below the critical angle, light is not all-or-nothing. Some reflects,
some transmits, and the fraction depends on both the angle of
incidence and the **polarisation** of the incoming wave. The
**Fresnel equations**, derived by Augustin-Jean Fresnel in 1821 from
the continuity of the electric and magnetic fields at a dielectric
interface, give the two reflectance coefficients explicitly:

```text
r_s = (n₁ cos θ₁ - n₂ cos θ₂) / (n₁ cos θ₁ + n₂ cos θ₂)
r_p = (n₂ cos θ₁ - n₁ cos θ₂) / (n₂ cos θ₁ + n₁ cos θ₂)
```

Here *s* (from German *senkrecht*, perpendicular) denotes polarisation
perpendicular to the plane of incidence and *p* (parallel)
polarisation in that plane. The reflectances are

```text
R_s = |r_s|²       R_p = |r_p|²
```

At normal incidence (θ₁ = 0) the two coincide:

```text
R = ((n₁ - n₂) / (n₁ + n₂))²
```

— which gives 4% for the air→resin interface, the four-per-cent
Fresnel tax every entry face of every waveguide pays.

### Brewster's angle

The two curves diverge at oblique angles, and the *p* curve passes
through zero at a particular angle:

```text
θ_B = arctan(n₂ / n₁)
```

This is **Brewster's angle**, named for Sir David Brewster who
identified it in 1815. At θ_B, light polarised parallel to the plane
of incidence transmits without reflection at all. For the air→resin
interface, θ_B = arctan(1.50) = 56.3°. The unreflected light at
Brewster's angle is the principle that lets polarising sunglasses
suppress road glare (horizontal road surfaces near θ_B return almost
purely horizontally polarised light, which a vertical analyser
rejects) and that lets a polarised camera filter cut through window
reflections to see what is behind them.

For sculpture work, Brewster's angle matters in two places. A piece
illuminated at near-Brewster oblique angles shows a polarisation
signature that a flat-on photograph loses, and bench photography
through a rotating polariser reveals mechanical-stress patterns
inside cured resin — a useful diagnostic for under-cured pieces. The
planned caustic-projector chamber uses a Brewster-angle entry face
on the lens to suppress front-face reflection without an AR coating —
a workshop trick that costs nothing once the geometry is set.

## 5. Graded-index waveguides

Total internal reflection assumes a sharp interface between *n₁* and
*n₂*. Smooth the interface into a continuous gradient and the
mathematics becomes prettier and the engineering harder. In a
**graded-index (GRIN) medium**, the refractive index *n(r)* varies
continuously through space, and rays curve continuously rather than
reflecting. The ray equation is

```text
d/ds (n · dr/ds) = ∇n
```

— the optical analogue of Newton's second law, with the index
gradient playing the role of a force and arc-length *s* playing the
role of time. Born & Wolf (Ch. 3) derive this from Fermat's principle
by treating *n(r)* as a position-dependent Lagrangian. Inside a
parabolic profile, rays oscillate sinusoidally about the axis; the
medium acts as a continuous lens with no curved surface. Selfoc
lenses, gradient-index endoscope rods, and the eye lenses of certain
deep-water fish all exploit this. Atmospheric GRIN over warm ground
is what produces mirages.

The studio does not currently print GRIN media — the index variation
required is below what variable-density resin can deliver at consumer
scale — but multi-material systems in development put it within a
few years of reach. The section is therefore future-tense
load-bearing.

## 6. Whispering gallery modes

Curve the interface tightly enough and a third trapping regime opens.
Light can circulate around the inside of a polished curve as a
**whispering gallery mode (WGM)**, trapped not by an angular
threshold but by the geometry of the boundary itself. The resonance
condition is straightforward:

```text
m · λ = 2π · R · n
```

— an integer number *m* of wavelengths must fit around the perimeter
of the curved boundary of radius *R*. Modes that satisfy this
condition build up constructively over many orbits; modes that do
not, dephase and die. The **quality factor** *Q* of such a
resonator can reach extraordinary values: a clean fused-silica
microsphere can sustain optical Q above 10¹⁰, meaning a photon
trapped in the surface mode survives some ten billion orbits before
being lost to absorption or scattering loss.

The acoustic analogue — voices skimming the curved wall of the dome
at St Paul's Cathedral in London — gave the phenomenon its name, by
way of Lord Rayleigh's *The Theory of Sound* (1894) and his later
1910 *Philosophical Magazine* note on the acoustics of the whispering
gallery. The optical treatment matured in the same 1923-vintage wave
of theoretical work in which Peter Debye, building on Gustav Mie's
1908 analysis of light scattering by dielectric spheres, gave the
exact electromagnetic solution for resonances in a dielectric
sphere. The studio reaches for the Mie–Debye treatment when checking
the expected Q of a polished bead or a microsphere coupled to a
fibre taper.

For sculpture purposes, WGM resonance is the principle that explains
why a polished sphere of clear resin glows around its equator when
edge-illuminated, why a torus of the right radius behaves
qualitatively differently from a slightly larger or smaller torus,
and why the polish on the equatorial belt matters more than the polish
on the poles for a luminous-sphere piece.

## 7. Bend-radius constraints

The bookkeeping has a price: total internal reflection only survives
if the ray angle relative to the local surface normal stays above the
critical angle. Curve a waveguide too sharply and the geometry tips
rays past θ_c; light spills out into the cladding (the air, in the
studio's case) and the waveguide darkens beyond the bend. For a
straight tube of cross-section radius *r* and a small-angle bend of
radius *R*, the ray angle at the outer wall is reduced by
approximately arctan(r/R). Setting this reduction to drop the ray
just past the critical-angle margin gives

```text
R_min ≈ r / (1 - sin(θ_c))
```

At r = 1 mm and θ_c = 41.8°, R_min ≈ 3.0 mm. A 2 mm-diameter resin
tube can be bent to a 3 mm radius and still guide. Below that, light
escapes through the outer wall and the waveguide goes dark beyond the
bend — usually with a visible bright spot at the bend itself, which
is photogenic enough that the studio has been known to engineer such
losses deliberately.

The constraint sets the geometric envelope every internal channel in
the **waveguide-object** and **gyroid-surfaces** lines lives inside.
The gyroid is particularly accommodating: its principal curvatures
are bounded and well-conditioned across the surface, so once the unit
cell size is chosen, the worst-case bend radius is determined and can
be checked against the threshold above.

## 8. Caustic surfaces and the inverse problem

Light leaving a curved refracting or reflecting surface does not
spread uniformly. Rays accumulate on an envelope — the **caustic** —
on which the intensity is formally divergent in the geometric-optics
limit. The shimmering net at the bottom of a swimming pool, the
bright crescent inside a tea cup, and the parabolic focus of a
satellite dish are all caustics. Catastrophe theory (Arnold, 1970s)
classifies the stable singularity types: in three dimensions exactly
five — fold, cusp, swallowtail, hyperbolic umbilic, elliptic umbilic.

For sculpture work, the useful question is the inverse one: *given a
desired light pattern, find the refracting surface whose caustic is
that pattern.* This **caustic-design inverse problem** is hard
because the underlying Monge–Ampère equation is fully nonlinear in
the second derivatives of the height field:

```text
det(D²h) = f(x,y) / g(T(x,y)) · det(DT)
```

where *h* is the lens height field, *f* the source distribution,
*g* the target, and *T* the transport map. Schwartzburg, Testuz,
Tagliasacchi & Pauly (SIGGRAPH 2014) and the contemporaneous Yue,
Iwasaki, Chen, Dobashi & Nishita Tokyo paper decompose the problem
into an **optimal-transport** stage (computing *T* as a
Monge–Kantorovich problem) and a **height-field integration** stage
that constructs *h* from the transport map's gradient. The EPFL
contribution is a discrete solver robust enough for high-contrast
targets and a smoothness regulariser that produces a millable surface
rather than a high-frequency hash. The studio's caustic-projector
discs descend from this pipeline; see `caustics`.

## 9. Antireflection coatings

Every entry face pays a Fresnel tax of 4 % at normal incidence into
clear resin. The same 4 % reflects off every internal resin-air
interface inside the piece; after twenty such interfaces only 44 % of
the light remains.

A **quarter-wave antireflection coating** recovers most of that tax.
A thin film of refractive index

```text
n_film = √(n_air · n_substrate)
```

and optical thickness *λ*/4 produces two reflected wavefronts — one
from the air-film interface, one from the film-substrate interface —
that travel a half-wavelength extra round trip and emerge exactly π
out of phase. They cancel by destructive interference; the front-face
reflection vanishes at the design wavelength.

The condition is exact only at the design wavelength and normal
incidence. **Magnesium fluoride** (*n* ≈ 1.38) is the textbook
single-layer coating for glass and brings normal-incidence reflectance
from 4 % to about 1.3 %; modern multi-layer dielectric stacks reach
below 0.5 % across the visible. The principle that gives soap films
their iridescent rims and butterfly wings their structural blues — run
in reverse for suppression rather than colour. The studio does not
currently apply AR coatings (vacuum deposition is not on the bench),
which is why the projector chamber falls back on the Brewster-angle
trick from §4.

## 10. Refractive indices the studio actually works with

Workshop-Dimona reasserts herself here, because the catalogue rounds
and the bench measurements diverge. The standard clear UV resins the
studio runs — Elegoo Standard, Anycubic Basic, Phrozen Aqua-Gray
after polish — sit at *n* ≈ 1.49 measured at 589 nm on the bench
refractometer. The Formlabs Clear v4 control I use for known-good
waveguide coupons measures 1.51, which is the number the spec sheet
gives. Tinted variants creep up to about 1.56 depending on dye
loading; a black-tinted "stealth" resin I once tested measured 1.58,
but it was effectively opaque past 5 mm so the index was academic.

For comparison: ordinary soda-lime crown glass is 1.52 — sitting
cleanly in the middle of the resin range, which is why a resin and a
glass bead held side-by-side in a beam look almost indistinguishable.
Dense **flint glass** (the stuff old chandelier drops are cut from)
is 1.62, and that extra index buys it a critical angle of 38.1°
against air and the visible sparkle one expects from cut crystal.
**Diamond**, for the record, is 2.42 — the highest practical index
of any common transparent solid and the reason a brilliant cut traps
almost every ray that enters the table facet.

| Material                    | *n* at 589 nm | θ_c against air | Trapped hemisphere |
|-----------------------------|---------------|-----------------|--------------------|
| Air (reference)             | 1.000         | —               | —                  |
| Water                       | 1.333         | 48.6°           | 33.9 %             |
| Clear photopolymer resin    | 1.49–1.51     | 41.8°           | 70.6 %             |
| Tinted photopolymer resin   | 1.51–1.56     | 39.9–41.1°      | 71.7–73.5 %        |
| Soda-lime crown glass       | 1.52          | 41.1°           | 71.7 %             |
| PMMA (acrylic)              | 1.49          | 42.1°           | 70.1 %             |
| Flint glass                 | 1.62          | 38.1°           | 76.0 %             |
| Diamond                     | 2.42          | 24.4°           | 90.1 %             |

"Trapped hemisphere" is the fraction of internal ray directions
beyond the critical angle. Diamond's 90 % is the geometric reason
brilliant-cut diamonds sparkle as they do; resin's 70 % is the
geometric reason a thick-walled clear-resin pendant glows from the
inside rather than from the outside.

A 7 % increase in trapped-hemisphere fraction (1.49 → 1.62) compounds
over a 50 mm waveguide into roughly twice the light delivered to the
far end. This is why material choice is load-bearing for the
waveguide line and not finish.

## 11. Where this lives in Holoflow

Three product families depend on the equations above being
load-bearing rather than ornamental:

- **The waveguide-object sculpture line.** Clear-resin pieces whose
  internal geometry traps light by TIR and releases it at chosen
  extraction features. The 41.8° critical angle, the 3 mm minimum
  bend radius, and the 4 % Fresnel tax per interface are all
  load-bearing constraints. See `waveguide-object`.

- **The gyroid-surfaces wall reliefs.** Triply-periodic minimal
  surfaces (Schoen, 1970) used as substrate for wall-scale luminous
  reliefs. The gyroid's principal curvatures are bounded, so the
  worst-case bend radius is determined by unit-cell size and can be
  checked against the 3 mm threshold above. See `gyroid-surfaces`.

- **The planned caustic-projector chamber.** A dark-walled box with
  a milled acrylic lens at its mouth and a point LED behind it,
  throwing a chosen image as a caustic onto its facing wall. The
  lens is computed by Schwartzburg et al.'s inverse-transport
  algorithm and milled rather than printed. The image is not on the
  disc; the image is the caustic the disc throws. See `caustics`.

A forthcoming `light-painting-physics` will close the loop with the
photographic-capture side.

## 12. Further reading and citations

- **Hecht, *Optics*** (5th ed., Pearson, 2017). The working reference
  on the bench. Snell, Fresnel, TIR, thin-film interference, caustics
  qualitatively at undergraduate level.
- **Born & Wolf, *Principles of Optics*** (7th expanded ed.,
  Cambridge, 1999). The longer-walked text when a derivation must be
  checked against first principles — the standard reference on
  Fresnel, GRIN media via Fermat, and the Mie–Debye theory of
  dielectric-sphere resonances.
- **Schwartzburg, Testuz, Tagliasacchi & Pauly**, *High-Contrast
  Computational Caustic Design* (ACM TOG 33(4), SIGGRAPH 2014). The
  optimal-transport algorithm the studio's caustic pipeline descends
  from.
- **Yue, Iwasaki, Chen, Dobashi & Nishita**, *Poisson-Based
  Continuous Surface Generation for Goal-Based Caustics* (ACM TOG
  33(3), 2014). The contemporaneous Tokyo paper.
- **Mie, G.**, *Beiträge zur Optik trüber Medien* (Annalen der
  Physik 25, 1908). The founding paper on light scattering by
  dielectric spheres; the starting point for the Debye–Mie series
  treatment of whispering gallery resonances developed in the early
  1920s.
- **Rayleigh, Lord**, *The Problem of the Whispering Gallery*
  (Philosophical Magazine 20, 1910). The original acoustic analysis
  that named the phenomenon.
- **Schoen, A. H.**, *Infinite periodic minimal surfaces without
  self-intersections* (NASA TN D-5541, 1970). The gyroid's first
  appearance.
- **Arnold, V. I.**, *Catastrophe Theory* (Springer, 1984). The
  classification of caustic singularities cited above without proof.

## 13. Cross-links

- `caustics` — caustic geometry, Arnold classification, inverse design.
- `waveguide-object` — the sculpture line at the apparatus level.
- `gyroid-surfaces` — the TPMS substrate the waveguide pieces sit on.
- `light-painting-physics` (forthcoming) — photographic-capture side.
- `PHYSICS_AND_OPTICS.md` — bench reference; named angles, working
  tables, regime classification.
- `/visualiser/total-internal-reflection` — interactive demo.
- `/visualiser/caustic-projector` — forward caustic projection.

When this file goes over 300 lines, it splits per `ARCHITECTURE.md`
Rule 1 into named sub-files (`PHYSICS-WAVEGUIDE-TIR.md`,
`PHYSICS-WAVEGUIDE-FRESNEL.md`, etc.).
