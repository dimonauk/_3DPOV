/**
 * /users/[handle] — ActivityPub actor document.
 *
 * Mastodon hits this after resolving WebFinger and expects the actor
 * JSON: id, type (Person/Service), inbox/outbox URLs, and the
 * publicKey that other servers use to verify HTTP signatures on
 * activities we deliver to them.
 *
 * Type chosen: Service. The studio is a publication, not a person —
 * Service signals "automated/bot-ish account that publishes content"
 * which is what this account is. Mastodon renders Service accounts
 * normally; some clients show a small bot badge.
 */
import { SITE_URL } from "lib/feed/atom";
import {
  ACTOR_DISPLAY_NAME,
  ACTOR_HANDLE,
  ACTOR_SUMMARY,
  actorUrls,
  isKnownHandle,
  readActorKeys,
} from "lib/federation/actor";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, { params }: Params): Promise<Response> {
  const { handle } = await params;
  if (!isKnownHandle(handle)) {
    return jsonError(404, "unknown account");
  }

  const keys = readActorKeys();
  if (!keys) {
    return jsonError(
      503,
      "Federation keys not provisioned. Set FEDIVERSE_ACTOR_PUBLIC_KEY and FEDIVERSE_ACTOR_PRIVATE_KEY — see docs/FEDERATION.md.",
    );
  }

  const urls = actorUrls(handle);
  const body = {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
    ],
    id: urls.id,
    type: "Service",
    preferredUsername: ACTOR_HANDLE,
    name: ACTOR_DISPLAY_NAME,
    summary: ACTOR_SUMMARY,
    url: urls.url,
    inbox: urls.inbox,
    outbox: urls.outbox,
    followers: urls.followers,
    following: urls.following,
    manuallyApprovesFollowers: false,
    discoverable: true,
    indexable: true,
    published: "2026-01-01T00:00:00Z",
    icon: {
      type: "Image",
      mediaType: "image/png",
      url: `${SITE_URL}/icon.png`,
    },
    publicKey: {
      id: urls.publicKeyId,
      owner: urls.id,
      publicKeyPem: keys.publicKeyPem,
    },
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type":
        'application/activity+json; profile="https://www.w3.org/ns/activitystreams"; charset=utf-8',
      "cache-control": "public, max-age=300, s-maxage=300",
      "access-control-allow-origin": "*",
    },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
