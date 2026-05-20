# Material science of resins, polymers, and photopolymerisation

The studio runs three fabrication paths that all come down to long
molecules: FDM filament prints (thermoplastic chains, melt-and-extrude),
SLA / DLP / mSLA resin prints (thermoset networks, photo-cure), and
silicone or polyurethane casting (room-temperature cure, mould-and-pour).
This document is the foundational chemistry under all of them, with
specific attention to the resin half because that is where the studio
spends most of its bench time and most of its bench mistakes.

This file is the long-form companion to the codex entry
`material-science-resins`. The codex entry holds the catalogue summary;
this file holds the derivations, the bench numbers, the safety detail,
the citations, and the arguments about why each choice is load-bearing
rather than decorative.

## 1. Polymers — the basics

A **monomer** is a small molecule with two or more reactive sites. A
**polymer** is the long molecule one gets by joining a great many
monomers end-to-end through repeated chemical reactions at those
reactive sites. The **degree of polymerisation** *DP* is the average
number of monomer units per finished chain. For commodity
thermoplastics *DP* runs into the thousands; for photo-cured network
polymers the concept generalises into average chain length between
cross-link points, which is what governs the macroscopic mechanical
properties.

There are two large families of polymer-formation reactions:
**chain-growth** (a radical or ion at the end of a growing chain adds
monomer one unit at a time; this is how acrylates polymerise) and
**step-growth** (any two reactive groups can join, including chain to
chain; this is how nylons and polyesters form). The kinetics are
substantially different — chain-growth is fast and produces long
chains early; step-growth is slow and high molecular weight only
emerges at very high conversion. Odian's *Principles of Polymerization*
(4th ed., Wiley-Interscience, 2004) is the canonical text and treats
both with the appropriate amount of unflinching kinetics.

### 1.1. Chain mobility and the glass transition

Above its **glass transition temperature** *Tg*, an amorphous polymer
has enough thermal energy for chain segments to wriggle past one
another; the material is rubbery and tough. Below *Tg* the segments
are locked; the material is rigid and brittle. For PLA *Tg* ≈ 60 °C,
which is the reason a PLA print loses dimensional stability inside a
hot car. For PETG *Tg* ≈ 80 °C; for ABS ≈ 105 °C. For a typical rigid
cured photopolymer *Tg* sits between 60 and 90 °C depending on
formulation and post-cure quality.

Crystallinity is a separate axis. Some thermoplastics (PLA, nylon)
crystallise partially when they cool, producing regions of orderly
chain packing interspersed with amorphous regions. The crystalline
regions are stiff and dimensionally stable; the amorphous regions
provide toughness. PETG is mostly amorphous, which is why it is clear;
ABS is amorphous, which is why it is too. The optical clarity of any
polymer is largely a question of whether its microstructure has
scattering centres at the wavelength scale.

### 1.2. Thermoplastics

**Thermoplastics** — PLA, PETG, ABS, PA (nylon), PC (polycarbonate),
TPU (thermoplastic polyurethane), the whole FDM aisle — are linear or
branched chains held together by entanglement and weak intermolecular
forces (van der Waals, hydrogen bonds, no covalent cross-links). Heat
softens them; they can be melted, extruded, cooled, re-melted,
re-extruded. There are scission losses each cycle but the material is
recyclable in principle and many times in practice. This is why FDM
works as an additive process at all: the previously-laid layer is
re-melted by the next pass enough for the two to fuse.

The studio's working thermoplastics are PLA (default), PETG (impact
resistance, water-line use), and TPU (flexible parts, the occasional
gasket). Everything else gets sourced as needed. The relevant cross-
reference is the codex entry `fdm-printing` and the apparatus entry
`belt-printer`.

### 1.3. Thermosets

