export default function OnePressThreeSixtyCapture() {
  return (
    <>
      <p>
        Between 2017 and 2026, the consumer 360° camera went from
        &ldquo;rough prototype with a stitching problem&rdquo; to
        &ldquo;good enough that the studio uses one without
        apology.&rdquo; The Microsoft ICE workflow the studio used to
        teach &mdash; capture forty frames on a DSLR with panohead,
        stitch in software, manually add GPano metadata via ExifTool
        &mdash; is no longer the entry point. It is now a specialist
        workflow for specialist outcomes.
      </p>
      <p>
        The 2026 entry point is <strong>one button</strong>.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">The cameras</h2>
      <p>The current consumer / prosumer 360° cameras worth knowing:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Insta360 X4 / X5.</strong> 8K dual-fisheye,
          computational stitching on board. Strong stabilisation. Best
          for action / handheld.
        </li>
        <li>
          <strong>Ricoh Theta Z1.</strong> 1-inch sensors (dual),
          strong colour and dynamic range. Best for architectural and
          product 360°. The thinking person&rsquo;s Theta.
        </li>
        <li>
          <strong>GoPro Max 2.</strong> Hardware durability + GoPro
          ecosystem. Best for outdoor, action, wet.
        </li>
        <li>
          <strong>DJI Avata 360.</strong> FPV drone with an integrated
          8K 360° camera &mdash; twin 64MP 1/1.1&Prime; sensors, 200°
          lenses. The studio&rsquo;s choice for aerial 360°.
        </li>
        <li>
          <strong>Canon RF 5.2mm Dual Fisheye.</strong> Mounted on an
          EOS R-system body, this produces VR180 stereoscopic capture
          in one shot. Different beast &mdash; stereo VR rather than
          monoscopic 360° &mdash; but worth knowing if your end format
          is a VR180 deliverable.
        </li>
      </ul>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The pipeline (Insta360 / Ricoh / GoPro)
      </h2>
      <ol className="ml-6 list-decimal space-y-3">
        <li>
          <strong>Capture.</strong> Press the button. The camera
          records both fisheye feeds simultaneously and stitches
          in-camera (or stores the dual-fisheye source and stitches
          later, depending on settings).
        </li>
        <li>
          <strong>Transfer.</strong> USB-C, Wi-Fi, or SD card. The
          output is an equirectangular MP4 (video) or JPEG/RAW
          (stills) already in the right projection, with GPano
          metadata baked in.
        </li>
        <li>
          <strong>Edit.</strong> Use the manufacturer&rsquo;s desktop
          app for basic colour and trim (Insta360 Studio, Ricoh
          Theta+, GoPro Quik). For serious colour and grading, the
          equirectangular file imports directly into DaVinci Resolve,
          Premiere Pro, Final Cut Pro (each has its own VR/360
          plug-in).
        </li>
        <li>
          <strong>Reframe.</strong> Most consumer-camera workflows now
          expect 360° to be reframed into a 2D output for delivery
          &mdash; pick a &ldquo;lens&rdquo; through the 360° sphere
          over time, render as a normal 1080p / 4K video.
        </li>
        <li>
          <strong>Deliver as 360°.</strong> YouTube accepts the
          equirectangular MP4 directly. Same for Vimeo, Meta Quest TV,
          Apple Vision Pro&rsquo;s Immersive Video format (with
          conversion).
        </li>
      </ol>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        When to drop back to the manual workflow
      </h2>
      <p>
        There are still reasons to shoot panorama with a DSLR and a
        panohead:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Resolution above 8K.</strong> A 64MP camera × 48
          frames stitched in PTGui produces gigapixel panoramas. No
          consumer 360° camera is near.
        </li>
        <li>
          <strong>Dynamic range.</strong> Bracket each frame; merge
          HDR per frame; stitch. Consumer cameras don&rsquo;t bracket
          meaningfully.
        </li>
        <li>
          <strong>Exposure control.</strong> Full manual on a DSLR;
          locked. Consumer cameras commit to one automatic exposure
          across the sphere and fight you on it.
        </li>
      </ul>
      <p>
        For all of which: see{" "}
        <a
          href="/codex/ptgui-hugin-lightroom-stitching"
          className="text-pink-200 underline underline-offset-4"
        >
          Stitching in PTGui, Hugin &amp; Lightroom
        </a>
        .
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The metadata aside
      </h2>
      <p>
        In 2017 the studio&rsquo;s tutorial included a section on
        manually injecting <strong>GPano metadata</strong> with
        ExifTool, so that platforms would recognise an equirectangular
        JPEG as 360°. This step is no longer necessary for
        camera-stitched output (it is written at capture) or for PTGui
        output (it is written at export). It is still necessary for:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Images stitched in tools that don&rsquo;t write GPano (older
          Hugin builds, some image-editing exports).
        </li>
        <li>
          Images that were edited in tools that strip metadata (some
          Photoshop save paths, almost everything that runs in a
          browser).
        </li>
      </ul>
      <p>
        When the platform won&rsquo;t recognise your 360° as 360°, the
        answer is ExifTool. It still works. It is still being
        maintained.<sup>1</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          ExifTool, written and maintained by Phil Harvey since 2003,
          is the metadata-handling tool that the entire
          photographic-software industry quietly depends on. There is
          a moral here about infrastructure being held together by
          individual humans rather than by the institutions that
          profit from it.
        </li>
      </ol>
    </>
  );
}
