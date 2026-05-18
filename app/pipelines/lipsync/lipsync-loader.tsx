"use client";

/**
 * Client-side shim for the lipsync demo. `next/dynamic` with
 * `ssr: false` is only honoured inside a Client Component (Next 15.6
 * canary throws if you call it from a Server Component, even when the
 * page itself is server-rendered for metadata).
 *
 * The shim is the smallest possible client boundary: just the dynamic
 * import + a skeleton. The server page imports this default export
 * and gets a no-SSR demo on the client.
 */

import dynamic from "next/dynamic";

const LipsyncDemo = dynamic(
  () => import("components/pipelines/LipsyncDemo"),
  { ssr: false, loading: () => <DemoSkeleton /> },
);

function DemoSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <div className="aspect-[3/4] w-full animate-pulse rounded-sm border border-warm-black-800 bg-warm-black-900/60" />
      <div className="space-y-3">
        <div className="h-4 w-1/3 animate-pulse rounded-sm bg-warm-black-900/60" />
        <div className="h-32 w-full animate-pulse rounded-sm bg-warm-black-900/60" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-warm-black-900/60" />
      </div>
    </div>
  );
}

export default function LipsyncLoader() {
  return <LipsyncDemo />;
}
