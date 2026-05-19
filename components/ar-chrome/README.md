# ar-chrome

Signifiers that suggest a headset-HUD framing on a flat monitor. The
site is moving toward a parallax + WebGPU/TSL world; the chrome here
is the visual surface that makes it read as a tracked, instrumented
space rather than a webpage. None of it is interactive — it's all
border-and-text instrumentation in pink-200, chrome-400, lavender-200
on warm-black.

The reference point is the framing reticle you get inside a HoloLens
or Apple Vision pass-through pipeline when a region is being tracked.
Corner brackets, a depth readout, a tiny axis widget, a range bar,
a stage label, a cursor reticle that lags behind your pointer. Read
as instrumentation. Never as decoration.

## The components

- **`BracketFrame`** — four hairline L-shaped marks at the corners of
  a content block. Wraps children, paints brackets in CSS borders,
  doesn't touch interaction. Server-component-safe.
- **`DepthReadout`** — tiny mono pill like `[ Z 0.42m ]`. For stage
  labels on hero plates and any value you want to read as telemetry.
- **`AxisIndicator`** — XYZ axis widget in SVG. X pink, Y mint, Z
  lavender. Drawn isometrically so the Z arm doesn't sit on top of
  the other two. ~80×80px by default.
- **`RangeBar`** — thin track with a filled portion and tick marks.
  Pair with article scroll progress, a `section X of Y` indicator,
  anything that needs a `we are here on the rail` reading.
- **`StageLabel`** — `ISA-101 :: STUDIO HOME :: SECTION 00` ribbon
  with double-colon separators. Same convention as the DollyOS
  ISA-101 HUD so the studio reads as one operating surface.
- **`CursorReticle`** — `"use client"`. A small crosshair + circle
  that trails the cursor with a one-pole smoothing filter. The
  reading the eye gets is "the system is tracking my gaze". Disabled
  on touch devices (no hover means no cursor) and frozen still under
  `prefers-reduced-motion`.

## Combining via `SpatialOverlay`

Drop `<SpatialOverlay />` into any positioned container — relative,
absolute, fixed. It absolutely-fills the parent and paints brackets
+ stage label top-left + axis indicator top-right + an optional
range bar across the bottom. Pure chrome; never blocks clicks.

```tsx
import { SpatialOverlay } from "components/ar-chrome";

<section className="relative">
  {/* page content */}
  <SpatialOverlay
    stageLabel={{
      stage: "ISA-101",
      context: "STUDIO HOME",
      index: "SECTION 00",
    }}
    range={{ value: 0.4, startLabel: "0.0", endLabel: "1.0" }}
  />
</section>;
```

If you need just one piece — say, brackets around a single image
plate — import `BracketFrame` directly. The composite is for the
big "this region is a tracked stage" framing.

The cursor reticle is best mounted once at the page level rather than
per-component. It follows the cursor across the whole viewport unless
you pass `containerRef` to clip it to a region.

## When not to use

- **Text bodies.** The whole point of a body is that the eye stays
  on the prose. Chrome around a paragraph just makes the paragraph
  harder to read.
- **CTA buttons and forms.** The brackets confuse the click target
  reading. The reticle drifts over the cursor and visually crowds
  the button you're trying to press.
- **Every section on the page.** One showcase reads as instrumentation.
  Five sections of it reads as a maximalist Geocities theme. Use
  sparingly — the hero plate, the section opener of a long-form
  article, one image plate per gallery page at most.

## Accessibility

- Every overlay element renders with `pointer-events: none`. Children
  underneath stay fully interactive.
- The composite + each chrome primitive is `aria-hidden` — assistive
  tech ignores the lot. The signifier is purely visual.
- `CursorReticle` checks `(hover: none)` and removes itself on touch.
  Under `prefers-reduced-motion: reduce` it pins to the centre of
  its container instead of trailing the cursor.
- The chrome never carries copy that the user needs in order to use
  the page. If a string has to be read aloud, put it in normal page
  text, not in a `StageLabel` or `DepthReadout`.

## Tokens

Colours come from `app/globals.css`:

- `--color-pink-200` — primary chrome accent.
- `--color-chrome-300` / `--color-chrome-400` — neutral chrome.
- `--color-lavender-200` / `--color-mint-200` — secondary axis tints.
- `--color-warm-black-950` — the background it all sits on.

Font is `var(--font-mono)`. Don't hardcode anything else; if you
need a new colour, add it to the theme block in `globals.css`.
