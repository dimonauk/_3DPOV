# MATH-RD-AND-TPMS

Reaction-diffusion patterns and triply periodic minimal surfaces — the
long-form companion to the codex entry
`reaction-diffusion-and-tpms`. Two topics, one document, because the
studio uses them as a pair: reaction-diffusion paints, TPMS sculpts,
and a piece will often combine both.

The codex entry is the catalogue gloss; this is the working notes
underneath it. Princess teaching register throughout. British spelling.

---

## Part 1 — Reaction-diffusion (Turing patterns)

### The 1952 paper that nobody read for thirty years

Alan Turing's *The Chemical Basis of Morphogenesis* appeared in
*Philosophical Transactions of the Royal Society B* in 1952. Two years
later he was dead; the paper sat largely unread for the rest of the
decade. The biologists who might have tested its predictions in real
embryos didn't have the maths; the mathematicians who had the maths
weren't testing embryos; computers large enough to evolve the equations
at any useful resolution didn't yet exist.

The central question is the oldest one in biology: how does a uniform
blob of cells decide where the spots, stripes, fingers and toes go?
Turing's answer was structurally elegant. Suppose two substances —
he calls them morphogens, the studio will call them *u* and *v* —
diffuse through the cellular sheet and react with each other. Suppose
further that one (call it the **activator**) catalyses both its own
production and that of the other (the **inhibitor**); and that the
inhibitor diffuses *faster* than the activator.

The fast inhibitor sweeps the neighbourhood clean. The slow activator
builds up locally. Islands of activator form, surrounded by moats of
inhibitor. The pattern is set by the diffusion constants and the
reaction kinetics; the *size* of the spots is set by how fast the
inhibitor outruns the activator. The leopard's coat, the zebrafish's
flank and the angelfish's stripes all come out of variants of the same
equation.

Turing didn't have the computer to render the result. James Murray's
1980s textbook treatment, plus the gradual accumulation of experimental
reaction-diffusion systems (Belousov-Zhabotinsky, the chlorite-iodide
reaction, the gas-phase oscillations in CO oxidation), brought the
paper back into circulation. By the 1990s it was canon.

### The Gray-Scott model

The cleanest modern reaction-diffusion system, and the one the studio's
visualiser at `/visualiser/reaction-diffusion` evolves, is Gray-Scott.
Two scalar fields *u* and *v* live on a 2D grid and follow:

```
∂u/∂t = D_u ∇²u  −  u v²  +  F (1 − u)
∂v/∂t = D_v ∇²v  +  u v²  −  (F + k) v
```

Reading the terms left to right:

- `D_u ∇²u` and `D_v ∇²v` — pure diffusion. Each field spreads with
  its own diffusion constant. The crucial inequality is
  `D_u > D_v`: the substrate diffuses faster than the activator. In
  the studio's default visualiser parameters, `D_u ≈ 0.16` and
  `D_v ≈ 0.08`.
- `−u v²` in the *u* equation and `+u v²` in the *v* equation — the
  reaction. Substrate *u* is consumed at a rate proportional to *u*
  and to *v* squared; activator *v* is produced at the same rate.
  The quadratic dependence on *v* is what makes the reaction
  autocatalytic: more *v* means faster production of more *v*.
- `+F (1 − u)` — the **feed term**. Substrate is replenished from a
  reservoir held at unit concentration; the rate constant *F* is the
  *feed rate*. When *u* is depleted it gets topped up.
- `−(F + k) v` — the **kill term**. Activator decays back to nothing
  at rate *(F + k)*. The decay rate is tied to the feed rate so the
  closed system has a stable trivial steady state at *u = 1, v = 0*.

Two parameters move and the entire pattern atlas with them: *F* and
*k*. Everything else is conventionally fixed. The studio's slider
controls in the visualiser are wired directly to these two numbers.

### The Pearson atlas

