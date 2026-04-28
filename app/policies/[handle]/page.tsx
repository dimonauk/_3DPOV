import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopPolicy, POLICY_HANDLES } from "lib/shopify-policies";
import Footer from "components/layout/footer";

export async function generateStaticParams() {
  return POLICY_HANDLES.map((handle) => ({ handle }));
}

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const policy = await getShopPolicy(params.handle);
  if (!policy) return { title: "Policy" };
  return {
    title: policy.title,
    description: `${policy.title} — Holo-Flow Studio`,
  };
}

export default async function PolicyPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const policy = await getShopPolicy(params.handle);

  if (!policy || !policy.body) {
    return (
      <>
        <article className="mx-auto max-w-2xl px-6 py-24 prose-gallery">
          <div className="chrome-label">Policy</div>
          <h1 className="mt-4 text-5xl">Pending.</h1>
          <p className="mt-8 text-chrome-300">
            This policy has not been published yet. Once the studio's legal text
            is pasted into Shopify admin (<em>Settings → Policies</em>), it will
            render here automatically.
          </p>
        </article>
        <Footer />
      </>
    );
  }

  return (
    <>
      <article className="mx-auto max-w-2xl px-6 py-24">
        <div className="chrome-label">Policy</div>
        <h1 className="mt-4 text-5xl">{policy.title}</h1>
        <div
          className="prose-gallery mt-10 text-chrome-200 [&_a]:text-pink-200 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-chrome-100"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      </article>
      <Footer />
    </>
  );
}
