export default function OnnxRuntime() {
  return (
    <>
      <p>
        ONNX Runtime is a cross-platform inference engine for machine
        learning models that have been exported to the Open Neural
        Network Exchange format. The format itself is a portable
        graph description; the runtime is the C++/Python/JavaScript
        executor that reads the graph, picks an optimal execution
        backend (CPU, CUDA, DirectML, CoreML, WebGPU), and runs
        inference without the original training framework in sight.
        Train in PyTorch or TensorFlow, deploy through
        onnxruntime &mdash; that is the contract.<sup>1</sup>
      </p>
      <p>
        What makes it the studio&rsquo;s default deployment surface
        for ML models is the matrix of platform backends. The same{" "}
        <code className="font-mono text-chrome-200">.onnx</code> file
        runs on the studio bench&rsquo;s RTX 4090 through{" "}
        <code className="font-mono text-chrome-200">CUDAExecutionProvider</code>
        , on a workshop laptop through{" "}
        <code className="font-mono text-chrome-200">
          DmlExecutionProvider
        </code>
        , in a browser through{" "}
        <code className="font-mono text-chrome-200">onnxruntime-web</code>
        &rsquo;s WebGPU/WASM, and on iOS through CoreML &mdash; with no
        change to the model weights and minimal change to the call site.
        Quantising to FP16 typically halves the memory cost and
        roughly halves the latency on modern GPUs without measurable
        quality loss for vision-scale models.
      </p>
      <p>
        On the studio bench, ONNX Runtime is what runs Apple&rsquo;s
        SHARP gaussian-splat model. The pipeline at{" "}
        <code className="font-mono text-chrome-200">
          The_Hangar/engines/sharp-onnx/inference_onnx.py
        </code>{" "}
        loads the FP16-quantised graph, hands it a 1536&times;1536
        RGB image, and gets back the gaussian-splat tensors &mdash;
        positions, scales, rotations, opacities, the DC spherical
        harmonic colour term &mdash; for roughly 1.18 million
        gaussians. A second script rewrites the SHARP-native PLY into
        the standard INRIA-3DGS layout that Postshot, SuperSplat,
        Spark, and splat.js all accept. The cost: about ninety
        seconds per still on the RTX 4090, give or take, and the
        result is the splat that ends up at /research/cctv-3d-archive.
        SHARP&rsquo;s academic-only licence is the reason the
        archive lives on the research surface rather than on the
        commerce track.<sup>2</sup>
      </p>
      <p>
        The studio uses the same runtime in the browser for the
        Depth Anything V2 model that powers /photographs/spatial and
        for the on-device viseme classifier that drives Aura&rsquo;s
        lip-sync. Same file, three different deployment surfaces.
        That portability is the entire point.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          ONNX was originally developed by Facebook and Microsoft in
          2017 as a common interchange format between Caffe2 and
          CNTK; the runtime followed in 2018. The Linux Foundation
          adopted both into its AI &amp; Data foundation in 2020.
          Apache 2.0 throughout.
        </li>
        <li>
          Apple SHARP is{" "}
          <em>Spatial Harmonic Approximated Radiance Primitives</em>,
          presented at SIGGRAPH 2025. The released checkpoints carry
          an{" "}
          <code className="font-mono">apple-amlr</code> licence that
          restricts use to academic research; anything produced by
          the model inherits that licence and cannot enter the
          studio&rsquo;s commerce track. The split is enforced by
          the{" "}
          <code className="font-mono">licence</code> field on every
          SplatRecord in the media library.
        </li>
      </ol>
    </>
  );
}