**Thermosets** — UV photopolymer resins, two-part epoxies, silicone
moulds, polyurethane casts — are linear chains that have been
**cross-linked** into a single three-dimensional covalent network
during curing. A thermoset cannot be re-melted because there is no
longer a population of separate chains to slide; the whole object is
one molecule of effectively infinite molecular weight. Heat enough and
it pyrolises, charring rather than flowing.

The cross-link density — the average number of monomer units between
cross-link points — controls almost everything about the cured
material's mechanical response. High cross-link density: stiff,
brittle, dimensionally stable, glassy. Low cross-link density: soft,
tough, rubbery, less dimensionally stable. The same monomer chemistry
can produce both, depending on how much multifunctional cross-linker
the formulation includes.

### 1.4. Why this distinction matters at the bench

For sculpture work where detail and dimensional stability matter,
thermoset photopolymer is the right answer: a resin print holds its
features at room temperature, in summer sun, in the post window. For
production-volume wall art at scale, thermoplastic FDM is the right
answer: PLA on the belt printer produces continuous fabric-like
reliefs at hundreds of grams per hour, and the parts are forgiving of
ambient temperature. For mixed pieces — a resin focal element on an
FDM substrate — both polymers must coexist on the same finished
object, which means matching coefficients of thermal expansion and
choosing adhesives that bond to both. The studio uses cyanoacrylate
(CA) for resin-to-thermoplastic joints; epoxy for resin-to-resin;
mechanical fasteners through inserts for anything load-bearing.

## 2. Photopolymerisation — the chemistry of resin printing

### 2.1. Free-radical photopolymerisation

The standard mechanism for desktop SLA, DLP, and mSLA resins. The
resin in the vat is a mixture of four things:

- **Monomers** — small acrylate or methacrylate molecules. Bulk of
  the formulation by mass (50–80 %). Determines base optical and
  mechanical properties.
- **Multifunctional oligomers** — longer molecules with two or more
  reactive end groups, typically urethane-acrylate or epoxy-acrylate.
  These are the cross-linkers (10–40 %). Determines network density
  and toughness.
- **Photoinitiator** — molecule that absorbs UV photons at the print
  wavelength and fragments into two radicals (0.5–5 %). Common
  desktop chemistries are TPO (diphenyl(2,4,6-trimethylbenzoyl)
  phosphine oxide) for 405 nm and BAPO (bis-acyl-phosphine oxide) for
  385 nm.
- **Pigments, dyes, fillers, stabilisers** — opacifiers, colour,
  inhibitors that prevent dark polymerisation, sometimes silica or
  ceramic fillers (remainder).

The cure sequence runs as follows:

```text
Photoinitiator + UV photon  →  two radicals R•
R• + acrylate C=C            →  R-C-C• (chain initiation)
R-C-C• + acrylate C=C        →  R-C-C-C-C• (propagation)
... repeated many thousands of times ...
two R-C-C• meet              →  R-C-C-C-C-R (termination)
```

Chain propagation continues until either two growing radicals meet
each other (recombination), one radical meets a non-reactive species
(disproportionation), or the chain encounters a network that has
already locked it into place (autoacceleration → vitrification).

Decker and Moussa documented these kinetics in real time with
infrared spectroscopy in their 1988 paper *Real-Time Kinetic Study of
Laser-Induced Polymerization* (Macromolecules 22). They found that at
industrial irradiance (tens of mW/cm²) conversion goes from zero to
60–80 % within milliseconds — fast enough that the rate-limiting step
on a desktop printer is not the chemistry but the LCD refresh and the
mechanical peel between layers. The paper remains the standard
reference for cure kinetics as a function of irradiance, initiator
concentration, and monomer functionality.

### 2.2. Acrylate vs methacrylate

The two monomer chemistries differ by a single methyl group on the
α-carbon of the double bond. The difference looks small on paper and
matters a lot at the bench:

| Property | Acrylate | Methacrylate |
|---|---|---|
| Cure rate | Fast | 5–10× slower |
| Final stiffness | Moderate | Higher |
| Yellowing under UV | More | Less |
| Skin sensitisation | Significant | Significant (slightly less) |
| Typical use | Most desktop resins | Tough, engineering, dental |

