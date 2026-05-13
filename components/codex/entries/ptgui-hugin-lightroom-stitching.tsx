export default function PtguiHuginLightroomStitching() {
  return (
    <>
      <p>
        Three tools currently cover the territory Kolor Autopano used
        to hold alone, each pitched at a different user.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        PTGui (the working professional&rsquo;s pick)
      </h2>
      <p>
        PTGui is the direct spiritual successor to Autopano. A
        commercial licence is &pound;119 for Personal use, &pound;319
        for Pro, with the Pro version adding HDR fusion, mask-based
        ghost removal, and 32-bit HDR output.<sup>1</sup> It supports
        the same SIFT-derived feature detection that Autopano used,
        plus modern improvements: GPU-accelerated control-point
        generation, viewpoint correction for tilted panoramas, and a
        genuinely workable manual control-point editor.
      </p>
      <p>
        For the working professional with a mid-2010s muscle memory
        for Autopano, PTGui is the smallest cognitive jump.
      </p>

      <h3 className="mt-8 mb-3 text-xl text-chrome-100">Workflow</h3>
      <ol className="ml-6 list-decimal space-y-2">
        <li>Drop the source frames onto the Project Assistant window.</li>
        <li>
          Click <em>Align images</em>. PTGui detects control points
          and proposes a layout.
        </li>
        <li>
          Inspect the panorama preview. If something is misaligned,
          open the <strong>Control Points</strong> tab and either edit
          or add by hand.
        </li>
        <li>Set the projection (Equirectangular for spherical 360°).</li>
        <li>
          Render with <strong>Create Panorama</strong>.
        </li>
      </ol>
      <p>
        For HDR brackets, PTGui Pro fuses them at the same step it
        stitches. For ghost removal (people moving through the scene
        mid-capture), the <strong>Mask</strong> panel lets you tell
        PTGui which frame to prefer for a given region.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Hugin (the open-source pick)
      </h2>
      <p>
        Hugin is free, open-source, and capable of essentially
        everything PTGui does, with a less polished interface and a
        steeper learning curve. If your panoramic photography is
        occasional, or you object to paid software on principle, Hugin
        will get you there.<sup>2</sup>
      </p>

      <h3 className="mt-8 mb-3 text-xl text-chrome-100">Workflow</h3>
      <ol className="ml-6 list-decimal space-y-2">
        <li><em>File &rarr; Open</em> the source images.</li>
        <li>Use <em>Identify Control Points</em> to auto-detect.</li>
        <li><em>Optimise</em> to refine.</li>
        <li>Preview, set projection, render.</li>
      </ol>
      <p>
        Hugin&rsquo;s documentation is comprehensive in the way that
        early-2000s open-source documentation tends to be &mdash;
        exhaustive, occasionally written by the developers in passive
        voice, ultimately educational.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Adobe Lightroom Classic (the everyone-already-has-it pick)
      </h2>
      <p>
        For modest panoramic work &mdash; a row of three to seven
        frames covering roughly 120° &mdash; Lightroom
        Classic&rsquo;s{" "}
        <strong>Photo &rarr; Photo Merge &rarr; Panorama</strong> does
        the job in one keystroke. It supports equirectangular
        projection (since the 2020 release) and accepts RAW inputs
        directly.
      </p>
      <p>
        It is not capable of full spherical 360° from many frames,
        will not do HDR fusion across brackets in the same step, and
        offers no manual control over the stitch. For
        wide-but-not-spherical landscape work, or as a first pass to
        see whether the source frames are even close to aligned, it is
        the fastest tool.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">Which to pick</h2>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>PTGui</strong> for full spherical 360° from DSLR
          captures, especially with HDR brackets. The studio&rsquo;s
          default.
        </li>
        <li><strong>Hugin</strong> if budget is the constraint.</li>
        <li>
          <strong>Lightroom</strong> for partial panoramas and quick
          checks.
        </li>
      </ul>
      <p>
        For consumer 360 camera output (Insta360, DJI, Ricoh, GoPro
        Max), none of these tools is necessary at the basic level
        &mdash; the camera stitches on board. See{" "}
        <a
          href="/codex/one-press-three-sixty-capture"
          className="text-pink-200 underline underline-offset-4"
        >
          One-press 360° capture
        </a>{" "}
        for that pipeline.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          All prices in this entry will be wrong by the time you read
          it. Software pricing trends one of two directions, and
          PTGui&rsquo;s licence fee has been trending one direction
          for fifteen years.
        </li>
        <li>
          A reasonable principle. The studio sympathises, while also
          having bought a PTGui licence.
        </li>
      </ol>
    </>
  );
}
