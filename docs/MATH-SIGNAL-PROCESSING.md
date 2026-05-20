# Signal Processing — The Foundational Maths

A working reference for the studio's signal processing across audio,
image stitching, antialiasing, and IMU sensor fusion. The companion
codex entry at `/codex/signal-processing-essentials` is the catalogue
sketch; this is the longer treatment with the worked example.

Voice: Princess teaching register, calibrated against the studio's
existing codex prose. British spelling throughout.

---

## Why this exists

The studio touches signal processing wherever a continuous physical
thing — sound, light, angular velocity — becomes a list of numbers
and back again. The HRTF convolution that spatialises audio, the
FFT-based blend that hides a stitch line, the complementary filter
that keeps a drone level, the mipmaps that stop a texture crawling
at distance: all the same mathematics. Five ideas hold up the rest.

Primary references, in the order the studio recommends consulting
them:

- **3Blue1Brown's "But what is the Fourier transform? A visual
  introduction"** — the rotating-vector animation. Watch first.
- **Julius O. Smith III, _Mathematics of the DFT_**, available free at
  `ccrma.stanford.edu/~jos/mdft/`. The friendliest entry point.
- **Alan Oppenheim & Ronald Schafer, _Discrete-Time Signal
  Processing_** (Pearson, 3rd ed. 2010) — the field's textbook.
- **Leo I. Bluestein, "A linear filtering approach to the computation
  of the discrete Fourier transform"** (1968) — the trick under every
  arbitrary-length FFT.

---

## 1. The Fourier intuition

Fourier's 1822 claim, in plain English: any reasonable repeating
wiggle can be written as a sum of sine waves at integer multiples of
some base frequency. A square wave is a sum of odd sines whose
amplitudes drop as 1/n. A triangle wave is a sum of odd sines whose
amplitudes drop as 1/n² with alternating signs. A sawtooth is the
complete harmonic series.

The non-periodic extension — the **continuous Fourier transform** —
says any signal of finite energy can be written as a continuous sum
(an integral) of complex exponentials. The complex exponential
exp(i·2π·f·t) is a rotating unit vector in the complex plane; thinking
of it that way is what makes 3Blue1Brown's video click. Magnitude
tells you how much of that frequency is present; phase tells you when
its peak lands.

The computer-friendly version is the **discrete Fourier transform**,
or DFT. N samples of a signal in, N complex numbers out:

```text
X[k] = Σ_{n=0}^{N−1}  x[n] · exp(−i · 2π · k · n / N)
```

Each output X[k] is the inner product of the input signal with a
complex sinusoid at k cycles per N-sample window. It's a measurement
of how much "k-cycles-per-window" is in the signal, and at what
phase. Run it for k = 0, 1, ..., N−1 and you have the complete
frequency-domain representation.

The inverse transform brings it back:

```text
x[n] = (1/N) Σ_{k=0}^{N−1}  X[k] · exp(+i · 2π · k · n / N)
```

Same formula, different sign in the exponent, divided by N. The pair
is an exact, lossless rotation of the data between two views.

---

## 2. A 4-point DFT by hand

The smallest DFT worth computing on paper is N=4. Take a signal:

```text
x = [1, 2, 3, 4]
```

The basis is complex sinusoids at k cycles per 4-sample window. Let
W = exp(−i · 2π / 4) = exp(−iπ/2). Then W has four powers that cycle:

```text
W^0 = 1
W^1 = exp(−iπ/2)     = −i
W^2 = exp(−iπ)       = −1
W^3 = exp(−i3π/2)    = +i
```

The DFT matrix is W^(k·n):

```text
        n=0   n=1   n=2   n=3
k=0 [    1     1     1     1 ]
k=1 [    1    −i    −1    +i ]
k=2 [    1    −1     1    −1 ]
k=3 [    1    +i    −1    −i ]
```

Multiply by x = [1, 2, 3, 4]ᵀ:

**X[0]** = 1·1 + 1·2 + 1·3 + 1·4 = **10**

(the DC bin: just the sum of the samples)

**X[1]** = 1·1 + (−i)·2 + (−1)·3 + (+i)·4
      = (1 − 3) + i·(−2 + 4)
      = **−2 + 2i**

