import Footer from "components/layout/footer";

import VeoClient from "./veo-client";

export const metadata = {
  title: "Veo — Atelier",
  description:
    "Text becomes a short video. Google's Veo 3, called from the browser. 4–8 second clips, 16:9 or 9:16, optional audio. Free on the studio's small quota; paste your own AI Studio key for unbounded use.",
};

export default function VeoPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Veo</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Type a sentence.
          <br />
          Get a short film back.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small chamber over Google&rsquo;s Veo 3. Write what you
          want to see; pick aspect ratio + duration; the model thinks
          for about a minute and hands back a four-to-eight-second
          mp4. Optional native audio (ambient + foley) bakes into the
          clip. The chamber polls the job for you and surfaces the
          result the moment Google says it&rsquo;s ready.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The studio covers a couple of generations per visitor per
          hour on its own quota &mdash; video is materially more
          expensive than stills, so the cap is tighter than Imagen&rsquo;s.
          Beyond that, paste your own AI Studio key in settings and
          the call goes browser &rarr; Google directly, no cap. The
          server forgets the bytes the moment the response leaves;
          nothing is stored.
        </p>

        <div className="mt-12">
          <VeoClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
