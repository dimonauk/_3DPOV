import Link from "next/link";
import { isExternalHref, type RelatedLink } from "lib/writing";

function LinkItem({ item }: { item: RelatedLink }) {
  const external = isExternalHref(item.href);
  const labelClass =
    "text-chrome-100 underline underline-offset-4 group-hover:text-pink-200";

  if (external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <span className={labelClass}>
          {item.label}
          <span className="ml-1 text-chrome-500">&nearr;</span>
        </span>
        {item.note && (
          <p className="mt-1 text-sm text-chrome-400">{item.note}</p>
        )}
      </a>
    );
  }

  return (
    <Link href={item.href} prefetch={true} className="group block">
      <span className={labelClass}>{item.label}</span>
      {item.note && (
        <p className="mt-1 text-sm text-chrome-400">{item.note}</p>
      )}
    </Link>
  );
}

export function RelatedBlock({
  related,
  furtherReading,
}: {
  related?: RelatedLink[];
  furtherReading?: RelatedLink[];
}) {
  const hasRelated = related && related.length > 0;
  const hasFurther = furtherReading && furtherReading.length > 0;
  if (!hasRelated && !hasFurther) return null;

  return (
    <div className="mt-20 border-t border-warm-black-800 pt-10">
      {hasRelated && (
        <section>
          <div className="chrome-label mb-5 text-pink-200">Also</div>
          <ul className="space-y-5">
            {related!.map((item) => (
              <li key={item.href}>
                <LinkItem item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasFurther && (
        <section className={hasRelated ? "mt-14" : ""}>
          <div className="chrome-label mb-5 text-pink-200">
            Further reading
          </div>
          <p className="mb-5 max-w-prose text-sm text-chrome-400">
            The studio&rsquo;s position is that this work is learnable.
            Below: the foundational resources that anyone sitting down
            to learn the practice could start from.
          </p>
          <ul className="space-y-5">
            {furtherReading!.map((item) => (
              <li key={item.href}>
                <LinkItem item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
