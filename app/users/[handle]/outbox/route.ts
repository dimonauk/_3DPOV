/**
 * /users/[handle]/outbox — Paginated OrderedCollection of the
 * studio's recent Notes.
 *
 * Spec: ActivityStreams 2.0 collection paging. Default GET returns
 * the collection summary (totalItems + first/last page URLs). GET
 * with `?page=1` returns the first ordered page.
 *
 * Page size is intentionally modest — Mastodon backfills follow
 * accepts by walking the outbox, and big pages slow that down.
 */
import { articles } from "lib/articles";
import { actorUrls, isKnownHandle } from "lib/federation/actor";
import { buildCreate } from "lib/federation/notes";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";
import type { Entry } from "lib/writing";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Params = { params: Promise<{ handle: string }> };

function allEntries(): Entry[] {
  return [...articles, ...journal, ...tutorials].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
}

export async function GET(req: Request, { params }: Params): Promise<Response> {
  const { handle } = await params;
  if (!isKnownHandle(handle)) {
    return new Response("unknown account", { status: 404 });
  }

  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const entries = allEntries();
  const totalItems = entries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const urls = actorUrls(handle);

  if (!pageParam) {
    // Collection summary — points at first / last pages.
    const body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: urls.outbox,
      type: "OrderedCollection",
      totalItems,
      first: `${urls.outbox}?page=1`,
      last: `${urls.outbox}?page=${totalPages}`,
    };
    return jsonResponse(body);
  }

  const page = clampPage(parseInt(pageParam, 10), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const slice = entries.slice(start, start + PAGE_SIZE);

  const body = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${urls.outbox}?page=${page}`,
    type: "OrderedCollectionPage",
    partOf: urls.outbox,
    next: page < totalPages ? `${urls.outbox}?page=${page + 1}` : undefined,
    prev: page > 1 ? `${urls.outbox}?page=${page - 1}` : undefined,
    orderedItems: slice.map(buildCreate),
  };

  return jsonResponse(body);
}

function clampPage(raw: number, totalPages: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  if (raw > totalPages) return totalPages;
  return Math.floor(raw);
}

function jsonResponse(body: unknown): Response {
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