John Pearson's 1993 paper in *Science*, *Complex Patterns in a Simple
System*, walked the (F, k) plane systematically and named twelve
qualitatively distinct steady states. The geography is delicate; a
tenth of a percent in either direction can throw the pattern from
stable spots into spawning mitosis or chaotic twitching.

| Region (F, k) | Pattern | What it looks like |
|---|---|---|
| F ≈ 0.035, k ≈ 0.065 | Stationary spots | Discrete circular activator islands, locked in place |
| F ≈ 0.029, k ≈ 0.057 | Stripes | Parallel ridges with branching defects, like fingerprints |
| F ≈ 0.012, k ≈ 0.050 | Spirals | Rotating wave fronts; Belousov-Zhabotinsky-style swirls |
| F ≈ 0.040, k ≈ 0.060 | Mitosis | Spots that bud and divide; the field is never still |
| F ≈ 0.026, k ≈ 0.061 | Worms | Long sinuous trails that wander and merge |
| F ≈ 0.018, k ≈ 0.051 | Holes | Inverse spots — circular pits in a uniform sea of activator |
| F ≈ 0.090, k ≈ 0.057 | Chaos | No steady state; the field twitches forever |

Pearson's classification names each region with a Greek letter (α, β,
γ, δ, ε, …). The visualiser displays the letter as a label on the
slider so a visitor knows which neighbourhood of the atlas they are
exploring.

### Why diffusion-driven instability is counter-intuitive

Diffusion on its own *smooths*. Heat a metal bar in the middle and the
spike spreads outwards and flattens; that is what diffusion is for. So
why does diffusion *combined with* reaction produce pattern rather
than soup?

The answer is **linear stability analysis** around the spatially
uniform steady state. Pick the uniform fixed point *(u, v) = (u*, v*)*
where the reaction terms vanish. Linearise around it: write
*u = u* + δu* and *v = v* + δv*, drop terms quadratic in the
perturbation, and Fourier-transform the spatial part. The wavevector-q
mode of the perturbation evolves under a 2×2 matrix:

```
d/dt [δu_q]   =  [ −D_u q² + f_u    f_v       ] [δu_q]
     [δv_q]      [ g_u             −D_v q² + g_v] [δv_q]
```

where *f_u, f_v, g_u, g_v* are the partial derivatives of the
reaction kinetics at the fixed point. The mode grows or decays
according to the eigenvalues of this matrix. *Without* diffusion the
matrix is just the reaction Jacobian, whose eigenvalues are required
to have negative real parts (otherwise the well-mixed system would
itself be unstable). *With* diffusion, the diagonal entries are
reduced by `D_u q²` and `D_v q²` respectively — and this reduction is
*asymmetric* because the diffusion constants are unequal.

The result is a **dispersion curve**: a plot of growth rate *σ(q)*
against wavenumber *q*. Without diffusion the curve sits flat below
zero. With unequal diffusion a bump rises above zero in an intermediate
band of wavenumbers, peaking at some preferred *q\**. The mode at *q\**
grows fastest; it sets the **characteristic spacing** of the pattern
that emerges.

The counter-intuitive part: smoothing on different length scales
*destabilises* rather than calms. The activator is too lazy to spread,
so it piles up. The inhibitor is keen, so it gets ahead. The pile-and-
suppress dynamics traps the system at a length scale where neither
process wins. Pattern is what you get when two smoothing processes
disagree.

Linear stability is silent about *what pattern* wins — that is a
nonlinear question, settled by the higher-order terms and by the
initial conditions. But it tells you whether *any* pattern forms and
roughly how big it will be. For Gray-Scott the band of unstable
wavenumbers is narrow, which is why the resulting patterns have such
a clean characteristic spacing.

### Numerical solver

Discretise the Laplacian by **finite difference** on a square grid of
spacing *h*. The five-point stencil:

```
∇²u(i, j) ≈ [u(i+1, j) + u(i−1, j) + u(i, j+1) + u(i, j−1) − 4 u(i, j)] / h²
```

