# Morphing mathematics — the easing canon

The maths under every animated channel on the bench. Linear
interpolation, the Penner easing equations, the named curves the
studio actually leans on, and the aesthetic register that picks one
curve over another. The article `articles/the-mathematics-of-morphing`
is the public-voice variant. This file is the equations, the named
curves, the discipline rules.

The canonical implementation lives at `lib/math/easing.ts` — 31
functions, the `EasingName` union, the loose-string registry that
resolves Python-side aliases for legacy JSON sequences.

When this file goes over 300 lines, it splits per
`ARCHITECTURE.md` Rule 1.

## I. Where the equations came from

Robert Penner published the easing equations between 1998 and 2002,
first in ActionScript for the Flash animator community, then
canonically in *Programming Macromedia Flash MX* (2002, friendsofED).
The set: polynomial ramps (quad, cubic, quart, quint), sinusoidal,
exponential, circular, back, elastic, and bounce. Twenty-eight
functions if in/out/in-out count as separate curves, which they
are. Add linear, smoothstep and a half-sine bump and you have the
studio's thirty-one.

The same dozen curves keep being re-derived because they sit at
honest places in the design space — the cheapest polynomial that
does not look mechanical, the smoothest symmetric ramp, the curve
that overshoots a bit, the curve that decays like a dropped ball.
CSS standardised four into the spec; the rest live in libraries
every animator reaches for. They are not bench-original. The
studio uses what everyone else uses. The bench bit is choosing
which curve to put on which channel.

## II. The fundamental building block — lerp

Every easing function reshapes a time parameter `t ∈ [0, 1]`. The
mix between two endpoint values is always linear interpolation:

```text
lerp(a, b, t) = a + (b - a) · t
```

| Input | Output |
| --- | --- |
| t = 0 | a |
| t = 1 | b |
| t = 0.5 | midpoint |

The curve does not live in the endpoint interpolation. The curve
lives in how `t` is reshaped before it reaches lerp.

```text
t_eased = ease(t_linear)
result  = lerp(a, b, t_eased)
```

## III. The Penner equations — canonical forms

| Curve | Equation |
| --- | --- |
| Linear | `f(t) = t` |
| EaseInQuad | `f(t) = t²` |
| EaseOutQuad | `f(t) = 1 − (1 − t)² = 2t − t²` |
| EaseInOutCubic | `f(t) = 3t² − 2t³` |
| Cubic Bézier | `B(t) = (1−t)³P₀ + 3(1−t)²tP₁ + 3(1−t)t²P₂ + t³P₃` |
| Standard ease-in-out (Bézier) | `P₀ = (0,0), P₁ = (0.42, 0), P₂ = (0.58, 1), P₃ = (1, 1)` |
| EaseOutElastic | `f(t) = sin(13π/2 · t) · 2^(10(t−1))` |
| EaseOutBounce | piecewise — see below |

The bounce is a four-arc piecewise:

```text
f(t) = 7.5625 · t²                          if t < 1/2.75
     = 7.5625 · (t − 1.5/2.75)² + 0.75      if t < 2/2.75
     = 7.5625 · (t − 2.25/2.75)² + 0.9375   if t < 2.5/2.75
     = 7.5625 · (t − 2.625/2.75)² + 0.984375 otherwise
```

## IV. The aesthetic register — five named pairs

Listing all thirty-one would be a table. These five pairs are the
ones worth characterising — the difference between them is the
whole aesthetic argument.

| Pair | Reads as | Use it for |
| --- | --- | --- |
| Linear vs easeInOutCubic | Metronome vs well-behaved. | Linear: clocks, progress bars, anything where the audience reads the value itself. Cubic: studio default for body channels. |
| sineIn vs expoIn | Gentle slow start vs the last 20% arriving all at once. | Sine: breath cycles in the idle layer. Expo: arrivals meant to read as a hit, not a glide. |
| bounceOut vs elasticOut | Dropped ball vs rubber. | Bounce wants weight (a pendant arriving at rest). Elastic wants rubber (a UI toggle confirming state). |
| easeOutCirc vs easeOutQuart | Near-vertical landing tangent vs gentle velocity sliding to zero. | Circular: a panel sliding decisively into place. Quartic: a colour fading as if it had always been arriving. |
| easeInBack vs easeInQuad | A fist pulling back before a punch vs polite gentle start. | Back: transitions that should feel reluctant. Quad: same path minus the personality. |

## V. Where the curves live in the studio

Every animated channel is reaching into the catalogue.

| Channel | Curve | Why |
| --- | --- | --- |
| `motion.idle` breath cycle | easeInOutSine | The sinusoid stops the chest from looking mechanically pumped. |
| `motion.gesture` baseline → peak → baseline | easeInOutCubic (two halves) | Attack from baseline to peak, release back. Currently inlined in `gesture.ts`, queued for catalogue resolution via `byName()`. |
| LED-wall pattern A → B | Operator pick per piece | Breath pattern wants easeInOutSine. Attention-grab wants easeOutElastic. Panic-pulse wants linear with a step function. |
| Mood crossfade | `mixCurves(slowSine, dampedTriangle, w)` | Aura's breath shifts mood without the shift being legible as an event. |

