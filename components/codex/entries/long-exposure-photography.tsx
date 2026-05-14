export default function LongExposurePhotography() {
  return (
    <>
      <p>
        Long-exposure photography is the practice of leaving a
        camera&rsquo;s shutter open long enough that the resulting
        image integrates light across an extended period &mdash; anywhere
        from one second to several hours. Used since the earliest days
        of photography (the daguerreotype demanded exposures of fifteen
        minutes plus), the technique today serves three distinct ends:
      </p>
      <ol className="ml-6 list-decimal space-y-1">
        <li>Working at low light without artificial fill.</li>
        <li>
          Capturing motion blur as a creative effect &mdash; flowing
          water, star trails, the smoothing of crowds.
        </li>
        <li>
          Recording the trace of a moving light source against a still
          scene. This is light painting.
        </li>
      </ol>
      <p>
        For the third case &mdash; the studio&rsquo;s primary use
        &mdash; the technical considerations are:
      </p>
      <ul className="ml-6 list-disc space-y-1">
        <li>
          <strong>Aperture.</strong> f/8 to f/11 is the working range.
          Smaller apertures produce diffraction; larger apertures
          collect too much ambient light in the long exposure.
        </li>
        <li>
          <strong>ISO.</strong> As low as the sensor will go (ISO 50
          or 100). Noise accumulates over the exposure; a low ISO is
          the simplest defence.
        </li>
        <li>
          <strong>Shutter speed.</strong> From 5 seconds (for fast LED
          tools) to several minutes (for long kata). Often &ldquo;bulb&rdquo;
          mode &mdash; the shutter is held open manually until the
          gesture is complete.
        </li>
        <li>
          <strong>Focus.</strong> Manual, locked, set before the lights
          go down. A taped ring is not a bad habit.<sup>1</sup>
        </li>
        <li>
          <strong>White balance.</strong> Manual; auto-WB will fight the
          colour of the lights through the exposure.
        </li>
      </ul>
      <p>
        The challenge specific to long-exposure light painting is that
        ambient light &mdash; moonlight, streetlight, even strong
        starlight &mdash; will accumulate to wash the frame given enough
        exposure time. The studio&rsquo;s typical practice is to shoot
        in genuinely dark locations (rural fields, small hours), with
        the exposure tuned to the duration of the kata rather than to
        the brightness of the scene.
      </p>
      <p>
        For studio waveguide objects derived from photographs, the long
        exposure is the source data: every captured kata becomes the
        input geometry for a 3D-printed body.<sup>2</sup>
      </p>
      <p>
        See{" "}
        <strong>
          <a
            href="/codex/persistence-of-vision"
            className="text-pink-200 underline underline-offset-4"
          >
            Persistence of vision
          </a>
        </strong>{" "}
        for the optical underpinning, and{" "}
        <strong>
          <a
            href="/codex/pov-led-array"
            className="text-pink-200 underline underline-offset-4"
          >
            POV LED array
          </a>
        </strong>{" "}
        for the studio&rsquo;s drawing instrument.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The focus point is set in available light at the start of the
          session and then taped &mdash; with gaffer tape, not the
          sticker stuff &mdash; so that nothing the body does to the
          camera between exposures changes it. The kata produces no
          autofocus signal worth following.
        </li>
        <li>
          The captured frame is decomposed into a depth-aware mesh via
          the studio&rsquo;s 2D&rarr;3D pipeline (see{" "}
          <strong>
            <a
              href="/spatial"
              className="text-pink-200 underline underline-offset-4"
            >
              /spatial
            </a>
          </strong>
          ), or, at the editioned end, via Apple SHARP on the
          studio&rsquo;s local GPU. The depth field, not the
          photograph, is the printable object&rsquo;s genome.
        </li>
      </ol>
    </>
  );
}
