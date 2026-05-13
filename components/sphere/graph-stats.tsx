import Link from "next/link";
import {
  graph,
  mostConnected,
  nodeDegree,
  orphans,
  type GraphNodeKind,
} from "lib/graph";

const KIND_LABELS: Record<GraphNodeKind, string> = {
  article: "article",
  journal: "journal",
  tutorial: "tutorial",
  route: "route",
  "loop-position": "loop position",
  "stack-section": "stack section",
  "play-level": "play level",
  "curriculum-rung": "curriculum rung",
};

export default function GraphStats() {
  const totalNodes = graph.nodes.length;
  const totalEdges = graph.edges.length;
  const topFive = mostConnected(5);
  const orphanList = orphans();

  // Kind tally — gives the visitor a sense of what populates the
  // sphere without reading the full registry.
  const kindCounts = new Map<GraphNodeKind, number>();
  for (const node of graph.nodes) {
    kindCounts.set(node.kind, (kindCounts.get(node.kind) ?? 0) + 1);
  }

  return (
    <section className="mt-16">
      <div className="chrome-label mb-3 text-chrome-500">Stats</div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <Stat label="Nodes" value={String(totalNodes)} />
        <Stat label="Edges" value={String(totalEdges)} />
        <Stat
          label="Avg. degree"
          value={
            totalNodes > 0
              ? ((totalEdges * 2) / totalNodes).toFixed(1)
              : "0"
          }
        />
        <Stat
          label="Orphans"
          value={String(orphanList.length)}
        />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <div className="chrome-label mb-3 text-chrome-500">
            Top five hubs
          </div>
          <ol className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            {topFive.map((node, i) => {
              const degree = nodeDegree(node.id);
              return (
                <li key={node.id} className="py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-chrome-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={node.href}
                      className="text-chrome-100 underline underline-offset-4 hover:text-pink-200"
                    >
                      {node.label}
                    </Link>
                    <span className="chrome-label text-[0.6rem] text-chrome-500">
                      {KIND_LABELS[node.kind]}
                    </span>
                    <span className="ml-auto font-mono text-xs text-chrome-400">
                      degree {degree}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <div className="chrome-label mb-3 text-chrome-500">
            Node kinds in the sphere
          </div>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            {Array.from(kindCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([kind, count]) => (
                <li
                  key={kind}
                  className="flex items-baseline justify-between py-3"
                >
                  <span className="text-chrome-200">
                    {KIND_LABELS[kind]}
                  </span>
                  <span className="font-mono text-xs text-chrome-400">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {orphanList.length > 0 ? (
        <div className="mt-10">
          <div className="chrome-label mb-3 text-chrome-500">
            Orphans &mdash; nodes with no edges
          </div>
          <p className="mb-3 max-w-prose text-sm text-chrome-400">
            These pages sit in the registries but neither point at
            anything on the site nor are pointed at from anything. They
            are the gaps in the cross-reference graph; the studio reads
            this list as the next set of editorial tickets.
          </p>
          <ul className="divide-y divide-warm-black-800 border-y border-warm-black-800">
            {orphanList.map((node) => (
              <li key={node.id} className="py-3">
                <div className="flex items-baseline gap-3">
                  <Link
                    href={node.href}
                    className="text-chrome-200 underline underline-offset-4 hover:text-pink-200"
                  >
                    {node.label}
                  </Link>
                  <span className="chrome-label text-[0.6rem] text-chrome-500">
                    {KIND_LABELS[node.kind]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
      <div className="chrome-label text-[0.6rem] text-chrome-500">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl text-chrome-100">
        {value}
      </div>
    </div>
  );
}
