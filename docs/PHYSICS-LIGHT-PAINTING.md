# Physics of light painting — the foundational maths

The longer companion to the codex entry
`light-painting-mathematics`. This file works through the equations
the entry only states, names the units, and tabulates the bench's
measured numbers across each rig generation. Everything here is
anchored in three integrators stacked: the eye's ~20 ms fusion
window, the camera's open-shutter interval T, and the LED's pulse-
width duty cycle. The trick is keeping all three in agreement long
enough for the image to resolve.

When this file passes 300 lines, it splits per `ARCHITECTURE.md`
Rule 1. Companion codex entries: `persistence-of-vision`,
`pov-led-array`, `addressable-leds`, `teensy`,
`signal-processing-essentials`, and the planned
`aerial-light-painting`.

## 1. Persistence of vision — what the eye actually does

"Persistence of vision" is shorthand for a cluster of mechanisms,
not a single neural latch. D'Arcy described the swung-torch effect
in 1768; Roget named it for the Royal Society in 1824. The modern
account, after Anstis's 1986 review in the *Handbook of Perception
and Human Performance*, recognises at least three processes on
different timescales:

| Mechanism | Timescale | What it does |
| --- | --- | --- |
| Photoreceptor temporal summation (Bloch's law) | up to ~100 ms | Brief flashes summed by intensity × duration up to the critical duration. |
| Flicker fusion | ~50 Hz photopic | Periodic on/off becomes indistinguishable from steady illumination. |
| Phi phenomenon / beta movement | ~16–60 ms ISI | Two static stimuli at different positions perceived as one moving object. |

Working figures at the bench: stimuli separated by less than ~20 ms
fuse; stimuli separated by 50 ms or more read as discrete. The
light-painting practitioner cares about the upper end (the audience
must not see flicker between columns); the camera-trace
practitioner does not care at all (the sensor integrates).

## 2. The rotation-rate / LED-count equation

For an array of N LEDs rotating at angular velocity ω in revolutions
per second, the time each angular column is held visible to a
stationary observer is:

```text
Δt = 1 / (N · ω)
```

The column dwell time. Three regimes follow.

**Below fusion (Δt > 20 ms): the audience sees flicker.** This is
the limit you do not want to design near. At N = 200 and ω = 1/4
rev/s (a slow 4-second revolution), Δt = 20 ms and the eye is at the
boundary; the rig flickers visibly. Avoidable by either spinning
faster or carrying fewer columns of distinct data per revolution.

**At fusion (Δt ≈ 5–20 ms): comfortable visual viewing.** The
studio's default handheld rotational rig — N = 200, ω = 1 rev/s,
Δt = 5 ms — sits here. The eye fuses cleanly; the geometric angular
resolution per column is 360° / 200 = 1.8°. Acceptable for a
camera-facing print, coarse for an unaided observer standing close.

**Below LED protocol limits (Δt ≈ 1 ms or less): the bottleneck
moves to the protocol.** At ω = 5 rev/s, N = 200, Δt = 1 ms. A
WS2812 strip clocked at 800 kHz needs 200 × 24 bits / 800 kHz = 6 ms
per frame, so the protocol cannot keep up and the rig fails to
update each column inside its dwell window. APA102 / SK9822 driven
over hardware SPI at 8 MHz delivers the same 4,800 bits in 0.6 ms
and the rig stays synchronous. This is why the studio defaults to
APA102 the moment rotation enters the picture.

## 3. Camera sensor integration time T

A photograph is the time integral of irradiance across the open-
shutter interval T. Writing the moving emissive source's intensity
as I(t) and its image-plane position as p(t), the sensor signal at
image-plane coordinate x is, up to constants:

```text
S(x) ∝ ∫₀ᵀ I(t) · δ(x − p(t)) dt
```

Each pixel accumulates whatever passed through during T, weighted
by dwell. The trace is the integration. For a single point moving
at velocity v on the image plane, trace brightness per pixel goes
as 1/v: fast motion dim, slow motion bright. For a POV LED bar
where each column changes intensity per frame, the trace at a
position records the intensity assigned to that angular column.

This is also why light painting "draws" rather than "exposes a
scene": ambient illumination is continuous and accumulates over T
as background. The studio's practice — dark rural fields, small
hours — keeps the ambient term small.

## 4. The reciprocity law and its (digital) absence of failure

Equivalent exposures deliver the same total photon count to each
photosite. Halving T while doubling aperture area (one stop wider)
leaves the integral unchanged. The classical reciprocity law:

```text
S ∝ E · T
```

where E is the irradiance at the sensor plane. The studio's working
aperture range for light-painting work is f/8 to f/11; smaller and
diffraction starts to blur the trace, larger and depth-of-field
becomes too tight for handheld focus and ambient leaks accumulate.
ISO is held as low as the body permits (ISO 50 or 100) because read
noise and dark current accumulate over T regardless of ISO and the
in-camera amplifier setting is the only knob worth turning down.

Reciprocity *failure* — where S = E · T stops holding because film
grains need a minimum number of photons in a coherence window to
register at all — was the bane of long-exposure film. Schwarzschild's
1899 correction was `S ∝ (E · T)^p` with p ≈ 0.7–0.9. Modern CCD
and CMOS sensors are linear photon counters across the regime
light-painters work in (seconds to a few minutes). The deviations
at long T are read noise (per-pixel Gaussian, set on readout) and
dark current (per-pixel Poisson, proportional to T and to sensor
temperature). Cooling helps with both. Reciprocity failure proper
does not apply. The Princess declines to recite the Schwarzschild
exponent.

## 5. Bayer mosaic, demosaicing, and colour-dependent noise

Consumer image sensors don't measure colour at each photosite. They
measure one of red, green, or blue through a colour-filter array
that, in the original 1976 Bayer-Kodak design (US Patent 3,971,065),
runs RGGB: a 2×2 tile of one red, two green, one blue. The mosaic
favours green to mirror human luminance perception's green-weighted
response.

Two consequences for light-painting:

1. **Colour-dependent noise.** A pure-red LED only lands on a
   quarter of the photosites; the rest see it through the green and
   blue filters as roughly zero. The signal-to-noise ratio of a
   pure-red trace is therefore worse than that of a white trace by
   roughly the square root of four, ~2×, in the limit of negligible
   ambient. Pure-blue is the same; pure-green is slightly better
   (twice the photosites); cyan, magenta, and yellow distribute across
   pairs of channels and look quieter. The bench rule: if a trace
   needs to be cleanest, drive it cyan or magenta; only drive pure
   primaries when the colour itself is load-bearing.

2. **Demosaicing artefacts on hard edges.** A bright LED snapping
   on or off produces a sharp luminance edge that the demosaicer
   interpolates three of four channels across. Modern algorithms
   (Adaptive Homogeneity-Directed by Hirakawa & Parks, Variable
   Number of Gradients) handle this well; older ones can produce
   coloured fringing on the leading edge of fast traces. The studio
   runs Adobe's Camera Raw demosaicer; fringing is below the noise
   floor at ISO 100 and invisible after default CA correction.

Fuji's X-Trans CFA uses a 6×6 pseudo-random pattern; the noise
asymmetry across primaries holds, the artefact shape differs, the
working rule is the same.

## 6. PWM, duty cycle, and the rolling-shutter banding problem

Addressable LEDs do not dim by analogue current control. They pulse
on and off at a high frequency and the ratio of on-time to off-time
(the duty cycle) sets the perceived brightness. WS2812 runs internal
PWM at roughly 400 Hz; APA102 / SK9822 runs internal PWM nominally
at 20 kHz, programmable upward through the protocol's 5-bit global
brightness field. The eye fuses both comfortably.

The camera is another matter. Most consumer CMOS sensors employ a
**rolling shutter**: rows are read out top-to-bottom over a small
but non-zero interval (typically 10–30 ms full-frame). Each row
integrates over a slightly different sub-window of T. When a scene-
wide source pulses at a frequency commensurate with the row-readout
rate, different rows catch different phases of the duty cycle and
the image records **visible horizontal bands** of varying brightness
or colour — PWM banding. The classic manifestation: pink-and-green
stripes across a webcam shot of a cheap LED ceiling panel.

Three working fixes:

| Fix | When to use it | Cost |
| --- | --- | --- |
| Long T (≥ 1 s) | Always preferable; many PWM cycles average out per row. | Demands a dark scene. |
| LED PWM frequency above row-readout rate | When T must stay short. APA102 with a custom driver can reach 50 kHz+. | Custom driver firmware. |
| Global-shutter camera | When the rig is in motion *and* exposure must be short. | Industrial CMOS or Sony α9-class electronic global shutter; small selection, high cost. |

The studio's long-exposure work runs at T ≥ 1 s and banding doesn't
appear. Video documentation runs APA102 at the highest brightness
the firmware will tolerate (PWM duty high, modulation depth low),
or on Sony α7S-series sensors whose electronic shutter row time
hides most PWM frequencies.

## 7. Rotation aliasing

A separate issue from PWM banding, but related by the same maths.
When recording video of a rotating rig, if the rig's column-update
rate (N · ω) is commensurate with the camera's frame rate `f_frame`,
the same angular column lands at the same camera-frame phase
repeatedly. The image appears to stand still, drift backwards
(the wagon-wheel effect), or strobe. The Nyquist condition for
trouble is:

```text
(N · ω) mod f_frame ≈ 0    →    aliasing
(N · ω) ≫ f_frame and not commensurate    →    safe
```

For still long-exposure work this never matters; T is much longer
than any rig period. For video the fix is to pick ω off the
rational fractions of `f_frame`, or to jitter the LED column rate
at the microsecond level so any aliasing decorrelates over the
recording. The studio's video shoots run at 60 fps with ω chosen
to put (N · ω) well above 1 kHz so the aliasing band sits below
the per-frame integration window.

## 8. Centripetal forces — the bench builds these by hand

The other rotational consequence is mechanical, and this is the
section that gets workshop-Dimona's attention because it is the
section where rigs break if the maths is wrong. An LED at radius r
on a rig spinning at angular velocity ω_r (radians per second,
*not* rev/s) experiences centripetal acceleration:

```text
a = ω_r² · r
```

The studio's measured numbers across three rig sizes:

| Rig | r (m) | ω (rev/s) | ω_r (rad/s) | a (m/s²) | a (g) | 30 g LED pulls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Handheld short | 0.20 | 5 | 31.4 | 197 | 20 | 0.6 kg |
| Handheld standard | 0.30 | 5 | 31.4 | 296 | 30 | 0.9 kg |
| Handheld long | 0.50 | 5 | 31.4 | 493 | 50 | 1.5 kg |
| Spinning rig (tripod) | 0.50 | 10 | 62.8 | 1973 | 200 | 6.0 kg |
| /aerial drone rig | 1.00 | 0.5 | 3.14 | 9.9 | 1.0 | 30 g |

Two engineering rules of thumb fall out:

1. **Retention margin × 4.** Every wire, screw, battery cradle, and
   LED-strip mount on the rig must be retained against four times
   the worst-case centripetal load. The factor of four is the
   studio's own; aerospace would use higher, hobby would use less.
   This is the budget that keeps a battery from departing the rig
   at 6 kg of tension partway through a session.

2. **Radial deflection scales with ω².** Long booms deflect outward
   under centripetal load. The deflection moves the LED tip and
   distorts the trace's geometry. The studio keeps r short (under
   30 cm for handheld rotational work), cross-braces where r demands
   it, and photographs a calibration target at each operating ω
   before each session to measure residual deflection. The result
   goes into a per-rig correction table loaded onto the SD card
   alongside the per-LED colour correction (see `addressable-leds`).

