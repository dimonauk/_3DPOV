export default function Loading() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="chrome-label">Body in space &mdash; again</div>
      <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
        Draw a trail.
      </h1>
      <p className="mt-10 text-chrome-400">Loading the scene&hellip;</p>
      <div className="mt-12 h-[60vh] w-full animate-pulse rounded-sm border border-warm-black-800 bg-[#0c0a12]" />
    </article>
  );
}
