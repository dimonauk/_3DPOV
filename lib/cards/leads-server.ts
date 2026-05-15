import "server-only";

/**
 * Lead capture — server-side helpers for storing visitor-submitted
 * leads against a card. Leads live at cards/<slug>/leads/<leadId>.
 *
 * Rules of engagement:
 *   - Only the card owner can read leads.
 *   - Anyone can create a lead via /api/cards/[slug]/leads (admin SDK
 *     write, rate-limited by IP hash).
 *   - Email is validated against a permissive RFC-ish regex; bad
 *     submissions get 400 not 200, so visitors know they typo'd.
 *   - We never confirm the lead via email to the visitor (no double-
 *     opt-in spam vector); the card owner can follow up directly.
 *
 * If RESEND_API_KEY is set, an instant notification is sent to the
 * card's contact.email when a lead arrives. This is purely a
 * convenience — leads always land in Firestore regardless. If Resend
 * fails we swallow the error and the lead still gets stored.
 */

import { createHash } from "node:crypto";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const rateLog = new Map<string, number[]>();

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "holoflow-default-salt";
  return sha256(ip + ":" + salt).slice(0, 32);
}

function checkRate(ipHash: string): boolean {
  const now = Date.now();
  const list = rateLog.get(ipHash) ?? [];
  const recent = list.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateLog.set(ipHash, recent);
    return false;
  }
  recent.push(now);
  rateLog.set(ipHash, recent);
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateLeadInput = {
  slug: string;
  name?: string;
  email: string;
  message?: string;
  src?: string;
  ip?: string;
  ua?: string;
  country?: string;
};

type CreateLeadResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | "invalid_email"
        | "invalid_slug"
        | "missing_email"
        | "rate_limited"
        | "no_admin";
    };

export async function createCardLead(
  input: CreateLeadInput,
): Promise<CreateLeadResult> {
  if (!input.slug || !/^[a-z0-9-]+$/i.test(input.slug)) {
    return { ok: false, error: "invalid_slug" };
  }
  if (!input.email || !input.email.trim()) {
    return { ok: false, error: "missing_email" };
  }
  const email = input.email.trim().toLowerCase();
  if (email.length > 320 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid_email" };
  }

  const ipHash = input.ip ? hashIp(input.ip) : "anon";
  if (!checkRate(ipHash)) {
    return { ok: false, error: "rate_limited" };
  }

  let db: Firestore;
  try {
    db = requireFirebaseAdminDb();
  } catch {
    return { ok: false, error: "no_admin" };
  }

  const truncate = (s: string | null | undefined, max: number) =>
    s ? s.slice(0, max) : undefined;

  const doc = {
    email,
    name: truncate(input.name, 200),
    message: truncate(input.message, 2000),
    src: truncate(input.src, 64),
    ua: truncate(input.ua, 256),
    country: truncate(input.country, 8),
    ipHash,
    at: FieldValue.serverTimestamp(),
  };

  const ref = await db
    .collection("cards")
    .doc(input.slug)
    .collection("leads")
    .add(doc);

  return { ok: true, id: ref.id };
}

/**
 * Owner-side: list leads for a card. Caller MUST verify ownership
 * before calling this — it does no auth on its own. Bounded scan
 * of 1000 leads; export to CSV beyond that.
 */
export async function listCardLeads(slug: string) {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection("cards")
    .doc(slug)
    .collection("leads")
    .orderBy("at", "desc")
    .limit(1000)
    .get();

  const leads = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = d.data() as Record<string, unknown>;
    const atMs =
      data.at && typeof data.at === "object" && "toMillis" in data.at
        ? (data.at as { toMillis: () => number }).toMillis()
        : 0;
    return {
      id: d.id,
      email: data.email as string | undefined,
      name: data.name as string | undefined,
      message: data.message as string | undefined,
      src: data.src as string | undefined,
      country: data.country as string | undefined,
      at: atMs,
    };
  });

  return { leads, truncated: snap.size === 1000 };
}

/**
 * Send a notification email to the card owner via Resend if
 * RESEND_API_KEY is configured. Swallows all errors — this is
 * best-effort, never critical-path.
 */
export async function notifyOwnerOfLead({
  ownerEmail,
  cardSlug,
  cardName,
  leadName,
  leadEmail,
  leadMessage,
}: {
  ownerEmail: string;
  cardSlug: string;
  cardName: string;
  leadName?: string;
  leadEmail: string;
  leadMessage?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !ownerEmail) return;

  const fromAddress =
    process.env.RESEND_FROM_ADDRESS || "Holo-Flow <leads@holoflow.co.uk>";

  const subject = `New lead on ${cardName} — ${leadEmail}`;
  const html = [
    `<p>Someone left their details on your <strong>${cardName}</strong> card.</p>`,
    `<p><strong>Name:</strong> ${leadName ? escapeHtml(leadName) : "(not given)"}</p>`,
    `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(leadEmail)}">${escapeHtml(leadEmail)}</a></p>`,
    leadMessage
      ? `<p><strong>Message:</strong></p><p>${escapeHtml(leadMessage).replace(/\n/g, "<br/>")}</p>`
      : "",
    `<hr/>`,
    `<p style="color:#666;font-size:12px">View all leads at <a href="https://holoflow.co.uk/cards/mine/${cardSlug}/leads">holoflow.co.uk/cards/mine/${cardSlug}/leads</a></p>`,
  ].join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: ownerEmail,
        subject,
        html,
        reply_to: leadEmail,
      }),
    });
  } catch {
    // Email is best-effort; lead is already in Firestore.
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
