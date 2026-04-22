import { NextResponse } from "next/server";
import { getCollections } from "@/lib/collections";
import { stripeIsConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  let catalogOk = false;
  let catalogCount = 0;
  let catalogError: string | null = null;
  try {
    const collections = getCollections();
    catalogCount = collections.length;
    catalogOk = collections.length > 0;
  } catch (err) {
    catalogError = (err as Error).message;
  }

  const body = {
    ok: catalogOk,
    catalog: {
      ok: catalogOk,
      count: catalogCount,
      error: catalogError,
    },
    integrations: {
      stripe: stripeIsConfigured(),
      resend: Boolean(process.env.RESEND_API_KEY),
      webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: catalogOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
