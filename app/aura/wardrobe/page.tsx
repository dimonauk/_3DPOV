import WardrobeClient from "./wardrobe-client";

export const metadata = {
  title: "Aura — Wardrobe (drop a .vrm to change her outfit)",
  description:
    "Drop a .vrm file onto Aura and her outfit textures swap in place — the rig keeps animating, only the clothes change. A live test of the vrm.wardrobe.swap capability.",
};

const BASE_URL = "/dimona.vrm";

export default function AuraWardrobePage() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="chrome-label">Aura · Wardrobe</div>
      <h1 className="mt-4 text-4xl leading-[0.95] md:text-5xl">
        Drop a .vrm,
        <br />
        watch her change.
      </h1>
      <p className="mt-6 max-w-2xl text-chrome-200">
        The base rig is Aura&rsquo;s default avatar. Drop a second
        .vrm file (an &ldquo;outfit&rdquo;) anywhere on the viewport
        and her materials get re-skinned in place &mdash; same bones,
        same animations, different clothes. The capability matches
        meshes by name and copies texture maps + base colour from
        the outfit file onto the live rig.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-chrome-400">
        Works best with VRoid-exported outfit packs since the mesh
        naming stays consistent. Falls back to a fuzzy match if the
        names don&rsquo;t line up exactly. Drop more than one file
        and they queue.
      </p>

      <div className="mt-12 aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <WardrobeClient url={BASE_URL} />
      </div>

      <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
        <div className="chrome-label">How this differs</div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <span className="text-chrome-100">/demo/vrm</span> mounts
            the rig and applies a named pose. Doesn&rsquo;t touch
            outfit textures.
          </li>
          <li>
            <span className="text-chrome-100">/demo/aura-talks</span>{" "}
            runs the lipsync chain (TTS + visemes + mood blend).
            Orthogonal to wardrobe &mdash; her materials are
            whatever the base rig shipped with.
          </li>
          <li>
            <span className="text-chrome-100">/aura/web-llm</span>{" "}
            is a text-only browser-LLM chat. No rig, no overlap.
          </li>
        </ul>
      </section>
    </article>
  );
}
