/**
 * app/admin/printfiles/page.tsx — operator dashboard.
 *
 * Server-rendered list of every printfile order. Reads via the admin
 * SDK so the page bypasses Firestore client rules. Renders as a
 * sortable table with status badges + per-row actions.
 *
 * Catalogue-voice. Mirrors /admin/library structure.
 */

import "server-only";

import Link from "next/link";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

import {
  FIRESTORE_COLLECTION,
  type PrintfilesOrder,
} from "lib/printfiles/types";

import { OrderRow } from "./order-row";

const log = createLogger("admin.printfiles.page");

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Print files — operator console",
  robots: { index: false, follow: false },
};

async function loadOrders(): Promise<PrintfilesOrder[]> {
  try {
    const db = requireFirebaseAdminDb();
    const snap = await db
      .collection(FIRESTORE_COLLECTION)
      .orderBy("receivedAt", "desc")
      .limit(200)
      .get();
    return snap.docs.map((d) => d.data() as PrintfilesOrder);
  } catch (err) {
    log.error("loadOrders failed", { err: String(err) });
    return [];
  }
}

export default async function PrintfilesDashboardPage() {
  const orders = await loadOrders();
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console / print files
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Customer print orders
          </h1>
          <p className="text-sm leading-relaxed text-chrome-300">
            Every file landed in <code>printfiles@holoflow.co.uk</code>. Listed
            newest-first. Click into a row to see the email body, attachment
            details, validation result, and the farm-forwarder packet.
          </p>
          <p className="text-xs leading-relaxed text-chrome-500">
            {orders.length} order{orders.length === 1 ? "" : "s"} total.{" "}
            {Object.entries(byStatus)
              .map(([status, n]) => `${n} ${status}`)
              .join(" · ")}
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6 text-center text-sm text-chrome-400">
            No print orders yet. Send a test email to{" "}
            <code className="text-pink-200">printfiles@holoflow.co.uk</code>{" "}
            with an STL attachment to verify the listener is wired.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}

        <footer className="flex justify-between border-t border-warm-black-700 pt-4">
          <Link
            href="/admin"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ← Operator console
          </Link>
          <span className="chrome-label text-chrome-500">
            Print files dashboard
          </span>
        </footer>
      </div>
    </main>
  );
}
