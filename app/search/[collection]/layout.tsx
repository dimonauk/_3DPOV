import Collections from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";
import { sorting } from "lib/constants";

/**
 * Catalogue browse chrome for /search/[collection] routes. Collections
 * sidebar on the left, sort filter on the right, the product grid
 * (rendered by page.tsx) in the middle.
 */
export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col gap-8 px-4 pb-4 text-black md:flex-row dark:text-white">
      <div className="order-first w-full flex-none md:max-w-[125px]">
        <Collections />
      </div>
      <div className="order-last min-h-screen w-full md:order-none">
        {children}
      </div>
      <div className="order-none flex-none md:order-last md:w-[125px]">
        <FilterList list={sorting} title="Sort by" />
      </div>
    </div>
  );
}
