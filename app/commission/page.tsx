/**
 * app/commission/page.tsx — Commission enquiry.
 *
 * Three project types matching the pricing page:
 *   Heritage Documentation, VR Development, Parametric Manufacturing.
 * Plus a free-form "Other" bucket.
 *
 * Submits to the existing /api/contact route (intent: "commission").
 * The response page confirms receipt and sets an expectation: Dimona
 * reads it within 2 working days and replies with a quote + intake call link.
 *
 * No Stripe here — commissions are scoped individually before payment.
 */

import type { Metadata } from "next";
import { CommissionForm } from "./CommissionForm";

export const metadata: Metadata = {
  title: "Commission — Holo-Flow Studio",
  description:
    "Start a commission: heritage digitisation, VR development, or parametric manufacturing. Scoped individually, fixed price agreed before any work begins.",
};

export default async function CommissionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <header className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-muted,#64748b)]">
          Studio
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Commission</h1>
        <p className="mt-3 text-[var(--color-muted,#64748b)]">
          Scoped individually. Fixed price agreed before any work begins. I reply
          within two working days with a quote and a link to book an intake call.
        </p>
      </header>

      <CommissionForm initialType={type ?? ""} />
    </main>
  );
}
