/**
 * Cross-reference graph for the studio's site.
 *
 * Every published page on the site is a node; every `related[]` /
 * `routes[]` / `argumentRoutes[]` / `rungs[]` cross-reference between
 * two pages is an edge. The graph is built once at module load time
 * from the imported registries; the page that renders it is then a
 * pure visualisation layer.
 *
 * The graph is the studio's externalised memory made literal — the
 * "spherical puzzle, pieces linked under the surface" described in
 * the studio's own working notes, surfaced as architecture.
 *
 * The build is read-only: nothing here mutates the registries.
 */
import { articles } from "./articles";
import { journal } from "./journal";
import { tutorials } from "./tutorials";
import { loopPositions } from "./loop";
import { ladders } from "./curriculum";
import { stack } from "./stack";
import { playLevels } from "./play";
import type { Entry } from "./writing";

export type GraphNodeKind =
  | "article"
  | "journal"
  | "tutorial"
  | "route"
  | "loop-position"
  | "stack-section"
  | "play-level"
  | "curriculum-rung";

export type GraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  href: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  note?: string;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/**
 * Resolve a related-link `href` to a node `id` in this graph.
 *
 * Internal links arrive as strings like "/articles/foo", "/journal/bar",
 * "/the-loop#trail-captured", "/stack#capture-aerial", or as bare route
 * strings like "/photographs". Query-strings are stripped; hash anchors
 * resolve to in-page node ids when they correspond to a known
 * loop-position or stack-section slug.
 *
 * Returns null for external URLs (anything matching the http(s) scheme)
 * and for routes that aren't part of the indexed graph.
 */
function hrefToNodeId(href: string): string | null {
  if (/^https?:\/\//i.test(href)) return null;
  if (!href.startsWith("/")) return null;

  // Strip query string. Hash is handled specially below.
  const [pathAndHash] = href.split("?");
  if (!pathAndHash) return null;
  const [path, hash] = pathAndHash.split("#");
  if (!path) return null;

  // /articles/slug, /journal/slug, /tutorials/slug, /play/slug
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 2) {
    const [section, slug] = segments;
    if (!section || !slug) return null;
    if (section === "articles") return `article:${slug}`;
    if (section === "journal") return `journal:${slug}`;
    if (section === "tutorials") return `tutorial:${slug}`;
    if (section === "play") return `play:${slug}`;
  }

  // /the-loop#slug → loop-position
  if (path === "/the-loop" && hash) {
    return `loop:${hash}`;
  }
  // /stack#slug → stack-section
  if (path === "/stack" && hash) {
    return `stack:${hash}`;
  }

  // Plain top-level routes (e.g. /practice, /about, /aerial,
  // /photographs, /bureau, /contact, /shop/certificate, /rookery,
  // /learn, /play, /watch, /bezel, /the-loop, /stack).
  if (segments.length >= 1) {
    return `route:${path}`;
  }
  return null;
}

function entryNodeKind(entry: Entry): GraphNodeKind {
  if (entry.kind === "article") return "article";
  if (entry.kind === "journal") return "journal";
  return "tutorial";
}

function entryNodeId(entry: Entry): string {
  return `${entry.kind}:${entry.slug}`;
}

function entryNodeHref(entry: Entry): string {
  if (entry.kind === "article") return `/articles/${entry.slug}`;
  if (entry.kind === "journal") return `/journal/${entry.slug}`;
  return `/tutorials/${entry.slug}`;
}

/**
 * Build the graph from the imported registries.
 *
 * Internal nodes are produced for every entry slug in `articles`,
 * `journal`, `tutorials`; every loop position; every stack section;
 * every play level; and every curriculum rung whose `href` points at
 * a real route. Plain-route nodes (e.g. /practice) are created on
 * demand the first time a related-link references them, so the graph
 * surfaces real routes the studio cross-references without inventing
 * any.
 *
 * Edges are pulled from each entry's `related[]`, each loop
 * position's `routes[]`, each play level's `argumentRoutes[]`, and
 * each curriculum ladder's `rungs[]`. The note on each edge, when
 * present, carries the originating cross-reference's `note`.
 */
