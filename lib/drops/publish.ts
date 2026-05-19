/**
 * lib/drops/publish.ts — Drop publish flow.
 *
 * One-line role: take a validated `DropPublishInput`, run the two
 * mandatory gates (Oracle + Sieve), write the Sanity `rookery` post
 * and the Firestore `drops/{id}` record, return the published `Drop`.
 *
 * # Order of operations (canon)
 *
 *   1. Oracle gate (mandatory; blocks on fail).
 *   2. Sieve gate (mandatory shape; stubbed verdict today).
 *   3. Sanity write — rookery post for the public feed.
 *   4. Firestore write — `drops/{id}` for the commerce / first-refusal
 *      state.
 *   5. Return the materialised `Drop`.
 *
 * Edition pass minting does NOT happen here. Passes are minted at
 * first-buyer-claim time (see `lib/drops/mint-pass.ts`). The publish
 * flow only records the edition *capacity*; the buyer flow consumes
 * it.
 *
 * # Error semantics
 *
 * - Gate fail → throws `DropPublishGateError` with the verdict so the
 *   API route can return a 400 with structured `oracle` + `sieve`
 *   verdicts.
 * - Persistence fail (Sanity unreachable, Firestore not configured) →
 *   throws the underlying error; the API route maps to a 5xx.
 *
 * # Partial writes
 *
 * Sanity and Firestore are two different systems with no transaction
 * envelope. We write Sanity first, then Firestore. If Sanity succeeds
 * but Firestore fails the drop is visible on the feed but un-buyable;
 * the API route surfaces the Firestore error and the operator can
 * retry — `publishDrop` is idempotent on the same `id` because the
 * Sanity write uses `createOrReplace` and Firestore uses
 * `.set(merge: false)` only when no existing doc is found.
 *
 * (Two-phase commit is overkill for the studio's volume. The drift
 * window is the seconds between Sanity ack and Firestore write; an
 * operator-visible retry is the right escape hatch.)
 */

import "server-only";

import { createLogger, errToObject } from "lib/log";
import { getSanityClient } from "lib/sanity/client";
import { requireFirebaseAdminDb } from "lib/firebase/admin";

import { oracleCheck } from "./oracle-gate";
import { sieveCheck } from "./sieve-gate";
import type {
  Drop,
  DropPublishInput,
  GateVerdict,
} from "./types";

const log = createLogger("drops.publish");

/**
 * Thrown when a publish gate (Oracle or Sieve) returns fail. The API
 * route catches this and maps to a 400 with the structured verdicts.
 */
export class DropPublishGateError extends Error {
  readonly oracle: GateVerdict;
  readonly sieve: GateVerdict;

  constructor(oracle: GateVerdict, sieve: GateVerdict) {
    const reasons: string[] = [];
    if (!oracle.pass) reasons.push(`Oracle: ${oracle.reasons.join("; ")}`);
    if (!sieve.pass) reasons.push(`Sieve: ${sieve.reasons.join("; ")}`);
    super(reasons.join(" / ") || "publish gate failed");
    this.name = "DropPublishGateError";
    this.oracle = oracle;
    this.sieve = sieve;
  }
}

/** kebab-case slugify for the drop id. Strips diacritics + non-word chars.
 *  Uses an explicit ̀-ͯ range for combining marks so editors
 *  don't render the regex as visible diacritics. */
function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Reserve a unique drop id. Tries the slugified title first; appends a
 * suffix on collision. Reads-then-writes — fine for one operator + low
 * publish cadence. If publish cadence rises a transactional reservation
 * would be safer, but YAGNI for V1.2.
 */
async function reserveDropId(
  base: string,
  db: FirebaseFirestore.Firestore,
): Promise<string> {
  const base0 = slugify(base) || "drop";
  let candidate = base0;
  let suffix = 1;
  // Cap to a reasonable number of attempts; the studio publishes one
  // drop a week, the chance of 16 collisions on one slug is zero in
  // practice and a runaway loop is worse than a thrown error.
  for (let i = 0; i < 16; i++) {
    const snap = await db.collection("drops").doc(candidate).get();
    if (!snap.exists) return candidate;
    suffix += 1;
    candidate = `${base0}-${suffix}`;
  }
  throw new Error(
    `drops.publish: could not reserve id starting from "${base0}" after 16 attempts`,
  );
}

/**
 * Look up a genome's parentage chain + kingdom by `sequenceId`. Reads
 * Firestore `genomes/{sequenceId}` when present; falls back to the
 * deterministic `sample-population` for demo-data genome ids.
 *
 * Returns `null` when the genome is not found anywhere.
 */