**X[2]** = 1·1 + (−1)·2 + 1·3 + (−1)·4
      = (1 − 2 + 3 − 4)
      = **−2**

(the Nyquist bin: alternating-sign sum, always real for real input)

**X[3]** = 1·1 + (+i)·2 + (−1)·3 + (−i)·4
      = (1 − 3) + i·(2 − 4)
      = **−2 − 2i**

So X = [10, −2+2i, −2, −2−2i].

### The conjugate-symmetry property

Notice X[3] is the complex conjugate of X[1]: X[3] = conj(X[1]).
This is not a coincidence; it's a structural property of the DFT
of any real-valued input.

In general, for real x[n]:

```text
X[N−k] = conj(X[k])
```

The proof is two lines. Substitute N−k for k in the DFT definition,
use the fact that exp(−i·2π·(N−k)·n / N) = exp(+i·2π·k·n / N)·exp(−i·2π·n)
= exp(+i·2π·k·n / N) (because exp(−i·2π·n) = 1 for integer n), and
observe that X with a positive exponent of a real signal is the
conjugate of X with the negative exponent.

The practical consequence: for a real input of length N, only the
first N/2 + 1 output bins carry independent information. Real-input
FFT routines (`rfft` in NumPy and SciPy, `realfft` in libraries
across the field) exploit exactly this and produce only those bins,
saving roughly half the memory and half the computation. The
studio's audio pipelines all use the real-input variant.

---

## 3. Time domain versus frequency domain

A signal in the time domain is what the microphone or sensor
measured: a list of amplitudes, one per sample, indexed by sample
number. A signal in the frequency domain is the same information
rotated through the FFT: a list of complex amplitudes, one per
frequency bin, indexed by bin number. The two representations carry
identical information; the FFT is the rotation between them.

The choice of representation is pragmatic. Some operations are easy
in one and hard in the other.

- **Easy in time, hard in frequency:** windowing, delaying,
  thresholding, transient detection, time-stretching.
- **Easy in frequency, hard in time:** filtering by frequency range,
  resampling, convolution with a long kernel, denoising by spectral
  subtraction, looking at the harmonic structure of a tone.

Working signal processing pipelines hop between the two repeatedly,
which is precisely why the FFT's O(N log N) cost matters
structurally — a slow transform would make the hopping prohibitive.

---

## 4. Convolution and the theorem that makes it cheap

Convolution describes what a linear, time-invariant system does to a
signal. Given an input x[n] and an impulse response h[n] of length M,
the output is:

```text
y[n] = Σ_{m=0}^{M−1}  h[m] · x[n − m]
```

Read out loud: slide the impulse response across the signal, multiply
sample by sample, sum. Cost is O(N·M).

The **convolution theorem** states:

```text
FFT( x * h ) = FFT(x) · FFT(h)    (pointwise multiplication)
```

where `*` is convolution. So:

1. FFT both signals (paying O(N log N) each, with M zero-padded up
   to the same length as N).
2. Multiply the resulting spectra sample by sample (O(N)).
3. Inverse-FFT the product (O(N log N)).

Total cost: O(N log N), independent of M. For long kernels the win
is enormous. A four-second 48kHz reverb impulse response is 192,000
samples; direct convolution with a one-second source is roughly
10¹⁰ multiplies; FFT convolution is roughly 8·10⁶. The studio's
real-time convolution reverb plugins all use a partitioned variant
that breaks the impulse response into blocks and uses overlap-save
or overlap-add to keep latency bounded.

The HRTF convolution that gives spatial-audio its direction is
exactly this operation, applied per ear, often per ambisonic
channel. See the **spatial-audio-explained** entry for the pipeline
context.

---

## 5. Spectral leakage and window functions

The DFT pretends its N samples are one period of an infinitely
repeating signal. They almost never are. The discontinuity at the
wrap-around — sample N−1 jumping back to sample 0 — appears in the
spectrum as energy smeared across every bin. A pure 1kHz tone
analysed in a rectangular (untouched) window comes out looking like
it has a hundred frequencies.

The fix is to multiply the input by a window function that tapers
smoothly to zero at both ends. The classics, all of them
raised-cosine variants:

