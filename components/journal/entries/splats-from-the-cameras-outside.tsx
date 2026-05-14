const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function SplatsFromTheCamerasOutside() {
  return (
    <>
      <p>
        Ninety stills lifted from public CCTV feeds across London &mdash;
        Battersea Power Station, Borough Market, Burlington Arcade, the
        Wellington Arch on the corner of Hyde Park, the camera that
        points at the doors of Neal&rsquo;s Yard &mdash; went into the
        studio bench this afternoon as 352-by-288-pixel JPEGs and came
        out the other side as one-point-one-eight million Gaussian
        splats apiece. The model that did it is Apple&rsquo;s SHARP,{" "}
        <sup>1</sup> running on the studio&rsquo;s RTX 3080 Ti through
        ONNX, taking roughly ten seconds per frame. The output sits
        next to each JPEG on disk as a sibling <code>.ply</code> file
        about sixty-three megabytes wide. The collection is a study of
        what a city looks like when it sees itself through its own
        infrastructure.
      </p>
      <p>
        The model itself weighs one-point-three gigabytes and behaves
        like every other large ONNX I have wrestled onto a Windows box
        this year: an opinionated chain of CUDA, cuDNN, cuBLAS and the
        Microsoft C++ runtime that all have to find each other before
        the first tensor moves. The studio&rsquo;s anaconda base has
        the right onnxruntime build (the one whose execution-provider
        list includes <code>CUDAExecutionProvider</code>), and the
        loader in <code>batch_cctv.py</code> stitches the system CUDA
        12.8 toolkit and the pip <code>nvidia-cudnn-cu12</code> wheels
        into the same DLL search path before <code>onnxruntime</code>
        is imported. Once those resolve, the model loads in about three
        seconds, holds the session warm, and every subsequent frame is
        the ten-second number.
      </p>
      <p>
        The part that took longer than the inference was the licence
        reading. SHARP&rsquo;s licence is <code>apple-amlr</code>{" "}
        &mdash; Apple Machine Learning Research, academic and
        non-commercial. The outputs are not safe for the part of the
        site where money moves. That is not a footnote; it is a
        structural decision about where this work lives. The studio
        runs three splat tracks now, in parallel: SHARP for the
        research archive (fast, licence-bound, the bench&rsquo;s
        notebook in public), commercial-friendly trainers like
        Postshot or Luma for editioned pieces, and the studio&rsquo;s
        own POV-rig capture for original IP it owns outright. The
        licence travels with every record. The commerce filter reads
        the licence and decides whether the record can stand under a
        buy button. The CCTV splats are good for looking and good for
        thinking about; they will never be good for selling, and the
        site is wired so they could not be sold by accident even if
        someone (me, at three in the morning) forgot which track they
        belonged to.
      </p>
      <p>
        The first run of the batch produced twenty good splats and
        sixty-nine identical failures. Every failure was the same
        line: <code>CUDA failure 700: an illegal memory access was
        encountered</code>. This is a thing CUDA does once and then
        refuses to recover from on the same context. The InferenceSession
        I had so carefully loaded once and reused for every frame was
        the entire problem &mdash; one bad allocation poisoned the
        session, and every subsequent <code>session.run</code> failed
        instantly with the same error. The fast batch had become a
        cascade. Twenty-six minutes of empty failures, all of them
        finishing at sub-half-second &ldquo;FAIL&rdquo; lines because
        the work the session was meant to do was no longer reaching
        the GPU at all. The fix was three lines: catch the failure,
        delete the session, build a new one, carry on. Costs three
        seconds per recovery. Turns a cascade back into a per-frame
        loss.
      </p>
      <p>
        The other small problem was the file format. SHARP&rsquo;s{" "}
        <code>.ply</code> is a <em>superset</em> of the standard 3D
        Gaussian Splat PLY <sup>2</sup> &mdash; same vertex block (x,
        y, z, the three DC spherical-harmonic colour coefficients,
        opacity, three log-space scales, the four rotation quaternion
        components), but with seven extra non-vertex elements appended
        after the vertex data: <code>extrinsic</code>,{" "}
        <code>intrinsic</code>, <code>image_size</code>,{" "}
        <code>frame</code>, <code>disparity</code>,{" "}
        <code>color_space</code>, <code>version</code>. Apple&rsquo;s
        own viewer reads them. Every other splat viewer in the world
        chokes on them. The converter that fixes this is fifty lines
        of Python: read SHARP&rsquo;s header, take the vertex block,
        pad the missing higher-order spherical-harmonic coefficients
        with zeros (SHARP only emits the DC term, no view-dependent
        shading), write a clean standard PLY. The output is
        four-point-four times larger on disk &mdash; two hundred
        seventy-nine megabytes per frame instead of sixty-three,
        because the f_rest_0 through f_rest_44 padding adds a hundred
        eighty bytes per gaussian &mdash; but it loads cleanly in
        Postshot, in SuperSplat, in Spark, in <code>splat.js</code>,
        and in anything else that follows the conventions the field
        agreed on a couple of years ago.
      </p>
      <p>
        What I have at the end of the afternoon is ninety
        one-point-one-eight-million-gaussian splats of London under
        institutional gaze, each one taking the camera&rsquo;s
        viewpoint and lifting it into three dimensions. The depths
        come back surprisingly well from a single 352-by-288-pixel
        frame &mdash; the SHARP outputs reach about a hundred
        normalised units into the scene for the wider shots, much less
        for the close ones. The Wellington Arch one in particular
        looks like the camera flew slowly forward through the
        archway. The Battersea Power Station one looks like a wedge
        of the building was lifted out and rotated on its end. The
        Burlington Arcade one is mostly ceiling, because the camera
        is mostly ceiling. The Battersea one is the only one I have
        spent any real time inside; the others I will go through
        tomorrow. There is a public viewer surface coming for them at{" "}
        <code>/research</code>, where they belong; until that is wired
        properly they live in the archive on disk. Now I am going to
        put the laptop down and let the rest of the batch run.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          SHARP is Apple&rsquo;s single-image gaussian-splatting model
          from the <code>ml-sharp</code> research release. The ONNX
          export I am running on the bench is{" "}
          <a
            href="https://huggingface.co/pearsonkyle/Sharp-onnx"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pearsonkyle/Sharp-onnx{arrow}
          </a>{" "}
          on Hugging Face, which carries the original{" "}
          <code>apple-amlr</code> terms forward &mdash; the Apple
          Machine Learning Research Licence, academic and
          non-commercial. The model card on the Hugging Face page has
          the full text and the source paper link.
        </li>
        <li>
          The standard 3D Gaussian Splat PLY layout is the one
          published with the original INRIA paper,{" "}
          <a
            href="https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            3D Gaussian Splatting for Real-Time Radiance Field Rendering{arrow}
          </a>
          . Every web-side splat viewer expects this layout: a single{" "}
          <code>vertex</code> element with sixty-two float properties
          per gaussian and nothing trailing after it. The fact that
          this is the de-facto standard, rather than a written one, is
          part of why the SHARP variant is interesting and also why the
          rest of the field rejects it.
        </li>
      </ol>
    </>
  );
}
