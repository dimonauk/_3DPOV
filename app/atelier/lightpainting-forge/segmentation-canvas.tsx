"use client";

// Click-driven SAM2 segmentation overlay.
//   left click       -> positive point (include)
//   shift+left click -> negative point (exclude)
//   right click      -> clear all points

import { useEffect, useRef, useState } from "react";

import { segment, type Point } from "./sam2-client";

interface Props {
  file: File | null;
  width: number;
  onMask: (
    mask: ImageData | null,
    source: "sam2" | "fallback" | null,
  ) => void;
}

export function SegmentationCanvas({ file, width, onMask }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [imageId, setImageId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [height, setHeight] = useState(width);

  // Reset on new file + render photo.
  useEffect(() => {
    setPoints([]);
    setImageId(undefined);
    onMask(null, null);
    if (!file || !photoRef.current) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const c = photoRef.current!;
      const aspect = image.naturalHeight / image.naturalWidth;
      const h = Math.round(width * aspect);
      c.width = image.naturalWidth;
      c.height = image.naturalHeight;
      c.getContext("2d")!.drawImage(image, 0, 0);
      setImg(image);
      setHeight(h);
      URL.revokeObjectURL(url);
    };
    image.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Re-segment whenever the point set changes.
  useEffect(() => {
    if (!img || points.length === 0) {
      onMask(null, null);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      const result = await segment(img, points, imageId);
      if (cancelled) return;
      if (result.imageId && !imageId) setImageId(result.imageId);
      onMask(result.mask, result.source);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const clientToImage = (
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | null => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !img) return null;
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    if (px < 0 || py < 0 || px > 1 || py > 1) return null;
    return {
      x: px * img.naturalWidth,
      y: py * img.naturalHeight,
    };
  };

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const p = clientToImage(e.clientX, e.clientY);
    if (!p) return;
    const label: 0 | 1 = e.shiftKey ? 0 : 1;
    setPoints((prev) => [...prev, { x: p.x, y: p.y, label }]);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPoints([]);
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width,
        height: img ? height : "auto",
        cursor: "crosshair",
        userSelect: "none",
      }}
      className="border border-warm-black-800 bg-warm-black-950"
    >
      <canvas
        ref={photoRef}
        style={{
          width: "100%",
          height: "100%",
          display: img ? "block" : "none",
          imageRendering: "auto",
        }}
        onClick={onClick}
        onContextMenu={onContextMenu}
      />
      {img && (
        <svg
          ref={overlayRef}
          viewBox={`0 0 ${img.naturalWidth} ${img.naturalHeight}`}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={Math.max(8, img.naturalWidth * 0.012)}
                fill="none"
                stroke={p.label === 1 ? "#66ff99" : "#ff6677"}
                strokeWidth={Math.max(2, img.naturalWidth * 0.003)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={Math.max(3, img.naturalWidth * 0.004)}
                fill={p.label === 1 ? "#66ff99" : "#ff6677"}
              />
            </g>
          ))}
        </svg>
      )}
      {busy && (
        <div className="absolute right-1 top-1 bg-warm-black-950/85 px-1.5 py-0.5 font-mono text-[10px] text-pink-200">
          segmenting...
        </div>
      )}
      {!file && (
        <div className="p-3 font-mono text-[11px] text-chrome-500">
          Drop a photo. left-click = include &middot; shift+click = exclude
          &middot; right-click = clear
        </div>
      )}
    </div>
  );
}
