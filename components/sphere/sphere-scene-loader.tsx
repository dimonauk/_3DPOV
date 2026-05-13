"use client";

/**
 * Client-only wrapper around `SphereScene`.
 *
 * `next/dynamic` with `ssr: false` is not allowed in Server
 * Components in the App Router (Next.js 15+). Putting the dynamic
 * import inside this `"use client"` shim keeps `app/sphere/page.tsx`
 * a Server Component while still deferring the R3F canvas to the
 * client.
 *
 * Without this indirection, Turbopack's import-graph analysis
 * mis-flags the page's transitive imports (e.g. Footer →
 * `lib/shopify/cached.ts`) as Client-Component-reachable and the
 * build fails with "You're importing a component that needs
 * 'next/headers'." errors against the cached Shopify reads.
 */

import dynamic from "next/dynamic";

const SphereScene = dynamic(
  () => import("components/sphere/sphere-scene"),
  {
    ssr: false,
    loading: () => (
      <div
        className="aspect-[4/3] w-full animate-pulse rounded-sm border border-warm-black-800"
        style={{ backgroundColor: "#0c0a12" }}
      />
    ),
  },
);

export default function SphereSceneLoader() {
  return <SphereScene />;
}
