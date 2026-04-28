import Link from "next/link";
import Image from "next/image";
import type { Product } from "lib/shopify/types";

function editionLine(tags: string[]): string | null {
  // Tags like "edition-25" surface as "Edition of 25" on the tile.
  const edition = tags.find((t) => /^edition-\d+$/.test(t));
  if (!edition) return null;
  const n = edition.split("-")[1];
  return `Edition of ${n}`;
}

function fromPrice(p: Product): string {
  const { amount, currencyCode } = p.priceRange.minVariantPrice;
  const rounded = Math.round(parseFloat(amount));
  const symbol =
    currencyCode === "GBP"
      ? "£"
      : currencyCode === "USD"
        ? "$"
        : currencyCode === "EUR"
          ? "€"
          : "";
  return `from ${symbol}${rounded}`;
}

/**
 * Large gallery tile for editioned photographs. Distinct from the stock
 * GridTileImage — foregrounds the image itself, lays title + edition
 * count + "from £x" as a lower-left caption on hover, keeps the aspect
 * flexible (photograph orientations vary).
 */
export function PhotographTile({ product }: { product: Product }) {
  const image = product.featuredImage;
  const edition = editionLine(product.tags);
  return (
    <Link
      href={`/product/${product.handle}`}
      prefetch={true}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-900"
    >
      {image?.url ? (
        <Image
          src={image.url}
          alt={image.altText || product.title}
          fill
          sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-chrome-500">
          <span className="chrome-label">image pending</span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-warm-black-950/90 via-warm-black-950/60 to-transparent px-5 py-4">
        <div className="chrome-label opacity-90">
          {edition ?? "Edition"} · {fromPrice(product)}
        </div>
        <div className="font-display text-2xl leading-tight text-chrome-100">
          {product.title}
        </div>
      </div>
    </Link>
  );
}
