OK — five seed entries to establish the voice and depth. Each one's ready to paste into `components/codex/entries/{slug}.tsx` (or markdown if you prefer that route). Sources cited inline.

---

## Entry 01

```
SLUG: persistence-of-vision
CATEGORY: Capture
TITLE: Persistence of vision
SEE ALSO: pov-led-array, long-exposure-photography, flicker-fusion-threshold, pixel-poi
SOURCES:
  - Wikipedia: Persistence of vision (https://en.wikipedia.org/wiki/Persistence_of_vision)
  - Patrick D'Arcy, 1768, on the luminous ring of a torch turned quickly
  - Peter Mark Roget, Royal Society of London, 1824
---

Persistence of vision is the popular name for the optical phenomenon
by which a flickering or rapidly-changing light source appears to the
human eye as a continuous trace. Patrick D'Arcy described the effect
in 1768 — naming the luminous ring of a torch swung in the dark, the
fire-wheels of fireworks, the apparent solidity of a spinning cogwheel.
The phrase "persistence of vision" itself was introduced to the Royal
Society of London by Peter Mark Roget in 1824.

Modern vision science no longer treats "persistence of vision" as a
single mechanism. The integrated effect is now understood as a
combination of several distinct processes — phi phenomenon, beta
movement, flicker fusion — operating on different timescales. The
phrase survives as a useful shorthand rather than as a strict
scientific term.

For light-painting and persistence-of-vision-display practice, the
phenomenon underwrites everything. A camera with a sufficiently long
shutter integrates light over time the way the eye is loosely supposed
to. A moving LED — whether on a poi, a wand, a bar, or a drone — leaves
a continuous trace on the sensor that the LED itself never traced
continuously through space. The trace is the integration. The image
captured is not the LED, but the light's history through the exposure.

This is the foundation of every entry under Apparatus and Capture in
this codex.
```

---

## Entry 02

```
SLUG: poi
CATEGORY: Practice
TITLE: Poi
SEE ALSO: fire-poi, pixel-poi, kata, light-painting
SOURCES:
  - Wikipedia: Poi (performance art) (https://en.wikipedia.org/wiki/Poi_(performance_art))
  - Te Papa Tongarewa: What makes a poi (https://www.tepapa.govt.nz/discover-collections/read-watch-play/poi/what-makes-poi-traditional-materials)
  - SpinPoi: History of Poi (https://spinpoi.com/what-is-poi/)
---

Poi is a movement discipline of Māori origin in which a performer
swings a pair of weights on flexible cords through co-ordinated
geometric patterns around the body. Traditional poi were made by
wrapping leaves of harakeke (New Zealand flax) around the soft down
of raupō (bullrush), tethered with woven harakeke cord. The practice
pre-dates Māori contact with Europeans in the early 1800s and is
generally believed to extend back to at least 1500 CE.

In traditional use, wāhine (women) practised poi to maintain hand
flexibility for weaving, and tāne (men) used poi for the wrist and
shoulder strength required for combat. Poi as a Māori art form is
inseparable from waiata (song), kōrero (story), and haka. The poi
itself is held in active percussive contact with the body — slapped
against the hand, shoulder, hip — for rhythm.

Outside of Aotearoa, poi has propagated into a global flow-arts
discipline since the 1990s, where it sits alongside staff, hoop,
fans, and contact juggling. Materials have changed: tennis-ball
heads, sock poi, fire poi (Kevlar wick), LED poi, pixel poi (an
addressable-LED chassis). The geometry has remained recognisable —
forward and reverse weaves, butterflies, antispin patterns, hyperloops.

For practitioners working into photography, poi is the discipline
that trains the body to hold a planar gesture long enough for a
camera to keep it. Most contemporary studios doing long-exposure
light-painting work with the trace of the human body in motion are
descended, technically or culturally, from the flow-arts scene.

The Holo-Flow studio practice is twelve years deep into this lineage.
```

---

## Entry 03

