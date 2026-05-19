# Parallax — the layered-depth scroll system

A short note on how depth-on-scroll works in this codebase, what the
contracts are, and where it should not be used.

## Why this exists

Holoflow's pages are built to read like a glossy magazine — paper
stacks, foiled headlines, a `.lux-*` chrome layer in `globals.css`.
A static composition gets us most of the way; layered parallax on
scroll gets us the rest. When the reader drags the page, a hero
image drifts slowly behind a title that slides forward, and the
two visibly separate into depth bands. It's the same trick a
print art director uses with translucent overlays, except scroll
is the binding.

The system here is built around two flavours.

## The two flavours

**Scroll-driven** — `useParallax` (hook) and `ParallaxLayer`
(wrapper). The element's vertical or horizontal position is
remapped from the page's scroll position by a speed multiplier.
A speed of `0.6` means the layer drifts at 60% of scroll, so it
appears to sit further back. Speeds above `1.0` rush forward
faster than scroll — handy for titles that fly off the top of a
hero plate as the reader continues down.

**Mouse-driven** — `useTiltParallax`. The element tilts on the X
and Y axis as the pointer moves across a container (or the
window). Smoothed with a spring so the motion settles. Designed
for cards, foiled chips, anything that should reward hovering.

## The shared scroll store

`lib/parallax/store.ts` holds a single window-level `scroll`
listener for the entire page. Subscribers register a handler and
receive a `{ scrollY, scrollX, viewportH, viewportW, deltaY,
deltaX }` snapshot at most once per animation frame.

This matters. Attaching a separate scroll listener per parallax
layer is how scroll performance dies on a trackpad. One listener
fan-out keeps the cost flat in the number of layers. The
listener attaches lazily on the first subscriber and detaches
when the last one leaves, so pages that use no parallax pay
nothing.

`pagehide` tears down the listener for bfcache and tab-close
parity — same contract `lib/workers/registry.ts` uses.

## IntersectionObserver gating

Each `useParallax` hook attaches an `IntersectionObserver` to its
target. A layer that's off-screen does not get its transform
updated — saves the GPU compositor work and skips the inline
style write entirely. The rootMargin is `256px 0px` so the layer
starts updating just before it enters the viewport, never
snapping into position on the first visible frame.

## Reduced-motion behaviour

`prefers-reduced-motion: reduce` is honoured by default in both
hooks. Under that preference every parallax layer becomes a
no-op — the hook returns its ref but never writes a transform,
so the page reads as a flat composition. To opt out of this
respect (rare — only for layers where motion is the content),
pass `respectsReducedMotion: false`.

## Heavy math goes to a worker

The default math here is linear: `y = scrollY * speed + offset`.
Cheap. Main thread handles it fine even on a low-end laptop.

If we ever want curve-driven parallax — bezier interpolation per
layer, complex easing, depth fields baked from a heightmap —
that math goes to a Web Worker via `lib/workers/registry.ts`.
The hook contract stays the same; the worker posts back resolved
`{y, rotateX}` pairs over a MessageChannel and the hook writes
the transform exactly as it does today. There's a TODO marker
in `lib/workers/registry.ts` for when that lands.

## When NOT to use parallax

- **Body text.** Reading paragraphs need to stay still — drifting
  text fights the eye's saccades and makes long-form unreadable.
- **CTA buttons.** Anything the reader has to land their pointer
  on. Buttons that drift are buttons that get mis-clicked.
- **Forms.** Same reason as buttons. Inputs stay locked.
- **Nav.** The site's NavBar is sticky and static. A parallaxing
  nav defeats the affordance.
- **Anything where the reader is meant to compare two elements at
  exact scroll positions.** Parallax destroys precise spatial
  relationships by design.

Parallax is for atmosphere — hero plates, chapter openers, ambient
backdrops. The closer something is to functional, the less it
should move.

## File map

- `lib/parallax/store.ts` — singleton scroll store, rAF-throttled
- `hooks/useParallax.ts` — scroll-driven hook
- `hooks/useTiltParallax.ts` — mouse-driven tilt hook
- `components/parallax/ParallaxLayer.tsx` — drop-in wrapper
- `components/parallax/ParallaxCover.tsx` — magazine-cover composition
- `docs/PARALLAX.md` — this note