The four morphing operations named in
`articles/morphing-things-together` all eventually pick a curve.
The substrates differ — pixels, vertices, gene weights, Laban
Effort axes — but the shape put on time is one of the thirty-one.

## VI. Composing curves — mixCurves

Thirty-one entries; the design space is much larger. Two utility
blends in `lib/visualiser/morphing-math.ts` extend the catalogue
without adding to it.

| Helper | Behaviour |
| --- | --- |
| `cosineLerp(a, b, t)` | Half-cosine interpolation — equivalent to easeInOutSine, kept under a familiar name for callers porting from Python. |
| `mixCurves(a, b, w)` | Returns a new curve that is a pointwise blend of two named ones. `mixCurves(easeInQuad, easeOutElastic, 0.4)` starts gently and overshoots a little. |

One paragraph of code, an entirely new aesthetic available without
adding to the registry.

## VII. Boundary conditions and smoothness classes

Every well-behaved easing curve obeys:

```text
f(0) = 0   (start at pattern A)
f(1) = 1   (end at pattern B)
```

Smoothness classes the studio cares about:

| Class | Meaning |
| --- | --- |
| C⁰ | `f(t)` continuous. Position has no gaps. |
| C¹ | `f'(t)` continuous. No sharp corners — velocity is smooth. |
| C² | `f''(t)` continuous. Acceleration is smooth. |

For animated body channels (breath, gesture, Aura motion) C² is the
target. For UI confirmations C¹ is enough.

## VIII. Two-pattern morphing — point alignment

When morphing between point sets `P_a` and `P_b` of different
counts, two alignment strategies:

```text
nearest-neighbour:  for each p in A, find closest in B, lerp
proportional:       index_b = (index_a / count_a) · count_b
                    P_morph = lerp(A[index_a], B[index_b], t_eased)
```

For SVG paths: morph segment-by-segment, control point by control
point.

```text
Q_i(t) = (1 − t) · P_{a,i} + t · P_{b,i}   for each control point i
```

## IX. The bench discipline — three refusals

Each one the marker of an animator on autopilot.

### Linear when it is wrong

Linear is fine for clocks, progress bars, anything where the
audience is reading the value itself. It is wrong for anything
organic. A linear breath cycle is a metronome with a chest
attached. A linear hand wave looks like a robot waving. Most of
the time, if the channel is on a body or a body-adjacent surface,
linear is the wrong answer and the engineer reached for it because
it was the first one in the registry.

### EaseInOutCubic as a default for everything

The symmetric cubic is the studio's polite default precisely
because it is hard to spot when it is wrong. It is well-behaved,
smooth, unobjectionable. It is also bland. A kit where every
channel rides on easeInOutCubic reads as a single voice talking
about thirty different things. The discipline is to pick a curve
per channel; the breath wants sine, the wave wants cubic, the
bounce-on-rest wants easeOutBack, the elastic confirmation wants
easeOutElastic. The catalogue exists so the choice is not a guess.

### Bounce where bounce is not honest

Bounce is the loudest curve in the catalogue. Used on a thing that
has weight — a pendant settling against the LED wall, a UI chip
dropping into a slot — it earns its keep. Used on a colour fade or
a soft transition it reads as costume, not movement. Same for
elastic. The discipline is to ask whether the substrate would
behave that way in the world. If it would not, the curve is
decoration.

## X. Performance — caching the table

The easing table is small and pure. Pre-compute once, look up
forever.

```ts
const easingCache = Array.from({ length: 1001 },
  (_, i) => easeFn(i / 1000));

// resolve at runtime
const tEased = easingCache[(t * 1000) | 0];
```

For batch interpolation (entire pixel arrays, vertex buffers), the
same pattern with NumPy on the Python side and typed arrays on the
TypeScript side.

## Cross-links

- `articles/the-mathematics-of-morphing` — public-voice variant.
- `articles/morphing-things-together` — the four substrates the
  studio morphs (pixels, vertices, gene weights, Laban Effort).
- `articles/the-living-stage` — Laban Effort as a channel each
  curve eventually plays on.
- `lib/math/easing.ts` — the catalogue, the `EasingName` union, the
  loose-string registry.
- `lib/visualiser/morphing-math.ts` — `cosineLerp`, `mixCurves`,
  and the animation-config wrapper (duration, loop mode, sequence
  sampling).
- [easings.net](https://easings.net/) — canonical visual reference
  for the named curves.
- W3C [CSS Easing Functions Level 1](https://www.w3.org/TR/css-easing-1/)
  — cubic-bezier, steps, the named keywords.

## When this file goes over 300 lines

It splits per `ARCHITECTURE.md` Rule 1. `docs/morphing-mathematics/`
with one section per file, this file becomes the index.
