export default function WebXr() {
  return (
    <>
      <p>
        WebXR is the browser API for virtual and augmented reality
        sessions. A page calls{" "}
        <code className="font-mono text-chrome-200">
          navigator.xr.requestSession()
        </code>{" "}
        with a session mode (
        <code className="font-mono text-chrome-200">immersive-vr</code>{" "}
        or{" "}
        <code className="font-mono text-chrome-200">immersive-ar</code>
        ) and a list of feature requests; the browser hands back an
        <code className="font-mono text-chrome-200">XRSession</code>{" "}
        bound to the connected headset, and the page&rsquo;s render
        loop transfers from the standard requestAnimationFrame to the
        XR frame callback. From that point the application is drawing
        into the headset.<sup>1</sup>
      </p>
      <p>
        The session lifecycle has three notable seams. The mode
        decides whether the user sees the page&rsquo;s scene over
        passthrough video (AR) or in a fully synthesised environment
        (VR). The{" "}
        <code className="font-mono text-chrome-200">requiredFeatures</code>{" "}
        list names capabilities the scene cannot meaningfully render
        without &mdash;{" "}
        <code className="font-mono text-chrome-200">local-floor</code>{" "}
        for an anchored reference space,{" "}
        <code className="font-mono text-chrome-200">hand-tracking</code>{" "}
        on devices where hands are the primary input. The{" "}
        <code className="font-mono text-chrome-200">optionalFeatures</code>{" "}
        list names everything else: hit-test, anchors, plane
        detection, depth sensing, light estimation, layers. The
        application feature-detects after the session resolves and
        degrades gracefully when a feature is unavailable.
      </p>
      <p>
        The spec is maintained by the W3C&rsquo;s Immersive Web
        Working Group, which also runs the{" "}
        <a
          href="https://immersiveweb.dev/"
          className="text-pink-200 underline underline-offset-4"
        >
          immersiveweb.dev
        </a>{" "}
        developer hub. Chromium-based browsers (Meta Browser, Pico
        Browser, Chrome on Android XR, Wolvic-Chromium) carry the
        broadest implementation. Safari on visionOS supports{" "}
        <code className="font-mono text-chrome-200">immersive-vr</code>{" "}
        only, with no AR module; the wall-preview pattern that runs
        on a Quest as{" "}
        <code className="font-mono text-chrome-200">immersive-ar</code>{" "}
        runs on Vision Pro as a VR scene composed inside a virtual
        room. The studio&rsquo;s per-device target matrix is the
        binding reference for what each headset actually exposes.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/virtual-reality"
          className="text-pink-200 underline underline-offset-4"
        >
          virtual reality
        </a>
        ,{" "}
        <a
          href="/codex/augmented-reality"
          className="text-pink-200 underline underline-offset-4"
        >
          augmented reality
        </a>
        ,{" "}
        <a
          href="/codex/webgpu"
          className="text-pink-200 underline underline-offset-4"
        >
          WebGPU
        </a>
        ,{" "}
        <a
          href="/codex/foveated-rendering"
          className="text-pink-200 underline underline-offset-4"
        >
          foveated rendering
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://www.w3.org/TR/webxr/"
            className="text-pink-200 underline underline-offset-4"
          >
            WebXR Device API specification
          </a>{" "}
          (W3C Immersive Web WG).
        </li>
        <li>
          <a
            href="https://immersiveweb.dev/"
            className="text-pink-200 underline underline-offset-4"
          >
            immersiveweb.dev
          </a>{" "}
          &mdash; developer hub, samples, browser-support matrix.
        </li>
        <li>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API"
            className="text-pink-200 underline underline-offset-4"
          >
            MDN: WebXR Device API
          </a>
          .
        </li>
        <li>
          The studio&rsquo;s WebXR device-target hard deck lives in
          the repository at{" "}
          <code className="font-mono text-chrome-200">
            docs/WEBXR-DEVICE-TARGETS.md
          </code>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The WebXR Device API replaced an earlier, simpler WebVR API
          around 2019. WebVR&rsquo;s mistake was treating the headset
          as a magic window into a fixed-scale scene; WebXR
          generalises to AR, hand input, anchors, and the half-dozen
          other primitives the practical XR application turns out to
          need.
        </li>
      </ol>
    </>
  );
}