Most desktop "standard" resins are acrylate or acrylate-dominant
blends because cure speed translates directly into print time.
"Tough", "durable", "engineering", and "dental" resins are usually
methacrylate-rich because the resulting network is mechanically
better and resists yellowing for editions intended to last.

### 2.3. Cationic photopolymerisation

A separate mechanism used with **epoxy resins** rather than acrylates.
A photo-acid generator (PAG) absorbs UV and releases a strong proton,
which catalyses ring-opening polymerisation of the epoxy monomers.
Unlike radicals, the catalytic proton is not consumed by termination
reactions; it continues curing the resin in the dark for hours after
the UV has stopped.

The pay-off:

- Very low cure shrinkage (1–3 % vs 5–10 % for acrylates).
- Excellent dimensional stability after post-cure.
- Higher *Tg* and better thermal performance.
- Better chemical resistance.

The cost:

- Slower printing (cationic cure rates are lower than radical).
- Sensitivity to humidity and to base contaminants.
- Pricier formulations.
- More demanding bench protocol.

Most desktop machines run radical-acrylate; many industrial dental
and aerospace machines run cationic-epoxy hybrids. The studio's
working materials are all radical-acrylate for now; cationic-epoxy
moves into the conversation when long-term editions need warranted
dimensional stability.

### 2.4. Green strength vs post-cure

A fresh print is **green**: the printer has cured enough of the
monomer to hold the shape, but a meaningful fraction (5–15 %, more in
the bulk where the UV did not penetrate fully) remains un-reacted.
Green strength is real strength — green parts can be handled, washed,
trimmed — but it is not the cured strength and the part is
dimensionally and chemically not yet stable.

Post-cure has two stages:

1. **Wash** — submerge in isopropyl alcohol (IPA) or tripropylene
   glycol monomethyl ether (TPM) for 5–15 minutes, depending on
   geometry and resin. This dissolves the surface film of liquid
   resin without affecting the cured network. IPA is the studio
   default; TPM is gentler on the network and produces less haze
   on clear pieces, at higher unit cost.
2. **UV + heat post-cure** — 15–45 minutes in a turntable oven at
   60–80 °C under 385 / 405 nm UV. The heat raises chain mobility
   above local *Tg* so trapped monomer can find a radical to react
   with; the UV keeps the radical flux going. After post-cure the
   piece is at 1–3 % residual monomer, dimensionally stable,
   optically uniform, mechanically at its rated values.

Skip the post-cure and a piece that looked perfect at the wash
station will warp on a sunlit windowsill three days later. The studio
has the photographs to prove it. Treat post-cure as a non-negotiable
part of the workflow, not an optional finishing step.

## 3. Refractive index and optical properties

### 3.1. The baseline numbers

Clear UV photopolymer resin sits at a refractive index of
approximately 1.49–1.51 at the sodium D line (589 nm), measured on
fully post-cured material at room temperature. For comparison:

| Material | *n* at 589 nm |
|---|---|
| Air | 1.0003 |
| Water | 1.333 |
| Clear photopolymer resin | 1.49–1.51 |
| PMMA (acrylic glass) | 1.49 |
| Polycarbonate | 1.58 |
| Crown glass | 1.52 |
| Dense flint glass | 1.62 |

Clear resin is, optically, essentially acrylic glass — close enough
that the same Snell's-law geometry applies and the same critical-
angle bookkeeping carries through. The waveguide-object codex entry
and the `PHYSICS-WAVEGUIDE-OPTICS.md` long-form treat that geometry
in detail; this document covers only the *material* side of it.

### 3.2. What kills optical clarity

Three things separate a resin that looks clear in a 5 mm puddle from
one that looks clear in a 50 mm sculpture:

