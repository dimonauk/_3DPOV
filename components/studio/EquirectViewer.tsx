"use client";
/**
 * EquirectViewer.tsx — Entry point. Routes source kinds to the right panel.
 * Internals live in equirect-scene.tsx and equirect-stitch.tsx.
 */
import { Canvas } from "@react-three/fiber";
import type { Keyframe, SourceAsset } from "lib/studio/types";
import { Scene, ViewportHUD } from "./equirect-scene";
import { StitchPanel } from "./equirect-stitch";

type Props = {
  source: SourceAsset;
  keyframes: Keyframe[];
  activeIndex: number;
  onKeyframeChange: (kf: Keyframe) => void;
  onSourceReplace?: (next: SourceAsset) => void;
};

export default function EquirectViewer(props: Props) {
  if (props.source.kind === "splat")
    return <PlaceholderPanel message={`Splat preview lands in M2. (${props.source.label})`} />;
  if (props.source.kind === "osv-video" || props.source.kind === "insv-video")
    return <StitchPanel source={props.source} onSourceReplace={props.onSourceReplace} />;
  if (props.source.kind === "unknown")
    return <PlaceholderPanel message={`Unknown format — ${props.source.label}`} />;
  return <CanvasViewer {...props} />;
}

function CanvasViewer({ source, keyframes, activeIndex, onKeyframeChange }: Props) {
  const kf = keyframes[activeIndex]!;
  return (
    <div className="relative h-full w-full">
      <Canvas gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ position: [0, 0, 0.0001], fov: kf.fov }} className="bg-warm-black-950">
        <Scene source={source} activeKeyframe={kf} onKeyframeChange={onKeyframeChange} />
      </Canvas>
      <ViewportHUD active={kf} />
    </div>
  );
}

function PlaceholderPanel({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center bg-warm-black-950 px-6 text-center">
      <div>
        <div className="chrome-label text-pink-200">NOT YET</div>
        <div className="mt-3 max-w-md text-sm text-chrome-200">{message}</div>
      </div>
    </div>
  );
}
