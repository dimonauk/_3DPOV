export default function ThreeSixtyPhotography() {
  return (
    <>
      <p>
        Three-hundred-and-sixty-degree photography is the practice of
        recording a complete sphere of light around a single point in
        space and then unfolding that sphere onto a flat rectangle for
        storage, transmission, and the eventual confusion of map-makers
        everywhere.<sup>1</sup>
      </p>
      <p>
        In principle, the camera looks in every direction at once. In
        practice, no single lens has yet been built that can see behind
        itself; the trick is achieved either by stitching together many
        frames taken from a tripod-mounted DSLR (the patient method) or
        by using a camera with two fisheye lenses pointed back-to-back,
        each photographing slightly more than a hemisphere, and letting
        the software argue about the overlap (the modern method).
        <sup>2</sup>
      </p>
      <p>
        The output of either approach is an{" "}
        <strong>equirectangular projection</strong> &mdash; a rectangle,
        twice as wide as it is tall, in which the equator is undistorted
        and everything at the poles is stretched out to absurd width. The
        sky becomes a band of horizontal sweep; the photographer,
        captured in the nadir because there is genuinely nowhere they
        could have stood that wasn&rsquo;t in the picture, becomes a
        stilt-legged ghoul at the bottom of the frame.<sup>3</sup> The
        patch immediately under the tripod is, by convention, either
        painted out, replaced with a small logo, or simply accepted.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        How a panorama is made (the patient method)
      </h2>
      <p>
        The conventional workflow, refined into the studio&rsquo;s own
        bootcamp some years ago<sup>4</sup> and updated here for current
        kit:
      </p>
      <ol className="ml-6 list-decimal space-y-3">
        <li>
          <strong>Tripod, panohead.</strong> A panohead rotates the
          camera around the optical centre of the lens &mdash; not, as
          instinct suggests, around the camera&rsquo;s body. Without
          one, parallax destroys the stitch. With one, parallax stays
          put and the software has a chance.
        </li>
        <li>
          <strong>Aperture f/11, ISO at the sensor&rsquo;s floor (50 or 100), white balance set manually and locked.</strong>{" "}
          Auto-anything will fight you across forty-seven exposures and
          lose.
        </li>
        <li>
          <strong>Meter the shot.</strong> Average shutter speed across
          the brightest and darkest parts of the scene; set it manually
          and don&rsquo;t change it.
        </li>
        <li>
          <strong>Shoot in a deliberate sequence.</strong> Start
          pointing down, tilt up in steps with at least a third overlap,
          repeat around a full rotation. Remove from tripod, shoot
          straight down for the nadir.
        </li>
        <li>
          <strong>Stitch in PTGui or Hugin</strong>, depending on your
          current allegiance.<sup>5</sup>
        </li>
      </ol>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        How a panorama is made (the modern method)
      </h2>
      <p>
        Buy a consumer 360 camera &mdash; an Insta360 X4, a Ricoh Theta
        Z1, a GoPro Max 2, the integrated 8K dual-fisheye head on a DJI
        Avata 360 &mdash; and press the button. The two fisheye lenses
        each see slightly more than a hemisphere; the camera&rsquo;s
        onboard processor stitches them into equirectangular output
        before you&rsquo;ve put your finger down. The seam is, depending
        on the camera, somewhere between invisible and a faint vertical
        ghost down both sides of the frame.
      </p>
      <p>
        This method trades absolute control for speed. For VR delivery,
        video work, and most contemporary commission practice it is now
        the default.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The selfie-presence problem
      </h2>
      <p>
        A 360° photograph captures the photographer. There is no
        behind-the-camera to retreat to. The traditional solution
        &mdash; hide behind the tripod and clone-stamp yourself out in
        post &mdash; works only badly, because the photographer is the
        warmest, sharpest, most centred object in the frame at the
        moment of capture.
      </p>
      <p>Practitioners typically choose one of three resignations:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Embrace it.</strong> Put the photographer in the
          picture as part of the document.
        </li>
        <li>
          <strong>Disappear.</strong> Set a timer, walk a thousand
          metres, wait, return.
        </li>
        <li>
          <strong>Pretend.</strong> Stand behind the tripod, blend,
          accept the ghost.
        </li>
      </ul>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Equirectangular projection &mdash; a brief warning
      </h2>
      <p>
        The equirectangular projection compresses a sphere onto a
        rectangle by stretching the poles. It is the Mercator
        projection&rsquo;s evening-class cousin. A subject walking into
        the frame from low in the original sphere will appear, in the
        equirectangular file, to be sliding into the picture from a
        forty-foot stretched-noodle direction. Software (PTGui, modern
        Premiere with VR plugins, DaVinci Resolve with its 360 toolset)
        lets you preview the sphere as a normal-looking square frame
        from any viewpoint, which is essential for keeping one&rsquo;s
        sanity through editing.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The astronomers, who have to think about this all the time,
          are profoundly unimpressed by photographers&rsquo;
          rediscovery of the problem every few years.
        </li>
        <li>
          In the early days &mdash; by which is meant about 2014
          &mdash; there were also rigs that strapped six or twelve
          GoPros to a 3D-printed cage, capturing twelve simultaneous
          frames and stitching them over what could legitimately be
          called a long weekend. These persisted in professional VR
          work for several years and are now largely confined to
          museums, both literal and figurative.
        </li>
        <li>
          The studio has, on at least one occasion, spent forty minutes
          attempting to remove the photographer from a 360° nadir patch
          in central Manchester and emerged with a tripod-shaped
          silhouette that, viewed from inside a VR headset, resembled
          nothing so much as a small ritual circle.
        </li>
        <li>
          Specifically, in November 2017, when the author published a
          more exhaustive walkthrough of the same workflow for VeeR VR.
          The pro tips above are descended from those.
        </li>
        <li>
          Kolor Autopano, which featured in the studio&rsquo;s earlier
          published tutorials on this subject, was bought by GoPro in
          2015 and shut down in 2018. The studio still mourns it on
          alternate Wednesdays. PTGui survives, costs money, and is
          excellent. Hugin survives, costs nothing, and is excellent if
          you read the manual, which approximately one in fifteen users
          does.
        </li>
      </ol>
    </>
  );
}
