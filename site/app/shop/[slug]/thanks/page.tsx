import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getCollectionSlugs } from "@/lib/collections";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";

export function generateStaticParams() {
  return getCollectionSlugs().map((slug) => ({ slug }));
}

export const metadata = { title: "Thank you" };

export default async function ThanksPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { session_id?: string };
}) {
  const c = getCollection(params.slug);
  if (!c) notFound();

  let orderRef: string | null = null;
  let customerEmail: string | null = null;

  const sessionId = searchParams.session_id;
  if (sessionId && stripeIsConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        orderRef = session.id.slice(-8).toUpperCase();
        customerEmail = session.customer_details?.email ?? null;
      } catch {
        // swallow — the thanks page still renders without order context
      }
    }
  }

  return (
    <article className="mx-auto max-w-2xl px-6 py-24 prose-chrono">
      <div className="protocol-label">Acquisition confirmed</div>
      <h1 className="display text-5xl mt-4 leading-[1]">Thank you.</h1>

      <p className="mt-8">
        You have acquired <strong>{c.title}</strong> ({c.code}). The
        studio has received the order and will prepare the work for
        dispatch within 3–5 working days.
      </p>

      {orderRef && (
        <p className="font-mono text-sm text-ink/70">
          Order reference: <span className="text-ink">{orderRef}</span>
        </p>
      )}

      {customerEmail && (
        <p className="text-sm text-ink/70">
          Confirmation sent to <strong>{customerEmail}</strong>.
        </p>
      )}

      <h2 className="display text-2xl mt-12">What arrives</h2>
      <p>
        The signed, numbered work. The embossed certificate of
        authenticity recording the collection code, the coordinates, the
        hour, and the date of the original kata. A short letter from the
        studio. For lit objects: the 12V / USB-C power supply and a
        printed firmware note.
      </p>

      <div className="mt-12 flex gap-4">
        <Link
          href="/collections"
          className="border border-ink px-5 py-3 tracking-protocol text-xs hover:bg-ink hover:text-bone transition-colors"
        >
          RETURN TO THE ARCHIVE
        </Link>
        <Link href="/" className="underline underline-offset-4 self-center text-sm">
          The entrance
        </Link>
      </div>
    </article>
  );
}
