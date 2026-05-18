/**
 * lib/printfiles/directory.ts — directory generator.
 *
 * Takes the parsed inbound email and turns it into a persisted order:
 *   - mints an order id (date-prefixed kebab-case slug)
 *   - uploads each attachment to the private Vercel Blob partition at
 *     `printfiles/<orderId>/<sanitised-filename>`
 *   - writes a Firestore doc at `printfile_orders/{orderId}` with the
 *     full PrintfilesOrder shape
 *
 * Does NOT validate attachments (the ingest pipeline does that BEFORE
 * us — by the time directory.ts runs, the attachments have a
 * PrintfileValidation result attached). Does NOT send the gracious
 * reply (reply.ts owns that). One job: persist.
 */

import "server-only";

import { put } from "@vercel/blob";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";

import {
  FIRESTORE_COLLECTION,
  PRINTFILES_SCHEMA_VERSION,
  type PrintfarmProvider,
  type PrintfileAttachment,
  type PrintfilesOrder,
} from "./types";

const log = createLogger("printfiles.directory");

export type CreateOrderInput = {
  sender: { name: string | null; address: string };
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  messageId: string | null;
  /** Attachments AFTER the ingest pipeline has validated them. */
  attachments: PrintfileAttachment[];
  /** Aggregate validation summary. */
  validation: PrintfilesOrder["validation"];
  /** Print-farm provider chosen for this order. */
  provider: PrintfarmProvider;
  /** Flags from the intake gate (spam, rate-limit, size). */
  flags: PrintfilesOrder["flags"];
};

export type CreateOrderResult = {
  orderId: string;
  /** Firestore document path. */
  docPath: string;
  /** Sanitised filenames as they landed in Blob. */
  storedFilenames: string[];
};

/**
 * Sanitise a filename so it's safe to use as a Blob path segment.
 * Collapses whitespace, strips control chars, replaces anything
 * outside [a-zA-Z0-9._-] with '_'. Caps length at 120 chars (well
 * within Blob's 1024-char limit but readable in the dashboard).
 */
export function sanitiseFilename(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "_");
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.length > 120 ? cleaned.slice(0, 120) : cleaned || "file.bin";
}

/**
 * Mint an order id of the form `pf-YYYYMMDD-<8hex>` — date-prefixed
 * for sortability, short hash for uniqueness. The `pf-` prefix lets a
 * reader recognise printfile orders at a glance vs bureau-order ids.
 */
export function mintOrderId(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const hex = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return `pf-${y}${m}${d}-${hex}`;
}

/**
 * Resolve the right Blob token. Mirrors lib/capabilities/media/library-blob.ts:
 * prefer the private partition, fall back to public during dev.
 */
function resolveBlobToken(): string {
  const privateToken = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  if (privateToken && privateToken.length > 0) return privateToken;
  const publicToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (publicToken && publicToken.length > 0) return publicToken;
  throw new Error(
    "printfiles directory: no Blob token. Set PRIVATE_BLOB_READ_WRITE_TOKEN " +
      "in Vercel project env (BLOB_READ_WRITE_TOKEN accepted as dev fallback).",
  );
}

/**
 * Upload a single attachment's bytes to Blob. The caller has already
 * sanitised the filename and decoded base64 into a Buffer.
 */
async function uploadAttachmentBytes(
  orderId: string,
  filename: string,
  contentType: string,
  bytes: Buffer,
): Promise<{ url: string; pathname: string }> {
  const token = resolveBlobToken();
  const pathname = `printfiles/${orderId}/${filename}`;
  // `access: "public"` is the only mode Vercel Blob currently exposes
  // server-side. When we're using the PRIVATE_BLOB token, "public"
  // here means "public to anyone with the URL" but the URL is on the
  // private store domain (private store URLs require a download token
  // to fetch — the URL alone returns 403). When we fall back to the
  // public token, the URL is genuinely public — fine for dev, not for
  // prod customer files. The token resolution above prefers private.
  const result = await put(pathname, bytes, {
    access: "public",
    contentType,
    token,
    addRandomSuffix: false,
  });
  return { url: result.url, pathname };
}

export type AttachmentInputForBlob = {
  filename: string;
  contentType: string;
  bytes: Buffer;
  validation: PrintfileAttachment["validation"];
  inferredKind: PrintfileAttachment["inferredKind"];
};

/**
 * Upload every attachment for an order to Blob. Sequential rather
 * than parallel so a partial failure leaves a contiguous set of
 * successful uploads (we know we can resume from the last index).
 */
export async function uploadAttachments(
  orderId: string,
  inputs: AttachmentInputForBlob[],
): Promise<PrintfileAttachment[]> {
  const out: PrintfileAttachment[] = [];
  for (const input of inputs) {
    const safeName = sanitiseFilename(input.filename);
    const { url, pathname } = await uploadAttachmentBytes(
      orderId,
      safeName,
      input.contentType,
      input.bytes,
    );
    out.push({
      filename: safeName,
      reportedMimeType: input.contentType,
      inferredKind: input.inferredKind,
      sizeBytes: input.bytes.byteLength,
      blobUrl: url,
      blobPathname: pathname,
      validation: input.validation,
    });
  }
  return out;
}

/**
 * Write the order doc to Firestore. Uses the admin SDK so the write
 * is server-only and bypasses Firestore rules (the rules deny client
 * reads + writes to this collection — see `firestore.rules`).
 */
export async function writeOrderDoc(
  orderId: string,
  order: Omit<PrintfilesOrder, "id" | "schemaVersion">,
): Promise<string> {
  const db = requireFirebaseAdminDb();
  const docRef = db.collection(FIRESTORE_COLLECTION).doc(orderId);
  const doc: PrintfilesOrder = {
    ...order,
    schemaVersion: PRINTFILES_SCHEMA_VERSION,
    id: orderId,
  };
  await docRef.set(doc);
  return docRef.path;
}

/**
 * Top-level: create the order. Caller passes the parsed + validated
 * email; we mint an id, upload to Blob, write Firestore, return the
 * order id. The order is created with `status: "received"`. Downstream
 * (print-farm forwarder + gracious reply) flips it to "queued" /
 * "sent-to-farm" etc.
 */
export async function createOrder(
  input: CreateOrderInput,
  attachmentBytes: AttachmentInputForBlob[],
): Promise<CreateOrderResult> {
  const orderId = mintOrderId();
  log.info("creating order", {
    orderId,
    sender: input.sender.address,
    attachmentCount: attachmentBytes.length,
    provider: input.provider,
  });

  let attachments: PrintfileAttachment[];
  try {
    attachments = await uploadAttachments(orderId, attachmentBytes);
  } catch (err) {
    log.error("blob upload failed", { orderId, err: errToObject(err) });
    throw err;
  }

  const now = new Date().toISOString();
  const order: Omit<PrintfilesOrder, "id" | "schemaVersion"> = {
    receivedAt: now,
    updatedAt: now,
    sender: input.sender,
    subject: input.subject,
    bodyText: input.bodyText,
    bodyHtml: input.bodyHtml,
    messageId: input.messageId,
    attachments,
    validation: input.validation,
    status: "received",
    printfarm: {
      provider: input.provider,
      externalId: null,
      trackingUrl: null,
    },
    graciousReplyId: null,
    flags: input.flags,
  };

  let docPath: string;
  try {
    docPath = await writeOrderDoc(orderId, order);
  } catch (err) {
    log.error("firestore write failed", { orderId, err: errToObject(err) });
    throw err;
  }

  log.info("order created", { orderId, docPath });
  return {
    orderId,
    docPath,
    storedFilenames: attachments.map((a) => a.filename),
  };
}
