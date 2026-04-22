#!/usr/bin/env tsx
import Stripe from "stripe";
import { getCollections } from "../lib/collections";
import { WORK_TYPE_LABEL } from "../lib/works";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
const dryRun = process.argv.includes("--dry-run");
const prefix = "CP";

type Plan = {
  productId: string;
  name: string;
  description: string;
  prices: { nickname: string; amountPence: number; lookupKey: string }[];
  metadata: Record<string, string>;
};

function buildPlans(): Plan[] {
  const plans: Plan[] = [];
  for (const c of getCollections()) {
    const base = {
      name: c.title,
      description: `${WORK_TYPE_LABEL[c.work.type]} · ${c.work.dimensions}`,
      metadata: {
        code: c.code,
        slug: c.slug,
        plateRef: c.plateRef,
        workType: c.work.type,
      },
    };

    if (c.work.type === "array") {
      plans.push({
        ...base,
        productId: `${prefix}_${c.code.toLowerCase()}`,
        prices: c.work.options.map((o) => ({
          nickname: `${o.panels}-panel`,
          amountPence: o.priceGBP * 100,
          lookupKey: `${c.slug}-${o.panels}p`,
        })),
      });
    } else {
      plans.push({
        ...base,
        productId: `${prefix}_${c.code.toLowerCase()}`,
        prices: [
          {
            nickname: "primary",
            amountPence: c.work.priceGBP * 100,
            lookupKey: c.slug,
          },
        ],
      });
    }
  }
  return plans;
}

async function upsertProduct(plan: Plan) {
  const existing = await stripe.products
    .retrieve(plan.productId)
    .catch(() => null);

  if (existing) {
    console.log(`  ~ product ${plan.productId} (${plan.name}) already exists — updating metadata`);
    if (dryRun) return;
    await stripe.products.update(plan.productId, {
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });
    return;
  }

  console.log(`  + creating product ${plan.productId} (${plan.name})`);
  if (dryRun) return;
  await stripe.products.create({
    id: plan.productId,
    name: plan.name,
    description: plan.description,
    metadata: plan.metadata,
  });
}

async function upsertPrice(plan: Plan, price: Plan["prices"][number]) {
  const search = await stripe.prices.list({
    lookup_keys: [price.lookupKey],
    limit: 1,
  });
  const current = search.data[0];

  if (current && current.unit_amount === price.amountPence) {
    console.log(`    = price ${price.lookupKey} unchanged (£${price.amountPence / 100})`);
    return;
  }

  if (current) {
    console.log(`    - deactivating stale price ${current.id} (£${(current.unit_amount ?? 0) / 100})`);
    if (!dryRun) {
      await stripe.prices.update(current.id, { active: false });
    }
  }

  console.log(`    + creating price ${price.lookupKey} (£${price.amountPence / 100})`);
  if (dryRun) return;
  await stripe.prices.create({
    product: plan.productId,
    unit_amount: price.amountPence,
    currency: "gbp",
    nickname: price.nickname,
    lookup_key: price.lookupKey,
    transfer_lookup_key: true,
  });
}

async function main() {
  const plans = buildPlans();
  console.log(
    `${dryRun ? "[dry-run] " : ""}Syncing ${plans.length} collections to Stripe…\n`
  );
  for (const plan of plans) {
    console.log(plan.name);
    await upsertProduct(plan);
    for (const price of plan.prices) {
      await upsertPrice(plan, price);
    }
    console.log("");
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
