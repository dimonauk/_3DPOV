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
    }
    return config;
  },
};