- **Bulk transmission** at the wavelength of interest. Photoinitiators
  absorb in the near-UV and tail into the violet; a resin that is
  clear to the eye at 5 mm can have measurable absorption at 405 nm
  in 50 mm.
- **Internal scattering centres**. Incompletely-cured droplets,
  micro-voids from outgassing, dispersed dye clusters, residual
  monomer pockets. Each one scatters at its size scale (Mie at
  wavelength-scale, Rayleigh at sub-wavelength).
- **Refractive uniformity**. Differential cure depth produces index
  gradients; trapped solvent (residual IPA) produces local index
  changes; thermal cycling during post-cure produces stress-induced
  birefringence.

For sculpture-scale (decimetre) waveguide pieces all three matter and
none of them is on the data sheet. The studio characterises each batch
of clear resin with a 100 mm light-pipe test piece, illuminated at one
end with a calibrated 405 nm source, photographed against a
collimating tube. The attenuation curve along the pipe is the working
spec.

### 3.3. Tinted resins

Adding dye lowers transmission at the dye's absorption band and
shifts the refractive index slightly at adjacent wavelengths
(anomalous dispersion). Some dyes also form nano-scale clusters that
scatter in addition to absorbing. The shift to *n* is typically
under 0.01 and ignorable for most geometry; the loss to transmission
is large and not ignorable. For coloured waveguide work the studio
prefers post-printed dyeing (immersion in alcohol-soluble dye after
post-cure) over pre-pigmented resin, because the dye distribution is
under explicit control and not a chemistry surprise.

### 3.4. The studio's working clear resins

Three working formulations:

- **Anycubic Clear** — cheapest competent option. Good for first
  prototypes, mid-sized waveguide pieces. Yellows visibly after
  months of ambient UV exposure; not the right choice for editions
  expected to last a decade.
- **Formlabs Clear V4** — cleaner, dimensionally tighter, lower
  haze. Tightly tied to Form ecosystem but the cured material can be
  re-cast and post-processed identically to any other clear resin.
  The studio standard for mid-range pieces.
- **Henkel Loctite 3D 3843** — industrial-grade, lowest haze, hardest
  to source in small quantities. The choice for limited-edition
  pieces where the optical spec is load-bearing. Holds clarity
  measurably longer than the alternatives under accelerated UV
  ageing.

All three are acrylate-dominant chemistries with TPO photoinitiator,
print at 405 nm, and post-cure on similar schedules. The differences
emerge in the long path and the long time.

## 4. Mechanical properties

### 4.1. Stiffness, strength, toughness

The three properties that matter for sculptural work in cured resin:

- **Young's modulus** *E* — the slope of the stress–strain curve in
  the elastic region. Stiffness. For rigid resins, 1.5–3 GPa; for
  comparison aluminium is 70 GPa, structural steel is 200 GPa, PMMA
  is 3 GPa, ABS is 2 GPa.
- **Tensile strength** *σ* — maximum stress before failure.
  30–80 MPa for rigid resin; 50–70 MPa for typical PLA; 200–400 MPa
  for aluminium.
- **Elongation at break** *ε* — how far the material stretches
  before failure. 2–5 % for rigid clear resin (brittle); 5–15 % for
  tough resin (semi-ductile); 200–400 % for TPU (flexible).

The honest summary for clear rigid resin is: stiff, moderately
strong, **brittle**. Drop a clear-resin pendant on a flagstone and
it shatters along whichever microcrack was closest to threshold.
This is a material limitation, not a print quality issue.

### 4.2. Tough resins as copolymer blends

"Tough" and "durable" resins are copolymer blends — rigid acrylate
backbones plus rubbery oligomeric segments that absorb impact energy.
They sacrifice some stiffness and some optical clarity in exchange
for higher elongation at break and Charpy impact resistance closer
to ABS than to acrylic glass. The trade space:

