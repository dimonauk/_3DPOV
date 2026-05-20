# Numerical optimisation — the foundational math

The mathematics of finding the lowest point in a landscape one cannot
see whole. This document is the technical companion to the codex
entry `numerical-optimization-essentials`; the codex entry is what
the reader sees on the public site, this file is the equations, the
proofs-by-handwave, and the studio-side discipline.

Foundational because every interesting bench problem reduces to it.
Gaussian splat training is optimisation. Caustic inverse design is
optimisation. Genetic-algorithm fitness exploration is gradient-free
optimisation. Photogrammetric bundle adjustment is non-linear
least-squares optimisation. Neural-vocoder training is stochastic
gradient optimisation with a learning-rate schedule and a temper
tantrum. The same handful of ideas underwrites all of it.

## I. The framing

The canonical statement:

```text
minimise   f(x)
subject to g(x) ≤ 0
           h(x) = 0
```

Three pieces. The **objective** `f : ℝⁿ → ℝ` — what we want to make
small. The **decision variable** `x ∈ ℝⁿ` — what we are allowed to
choose. The **constraints** `g, h` — the rules of the room. If `g`
and `h` are absent the problem is unconstrained. If they are present
and active the problem is constrained, and the toolkit changes.

A point `x*` is a **local minimum** if there is a neighbourhood
around it in which no point achieves a lower objective. It is a
**global minimum** if no point in the entire feasible set does. The
distance between local and global is the whole drama of non-convex
optimisation.

## II. First-order conditions

If `f` is smooth and `x*` is an unconstrained local minimum, then
`∇f(x*) = 0`. The converse is not true — saddles and local maxima
also have vanishing gradient — but `∇f = 0` is the first thing every
optimiser is trying to engineer. Second-order conditions sharpen it:
if additionally the Hessian `H = ∇²f(x*)` is positive semidefinite,
the point is a (local) minimum; if positive definite, strictly so.

This pair — gradient vanishes, Hessian is positive definite — is the
geometric reality every iterative method is chasing.

## III. Gradient descent — the workhorse

The gradient `∇f(x)` is the vector of partial derivatives. It points
uphill. The first instinct of any optimiser is to step downhill:

```text
x_{k+1} = x_k − α ∇f(x_k)
```

The scalar `α > 0` is the **learning rate** or **step size**. The
field has spent twenty years inventing ways to choose it. Three
honest options:

- **Fixed step.** Pick `α`, stick with it. Works when you have a
  feel for the curvature of the problem.
- **Line search.** At each iterate, find `α_k` that minimises
  `f(x_k − α ∇f(x_k))` along the ray. Expensive but robust.
- **Adaptive.** Adam, AdaGrad, RMSProp — let each coordinate have
  its own `α`, tuned by the recent history of gradients.

### Convergence rate, plain version

For a quadratic `f(x) = ½ xᵀAx − bᵀx` with `A` symmetric positive
definite and eigenvalues bounded between `m` and `M`, gradient
descent with optimal step size shrinks the error by a factor of
`(M − m) / (M + m)` per iteration. The ratio `M / m` is the
**condition number** `κ`. A poorly conditioned problem — long, thin
valleys — has `κ` large, and `(κ − 1) / (κ + 1)` close to 1, meaning
each step barely makes progress. Preconditioning is the art of
multiplying through by some `P ≈ A⁻¹` to make the rescaled problem
nicely conditioned.

### Worked example

Let `f(x) = (x − 3)² + 2`. Then `f'(x) = 2(x − 3)`. Starting at
`x₀ = 0` with `α = 0.3`, the iteration `x_{k+1} = x_k − α · f'(x_k)`
reduces to:

```text
x_{k+1} = x_k − 0.3 · 2 (x_k − 3)
        = x_k − 0.6 (x_k − 3)
        = 0.4 x_k + 1.8
```

Each iterate moves the residual `(x_k − 3)` to `0.4 (x_k − 3)`:

| k | x_k    | f'(x_k) | f(x_k)  |
|---|--------|---------|---------|
| 0 | 0.000  | −6.000  | 11.000  |
| 1 | 1.800  | −2.400  |  3.440  |
| 2 | 2.520  | −0.960  |  2.230  |
| 3 | 2.808  | −0.384  |  2.037  |
| 4 | 2.923  | −0.154  |  2.006  |
| 5 | 2.969  | −0.062  |  2.001  |