Step forward in time with **explicit Euler**:

```
u_new(i, j) = u(i, j) + Δt · [D_u · ∇²u(i, j) − u v² + F (1 − u)]
v_new(i, j) = v(i, j) + Δt · [D_v · ∇²v(i, j) + u v² − (F + k) v]
```

Every quantity on the right is evaluated at the current step.
Boundary conditions: periodic, almost always. The pattern doesn't
care what happens at the edge of the world; it cares what happens at
its own characteristic length.

**The CFL condition.** Explicit-Euler diffusion is stable only when
the timestep is small enough to keep the scheme from feeding back on
itself. In 2D the condition is:

```
Δt ≤ h² / (4 · max(D_u, D_v))
```

For *D_u = 0.16* and *h = 1* the maximum stable timestep is *Δt ≤ 1.5*.
The studio's visualiser uses *Δt = 1*, well inside the limit. Push past
the bound and the grid will spit `NaN` at you within a handful of
steps — the values blow up, multiply, blow up again, and reach floating-
point infinity before the user has time to release the slider.

The constraint becomes the gating factor on resolution. Halve the grid
spacing and the maximum stable timestep quarters; the cost-to-evolve
scales as resolution to the fourth power in 2D, fifth in 3D. For a
1024×1024 field this is still real-time on a modern GPU; for a 4096³
field it is an overnight run on a workstation. Implicit-Euler and
semi-implicit methods relax the constraint at the cost of per-step
complexity; the studio sticks to explicit because the visualiser wants
interactive sliders.

### GPU implementation

On GPU the whole update is one compute pass per timestep. The studio
ping-pongs between two RGBA textures: one stores the current state
(*u* in red, *v* in green), the other is the write target. Each
compute thread reads its own pixel and its four neighbours, evaluates
the five-point Laplacian, applies the reaction and feed/kill terms,
writes the new value. The next frame the roles swap. There is no
inter-thread communication — every cell is independent at each step —
which is why the algorithm is embarrassingly parallel and which is why
a million-cell grid runs at sixty frames per second on a mid-range
GPU.

For larger fields the studio tiles the grid into 16×16 workgroups and
uses shared memory for the neighbour reads, but the structure of the
algorithm is unchanged. The visualiser at
`/visualiser/reaction-diffusion` is the simplest possible WebGPU port:
one compute shader, two textures, a fragment shader to colour the
output.

### A worked four-pixel evolution

To ground the algorithm: take a 2×2 patch holding

```
u = [[1.0, 1.0],
     [1.0, 0.5]]

v = [[0.0, 0.0],
     [0.0, 0.25]]
```

A single seed of activator in the bottom-right cell. Parameters:
`D_u = 0.16`, `D_v = 0.08`, `F = 0.035`, `k = 0.065`, `Δt = 1`,
`h = 1`, periodic boundaries.

**Step 1.** For the bottom-right cell (i=1, j=1):

- Neighbours in a periodic 2×2 grid: every other cell is a neighbour
  of every cell, because wrapping makes (0, 1), (1, 0), (1, 1)'s
  opposite (0, 1), and (1, 0)'s opposite (0, 0) all hit each other.
  Specifically: the four neighbours of (1, 1) are (0, 1), (0, 1),
  (1, 0), (1, 0) on a 2-wide grid — meaning each appears twice.
- For *u*: ∇²u(1, 1) ≈ [2·1.0 + 2·1.0 − 4·0.5] / 1² = 2.0
- Reaction: −u v² = −0.5 · 0.0625 = −0.03125
- Feed: F(1 − u) = 0.035 · 0.5 = 0.0175
- ∂u/∂t = 0.16 · 2.0 − 0.03125 + 0.0175 = 0.3063
- u_new(1, 1) = 0.5 + 1 · 0.3063 = 0.8063

