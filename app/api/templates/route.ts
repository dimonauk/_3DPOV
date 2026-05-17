import { NextResponse } from "next/server";
import { listTemplates, getTemplate } from "lib/cards/templates-server";

/**
 * GET /api/templates           → array of all available card templates
 * GET /api/templates?id=<slug> → single template (or 404)
 *
 * No auth — templates are public starting points, not user data.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const t = await getTemplate(id);
    if (!t) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ template: t });
  }
  const templates = await listTemplates();
  return NextResponse.json({ templates });
}
