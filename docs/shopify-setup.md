# Shopify setup

One-time tasks in Shopify admin. These cannot be scripted — they live behind
the Shopify dashboard.

## 1. Create the dev store

Shopify Partners → Stores → Add store → **Development store**. Name it
`holoflow-dev` so the domain becomes `holoflow-dev.myshopify.com`. Leave
the data preset as "Start from scratch."

Same process for production when you're ready: the prod store lives at
`holoflow.myshopify.com` under the same Partners account.

## 2. Install the Headless app

In the Shopify admin for the dev store:

1. **Apps** → search for **Headless** (made by Shopify).
2. Install it.
3. Create a **Storefront** inside the Headless app. Name it `holo-flow-web`.
4. On the storefront's page, under **Storefront API access token**, copy
   the token. This is `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
5. Scopes: leave the defaults (read-only products, collections, cart).

## 3. Create the header menu

Shopify admin → Online Store → Navigation → **Add menu**.

- Title: `Main menu`
- Handle: the default Shopify assigns
- Items:
  - All objects → `/search`
  - Waveguides → `/search/waveguides`
  - Sculptures → `/search/sculptures`
  - Wall arrays → `/search/wall-arrays`
  - The practice → `/about`

Then: admin → Settings → **Store details** → scroll to **Sales channels** →
pick the Headless app → open `holo-flow-web` → **Menus** → assign the
Main menu to the handle `next-js-frontend-header-menu`
(that's the identifier vercel/commerce queries in
`components/layout/navbar/index.tsx`).

Same for the footer: create a menu called `Footer`, assign it to
`next-js-frontend-footer-menu`.

## 4. Configure webhooks

For ISR revalidation. Shopify admin → Settings → **Notifications** →
**Webhooks** at the bottom.

1. Generate the shared secret locally:
   ```sh
   openssl rand -hex 32
   ```
2. Set it as `SHOPIFY_REVALIDATION_SECRET` in Vercel.
3. For each event below, click **Create webhook**:

   - Format: **JSON**
   - API version: **latest stable**
   - URL: `https://YOUR_DOMAIN/api/revalidate?secret=YOUR_SECRET`
     (for the staging deploy, use the Vercel preview URL; switch to the
     production domain at cutover)

   Events:

   - `products/create`
   - `products/update`
   - `products/delete`
   - `collections/create`
   - `collections/update`
   - `collections/delete`

4. After each save, Shopify shows **Send test notification**. Send one;
   Vercel's logs for the `/api/revalidate` function should show a 200.

## 5. Seed a product

Before the storefront renders anything you need at least one active
product. Admin → Products → Add product.

- Title: `Waveguide I — Dawn Pass`
- Status: **Active**
- Media: upload 2-4 photographs
- Price: £420 (or whatever)
- Variants: leave the default (one variant) for now — configurable arrays
  use Shopify variants later.
- **Tags**: add `3d` if a GLB model will be provided. The product page
  will show a 3D view tab; the file is resolved from
  `/models/{product-handle}.glb`.
- Collection: create a collection called `Waveguides` if it doesn't exist
  and assign this product to it.

## 6. Point the store at the production domain (cutover only)

Shopify admin → Settings → Domains → Connect existing domain. Follow
Shopify's instructions for the CNAME / A records. Then update
`SHOPIFY_STORE_DOMAIN` in Vercel to `holoflow.myshopify.com` and redeploy.

## 7. Shopify Payments + Markets

- **Payments**: Settings → Payments → activate Shopify Payments. UK
  rates: 2% + 20p on Basic. No action needed in code.
- **Markets**: Settings → Markets. Add EU and US with local currencies
  enabled. vercel/commerce auto-displays the correct currency per
  visitor's market.

## Troubleshooting

- **Site renders blank** → check `SHOPIFY_STORE_DOMAIN` and
  `SHOPIFY_STOREFRONT_ACCESS_TOKEN` are set in Vercel. Both must point
  at the same store.
- **Webhook ping logs 401/403** → the secret in the URL doesn't match
  `SHOPIFY_REVALIDATION_SECRET` in Vercel. Re-check both sides.
- **Menu items empty** → the Headless app's storefront hasn't had the
  menu assigned to `next-js-frontend-header-menu`. Step 3 above.
