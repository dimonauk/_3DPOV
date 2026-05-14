/**
 * app/studio/[[...tool]]/page.tsx — Sanity Studio mount.
 *
 * One-line role: the catch-all route that renders the embedded Sanity
 * Studio at `/studio` (and any sub-path the Studio's internal router
 * uses). The Studio runs entirely client-side; this page is the shell
 * that boots it.
 *
 * # Posture
 * Scaffold + tolerant. When the project hasn't configured
 * NEXT_PUBLIC_SANITY_PROJECT_ID, the page renders a catalogue-voice
 * "not configured" panel instead of crashing. When the operator hasn't
 * installed the `sanity` package (Studio core) the Studio body throws
 * at runtime — caught by an error boundary in the client component
 * (`./StudioClient.tsx`) that surfaces a similar fallback.
 */

import { Suspense } from "react";

import { StudioClient } from "./StudioClient";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage(): React.ReactNode {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

  if (!projectId) {
    return <NotConfigured />;
  }

  return (
    <Suspense fallback={<Booting />}>
      <StudioClient projectId={projectId} dataset={dataset} />
    </Suspense>
  );
}

function NotConfigured(): React.ReactNode {
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
          Studio not configured
        </h1>
        <p style={{ lineHeight: 1.6, marginBottom: "1rem" }}>
          The Sanity Studio embed is in place but no project is wired up.
          Create a project at{" "}
          <a
            href="https://sanity.io/manage"
            style={{ color: "#9dd" }}
            rel="noreferrer"
          >
            sanity.io/manage
          </a>
          , then set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
          <code>NEXT_PUBLIC_SANITY_DATASET</code> in the environment.
        </p>
        <p style={{ lineHeight: 1.6, opacity: 0.7, fontSize: "0.875rem" }}>
          Operators authoring locally also need the <code>sanity</code>{" "}
          package installed (plus its peer <code>styled-components</code>);
          the rest of the site does not.
        </p>
      </section>
    </main>
  );
}

function Booting(): React.ReactNode {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0a0a0a",
        color: "#888",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <p>Booting Studio…</p>
    </main>
  );
}