| Window    | Main-lobe width (bins) | Sidelobe level | Use when                                                                  |
|-----------|------------------------|----------------|---------------------------------------------------------------------------|
| Rectangle | 2                      | −13 dB         | You want maximum frequency resolution and don't care about leakage. Rare. |
| Hann      | 4                      | −31 dB         | General-purpose default. The studio's pick.                               |
| Hamming   | 4                      | −42 dB (asym.) | Slightly better leakage, similar width.                                   |
| Blackman  | 6                      | −58 dB         | Looking for a quiet signal next to a loud one.                            |
| Kaiser β  | tunable                | tunable        | When you want to dial the tradeoff explicitly.                            |

Every window trades main-lobe width (how well it separates close
frequencies) against sidelobe level (how well it suppresses leakage
from a strong tone into nearby bins). No window is free; choosing
one is an honest statement of which property the work needs.

---

## 6. The Short-Time Fourier Transform

One FFT of a long signal collapses time entirely. You learn what
frequencies are present overall but nothing about when. The
**short-time Fourier transform** (STFT) restores time by computing
many FFTs on short, overlapping, windowed slices.

The recipe:

1. Choose a window length (say 1024 samples at 48kHz ≈ 21 ms).
2. Choose a hop size (commonly 25% to 50% of window length).
3. For each frame: window, FFT, store the result.

Plot magnitudes as a heatmap (time × frequency) and you have a
spectrogram — the staple visualisation of speech, music, bat calls,
gravitational waves. The studio uses spectrograms for diagnosing
audio anomalies and as the input representation to neural vocoders.

### Overlap-add reconstruction

Processing a signal in the STFT domain (filtering, denoising,
pitch-shifting) and reconstructing it back to time requires an
**overlap-add** or **overlap-save** step. With 50% overlap and a
Hann window for both analysis and synthesis, the synthesis windows
sum to a constant across the signal; the reconstruction is exact in
the absence of any spectral modification. Modify the spectrum and
you introduce artefacts proportional to how aggressively the
modification breaks the consistency between adjacent frames; this is
the entire field of phase-vocoder design.

Every modern text-to-speech system runs some variant of this loop.
Neural vocoders take the spectrogram representation, run a learned
network, and either invert via overlap-add or learn the time-domain
waveform directly.

---

## 7. Sampling and aliasing

The **Nyquist–Shannon sampling theorem**: a continuous signal
containing no frequencies above F hertz can be perfectly
reconstructed from samples taken at any rate above 2F.

CD audio samples at 44.1kHz to give a 22.05kHz Nyquist limit with
guard band for the anti-aliasing filter's rolloff (human hearing
tops out around 20kHz). The odd specific number is a historical
artefact of early digital recorders piggybacking on PAL/NTSC video
tape; it could easily have been 48kHz (and is, for video) or 96kHz
(for hi-res audio).

Feed in a signal containing frequencies above the Nyquist limit
without filtering them out first, and those high frequencies **fold
back** into the captured band as lower frequencies. A 25kHz tone
sampled at 44.1kHz appears as a 19.1kHz tone (44.1 − 25). This is
**aliasing**. It is the wagon-wheel-going-backwards effect in film,
the moiré pattern in a poorly rendered chequerboard, the buzz in an
oscilloscope reading above its sample rate.

The fix is an anti-aliasing filter: a low-pass filter applied to the
analogue signal before sampling, cutting frequencies above Nyquist.
In rendering the same theorem applies to spatial frequencies; the
"sample rate" is the pixel grid, and the anti-aliasing filter is
mipmapping, multisampling, or supersampling-then-downfilter.

---

## 8. Filters: FIR versus IIR

A filter passes some frequencies and attenuates others. Four
standard shapes:

- **Low-pass:** keep frequencies below a cutoff.
- **High-pass:** keep frequencies above a cutoff.
- **Band-pass:** keep a chosen middle range.
- **Band-stop (notch):** kill a chosen middle range.

Two implementation families:

### FIR (finite impulse response)

The output is a weighted sum of a finite number of past inputs:

```text
y[n] = Σ_{m=0}^{M−1}  b[m] · x[n − m]
```

Properties:

