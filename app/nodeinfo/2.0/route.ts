/**
 * /nodeinfo/2.0 — Minimal NodeInfo 2.0 document.
 *
 * Reports the site as an ActivityPub service running a custom
 * implementation. `usage.users.total` is intentionally 1 — the studio
 * is a single-actor instance. `localPosts` reflects the entries we
 * federate (articles + journal + tutorials).
 *
 * Spec: https://nodeinfo.diaspora.software/ns/schema/2.0
 */
import { articles } from "lib/articles";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const localPosts = articles.length + journal.length + tutorials.length;

  const body = {
    version: "2.0",
    software: {
      name: "holoflow-studio",
      version: "0.1.0",
    },
    protocols: ["activitypub"],
    services: { inbound: [], outbound: ["atom1.0"] },
    openRegistrations: false,
    usage: {
      users: { total: 1, activeMonth: 1, activeHalfyear: 1 },
      localPosts,
    },
    metadata: {
      nodeName: "Holoflow Studio",
      nodeDescription:
        "Single-actor magazine — articles, journal, tutorials from a London studio.",
    },
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type":
        'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.0#"; charset=utf-8',
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
