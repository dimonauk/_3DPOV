export default {
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
  // mind-ar's image-three bundle has a guarded `require("fs")` (and a few
  // other Node-only refs) for Node-side usage that webpack can't statically
  // resolve when bundling for the browser. The runtime IS_NODE check skips
  // those branches in the client; stub them out so the build succeeds.
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
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
      // Same heavy packages — also exclude from CLIENT bundle. They're
      // strictly server-side (Aura's voice worker is a separate web
      // worker that pulls them from a CDN, not from our bundle).
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