- **Always stable** (the impulse response is finite by
  construction).
- **Exact linear phase** is straightforward (symmetric coefficient
  vector).
- **Sharp cutoffs are expensive** — a really tight low-pass needs
  hundreds of taps.

The studio uses FIRs for image filters (phase distortion would warp
features), symmetric audio crossovers, and anti-aliasing
resamplers.

### IIR (infinite impulse response)

The output depends on past inputs **and** past outputs:

```text
y[n] = Σ_{m=0}^{M−1}  b[m] · x[n − m] − Σ_{m=1}^{K}  a[m] · y[n − m]
```

Properties:

- **Cheap** — a steep cutoff costs five to ten coefficients.
- **Can be unstable** if the feedback coefficients aren't designed
  carefully (poles outside the unit circle).
- **Has phase distortion** — frequency-dependent group delay.

The **biquad** (two poles, two zeros) is the workhorse IIR. Every
parametric EQ in every console is a cascade of biquads.

### Where they appear at the studio

- **HRTF convolution:** FIR (the impulse response is naturally
  finite, and phase fidelity matters for spatial cues).
- **IMU complementary filter:** simple first-order IIRs in
  complementary high-pass / low-pass pair.
- **Image stitching blend:** band-pass filters at multiple spatial
  scales (Laplacian pyramid).
- **Mastering EQ:** biquad cascade IIRs.

---

## 9. Where this surfaces across Holoflow's verticals

**Audio (spatial audio, voice synthesis).** HRTF convolution per ear,
ambisonic decoding via spherical harmonic filtering, neural vocoder
STFT loops. See `/codex/spatial-audio-explained` and
`/codex/hrtf-head-related-transfer-function`.

**Image stitching (360° panoramas).** Laplacian pyramid blending at
seam lines, spectral analysis for exposure matching, frequency-domain
correlation for feature matching.

**Antialiasing in rendering.** Mipmap generation is a chain of
low-pass-and-downsample operations. Multisample antialiasing
band-limits the geometry edge function. Temporal antialiasing adds
a time-domain low-pass across frames.

**IMU sensor fusion (drone flight controllers).** Complementary
filter is two first-order IIRs whose outputs sum to a stable
orientation estimate. Kalman filter is the optimal generalisation;
Mahony and Madgwick filters are the gradient-descent variants now
standard in hobbyist autopilots. The whole attitude solution is a
dozen lines of arithmetic.

**LED rig timing.** Pre-render frames in the frequency domain (apply
glow, blur, vignette via FFT-multiplication-IFFT) before writing the
SD card. See `/codex/teensy` for the playback side.

---

## Forward references

- **linear-algebra-essentials** — the matrix view of the DFT; matrix
  factorisation as the underlying structure of the FFT.
- **spatial-audio-explained** — the HRTF and ambisonic pipeline that
  consumes the convolution theorem.
- **audio-synthesis-mathematics** (planned) — additive, FM, granular,
  and physical-modelling synthesis built on the Fourier intuition.
- **imu-fusion-and-control** (planned) — complementary, Kalman,
  Madgwick and Mahony filters in working detail.

---

## Source bibliography

1. Oppenheim, Alan V., and Schafer, Ronald W. _Discrete-Time Signal
   Processing_. 3rd ed., Pearson, 2010.
2. Smith, Julius O. III. _Mathematics of the Discrete Fourier
   Transform (DFT), with Audio Applications_. W3K Publishing, 2007.
   Free online at `ccrma.stanford.edu/~jos/mdft/`.
3. Cooley, James W., and Tukey, John W. "An algorithm for the
   machine calculation of complex Fourier series." _Mathematics of
   Computation_ 19 (1965): 297–301.
4. Bluestein, Leo I. "A linear filtering approach to the computation
   of the discrete Fourier transform." _IEEE Transactions on
   Audio and Electroacoustics_ 18 (1970): 451–455. (Originally 1968
   technical report.)
5. Sanderson, Grant. "But what is the Fourier transform? A visual
   introduction." 3Blue1Brown, 2018. youtube.com/@3blue1brown.
6. Shannon, Claude E. "Communication in the presence of noise."
   _Proceedings of the IRE_ 37 (1949): 10–21.
