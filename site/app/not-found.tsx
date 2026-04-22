import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-28">
      <div className="protocol-label">404 · Not in the archive</div>
      <h1 className="display text-5xl mt-4 leading-[1]">The record is not held.</h1>
      <p className="mt-6 text-ink/70">
        The page you asked for is not catalogued. It may have been a draft,
        a future release, or simply the wrong address.
      </p>
      <div className="mt-10 flex gap-5 text-sm">
        <Link
          href="/collections"
          className="border border-ink px-5 py-3 tracking-protocol text-xs hover:bg-ink hover:text-bone transition-colors"
        >
          RETURN TO THE INDEX
        </Link>
        <Link href="/" className="underline underline-offset-4 self-center">
          Or start at the entrance
        </Link>
      </div>
    </section>
  );
}
