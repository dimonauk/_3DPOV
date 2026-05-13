"use client";

import dynamic from "next/dynamic";
import type { ParamDescriptor } from "lib/algorithms";

const AlgorithmPreview = dynamic(
  () => import("components/atelier/algorithm-preview"),
  { ssr: false },
);

/**
 * Client-side wrapper so the per-algorithm RSC page can opt into the
 * R3F preview without violating the Server-Component constraint on
 * `next/dynamic({ ssr: false })`.
 */
export default function AlgorithmPreviewClient(props: {
  slug: string;
  params: ParamDescriptor[];
}) {
  return <AlgorithmPreview {...props} />;
}