- For *v*: ∇²v(1, 1) = [2·0 + 2·0 − 4·0.25] / 1² = −1.0
- Reaction: +u v² = 0.5 · 0.0625 = 0.03125
- Kill: −(F + k) v = −0.10 · 0.25 = −0.025
- ∂v/∂t = 0.08 · (−1.0) + 0.03125 − 0.025 = −0.0738
- v_new(1, 1) = 0.25 + 1 · (−0.0738) = 0.1762

After step 1 the seed has begun to spread: every other cell has picked
up a small amount of *v* from the diffusion of the seed, and *u* has
begun to dent slightly where *v* has appeared. By step 2 the four-cell
grid holds *v* values around 0.06 in the previously-empty cells, with
the seed cell down to about 0.13. By step 3 the field is more uniform:
*v* is roughly 0.10 everywhere, *u* about 0.93.

A 2×2 grid is too small to develop pattern — the characteristic
wavenumber doesn't fit — so the system relaxes to a uniform state and
sits there. The point of running it by hand is that every step of a
ten-thousand-step, million-cell simulation is the same five lines of
arithmetic applied a billion times. The pattern emerges from the
parallel application; no individual cell ever has any idea what is
going on.

### Where it lives in Holoflow

The visualiser chamber at `/visualiser/reaction-diffusion` runs a
Gray-Scott field on a GPU texture with parameter sliders wired straight
to *F* and *k*. The visitor walks the Pearson atlas in real time.

The planned **Turing genome** sits in the 28-gene alphabet (see
`synthesis/17-the-28-gene-alphabet.md`) as one of the five structural
types alongside Gyroid, Voronoi, Fractal and Crystalline. Each
structural type is a *template* that pre-fills certain gene values; a
Turing genome encodes (F, k), the field's seed pattern, and the cell
density at which the pattern is mapped onto the sculpture surface.
The same equations that paint a screen produce the bumps and dimples
of a wall relief.

The studio's belt printer runs gyroid-bulk with Turing surface texture
as a recurring template. Bulk geometry from TPMS; surface decoration
from Gray-Scott. Two layers, one piece.

---

## Part 2 — Triply Periodic Minimal Surfaces (TPMS)

### What "minimal" means here

A surface is *minimal* if its **mean curvature** is zero at every
point. Mean curvature is the average of the two principal curvatures
at a point: the maximum and minimum normal curvatures of curves
passing through the point. Setting the average to zero doesn't mean
the surface is flat — it means it bends the same amount one way as
the other. Every point is a saddle.

The physical intuition is the **soap film**. Stretch a wire loop in
any shape, dip it in soapy water, lift it out: the film that spans
the loop is the surface of least area for that boundary. Surface
tension is constant across the film; equilibrium demands zero net
curvature pressure; and zero net curvature pressure is exactly zero
mean curvature. Plateau, in the 1870s, formalised this as a problem
in the calculus of variations; Schwarz and Riemann gave the first
explicit families of solutions.

A note on terminology. *Mean* curvature is the *average* of the two
principal curvatures (`H = (κ₁ + κ₂) / 2`); **Gaussian** curvature is
their *product* (`K = κ₁ · κ₂`). A minimal surface has *H = 0*
everywhere and, generally, *K ≤ 0* everywhere — every point is
saddle-shaped, never flat or bulging. A sphere has positive *H* and
positive *K*; a plane has zero of both. The gyroid is locally saddle-
shaped everywhere, which is what makes the eye read it as "organic":
nothing is flat, nothing bulges, every point sits between two opposite
curvatures.

### The variational setup

Among all surfaces *S* with a given boundary *∂S*, the minimal ones
are critical points of the **area functional**:

```
A[S] = ∫∫_S dA
```

A *critical point* — `δA = 0` — is a surface whose area doesn't
change to first order under any small perturbation that preserves the
boundary. The Euler-Lagrange equation that falls out of `δA = 0` is
`H = 0`.