After five steps we are inside one part per thousand of the optimum
`x* = 3, f* = 2`. The picture in one dimension is friendly. The same
picture in a million dimensions — neural-network weights, splat
parameters — is what real training looks like; geometry-of-the-loss
gets the credit, momentum and adaptive rates get the work done.

### Momentum

Pure gradient descent has no memory: each step uses only the local
gradient. Momentum adds a velocity term:

```text
v_{k+1} = β v_k + ∇f(x_k)
x_{k+1} = x_k − α v_{k+1}
```

with `β ∈ [0, 1)`, typically 0.9. Momentum accumulates along
consistent gradient directions (long valleys) and damps oscillation
across them (the walls of the valley). Nesterov's variant looks
ahead a step before computing the gradient and shaves a constant
factor off the convergence rate for convex problems.

### Saddle points

At a saddle the gradient vanishes and gradient descent stalls. In
high dimensions saddles vastly outnumber local minima — for a random
function in `n` dimensions, the probability that all `n` Hessian
eigenvalues are positive shrinks fast. This is part of why plain
gradient descent is bad at deep networks, why momentum helps, and
why second-order information (or noise, see SGD) eventually has to
enter the picture.

## IV. Newton's method

Newton's method uses the Hessian:

```text
x_{k+1} = x_k − H(x_k)⁻¹ ∇f(x_k)
```

The derivation is short and worth keeping in mind. Approximate `f`
near `x_k` by the second-order Taylor expansion:

```text
f(x_k + p) ≈ f(x_k) + ∇f(x_k)ᵀ p + ½ pᵀ H(x_k) p
```

Minimise the right-hand side over `p` by setting its gradient to
zero: `∇f + Hp = 0`, so `p = −H⁻¹ ∇f`. The Newton step is the exact
minimiser of the local quadratic model.

**Quadratic convergence near the optimum.** If `H` is Lipschitz
continuous and positive definite at `x*`, the iterates satisfy
`‖x_{k+1} − x*‖ ≤ C ‖x_k − x*‖²`. The number of correct digits
roughly doubles per iteration. Spectacular.

**Cost.** Forming `H` costs `O(n²)` storage; inverting it (or
solving the linear system `H p = −∇f`) costs `O(n³)` per step. For
`n = 1000` this is fine. For `n = 10⁸` (a small neural network) it
is impossible. The whole story of modern optimisation is: keep
Newton's spirit, dodge its arithmetic.

**Quasi-Newton.** BFGS and L-BFGS build up a low-rank approximation
to `H⁻¹` from successive gradient evaluations, getting most of the
convergence benefit at `O(n²)` or `O(nm)` per step (m = memory
length). L-BFGS is the algorithm in `scipy.optimize.minimize`.

## V. Gauss-Newton and Levenberg-Marquardt

A vast family of bench problems are **least-squares**:

```text
f(x) = ½ Σᵢ rᵢ(x)² = ½ r(x)ᵀ r(x)
```

where `r : ℝⁿ → ℝᵐ` is a vector of residuals (re-projection errors
in bundle adjustment, image-domain differences in splat training).
Let `J` be the Jacobian, the matrix of partial derivatives of `r`
with respect to `x`. Then:

```text
∇f = Jᵀ r
H  = Jᵀ J + Σᵢ rᵢ ∇²rᵢ
```

**Gauss-Newton** drops the second term: `H ≈ Jᵀ J`. The step is
found by solving the **normal equations**:

```text
Jᵀ J · Δx = − Jᵀ r
```

Near the optimum the residuals are small and the dropped term is
genuinely small. Far from the optimum Gauss-Newton can be unstable.

**Levenberg-Marquardt** damps it. The step solves:

```text
(Jᵀ J + λI) · Δx = − Jᵀ r
```

For large `λ` the step degenerates to `(1 / λ) · (−Jᵀ r)`, a short
gradient step. For small `λ` it is Gauss-Newton. The algorithm
adjusts `λ` on the fly: shrink it after a successful step
(approach the optimum aggressively), grow it after a failure (be
cautious).

This is the algorithm inside Ceres Solver, the algorithm inside
COLMAP's bundle adjuster, and the algorithm one reaches for any
time the objective decomposes as a sum of squared residuals and the
parameter count is small enough to factor `Jᵀ J`. For a
photogrammetric scene with a few thousand cameras and a few hundred
thousand 3D points, this is still tractable with sparse linear
algebra; the studio's photogrammetry pipeline lives entirely
inside this regime.

