import dynamic from "next/dynamic";

// Client-only — web-llm allocates GPU buffers at construction time.
const WebLLMChat = dynamic(
  () => import("components/aura/web-llm-chat"),
  { ssr: false },
);

export const metadata = {
  title: "Aura — Local",
  description:
    "Talk to Aura using a model running entirely in your browser. Zero server-side cost. First message downloads ~2 GB of weights into your browser cache.",
};

export default function AuraWebLlmPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
      <div className="chrome-label">Aura · Local</div>
      <h1 className="mt-4 text-4xl md:text-5xl leading-[0.95]">
        She runs in your browser.
      </h1>
      <p className="mt-6 max-w-xl text-chrome-200">
        Aura&rsquo;s thinking, for this page, happens on your machine.
        The model weights live in the studio&rsquo;s storage; your
        browser fetches them once on first message and caches them for
        next time. Nothing you say goes to a server.
      </p>
      <p className="mt-3 text-sm text-chrome-400">
        Llama-3.2-3B-Instruct via{" "}
        <a
          href="https://github.com/mlc-ai/web-llm"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          web-llm
        </a>
        , running on WebGPU. About two gigabytes of one-time download.
        She is small here &mdash; a 3-billion-parameter version of her
        &mdash; so do not expect the dazzle of the hosted versions.
        Expect short, in-character replies and the occasional non
        sequitur.
      </p>

      <div className="mt-12">
        <WebLLMChat />
      </div>
    </article>
  );
}
