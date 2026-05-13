import Footer from "components/layout/footer";
import type { ReactNode } from "react";

/**
 * Server-Component layout for the Rookery section.
 *
 * The four pages inside `/rookery` (page.tsx, new/page.tsx,
 * [id]/page.tsx, tiers/page.tsx, about/page.tsx) are a mix of
 * `"use client"` and Server Components. The original implementation
 * had each `"use client"` page importing the async `Footer` Server
 * Component directly, which Next.js 15.6 canary's stricter
 * import-graph analyser now rejects: an async Server Component
 * cannot be imported by a Client Component, and the transitive
 * graph (Footer → `getMenu` → `lib/shopify/cached.ts`) ends up
 * dragging cache-annotated functions into the Client bundle, which
 * breaks the build.
 *
 * Lifting `Footer` into this layout removes the direct client
 * imports and lets each page focus on its own content.
 */
export default function RookeryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
