/**
 * app/pricing/page.tsx — Investment / pricing guide.
 *
 * Three-tier indicative pricing across Heritage Documentation, VR
 * Development, and Parametric Manufacturing. Cribbed from the v5
 * reference HTML's `#p-pricing` section; uses the shared holoflow
 * vocabulary (SectionHeader / PriceGrid / PriceCard / Card) so the
 * page is composition, not handwritten styling.
 *
 * Voice: catalogue. Honest about scoping ("indicative", "stub").
 * The full pricing matrix lands later; this is the public-facing
 * shape today.
 */

import type { Metadata } from "next";

import {
  Card,
  ChromeLabel,
  PriceCard,
  PriceGrid,
  SectionHeader,
} from "components/holoflow";

export const metadata: Metadata = {
  title: "Pricing — Holo-Flow Studio",
  description:
    "Indicative pricing for heritage documentation, VR development, and parametric manufacturing commissions. All projects scoped individually; final cost agreed before any work begins.",
};

const HERITAGE_FEATURES = [
  { label: "Photogrammetry capture session" },
  { label: "Blender mesh processing" },
  { label: "Heritage England archive" },
  { label: "WebXR or .glb delivery" },
  { label: "Documentation report" },
  { label: "On-site installation", included: false },
  { label: "VR experience build", included: false },
];

const VR_FEATURES = [
  { label: "VRM character design" },
  { label: "Soul server + conditioning" },
  { label: "KokoroTTS voice integration" },
  { label: "WebXR scene build" },
  { label: "Emotion + animation system" },
  { label: "Knowledge base integration" },
  { label: "Hosting + maintenance" },
];

const FAB_FEATURES = [
  { label: "BY-GEN brief configuration" },
  { label: "Genome mutation + VLM scoring" },
  { label: "Blender geometry processing" },
  { label: "Resin or FDM print" },
  { label: "Digital file delivery" },
  { label: "Edition signing", included: false },
  { label: "Jewel Array listing", included: false },
];

export default function PricingPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:py-24">
      <ChromeLabel withRule accent="gold">
        Investment
      </ChromeLabel>
      <SectionHeader
        eyebrow="Pricing guide"
        title={
          <>
            Pricing <em>guide</em>
          </>
        }
        body="Indicative ranges. All projects scoped individually. Prices in GBP, excluding materials and travel."
        accent="gold"
      />

      <PriceGrid>
        <PriceCard
          tier="Heritage Documentation"
          price="£2k–£20k"
          period="per project · scope-dependent"
          description="Single-object scans to full site surveys."
          features={HERITAGE_FEATURES}
          cta={{ label: "Get a quote →", href: "/contact" }}
        />
        <PriceCard
          tier="VR Development"
          price="£5k–£50k"
          period="per project · complexity-tiered"
          description="Single-scene WebXR to full Aura deployments with soul-server, VRM character, and hosting."
          features={VR_FEATURES}
          cta={{ label: "Commission Aura →", href: "/contact" }}
          featured
          badge="Most requested"
        />
        <PriceCard
          tier="Parametric Manufacturing"
          price="£500–£8k"
          period="per piece / edition"
          description="Single bespoke pieces to limited editions. Includes design, BY-GEN evolution, and print."
          features={FAB_FEATURES}
          cta={{ label: "Commission a piece →", href: "/contact" }}
        />
      </PriceGrid>

      <Card className="mt-2">
        <p className="font-mono text-[11px] leading-relaxed text-chrome-400">
          All prices are indicative — final scope and cost agreed before
          any work begins. Heritage documentation projects may qualify for
          grant co-funding. Charming Academy pilot programme pricing is
          separate.{" "}
          <em className="text-chrome-500">
            Full pricing matrix in development.
          </em>
        </p>
      </Card>
    </main>
  );
}