## VI. Stochastic gradient descent and friends

When `f(x) = (1 / N) Σᵢ ℓᵢ(x)` is a sum over millions of training
examples, computing `∇f` requires sweeping all `N` examples. SGD
samples a mini-batch `B ⊂ {1, …, N}` and steps with

```text
x_{k+1} = x_k − α · (1 / |B|) Σᵢ∈B ∇ℓᵢ(x_k)
```

The mini-batch gradient is an unbiased noisy estimator of the full
gradient. The noise is not a bug. Three reasons noise helps:

1. **Computational.** Each step is `|B| / N` times cheaper.
2. **Saddle escape.** Noise pushes the iterate off saddles that
   would freeze a deterministic method.
3. **Regularisation.** SGD with reasonable batch size is observed
   empirically (and increasingly justified theoretically) to find
   flatter minima that generalise better than the sharper minima
   full-batch methods converge to.

### Adam

Kingma & Ba (2014). Maintain exponentially-weighted moving averages
of both the gradient and the squared gradient, per-parameter:

```text
m_k = β₁ m_{k-1} + (1 − β₁) g_k          (first moment)
v_k = β₂ v_{k-1} + (1 − β₂) g_k ⊙ g_k    (second moment)
m̂_k = m_k / (1 − β₁ᵏ)                    (bias correction)
v̂_k = v_k / (1 − β₂ᵏ)
x_{k+1} = x_k − α · m̂_k / (√v̂_k + ε)
```

Defaults: `β₁ = 0.9`, `β₂ = 0.999`, `ε = 10⁻⁸`. Adam behaves like
SGD-with-momentum on flat landscapes and like a per-coordinate
normaliser on steep ones. It is the optimiser inside almost
everything modern: gaussian-splat training, diffusion fine-tunes,
vocoder training.

**AdamW** (Loshchilov & Hutter, 2019) is the version that actually
appears in current training scripts; it decouples weight decay
from the gradient step, which the original Adam formulation
conflated, and gives consistently better generalisation.

## VII. Convex versus non-convex

A function `f` is **convex** if for every `x, y` and every
`t ∈ [0, 1]`:

```text
f(t x + (1 − t) y) ≤ t f(x) + (1 − t) f(y)
```

Equivalently (for twice-differentiable `f`), the Hessian is positive
semidefinite everywhere. Convex problems have the property that
every local minimum is a global minimum, gradient descent finds it
(with the right step sizes), and the theory delivers exact
convergence rates. Linear regression, logistic regression,
support-vector machines, LASSO, and many problems in signal
processing are convex.

Almost nothing in the studio's pipeline is. Neural-network training
is non-convex. Gaussian-splat training is non-convex. Caustic
inverse design is non-convex with sharp constraint boundaries.
Genetic-algorithm fitness landscapes are non-convex by construction.
For non-convex problems we get:

- Multiple local minima, generally uncountable.
- No certificate that any minimum is the global one.
- Sensitivity to initialisation, to seed, to batch order.
- Empirical practice: run several seeds, keep the best, sanity-check
  that results survive perturbation, document the chosen seed.

The honest bench position: a sufficiently good local minimum that
reproduces under perturbation is the answer. The global one is a
mathematical fiction we cannot afford.

## VIII. Constraints — Lagrangians and KKT

Constrained problems are handled via the Lagrangian:

```text
L(x, λ, μ) = f(x) + Σᵢ λᵢ hᵢ(x) + Σⱼ μⱼ gⱼ(x)
```

with `μⱼ ≥ 0` for the inequality constraints. The **KKT
conditions** are the first-order necessary conditions for a
constrained optimum:

1. **Stationarity.** `∇_x L = 0`.
2. **Primal feasibility.** `h(x) = 0`, `g(x) ≤ 0`.
3. **Dual feasibility.** `μ ≥ 0`.
4. **Complementary slackness.** `μⱼ gⱼ(x) = 0` for each `j`.

