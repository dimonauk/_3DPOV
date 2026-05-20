# Mathematics of 3D gaussian splats

The companion document to the codex entries
[`gaussian-splatting`](../components/codex/entries/gaussian-splatting.tsx),
[`gaussian-splatting-3d`](../components/codex/entries/gaussian-splatting-3d.tsx),
and [`gaussian-splat-mathematics`](../components/codex/entries/gaussian-splat-mathematics.tsx).
Those entries describe the format landscape, the capture pipeline, and
the studio's place in the splat ecosystem. This one is the equations,
the parameterisation choices, and the rasteriser internals — enough
detail that a reader can follow the Inria paper without having to
reverse-engineer the notation.

The reader is assumed comfortable with vectors, matrices, the
chain rule, and the perspective projection. Forward references to
the prerequisite docs are scattered through; load them on demand.

When this file goes over 300 lines, it splits per
`ARCHITECTURE.md` Rule 1.

## I. The primitive

A 3D gaussian splat is one of several million little ellipsoidal
clouds, each parameterised by four objects:

| Symbol | Object | Shape | What it controls |
| --- | --- | --- | --- |
| `μ` | centre | ℝ³ | where the splat sits in world space |
| `Σ` | covariance | 3×3 symmetric PSD | shape and orientation of the ellipsoid |
| `α` | opacity | ℝ in (0, 1) | how much the splat occludes what is behind it |
| `c(d)` | view-dependent colour | spherical harmonics, ℝ³ per direction `d` | the rim-light, the specular cheat, the diffuse fallback |

The density the splat contributes at a world point `x` is the
unnormalised Gaussian

```text
G(x; μ, Σ) = exp( −½ (x − μ)ᵀ Σ⁻¹ (x − μ) )
```

That is the whole primitive. Everything that follows is engineering —
how to parameterise `Σ` so the optimiser does not blow up, how to
project the 3D Gaussian to a 2D screen-space ellipse cheaply, how to
turn `c(d)` into pixel values, and how to composite millions of these
into a final image at real-time frame rates.

Reference: Kerbl, Kopanas, Leimkühler & Drettakis,
*3D Gaussian Splatting for Real-Time Radiance Field Rendering*,
SIGGRAPH 2023.

## II. Why `Σ = R S Sᵀ Rᵀ` and not `Σ` directly

The covariance matrix `Σ` is a 3×3 symmetric positive-semidefinite
matrix. Six free parameters. One could store those six numbers and
optimise them directly — but the optimiser will happily wander into a
non-PSD configuration, at which point `Σ⁻¹` has negative eigenvalues
and the Gaussian becomes a saddle. The render goes black, the gradient
goes nonsense, the training run dies.

The Inria paper sidesteps this by parameterising `Σ` as the product of
a rotation and an axis-aligned scale:

```text
Σ = R S Sᵀ Rᵀ
```

where

- `S = diag(s₁, s₂, s₃)` is a diagonal 3×3 of three positive scales
  (one per axis of the local ellipsoid frame), and
- `R` is a 3×3 rotation matrix built from a unit quaternion
  `q = (qw, qx, qy, qz)`.

This factorisation is PSD by construction. `S Sᵀ = diag(s₁², s₂², s₃²)`
is PSD as long as the scales are real; conjugating by an orthogonal
`R` preserves the eigenvalues. The optimised parameters are
`(qw, qx, qy, qz, s₁, s₂, s₃)` — seven numbers instead of six, but
unconstrained reals instead of a constrained PSD manifold.

Two practical details the paper glosses over but every implementation
needs to handle:

