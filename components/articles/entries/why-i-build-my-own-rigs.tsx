export default function WhyIBuildMyOwnRigs() {
  return (
    <>
      <p>
        The first programmable rig I bought, around 2019, was a pixel
        poi from one of the established hobbyist brands. It was an
        extraordinary piece of kit by any reasonable measure. It
        survived being dropped. It read image files from an SD card. It
        synced to a wireless trigger. It would do thirty consecutive
        performances on a single charge. Tens of thousands of dancers
        around the world were using the same hardware in clubs and
        festivals, and it worked.
      </p>
      <p>For photographic light painting, it was wrong.</p>
      <p>
        The trade-off the commercial pixel poi makes is the trade-off
        any commercial flow-arts tool makes. Performance environments
        are unforgiving in physical ways &mdash; concrete floors, sweaty
        hands, the weight of a fast spin pulling on a tether.
        Performance environments are forgiving in image-quality ways
        &mdash; the camera is rarely on, the audience integrates the
        image with their eyes, fractional blur is invisible at distance
        and to memory. Durability beats sharpness, every time. That is
        the right tradeoff for the market the rigs are sold to.
      </p>
      <p>
        Photographic light painting is the opposite tradeoff. The
        camera is on. The audience is the photograph. Fractional blur
        is the entire object. Image quality matters more than anything
        else, including how well the rig survives a drop.
      </p>
      <p>
        When I started building, I gave up everything the commercial
        rigs were optimised for and bought everything they were not
        optimised for. The rigs on the studio bench cannot take a hard
        fall. They are not weatherproof. They will not run for thirty
        consecutive performances on a single charge. They will do one
        or two takes a night. What they will do &mdash; and what the
        commercial rigs cannot &mdash; is hold the image to a pixel at
        the speeds the arm sustains.
      </p>
      <p>
        The components are not exotic. A Teensy 3.1 microcontroller, a
        bank of TLC5927 16-channel constant-current LED drivers,
        addressable LEDs in a one-dimensional strip on a balanced
        chassis, a Hall-effect rotation sensor reading off a magnet at
        the pivot. The frame rate at 100 updates per revolution lands
        a photograph that does not require any cleanup in post. The
        image data goes into the rig before the performance; the rig
        writes the image into space; the camera reads the image off
        the air.
      </p>
      <p>
        The architectural choice is the only one that matters.
        Commercial rigs sync to time. Time-synced rigs drift, because
        the arm is not a clock &mdash; its speed varies through the
        revolution. The studio rigs sync to angle. The Hall sensor
        reads where the rig is, not when it is. At the angles where
        the arm slows, the rig draws fewer columns; at the angles
        where the arm speeds up, the rig draws more. The picture in
        the photograph is the picture programmed into the rig, not a
        stretched and compressed approximation of it.
      </p>
      <p>
        This is why I build them. Not as a flex. Because the
        off-the-shelf option produces a different photograph than the
        one I want to take, and the difference is unfixable in post.
        The picture has to be right when it leaves the rig.
      </p>
      <p>The studio sells the photographs. The rigs stay on the bench.</p>
    </>
  );
}