```
SLUG: pov-led-array
CATEGORY: Apparatus
TITLE: Persistence-of-vision LED array (POV LED array)
SEE ALSO: persistence-of-vision, pixel-poi, pixelstick, teensy, addressable-leds, hall-effect-sensor
SOURCES:
  - Adafruit: MiniPOV4 (https://learn.adafruit.com/minipov4-diy-full-color-persistence-of-vision-light-painting-kit)
  - Bitbanger Labs: Pixelstick (https://www.thepixelstick.com/)
  - Holo-Flow Studio: studio rig specs (Teensy 3.1 + TLC5927)
---

A persistence-of-vision LED array — POV LED array — is a display
formed by a line (or grid) of addressable LEDs whose individual
elements are updated rapidly while the array itself moves through
physical space. To a still observer the array appears as a streak of
flickering points. To a long-exposure camera, the array writes a
two-dimensional (or, given motion in space, three-dimensional) image
into the frame.

The principle was demonstrated in mechanical form by Patrick D'Arcy
in 1768. Its electronic implementation became common with the arrival
of inexpensive microcontrollers and addressable LED strips in the
2000s, and especially with the advent of WS2812 / SK6812 ("NeoPixel")
LEDs around 2013.

A working POV LED array combines:

  - A linear (or planar) bank of individually-addressable LEDs.
  - A microcontroller capable of pushing frame data to the LEDs
    fast enough that the eye, or the camera, integrates the trace.
  - A means of synchronising the frame index against the array's
    position in space. For rotational rigs this is typically a
    Hall-effect sensor reading a magnet on the shaft; for handheld
    rigs it can be a time-based assumption or an IMU.
  - A pre-prepared image, decomposed into vertical slices, served
    one slice at a time as the rig moves.

Commercial implementations include Bitbanger Labs' Pixelstick (a
200-LED bar designed to be walked through frame, introduced 2014),
the Pixel Poi line (LED poi chassis loaded from SD card), and
Magiblade staves. Open-hardware reference designs include Adafruit's
MiniPOV series.

Bespoke studio rigs, including the Holo-Flow Studio rigs, typically
sacrifice the durability of commercial pois for tighter timing,
brighter LEDs, custom firmware, and image quality. The studio's
current generation is built around Teensy 3.1 microcontrollers,
TLC5927 constant-current drivers, addressable LEDs running 100
updates per revolution synced to a Hall-effect rotation reference,
with frame data prepared in software and loaded onto an SD card
before performance.

What the camera captures from a POV LED array is not the body
carrying the rig — it is the programmed image, briefly resident as
light in physical space.
```

---

## Entry 04

```
SLUG: long-exposure-photography
CATEGORY: Capture
TITLE: Long-exposure photography
SEE ALSO: persistence-of-vision, light-painting, bulb-mode, iso-discipline, aperture-for-light-painting
SOURCES:
  - General photographic theory (any introductory text)
  - Holo-Flow Studio: working conventions
---

Long-exposure photography is the practice of leaving a camera's
shutter open long enough that the resulting image integrates light
across an extended period — anywhere from one second to several
hours. Used since the earliest days of photography (the daguerreotype
demanded exposures of fifteen minutes plus), the technique today
serves three distinct ends:

  1. Working at low light without artificial fill.
  2. Capturing motion blur as a creative effect — flowing water,
     star trails, the smoothing of crowds.
  3. Recording the trace of a moving light source against a still
     scene. This is light painting.

For the third case — the studio's primary use — the technical
considerations are:

  - **Aperture.** f/8 to f/11 is the working range. Smaller apertures
    produce diffraction; larger apertures collect too much ambient
    light in the long exposure.
  - **ISO.** As low as the sensor will go (ISO 50 or 100). Noise
    accumulates over the exposure; a low ISO is the simplest defence.
  - **Shutter speed.** From 5 seconds (for fast LED tools) to several
    minutes (for long kata). Often "bulb" mode — the shutter is held
    open manually until the gesture is complete.
  - **Focus.** Manual, locked, set before the lights go down. A
    taped ring is not a bad habit.
  - **White balance.** Manual; auto-WB will fight the colour of the
    lights through the exposure.

The challenge specific to long-exposure light painting is that
ambient light — moonlight, streetlight, even strong starlight — will
accumulate to wash the frame given enough exposure time. The studio's
typical practice is to shoot in genuinely dark locations (rural fields,
small hours), with the exposure tuned to the duration of the kata
rather than to the brightness of the scene.

For studio waveguide objects derived from photographs, the long
exposure is the source data: every captured kata becomes the input
geometry for a 3D-printed body.
```

