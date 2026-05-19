export default function DepthAnythingV2() {
  return (
    <>
      <p>
        Depth Anything V2 is a 2024 monocular depth-estimation model
        from the University of Hong Kong &amp; TikTok, trained on a
        62-million-image synthetic-and-real mix. It produces relative
        depth maps from a single 2D photograph that are robust enough
        to drive parallax-warp stereo reconstruction in real time on a
        modern phone GPU.<sup>1</sup>
      </p>
      <p>
        The studio uses Depth Anything V2 as the{" "}
        <strong>free in-browser path</strong> for the{" "}
        <strong>
          <a
            href="/spatial"
            className="text-pink-200 underline underline-offset-4"
          >
            /spatial
          </a>
        </strong>{" "}
        and{" "}
        <strong>
          <a
            href="/spatial/video"
            className="text-pink-200 underline underline-offset-4"
          >
            /spatial/video
          </a>
        </strong>{" "}
        services. The model runs entirely client-side via WebGPU on
        iPhone 15 Pro / Pixel 8 Pro / Android Chrome 113+ / any
        WebGPU-capable browser. The user&rsquo;s GPU does the
        inference; no server cost.
      </p>
      <p>
        What it does well, what it does less well:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Well:</strong> outdoor scenes, architectural
          interiors, portraits with clean backgrounds, paintings,
          flat-shaded illustration. Relative depth ordering is
          consistent across the scene.
        </li>
        <li>
          <strong>Less well:</strong> long-exposure light-painting
          photographs where most of the scene is dark. The model
          assumes Lambertian surfaces; light trails with no
          surrounding context confuse it. The studio mitigates this in
          the{" "}
          <code className="font-mono text-chrome-200">
            viz.depth-estimation
          </code>{" "}
          capability by pre-conditioning the input (lift the dark
          regions, then run depth, then mask out the
          hallucinated-depth pixels).
        </li>
      </ul>
      <p>
        <strong>Licence:</strong> Apache 2.0. Free for commercial use,
        no attribution required in product output (but the studio
        attributes it on this page because it&rsquo;s the right thing
        to do). The model weights are hosted on Hugging Face and load
        directly into the user&rsquo;s browser via{" "}
        <code className="font-mono text-chrome-200">
          @huggingface/transformers
        </code>{" "}
        + ONNX Runtime Web.
      </p>
      <p>
        The architecture diagram for the full free-tier 2D-to-stereo
        pipeline:
      </p>
      <ol className="ml-6 list-decimal space-y-2">
        <li>
          User uploads a flat photo in the browser.
        </li>
        <li>
          Depth Anything V2 (transformers.js, WebGPU) → depth map.
        </li>
        <li>
          Parallax-warp shader (Three.js) → left and right views.
        </li>
        <li>
          USDZ packer or side-by-side MP4 stitcher → downloadable
          stereo file.
        </li>
      </ol>
      <p>
        For the premium commission path see{" "}
        <strong>
          <a
            href="/codex/apple-sharp"
            className="text-pink-200 underline underline-offset-4"
          >
            Apple SHARP
          </a>
        </strong>
        . Same input, more demanding model, runs on the studio bench,
        bookable as a commission.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Yang et al.,{" "}
          <em>Depth Anything V2</em>, arXiv:2406.09414, June 2024.
          Repository at{" "}
          <a
            href="https://github.com/DepthAnything/Depth-Anything-V2"
            className="text-pink-200 underline underline-offset-4"
          >
            DepthAnything/Depth-Anything-V2
          </a>
          .
        </li>
        <li>
          The premium path uses SHARP&rsquo;s hierarchical
          reconstruction; the free path uses a single-pass parallax
          warp. The visible difference: SHARP fills in what was
          behind the foreground; the free path leaves a soft halo. For
          Vision Pro headset viewing the SHARP output is materially
          better; for a Quest 3 SBS playback the free path is
          frequently fine.
        </li>
      </ol>
    </>
  );
}
