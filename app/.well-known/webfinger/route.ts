/**
 * /.well-known/webfinger — Discovery endpoint for the Fediverse.
 *
 * A Mastodon user types `@studio@holoflow.co.uk`. Their server hits
 *
 *   GET /.well-known/webfinger?resource=acct:studio@holoflow.co.uk
 *
 * and expects a JRD (JSON Resource Descriptor) that points at the
 * ActivityPub actor document. That's all this route does.
 *
 * Spec: RFC 7033.
 */
import {
  actorAcct,
  actorUrls,
  ACTOR_DOMAIN,
  ACTOR_HANDLE,
  isKnownHandle,
} from "lib/federation/actor";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");
  if (!resource) {
    return new Response("missing `resource` query parameter", { status: 400 });
  }

  const parsed = parseAcct(resource);
  if (!parsed) {
    return new Response("unsupported resource — expected acct: URI", {
      status: 400,
    });
  }

  if (parsed.domain.toLowerCase() !== ACTOR_DOMAIN.toLowerCase()) {
    return new Response("unknown domain", { status: 404 });
  }

  if (!isKnownHandle(parsed.handle)) {
    return new Response("unknown account", { status: 404 });
  }

  const urls = actorUrls(parsed.handle);
  const body = {
    subject: actorAcct(parsed.handle),
    aliases: [urls.id, urls.url],
    links: [
      {
        rel: "self",
        type: "application/activity+json",
        href: urls.id,
      },
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: urls.url,
      },
    ],
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/jrd+json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
      "access-control-allow-origin": "*",
    },
  });
}

function parseAcct(
  resource: string,
): { handle: string; domain: string } | null {
  if (!resource.startsWith("acct:")) return null;
  const rest = resource.slice("acct:".length);
  const at = rest.indexOf("@");
  if (at <= 0 || at === rest.length - 1) return null;
  return {
    handle: rest.slice(0, at) || ACTOR_HANDLE,
    domain: rest.slice(at + 1),
  };
}
