/**
 * lib/printfiles/ingest.ts — validation + geometry probe.
 *
 * Each attachment from the inbound email runs through this pipeline
 * before the directory generator persists it. We:
 *
 *   1. Sniff the magic bytes to infer the actual format (don't trust
 *      the reported MIME — customers often send `application/octet-
 *      stream` or `text/plain` for an STL).
 *   2. Check the size against PRINTFILES_MAX_ATTACHMENT_MB.
 *   3. Probe for triangle count + bounding box, where the format
 *      supports it cheaply (STL ASCII, STL binary, GLB).
 *   4. Decide whether the file is forwardable.
 *
 * What we do NOT do here: manifold/watertight check (heavy, would
 * need a mesh library), auto-repair, slicing, quoting. Those are
 * print-farm responsibilities or future v2.
 */

import { Buffer } from "node:buffer";

import { createLogger } from "lib/log";

import {
  ACCEPTED_EXTENSIONS,
  DEFAULT_MAX_ATTACHMENT_MB,
  type PrintfileMimeKind,
  type PrintfileValidation,
  type PrintfileValidationIssue,
} from "./types";

const log = createLogger("printfiles.ingest");

function maxAttachmentBytes(): number {
  const env = process.env.PRINTFILES_MAX_ATTACHMENT_MB;
  const mb = env ? Number(env) : DEFAULT_MAX_ATTACHMENT_MB;
  if (!Number.isFinite(mb) || mb <= 0) return DEFAULT_MAX_ATTACHMENT_MB * 1024 * 1024;
  return Math.floor(mb * 1024 * 1024);
}

/**
 * Infer the file kind from filename + bytes. Magic-byte signatures
 * are the tiebreaker when the extension lies.
 *
 *   STL binary:  no fixed magic; 80-byte header + uint32 triangle
 *                count; the header often starts with "solid" tricking
 *                ASCII detectors. Check the file size against
 *                `84 + count * 50` to distinguish from ASCII.
 *   STL ASCII:   starts with `solid ` (case-insensitive) followed by
 *                a non-binary header line.
 *   GLB:         first 4 bytes are `0x67 0x6C 0x54 0x46` ('glTF').
 *   3MF:         it's a ZIP — starts with `PK\x03\x04`.
 *   OBJ:         text format with `v `, `f `, `vt ` markers; we
 *                accept by extension since OBJ has no magic bytes.
 */
export function inferKind(
  filename: string,
  bytes: Buffer,
): PrintfileMimeKind {
  const lower = filename.toLowerCase();
  // GLB binary magic
  if (bytes.length >= 4) {
    const head4 = bytes.subarray(0, 4).toString("ascii");
    if (head4 === "glTF") return "glb";
    if (head4 === "PK\x03\x04") return "3mf";
  }
  if (lower.endsWith(".stl")) {
    // Distinguish ASCII vs binary STL — only for typing purposes,
    // we treat both as "stl".
    return "stl";
  }
  if (lower.endsWith(".glb")) return "glb";
  if (lower.endsWith(".gltf")) return "glb";
  if (lower.endsWith(".3mf")) return "3mf";
  if (lower.endsWith(".obj")) return "obj";
  // Fallback heuristic: ASCII STL header
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii").toLowerCase() === "solid") {
    return "stl";
  }
  return "unknown";
}

/**
 * Parse a binary STL header and return triangle count + bounding box.
 * Binary STL layout:
 *   - 80-byte header (free-form)
 *   - 4-byte little-endian uint32: triangle count
 *   - Then `count * 50` bytes (12 floats * 4 bytes + 2 attr bytes)
 */
