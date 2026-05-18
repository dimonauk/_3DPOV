/**
 * lib/printfiles/types.ts — shared types for the printfiles engine.
 *
 * These shapes are written to Firestore at `printfile_orders/{id}`
 * and surfaced in the /admin/printfiles dashboard. Versioned by the
 * `schemaVersion` field so a later migration can know what's old.
 */

export const PRINTFILES_SCHEMA_VERSION = 1 as const;

export type PrintfileMimeKind = "stl" | "glb" | "3mf" | "obj" | "unknown";

export type PrintfileAttachment = {
  /** Display filename from the email — sanitised at intake. */
  filename: string;
  /** MIME from the email envelope. May be wrong / generic. */
  reportedMimeType: string;
  /** Inferred from magic bytes / file extension. Source of truth. */
  inferredKind: PrintfileMimeKind;
  /** Uncompressed size in bytes. */
  sizeBytes: number;
  /** Vercel Blob URL (private partition; requires signed download). */
  blobUrl: string;
  /** Pathname inside Blob (`printfiles/<orderId>/<filename>`). */
  blobPathname: string;
  /** Validation result from the ingest pipeline. */
  validation: PrintfileValidation;
};

export type PrintfileValidation = {
  /** True when every check passes and the file is forwardable. */
  ok: boolean;
  /** Triangle count for STL/GLB; null for formats we can't probe. */
  triangleCount: number | null;
  /** Bounding box in millimetres (or model units if no scale). */
  boundingBoxMm: { x: number; y: number; z: number } | null;
  /** Specific issues. Empty array means everything passed. */
  issues: PrintfileValidationIssue[];
};

export type PrintfileValidationIssue =
  | "mime-mismatch"
  | "too-large"
  | "zero-triangles"
  | "implausible-bounding-box"
  | "parse-failed";

export type PrintfilesOrderStatus =
  | "received"     // file landed, ingest pipeline has run
  | "queued"       // waiting for the operator / farm to pick it up
  | "sent-to-farm" // forwarded; awaiting print
  | "printing"    // farm confirmed printing
  | "shipped"      // farm shipped; tracking number stored
  | "delivered"    // customer confirmed delivery
  | "rejected"     // declined (size, validation, abuse)
  | "errored";     // pipeline broke; needs operator attention

export type PrintfilesOrder = {
  schemaVersion: typeof PRINTFILES_SCHEMA_VERSION;
  /** Order id — kebab-case with a date prefix. Used in URLs + emails. */
  id: string;
  /** When the email arrived at the listener. ISO string. */
  receivedAt: string;
  /** When the operator / farm last updated it. ISO string. */
  updatedAt: string;
  /** Sender's email — display name preserved when present. */
  sender: { name: string | null; address: string };
  /** Original subject + body for context. */
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  /** Email threading — so the reply lands on the original. */
  messageId: string | null;
  /** Attachments after intake. At least one for a valid order. */
  attachments: PrintfileAttachment[];
  /** Aggregate validation — `ok` only if every attachment is `ok`. */
  validation: { ok: boolean; issues: PrintfileValidationIssue[] };
  /** Lifecycle state. */
  status: PrintfilesOrderStatus;
  /** Provider that's printing this; null until forward step. */
  printfarm: {
    provider: PrintfarmProvider;
    /** Provider's own order/job id. Null while still local. */
    externalId: string | null;
    /** Tracking URL once shipped. */
    trackingUrl: string | null;
  };
  /** Confirmation email sent — Resend id stored so we can dedupe. */
  graciousReplyId: string | null;
  /** Anti-abuse decisions, if any. */
  flags: {
    spamSuspect: boolean;
    rateLimited: boolean;
    sizeRejected: boolean;
  };
};

export type PrintfarmProvider =
  | "manual"      // operator handles the farm choice + forward
  | "treatstock"
  | "slant3d"
  | "craftcloud";

export const FIRESTORE_COLLECTION = "printfile_orders" as const;

/** Cap on a single attachment, in megabytes. Overridable via env. */
export const DEFAULT_MAX_ATTACHMENT_MB = 20;
/** Cap on total attachments per email, in megabytes. */
export const DEFAULT_MAX_TOTAL_MB = 50;

/**
 * MIME prefixes / extensions we accept. The listener rejects anything
 * else immediately, so customers don't think we'll print their PDFs.
 */
export const ACCEPTED_EXTENSIONS = [".stl", ".glb", ".gltf", ".3mf", ".obj"] as const;
