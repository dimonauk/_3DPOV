import Script from "next/script";

/**
 * Klaviyo on-site tracking + form embeds. Activates when
 * NEXT_PUBLIC_KLAVIYO_COMPANY_ID is set. Loads the Klaviyo JS globally
 * so embedded signup forms anywhere on the site work without per-form
 * bootstrap code.
 *
 * Docs: https://developers.klaviyo.com/en/docs/javascript_web_tracking
 *
 * Forms created in the Klaviyo dashboard can be embedded by dropping a
 * <div class="klaviyo-form-XXXXXX" /> anywhere — the script auto-binds.
 * The existing <NewsletterForm /> posts to /api/newsletter which should
 * later forward to Klaviyo's Profile Subscription API; the on-page
 * script here is for behavioural tracking, popups, and embedded forms.
 */
export function KlaviyoAnalytics() {
  const companyId = process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID;
  if (!companyId) return null;
  return (
    <Script
      async
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${companyId}`}
      strategy="afterInteractive"
    />
  );
}
