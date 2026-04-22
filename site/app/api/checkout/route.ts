import { NextResponse } from "next/server";
import { getCollection } from "@/lib/collections";
import { faceMountPrice } from "@/lib/pricing";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";
import { WORK_TYPE_LABEL } from "@/lib/works";

export const dynamic = "force-dynamic";

type LineItem = {
  name: string;
  description: string;
  unitAmountPence: number;
  quantity: number;
  metadata: Record<string, string>;
};

function buildLineItems(form: FormData): { items: LineItem[]; slug: string } | { error: string } {
  const slug = String(form.get("slug") ?? "");
  if (!slug) return { error: "Missing slug" };

  const collection = getCollection(slug);
  if (!collection) return { error: "Unknown work" };

  const { work } = collection;
  const items: LineItem[] = [];

  const baseMeta = {
    slug,
    code: collection.code,
    plateRef: collection.plateRef,
    workType: work.type,
  };

  if (work.type === "array") {
    const panels = Number(form.get("panels") ?? 0);
    const option = work.options.find((o) => o.panels === panels);
    if (!option) return { error: "Invalid panel configuration" };
    items.push({
      name: `${collection.title} — ${panels}-panel array`,
      description: `${WORK_TYPE_LABEL[work.type]} · ${work.panelDimensions} per panel`,
      unitAmountPence: option.priceGBP * 100,
      quantity: 1,
      metadata: { ...baseMeta, panels: String(panels) },
    });
  } else {
    items.push({
      name: collection.title,
      description: `${WORK_TYPE_LABEL[work.type]} · ${work.dimensions}`,
      unitAmountPence: work.priceGBP * 100,
      quantity: 1,
      metadata: baseMeta,
    });

    if (work.type === "plate" && form.get("finish") === "face-mount") {
      items.push({
        name: `${collection.title} — face-mount upgrade`,
        description: "3mm acrylic face-mount with museum spacer",
        unitAmountPence: faceMountPrice(work.priceGBP) * 100,
        quantity: 1,
        metadata: { ...baseMeta, addOn: "face-mount" },
      });
    }
  }

  return { items, slug };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const built = buildLineItems(form);

  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const { items, slug } = built;

  if (!stripeIsConfigured()) {
    return NextResponse.redirect(
      new URL(`/shop/${slug}?stub=1`, req.url),
      { status: 303 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not initialised" }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: i.unitAmountPence,
        product_data: {
          name: i.name,
          description: i.description,
          metadata: i.metadata,
        },
      },
    })),
    shipping_address_collection: {
      allowed_countries: [
        "GB", "IE", "FR", "DE", "NL", "BE", "LU", "ES", "IT", "PT",
        "SE", "NO", "DK", "FI", "CH", "AT", "US", "CA", "AU", "NZ", "JP",
      ],
    },
    automatic_tax: { enabled: false },
    success_url: `${SITE_URL}/shop/${slug}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/shop/${slug}?cancelled=1`,
    metadata: { slug, code: items[0].metadata.code, title: items[0].name },
  });

  if (!session.url) {
    return NextResponse.json({ error: "No session URL" }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
