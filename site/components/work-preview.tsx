import dynamic from "next/dynamic";
import type { Work } from "@/lib/works";
import { PlatePlaceholder } from "./plate-placeholder";

const GlbViewer = dynamic(
  () => import("./glb-viewer").then((m) => m.GlbViewer),
  { ssr: false, loading: () => <div className="aspect-[3/4] w-full border border-ink/15 bg-ink/5" /> }
);

export function WorkPreview({
  work,
  tint,
  aspect = "3/4",
  hatch = "diagonal",
}: {
  work: Work;
  tint: string;
  aspect?: "3/4" | "4/5" | "16/10";
  hatch?: "horizontal" | "vertical" | "diagonal";
}) {
  if (work.type === "plate") {
    return <PlatePlaceholder tint={tint} aspect={aspect} hatch={hatch} />;
  }
  return <GlbViewer glb={work.glb} tint={tint} />;
}