| Material | E (GPa) | σ (MPa) | ε (%) | Charpy (kJ/m²) |
|---|---|---|---|---|
| Clear rigid resin | 2.5 | 60 | 3 | 2 |
| Tough resin | 1.5 | 40 | 12 | 30 |
| PLA | 3.5 | 65 | 4 | 5 |
| ABS | 2.0 | 45 | 15 | 25 |
| TPU 95A | 0.05 | 30 | 400 | — |

For waveguide pendants, rigid clear is the right call (clarity wins,
the piece is not impact-rated anyway). For controller bodies and
bezel clips on the POV rigs, tough resin is the right call (the
piece will be dropped, sat on, posted in a padded envelope). For
flexible gaskets and shock-absorbing mounts, TPU.

### 4.3. Anisotropy from print direction

Resin prints are anisotropic: the layer planes are the weak axis.
Cross-linking within a layer is essentially complete (lateral
connectivity is excellent because the whole layer cures together);
cross-linking between layers depends on monomer diffusion across the
still-wet interface before the next exposure locks it. A part loaded
in tension along the build axis (perpendicular to the layers) fails
along a layer plane at 70–80 % of the load required to fail the same
part loaded parallel to the layers.

Print orientation is therefore a structural decision, not a slicer
preview decision. For waveguide pieces the rule is to orient the
long optical path within a single layer plane wherever possible; for
load-bearing parts the rule is to align principal stress directions
with the layer plane. Neither is automated by a default slicer.

## 5. Process — from STL to finished object

The complete bench workflow for a resin piece:

1. **Slice** — orient the model on the build plate, generate
   supports, slice to layer-image stack. Layer height typically
   25–100 μm. Supports are necessary for any overhang past ~30°.
2. **Print** — mSLA machine cures one layer at a time. A 100 mm-tall
   piece at 50 μm layer height is 2000 layers; at 2 s per layer this
   is just over an hour.
3. **Wash** — submerge in IPA or TPM, agitate for 5–15 minutes. Two
   tanks (dirty wash and clean rinse) extend the working life of the
   solvent.
4. **Dry** — air-dry or compressed-air blow-off until no IPA remains.
   Residual IPA in surface pockets causes hazing during post-cure.
5. **Post-cure** — 15–45 minutes in turntable UV oven at 60–80 °C.
   Time and temperature are resin-dependent.
6. **Support removal** — clip supports as close as practical;
   sand/polish witness marks. Done after post-cure because supports
   are easier to break from cured-stiff material than from green-
   flexible.
7. **Finish** — sand (400 → 800 → 1500 → 2500 grit progression for
   optical surfaces), polish (cerium oxide on felt), optionally
   vapour-smooth (very brief IPA vapour exposure for moderate clarity
   gain at high mechanical risk).

Pham and Gault's 1998 comparison of rapid prototyping technologies
(Int. J. Machine Tools & Manufacture 38) is still useful as a
trade-off-axes reference even though every specific machine they
cited is now in a museum. Their ranked axes — resolution, speed,
material range, cost per part — are the axes that matter today; the
numbers have moved by orders of magnitude, the ranking has not.

## 6. Health and safety

This is the boring half of the document and it is non-negotiable.

### 6.1. The hazard profile

**Uncured liquid resin** is the danger. It is a skin sensitiser:
repeated contact in a non-trivial fraction of the population
produces contact dermatitis (red, itchy, weeping), and once
sensitised one stays sensitised — there is no de-sensitising
treatment. Inhalation of vapour or aerosol is also a sensitisation
route. Eye contact is straightforwardly damaging. The IPA used for
washing is its own flammability and inhalation hazard.

**Cured resin** is inert and safe to handle bare-handed. The danger
is the liquid and the IPA-soluble film. Cured resin dust from
sanding is a nuisance dust (mask recommended) rather than a
chemical hazard.

### 6.2. Bench PPE — the rules

The studio's bench protocol:

