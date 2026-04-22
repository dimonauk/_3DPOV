# Vercel setup

One-time deploy steps. Do these after `docs/shopify-setup.md` steps 1–3
(you need the Shopify store domain and storefront access token before
Vercel can render anything).

## 1. Import the repo

vercel.com/new → Import Git Repository → pick `dimonauk/_3DPOV`.

- **Framework preset**: Next.js (auto-detected)
- **Root directory**: `.` (this branch has the site at the root)
- **Branch to deploy**: `holoflow-commerce` for staging,
  or set as production branch once you're happy

If you forked the commerce repo into its own repository instead
(`dimonauk/holoflow`), just swap the import source.

## 2. Set environment variables

Project → Settings → **Environment Variables**. Keys from `.env.example`:

| Key                              | Value                              | Environments |
|----------------------------------|------------------------------------|--------------|
| `SITE_NAME`                      | `Holo-Flow Studio`                 | all          |
| `COMPANY_NAME`                   | `Holo-Flow Studio`                 | all          |
| `SHOPIFY_STORE_DOMAIN`           | `holoflow-dev.myshopify.com`       | preview      |
| `SHOPIFY_STORE_DOMAIN`           | `holoflow.myshopify.com`           | production   |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN`| dev store token                    | preview      |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN`| prod store token                   | production   |
| `SHOPIFY_REVALIDATION_SECRET`    | `openssl rand -hex 32`             | all          |
| `NEXT_PUBLIC_MODEL_BASE_URL`     | CDN URL (optional)                 | all          |

Tip: on your desktop, pull these into `.env.local` with
```
vc env pull .env.local
```
once the Vercel CLI is authed to the project.

## 3. Deploy

First deploy runs on import. Subsequent deploys trigger on `git push`
to the branch.

If the first build fails with "Missing Shopify env vars," double-check
step 2 — both `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
are required for `next build` to complete (the build fetches the menu
and at least one product).

## 4. Custom domain (production only)

Project → Settings → Domains → Add `holoflow.co.uk` (and optionally
`www.holoflow.co.uk` as a redirect).

### Namecheap DNS records

In Namecheap → Domain List → `holoflow.co.uk` → **Manage** →
**Advanced DNS**, set the following (deleting any parking records
Namecheap added by default):

| Type  | Host  | Value                   | TTL       |
|-------|-------|-------------------------|-----------|
| A     | @     | `76.76.21.21`           | Automatic |
| CNAME | www   | `cname.vercel-dns.com.` | Automatic |

Vercel verifies ownership automatically once DNS propagates (a few
minutes to an hour). You'll get a green tick next to the domain when
it's live.

### After DNS is live

- Update Shopify webhooks to use
  `https://holoflow.co.uk/api/revalidate?secret=<SHOPIFY_REVALIDATION_SECRET>`
  (see `docs/shopify-setup.md` step 4).
- The OG tags and sitemap auto-pick up the domain via `VERCEL_URL`.
- If you want to force a specific production URL (for instance in
  previews that should still link back to prod), set
  `NEXT_PUBLIC_VERCEL_URL=holoflow.co.uk` as a production env var.

## 5. Analytics & Speed Insights

Project → Analytics → **Enable**. Project → Speed Insights → **Enable**.
No code changes needed — vercel/commerce already ships with the hooks.

## 6. Branch-per-stage

- `holoflow-commerce` → preview (dev store)
- `main` (or whatever you promote to) → production (prod store)

Set the production branch in Project → Settings → Git. Staging env vars
only attach to the preview environment, so staging experiments never
touch prod data.

## 7. Post-deploy smoke test

After the first successful deploy:

1. Open the Vercel-assigned URL. The landing hero should render with
   the chrome-sheen gradient text.
2. Navigate to `/search`. Products from the Shopify dev store should
   appear as a grid.
3. Pick any product with the `3d` tag. The product page should show
   a **Photographs / 3D view** tab strip. The 3D tab will show a tinted
   primitive until a GLB is uploaded (step 8).
4. Trigger a webhook: edit the seed product's title in Shopify admin,
   save. Within a few seconds the site should pick up the change
   without a redeploy. Watch `/api/revalidate` logs if not.

## 8. Upload GLB models

- Smallest path: commit them to `public/models/{handle}.glb` on the
  repo.
- Better path: use Vercel Blob. In the project, **Storage → Blob →
  Create store**, then upload via the dashboard or CLI. Copy the base
  URL into `NEXT_PUBLIC_MODEL_BASE_URL`.

## Troubleshooting

- **`Error fetching menu`** in the build log → the Headless app's
  storefront has no menu assigned to `next-js-frontend-header-menu`.
  See `docs/shopify-setup.md` step 3.
- **Webhook returns 200 but site still shows stale data** → Shopify
  uses tag-based revalidation. Check that the product tag is in the
  webhook body Vercel receives (it should be `products`). The route
  at `/app/api/revalidate/route.ts` is upstream vercel/commerce code —
  not modified here.
- **3D tab shows "Model pending" forever** → the HEAD request to the
  GLB URL is returning a non-2xx. Check the file is uploaded and the
  URL convention matches the product handle exactly.
