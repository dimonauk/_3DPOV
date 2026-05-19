export default function HrtfHeadRelatedTransferFunction() {
  return (
    <>
      <p>
        A head-related transfer function (HRTF) is the filter that
        describes how a particular human&rsquo;s ears, head, and
        torso reshape an incoming sound on its way to the eardrums.
        For any direction the sound arrives from, the HRTF specifies
        what the left and right eardrum signals are &mdash; the small
        but precise time delays, frequency notches, and amplitude
        differences that the brain interprets as localisation in 3D
        space. Strap headphones to the same ears and feed each
        eardrum the same signals the HRTF would produce, and the
        brain places the sound somewhere in space rather than inside
        the head.<sup>1</sup>
      </p>
      <p>
        Web Audio exposes HRTF spatialisation through the{" "}
        <code className="font-mono text-chrome-200">
          PannerNode
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">
          panningModel: &apos;HRTF&apos;
        </code>
        . Set the node&rsquo;s position and orientation, set the
        listener&rsquo;s position and orientation, and the browser
        does the convolution with a built-in generic HRTF database
        (the MIT KEMAR set, in Chromium). The result is spatialised
        audio that updates in real time as the source or the listener
        moves &mdash; which, in a WebXR scene where the listener
        position is driven by the headset pose, is exactly the
        primitive needed.
      </p>
      <p>
        Why this is non-negotiable in VR: the visual scene by itself
        is a competent illusion of presence, but as soon as the user
        turns their head the brain expects the sound field to turn
        with the world. A mono soundtrack panned arbitrarily across
        stereo headphones doesn&rsquo;t do this; an HRTF-spatialised
        sound source does, and the scene commits at a level
        visual-only delivery never reaches. The studio&rsquo;s
        ambisonic-driven WebXR audio path decodes the recorded sound
        field through head-tracked HRTFs at playback; the
        per-source object audio (footsteps, Aura&rsquo;s voice, UI
        clicks) goes through the PannerNode directly.<sup>2</sup>
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/spatial-audio-explained"
          className="text-pink-200 underline underline-offset-4"
        >
          spatial audio for VR
        </a>
        ,{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        ,{" "}
        <a
          href="/codex/virtual-reality"
          className="text-pink-200 underline underline-offset-4"
        >
          virtual reality
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Head-related_transfer_function"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Head-related transfer function
          </a>
          .
        </li>
        <li>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/panningModel"
            className="text-pink-200 underline underline-offset-4"
          >
            MDN: PannerNode.panningModel
          </a>
          .
        </li>
        <li>
          <a
            href="https://sound.media.mit.edu/resources/KEMAR.html"
            className="text-pink-200 underline underline-offset-4"
          >
            MIT Media Lab: KEMAR HRTF measurements
          </a>{" "}
          &mdash; the generic dataset Web Audio implementations use.
        </li>
        <li>
          <a
            href="https://valvesoftware.github.io/steam-audio/"
            className="text-pink-200 underline underline-offset-4"
          >
            Valve Steam Audio
          </a>{" "}
          &mdash; the studio&rsquo;s reach for higher-grade HRTF
          spatialisation in installation work.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The HRTF is individual: the exact ear shape, head diameter,
          and torso reflection pattern differ per person, and a
          well-measured personal HRTF localises better than the
          generic dataset every browser ships. Personalised HRTF
          datasets are commercially available (Genelec, Sony 360
          Reality Audio, the Apple AirPods Pro auto-personalisation
          flow); the studio uses the generic dataset as the floor and
          flags the upgrade path for installation commissions.
        </li>
        <li>
          The convolution itself is small &mdash; a pair of FIR
          filters a few hundred taps long &mdash; but it has to be
          interpolated between adjacent measured directions as the
          source moves, and the interpolation is where bad HRTF
          implementations smear localisation. The Web Audio
          implementation in Chromium handles this competently; in
          Safari the localisation is noticeably less stable
          historically and the studio&rsquo;s installation pipeline
          drops back to Steam Audio for any work that needs the
          higher floor.
        </li>
      </ol>
    </>
  );
}