- **Nitrile gloves** during any contact with liquid resin, dirty
  IPA, or wet prints. Latex dissolves in IPA; vinyl is permeable;
  nitrile is the working glove. Change gloves the moment they show
  visible contamination on the outside.
- **Safety glasses or goggles** during pour, decant, vat-fill, vat-
  empty, and clean-up. The eye is the part that does not heal.
- **Respirator** — FFP3 disposable or half-mask with organic-vapour
  cartridge — when handling open vats for more than a minute or two,
  or whenever IPA fumes are noticeable. Print rooms benefit from
  active extraction or open windows.
- **Dedicated bench area**. Resin work happens on a sacrificial
  bench surface that never contacts food, the sculpting desk, the
  computer keyboard, or anywhere a tired evening might lead to
  cross-contamination. Wipe down with IPA after every session.
- **Long sleeves and a dedicated apron** are sensible additions.
  Resin splash on bare forearm during a long wash is the bench
  accident the studio has had most often.

None of this is optional or dramatic; it is just the price of being
able to do this work for years without acquiring a permanent contact
allergy. The studio knows three otherwise-competent people who can
no longer print resin because they did not respect the protocol.

### 6.3. Waste handling

- **Liquid waste** — failed pours, dirty IPA, used drain trays.
  Decant into a clear shallow tray, leave in sunlight (or in the
  post-cure oven) until fully cured to a solid disc. Solid cured
  resin is inert and goes in the household waste stream.
- **Solid waste** — failed prints, supports, sanding dust. Cured;
  household waste.
- **Used gloves, paper towels, wash cloths** — bag in a sealed
  plastic bag; let cure under UV before disposal in household waste.
- **Empty resin bottles** — drain residual into the wash tray, leave
  to cure, recycle the plastic bottle in the normal stream.

Never pour liquid resin down a drain; never put liquid-contaminated
PPE in the bin. UK regulation varies by council; check local rules.
The principle — *cure it before you bin it* — is universal.

## 7. Material choice per Holoflow surface

The studio runs five fabrication surfaces and each one points at its
own polymer. The table is the catalogue summary; the paragraphs that
follow are the workshop reasoning.

| Surface | Polymer | Why |
|---|---|---|
| Waveguide sculpture line | Clear rigid photopolymer | Optical clarity, dimensional stability, crisp detail |
| Belt-printed wall reliefs | PLA or PETG (FDM) | Volume, length, layer-on-layer adhesion on tilted bed |
| Bezel-clip controller bodies | Tough resin | Impact resistance, screw-thread engagement |
| Jewellery editions (cast) | Castable wax-loaded resin | Burns out cleanly for lost-wax bronze |
| Jewellery editions (direct) | Tough or clear photopolymer | Resin as the final material; no casting step |
| Edition certificate base | Paper / card + occasional resin medallion | Archive-grade paper for the document; resin for cabochon pieces |

### 7.1. Waveguide sculpture line — clear rigid resin

The piece is its own optical medium. Clarity wins over every other
property. Rigid clear resin (Anycubic Clear, Formlabs Clear V4,
Henkel Loctite 3D 3843), post-cured to full conversion, polished or
vapour-smoothed at extraction surfaces. Print orientation is chosen
to keep the longest optical path within a single layer plane.
Brittleness is accepted as part of the trade.

### 7.2. Belt-printed wall reliefs — PLA or PETG

Photopolymer is not in the running for the belt printer. The
machine cures layer-on-layer at a tilted bed against a moving
PEI-coated belt; the chemistry of UV cure is not compatible with
that geometry. PLA is the studio default (cheap, prints reliably,
acceptable mechanical properties for wall art); PETG is the
upgrade where the piece will live near water or in sunlight (lower
*Tg* is acceptable; UV resistance is better than PLA). Both
thermoplastics; both melt-and-extrude; both reusable. See
`belt-printer` and `fdm-printing`.

### 7.3. Bezel-clip controller bodies — tough resin

