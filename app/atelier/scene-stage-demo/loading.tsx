/**
 * app/atelier/scene-stage-demo/loading.tsx — Loading skeleton.
 *
 * Matches the showcase chrome so the page settles in place rather
 * than reflowing once the client component hydrates. Quiet pulse;
 * no animation under reduced-motion (Tailwind's `animate-pulse`
 * already opts out via the global media-query rule).
 */

export default function Loading() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <div className="chrome-label">Atelier &middot; Scene-Stage</div>
      <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
        One scene,
        <br />
        three doors in.
      </h1>
      <p className="mt-6 max-w-2xl text-chrome-400">
        Compiling the TSL presets&hellip;
      </p>
      <div className="mt-12 h-[68vh] w-full animate-pulse rounded-md border border-warm-black-700 bg-warm-black-950" />
    </article>
  );
}
