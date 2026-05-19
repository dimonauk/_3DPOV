/**
 * /.well-known/nodeinfo — Pointer to the actual NodeInfo document.
 *
 * Servers discover NodeInfo by GETting this path and following the
 * `links[].href` for the version they speak. We expose only 2.0.
 *
 * Spec: http://nodeinfo.diaspora.software/protocol.html
 */
import { SITE_URL } from "lib/feed/atom";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const body = {
    links: [
      {
        rel: "http://nodeinfo.diaspora.software/ns/schema/2.0",
        href: `${SITE_URL}/nodeinfo/2.0`,
      },
    ],
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
