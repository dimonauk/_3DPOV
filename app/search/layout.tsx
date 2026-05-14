import Footer from "components/layout/footer";
import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

/**
 * Search layout. Wraps both the studio's content search at /search and
 * the Shopify product browse at /search/[collection]. The product browse
 * mounts its own Collections + FilterList chrome inside its own layout;
 * this outer wrapper just gives every search route the Footer and the
 * `q`-keyed re-render so client state resets between queries.
 */
export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Suspense>
      <Footer />
    </>
  );
}