The aluminium-tubing rigs the studio runs are built for these
numbers. The Pixelstick, designed for walking rather than spinning,
is not.

## 9. Colour-temperature drift under battery sag

An LED's emission spectrum depends on the current; the current
depends on the forward voltage drop across the junction; the
forward voltage depends on temperature and supply rail. A single-
cell LiPo discharges from 4.2 V to ~3.3 V across its working life.
On a five-minute exposure with a rig drawing 5–10 A, the rail can
sag 5–15% depending on cell quality and internal resistance. An
unregulated LED rail sees proportional current reduction and an
asymmetric spectral shift: red and amber (lower forward voltage,
higher current sensitivity) fall faster than blue. The trace drifts
visibly warm across the exposure. The eye misses it mid-performance;
the sensor preserves the drift faithfully.

The fix is a constant-current driver between rail and LED. Two
architectures are common at the studio:

- **TLC5927** (Texas Instruments, SLVS841, 2008). 16-channel
  current-sink, 5–90 mA per channel, ~1% matching, programmable
  global brightness via dot-correction register. The reference
  for high-current-per-LED rigs.
- **APA102 / SK9822 internal regulation.** Each LED contains its
  own current-regulator IC; the 5-bit global brightness field is a
  coarse PWM gate over the regulated current. Less precise than
  TLC5927, an order of magnitude simpler to wire.

