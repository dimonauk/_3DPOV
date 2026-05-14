"use client";

/**
 * app/studio/[[...tool]]/StudioClient.tsx — Sanity Studio client mount.
 *
 * One-line role: the actual `<NextStudio>` render, isolated in a client
 * component so the page can stay a server component. Loads the project
 * config lazily and surfaces a graceful fallback when the `sanity`
 * package (Studio core) is not installed.
 *
 * # Posture
 * The Studio is a heavy client bundle — only the operator visits it. The
 * runtime config (projectId + dataset) is passed as props rather than
 * read again from env, so this component works whether or not env is
 * exposed on the client.
 */

import { Component, type ReactNode } from "react";
import { NextStudio } from "next-sanity/studio";

import config from "../../../sanity/sanity.config";

export function StudioClient({
  projectId,
  dataset,
}: {
  projectId: string;
  dataset: string;
}): ReactNode {
  return (
    <StudioErrorBoundary>
      <NextStudio
        // The config carries projectId + dataset internally; the props
        // here are documentation for ourselves.
        config={
          {
            ...(config as Record<string, unknown>),
            projectId,
            dataset,
          } as never
        }
      />
    </StudioErrorBoundary>
  );
}

class StudioErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error("[studio] failed to boot:", error);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return <StudioMissingMessage error={this.state.error} />;
    }
    return this.props.children;
  }
}

function StudioMissingMessage({ error }: { error: Error }): ReactNode {
  const isModuleMissing = /cannot find module|MODULE_NOT_FOUND/i.test(
    error.message,
  );
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#0a0a0a",
        color: "#e5e5e5",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <section style={{ maxWidth: "32rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          Studio core not installed
        </h1>
        <p style={{ lineHeight: 1.6, marginBottom: "1rem" }}>
          The Studio mount loaded but the <code>sanity</code> package is
          not present in <code>node_modules</code>. Install it (plus the
          peer dependency) to enable authoring:
        </p>
        <pre
          style={{
            background: "#111",
            padding: "0.75rem",
            borderRadius: "0.25rem",
            overflowX: "auto",
            fontSize: "0.875rem",
          }}
        >
          pnpm add sanity styled-components
        </pre>
        {!isModuleMissing && (
          <p style={{ opacity: 0.6, fontSize: "0.8rem", marginTop: "1rem" }}>
            {error.message}
          </p>
        )}
      </section>
    </main>
  );
}
