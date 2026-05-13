export default function SpatialAudioExplained() {
  return (
    <>
      <p>
        Spatial audio is the audio counterpart of 360° video: sound
        that changes as the listener&rsquo;s head turns, so that the
        cup that fell off the shelf behind you continues to sound like
        it fell off the shelf behind you, even as you turn your head
        to look at it.
      </p>
      <p>
        The bait is presence. Add directional sound to a 360° image
        and the brain commits to the scene at a level visual fidelity
        alone never reaches.<sup>1</sup> Take it away &mdash; leave a
        360° video with mono soundtrack panned arbitrarily across
        stereo headphones &mdash; and the image collapses back into a
        screen. The ears are quietly running the room.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        How it works (the short version)
      </h2>
      <p>
        The technique formalised for VR is{" "}
        <strong>ambisonics</strong>. A first-order ambisonic recording
        captures four channels representing the sound field at a
        single point in space: one omnidirectional (W) and three
        directional (X, Y, Z). At playback, a renderer combines those
        channels with the listener&rsquo;s head orientation and a pair
        of <strong>head-related transfer functions (HRTFs)</strong>{" "}
        &mdash; mathematical filters that approximate the way an outer
        ear and a head reshape sound on its way to each eardrum
        &mdash; and produces a stereo output that preserves direction.
      </p>
      <p>
        Higher orders (second, third, seventh) capture finer spatial
        resolution at the cost of more channels.<sup>2</sup> Most
        consumer VR delivery remains first-order. Most cinematic VR
        delivery is second- or third-order ambisonics, sometimes
        combined with <strong>object-based audio</strong> (specific
        sources placed in 3D space as positional metadata rather than
        baked into the ambisonic field).
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The 2017 tool landscape, audited
      </h2>
      <p>
        The author&rsquo;s 2017 list reviewed eight platforms and
        plugins. The 2026 audit:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>YouTube spatial audio.</strong> Still alive.
          First-order ambisonics via the spatial-audio metadata flag.
          Still the default delivery path for hobbyist 360° content.
        </li>
        <li>
          <strong>Facebook 360 Spatial Workstation.</strong> Dead. Meta
          discontinued it around 2020 as part of its broader retreat
          from 360° video. The successor lineage is{" "}
          <strong>Meta XR Audio SDK</strong> for the Quest and{" "}
          <strong>Reality Composer Pro</strong> for visionOS.
        </li>
        <li>
          <strong>Google VR Audio System (Resonance Audio).</strong> In
          limbo. Google open-sourced Resonance Audio in 2018 and
          stopped maintaining it shortly after. The code still works;
          nobody is fixing the bugs.
        </li>
        <li><strong>Samsung VR.</strong> Dead.</li>
        <li>
          <strong>VeeR VR.</strong> Alive, less central than it was.
          Still a valid spatial-audio delivery target.
        </li>
        <li>
          <strong>Adobe Premiere Pro.</strong> Still alive and
          improved. VR-360 audio tooling is mature.
        </li>
        <li>
          <strong>G&rsquo;Audio.</strong> Alive, focused now on
          broadcast and gaming object-based audio.
        </li>
        <li>
          <strong>Steam Audio.</strong> Alive. Now part of
          Valve&rsquo;s standard distribution. Free. Excellent for
          game-engine work.
        </li>
        <li>
          <strong>Avid Pro Tools Ultimate.</strong> Alive. The licence
          remains stiff.
        </li>
        <li>
          <strong>Ambisonic Toolkit (ATK).</strong> Alive and
          excellent. Free. Works in Reaper, SuperCollider, and any
          host that accepts JSFX or VST3. The studio&rsquo;s current
          default for non-game ambisonic mixing.
        </li>
      </ul>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The modern pipeline
      </h2>
      <ol className="ml-6 list-decimal space-y-3">
        <li>
          <strong>Capture.</strong> A first-order ambisonic microphone
          (Sennheiser Ambeo VR, Zoom H3-VR, R&Oslash;DE NT-SF1)
          records four channels in A-format. The recorder converts to
          B-format on-board or after.
        </li>
        <li>
          <strong>DAW.</strong> Reaper with ATK installed, or Pro
          Tools Ultimate. Premiere Pro for video-led projects. Logic
          Pro for music-led projects.
        </li>
        <li>
          <strong>Place objects.</strong> Dialogue, foley, music stems
          get assigned positions in 3D space. The DAW shows their
          movement against the 360° video preview.
        </li>
        <li>
          <strong>Render.</strong> Output is a first- or third-order
          ambisonic file muxed with the video; YouTube and the major
          VR platforms accept it directly.
        </li>
      </ol>
      <p>
        For installation work, where the listener moves within a
        physical room, the studio drops down to Steam Audio or a Unity
        build, which both render the ambisonic field in real time
        against the listener&rsquo;s tracked position.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        What hasn&rsquo;t changed
      </h2>
      <p>
        The principle. A spatial-audio mix that lies about direction
        is worse than no spatial-audio mix at all &mdash; it actively
        breaks the viewer&rsquo;s sense of place. Get the directions
        right; the rest follows.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The audio engineers have been quietly insisting on this
          since roughly the invention of the soundtrack, and have,
          broadly, been correct. The visual people periodically
          rediscover the fact and write white papers about it.
        </li>
        <li>
          The seventh-order ambisonic format requires 64 channels and
          is mostly the province of academic acousticians, immersive
          concert installations, and people who have been issued a
          budget they have yet to find a use for.
        </li>
      </ol>
    </>
  );
}
