/**
 * lib/capabilities/commerce/sharp-video-job-types.ts — Type exports for
 * the `commerce.sharp-video-job` capability. Lives separately so the
 * REST primitives + JSON parser can import these without pulling in the
 * full submit / rehydrate surface (avoids circulars when the parser
 * needs the status type).
 */

export type SharpVideoJobInput = {
  videoBlob: Blob;
  /** 1 keyframe every N input frames. Higher = faster + coarser. Default 6. */
  keyframeStride?: number;
  outputs?: {
    splat4d?: boolean;
    stereoMp4?: boolean;
    usdzKeyframes?: boolean;
  };
  meta?: {
    title?: string;
    captureDate?: string;
    locationId?: string;
    photographSlug?: string;
  };
};

export type SharpVideoJobStatus =
  | { state: "queued"; positionInQueue: number; submittedAt: string }
  | {
      state: "decoding";
      framesTotal: number | null;
      progressPct: number;
    }
  | {
      state: "running";
      framesDone: number;
      framesTotal: number;
      progressPct: number;
      etaSeconds: number | null;
      currentFrameStage: "sharp" | "4dgs-fit" | "stitch";
    }
  | {
      state: "done";
      bundle: {
        splat4dUrl?: string;
        stereoMp4Url?: string;
        usdzKeyframesUrl?: string;
      };
      framesTotal: number;
      durationSeconds: number;
      sizeBytes: number;
    }
  | { state: "error"; message: string; code?: string }
  | { state: "cancelled" };

export type SharpVideoJobHandle = {
  jobId: string;
  poll(): Promise<SharpVideoJobStatus>;
  cancel(): Promise<void>;
  waitForCompletion(intervalMs?: number): Promise<SharpVideoJobStatus>;
};
