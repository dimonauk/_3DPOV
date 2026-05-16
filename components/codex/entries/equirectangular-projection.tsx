export default function EquirectangularProjection() {
  return (
    <>
      <p>
        Equirectangular projection maps a sphere onto a rectangle by
        treating longitude as the horizontal axis and latitude as the
        vertical axis. The seam wraps around at &plusmn;180&deg;, the
        poles stretch to fill the top and bottom edges, and every
        point on the sphere lands at a single point on the rectangle.
        It is the projection every 360 camera writes to disk because
        it is the only common one a video codec can compress
        line-by-line.<sup>1</sup>
      </p>
      <p>
        The math underneath is two simple substitutions. A unit
        direction vector{" "}
        <code className="font-mono text-chrome-200">(x, y, z)</code>{" "}
        becomes a longitude{" "}
        <code className="font-mono text-chrome-200">
          &phi; = atan2(z, x)
        </code>{" "}
        and a latitude{" "}
        <code className="font-mono text-chrome-200">&theta; = asin(y)</code>
        ; the pixel coordinate is{" "}
        <code className="font-mono text-chrome-200">
          (u, v) = ((&phi; + &pi;) / 2&pi;, (&pi;/2 &minus; &theta;) /
          &pi;)
        </code>
        . Going the other way is the same substitution in reverse.
        Both directions cost a handful of trig functions per pixel,
        which is why the projection survived from sixteenth-century
        cartography into modern GPU shaders unchanged.
      </p>
      <p>
        The cost is geometric distortion that varies with latitude. A
        square of pixels near the equator covers a small solid angle;
        a square of pixels near the poles covers a wide thin band.
        Anything that assumes uniform sample density &mdash; feature
        matching, optical flow, structure-from-motion &mdash; is
        wrong at the poles by a factor that goes to infinity. The
        studio&rsquo;s splat360 pipeline takes this seriously: the
        load-bearing decision is whether to give the splat trainer the
        equirect frame as-is (cheap, distortion in the data), the raw
        fisheye pair before stitching (honest k1..k4 lens model, no
        seam contamination), or a six-face pinhole cubemap reprojected
        from the equirect (universal, but six times the image count).
        Path selection lives at{" "}
        <code className="font-mono text-chrome-200">
          splat360.pipeline.camera_model
        </code>{" "}
        and is the difference between a clean splat and a splat with a
        visible stitch line down the middle.<sup>2</sup>
      </p>
      <p>
        For the studio&rsquo;s outdoor work this matters most around
        Avata 360 and Osmo 360 capture &mdash; both ship pre-stitched
        equirect MP4s through DJI&rsquo;s consumer pipeline by
        default, and both have a RAW pair-export mode that the
        first-party software treats as a developer feature. The pair
        export is what the engine prefers; the equirect is what it
        falls back to.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Marinus of Tyre is generally credited with the projection
          around 100 AD, which makes it the oldest still-active
          piece of geographic math in modern computer graphics. The
          modern name was attached by John Snyder for the United
          States Geological Survey in 1987.
        </li>
        <li>
          Mainline COLMAP, the SfM front-end most splat pipelines
          use, does not implement a SPHERICAL camera model. OpenMVG
          and hloc do. The Brush trainer takes COLMAP / PINHOLE
          input only; gsplat will accept either. The choice of
          trainer feeds back into the camera-model decision.
        </li>
      </ol>
    </>
  );
}
