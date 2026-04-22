import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="protocol-label">Archive</div>
          <p className="display mt-2 text-xl leading-snug max-w-md">
            The Neo-London Chrono-Protocol is an ongoing fieldwork into kata
            and the spaces that remember them.
          </p>
        </div>
        <div>
          <div className="protocol-label mb-3">Site</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/collections">Collections</Link></li>
            <li><Link href="/protocol">The Protocol</Link></li>
            <li><Link href="/shop">Acquire</Link></li>
          </ul>
        </div>
        <div>
          <div className="protocol-label mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            <li><a href="mailto:archive@chrono-protocol.example">archive@chrono-protocol.example</a></li>
            <li><Link href="/shop/shipping">Shipping &amp; returns</Link></li>
            <li><Link href="/shop/certificate">Certificate of authenticity</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-ink/60">
          <span>© {new Date().getFullYear()} Chrono-Protocol Archive</span>
          <span className="font-mono tracking-protocol">CP-ARCHIVE / v0.1</span>
        </div>
      </div>
    </footer>
  );
}