For surfaces written implicitly as a level set `F(x, y, z) = c`, the
mean-curvature condition can be expressed in terms of the gradient
and Hessian of *F*. The result is a nonlinear PDE in *F* whose
solutions are minimal surfaces. The difficulty isn't writing the PDE;
it's finding solutions that are **periodic** in three independent
directions, since the obvious solutions (the helicoid, the catenoid)
are not.

### The classical families

Hermann Schwarz, in the 1880s, found the first triply periodic
minimal surfaces by solving Plateau's problem on cubic skeletons —
that is, by spanning soap films across the edges of cubes and reading
off the equations of the resulting surfaces. Three of his and Schoen's
families form the workhorse set:

**Schwarz P (primitive)** — `cos(x) + cos(y) + cos(z) = 0` as a good
trigonometric approximation. Cubic symmetry, looks like a structure
of bulbs joined by tubes along the x, y, z axes. Two interpenetrating
chambers (the *P* and the *D*-side); the two are congruent.

**Schwarz D (diamond)** — approximated by
`sin(x) sin(y) sin(z) + sin(x) cos(y) cos(z) + cos(x) sin(y) cos(z) + cos(x) cos(y) sin(z) = 0`.
Diamond-cubic symmetry; the tubes meet at tetrahedral angles like the
bonds in a diamond crystal.

**Gyroid (G)** — Alan Schoen, working at NASA's Electronics Research
Center, identified the gyroid in 1970 as part of a search for new
triply-periodic minimal surfaces with applications to lightweight
aerospace structures. His NASA Technical Note D-5541 lists seventeen
new surfaces; the gyroid is the only one of them that contains *no
straight lines* and *no plane symmetries*. Its symmetry group is
purely composed of screw rotations and inversions. That property — no
preferred direction in the mirror sense — is exactly what makes the
gyroid feel organic to the eye.

### The gyroid implicit equation

The standard trigonometric approximation, used everywhere from
photonics papers to FDM slicers to butterfly-scale electron-microscopy
literature, is:

```
G(x, y, z) = sin(x) cos(y) + sin(y) cos(z) + sin(z) cos(x) = 0
```

Cheap to evaluate (three sines, three cosines, two adds), periodic
with period 2π in all three axes, no straight lines, no reflection
symmetries — only screw rotations and inversions. Karcher and
Polthier's 1996 paper *Construction of Triply Periodic Minimal
Surfaces* in *Philosophical Transactions A* showed that the
trigonometric form is not literally minimal: the mean curvature is
small but nonzero, varying smoothly across the surface. The genuine
gyroid is defined by a Weierstrass representation involving elliptic
integrals; computing it requires evaluating those integrals
numerically at every point.

For every engineering purpose the studio cares about, the
trigonometric form is indistinguishable from the genuine gyroid. The
mean curvature defect is below printer tolerance at any sensible
cell size. Anyone telling you otherwise either has a photonics
application that depends on the exact dispersion relation or is
showing off.

### The implicit evaluated at sample points

Let `G(x, y, z) = sin(x) cos(y) + sin(y) cos(z) + sin(z) cos(x)`.

| Point | sin·cos terms | G |
|---|---|---|
| (0, 0, 0) | 0·1 + 0·1 + 0·1 | 0 |
| (π/2, 0, 0) | 1·1 + 0·1 + 0·0 | 1 |
| (π, 0, 0) | 0·1 + 0·1 + 0·(−1) | 0 |
| (π/2, π/2, π/2) | 1·0 + 1·0 + 1·0 | 0 |
| (π/4, π/4, π/4) | 3 · (√2/2)(√2/2) | 1.5 |
| (π, π/2, 0) | 0·0 + 1·1 + 0·(−1) | 1 |
| (π/2, π, 0) | 1·(−1) + 0·1 + 0·0 | −1 |

The origin, *(π, 0, 0)*, and *(π/2, π/2, π/2)* sit exactly on the
surface. *(π/2, 0, 0)* sits on the solid side at *G = 1*;
*(π/2, π, 0)* sits on the void side at *G = −1*. *(π/4, π/4, π/4)*
is well inside the solid phase.

