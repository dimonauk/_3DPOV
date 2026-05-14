import Footer from "components/layout/footer";

export const metadata = {
  title: "Research",
  description:
    "Holo-Flow Studio's research surface. Where the studio's experimental pipelines land their outputs — research-licence-only material that lives in the open as a notebook, not a product.",
};

export default function ResearchIndexPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Research</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The notebook.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A public surface for the studio&rsquo;s research pipelines.
          Things here are made for the looking, not the buying &mdash;
          mostly because the licences underneath say so. Apple SHARP,
          for instance, sits behind an academic-only licence; the
          archives it produces can live here as a record, not as a
          catalogue.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The commerce-grade pipelines (Postshot training, the
          studio&rsquo;s POV-rig captures, the Luma-routed work) land
          on the product surfaces instead. The split is structural:
          every record carries a licence, and the commerce filter
          honours it.
        </p>

        <section className="mt-16 space-y-10">
          <div>
            <div className="chrome-label">In progress</div>
            <h2 className="mt-3 text-2xl">CCTV 3D Archive</h2>
            <p className="mt-3 max-w-xl text-sm text-chrome-300">
              90 stills from public CCTV across London, each run
              through Apple SHARP via ONNX on the studio bench, each
              becoming a 1.18&nbsp;million-gaussian splat of the
              moment it was taken. A study in what a city looks like
              when it sees itself.
            </p>
            <p className="mt-3 max-w-xl text-xs text-chrome-500">
              Public viewer not wired yet. Outputs are landing in the
              studio archive while the surface is built.
            </p>
          </div>
        </section>
      </article>
      <Footer />
    </>
  );
}
