import Footer from "components/layout/footer";
import Link from "next/link";
import VRMDemoClient from "./vrm-demo-client";

export const metadata = {
  title: "VRM demo — bricks composing in front of you",
  description:
    "End-to-end test of the capability stack: vrm.load + vrm.bones.pose + VRMAvatar wired through the vrm zustand slice. Drops Aura into her hostess-superheroine-brat held default pose.",
};

const DEFAULT_URL = "/nanny.vrm";

export default function VRMDemoPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Demo &middot; capability stack</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Bricks composing,
          <br />
          live.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          End-to-end test of three bricks at once:{" "}
          <span className="font-mono text-chrome-100">vrm.load</span>{" "}
          parses the file and registers a handle in the{" "}
          <span className="font-mono text-chrome-100">vrm</span>{" "}
          slice; <span className="font-mono text-chrome-100">vrm.bones.pose</span>{" "}
          writes Aura&rsquo;s <span className="text-pink-200">auraDefault</span>{" "}
          (hostess-superheroine-brat held stance) to the slice;
          the{" "}
          <span className="font-mono text-chrome-100">VRMAvatar</span>{" "}
          component subscribes to the slice and applies it to the
          rig every frame.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          If you don&rsquo;t see Aura below, drop{" "}
          <span className="font-mono text-chrome-200">nanny.vrm</span>{" "}
          into <span className="font-mono text-chrome-200">/public/</span>{" "}
          and reload &mdash; the demo expects{" "}
          <span className="font-mono text-chrome-200">{DEFAULT_URL}</span>{" "}
          by default.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            registry
          </Link>
          <Link
            href="/stack"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            the stack
          </Link>
        </div>

        <div className="mt-12 aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <VRMDemoClient url={DEFAULT_URL} />
        </div>

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What this proves</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              The capability registry pattern works end-to-end:
              capability writes the slice, component reads it,
              the rig moves.
            </li>
            <li>
              The state-bus contract is honoured: VRMAvatar never
              imports the capability&rsquo;s internals, only the
              slice and the loader entry-point.
            </li>
            <li>
              Aura&rsquo;s character lands as data, not code:
              swap the named pose, the stance changes. No
              animation pipeline coupling.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
