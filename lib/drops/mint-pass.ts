/**
 * lib/drops/mint-pass.ts — Apple Wallet pass minting (identity layer).
 *
 * One-line role: given a drop + an edition number + parentage chain,
 * return a signed pass record. The signed pass is the identity carrier
 * for the buyer's edition — it does NOT carry the entitlement (the
 * entitlement is account-bound on Rookery, per Manifesto §05).
 *
 * # Why identity-only
 *
 * Passes can be shared, screenshotted, AirDropped. If the pass *was*
 * the entitlement, anyone with the screenshot could claim the piece.
 * Instead:
 *
 *   - The pass signs `{ dropId, editionNumber, parentageChain, genomeId,
 *     mintedAt }` — enough to prove "this pass was issued by the studio
 *     for edition N of drop D".
 *   - The actual entitlement (the can-buy / can-display-AR / can-claim
 *     access) lives on the buyer's Firebase user doc at
 *     `users/{uid}/editions/{dropId}-{editionNumber}`.
 *   - When the buyer presents the pass, we verify the signature and
 *     look up the entitlement on Firestore.
 *
 * # When this runs
 *
 * Drops are *published* first (the publish flow records the edition
 * counts but does NOT mint passes). Passes are minted at
 * first-buyer-claim time so cancelled / never-bought edition slots
 * never burn a signing operation.
 *
 * # Stub today
 *
 * `passkit-generator@3.5.7` is in the Holoflow deps but the studio's
 * Apple Wallet certificate + WWDR intermediate haven't been wired into
 * env yet. This function returns the record shape that the real
 * implementation will return — with a `passBlob` placeholder that the
 * caller can persist to Firestore and later re-mint when the cert is
 * available. The signed pass is the .pkpass binary; we store it as a
 * base64 blob alongside its metadata.
 *
 * # Real implementation outline (when certs land)
 *
 * ```ts
 * import { PKPass } from "passkit-generator";
 * const pass = await PKPass.from({
 *   model: "./pass-templates/edition.pass",
 *   certificates: {
 *     wwdr: process.env.APPLE_WWDR_PEM,
 *     signerCert: process.env.APPLE_SIGNER_PEM,
 *     signerKey: process.env.APPLE_SIGNER_KEY_PEM,
 *     signerKeyPassphrase: process.env.APPLE_SIGNER_PASSPHRASE,
 *   },
 *   overrides: {
 *     serialNumber: `${dropId}-${editionNumber}`,
 *     organizationName: "Holoflow Studio",
 *     description: `Edition ${editionNumber} of ${dropId}`,
 *   },
 * });
 * pass.setBarcodes({
 *   format: "PKBarcodeFormatQR",
 *   message: JSON.stringify({ dropId, editionNumber, genomeId, mintedAt }),
 * });
 * const buffer = pass.getAsBuffer();
 * return { ..., passBlobBase64: buffer.toString("base64") };
 * ```
 */

import "server-only";

import { randomUUID, createHash } from "node:crypto";

/**
 * Inputs needed to mint an edition pass.
 */
export type MintEditionPassInput = {
  /** Stable drop id. Becomes part of the pass serial number. */
  dropId: string;
  /** 1-indexed edition number within the drop's edition pool.
   *  Unique = 0, Limited = 1..N, Open = N+1..∞. */
  editionNumber: number;
  /** Cached parentage chain for provenance display on the pass back. */
  parentageChain: ReadonlyArray<string>;
  /** Genome id this edition derives from. */
  genomeId: string;
};

/**
 * The persisted record after minting. The `passBlobBase64` field holds
 * the .pkpass binary; clients fetch it via a signed URL handler that
 * sets `Content-Type: application/vnd.apple.pkpass`.
 */
export type SignedPassRecord = {
  /** Stable pass id — used as the Firestore doc id under
   *  `drops/{dropId}/editions/{passId}`. */
  passId: string;
  /** Serial number used inside the .pkpass — kebab-case of the drop +
   *  edition number for human readability when debugging. */
  serialNumber: string;
  dropId: string;
  editionNumber: number;
  genomeId: string;
  parentageChain: ReadonlyArray<string>;
  /** SHA-256 hash of the canonicalised identity payload. Doubles as
   *  a tamper-detection field — re-hash the payload at verify time
   *  and compare. */
  identityHash: string;
  /** Base64 of the signed .pkpass binary. Empty string today —
   *  populated once certs are wired. */
  passBlobBase64: string;
  /** Sentinel string indicating which mint path produced this record.
   *  When the real cert chain is wired this becomes "passkit-generator".
   *  Today's stub records "stub-pending-certs" so log queries can find
   *  every record that needs re-minting once certs land. */
  mintedBy: "stub-pending-certs" | "passkit-generator";
  /** ISO 8601 timestamp. */
  mintedAt: string;
};

/**
 * Mint an Apple Wallet pass for one edition slot.
 *
 * Today's behaviour: deterministic identity hash + empty pass blob.
 * When `passkit-generator` is wired this body builds the .pkpass and
 * fills `passBlobBase64`. The record shape (and the identity hash
 * computation) does not change between stub and real.
 */
export async function mintEditionPass(
  input: MintEditionPassInput,
): Promise<SignedPassRecord> {
  const { dropId, editionNumber, parentageChain, genomeId } = input;

  if (!dropId || typeof dropId !== "string") {
    throw new Error("mintEditionPass: dropId is required");
  }
  if (!Number.isInteger(editionNumber) || editionNumber < 0) {
    throw new Error("mintEditionPass: editionNumber must be a non-negative integer");
  }
  if (!genomeId || typeof genomeId !== "string") {
    throw new Error("mintEditionPass: genomeId is required");
  }

  const mintedAt = new Date().toISOString();
  const passId = randomUUID();
  const serialNumber = `${dropId}-${editionNumber}`;

  // Canonical identity payload. Field order is fixed so the same
  // inputs always hash to the same value — the verifier re-computes
  // the hash from the displayed fields.
  const canonical = JSON.stringify({
    dropId,
    editionNumber,
    genomeId,
    parentageChain: [...parentageChain],
    mintedAt,
  });
  const identityHash = createHash("sha256").update(canonical).digest("hex");

  // TODO when Apple Wallet certs land: replace this block with the
  // passkit-generator call documented in the file header. The shape
  // returned here is stable — only `passBlobBase64` and `mintedBy`
  // change.
  const passBlobBase64 = "";

  return {
    passId,
    serialNumber,
    dropId,
    editionNumber,
    genomeId,
    parentageChain,
    identityHash,
    passBlobBase64,
    mintedBy: "stub-pending-certs",
    mintedAt,
  };
}
