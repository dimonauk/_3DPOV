/**
 * components/sphere/sphere-scene-fallback.tsx — WebGL-unavailable fallback.
 *
 * When the browser has no WebGL, surface the twelve most-connected pieces
 * of the site as plain links so the central hubs are still reachable.
 */

import { useMemo } from "react";

import { graph, nodeDegree } from "lib/graph";

export function WebglFallback() {
  const top = useMemo(() => {
    return graph.nodes
      .map((node) => ({ node, degree: nodeDegree(node.id) }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 12);
  }, []);
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-950/60 p-8 text-chrome-300">
      <div className="chrome-label text-pink-200">
        WebGL unavailable &mdash; text fallback
      </div>
      <p className="mt-3 text-sm text-chrome-400">
        The 3D sphere needs a browser with WebGL. The twelve most connected
        pieces of the site are listed below as plain links so the central
        hubs are still reachable.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {top.map(({ node, degree }) => (
          <li key={node.id}>
            <a
              href={node.href}
              className="text-chrome-100 underline underline-offset-4 hover:text-pink-200"
            >
              {node.label}
            </a>
            <span className="ml-3 font-mono text-xs text-chrome-500">
              degree {degree}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