1. **Quaternion normalisation.** `q` is renormalised to unit length
   on every forward pass before constructing `R`. The gradient flows
   back through the normalisation. See
   [`quaternions-and-rotations`](#) for the derivation.
2. **Scale activation.** Scales are stored as `log s` and exponentiated
   on the forward pass so they cannot go negative. The opacity `α` is
   stored as a sigmoid-preimage and sigmoided on the forward pass for
   the same reason. Both are stability tricks rather than mathematical
   essentials, but skipping them causes the run to diverge inside a
   few hundred iterations.

See also [`linear-algebra-essentials`](#) for the eigendecomposition
view: `Σ`'s eigenvectors are the columns of `R`, and its eigenvalues
are the squared scales `s_i²`.

## III. Projection — the Jacobian trick

A 3D Gaussian projected through a perspective camera is, exactly, not a
2D Gaussian. The perspective transform is nonlinear; it bends straight
lines into curves at the image plane edges, and it warps Gaussians
into something that resembles but is not quite an ellipse.

The Inria rasteriser approximates the projected splat as a 2D Gaussian
by **linearising the projection at the splat centre**. This is the
EWA splatting trick from Zwicker, Pfister, van Baar & Gross
(IEEE TVCG, 2002) — the elliptical weighted average filter that the
2023 rasteriser inherits wholesale.

The maths. Let `W` be the world-to-camera affine transform and `P` the
perspective projection that takes camera-space `(x, y, z)` to
screen-space `(u, v)`. The compound transform is `T(x) = P(W x + t)`.
The Jacobian `J` of the projection (after the affine part) at the
splat centre `μ_cam` is the 2×3 matrix

```text
J =
⎡ f_x / z_c    0          −f_x x_c / z_c² ⎤
⎣ 0            f_y / z_c  −f_y y_c / z_c² ⎦
```

where `(x_c, y_c, z_c)` is the splat centre in camera space and
`f_x, f_y` are focal lengths in pixels. The 2D screen-space covariance
is then

```text
Σ' = J W Σ Wᵀ Jᵀ
```

`Σ'` is 2×2, symmetric, PSD. It is the screen-space ellipse the
rasteriser actually rasterises. The 2D ellipse axes are the
eigenvectors of `Σ'`, with semi-axis lengths equal to the square roots
of the eigenvalues; the rasteriser uses these to decide which
screen-space tiles the splat touches.

See also [`projective-geometry-essentials`](#) for the derivation of
`J` and the discussion of when the linearisation breaks down (splats
near the principal point, splats clipped by the near plane, splats
larger than the field of view).

A subtle but important addition: to prevent aliasing under aggressive
minification, the rasteriser adds a small isotropic regularising
covariance to `Σ'`:

```text
Σ'_filt = Σ' + ε I
```

This is the EWA prefilter. Without it, splats that project to less
than one pixel disappear or alias. With it, they degrade gracefully to
single-pixel dots. The original Zwicker paper is the canonical
reference for why this matters.

## IV. View-dependent colour as spherical harmonics

A diffuse surface looks the same from every angle. A specular surface
does not. Splats are asked to model both. The compromise the Inria
paper picks is **spherical harmonics** — a basis for functions on the
sphere, in the same way that the Fourier basis is a basis for periodic
functions on the line.

Each splat stores 3 × (degree + 1)² coefficients (three colour
channels times the number of basis functions). The rendering
direction `d` (unit vector from camera to splat) is evaluated against
the basis to produce the splat's emitted colour:

```text
c(d) = Σ_{ℓ=0}^{L} Σ_{m=−ℓ}^{ℓ} c_{ℓm} · Y_{ℓm}(d)
```

The harmonic degrees and what they buy you:

| Degree | Coefficients per channel | What it can represent |
| --- | --- | --- |
| 0 | 1 | a single constant colour — view-independent |
| 1 | 4 | a gentle directional gradient — diffuse-ish |
| 2 | 9 | a soft specular hump |
| 3 | 16 | a tighter specular and a passable rim |

The Inria default is degree 3 — 48 floats per splat for colour
(16 coefficients × 3 channels). The training schedule warms the
degree up: optimise degree 0 only for the first thousand iterations,
add degree 1 at the next milestone, then 2, then 3. Without the warm-up
the gradient is too noisy for the higher-degree coefficients to
converge to anything meaningful.

Why spherical harmonics rather than a small MLP (the NeRF choice):
SH evaluation is a fixed-cost arithmetic pass that the GPU vectorises
trivially. An MLP per splat per pixel does not fit in a real-time
budget. The price is that SH cannot represent sharp specular
highlights — for those, the format breaks down and the result looks
plasticky. The studio uses splats for diffuse-ish, soft-light scenes
and falls back to triangulated PBR for anything where the highlight
matters.

Müller's NeRF tutorial (Müller, *Neural Radiance Fields for view
synthesis*, SIGGRAPH 2021 course notes) is the canonical comparison
for the MLP-versus-SH trade-off.

## V. The rasteriser

The 2023 paper's real technical contribution is the **tile-based
differentiable rasteriser**. The maths above had all existed for
twenty years. What changed was making the whole forward and backward
pass tractable on one consumer GPU.

The forward pass, in order:

1. **Frustum cull and depth sort.** Each splat is tested against the
   view frustum; survivors are sorted front-to-back by camera-space
   depth.
2. **Tile binning.** The screen is divided into 16×16 pixel tiles.
   Each splat's projected ellipse is tested against each tile; the
   splat is added to every tile's per-tile list it overlaps.
3. **Per-tile alpha compositing.** Each tile is rasterised independently.
   For every pixel in the tile, the splats in the tile's list are
   composited in depth order using the standard over operator:

```text
C_pixel  = Σ_i  c_i · α_i · Π_{j<i} (1 − α_j)
T_pixel  = Π_i (1 − α_i)        // final transmittance
```

`α_i` is the splat's stored opacity multiplied by the per-pixel
Gaussian falloff `G(x; μ, Σ)`. The compositing accumulates until the
transmittance falls below a threshold (default 0.0001) or the
tile's splat list is exhausted.

Two implementation choices that matter:

- **Sorting once, tiling many.** The depth sort is global; the tile
  binning takes the sorted list and partitions. This is much cheaper
  than per-tile sorting.
- **Backward pass on the same tiles.** The rasteriser stores enough
  per-tile state during the forward pass that the gradient pass can
  re-walk the splat list in reverse without re-sorting. This is what
  makes the whole thing differentiable end-to-end at real-time speeds.

The original Inria implementation is a custom CUDA kernel. Web
renderers (Spark, mkkellogg's `gaussian-splats-3d`) reimplement the
tile binning on the GPU using WebGL/WebGPU compute, and the depth
sort either on the CPU or in a compute shader. The studio's
[`splat-render`](../lib/capabilities/viz/splat-render.ts) capability
fronts both, picking the renderer that fits the page.

## VI. Differentiable rendering and the loss

The whole pipeline above is differentiable in the seven-tuple per
splat:

```text
( μ, q, log s, sigmoid⁻¹ α, c_{ℓm} )
```

Gradients flow:

- from the pixel loss back through the alpha compositing,
- through the per-pixel Gaussian falloff (which depends on `Σ'` and
  thus on the original `Σ` and on `J`),
- through the projection Jacobian (which depends on `μ` and the
  camera intrinsics),
- through the `R S Sᵀ Rᵀ` decomposition of `Σ`,
- back into the seven free parameters.

The chain rule is mechanical but the bookkeeping is brutal. The Inria
release ships the CUDA backward kernel as code, not as a derivation;
the easiest way to convince yourself it is correct is to autograd a
small reference implementation in PyTorch and compare gradients on a
toy scene. The studio's bench has done this once, found agreement to
machine precision, and not done it again.

The loss is a weighted sum of L1 pixel distance and the
D-SSIM structural-similarity term:

```text
L = (1 − λ) · ‖I_rendered − I_target‖₁  +  λ · D-SSIM(I_rendered, I_target)
```

The Inria paper uses `λ = 0.2`. The L1 term is what gets the
overall colour right; the D-SSIM term is what stops the optimiser
from settling on a blurred mush that has low L1 but obviously wrong
texture. See [`numerical-optimization-essentials`](#) for the SSIM
derivation and the choice of `λ`.

The optimiser is Adam, with separate learning rates per parameter
group — `μ` decays the slowest (the centres are the structure of the
scene); the harmonic coefficients decay fastest (they fine-tune late).

## VII. Densification and pruning

Optimising the seven-tuple per splat is not enough. The number of
splats has to change during training, because the source point cloud
from COLMAP is sparser than the final scene needs, and because some
splats end up redundant.

Every N iterations (default 100, starting at iteration 500), the
training loop:

1. **Densifies** — splats with large positional gradients are either
   *cloned* (small splats that need more coverage at the same spot) or
   *split* (large splats that need to be subdivided to fit detail).
2. **Prunes** — splats with low opacity (`α < 0.005`) or absurdly
   large screen-space footprints are removed.

The heuristics are the load-bearing piece of practical splat training.
A scene that starts at 100,000 points from COLMAP typically grows to
1–3 million splats over 30,000 iterations and then plateaus as
densification and pruning balance. The Inria paper gives the
constants; every downstream implementation tunes them differently for
different capture types.

## VIII. The SHARP single-image case

Conventional splat training needs multiple posed views of the scene.
COLMAP runs over a set of photographs, recovers the camera poses, and
emits a sparse point cloud as the seed. The training loop then
optimises against the photographs.

Apple SHARP — *Single-Image Hierarchical Adaptive Reconstruction of 3D
Photographs* (Cui et al., Apple Machine Learning Research, 2024) —
breaks the multi-view assumption. Given one photograph, SHARP:

1. **Predicts depth and layers.** A learned model produces a layered
   2.5D representation from the single image — foreground, mid-ground,
   background, and hallucinated occluded regions.
2. **Initialises splats from the layers.** The layered representation
   is converted to an initial set of gaussian splats with positions
   set by the predicted depths and colours set by the unprojected
   pixels (plus inpainted regions for the occluded layers).
3. **Refines.** A short optimisation pass tightens the splats against
   the source image and a set of synthesised novel views generated by
   the model.

The output is a `.ply` in the standard Inria layout, viewable by any
splat renderer that handles the format. The mathematical contribution
is the layered intermediate representation and the inpainting of the
occluded regions; the splat representation downstream is the standard
one. See the SHARP entry at
[`apple-sharp`](../components/codex/entries/apple-sharp.tsx) and the
runbook at [`SHARP_PIPELINE.md`](SHARP_PIPELINE.md) for the studio's
end-to-end workflow.

The licence on SHARP is research-only (Apple AMLR), which is why the
studio runs it as the **/spatial** premium commission and not as a
self-serve product. The mathematics is freely citable; the weights are
not freely productisable.

## IX. The 4D extension

Wu, Yi, Fang, Xie, Zhang, Wei, Liu, Tian & Wang,
*4D Gaussian Splatting for Real-Time Dynamic Scene Rendering*
(CVPR 2024), add a temporal axis. The centre `μ`, rotation `q`, scales
`s`, opacity `α`, and harmonic coefficients all become functions of
time:

```text
μ(t) = μ₀ + Δμ(t)
q(t) = q₀ · Δq(t)         // quaternion composition
```

The deltas are parameterised by a small MLP keyed on time, or by a
discrete keyframe spline, depending on the variant. The rendering pass
evaluates the time-dependent splat at the current frame's `t` and
hands the resulting 3D splat to the same tile-based rasteriser. The
loss is computed against video frames rather than still photographs.

The studio's `/spatial/video` premium path is the 4D-gaussian fit on a
short clip. Cost scales linearly with clip length; quality scales
sublinearly. The published service ceiling is around thirty seconds
before the optimiser becomes unaffordable for a single-edition
commission.

## X. Where this lives in Holoflow

| Layer | File | Role |
| --- | --- | --- |
| Capability surface | `lib/capabilities/viz/splat-render.ts` | Renderer-agnostic embedding of a `.ply` in a viewport. |
| Generation capability | `lib/capabilities/viz/splat-generate.ts` | Server-side splat-generation entry point. |
| Premium bench service | `python-services/sharp_service.py` | FastAPI wrapper over SHARP on the studio's 3080 Ti. |
| User-facing route | `app/spatial/page.tsx` | `/spatial` — free in-browser depth path plus premium SHARP commission. |
| 4D video route | `app/spatial/video/page.tsx` | `/spatial/video` — free per-frame depth plus premium 4D-gaussian commission. |
| Capture runbook | `docs/SHARP_PIPELINE.md` | The end-to-end studio-bench workflow. |

The site never imports a splat library directly. Pages call the
capability, the capability picks a renderer, and the renderer handles
the format. The capability layer is the seam at which a future
studio-trained splat backend would replace the upstream model
without any page-level rewrite. See `docs/HANGAR_MAP.md` for the
broader pattern.

## XI. References

- Kerbl, Kopanas, Leimkühler & Drettakis,
  [*3D Gaussian Splatting for Real-Time Radiance Field Rendering*](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/),
  SIGGRAPH 2023. The foundational paper.
- Zwicker, Pfister, van Baar & Gross,
  *EWA splatting*, IEEE TVCG 2002. The screen-space ellipse and the
  anti-aliasing prefilter.
- Wu et al.,
  *4D Gaussian Splatting for Real-Time Dynamic Scene Rendering*,
  CVPR 2024. The temporal extension.
- Cui et al.,
  *SHARP: Single-Image Hierarchical Adaptive Reconstruction of 3D
  Photographs*, Apple Machine Learning Research, 2024. The single-image
  initialisation path.
- Müller,
  *Neural Radiance Fields for view synthesis*, SIGGRAPH 2021 course
  notes. The MLP comparison.

## XII. See also

- Codex: [`gaussian-splatting`](../components/codex/entries/gaussian-splatting.tsx)
  — studio-practice overview.
- Codex: [`gaussian-splatting-3d`](../components/codex/entries/gaussian-splatting-3d.tsx)
  — format landscape and renderer choice.
- Codex: [`gaussian-splat-mathematics`](../components/codex/entries/gaussian-splat-mathematics.tsx)
  — public-facing pointer to this document.
- Codex: [`apple-sharp`](../components/codex/entries/apple-sharp.tsx)
  — the single-image initialisation and its licence boundary.
- Codex: [`depth-anything-v2`](../components/codex/entries/depth-anything-v2.tsx)
  — the free in-browser depth pass for `/spatial`.
- Forward: `docs/MATH-LINEAR-ALGEBRA-ESSENTIALS.md`,
  `docs/MATH-NUMERICAL-OPTIMIZATION-ESSENTIALS.md`,
  `docs/MATH-PROJECTIVE-GEOMETRY-ESSENTIALS.md`,
  `docs/MATH-QUATERNIONS-AND-ROTATIONS.md` — the prerequisite docs.
  Stubs until written.
