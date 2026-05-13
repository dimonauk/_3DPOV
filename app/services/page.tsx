import Footer from "components/layout/footer";
import Link from "next/link";
import {
  pricingStatusLabel,
  readinessLabel,
  serviceGroups,
  servicesByCategory,
  type Service,
} from "lib/services";

export const metadata = {
  title: "Services — every line the studio offers, in one place",
  description:
    "The full commercial surface of Holo-Flow Studio. Editioned prints, aerial and bureau commissions, bespoke sculpture, belt-printed wall reliefs, Looking Glass quilts, the Bezel-Clip controllers, workshops and courses, and the Rookery forum membership.",
};

export default function ServicesPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">What the studio offers</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Services.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          The studio&rsquo;s full commercial surface, drawn together so a
          visitor can see what the bench offers at a glance. Editioned
          prints, aerial and bureau commissions, bespoke sculpture bred
          from a recorded gesture, belt-printed wall reliefs, Looking
          Glass quilts, the Bezel-Clip controllers, workshops in the
          studio, and the Rookery forum.
        </p>

        <p className="mt-4 max-w-xl text-chrome-300">
          Behind every line on this page is a one-person practice. The
          editioned work sells through the catalogue; the bespoke work
          runs through a calendar gate and is quoted per brief. Lead
          times are named in the reply email rather than promised on
          this page, because what a one-person studio can carry depends
          on what&rsquo;s already on the bench.
        </p>

        <p className="mt-4 max-w-xl text-chrome-300">
          On price: the studio prices at market for the comparable work
          and names accessibility where access can be named &mdash; the
          Nine Seconds workshop holds one seat per cohort on a
          sliding scale, the Rookery&rsquo;s{" "}
          <Link
            href="/rookery/about"
            className="text-pink-200 underline underline-offset-4"
          >
            &ldquo;what if I can&rsquo;t afford it&rdquo;
          </Link>{" "}
          FAQ names a comp route into the forum. The studio&rsquo;s
          trans-led and disability-informed framing isn&rsquo;t a global
          discount mechanism; it&rsquo;s a reason to be honest in the
          rooms where access matters. Undercutting the headline price
          would undercut the argument that the work is worth what it
          costs.
        </p>

        <div className="mt-16 space-y-20">
          {serviceGroups.map((group) => {
            const items = servicesByCategory(group.category);
            if (items.length === 0) return null;
            return (
              <section key={group.category} className="scroll-mt-24" id={group.category}>
                <div className="chrome-label text-pink-200 mb-2">
                  {group.label}
                </div>
                <h2 className="text-3xl text-chrome-100">{group.title}</h2>
                <p className="mt-3 max-w-prose text-chrome-300">
                  {group.intro}
                </p>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {items.map((service) => (
                    <ServiceCard key={service.slug} service={service} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Where to go next</div>
          <p className="mt-3 text-chrome-300">
            Every line above emerges from the same architecture &mdash;{" "}
            <Link
              href="/the-loop"
              className="text-pink-200 underline underline-offset-4"
            >
              The Loop
            </Link>
            , the studio&rsquo;s end-to-end practice from a poi gesture to a
            printed object. The people behind the work are named on{" "}
            <Link
              href="/about"
              className="text-pink-200 underline underline-offset-4"
            >
              About
            </Link>
            ; conversations about commissions and the bench live in{" "}
            <Link
              href="/rookery"
              className="text-pink-200 underline underline-offset-4"
            >
              the Rookery
            </Link>
            ; the catch-all path is{" "}
            <Link
              href="/contact"
              className="text-pink-200 underline underline-offset-4"
            >
              /contact
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const cta = ctaFor(service);
  return (
    <article className="flex flex-col rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chrome-label text-[0.6rem] text-chrome-400">
          {readinessLabel(service.readiness)}
        </span>
        <span className="chrome-label text-[0.6rem] text-pink-200">
          {pricingStatusLabel(service.pricingStatus)}
        </span>
      </div>
      <h3 className="mt-3 text-xl text-chrome-100">{service.name}</h3>
      <p className="mt-3 text-sm text-chrome-200">{service.pitch}</p>
      <p className="mt-3 text-xs italic text-chrome-400">
        {service.honestLine}
      </p>

      {service.tiers ? (
        <ul className="mt-5 space-y-4 border-t border-warm-black-800 pt-5">
          {service.tiers.map((tier) => (
            <li key={tier.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm text-chrome-100">{tier.name}</span>
                <span
                  className="text-xs text-pink-200"
                  data-pricing={
                    service.pricingStatus === "live" ? undefined : service.pricingStatus
                  }
                >
                  {tier.price}
                </span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-chrome-300">
                {tier.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : service.price ? (
        <p
          className="mt-5 border-t border-warm-black-800 pt-5 text-sm text-pink-200"
          data-pricing={
            service.pricingStatus === "live" ? undefined : service.pricingStatus
          }
        >
          {service.price}
        </p>
      ) : null}

      {cta ? (
        <div className="mt-6">
          <Link
            href={cta.href}
            className="inline-block rounded-full border border-pink-200/40 bg-pink-200/10 px-4 py-2 chrome-label text-xs text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
          >
            {cta.label} &rarr;
          </Link>
        </div>
      ) : null}
    </article>
  );
}

type Cta = { label: string; href: string };

function ctaFor(service: Service): Cta | null {
  // If the service has a dedicated route, link to it first.
  if (service.href) {
    let label: string;
    switch (service.pricingStatus) {
      case "live":
        label = "See the catalogue";
        break;
      case "interest-list":
        label = "Join the interest list";
        break;
      case "calendar-gated":
        label = "Read the page";
        break;
      case "proposed":
        label = "Read the page";
        break;
    }
    // Special-case the Rookery tiers — they share a route.
    if (service.href === "/rookery/tiers") {
      label = "See the tiers";
    }
    if (service.href === "/photographs") {
      label = "See the catalogue";
    }
    if (service.href === "/bezel") {
      label = "Join the interest list";
    }
    if (service.href === "/aerial") {
      label = "Read the line";
    }
    if (service.href === "/bureau") {
      label = "Read the bureau";
    }
    return { label, href: service.href };
  }
  // Otherwise route through the contact form.
  if (service.contactIntent) {
    return {
      label: "Brief the studio",
      href: `/contact?intent=${service.contactIntent}`,
    };
  }
  return null;
}
