/**
 * app/academy/layout.tsx — Academy layout with subscription gate.
 *
 * Bypasses the site's outer Navbar/footer (Academy owns the full viewport).
 * Checks Firestore for an active Rookery subscription before rendering.
 * Non-subscribers see the gate prompt and are redirected to /rookery.
 *
 * Auth flow:
 *   1. Server component reads the `__session` Firebase cookie (set by
 *      Firebase Auth SDK) and verifies it via Firebase Admin.
 *   2. If verified, checks `rookery_subscriptions/{email}` in Firestore.
 *   3. If subscription is active, renders children. Otherwise: gate.
 *
 * The gate is non-blocking in development when Firebase Admin is not
 * configured — falls through to render children so local dev works.
 */

import { cookies } from "next/headers";
import Link from "next/link";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  isFirebaseAdminConfigured,
} from "lib/firebase/admin";

export const metadata = {
  title: "The Charming Academy — DollyOS narrative space",
  robots: { index: false, follow: false },
};

async function getSubscriptionStatus(
  sessionCookie: string | undefined,
): Promise<{ subscribed: boolean; tier?: string }> {
  if (!isFirebaseAdminConfigured() || !sessionCookie) {
    // Dev fallback: no admin config or no cookie → pass through.
    return { subscribed: !isFirebaseAdminConfigured() };
  }

  const auth = getFirebaseAdminAuth();
  if (!auth) return { subscribed: false };

  let email: string | undefined;
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    email = decoded.email;
    // Custom claim fast-path.
    const rookeryTier = (decoded as Record<string, unknown>)["rookeryTier"];
    if (typeof rookeryTier === "string" && rookeryTier) {
      return { subscribed: true, tier: rookeryTier };
    }
  } catch {
    return { subscribed: false };
  }

  if (!email) return { subscribed: false };

  // Firestore fallback — in case custom claim hasn't propagated yet.
  const db = getFirebaseAdminDb();
  if (!db) return { subscribed: false };

  try {
    const doc = await db.collection("rookery_subscriptions").doc(email).get();
    if (!doc.exists) return { subscribed: false };
    const data = doc.data() as { status?: string; tier?: string };
    return {
      subscribed: data.status === "active",
      tier: data.tier,
    };
  } catch {
    return { subscribed: false };
  }
}

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactNode> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  const { subscribed, tier } = await getSubscriptionStatus(sessionCookie);

  if (!subscribed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#05060a] px-4 text-center text-[#e8f0f8]">
        <p className="mb-2 text-xs uppercase tracking-widest text-[#64748b]">
          The Charming Academy
        </p>
        <h1 className="mb-4 text-2xl font-semibold">Subscription required</h1>
        <p className="mb-6 max-w-sm text-sm text-[#64748b]">
          The Academy is part of the Rookery. A Perch membership (£6 / month) gives
          you full access — no asterisks.
        </p>
        <Link
          href="/rookery"
          className="rounded border border-[#7ff0d4] px-6 py-2.5 text-sm font-medium text-[#7ff0d4] transition-colors hover:bg-[rgba(127,240,212,0.08)]"
        >
          Join the Rookery
        </Link>
        <p className="mt-4 text-xs text-[#64748b]">
          Already a member?{" "}
          <Link href="/signin" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div data-rookery-tier={tier}>
      {children}
    </div>
  );
}
