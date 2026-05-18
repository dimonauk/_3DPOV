import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getLocation,
  listLocations,
} from "lib/holo-walk/locations";
import { sculptureArUrl, sculptureQrSvg } from "lib/holo-walk/qr";
import { recommendedQrSizeCm, maxScanDistanceM } from "lib/qr";

export async function generateStaticParams() {
  return listLocations().map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loc = getLocation(id);
  if (!loc) return { title: "Not found" };
  return {
    title: `${loc.name} — Printable QR`,
    description: `Printable QR code for the HoloWalk signage at ${loc.name}. Encodes the AR landing URL.`,
    robots: { index: false, follow: false },
  };
}

/**
 * Printable QR page — `/holo-walk/<id>/qr`. The operator opens this
 * in print preview, sets the right scale, and hands the result to
 * the printer.
 *
 * Server component — fetches the SVG inline so it scales losslessly
 * when the operator stretches to A4/A3.
 */
export default async function HoloWalkQrPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const loc = getLocation(id);
  if (!loc) notFound();

  // Default to 12cm side — readable from arm's length (~1.2m scan distance).
  const sideCm = Math.max(
    3,
    Math.min(60, Number.parseFloat(sp.size ?? "") || 12),
  );
  const maxScanM = maxScanDistanceM(sideCm);
  const arUrl = sculptureArUrl(loc);
  const svg = await sculptureQrSvg(loc, { errorCorrection: "H" });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 print:px-0 print:py-0">
      {/* On-screen header — hidden from print */}
      <header className="mb-8 print:hidden">
        <div className="chrome-label">HoloWalk &middot; {loc.city}</div>
        <h1 className="mt-2 text-3xl">QR &mdash; {loc.name}</h1>
        <p className="mt-2 text-sm text-chrome-300">
          Hit Cmd/Ctrl-P. Set scale so the QR side measures{" "}
          <strong>{sideCm} cm</strong>. Print on uncoated stock or matte
          vinyl; gloss reflects under sodium street lighting and breaks
          the scan.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[8, 10, 12, 15, 20, 30].map((cm) => (
            <Link
              key={cm}
              href={`?size=${cm}`}
              className={`rounded-sm border px-2 py-1 ${
                cm === sideCm
                  ? "border-pink-200 bg-pink-200/10 text-pink-100"
                  : "border-warm-black-800 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
              }`}
            >
              {cm} cm &middot; scans @ {maxScanDistanceM(cm).toFixed(1)} m
            </Link>
          ))}
        </div>
      </header>

      {/* The printable artefact itself */}
      <article className="bg-white p-12 text-warm-black-950 print:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-warm-black-600">
            HoloWalk &middot; {loc.city}
          </div>
          <h2 className="mt-2 text-2xl font-bold">{loc.name}</h2>
          <p className="mt-1 max-w-md text-sm text-warm-black-700">
            Point your camera at the code below. Hold up your phone where
            you are now and the sculpture appears in place.
          </p>

          {/*
            dangerouslySetInnerHTML is safe here: `svg` comes from
            sculptureQrSvg() which feeds a known-good sculpture URL
            (no query-string / visitor-controlled fragment) through
            the `qrcode` library's SVG renderer. No untrusted content
            ever reaches the markup.
          */}
          <div
            className="mt-6"
            style={{ width: `${sideCm}cm`, height: `${sideCm}cm` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          <div className="mt-6 text-[10px] text-warm-black-500">
            <div className="font-mono break-all">{arUrl}</div>
            <div className="mt-1">
              {sideCm}cm &middot; reliable scan within {maxScanM.toFixed(1)}m
            </div>
          </div>

          <div className="mt-8 text-xs text-warm-black-600">
            holoflow.co.uk/holo-walk &middot; {loc.captureDate}
          </div>
        </div>
      </article>

      {/* On-screen footer with print/back affordances */}
      <footer className="mt-8 flex flex-wrap gap-3 text-xs print:hidden">
        <Link
          href={`/holo-walk/${loc.id}`}
          className="rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        >
          &larr; sculpture page
        </Link>
        <Link
          href={`/holo-walk/${loc.id}/qr/route?size=1024`}
          className="rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        >
          download PNG (1024px)
        </Link>
        <Link
          href={`/holo-walk/${loc.id}/qr/route?size=2048&ec=H`}
          className="rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        >
          download PNG (2048px / EC=H)
        </Link>
        <a
          href={arUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-sm border border-warm-black-800 px-3 py-1 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
        >
          test the AR URL
        </a>
      </footer>

      <p className="mt-2 text-[10px] text-chrome-500 print:hidden">
        Recommended size for arm&rsquo;s-length scan: ~
        {recommendedQrSizeCm(0.5).toFixed(1)}cm. For a wall plaque a
        visitor stands 1&ndash;2m from: 10&ndash;20cm. Outdoor signage
        prints with error-correction level <code>H</code> by default so
        scuffs and partial obstruction still scan.
      </p>
    </main>
  );
}