For convex problems with sufficient regularity (Slater's condition),
KKT is also sufficient. For non-convex problems it is necessary
only. The studio rarely touches Lagrangians directly — the
optimisers we use (Adam, Levenberg-Marquardt) handle constraints by
projection, penalty, or by encoding constraints into the objective
via barriers. KKT remains the conceptual frame for what is going on
under the hood.

## IX. Where it appears in Holoflow

| Application                       | Method               | Notes |
| --------------------------------- | -------------------- | ----- |
| Gaussian splat training           | Adam                 | Per-splat position, covariance, opacity, SH colour, against a differentiable rasteriser loss. See `lib/capabilities/viz/splat-*`. |
| Caustic inverse design            | Monge-Ampère flow    | Optimal-transport problem between source illumination and target image; gradient descent on the transport map. |
| Photogrammetric bundle adjustment | Levenberg-Marquardt  | Camera poses + 3D points minimising re-projection error. COLMAP, Ceres. |
| Genetic-algorithm fitness         | Gradient-free        | Selection + mutation + crossover. Optimisation by population sampling. |
| Neural-vocoder training           | AdamW                | Learning-rate schedule with warm-up and decay. |
| Diffusion fine-tune (LoRA)        | AdamW                | A few thousand to a few million trainable parameters; the rest frozen. |
| Shape-from-X reconstruction       | LM or trust-region   | Non-linear least squares over surface parameters. |
| Pose regression (mind-ar targets) | Gauss-Newton         | Six DoF over feature correspondences. |

## X. Cross-references inside the codex

- `linear-algebra-essentials` — the matrix machinery underneath all
  of this: Jacobians, Hessians, normal equations, factorisations.
- `gaussian-splat-mathematics` (future) — the splat-side specifics
  of the loss surface, gradients, densification.
- `genetic-algorithm-mathematics` (future) — gradient-free
  optimisation by population sampling; the same framing without
  the gradient.

## XI. Reading list

- Nocedal, J. & Wright, S. (2006). *Numerical Optimization*. 2nd ed.,
  Springer. The textbook. Chapters 2–6 cover unconstrained
  optimisation, 7–8 quasi-Newton, 10 least-squares, 12–17 constrained.
- Boyd, S. & Vandenberghe, L. (2004). *Convex Optimization*.
  Cambridge University Press. Free PDF at
  `https://web.stanford.edu/~boyd/cvxbook/`. The textbook for the
  convex side specifically; chapter 9 on unconstrained methods is
  the cleanest treatment in print.
- Kingma, D. & Ba, J. (2014). "Adam: A Method for Stochastic
  Optimization." arXiv 1412.6980; published ICLR 2015. The Adam
  paper. Read it once, then read Loshchilov & Hutter on AdamW.
- Loshchilov, I. & Hutter, F. (2019). "Decoupled Weight Decay
  Regularization." arXiv 1711.05101; ICLR 2019. The fix.
- Sutton, R. & Barto, A. (2018). *Reinforcement Learning: An
  Introduction*. 2nd ed., MIT Press. Free online at
  `http://incompleteideas.net/book/`. Chapter 13 is the policy-
  gradient material — reinforcement learning as stochastic
  gradient ascent on expected reward.
- Levenberg, K. (1944). "A Method for the Solution of Certain
  Non-Linear Problems in Least Squares." Original LM paper, still
  readable.
- Marquardt, D. (1963). "An Algorithm for Least-Squares Estimation
  of Nonlinear Parameters." The version that took.

## XII. Studio discipline

A short list of things the bench expects of any optimisation run
that gets committed to the studio pipeline:

- **Seed it.** Every stochastic run records its seed in the run
  manifest. A run without a seed cannot be reproduced and therefore
  did not happen, in the bench-discipline sense.
- **Log the loss curve.** Not just the final number. The shape of
  the curve is the only honest evidence the optimisation actually
  converged rather than crashed gracefully.
- **Check the gradient norm.** If `‖∇f‖` is not small at the end,
  the run did not reach a stationary point regardless of what the
  loss number says.
- **Vary the seed.** Run three to five seeds, report the spread.
  If the spread is large, the result is not real.
- **Inspect the Hessian curvature** (where affordable). Sharp
  minima are a red flag for poor generalisation.
- **Constraint satisfaction.** Verify constraints at the end. The
  optimiser will happily report convergence having violated a
  constraint that was encoded as a soft penalty.

That is the framework. The rest of the maths in the codex sits on
top of this one — every fitting problem, every reconstruction,
every learned representation. Now we go and fit some splats.
