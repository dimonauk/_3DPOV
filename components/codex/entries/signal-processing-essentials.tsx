export default function SignalProcessingEssentials() {
  return (
    <>
      <p>
        Signal processing is the mathematics of how a wiggle becomes a
        number, how that number becomes a spectrum, and how the spectrum
        comes back out the other end as a wiggle again with everything
        the studio didn&rsquo;t want removed. It underwrites audio,
        image stitching, antialiasing, and the small honest miracle that
        is a drone holding level against a gust. The reader who has
        never opened Oppenheim and Schafer is in good company; the
        reader who has is welcome to skim.<sup>1</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The Fourier intuition
      </h2>
      <p>
        Jean-Baptiste Joseph Fourier&rsquo;s claim, made in 1822 in his{" "}
        <em>Th&eacute;orie analytique de la chaleur</em>, was that any
        reasonable periodic signal can be written as a sum of sines and
        cosines at integer multiples of a base frequency. The claim was
        controversial at the time and remains, with hedges around the
        word &ldquo;reasonable,&rdquo; correct. Every square wave the
        studio has ever generated is a sum of odd harmonics whose
        amplitudes fall as 1/n; every triangle wave is the same with
        squared denominators and a sign flip; every sawtooth is the
        complete harmonic series. The visual case for this lives in
        3Blue1Brown&rsquo;s rotating-vector animation of the Fourier
        transform, which is the clearest exposition the maths has had
        in two hundred years.<sup>2</sup>
      </p>
      <p>
        The continuous Fourier transform extends the claim from
        periodic signals to any signal of finite energy. The{" "}
        <strong>discrete Fourier transform</strong> (DFT) is the
        finite-sample, finite-length cousin that a computer can
        actually compute. Its definition is the formula every digital
        signal processing course writes on the first whiteboard of the
        first lecture:
      </p>
      <p className="text-center font-mono text-chrome-200">
        X[k] = &Sigma;<sub>n=0</sub>
        <sup>N&minus;1</sup> x[n] &middot; e
        <sup>&minus;i&middot;2&pi;&middot;k&middot;n/N</sup>
      </p>
      <p>
        N samples in, N complex numbers out. The k-th output is the
        correlation of the input with a complex sinusoid at k cycles
        per N-sample window. Compute it naively and the cost is
        O(N&sup2;), which is why the field largely lay dormant for
        computational purposes until 1965, when Cooley and Tukey
        rediscovered the divide-and-conquer factoring trick (Gauss had
        it first, in 1805, in a notebook nobody read) and reduced the
        cost to O(N log N). This is the{" "}
        <strong>fast Fourier transform</strong> (FFT) and it is the
        single most important computational gift the twentieth century
        gave to working engineers. The Bluestein extension of 1968
        handles N that aren&rsquo;t powers of two without
        embarrassment.<sup>3</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Time domain versus frequency domain
      </h2>
      <p>
        A signal in the time domain is what the microphone measured: a
        list of amplitudes, one per sample. A signal in the frequency
        domain is the same information rotated ninety degrees: a list
        of how much of each frequency the signal contains, along with
        the phase of each component. The two representations carry
        identical information; the FFT is the rotation between them.
      </p>
      <p>
        The studio reaches for the time domain when the question is{" "}
        <em>when</em> &mdash; when does the transient hit, when does
        the IMU report a tilt, when does the LED need to fire. The
        studio reaches for the frequency domain when the question is{" "}
        <em>what</em> &mdash; what tone is present, what spatial
        frequencies are in this image, what resonance is making the
        rig hum. Most working signal processing alternates between the
        two several times per operation, which is part of what makes
        the FFT&rsquo;s speed so structurally important.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Convolution and the theorem that makes it cheap
      </h2>
      <p>
        Convolution is the operation that describes what a linear,
        time-invariant system does to a signal. Run a click through a
        cathedral and the cathedral&rsquo;s impulse response convolved
        with the click is what comes out. Filtering a signal is
        convolution. Reverb is convolution. The{" "}
        <strong>
          <a
            href="/codex/hrtf-head-related-transfer-function"
            className="text-pink-200 underline underline-offset-4"
          >
            head-related transfer function
          </a>
        </strong>{" "}
        that gives the listener spatial-audio direction is convolution.
        Image blur is two-dimensional convolution.
      </p>
      <p>
        Direct convolution costs O(N&middot;M) for an N-sample signal
        and an M-sample kernel. The{" "}
        <strong>convolution theorem</strong> states that convolution
        in the time domain corresponds to{" "}
        <em>pointwise multiplication</em> in the frequency domain. FFT
        both signals, multiply them sample by sample, inverse FFT the
        result; the total cost is O(N log N) regardless of kernel size.
        For long kernels &mdash; a four-second reverb at 48kHz is a
        192,000-sample impulse response &mdash; the theorem is the
        difference between real-time playback and a coffee break.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Why naive truncation leaks: window functions
      </h2>
      <p>
        The DFT assumes the N samples it&rsquo;s given are one period
        of an infinitely repeating signal. They never are. The
        discontinuity between the last sample of the window and the
        wraparound to the first sample manifests, in the frequency
        domain, as energy smeared across every output bin. This is{" "}
        <strong>spectral leakage</strong>, and it is the reason a pure
        1kHz tone analysed in a naive rectangular window appears to
        contain a hundred frequencies that aren&rsquo;t there.
      </p>
      <p>
        The fix is to multiply the input window by a function that
        tapers smoothly to zero at both ends. The classics:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Hann</strong> (Julius von Hann, raised cosine):
          good general-purpose default, &minus;31 dB sidelobes.
        </li>
        <li>
          <strong>Hamming</strong> (Richard Hamming, raised cosine
          with adjusted constants): slightly narrower main lobe at
          the cost of less sidelobe rolloff.
        </li>
        <li>
          <strong>Blackman</strong> (Ralph Beebe Blackman, three-term
          cosine): wider main lobe, much lower sidelobes
          (&minus;58 dB). Used when dynamic range matters more than
          frequency resolution.
        </li>
      </ul>
      <p>
        No window is free; every choice trades main-lobe width
        (frequency resolution) against sidelobe level (leakage
        suppression). The studio defaults to Hann for spectrogram work
        and reaches for Blackman when looking for a quiet signal next
        to a loud one.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        STFT: the bridge to spectrograms
      </h2>
      <p>
        A single FFT collapses time entirely; the output is the
        frequency content of the whole window with no information
        about when anything happened. The{" "}
        <strong>short-time Fourier transform</strong> (STFT) restores
        time by computing many small FFTs on overlapping, windowed
        slices of the signal. Plot the magnitudes as a heatmap with
        time on one axis and frequency on the other and the result is
        a <strong>spectrogram</strong>: the staple visualisation of
        speech, music, bat calls, gravitational waves, and any signal
        whose frequency content varies over time.
      </p>
      <p>
        The reconstruction trick is{" "}
        <strong>overlap-add</strong>: each STFT frame is processed
        independently in the frequency domain, inverse-FFT&rsquo;d
        back to the time domain, multiplied by the synthesis window,
        and summed with its neighbours at the correct offset. With
        50% overlap and a Hann window, the synthesis windows sum to a
        constant and the reconstruction is exact. Every neural
        vocoder, every phase vocoder, every pitch-shift and time-
        stretch plugin runs some variant of this loop.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Sampling: why 44.1kHz, why aliasing
      </h2>
      <p>
        The Nyquist&ndash;Shannon sampling theorem states that a
        continuous signal containing no frequencies above F can be
        perfectly reconstructed from samples taken at any rate above
        2F. Human hearing tops out around 20kHz; CD audio samples at
        44.1kHz to give a 22.05kHz Nyquist limit with a small
        guard band for the anti-aliasing filter&rsquo;s rolloff. The
        odd specific number is a historical artefact of early digital
        recorders piggybacking on PAL/NTSC video tape and is the
        reason every audio engineer can recite the integer factor
        47 from memory.
      </p>
      <p>
        Sample faster than 2F and the spectrum below F is faithfully
        captured. Sample slower &mdash; or feed in a signal containing
        frequencies above F without filtering them first &mdash; and
        those high frequencies <strong>fold back</strong> into the
        captured band as lower frequencies pretending to be signal.
        This is <strong>aliasing</strong>, and it is the wagon-wheel-
        going-backwards effect on film, the moir&eacute; in a poorly
        rendered chequerboard, and the buzz in an oscilloscope reading
        a frequency above its sample rate. Antialiasing in rendering
        is the same theorem applied to spatial frequencies: blur
        before downsampling or risk jagged edges and crawling
        textures.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Filters: FIR versus IIR
      </h2>
      <p>
        A filter is anything that lets some frequencies through and
        attenuates others. Low-pass keeps the lows, high-pass keeps
        the highs, band-pass keeps a chosen middle range, band-stop
        kills it. Implementations split into two families:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Finite impulse response (FIR):</strong> the output
          is a weighted sum of a finite number of past inputs. Always
          stable, easy to design for exact linear phase, expensive
          for sharp cutoffs. The studio uses FIRs for anything where
          phase distortion would matter &mdash; image processing,
          symmetric audio crossovers, anti-aliasing.
        </li>
        <li>
          <strong>Infinite impulse response (IIR):</strong> the
          output depends on past inputs <em>and</em> past outputs
          via feedback. Cheap (a steep cutoff costs a handful of
          coefficients), can be unstable if badly designed, has
          phase distortion. Biquad cascades are the workhorse IIR;
          the parametric EQ on every console in the world is a stack
          of biquads.
        </li>
      </ul>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Where this shows up at the studio
      </h2>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>
            <a
              href="/codex/hrtf-head-related-transfer-function"
              className="text-pink-200 underline underline-offset-4"
            >
              HRTF
            </a>{" "}
            audio convolution.
          </strong>{" "}
          Spatial-audio rendering is a pair of FFT-domain
          multiplications, one per ear, applied per ambisonic
          channel. See{" "}
          <strong>
            <a
              href="/codex/spatial-audio-explained"
              className="text-pink-200 underline underline-offset-4"
            >
              spatial audio explained
            </a>
          </strong>{" "}
          for the surrounding pipeline.
        </li>
        <li>
          <strong>Neural vocoder reconstruction.</strong> Every
          modern text-to-speech system &mdash; Kokoro, F5, ElevenLabs
          &mdash; runs an STFT-based or signal-modelling neural
          synthesis pass and inverts it via overlap-add or a learned
          waveform decoder.
        </li>
        <li>
          <strong>IMU complementary filter on the drone.</strong> The
          accelerometer is honest about gravity but noisy in the
          short term; the gyro is precise in the short term but
          drifts. A complementary filter is two simple IIRs &mdash;
          high-pass the gyro, low-pass the accelerometer &mdash; whose
          outputs sum to a stable orientation estimate. The whole
          attitude solution on a 200&pound; flight controller is
          roughly twelve lines of arithmetic.
        </li>
        <li>
          <strong>Image-stitching frequency-domain blending.</strong>{" "}
          The seam between two overlapping panorama images is blended
          using a Laplacian pyramid &mdash; band-pass filters at
          decreasing spatial scales &mdash; so that low frequencies
          cross-fade gradually while high frequencies cut sharply.
          This is what hides the colour mismatch at a stitch line.
        </li>
        <li>
          <strong>Antialiasing in rendering.</strong> Mipmaps are
          pre-computed low-passed versions of a texture. Multisample
          antialiasing band-limits the geometry edge function. Both
          are the sampling theorem applied to images.
        </li>
      </ul>
      <p>
        The mathematics is a small set of ideas applied relentlessly:
        a signal is a sum of frequencies, the FFT moves between the
        two views cheaply, convolution is multiplication in the
        frequency domain, and undersampling makes things lie. The
        longer companion doc at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-SIGNAL-PROCESSING.md
        </code>{" "}
        walks a 4-point DFT through by hand and shows the
        conjugate-symmetry property fall out of the algebra. See also{" "}
        <em>linear-algebra-essentials</em> for the matrix view of the
        same transform, and the planned{" "}
        <em>audio-synthesis-mathematics</em> and{" "}
        <em>imu-fusion-and-control</em> entries for the audio and
        sensor-fusion follow-ups.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Alan Oppenheim and Ronald Schafer&rsquo;s{" "}
          <em>Discrete-Time Signal Processing</em> is the textbook
          everyone in the field has on a shelf even if they bought it
          second-hand and haven&rsquo;t opened it since the qualifying
          exam. Julius Smith&rsquo;s{" "}
          <em>Mathematics of the DFT</em>, free online at
          ccrma.stanford.edu, is the friendliest entry point and the
          one the studio recommends to anyone new to the maths.
        </li>
        <li>
          Grant Sanderson&rsquo;s 3Blue1Brown video &ldquo;But what is
          the Fourier transform? A visual introduction&rdquo; is the
          single best explanation of the rotating-vector
          interpretation that exists. Watch it before reading any
          textbook chapter and the textbook chapter will make sense.
        </li>
        <li>
          The Bluestein chirp-z transform (Leo Bluestein, 1968)
          converts a DFT of any length into a convolution that can be
          done with two power-of-two FFTs. It is the trick under every
          modern FFT library&rsquo;s &ldquo;arbitrary N&rdquo;
          guarantee.
        </li>
      </ol>
    </>
  );
}
