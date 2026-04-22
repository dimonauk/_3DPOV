import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const slug = form.get("slug");

  // TODO: wire Stripe here — create a Checkout Session for the given plate
  // and redirect to session.url. For now this is a deliberate stub so the
  // flow is end-to-end navigable without a Stripe key in the repo.

  return NextResponse.redirect(
    new URL(`/shop/${slug}?stub=1`, req.url),
    { status: 303 }
  );
}
