export default {
  // Pin the workspace root to this directory. Without it, Next walks up
  // looking for the nearest lockfile and finds an unrelated package-lock.json
  // at D:\, which produces a wrong outputFileTracing root on the build host
  // and risks shipping the wrong file set in the Vercel deploy bundle.
  // process.cwd() resolves to the project directory because Next runs the
  // config from the project root.
  outputFileTracingRoot: process.cwd(),
  experimental: {
    ppr: true,
    // inlineCss disabled: on Next 15.6 canary it emits next/font @font-face
    // URLs without the /_next/static/ prefix, so the browser requests
    // /media/<hash>.woff2 and gets 404. Re-enable when canary fixes it.
    useCache: true,
  },
  // Heavy native-binary packages that webpack/turbopack cannot bundle.
  // Listing them here keeps them as runtime `require`s in the server
  // build (and skips them entirely for the client build via the webpack
  // fallback below). These are pulled in transitively by the Aura voice
  // stack (kokoro-js → @huggingface/transformers → onnxruntime-node) and
  // by Apple Wallet pkpass generation (sharp, passkit-generator) — all
  // of which need Node native bindings, not webpack-bundled JS.
  serverExternalPackages: [
    "onnxruntime-node",
    "@huggingface/transformers",
    "kokoro-js",
    "sharp",
    "passkit-generator",
    "firebase-admin",
  ],
  // Tell Vercel's file-tracer (@vercel/nft) NOT to copy onnxruntime-node
  // into any lambda bundle. `serverExternalPackages` affects webpack
  // bundling but NFT *still* statically follows imports through
  // lib/capabilities/viz/depth-estimation.ts → @huggingface/transformers
  // → onnxruntime-node and copies all 354 MB of native .node binaries
  // into every page that touches the capabilities registry. That blew
  // five lambdas past the 250 MB limit on deploy dpl_4MKBt99TAeoLxMW1ZGiceYJAamhB
  // (capabilities.js, spatial.js, spatial/video.js, photographs/spatial.js,
  // research/cctv-3d-archive.js). Exclusion is safe because no server
  // code actually invokes onnxruntime — depth-estimation only runs in
  // the browser (it touches `document` / `navigator` / canvas) and the
  // kokoro/whisper workers are Web Workers, not server routes.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/onnxruntime-node/**",
      "node_modules/.pnpm/onnxruntime-node@*/**",
      "node_modules/@huggingface/transformers/**",
      "node_modules/.pnpm/@huggingface+transformers@*/**",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        // Vercel Blob — VRMs, future wardrobe outfit previews, AI
        // scanner uploads. Blob URLs are <store-id>.public.blob.vercel-storage.com.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
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
      // Strip `node` from conditionNames so transformers's conditional
      // exports map resolves to the browser bundle, not the Node one
      // (which would pull in onnxruntime-node). Documented in the
      // holoflow-deploy-gotchas skill, gotcha #14.
      config.resolve.conditionNames = (
        config.resolve.conditionNames ?? ["browser", "module", "import", "require", "default"]
      ).filter((c: string) => c !== "node");
      // Belt-and-braces: also alias the heavy server-only packages to
      // `false` for the client bundle. Aura's voice worker pulls
      // transformers + kokoro from a CDN as a Web Worker, NOT from
      // the page bundle, so excluding them here is safe.
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "onnxruntime-node": false,
        "@huggingface/transformers": false,
        "kokoro-js": false,
        sharp: false,
        "passkit-generator": false,
        "firebase-admin": false,
      };
    }
    return config;
  },
};
