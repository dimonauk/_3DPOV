import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { WorkshopShell } from "components/shell/workshop-shell";
import { WelcomeToast } from "components/welcome-toast";
import { PlausibleAnalytics } from "components/analytics/plausible";
import { KlaviyoAnalytics } from "components/analytics/klaviyo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "components/auth/auth-provider";
import AuraLauncher from "components/aura/aura-launcher";
import { GlitchProvider } from "components/glitch/GlitchProvider";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { getCart } from "lib/shopify";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display-loaded",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
});

const { SITE_NAME } = process.env;
const NAME = SITE_NAME ?? "Holo-Flow Studio";
const DESCRIPTION =
  "Editioned waveguide sculptures, desktop objects, and configurable wall arrays from a twelve-year poi practice. Salford, UK.";

export const viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${NAME} — Light, held in the hand`,
    template: `%s | ${NAME}`,
  },
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: NAME,
    title: `${NAME} — Light, held in the hand`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${NAME} — Light, held in the hand`,
    description: DESCRIPTION,
  },
  robots: { follow: false, index: false },
  alternates: {
    types: {
      "application/atom+xml": [
        { url: "/feed.xml", title: "Holoflow Studio — all writing" },
        { url: "/articles/feed.xml", title: "Holoflow Studio — articles" },
        { url: "/journal/feed.xml", title: "Holoflow Studio — journal" },
        { url: "/tutorials/feed.xml", title: "Holoflow Studio — tutorials" },
      ],
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = getCart();

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="bg-warm-black-950 text-warm-black-50 antialiased">
        <AuthProvider>
          <GlitchProvider>
            <CartProvider cartPromise={cart}>
              <Navbar />
              <WorkshopShell>
                {children}
                <Toaster closeButton theme="dark" />
                <WelcomeToast />
              </WorkshopShell>
            </CartProvider>
            {/* Floating Aura chat — visible only on allow-listed pages. */}
            <AuraLauncher />
          </GlitchProvider>
        </AuthProvider>
        <PlausibleAnalytics />
        <KlaviyoAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