A regular sample of *G* on a 256³ grid — about sixteen million voxels
— followed by **marching cubes** at *G = 0* produces a triangle mesh
of the gyroid surface ready to slice. Around twenty million triangles
for a useful sculpture-sized cube. The studio's belt printer happily
eats the result; the consumer FDM machines decimate to about two
million first.

### Volume-fraction tuning

The level-set *G = 0* gives a fifty-fifty split between solid and
void. For a structural sculpture this is more material than needed.
Shift the level set by a constant offset:

```
G(x, y, z) = ε
```

The resulting surface is no longer strictly minimal — its mean
curvature is *constant* rather than zero — but it remains smooth,
periodic, and self-intersection-free for a usable range of *ε* between
roughly −1.4 and +1.4. The offset surface is sometimes called a
**constant-mean-curvature gyroid** or **offset gyroid**.

The practical effect of the offset is to thicken or thin the solid
phase. The volume fraction enclosed by `G < ε`:

| ε | Volume fraction (solid) |
|---|---|
| −1.4 | ≈ 0.05 |
| −1.0 | ≈ 0.17 |
| −0.5 | ≈ 0.33 |
| 0.0 | 0.50 (exact) |
| +0.5 | ≈ 0.67 |
| +1.0 | ≈ 0.83 |
| +1.4 | ≈ 0.95 |

The relationship is roughly linear near *ε = 0* and saturates at the
extremes. Push *ε* past about ±1.4 and the structure collapses to
disconnected blobs (positive *ε*) or air pockets (negative *ε*); the
single connected gyroid surface breaks into separate pieces.

For a printable sculpture the studio typically walks *ε* up to about
−0.6, giving roughly thirty percent solid fraction: a wall that is
mostly air and still strong enough to hang on a domestic plasterboard
fitting. For waveguide work the offset is tuned to the desired modal
volume of each chamber; the optical analysis is treated in the
forthcoming `lattice-and-printability` entry.

### Why TPMS for sculpture

Four practical reasons the studio keeps coming back to the family.

**Surface-to-volume ratio.** A gyroid wall at thirty percent solid
fraction packs an enormous amount of surface into a small box. For
waveguide work that surface is where the light bounces; for thermal
work it is where heat exchanges; for resin work it is where the
photons cure. A two-centimetre cube of gyroid at thirty percent
solid fraction holds roughly twenty square centimetres of internal
surface — five times the surface of a solid two-centimetre cube.

**Mechanical isotropy.** Unlike rectangular honeycombs, the gyroid's
lack of distinguished axes means it behaves nearly the same under
load in any direction. A gyroid lattice with the same mass as a
square truss is stiffer in every off-axis direction and only slightly
less stiff on-axis. For wall-hung work, where the load direction is
controlled, isotropy matters less; for jewellery, where the wearer
will load the piece in unknown directions, it matters a lot.

**Optical light-channel propagation.** The two interpenetrating
chambers of a gyroid (the two sides of the `G = ε` and `G = −ε`
level sets) form a pair of three-dimensionally connected waveguides
that thread past each other without touching. The studio's
waveguide-object line uses one chamber as the optical core and the
other as cladding; light entering one face emerges from another after
following a twisted, refracting path through the structure. The piece
glows from the inside.

**Printability.** No overhangs steeper than fifty-five degrees if the
cell size is tuned to the printer. Self-supporting at any
orientation, which means no support structure to clean off. A
standard FDM head can run a gyroid wall in a single pass per layer.
The belt printer eats gyroid happily because the geometry never
demands a bridge longer than half a cell.

### The pipeline

The studio's TPMS pipeline runs as a fixed chain of stages.

1. **Sample.** Evaluate *G(x, y, z) − ε* on a regular voxel grid
   (typically 256³ for a small piece, 512³ for a wall-sized one).
   This is a trivially parallel pass: one thread per voxel.