export function buildGraph(): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const upsertNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };

  const upsertRouteNode = (path: string, label?: string) => {
    const id = `route:${path}`;
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        label: label ?? path,
        kind: "route",
        href: path,
      });
    }
  };

  // 1. Entries — articles, journal, tutorials.
  const allEntries: Entry[] = [...articles, ...journal, ...tutorials];
  for (const entry of allEntries) {
    upsertNode({
      id: entryNodeId(entry),
      label: entry.title,
      kind: entryNodeKind(entry),
      href: entryNodeHref(entry),
    });
  }

  // 2. Loop positions.
  for (const position of loopPositions) {
    upsertNode({
      id: `loop:${position.slug}`,
      label: position.name,
      kind: "loop-position",
      href: `/the-loop#${position.slug}`,
    });
  }

  // 3. Stack sections.
  for (const section of stack) {
    upsertNode({
      id: `stack:${section.slug}`,
      label: section.title,
      kind: "stack-section",
      href: `/stack#${section.slug}`,
    });
  }

  // 4. Play levels.
  for (const level of playLevels) {
    upsertNode({
      id: `play:${level.slug}`,
      label: level.name,
      kind: "play-level",
      href: `/play/${level.slug}`,
    });
  }

  // 5. Curriculum rungs that resolve to a real route get a node and
  //    an edge from the ladder's top-level /learn route.
  upsertRouteNode("/learn", "Learn — the curriculum");
  for (const ladder of ladders) {
    for (const rung of ladder.rungs) {
      if (!rung.href) continue;
      const target = hrefToNodeId(rung.href);
      if (!target) continue;
      // The rung "is" the destination from the graph's point of view;
      // we mark it as a curriculum-rung node by re-tagging the kind
      // only when the destination isn't already a richer kind. In
      // practice rungs point at existing tutorial / article / route
      // nodes that have already been created above; we just add the
      // edge from /learn → target, annotated with the ladder name.
      edges.push({
        from: "route:/learn",
        to: target,
        note: `${ladder.title} — ${rung.title}`,
      });
    }
  }

  // 6. Edges from entries' related[].
  for (const entry of allEntries) {
    const fromId = entryNodeId(entry);
    const related = entry.related ?? [];
    for (const link of related) {
      const toId = hrefToNodeId(link.href);
      if (!toId) continue;
      // If the related link points at a bare route we don't already
      // know about, create a route node so the edge has a destination.
      if (toId.startsWith("route:") && !nodes.has(toId)) {
        const [, path] = toId.split(":", 2);
        if (path) upsertRouteNode(path, link.label);
      }
      if (!nodes.has(toId)) continue;
      if (toId === fromId) continue;
      edges.push({ from: fromId, to: toId, note: link.note });
    }
  }

  // 7. Edges from loop positions' routes[].
  for (const position of loopPositions) {
    const fromId = `loop:${position.slug}`;
    for (const route of position.routes) {
      if (!route.href) continue;
      const toId = hrefToNodeId(route.href);
      if (!toId) continue;
      if (toId.startsWith("route:") && !nodes.has(toId)) {
        const [, path] = toId.split(":", 2);
        if (path) upsertRouteNode(path, route.label);
      }
      if (!nodes.has(toId)) continue;
      if (toId === fromId) continue;
      edges.push({ from: fromId, to: toId, note: route.note });
    }
  }

  // 8. Edges from play levels' argumentRoutes[].
  for (const level of playLevels) {
    const fromId = `play:${level.slug}`;
    for (const arg of level.argumentRoutes) {
      const toId = hrefToNodeId(arg.href);
      if (!toId) continue;
      if (toId.startsWith("route:") && !nodes.has(toId)) {
        const [, path] = toId.split(":", 2);
        if (path) upsertRouteNode(path, arg.label);
      }
      if (!nodes.has(toId)) continue;
      if (toId === fromId) continue;
      edges.push({ from: fromId, to: toId });
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

export const graph: Graph = buildGraph();

/**
 * Inbound + outbound count for a node id. Treats the edge list as
 * undirected for the purpose of "how central is this piece"; an article
 * that is referenced from five other pieces is as much a hub as one
 * that references five others, and the visualisation is more honest
 * if it treats them the same way.
 */
export function nodeDegree(id: string): number {
  let count = 0;
  for (const edge of graph.edges) {
    if (edge.from === id) count++;
    if (edge.to === id) count++;
  }
  return count;
}

/**
 * Top-N most-connected nodes, sorted by descending undirected degree.
 * Stable across reloads because the underlying registries are sorted.
 */
export function mostConnected(n: number): GraphNode[] {
  const ranked = graph.nodes
    .map((node) => ({ node, degree: nodeDegree(node.id) }))
    .sort((a, b) => b.degree - a.degree || a.node.id.localeCompare(b.node.id))
    .slice(0, n);
  return ranked.map((r) => r.node);
}

/**
 * Nodes with zero inbound and zero outbound edges. These are the gaps
 * the site's editorial team should know about; a node with degree
 * zero is a page nothing else points at and which points at nothing.
 */
export function orphans(): GraphNode[] {
  return graph.nodes.filter((node) => nodeDegree(node.id) === 0);
}