Both hold LED current constant regardless of rail state of charge
within compliance range. Result on a five-minute exposure:
highlights stay saturated, shadows stay neutral, colour temperature
matches frame one in frame ten. Cost: a more complicated driver
stack. Alternative: reshooting when the photograph turns out warm.

## 10. Where this maths lives at the studio

- **The bench's POV LED rigs.** Teensy 3.1 + APA102 + TLC5927 + Hall-
  effect rotation reference + SD-card frame data. The rigs the studio
  uses for `/photographs` work and for the heritage waveguide-object
  pipeline. Documented at length in `pov-led-array`.
- **The `/aerial` light-painting line.** Drone-mounted LED bars
  running the same maths on a longer baseline; the rig becomes a
  flying line and the kata a flight path. Centripetal numbers are
  small (drone doesn't spin) and rotation-aliasing doesn't apply
  (LEDs translate), but integration-time and PWM maths is
  identical. Forthcoming: `aerial-light-painting`.
- **The bezel-clip controllers.** Hand-held rotational triggers
  for instantaneous frame-index override without breaking the
  gesture. The maths here is millisecond-level timing-keeping;
  docs are under the controller-firmware folder.
- **The Pixelstick reference.** Bitbanger Labs's 200-LED hand-
  walked bar (2014) is the commercial baseline the studio's rigs
  were designed in dialogue with. Excellent for hand-walked
  single-bar light-painting; the studio's rigs target precise
  per-revolution-synced rotational geometry instead.

## Sources

1. Anstis, S. (1986). "Motion Perception in the Frontal Plane:
   Sensory Aspects." In K. R. Boff, L. Kaufman, J. P. Thomas (eds.),
   *Handbook of Perception and Human Performance*, Vol. 1, Ch. 16.
   Wiley.
2. Bloch, A.-M. (1885). "Expériences sur la vision."
   *Comptes Rendus de la Société de Biologie*, 37, 493–495.
3. Roget, P. M. (1825). "Explanation of an Optical Deception in the
   Appearance of the Spokes of a Wheel Seen Through Vertical
   Apertures." *Philosophical Transactions of the Royal Society of
   London*, 115, 131–140.
4. Schwarzschild, K. (1899). "On the deviations from the law of
   reciprocity for bromide of silver gelatine."
   *Astrophysical Journal*, 11, 89–91. (For historical interest;
   not applicable to modern digital sensors.)
5. Bayer, B. E. (1976). "Color Imaging Array." US Patent 3,971,065,
   filed 5 March 1975, granted 20 July 1976. Assigned to Eastman
   Kodak Company.
6. Hirakawa, K., and Parks, T. W. (2005). "Adaptive Homogeneity-
   Directed Demosaicing Algorithm." *IEEE Transactions on Image
   Processing*, 14(3), 360–369.
7. Worldsemi Co. Ltd. WS2812B Intelligent control LED integrated
   light source datasheet, V1.0.
8. Texas Instruments. TLC5927 16-Channel, 16-Bit Enhanced Spectrum,
   PWM Grayscale LED Driver. Datasheet SLVS841, 2008.
9. APA102C / SK9822 application notes (multiple manufacturers;
   datasheets vary; the protocol is two-wire SPI with start frame
   0x00000000, per-LED frame `111`+`5-bit-brightness`+`8-bit B`+
   `8-bit G`+`8-bit R`, and an end frame of `1`s long enough to
   clock the data through the chain).
10. Smith, J. O. *Mathematics of the Discrete Fourier Transform*.
    CCRMA, Stanford. Free online; the friendliest entry point to the
    sampling-theorem view of rotational aliasing.

## See also

- `persistence-of-vision` — the optical foundation
- `pov-led-array` — the apparatus
- `addressable-leds` — the LED protocol layer
- `long-exposure-photography` — the capture context
- `teensy` — the controller
- `signal-processing-essentials` — the sampling-theorem view
- `pixelstick` — the commercial reference rig
- *future:* `aerial-light-painting` — the drone-rig follow-on
