/**
 * app/admin/bureau/page.tsx — Operator dashboard for bureau orders.
 *
 * Server-rendered list of every print bureau order. Reads via the
 * Firebase Admin SDK so it bypasses Firestore client rules. The
 * `/admin/layout.tsx` enforces the admin-email gate; this page is
 * never reachable without auth.
 *
 * One row per order with status badge + quick "mark fulfilled"
 * affordance. Catalogue-voice — operator surface, not customer-
 * facing, so no marketing copy.
 */

import "server-only";

import Link from "next/link";

import { FIRESTORE_COLLECTION } from "lib/bureau/order";
import {
  EDITION_LABELS,
  PAPER_LABELS,
  SIZE_LABELS,
} from "lib/bureau/pricing";
import type { Order } from "lib/bureau/types";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

const log = createLogger("admin.bureau.page");

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bureau — operator console",
  robots: { index: false, follow: false },
};

async function loadOrders(): Promise<Order[]> {
  try {
    const db = requireFirebaseAdminDb();
    const snap = await db
      .collection(FIRESTORE_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    return snap.docs.map((d) => d.data() as Order);
  } catch (err) {
    log.warn("loadOrders failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

function statusColor(status: Order["status"]): string {
  switch (status) {
    case "paid":
      return "#5ed4a8";
    case "pending_payment":
      return "#ffd159";
    case "fulfilling":
      return "#9a76ff";
    case "fulfilled":
      return "#9aa3b2";
    case "refunded":
    case "cancelled":
      return "#ff8585";
    default:
      return "#9aa3b2";
  }
}

function priceFmt(pence: number): string {
  return (pence / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  });
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return iso;
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export default async function AdminBureauPage() {
  const orders = await loadOrders();
  const summary = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      acc.totalRevenuePence += o.status === "paid" || o.status === "fulfilling" || o.status === "fulfilled" ? o.priceGbp : 0;
      return acc;
    },
    {
      totalRevenuePence: 0,
    } as Record<string, number> & { totalRevenuePence: number },
  );

  return (
    <main className="ab-root">
      <header className="ab-header">
        <h1>Bureau orders</h1>
        <p>
          {orders.length} order{orders.length === 1 ? "" : "s"} ·{" "}
          <strong>{priceFmt(summary.totalRevenuePence)}</strong> billed
          {Object.keys(summary).filter((k) => k !== "totalRevenuePence").length > 0 ? (
            <>
              {" · "}
              {Object.entries(summary)
                .filter(([k]) => k !== "totalRevenuePence")
                .map(([k, v]) => `${v} ${k}`)
                .join(" · ")}
            </>
          ) : null}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="ab-empty">
          No orders yet. Once a visitor pays at{" "}
          <code>/bureau/[itemId]</code> the row will appear here.
          <br />
          <br />
          If you&rsquo;ve just slotted in Stripe credentials, place a
          test order using a Stripe test card (4242 4242 4242 4242)
          to verify the full loop.
        </div>
      ) : (
        <div className="ab-table">
          <div className="ab-row ab-row-head">
            <span>When</span>
            <span>Ref</span>
            <span>Print</span>
            <span>Customer</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/bureau/${o.id}`}
              className="ab-row"
            >
              <span className="ab-when">{timeAgo(o.createdAt)}</span>
              <span className="ab-ref">
                <code>{o.id}</code>
              </span>
              <span className="ab-print">
                {SIZE_LABELS[o.sizeChoice]?.split(" — ")[0] ?? o.sizeChoice} ·{" "}
                {EDITION_LABELS[o.edition]?.split(" — ")[0] ?? o.edition}
                <br />
                <small>{PAPER_LABELS[o.paperChoice] ?? o.paperChoice}</small>
              </span>
              <span className="ab-cust">
                {o.customerName ? (
                  <>
                    {o.customerName}
                    <br />
                  </>
                ) : null}
                <small>{o.customerEmail}</small>
              </span>
              <span className="ab-price">{priceFmt(o.priceGbp)}</span>
              <span className="ab-status">
                <span
                  className="ab-status-dot"
                  style={{ background: statusColor(o.status) }}
                />
                {o.status}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        .ab-root {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          color: rgba(255, 255, 255, 0.92);
        }
        .ab-header h1 {
          font-size: 1.4rem;
          margin: 0 0 0.4rem;
        }
        .ab-header p {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.85rem;
          margin: 0 0 1.5rem;
        }
        .ab-empty {
          padding: 2rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 0.5rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        .ab-empty code {
          background: rgba(255, 111, 181, 0.12);
          padding: 0.05rem 0.35rem;
          border-radius: 0.25rem;
        }
        .ab-table {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .ab-row {
          display: grid;
          grid-template-columns: 90px 200px 200px 1fr 100px 120px;
          gap: 0.85rem;
          padding: 0.7rem 0.95rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 0.45rem;
          align-items: center;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .ab-row:hover {
          border-color: rgba(255, 111, 181, 0.35);
          background: rgba(0, 0, 0, 0.4);
        }
        .ab-row-head {
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          background: transparent;
          border: 0;
          pointer-events: none;
        }
        .ab-row code {
          font-size: 0.72rem;
          background: rgba(255, 111, 181, 0.12);
          padding: 0.05rem 0.35rem;
          border-radius: 0.25rem;
        }
        .ab-row small {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.72rem;
        }
        .ab-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-transform: capitalize;
        }
        .ab-status-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ab-price {
          font-weight: 700;
          color: #ff6fb5;
        }
        @media (max-width: 720px) {
          .ab-row {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto;
          }
          .ab-row-head {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
