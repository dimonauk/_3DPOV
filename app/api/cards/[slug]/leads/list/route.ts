import { NextResponse, type NextRequest } from "next/server";
import { listCardLeads } from "lib/cards/leads-server";
import { getCardServer } from "lib/cards/firestore-server";
import { verifyIdToken } from "lib/firebase/admin";

/**
 * GET /api/cards/[slug]/leads/list — owner-only list of leads.
 *
 * Format: ?format=json (default) or ?format=csv.
 *
 * Auth: requires `Authorization: Bearer <firebaseIdToken>`. Token is
 * verified server-side; uid must match card.ownerUid or 403.
 *
 * CSV columns: at_iso, name, email, message, src, country.
 */
type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const card = await getCardServer(slug);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (card.ownerUid !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { leads, truncated } = await listCardLeads(slug);

  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  if (format === "csv") {
    const rows = [
      ["at_iso", "name", "email", "message", "src", "country"],
      ...leads.map((l) => [
        l.at ? new Date(l.at).toISOString() : "",
        l.name ?? "",
        l.email ?? "",
        (l.message ?? "").replace(/\n/g, " "),
        l.src ?? "",
        l.country ?? "",
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell);
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(","),
      )
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="holoflow-leads-${slug}.csv"`,
      },
    });
  }

  return NextResponse.json({ leads, truncated });
}
