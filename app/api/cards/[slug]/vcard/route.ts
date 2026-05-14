import { NextResponse } from "next/server";
import { getCard } from "lib/ar/cards";

/**
 * vCard 3.0 download endpoint. Triggered by "Save to contacts" on the
 * card landing page — opens the native add-contact flow on most phones.
 *
 * Next 15: route params is now a Promise.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) return new NextResponse("Not found", { status: 404 });

  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  const nameParts = card.name.split(" ");
  const last = nameParts.length > 1 ? nameParts.pop()! : "";
  const first = nameParts.join(" ");
  lines.push(`FN:${escapeVcard(card.name)}`);
  lines.push(`N:${escapeVcard(last)};${escapeVcard(first)};;;`);

  if (card.studio) lines.push(`ORG:${escapeVcard(card.studio)}`);
  if (card.role) lines.push(`TITLE:${escapeVcard(card.role)}`);
  if (card.contact.email) lines.push(`EMAIL;TYPE=INTERNET:${card.contact.email}`);
  if (card.contact.phone) lines.push(`TEL;TYPE=CELL:${card.contact.phone}`);
  if (card.contact.website) lines.push(`URL:${card.contact.website}`);

  lines.push(`URL;TYPE=AR Card:https://${process.env.PUBLIC_DOMAIN ?? "holoflow.co.uk"}/c/${card.slug}`);
  if (card.tagline) lines.push(`NOTE:${escapeVcard(card.tagline)}`);
  lines.push("END:VCARD");

  const vcard = lines.join("\r\n");

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.slug}.vcf"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}

function escapeVcard(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
