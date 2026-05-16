export default {
  experimental: {
    ppr: true,
    // inlineCss disabled: on Next 15.6 canary it emits next/font @font-face
    // URLs without the /_next/static/ prefix, so the browser requests
    // /media/<hash>.woff2 and gets 404. Re-enable when canary fixes it.
    useCache: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
  // The `onnxruntime-node` package ships native `.node` binding binaries
  // that webpack cannot parse. It gets pulled in via the
  // `@huggingface/transformers` package's conditional `node` export,
  // which kokoro-js (used by `components/aura/voice/kokoro-worker.ts`)
  // imports. That worker runs in the BROWSER, so the Node entry of
  // transformers is the wrong build anyway. Two-pronged fix below:
  //
  //   1. Alias `onnxruntime-node` to `false` everywhere — no bundle
  //      should ever try to embed those .node files.
  //   2. Pin `@huggingface/transformers` to its browser bundle on the
  //      client / worker side so kokoro-js gets the WebGPU + WASM
  //      ONNX-Web build instead of the native one.
  //
  // The mind-ar `fs` fallbacks below are a separate, pre-existing fix
  // for the same family of "client bundle pulls in Node-only branches"
  // problem.
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "onnxruntime-node": false,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
      };
      config.resolve.conditionNames = (
        config.resolve.conditionNames ?? ["browser", "module", "import", "require", "default"]
      ).filter((c: string) => c !== "node");
    }
    return config;
  },
};
