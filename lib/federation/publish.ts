/**
 * lib/federation/publish.ts — Stub for the outgoing-activity path.
 *
 * Calling `publishCreate(entry)` builds a Create activity wrapping a
 * Note (via lib/federation/notes.ts) and would POST it to each
 * follower's shared inbox with an HTTP signature.
 *
 * What's stubbed:
 *  - follower discovery (we don't have a follower store yet — see
 *    app/users/[handle]/inbox/route.ts for where Follow lands)
 *  - HTTP signature signing (RFC 9421 draft / Mastodon's draft-cavage
 *    flavour). Needs the private key from readActorKeys() and a
 *    signing routine over (request-target), host, date, digest.
 *
 * The shape is here so a later session can fill in the two TODOs
 * without rewriting the call sites.
 */
import type { Entry } from "lib/writing";

import { readActorKeys } from "./actor";
import { buildCreate, type ApCreate } from "./notes";

export type PublishResult = {
  activity: ApCreate;
  delivered: number;
  skipped: number;
  reason?: string;
};

export async function publishCreate(entry: Entry): Promise<PublishResult> {
  const activity = buildCreate(entry);

  const keys = readActorKeys();
  if (!keys) {
    return {
      activity,
      delivered: 0,
      skipped: 0,
      reason:
        "FEDIVERSE_ACTOR_PRIVATE_KEY not set — activity built but not sent.",
    };
  }

  // TODO(federation/followers): pull follower inbox URLs from a real
  // store. Today the inbox handler logs Follow requests but doesn't
  // persist anything, so this list is always empty.
  const followerInboxes: string[] = await listFollowerInboxes();

  let delivered = 0;
  let skipped = 0;
  for (const inbox of followerInboxes) {
    try {
      // TODO(federation/http-signature): sign with keys.privateKeyPem
      // per draft-cavage-http-signatures-12. For now we only build
      // the request and skip sending so we don't ship unsigned POSTs
      // that every modern Fediverse server will reject.
      const _req = buildDeliveryRequest(inbox, activity);
      skipped += 1;
    } catch {
      skipped += 1;
    }
  }

  return {
    activity,
    delivered,
    skipped,
    reason:
      followerInboxes.length === 0
        ? "No followers persisted yet — activity built, nothing to deliver."
        : "HTTP-signature signing not wired — activity built, delivery skipped.",
  };
}

async function listFollowerInboxes(): Promise<string[]> {
  // TODO(federation/followers): swap for Upstash / Vercel KV /
  // wherever the persistent follower set lands.
  return [];
}

function buildDeliveryRequest(inbox: string, activity: ApCreate): Request {
  return new Request(inbox, {
    method: "POST",
    headers: {
      "content-type": "application/activity+json",
      accept: "application/activity+json",
    },
    body: JSON.stringify(activity),
  });
}
