# Shopify metaobjects — print-vendor catalogue migration

Until you complete the admin setup below, the site reads the
hand-curated `lib/print-vendors/studio-manchester.ts` as its
single vendor. Once these metaobject definitions exist and
`SHOPIFY_VENDOR_METAOBJECT_HANDLE` is set on Vercel, the site
auto-switches to the Shopify-backed source and you can edit
material/scale/finish pricing in Shopify admin without a code
deploy.

The code path is already shipped (`lib/print-vendors/shopify-source.ts`).
It returns null until the env var is set, so this is opt-in.

## Why this exists

- **Edits without deploys** — material prices, finish surcharges,
  lead-time copy all change in Shopify admin, not in a code edit.
- **Multi-vendor** — when the second partner contract lands
  (Sculpteo, Shapeways, etc), create another metaobject entry
  rather than another file under `lib/print-vendors/`.
- **Single source of truth** for the print-bar's catalogue + any
  future PartnerPicker UI.

The hand-curated `studio-manchester.ts` stays in the tree as a
build-time fallback in case Shopify is unreachable at runtime.

## Step 1 — Create the metaobject definitions

In Shopify admin: **Content → Metaobjects → Add definition**.
Create three definitions in this order — the vendor references
the others.

### `PrintMaterial` (Type: `print_material`)

| Field key | Type | Required | Notes |
|---|---|---|---|
| `slug` | Single line text | yes | Validation: matches `^[a-z][a-z0-9-]*$` |
| `label` | Single line text | yes | Human label for the dropdown |
| `finishes` | Single line text (JSON) | yes | e.g. `["raw","sanded","polished"]` |
| `base_price_per_cm3_gbp` | Decimal | yes | £/cm³ at palm scale |
| `blurb` | Multi-line text | yes | One-line "what this looks like" |

**Storefront access:** tick the Storefront access checkbox at
the bottom of the definition page.

### `PrintScaleBand` (Type: `print_scale_band`)

| Field key | Type | Required | Notes |
|---|---|---|---|
| `slug` | Single line text | yes | `palm | desktop | shelf | wall` |
| `label` | Single line text | yes | e.g. "Desktop (100–200mm)" |
| `longest_edge_min_mm` | Integer | yes | Inclusive lower bound |
| `longest_edge_max_mm` | Integer | yes | Inclusive upper bound |
| `price_multiplier` | Decimal | yes | Convention: palm = 1, desktop ≈ 2.5, shelf ≈ 6, wall ≈ 14 |

**Storefront access:** tick.

### `PrintLeadTime` (Type: `print_lead_time`)

| Field key | Type | Required | Notes |
|---|---|---|---|
| `print_days` | Integer | yes | Working-days on the bench |
| `ship_days_uk` | Integer | yes | Working-days bench → door (UK default) |
| `ships_from` | Single line text | yes | e.g. "Manchester" |

**Storefront access:** tick.

### `PrintVendor` (Type: `print_vendor`)

| Field key | Type | Required | Notes |
|---|---|---|---|
| `id` | Single line text | yes | Must match a `PrintVendorId` literal in `lib/print-vendors/_base.ts` — currently one of `studio-manchester | shapeways | sculpteo | treatstock`. New vendors require a literal-union extension first. |
| `name` | Single line text | yes | Human label |
| `blurb` | Multi-line text | yes | One-line vendor description |
| `vendor_homepage` | URL | yes | The vendor's external page |
| `country` | Single line text | yes | ISO 3166-1 alpha-2: `GB | FR | US | DE` |
| `materials` | Metaobject (reference, multiple) | yes | Point at `print_material` entries |
| `scale_bands` | Metaobject (reference, multiple) | yes | Point at `print_scale_band` entries |
| `lead_time` | Metaobject (reference, single) | yes | Point at a `print_lead_time` entry |
| `finish_surcharge_gbp` | Single line text (JSON) | yes | Flat £ surcharges. Example: `{"raw":0,"sanded":12,"polished":38,"painted":55}` |

**Storefront access:** tick — and also ensure
`unauthenticated_read_metaobjects` is enabled on the Headless
storefront's Storefront API permissions for the `print_vendor`,
`print_material`, `print_scale_band`, and `print_lead_time`
definitions specifically.

## Step 2 — Seed the entries

Mirror the data in `lib/print-vendors/studio-manchester.ts`:

1. Create 6 `print_material` entries: `resin-grey`, `resin-clear`,
   `pla-white`, `nylon-mjf`, `steel-stainless`, `bronze-sintered`.
   Each gets its slug + label + finishes JSON + base price + blurb.
2. Create 4 `print_scale_band` entries: `palm`, `desktop`, `shelf`,
   `wall`, with the mm bounds and multipliers from the file.
3. Create 1 `print_lead_time` entry, e.g. handle `manchester-default`,
   with `5` / `2` / `Manchester`.
4. Create 1 `print_vendor` entry, e.g. handle `studio-manchester`,
   with all the references + the `finish_surcharge_gbp` JSON.

## Step 3 — Wire the env var

Once the vendor entry exists, set its handle on Vercel:

```bash
vercel env add SHOPIFY_VENDOR_METAOBJECT_HANDLE production \
  --value studio-manchester --yes
vercel env add SHOPIFY_VENDOR_METAOBJECT_HANDLE preview master \
  --value studio-manchester --yes
vercel env add SHOPIFY_VENDOR_METAOBJECT_HANDLE development \
  --value studio-manchester --yes
```

Trigger a fresh deploy. The site will now fetch from Shopify
on every request; failures fall back to the hand-curated catalogue
with a console.warn.

## Step 4 — Validate

- Open `/holo-walk/<id>` or any `/atelier/algorithms/<slug>` page.
- The print-bar should show the same options as before but now
  sourced from Shopify.
- Edit a material's `base_price_per_cm3_gbp` in Shopify admin →
  next request reflects the change (no rebuild needed once you
  wire revalidation).

## Step 5 (optional) — Cache invalidation on edit

Add a `metaobjects/update` webhook in Shopify → notifications
pointing at `https://holoflow.co.uk/api/revalidate?secret=…`.
The current revalidate route handles product + collection topics;
extending it for `metaobjects/*` is a 5-line addition (add the
topic to the route's whitelist, revalidate the `print-vendor`
tag). Defer until you actually start editing in admin.

## Reverting

To switch back to the hand-curated path, simply remove
`SHOPIFY_VENDOR_METAOBJECT_HANDLE` from Vercel and redeploy.
The Shopify source returns null without it, and the hand-curated
catalogue takes over.
