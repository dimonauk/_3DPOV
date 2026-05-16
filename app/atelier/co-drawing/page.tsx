import Footer from "components/layout/footer";

import CoDrawingClient from "./co-drawing-client";

export const metadata = {
  title: "Co-Drawing — drawing alongside Gemini",
  description:
    "Sketch on a canvas, write a one-line change, and Gemini's native image model redraws over your strokes. Pen colour and a clear button on the side; the rest is the round-trip.",
};

export default function CoDrawingPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Co-Drawing</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          You draw a line.
          <br />
          Gemini draws back.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small chamber over Gemini&rsquo;s native image generator.
          Drag the pointer to sketch; type one sentence in the bar
          below saying what to change or add; Gemini reads the canvas
          and redraws over it, keeping the same minimal-line style.
          Each suggestion replaces the canvas, so you can sketch on
          top of it again and ask for the next pass.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The drawing is sent once per request, the model returns a
          base64 PNG, the server forgets. Original Vite prototype by{" "}
          <a
            className="underline"
            href="https://x.com/trudypainter"
            target="_blank"
            rel="noopener noreferrer"
          >
            @trudypainter
          </a>{" "}
          and{" "}
          <a
            className="underline"
            href="https://x.com/alexanderchen"
            target="_blank"
            rel="noopener noreferrer"
          >
            @alexanderchen
          </a>{" "}
          on Google&rsquo;s AI Studio examples; ported here, wired
          through a server route so the API key stays off the client.
        </p>

        <div className="mt-12">
          <CoDrawingClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
