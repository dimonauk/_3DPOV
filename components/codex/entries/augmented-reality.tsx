export default function AugmentedReality() {
  return (
    <>
      <p>
        Augmented reality is the technique of overlaying computer-
        generated information on top of the user&rsquo;s view of the
        real world, so that the real world remains visible and the
        digital content appears to coexist with it. The user can still
        see the coffee table.<sup>1</sup>
      </p>
      <p>There are two broad approaches:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Optical see-through.</strong> The user looks through a
          transparent surface (a lens, a holographic combiner, a
          waveguide) and the digital overlay is projected onto it.
          Examples: Microsoft HoloLens (now end-of-life), Magic Leap,
          Xreal One Pro.<sup>2</sup>
        </li>
        <li>
          <strong>Video passthrough.</strong> The headset&rsquo;s
          cameras capture the real world and a screen inside the headset
          shows the camera feed plus the overlay. Examples: Meta Quest 3
          in passthrough mode, Apple Vision Pro.<sup>3</sup>
        </li>
      </ul>
      <p>
        Either approach has to solve three hard problems before the
        technology is useful for anything beyond party tricks:
      </p>
      <ol className="ml-6 list-decimal space-y-3">
        <li>
          <strong>Latency.</strong> The overlay has to move with the
          head. Anything over about 20 ms of motion-to-photon latency
          makes the digital content appear to swim &mdash; and once it
          swims, the brain stops believing it belongs in the room.
        </li>
        <li>
          <strong>Registration.</strong> Digital objects have to be
          anchored to physical locations. The headset has to understand
          the room well enough to know where the table is and where the
          table isn&rsquo;t.
        </li>
        <li>
          <strong>Display.</strong> Optical see-through has a brightness
          ceiling: the overlay is added to the real world, so a dim
          overlay washes out under sunlight. Video passthrough has a
          fidelity ceiling: the real world is now visible only as a 4K
          video of the real world, with all the colour fidelity and
          dynamic range losses that implies.
        </li>
      </ol>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Holo-Flow&rsquo;s use of AR
      </h2>
      <p>The studio flies drones FPV. The control pipeline is:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li>DJI Goggles (immersive video display, blocks the real world).</li>
        <li>RC 2 controller.</li>
        <li>InAir pod (head-tracking).</li>
        <li>
          <strong>Xreal One Pro AR glasses.</strong> These overlay the
          drone&rsquo;s live video feed onto the pilot&rsquo;s normal
          view of the airframe and the surrounding airspace.
        </li>
      </ul>
      <p>
        The point: while flying, the pilot can see the drone in the sky
        and the drone&rsquo;s own video feed at the same time. This is
        the practical form of AR &mdash; not Pok&eacute;mon Go, not
        virtual signage hovering over restaurants, but a working
        operator&rsquo;s instrument that adds a useful layer of
        information to a real, immediate physical task.<sup>4</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The taxonomy is contested
      </h2>
      <p>
        AR, MR, and &ldquo;spatial computing&rdquo; are partially
        overlapping marketing categories. Apple, for example, refuses
        to describe the Vision Pro as AR or MR or VR, preferring
        &ldquo;spatial computing&rdquo;; this is a deliberate positioning
        choice rather than a technical claim.<sup>5</sup> The
        studio&rsquo;s position is: use the term that names the thing
        accurately for the audience in front of you. For drone-pilot
        work, AR is correct. For sitting on the sofa watching a film
        inside a virtual cinema, VR is correct. For Apple&rsquo;s
        marketing department, &ldquo;spatial computing&rdquo; is
        correct in the strict sense that it is the term
        Apple&rsquo;s marketing department prefers.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The coffee table is, by deep tradition, the unit of
          measurement for the failure modes of immersive technology.
        </li>
        <li>
          Optical see-through AR has been the holy grail since
          approximately 1968 (Sword of Damocles, again), and remains
          stubbornly difficult to build small, light, bright, and
          accurate. Most of the visible decade in optical AR has been
          spent waiting for waveguide combiners to get just barely good
          enough that one of the inevitable annual demonstrations
          doesn&rsquo;t immediately collapse under criticism.
        </li>
        <li>
          Video passthrough is what enabled the Vision Pro to ship
          before optical see-through was ready. It is, in some senses,
          AR delivered inside a VR headset; in other senses, it is the
          only kind of AR that actually works well today.
        </li>
        <li>
          The first time the studio&rsquo;s pilot flew an Avata 360 FPV
          with the Xreal glasses overlaid on the real view, it took
          approximately three minutes to realise that this was, finally,
          what every PowerPoint slide about augmented reality from 2012
          to 2024 had been promising. The rest of the flight was
          conducted in a state of mild euphoria.
        </li>
        <li>
          Apple Developer Guidelines for visionOS, at time of writing,
          ask developers to call their applications &ldquo;spatial
          computing experiences&rdquo; or &ldquo;vision apps&rdquo; and
          to avoid the words &ldquo;augmented reality&rdquo; and
          &ldquo;mixed reality.&rdquo; This is presented as a branding
          decision. Whether it survives the next decade is, as the
          academic phrase goes, an exercise left to the reader.
        </li>
      </ol>
    </>
  );
}