2. **Offset (optional).** For wall-thickness control, treat the
   sampled values as a signed distance field (see the
   `signed-distance-fields` codex entry) and apply morphological
   operations: erosion, dilation, intersection with a bounding
   surface. The result is still a scalar field, ready for meshing.

3. **March.** Run marching cubes (see the `marching-cubes` entry)
   at the zero level set to extract a triangle mesh.

4. **Decimate and clean.** Mesh repair to remove non-manifold edges,
   decimation to a slicer-friendly triangle count.

5. **Slice and print.** Standard FDM workflow.

The `gyroid_waveguide_501.py` Blender 5.0.1 add-on (see the
`dollyos-sandbox-prototypes` skill for the SDF Grid Geometry Nodes
pipeline) is the bench tool. The same chain runs at every scale; only
the cell size and the printer change. Wall-sized reliefs at centimetre
cell, jewellery at millimetre cell, planned waveguide sculptures at
sub-millimetre cell with resin and embedded LED feeds.

---

## Cross-references

- `numerical-optimization-essentials` — the gradient-descent and
  least-squares machinery that underlies the variational treatment of
  minimal surfaces.
- `gyroid-surfaces` — the codex entry on the gyroid specifically; its
  history, its natural occurrences (butterfly scales, block
  copolymers), and its place in the studio's recurring substrate.
- `marching-cubes` — the venerable algorithm that turns the voxel grid
  back into a printable mesh.
- `signed-distance-fields` — the representation the studio uses for
  offset, intersection, and CSG-style operations on TPMS bulks before
  meshing.
- *Forthcoming* `lattice-and-printability` — the engineering side:
  printer tolerances, wall thickness, modal-volume tuning for the
  waveguide line, support requirements.

---

## References

- Alan M. Turing. *The Chemical Basis of Morphogenesis*. Philosophical
  Transactions of the Royal Society B 237(641), pp. 37–72, 1952. The
  founding paper. Readable in the original; section 6 on the
  dispersion relation is the part that earns most of its citations.
- John E. Pearson. *Complex Patterns in a Simple System*. Science
  261(5118), pp. 189–192, 1993. The (F, k) atlas; the source of the
  Greek-letter region names; the canonical reference for parameter
  selection in Gray-Scott.
- Alan H. Schoen. *Infinite Periodic Minimal Surfaces Without
  Self-Intersections*. NASA Technical Note D-5541, 1970. The gyroid's
  discovery paper. Lists seventeen new triply-periodic minimal
  surfaces; only the gyroid contains no straight lines and no plane
  symmetries.
- Hermann Karcher and Konrad Polthier. *Construction of Triply
  Periodic Minimal Surfaces*. Philosophical Transactions of the Royal
  Society A 354(1715), pp. 2077–2104, 1996. The modern reference for
  the Weierstrass representation; explains why the trigonometric
  approximation is close but not exact.
- James D. Murray. *Mathematical Biology II: Spatial Models and
  Biomedical Applications*. Springer, 3rd edition, 2003. The
  textbook treatment of reaction-diffusion that brought Turing's
  paper back into circulation in the 1980s and 1990s.

---

## Footnote on the two together

Reaction-diffusion paints. TPMS sculpts. The studio's pieces often
use them as a pair: a gyroid bulk with a Turing-pattern surface
decoration; a Schwarz-D scaffold with reaction-diffusion-derived cell
density gradients; a wall relief where the underlying geometry is
TPMS and the visible texture is Gray-Scott spots evolved on the
surface mesh.

The boundary between geometry and texture, between bulk and
decoration, is the studio's working seam. Both equations are old —
1952 and the 1880s — and both became sculpturally useful only when
the GPU made them cheap to evaluate at sculpture-relevant
resolutions. The same code that draws the visualiser on the website
samples the field that drives the belt printer in the studio. Same
maths, different output device.
