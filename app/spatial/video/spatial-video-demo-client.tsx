"use client";

/**
 * app/spatial/video/spatial-video-demo-client.tsx — Client for the 2D→3D video demo.
 *
 * One-line role: orchestrates the per-frame pipeline (./spatial-video-pipeline)
 * and the presentational sub-panels (./spatial-video-panels), holding phase
 * state, refs, and the SHARP-video commission alternative.
 * Full purpose in spatial-video-demo-client.PURPOSE.md.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  probeDepthSupport,
  type DepthSupport,
} from "lib/capabilities/viz/depth-estimation";
import {
  probeSpatialFormats,
  type SpatialRecordingHandle,
} from "lib/capabilities/viz/spatial-export";
import {
  isSharpVideoServiceAvailable,
  submitSharpVideoJob,
  type SharpVideoJobHandle,
  type SharpVideoJobStatus,
} from "lib/capabilities/commerce/sharp-video-job";

import {
  processVideo,
  TARGET_FPS,
  type Progress,
  type Result,
} from "./spatial-video-pipeline";
import {
  FeatureBar,
  DropZone,
  ProcessingPanel,
  CommissioningPanel,
  ResultPanel,
  NoSupportPanel,
  ErrorPanel,
} from "./spatial-video-panels";

type Phase =
  | "idle"
  | "probing"
  | "ready"
  | "ready-no-support"
  | "loading-video"
  | "processing"
  | "done"
  | "commissioning"
  | "error";

export default function SpatialVideoDemoClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [depthSupport, setDepthSupport] = useState<DepthSupport | null>(null);
  const [videoSupport, setVideoSupport] = useState<{ sbsMp4: boolean } | null>(null);
  const [sharpAvailable, setSharpAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sharpStatus, setSharpStatus] = useState<SharpVideoJobStatus | null>(null);

  const cancelRef = useRef<boolean>(false);
  const handleRef = useRef<SpatialRecordingHandle | null>(null);
  const sharpHandleRef = useRef<SharpVideoJobHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase("probing");
    (async () => {
      const [depth, spatial, sharp] = await Promise.all([
        probeDepthSupport(),
        Promise.resolve(probeSpatialFormats()),
        isSharpVideoServiceAvailable(),
      ]);
      if (cancelled) return;
      setDepthSupport(depth);
      setVideoSupport({ sbsMp4: spatial.sbsMp4 });
      setSharpAvailable(sharp.available);
      if (depth.recommended && spatial.sbsMp4) {
        setPhase("ready");
      } else {
        setPhase("ready-no-support");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    };
  }, [result]);

  const onFile = useCallback(
    async (file: File) => {
      cancelRef.current = false;
      setError(null);
      setProgress(null);
      setResult(null);
      setPhase("loading-video");
      try {
        const blob = await processVideo(
          file,
          (p) => {
            if (cancelRef.current) throw new Error("cancelled");
            setProgress(p);
          },
          handleRef,
        );
        if (cancelRef.current) {
          setPhase("ready");
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        setResult({
          blob,
          downloadUrl,
          durationSeconds: progress?.framesTotal
            ? progress.framesTotal / TARGET_FPS
            : 0,
          framesTotal: progress?.framesTotal ?? 0,
        });
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      }
    },
    [progress?.framesTotal],
  );

  const onCancel = useCallback(() => {
    cancelRef.current = true;
    handleRef.current?.cancel();
    handleRef.current = null;
  }, []);

  const onCommissionSharp = useCallback(async (file: File) => {
    setError(null);
    setSharpStatus(null);
    setPhase("commissioning");
    try {
      const handle = await submitSharpVideoJob({ videoBlob: file });
      sharpHandleRef.current = handle;
      const final = await handle.waitForCompletion(5000);
      setSharpStatus(final);
      if (final.state === "done") {
        setPhase("done");
      } else {
        setPhase("error");
        setError(final.state === "error" ? final.message : "commission cancelled");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, []);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
      <FeatureBar
        depthSupport={depthSupport}
        videoSupport={videoSupport}
        sharpAvailable={sharpAvailable}
      />

      {phase === "ready" || phase === "idle" || phase === "probing" ? (
        <DropZone disabled={phase !== "ready"} onFile={onFile} />
      ) : null}

      {phase === "ready-no-support" ? (
        <NoSupportPanel
          depthSupport={depthSupport}
          videoSupport={videoSupport}
          sharpAvailable={sharpAvailable}
          onCommission={onCommissionSharp}
        />
      ) : null}

      {(phase === "loading-video" || phase === "processing") && progress ? (
        <ProcessingPanel progress={progress} onCancel={onCancel} />
      ) : null}

      {phase === "commissioning" ? (
        <CommissioningPanel status={sharpStatus} />
      ) : null}

      {phase === "done" && result ? (
        <ResultPanel
          result={result}
          sharpAvailable={sharpAvailable}
          onCommissionSharp={(file) => onCommissionSharp(file)}
          sharpStatus={sharpStatus}
        />
      ) : null}

      {phase === "error" && error ? <ErrorPanel message={error} /> : null}
    </div>
  );
}
