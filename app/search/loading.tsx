export default function Loading() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="chrome-label">Search the archive</div>
      <div className="mt-4 h-12 w-40 animate-pulse rounded-sm bg-warm-black-800" />
      <div className="mt-8 h-4 w-3/4 animate-pulse rounded-sm bg-warm-black-800" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded-sm bg-warm-black-800" />
      <div className="mt-10 h-12 w-full animate-pulse rounded-sm bg-warm-black-800" />
      <div className="mt-16 space-y-4">
        <div className="h-4 w-1/4 animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-4 w-3/4 animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-4 w-2/3 animate-pulse rounded-sm bg-warm-black-800" />
      </div>
    </article>
  );
}
