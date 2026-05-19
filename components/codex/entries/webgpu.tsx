export default function WebGpu() {
  return (
    <>
      <p>
        WebGPU is the browser API that succeeds WebGL2 as the standard
        path to the user&rsquo;s graphics processor. Where WebGL was
        a thin web wrapper over OpenGL ES, WebGPU is a fresh design
        modelled on the modern native APIs (Metal, Vulkan, Direct3D
        12). It exposes compute shaders as first-class citizens,
        cleanly separates pipeline state from draw calls, and lets the
        engine record command buffers and submit them in batches
        rather than chattering one call at a time. The entry point is{" "}
        <code className="font-mono text-chrome-200">navigator.gpu</code>
        ; the format is the W3C&rsquo;s WGSL.<sup>1</sup>
      </p>
      <p>
        The compute-shader story is the largest practical change.
        WebGL2 could only run shaders inside the graphics pipeline,
        which meant any general-purpose GPU work (image processing,
        physics simulation, ML inference) had to be smuggled in
        through a rasterisation hack. WebGPU runs compute kernels
        directly, with workgroup-shared memory and atomics, which is
        why ONNX Runtime Web, Transformers.js, and the studio&rsquo;s
        in-browser Depth Anything V2 path are practical at all.
      </p>
      <p>
        Browser status as of 2026: Chromium shipped WebGPU stable in
        2023 (Chrome 113); Safari shipped it in 2024 alongside
        visionOS 2; Firefox is on by default behind a flag and moving
        through Gecko&rsquo;s longer release cycle. The studio&rsquo;s
        standing rule is WebGPU + TSL first, with WebGL2 as the
        honest fallback &mdash; which Three.js&rsquo;s TSL graphs
        deliver from the same source. The fallback path is not
        decorative; the studio still hits real devices (older iPads,
        forgotten Android phones, the WebKit on certain enterprise
        Macs) where WebGPU is unavailable and the WebGL2 build is
        what ships.<sup>2</sup>
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/tsl-three-shading-language"
          className="text-pink-200 underline underline-offset-4"
        >
          TSL
        </a>
        ,{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        ,{" "}
        <a
          href="/codex/onnx-runtime"
          className="text-pink-200 underline underline-offset-4"
        >
          ONNX Runtime
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://www.w3.org/TR/webgpu/"
            className="text-pink-200 underline underline-offset-4"
          >
            WebGPU specification
          </a>{" "}
          (W3C).
        </li>
        <li>
          <a
            href="https://www.w3.org/TR/WGSL/"
            className="text-pink-200 underline underline-offset-4"
          >
            WGSL specification
          </a>
          .
        </li>
        <li>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API"
            className="text-pink-200 underline underline-offset-4"
          >
            MDN: WebGPU API
          </a>
          .
        </li>
        <li>
          <a
            href="https://gpuweb.github.io/gpuweb/"
            className="text-pink-200 underline underline-offset-4"
          >
            GPU for the Web Working Group
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          WGSL &mdash; WebGPU Shading Language &mdash; is a typed,
          Rust-flavoured shader language designed to be safely
          translatable to Metal Shading Language, SPIR-V (for Vulkan),
          and HLSL (for D3D12). Authoring WGSL by hand is rare in
          studio code; Three.js&rsquo;s TSL emits it.
        </li>
        <li>
          The WebGL2 fallback isn&rsquo;t free. The studio&rsquo;s TSL
          post pack ships fused single-pass variants on Quest 3S and
          older mobile devices where the multi-pass WebGPU path
          wouldn&rsquo;t hold framerate, and feature-detects at scene
          init time before binding any compute kernel.
        </li>
      </ol>
    </>
  );
}
