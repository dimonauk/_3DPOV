import Image from "next/image";
import type { EntryImage } from "lib/writing";

/**
 * Hero plate for a writing detail page. If the entry supplies a
 * heroImage, render that with Next/Image + a small credit caption.
 * Otherwise fall back to a chrome-sheen gradient surface so the
 * page still has weight at the top of the column.
 */
export function HeroPlate({
  image,
  title,
}: {
  image?: EntryImage;
  title: string;
}) {
  if (image) {
    return (
      <div className="-mx-6 mt-8 md:mx-0">
        <div className="relative aspect-[3/2] w-full overflow-hidden border-y border-warm-black-800 bg-warm-black-950 md:rounded-sm md:border">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 720px, 100vw"
            priority
          />
        </div>
        {image.credit && (
          <p className="mt-2 px-6 text-[0.65rem] uppercase tracking-[0.2em] text-chrome-500 md:px-0">
            {image.credit}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="-mx-6 mt-8 md:mx-0">
      <div className="relative aspect-[3/2] w-full overflow-hidden border-y border-warm-black-800 md:rounded-sm md:border">
        <div
          aria-hidden
          className="absolute inset-0 bg-[#0c0a12]"
          style={{
            backgroundImage:
              "radial-gradient(600px 320px at 70% 30%, rgba(0,243,255,0.15), transparent 60%), radial-gradient(540px 360px at 20% 80%, rgba(255,77,255,0.18), transparent 60%), radial-gradient(420px 280px at 50% 100%, rgba(255,215,0,0.10), transparent 65%)",
          }}
        />
        <div className="relative flex h-full items-end p-6 md:p-10">
          <span
            className="font-display chrome-sheen text-3xl leading-none md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
            aria-hidden
          >
            {title.split(" ").slice(0, 3).join(" ")}
          </span>
        </div>
      </div>
    </div>
  );
}
