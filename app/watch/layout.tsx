import Footer from "components/layout/footer";
import type { ReactNode } from "react";

/**
 * Server-Component layout for the `/watch` page.
 *
 * The watch page is a `"use client"` component. Importing the async
 * `Footer` Server Component from there is rejected by Next.js 15.6
 * canary's stricter import-graph analyser. Lifting Footer into this
 * layout keeps it server-side.
 */
export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
