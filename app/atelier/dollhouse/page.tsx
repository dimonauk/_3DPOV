import Footer from "components/layout/footer";

import DollhouseClient from "./dollhouse-client";

export const metadata = {
  title: "Dollhouse — doll-character prompt composer",
  description:
    "Pick a character from the doll bible, dress them, place them in a room, give them an action. The chamber assembles a cinematic miniature-photography prompt and asks Imagen for the frame. Tactical Kawaii by structured fields, not by hand-typed paragraphs.",
};

export default function DollhousePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Dollhouse</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Pick a character.
          <br />
          Stage the shot.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small bible drives this chamber: three characters (Dolly,
          Theo, K-17), their wardrobes, five canonical actions, four
          rooms across three floors, and three aesthetic registers.
          Choose along each axis; the chamber composes a single
          structured prompt and hands it to Imagen. The studio quota
          covers a handful of frames per visitor per hour; paste your
          own AI Studio key for unbounded use.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Ported from{" "}
          <code className="font-mono text-chrome-200">
            D:/The_Hangar/apps/prototypes/dollhouse-1/
          </code>{" "}
          (a synthwave CRT cockpit prototype). The chamber here keeps
          the prompt-composer spine and the bible; the cockpit shell,
          the Gemini terminal, the chronicles reader and the physics
          visualiser stayed in the bench prototype. The image is
          generated and returned; the studio&rsquo;s server forgets
          beyond the request lifetime.
        </p>

        <div className="mt-12">
          <DollhouseClient />
        </div>
      </article>
      <Footer />
    </>
  );
}
