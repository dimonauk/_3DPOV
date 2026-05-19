import { NextRequest } from "next/server";

import { getTutorial } from "lib/tutorials";
import { renderBomCsv } from "lib/tutorials/bom-csv";

/**
 * GET /api/tutorials/<slug>/bom.csv
 *
 * Returns the tutorial's bill-of-materials as a downloadable CSV.
 * Rows cover materials + tools + provisions (one row per supplier
 * when a supply has multi-vendor sourcing), plus software and
 * code-level dependencies.
 *
 * Tutorials without an `instructable` block return 404. Tutorials
 * with an empty BOM return a CSV containing only the header row.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tutorial = getTutorial(slug);
  if (!tutorial || !tutorial.instructable) {
    return new Response("Not found", { status: 404 });
  }
  const csv = renderBomCsv(tutorial.instructable);
  // ASCII slug + a UTF-8 fallback for safety.
  const filename = `${slug}-bom.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
