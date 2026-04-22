import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group">
          <div className="protocol-label">Neo-London</div>
          <div className="display text-lg">Chrono-Protocol</div>
        </Link>
        <nav className="flex items-center gap-7 text-sm">
          <Link href="/collections" className="hover:underline underline-offset-4">
            Collections
          </Link>
          <Link href="/protocol" className="hover:underline underline-offset-4">
            The Protocol
          </Link>
          <Link href="/shop" className="hover:underline underline-offset-4">
            Acquire
          </Link>
        </nav>
      </div>
    </header>
  );
}