function probeStlBinary(bytes: Buffer):
  | { triangleCount: number; boundingBox: { x: number; y: number; z: number } | null }
  | null {
  if (bytes.length < 84) return null;
  const count = bytes.readUInt32LE(80);
  const expected = 84 + count * 50;
  // Allow slop (some writers add trailing bytes); reject when way off.
  if (bytes.length < expected || bytes.length > expected + 1024) return null;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  // Sample up to 5000 triangles for the bounding box on huge meshes —
  // accuracy is enough for sanity checks, no need to scan everything.
  const stride = Math.max(1, Math.floor(count / 5000));
  for (let i = 0; i < count; i += stride) {
    const offset = 84 + i * 50 + 12; // skip the normal vector
    for (let v = 0; v < 3; v++) {
      const x = bytes.readFloatLE(offset + v * 12);
      const y = bytes.readFloatLE(offset + v * 12 + 4);
      const z = bytes.readFloatLE(offset + v * 12 + 8);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }
  const bbox =
    Number.isFinite(minX) && Number.isFinite(maxX)
      ? { x: maxX - minX, y: maxY - minY, z: maxZ - minZ }
      : null;
  return { triangleCount: count, boundingBox: bbox };
}

/**
 * Lightweight ASCII STL probe: count `facet normal` occurrences.
 * Skips bounding box (cost of parsing all the floats isn't worth
 * doing in ASCII; if needed the operator can re-probe later).
 */
function probeStlAscii(bytes: Buffer): { triangleCount: number; boundingBox: null } | null {
  // ASCII STL files can be megabytes — only scan the first 5 MB then
  // estimate. (Most ASCII STLs are small anyway; the binary form is
  // what we get from any real toolchain.)
  const slice = bytes.subarray(0, Math.min(bytes.length, 5 * 1024 * 1024));
  const text = slice.toString("utf8");
  const matches = text.match(/facet normal/gi);
  if (!matches) return null;
  return { triangleCount: matches.length, boundingBox: null };
}

/**
 * Probe a GLB binary header. GLB layout:
 *   - 12-byte header: magic('glTF'), version(2), length(uint32)
 *   - JSON chunk: 4-byte length, 4-byte 'JSON', then JSON bytes
 * We parse the JSON chunk to count meshes/primitives + read min/max
 * from the position accessors (when present).
 */
function probeGlb(bytes: Buffer):
  | { triangleCount: number | null; boundingBox: { x: number; y: number; z: number } | null }
  | null {
  if (bytes.length < 20) return null;
  if (bytes.subarray(0, 4).toString("ascii") !== "glTF") return null;
  const jsonLen = bytes.readUInt32LE(12);
  if (jsonLen <= 0 || jsonLen > bytes.length - 20) return null;
  const jsonStr = bytes.subarray(20, 20 + jsonLen).toString("utf8");
  let json: { accessors?: Array<{ min?: number[]; max?: number[]; count?: number }> };
  try {
    json = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  // Sum up triangle-count proxy across position accessors. For
  // indexed primitives this overcounts; that's OK for a sanity check.
  let triangleCount = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const accessor of json.accessors ?? []) {
    if (accessor.count) triangleCount += accessor.count / 3;
    if (accessor.min && accessor.min.length === 3) {
      if (accessor.min[0]! < minX) minX = accessor.min[0]!;
      if (accessor.min[1]! < minY) minY = accessor.min[1]!;
      if (accessor.min[2]! < minZ) minZ = accessor.min[2]!;
    }
    if (accessor.max && accessor.max.length === 3) {
      if (accessor.max[0]! > maxX) maxX = accessor.max[0]!;
      if (accessor.max[1]! > maxY) maxY = accessor.max[1]!;
      if (accessor.max[2]! > maxZ) maxZ = accessor.max[2]!;
    }
  }
  const bbox =
    Number.isFinite(minX) && Number.isFinite(maxX)
      ? { x: maxX - minX, y: maxY - minY, z: maxZ - minZ }
      : null;
  return { triangleCount: Math.round(triangleCount) || null, boundingBox: bbox };
}

/**
 * Validate one attachment. Returns the result + the inferred kind so
 * the caller can write both to the order doc.
 */
export function validateAttachment(
  filename: string,
  reportedMimeType: string,
  bytes: Buffer,
): { kind: PrintfileMimeKind; validation: PrintfileValidation } {
  const issues: PrintfileValidationIssue[] = [];
  const kind = inferKind(filename, bytes);

  // Reject unknown formats with a polite issue.
  if (kind === "unknown") {
    const lower = filename.toLowerCase();
    const extOk = ACCEPTED_EXTENSIONS.some((e) => lower.endsWith(e));
    if (!extOk) issues.push("mime-mismatch");
  }

  // Size cap.
  if (bytes.byteLength > maxAttachmentBytes()) {
    issues.push("too-large");
  }

  // Geometry probe — best-effort.
  let triangleCount: number | null = null;
  let bbox: { x: number; y: number; z: number } | null = null;
  try {
    if (kind === "stl") {
      // Try binary first (more common from CAD/sliceres); fall back to ASCII.
      const bin = probeStlBinary(bytes);
      if (bin) {
        triangleCount = bin.triangleCount;
        bbox = bin.boundingBox;
      } else {
        const ascii = probeStlAscii(bytes);
        if (ascii) {
          triangleCount = ascii.triangleCount;
        } else {
          issues.push("parse-failed");
        }
      }
    } else if (kind === "glb") {
      const glb = probeGlb(bytes);
      if (glb) {
        triangleCount = glb.triangleCount;
        bbox = glb.boundingBox;
      } else {
        issues.push("parse-failed");
      }
    }
    // 3MF + OBJ: no cheap probe in v1. Accept without geometry data.
  } catch (err) {
    log.warn("geometry probe threw", { filename, err: String(err) });
    issues.push("parse-failed");
  }

  if (triangleCount !== null && triangleCount === 0) {
    issues.push("zero-triangles");
  }
  // Implausible bbox: any side > 10 metres (model units could be mm,
  // cm, or m — we can't know — but >10000 of any unit is suspicious).
  if (bbox && (bbox.x > 10_000 || bbox.y > 10_000 || bbox.z > 10_000)) {
    issues.push("implausible-bounding-box");
  }

  return {
    kind,
    validation: {
      ok: issues.length === 0,
      triangleCount,
      boundingBoxMm: bbox,
      issues,
    },
  };
}
