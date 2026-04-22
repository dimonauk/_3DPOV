import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const slug = form.get("slug");

  return NextResponse.redirect(
    new URL(`/shop/${slug}?stub=1`, req.url),
    { status: 303 }
  );
}