---

## Entry 05

```
SLUG: uk-caa-drone-regulations-2026
CATEGORY: Drone
TITLE: UK CAA drone regulations (2026)
SEE ALSO: operator-id, a2-cofc, fpv-cinewhoop, drone-mounted-light-painting
SOURCES:
  - CAA, drone regulations effective 1 January 2026
  - DJI Viewpoints: 2026 UK rules summary (https://viewpoints.dji.com/blog/new-uk-drone-regulations)
  - Impact Aerial: A2 CofC walkthrough (https://www.impactaerial.co.uk/)
---

From 1 January 2026, the UK Civil Aviation Authority's drone
regulations apply with a lowered registration threshold and a
clarified competency framework.

Key thresholds for the working artist or commercial operator:

  - **Registration** is required for any drone with a camera weighing
    100 g or more (down from 250 g pre-2026). This produces an
    Operator ID, which must be displayed on the airframe.
  - **Flyer ID** is required for the pilot. Online theory test, free.
  - **A2 Certificate of Competency (A2 CofC)** is required for flying
    in the "Open / A2" subcategory — most relevantly, for any flight
    in the vicinity of uninvolved people with a drone in the 250 g –
    2 kg class. Achieved via theory-only examination at a CAA
    Recognised Assessment Entity (RAE).
  - **Commercial use** requires third-party insurance as a minimum.
    The CAA's guidance is unambiguous: any paid flight (including
    paid photography, paid surveys) qualifies.
  - **Class marks** (C0, C1, C2, etc.) on newer airframes determine
    which subcategory they may operate in. Pre-class drones are
    accommodated under transitional rules.

The Holo-Flow Studio fleet operates under these rules:

  - DJI Mavic 2 Pro — 907 g, transitional (no class mark). Permitted
    in A2 with A2 CofC.
  - DJI Neo — sub-250 g. Open / A1.
  - DJI Avata 360 — ~455 g. A2 with A2 CofC.

For aerial light painting commissions performed at night over rural
sites, the studio additionally observes:

  - Night flight is permitted in Open subcategories provided the
    drone has an anti-collision strobe.
  - Flights over uninvolved people are subject to the minimum
    distances of the active subcategory.
  - Any flight near restricted airspace or above 400 ft AGL requires
    additional permissions or operation under a Specific Category
    operating authorisation.

For a commission enquiry, the studio confirms applicable insurance,
Operator ID and pilot qualification on request.
```

---

## Status

5 of ~50 written. Voice is set: definition → history → technique → application. Sources cited.

**Sources used:**
- [Persistence of vision — Wikipedia](https://en.wikipedia.org/wiki/Persistence_of_vision)
- [Poi (performance art) — Wikipedia](https://en.wikipedia.org/wiki/Poi_(performance_art))
- [Te Papa: What makes a poi](https://www.tepapa.govt.nz/discover-collections/read-watch-play/poi/what-makes-poi-traditional-materials)
- [SpinPoi: History of poi](https://spinpoi.com/what-is-poi/)
- [Pixelstick — Bitbanger Labs](https://www.thepixelstick.com/)
- [Adafruit MiniPOV4](https://learn.adafruit.com/minipov4-diy-full-color-persistence-of-vision-light-painting-kit)
- [DJI Viewpoints: UK 2026 drone rules](https://viewpoints.dji.com/blog/new-uk-drone-regulations)
- [Impact Aerial: A2 CofC guide](https://www.impactaerial.co.uk/2026/02/03/uk-drone-license-a-simple-guide-to-caa-rules-in-2026/)

**Do you want me to keep going at this rate?** I can write another 5-10 in the next turn (Pixelstick, fire poi, Hahnemühle Photo Rag, SLA resin printing, light painting history, Reuben Wu, edition size conventions, certificate of authenticity, etc.) — say "more" and I'll pick the most useful next batch. Or redirect — "I'd rather you focus on [X area]" and I'll go deeper there.