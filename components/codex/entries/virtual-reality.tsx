export default function VirtualReality() {
  return (
    <>
      <p>
        Virtual reality is the technique of placing a person inside a
        computer-generated environment so convincingly that they will,
        given enough time, walk into the coffee table they were
        standing next to in the real room.<sup>1</sup>
      </p>
      <p>
        The minimum apparatus is a head-mounted display (HMD) &mdash; a
        stereoscopic screen close enough to the eyes that it fills the
        field of view, paired with head-tracking sensors fast enough
        that the rendered scene moves when the head does. The maximum
        apparatus involves haptic gloves, omnidirectional treadmills,
        scent generators, and at least one venture capitalist.
      </p>
      <p>
        A working definition: VR is the immersive technology in which
        the real world is not visible at all. Everything the user sees
        is rendered. This is the criterion that distinguishes it from
        augmented and mixed reality, both of which keep some of the
        room.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        A very brief history
      </h2>
      <p>
        The earliest VR-shaped device was Morton Heilig&rsquo;s{" "}
        <em>Sensorama</em> (1962), a mechanical arcade booth that
        combined stereoscopic 3D film, smell, fans, and a vibrating
        seat to simulate a motorcycle ride through Brooklyn.
        <sup>2</sup> Ivan Sutherland&rsquo;s <em>Sword of Damocles</em>{" "}
        (1968) &mdash; a head-tracked stereoscopic display so heavy it
        had to be suspended from the ceiling &mdash; established the
        technical pattern that all subsequent HMDs would follow, minus
        the ceiling. The 1990s wave (Sega VR, Virtuality arcades,
        Nintendo&rsquo;s Virtual Boy) collapsed quickly, partly
        because the displays gave most users a headache within twenty
        minutes. The 2010s wave (Oculus Rift, HTC Vive, eventually the
        Meta Quest) succeeded because cheap smartphone-grade screens
        and IMUs had finally caught the headache problem mid-fall.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        What VR is currently used for
      </h2>
      <p>Industries, in roughly descending order of money spent:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li><strong>Games.</strong> Always games.</li>
        <li><strong>Architectural visualisation.</strong> Walk through the building before it&rsquo;s built.</li>
        <li><strong>Training simulation.</strong> Pilots, surgeons, oil-rig technicians, customer-service representatives whose customers are particularly difficult.</li>
        <li><strong>Therapy and exposure treatment.</strong> Phobias, PTSD, certain forms of anxiety.</li>
        <li><strong>Immersive film and 360° video.</strong> The current state of which is best described as &ldquo;earnest, ongoing, occasionally brilliant.&rdquo;</li>
        <li><strong>The metaverse.</strong> Whatever that is this week.</li>
      </ul>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">For the studio</h2>
      <p>
        The studio captures 360° video &mdash; using the DJI Avata
        360&rsquo;s integrated 8K head, or a tripod-mounted consumer
        360 camera &mdash; which is then delivered as VR content via
        headset. The capture is genuine 360°; the playback medium is a
        VR HMD or any browser that supports the WebXR spec. The
        pipeline from capture to immersive playback is short, mature,
        and reasonably reliable.
      </p>
      <p>
        The waveguide objects the studio produces are not VR in the
        strict sense. They live in physical space and require no
        headset. They are mentioned here only to forestall the
        inevitable email asking whether they are.<sup>3</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          This phenomenon, known formally as &ldquo;presence&rdquo; and
          informally as &ldquo;the coffee-table problem,&rdquo; is
          considered a marker of high-quality VR by researchers and a
          marker of low-quality VR by anyone who has ever had to
          apologise to their coffee table.
        </li>
        <li>
          The Sensorama was, for the avoidance of doubt, not
          commercially successful. Heilig had built it as a proof of
          concept for a much grander vision of immersive cinema, which
          he then spent the rest of his life failing to find funding
          for. There is a moral here, but it does not flatter the
          entertainment industry.
        </li>
        <li>The answer is no.</li>
      </ol>
    </>
  );
}
