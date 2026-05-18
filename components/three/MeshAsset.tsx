"use client";

/**
 * <MeshAsset id="..." /> — registry-backed 3D mesh embed.
 *
 * Resolves the asset by id from data/assets.json and renders a
 * model-viewer for it. For google-drive entries the URL is routed
 * through /api/assets/proxy/[id] so the browser doesn't fight Drive's
 * Content-Disposition headers + cross-origin policy.
 *
 * Use this for any catalogue mesh embedded in a page (articles,
 * journal entries, product pages, etc.). For one-off direct URLs that
 * aren't registry assets, use <model-viewer> directly.
 */

import { useEffect, useRef } from "react";

import { getAsset, isRemoteHost } from "lib/assets/resolve";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}

export type MeshAssetProps = {
  /** Asset id from data/assets.json. */
  id: string;
  /** Alt text. Falls back to the asset's name. */
  alt?: string;
  /** Height of the viewer. Defaults to 60vh. */
  height?: string;
  /** Disable auto-rotate. Defaults to rotating. */
  noAutoRotate?: boolean;
  /** Disable the AR button + ar-modes. Defaults to AR enabled. */
  noAR?: boolean;
};

export default function MeshAsset({
  id,
  alt,
  height = "60vh",
  noAutoRotate = false,
  noAR = false,
}: MeshAssetProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    import("@google/model-viewer").catch(() => {
      /* swallow — viewer just won't upgrade; the <model-viewer> tag
         degrades to a non-interactive placeholder. */
    });
  }, []);

  const asset = getAsset(id);

  if (!asset) {
    return (
      <div className="mesh-asset-missing">
        <p>Asset not found: <code>{id}</code></p>
        <style jsx>{`
          .mesh-asset-missing {
            padding: 1rem;
            border: 1px dashed #888;
            border-radius: 0.5rem;
            color: #888;
            font-family: system-ui, sans-serif;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  if (asset.kind !== "mesh") {
    return (
      <div className="mesh-asset-wrongkind">
        <p>
          <code>{id}</code> is a {asset.kind}, not a mesh — use a
          different component (e.g. &lt;BlendAsset&gt; for .blend files).
        </p>
        <style jsx>{`
          .mesh-asset-wrongkind {
            padding: 1rem;
            border: 1px dashed #c80;
            border-radius: 0.5rem;
            color: #c80;
            font-family: system-ui, sans-serif;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  // Drive-hosted meshes route through the proxy so the browser sees a
  // same-origin URL with normal model/gltf-binary content-type instead
  // of Drive's attachment headers + login redirects.
  const src =
    asset.host === "google-drive"
      ? `/api/assets/proxy/${encodeURIComponent(asset.id)}`
      : asset.url;

  const showAR = !noAR && (asset.format === "glb" || asset.format === "gltf");

  return (
    <div className="mesh-asset-root">
      <model-viewer
        src={src}
        alt={alt ?? asset.name}
        ar={showAR ? "true" : undefined}
        ar-modes={showAR ? "scene-viewer webxr quick-look" : undefined}
        ar-scale="auto"
        camera-controls="true"
        camera-orbit="0deg 75deg 145%"
        auto-rotate={noAutoRotate ? undefined : "true"}
        auto-rotate-delay={noAutoRotate ? undefined : "0"}
        rotation-per-second={noAutoRotate ? undefined : "12deg"}
        autoplay="true"
        interaction-prompt="none"
        interpolation-decay="200"
        shadow-intensity="0.9"
        environment-image="neutral"
        exposure="1.0"
        loading={isRemoteHost(asset.host) ? "lazy" : "auto"}
        reveal="auto"
        style={{
          width: "100%",
          height,
          minHeight: "320px",
          background:
            "linear-gradient(135deg, rgba(180,160,255,0.08), rgba(120,200,255,0.05))",
          borderRadius: "0.75rem",
        }}
      >
        {showAR ? (
          <button slot="ar-button" className="mesh-asset-ar-btn">
            📱 Place in your space
          </button>
        ) : null}
      </model-viewer>

      <style jsx>{`
        .mesh-asset-root {
          width: 100%;
          position: relative;
        }
        :global(.mesh-asset-ar-btn) {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background: #4a3a8a;
          color: #fff;
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 999px;
          font-weight: 700;
          font-family: system-ui, sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(74, 58, 138, 0.4);
        }
        :global(.mesh-asset-ar-btn:active) {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}

export { MeshAsset };
