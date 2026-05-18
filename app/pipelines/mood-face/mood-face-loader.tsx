"use client";

/**
 * Client-side shim for the mood-face demo. Same shape as the lipsync
 * loader — `next/dynamic` with `ssr: false` must live inside a Client
 * Component in Next 15.6 canary.
 */

import dynamic from "next/dynamic";

const MoodFaceDemo = dynamic(
  () => import("components/pipelines/MoodFaceDemo"),
  { ssr: false, loading: () => <DemoSkeleton /> },
);

function DemoSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <div className="aspect-[3/4] w-full animate-pulse rounded-sm border border-warm-black-800 bg-warm-black-900/60" />
      <div className="space-y-3">
        <div className="h-4 w-1/3 animate-pulse rounded-sm bg-warm-black-900/60" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-sm bg-warm-black-900/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MoodFaceLoader() {
  return <MoodFaceDemo />;
}
