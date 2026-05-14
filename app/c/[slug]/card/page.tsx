import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getCard, listCardSlugs } from "lib/ar/cards";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = await listCardSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CardPrintPage({ params }: PageProps) {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) notFound();

  let qrSvg = "";
  try {
    qrSvg = await fs.readFile(
      path.join(process.cwd(), "public", "cards", card.slug, "qr.svg"),
      "utf8",
    );
  } catch {
    qrSvg = `<text>Run: node scripts/ar-generate-qr.mjs ${card.slug}</text>`;
  }

  const w = card.print.width_mm;
  const h = card.print.height_mm;
  const bleed = card.print.bleed_mm;
  const safe = card.print.safe_mm;
  const totalW = w + 2 * bleed;
  const totalH = h + 2 * bleed;

  return (
    <main>
      <header className="print-toolbar no-print">
        <h1>{card.name} — print preview</h1>
        <p>
          Trim: {w}×{h}mm · Bleed: {bleed}mm · Safe area: {safe}mm
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#666" }}>
          Use your browser&apos;s File → Print menu, scale 100%, A4 portrait.
        </p>
      </header>

      <section className="cards">
        <div className="card-bleed" style={{ width: `${totalW}mm`, height: `${totalH}mm` }}>
          <div className="card-trim" style={{ width: `${w}mm`, height: `${h}mm`, margin: `${bleed}mm` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.ar.targetImage} alt="" />
          </div>
        </div>

        <div className="card-bleed" style={{ width: `${totalW}mm`, height: `${totalH}mm` }}>
          <div className="card-trim" style={{ width: `${w}mm`, height: `${h}mm`, margin: `${bleed}mm`, padding: `${safe}mm`, background: card.brand.primary, color: card.brand.textOnBrand }}>
            <div className="back-grid">
              <div className="back-text">
                <p className="back-name">{card.name}</p>
                <p className="back-role">{card.role}</p>
                {card.contact.email && <p className="back-line">{card.contact.email}</p>}
                {card.contact.phone && <p className="back-line">{card.contact.phone}</p>}
                {card.contact.website && <p className="back-line">{card.contact.website.replace(/^https?:\/\//, "")}</p>}
                <p className="back-cta">Scan to see the card come alive</p>
              </div>
              <div
                className="back-qr"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @page { size: A4; margin: 12mm; }
        body { margin: 0; background: #d1d1d1; color: #111; font-family: system-ui, sans-serif; }
        .print-toolbar {
          background: #fff; padding: 1rem 1.5rem; border-bottom: 1px solid #ccc;
        }
        .print-toolbar h1 { margin: 0 0 0.25rem; font-size: 1rem; }
        .print-toolbar p { margin: 0; font-size: 0.8rem; color: #555; }
        .cards {
          display: flex; flex-direction: column; gap: 6mm; padding: 6mm; align-items: center;
        }
        .card-bleed {
          background: repeating-linear-gradient(
            45deg, transparent, transparent 2mm, rgba(255,0,0,0.05) 2mm, rgba(255,0,0,0.05) 4mm
          );
          box-shadow: 0 2px 14px rgba(0,0,0,0.18);
        }
        .card-trim {
          background: white;
          overflow: hidden;
          position: relative;
        }
        .card-trim img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .back-grid {
          display: grid; grid-template-columns: 1fr auto; gap: 4mm;
          width: 100%; height: 100%; align-items: end;
        }
        .back-text p { margin: 0; line-height: 1.3; }
        .back-name { font-size: 4mm; font-weight: 700; }
        .back-role { font-size: 2.5mm; opacity: 0.9; margin-top: 1mm !important; }
        .back-line { font-size: 2.4mm; margin-top: 0.6mm !important; opacity: 0.92; }
        .back-cta { font-size: 2mm; opacity: 0.75; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 2mm !important; }
        .back-qr { width: 18mm; height: 18mm; }
        .back-qr :global(svg) { width: 100%; height: 100%; }

        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .cards { padding: 0; gap: 4mm; }
          .card-bleed { background: white; box-shadow: none; }
        }
      `}</style>
    </main>
  );
}