Controller bodies for the POV rigs need impact resistance (drop
from waist height onto a flagstone, repeatedly, in the dark),
screw-thread engagement (electronics mount inside via M3 inserts),
and dimensional stability under hand temperature. Tough resin
(Formlabs Tough 1500, Anycubic ABS-like) is the right balance.
Optical clarity is irrelevant; mechanical robustness is everything.

### 7.4. Jewellery editions — castable or direct

Two paths:

- **Castable wax-loaded resin** — print the piece in a wax-loaded
  formulation (Formlabs Castable Wax 40, Anycubic Castable). The
  printed piece is the wax pattern for lost-wax bronze casting:
  invest in plaster, burn out in the kiln (the wax-loaded resin
  pyrolises cleanly leaving a void), pour bronze, break out, finish.
  The final piece is metal; the resin was a one-time scaffold.
- **Direct UV-resin print** — print in tough or clear resin, post-
  cure, polish, mount. The final piece is the printed material. For
  small pendants and pieces where the polymer aesthetic is wanted,
  this is the studio path. For pieces that need to be metal, the
  castable path is the only path.

### 7.5. Edition certificate base — paper plus

The Certificate of Authenticity for each edition is archive-grade
paper, signed by Dimona, embossed with the studio seal, numbered
within the edition. For cabochon-style editions the base optionally
includes a thin clear-resin medallion holding a fragment of the
print itself — the offcut piece, post-cured, set into a paper
recess. The polymer carries provenance the same way a wax seal
once did, which is the kind of joke the studio enjoys when
properly tired.

## 8. Cross-links

- `material-science-resins` — the codex catalogue entry that
  summarises this document.
- `fdm-printing` — thermoplastic fabrication, the FDM side of the
  bench.
- `belt-printer` — the production-volume path for wall reliefs.
- `waveguide-object` — apparatus-level entry for the sculpture line.
- `waveguide-optics-deep-dive` — the optics half of the waveguide
  pieces, where this document's refractive-index discussion connects
  to Snell, TIR, and Fresnel.
- *future* `lattice-mathematics` — the TPMS substrates (gyroid,
  Schwarz, Neovius) the waveguide pieces sit on.
- `PHYSICS-WAVEGUIDE-OPTICS.md` — long-form companion on the optics
  side.

## 9. References

- **Odian, G.**, *Principles of Polymerization* (4th ed., Wiley-
  Interscience, 2004). Canonical textbook on chain-growth, step-
  growth, kinetics, and thermodynamics of polymerisation. The 1991
  edition will serve if the fourth is on loan.
- **Decker, C. & Moussa, K.**, *Real-Time Kinetic Study of Laser-
  Induced Polymerization* (Macromolecules 22, 1988). Standard
  reference for photo-cure kinetics as a function of irradiance,
  initiator concentration, and monomer functionality.
- **Pham, D. T. & Gault, R. S.**, *A comparison of rapid prototyping
  technologies* (Int. J. Machine Tools & Manufacture 38, 1998). Old
  enough to be historical, current enough that the trade-off axes
  are still the right ones.
- **Manufacturer data sheets** — Formlabs, Anycubic, Henkel Loctite,
  and others (cited as a category). Each formulation has its own
  PDF; the studio treats them as starting points for bench
  characterisation rather than gospel. Printed values rarely match
  advertised ones to better than ten per cent.
- **Hecht, E.**, *Optics* (5th ed., Pearson, 2017), Ch. 3. Cross-
  reference for refractive index, dispersion, and the optics-side
  derivations referenced here without proof.

---

When this file goes over 500 lines, it splits per the studio
convention into named sub-files
(`PHYSICS-MATERIAL-POLYMERS.md`,
`PHYSICS-MATERIAL-PHOTOCURE.md`,
`PHYSICS-MATERIAL-OPTICAL.md`, etc.) with the present file becoming
the table-of-contents stub.