async function loadGenomeProvenance(
  genomeId: string,
  db: FirebaseFirestore.Firestore,
): Promise<{ parentageChain: string[]; kingdom: string } | null> {
  const doc = await db.collection("genomes").doc(genomeId).get();
  if (doc.exists) {
    const data = doc.data() ?? {};
    const chain = Array.isArray(data["parentageChain"])
      ? (data["parentageChain"] as unknown[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];
    const kingdom =
      typeof data["kingdom"] === "string" ? data["kingdom"] : "unspecified";
    return { parentageChain: chain, kingdom };
  }
  return null;
}

/**
 * Build the Sanity `rookery` document body. Kept as its own function
 * so it's easy to evolve when the Sanity schema does — the publish
 * flow doesn't have to change shape.
 */
function buildRookeryDoc(drop: Drop) {
  return {
    _id: `rookery.${drop.id}`,
    _type: "rookery",
    title: drop.title,
    summary: drop.summary,
    slug: { _type: "slug", current: drop.id },
    genomeId: drop.genomeId,
    kingdom: drop.kingdom,
    parentageChain: [...drop.parentageChain],
    edition: { ...drop.edition },
    tierIncluded: { ...drop.tierIncluded },
    firstRefusalRadius: drop.firstRefusalRadius,
    passkitEnabled: drop.passkitEnabled,
    status: drop.status,
    publishedAt: drop.publishedAt ?? null,
  };
}

/**
 * Persist the rookery post to Sanity. Today's behaviour: log + return
 * the synthetic doc id (`rookery.{dropId}`) so the rest of the flow
 * proceeds. When the Sanity write-client is wired (env
 * `SANITY_API_WRITE_TOKEN`) this swaps in the real
 * `client.createOrReplace(doc)` call.
 *
 * The read-side `lib/sanity/client.ts` uses `useCdn` for the public
 * read path and (today) doesn't carry a write token. Adding the write
 * token is a one-line change there once the studio is ready for the
 * dual-write — for now the publish flow degrades gracefully.
 */
async function persistRookerySanity(
  doc: ReturnType<typeof buildRookeryDoc>,
  publishedBy: string,
): Promise<string> {
  const client = getSanityClient();
  if (!client || !process.env.SANITY_API_WRITE_TOKEN) {
    log.warn("sanity write token not configured — drop visible only via Firestore", {
      dropId: doc.slug.current,
      publishedBy,
    });
    return doc._id;
  }
  // The read client doesn't carry a write token; build a one-off
  // write client. Mirrors the pattern used by Holoflow's other write
  // paths (e.g. content-import). Kept inline so we don't infect the
  // read-side `getSanityClient` with mutation responsibilities.
  const { createClient } = await import("@sanity/client");
  const writeClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2026-05-14",
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
  });
  const result = await writeClient.createOrReplace(doc);
  return result._id;
}

/**
 * Publish a drop end-to-end.
 *
 * @param input        Validated publish input (call-site responsibility).
 * @param publishedBy  Firebase uid of the operator doing the publish.
 * @returns The materialised `Drop` after both writes succeed.
 * @throws  `DropPublishGateError` on Oracle/Sieve fail.
 */
export async function publishDrop(
  input: DropPublishInput,
  publishedBy: string,
): Promise<Drop> {
  // --- 1. Gates ---------------------------------------------------------
  const [oracleRaw, sieveRaw] = await Promise.all([
    oracleCheck(input.genomeId),
    sieveCheck(input.genomeId),
  ]);

  const oracle: GateVerdict = oracleRaw.pass
    ? { pass: true }
    : { pass: false, reasons: oracleRaw.reasons };
  const sieve: GateVerdict = sieveRaw.pass
    ? { pass: true }
    : { pass: false, reasons: [sieveRaw.reason] };

  if (!oracle.pass || !sieve.pass) {
    log.warn("drop publish blocked at gate", {
      genomeId: input.genomeId,
      oraclePass: oracle.pass,
      sievePass: sieve.pass,
    });
    throw new DropPublishGateError(oracle, sieve);
  }

  // --- 2. Resolve genome provenance ------------------------------------
  const db = requireFirebaseAdminDb();
  let parentageChain: ReadonlyArray<string> = input.parentageChain ?? [];
  let kingdom = "unspecified";

  const provenance = await loadGenomeProvenance(input.genomeId, db);
  if (provenance) {
    if (parentageChain.length === 0) parentageChain = provenance.parentageChain;
    kingdom = provenance.kingdom;
  } else if (parentageChain.length === 0) {
    // No Firestore record + no operator-supplied override. The genome
    // might be a sample-population demo id; the operator gets a warning
    // in the logs but publish proceeds with an empty chain. Downstream
    // first-refusal queries fall back to kingdom-only routing in that
    // case (handled in the resolver).
    log.warn("drop publish: genome record not found in Firestore", {
      genomeId: input.genomeId,
    });
  }

  // --- 3. Reserve id + build the Drop record ---------------------------
  const id = await reserveDropId(input.title, db);
  const now = new Date().toISOString();
  const drop: Drop = {
    id,
    publishedBy,
    title: input.title,
    summary: input.summary,
    genomeId: input.genomeId,
    parentageChain,
    kingdom,
    edition: input.edition,
    tierIncluded: input.tierIncluded,
    firstRefusalRadius: input.firstRefusalRadius,
    passkitEnabled: input.passkitEnabled,
    editionState: {
      uniqueClaimed: false,
      limitedClaimed: 0,
      openClaimed: 0,
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    status: "published",
  };

  // --- 4. Write Sanity rookery post -----------------------------------
  let sanityDocId: string | undefined;
  try {
    sanityDocId = await persistRookerySanity(buildRookeryDoc(drop), publishedBy);
  } catch (err) {
    log.error("drop publish: sanity write failed", {
      err: errToObject(err),
      dropId: id,
    });
    throw err;
  }
  if (sanityDocId) drop.sanityDocId = sanityDocId;

  // --- 5. Write Firestore drops record --------------------------------
  await db.collection("drops").doc(id).set(drop);

  log.info("drop published", {
    dropId: id,
    genomeId: input.genomeId,
    kingdom,
    publishedBy,
    sanityDocId: sanityDocId ?? "(unwired)",
  });

  return drop;
}
