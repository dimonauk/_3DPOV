# `caustic-projector-shell.tsx` — purpose twin

## Role

Forward-direction caustic visualiser. Parallel rays from above hit
a curved top surface (sine-wave); each ray refracts via Snell's
Law from air (n=1) into resin (n≈1.5); refracted rays continue to
a screen below; per-pixel hit count is the caustic intensity.
Controls: amplitude, wavelength, IOR, phase.

The companion to the inverse problem at
`python-services/caustic_optimizer.py` (target image →
heightmap). This page is the forward step: surface in, caustic
out.

## Public surface

- Default export `CausticProjectorShell` — no props.

## Internal

- `N_RAYS = 1024` — ray count traced per repaint.
- `SCREEN_W = 512` — histogram bin count.
- `traceRay(rayX, p)` — Snell's-Law refraction. Surface normal
  derived from `surfaceSlope` (finite-difference of the sine
  function). Refracted direction via the canonical refract
  formula. Returns the screen-x position.
- `paint(ctx, p, canvasWidth)` — clears, draws surface curve,
  draws screen line, traces rays (faint pink lines for direction
  + histogram bin increment), draws the caustic bar (pink-on-
  midnight palette) below the screen line.

## Depends on

- `react` — `useState`, `useEffect`, `useRef`.
- Browser globals: HTMLCanvasElement, CanvasRenderingContext2D.

## Does not

- **Does not solve the inverse problem.** Surface → caustic only.
  The inverse (caustic → surface) lives in the optimiser.
- **Does not handle multiple wavelengths / dispersion.** Single
  IOR per render; no chromatic aberration.
- **Does not handle total internal reflection from air→resin.**
  TIR only matters for resin→air; the air→resin direction here
  has no critical angle. (The `k < 0` guard in `traceRay`
  catches the unreachable case defensively.)
- **Does not animate.** Re-renders on slider change; no rAF loop.
- **Does not approximate the wave equation.** Pure geometric
  optics. Fine for the studio's mm-scale discs and torch-source
  caustics; not appropriate for sub-wavelength features.

## Bordering files

- `app/visualiser/caustic-projector/page.tsx` — server shell.
- `components/articles/entries/the-caustic-disc.tsx` — the
  prose-side companion.
- `python-services/caustic_optimizer.py` — the inverse solver
  the article describes.
- `app/visualiser/total-internal-reflection/page.tsx` —
  sibling visualiser on the same physics from the resin-side
  exit angle.
- `components/visualiser/strange-attractor-shell.tsx`,
  `reaction-diffusion-shell.tsx` — sibling visualiser pattern.
