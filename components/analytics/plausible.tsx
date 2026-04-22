import Script from "next/script";

/**
 * Plausible analytics. Activates when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is
 * set in Vercel env vars (e.g. "holoflow.co.uk"). No cookies, no
 * fingerprinting, GDPR-clean, no banner required.
 *
 * Docs: https://plausible.io/docs/plausible-script
 */
export function PlausibleAnalytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
