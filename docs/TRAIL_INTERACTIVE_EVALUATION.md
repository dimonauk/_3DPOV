# Trail of My Passing — Interactive Evaluation

## Summary

The `/trail` route is now integrated into the site with a dedicated page, CSS, and navigation entry. The current implementation is a strong visual scaffold and conceptual narrative, but the interactive layer is still mostly placeholder content. The page currently consists of 40 sandbox cards with one-knob concepts, art direction, and prose stubs; only the sandbox progress indicator is implemented in code.

This evaluation identifies how to turn the page into a fully interactive experience and suggests additional site-level toys and live demos that would reinforce the same kinetic/physics-first pedagogy.

## Current state in the repo

- `app/trail/page.tsx` renders `components/trail/trail-content.tsx` and provides metadata for SEO.
- `app/trail/layout.tsx` imports `components/trail/trail-styles.css` so the route gets its own scoped styling.
- `components/trail/trail-content.tsx` is a client component with:
  - sticky nav
  - hero and five-act structure
  - 40 sandbox cards with conceptual descriptions
  - IntersectionObserver-based progress tracking
- `components/trail/trail-styles.css` contains the route palette, typography, layout, and visual styling.
- `app/globals.css` already includes the `--color-trail-*` and `--font-trail-*` palette tokens.
- `/trail` has been added to the shared navbar via `components/layout/navbar-config.ts`.

## Gap analysis

### What is present

- route + layout + CSS integration
- page metadata and route discoverability
- strong narrative scaffolding for the five acts
- concept-level sandbox descriptions
- sticky progress nav with current sandbox counter

### What is missing

- Actual interactive sandbox implementations
- One-knob controls wired to live visual output
- Canvas/WebGPU/Web Audio assets inside the widgets
- audio feedback, motion capture, or physics simulation
- true body/gesture interaction for the final sandboxes
- route-level pairings with existing `visualiser` interactive patterns

## Recommended approach

The page should be built as a hybrid narrative route + embedded micro-toys. Each sandbox can remain structurally present in the page, but its widget should be a real interactive mini-demo rather than a stub description.

### Best architectural pattern

- Keep the page shell in `components/trail/trail-content.tsx`.
- Extract each sandbox widget into a small client sub-component under `components/trail/widgets/`.
- Reuse the existing site pattern from `app/visualiser` routes:
  - one server page + one client shell
  - pure visualiser helpers in `components/visualiser/_helpers.tsx`
  - shared state in `lib/visualiser/state.ts`
- Prefer simple 2D canvas / WebGL or R3F primitives for the first pass.
- Reserve full MediaPipe/WebGPU mocap for a later delivery once the rest of the route is stable.

## Quick-win interactive toys (0–3 days)

These are the lowest-risk sandbox implementations that deliver the concept immediately.

1. **SB01 — Drop height ball**

   - `canvas 2d` with a draggable ball and gravity simulation.
   - single knob controls release height.
   - visualize the fall, bounce, and trail fade.

2. **SB17 — Projectile angle**

   - 2D arc drawing with parabola preview.
   - knob controls launch angle.
   - show impact distance and a target line.

3. **SB09 — Pendulum + metronome**

   - canvas pendulum simulation with fixed BPM tick.
   - knob controls string length.
   - visible resonance flash when pendulum period matches the beat.

4. **SB25 — Sine wave frequency**

   - simple 2D waveform display.
   - knob sweeps frequency from low to high.
   - optional audio tone on interaction to make the frequency feel tactile.

5. **SB33 — Reaction-diffusion starter**
   - WebGL fragment-shader or small WebGPU compute demo.
   - knob controls feed/kill ratio.
   - renders live pattern evolution from spots to stripes.

## Medium-impact toys (4–10 days)

These require more engineering but unlock the page’s unique promise.

1. **SB08 — Beat jump**

   - stage with pulse rhythm.
   - knob chooses a beat-phase landing point.
   - success/failure visible in a simple animated figure or silhouette.

2. **SB39 — Motion synthesis scrub**

   - pre-recorded path or motion-capture curve.
   - knob scrubs time through the sequence.
   - overlay small annotations for active physics moments.

3. **SB40 — Camera movement prompt**

   - request camera permission on arrival.
   - if granted, MediaPipe Pose draws a simple trail from the user’s motion.
   - if declined, show a dark invitation prompt and keep the canvas ready.

4. **SB25+ — Wave visualization across media**

   - show frequency as both waveform and label (`sound`, `light`, `probability`).
   - reinforce the idea: one shape, many physical domains.

5. **Page-level progress toy**
   - make the sidebar progress counter clickable.
   - add a small preview card for the next sandbox when a user scrolls past half.

## High-impact site-wide toys

Beyond `/trail`, the site already has the right interactive infrastructure and should use it more aggressively.

### Leveraging existing visualiser content

`app/visualiser/page.tsx` already defines a strong pattern for interactive explainers. The trail route should be complemented by the same series, not replaced by it.

The existing `visualiser` concepts are excellent toys for the same audience:

- `/visualiser/total-internal-reflection`
- `/visualiser/marching-cubes`
- `/visualiser/laban-dial`
- `/visualiser/reaction-diffusion`
- `/visualiser/caustic-projector`

These pages can serve as deeper follow-ups to trail concepts, while `/trail` remains the kinetic primer.

### New toy ideas from the repo

The repo’s technical docs already name winning interactive pieces:

- gyroid surface explorer (`/visualiser/gyroid`)
- diffraction grating live demo
- marching cubes step-through
- caustic projector optimizer
- poi rig frame-budget calculator
- movement-to-sculpture generator

Those would make the studio feel more like an experimental lab and less like a static brochure.

## Recommended site adjustments

### Route placement / naming

- `/trail` is fine for the current integration.
- For consistency with the `Play` taxonomy, consider a redirect or alias from `/play/trail` to `/trail` later.
- The route should remain on the Play menu, not buried in Articles.

### Navigation and discoverability

- The route is now in `components/layout/navbar-config.ts` under `Play`.
- Ensure the `Visualiser` index and any related article pages link to `/trail` where appropriate.
- Add a short supporting blurb on `/play` or `/visualiser` describing `/trail` as the site’s kinetic primer for movement, physics, rhythm and emergence.

## Conclusion

`/trail` is currently a high-potential narrative scaffold that needs the interactive layer applied.

The fastest path to value is to ship a handful of real mini-toys first (SB01, SB17, SB09, SB25, SB33) and keep the rest of the page as the story framework. Once those mini-interactives are live, the page will feel like a true “trail” rather than an illustrated outline.

Longer-term, the studio should treat `/trail` as the gateway into the existing `visualiser` catalogue, and use the same toy-building pattern for both the trail sandboxes and the broader site’s technical explainers.

---

### Implementation priorities

1. Ship one working sandbox per act.
2. Keep the rest of the route scaffolded as story blocks.
3. Use the existing interactive patterns from `app/visualiser`.
4. Connect `/trail` to the site’s Play narrative and interactive index.
5. Reserve the final camera/mocap sandbox for the second release after the first five toys are polished.
