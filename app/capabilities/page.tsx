import Footer from "components/layout/footer";
import Link from "next/link";
import {
  listCapabilities,
  type CapabilityKind,
  type CapabilityRecord,
} from "lib/capabilities";

export const metadata = {
  title:
    "Capabilities — every brick the studio knows about",
  description:
    "The capability registry: every typed atom in the Holoflow Studio system. Each row is a Duplo-scale brick with named plugs (state slices it reads/writes, dependencies, source attribution). The substrate for the VR Duplo programming language.",
};

const KIND_ORDER: CapabilityKind[] = [
  "vrm",
  "audio",
  "motion",
  "agent",
  "input",
  "viz",
  "geo",
  "world",
  "shell",
  "algo",
];

const KIND_LABEL: Record<CapabilityKind, string> = {
  vrm: "VRM",
  audio: "Audio",
  motion: "Motion",
  agent: "Agent",
  input: "Input",
  viz: "Visualisation",
  geo: "Geolocation",
  world: "World",
  shell: "Shell",
  algo: "Algorithm",
};

function statusClass(status: CapabilityRecord["status"]): string {
  if (status === "registered") return "border-pink-200/60 text-pink-200";
  if (status === "stub") return "border-warm-black-700 text-chrome-400";
  return "border-warm-black-800 text-chrome-500 line-through";
}

function statusLabel(status: CapabilityRecord["status"]): string {
  return status;
}

function CapabilityCard({ cap }: { cap: CapabilityRecord }) {
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-chrome-400">{cap.id}</div>
          <h3 className="mt-1 text-lg text-chrome-100">{cap.name}</h3>
        </div>
        <div
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusClass(
            cap.status,
          )}`}
        >
          {statusLabel(cap.status)}
        </div>
      </div>

      <p className="mt-3 text-sm text-chrome-300">{cap.summary}</p>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-xs text-chrome-300 md:grid-cols-2">
        {cap.stateSlices && cap.stateSlices.length > 0 && (
          <div>
            <dt className="chrome-label">State plugs</dt>
            <dd className="mt-1 font-mono text-chrome-200">
              {cap.stateSlices.join(", ")}
            </dd>
          </div>
        )}
        {cap.dependsOn && cap.dependsOn.length > 0 && (
          <div>
            <dt className="chrome-label">Depends on</dt>
            <dd className="mt-1 font-mono text-chrome-200">
              {cap.dependsOn.join(", ")}
            </dd>
          </div>
        )}
        <div className="md:col-span-2">
          <dt className="chrome-label">Source</dt>
          <dd className="mt-1 text-chrome-400">{cap.source}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function CapabilitiesIndexPage() {
  const all = listCapabilities();
  const byKind = new Map<CapabilityKind, CapabilityRecord[]>();
  for (const cap of all) {
    const list = byKind.get(cap.kind) ?? [];
    list.push(cap);
    byKind.set(cap.kind, list);
  }
  const registeredCount = all.filter((c) => c.status === "registered").length;
  const stubCount = all.filter((c) => c.status === "stub").length;

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">The substrate</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Every brick the
          <br />
          studio knows about.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The capability registry is the discovery surface for every
          typed atom in the system. Each row is a Duplo-scale brick
          with named plugs: which state slices it reads or writes,
          which other bricks it depends on, where the code was
          ported from. The substrate for what is becoming a VR
          Duplo programming language.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          <span className="text-pink-200">{registeredCount} registered</span>{" "}
          &middot; <span className="text-chrome-400">{stubCount} stub</span>{" "}
          &middot; total <span className="text-chrome-200">{all.length}</span>.
          Stub bricks have their metadata but no runnable module yet
          &mdash; atomisation in progress per the{" "}
          <Link
            href="https://github.com/holoflowstudio/holoflow-co-uk/blob/main/docs/CAPABILITY_REGISTRY_PLAN.md"
            className="text-pink-200 underline underline-offset-4"
          >
            capability registry plan
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier
          </Link>
          <Link
            href="/stack"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            the stack
          </Link>
          <Link
            href="/photographs"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            photographs
          </Link>
        </div>

        {KIND_ORDER.map((kind) => {
          const caps = byKind.get(kind);
          if (!caps || caps.length === 0) return null;
          return (
            <section key={kind} className="mt-16">
              <div className="chrome-label">{KIND_LABEL[kind]}</div>
              <h2 className="mt-3 text-2xl text-chrome-100">
                {caps.length} brick{caps.length === 1 ? "" : "s"}
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {caps.map((cap) => (
                  <CapabilityCard key={cap.id} cap={cap} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-20 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Reading order</div>
          <p className="mt-3">
            The registry lives at{" "}
            <span className="font-mono text-chrome-200">
              lib/capabilities/index.ts
            </span>{" "}
            and its typed contract at{" "}
            <span className="font-mono text-chrome-200">
              lib/capabilities/_base.ts
            </span>
            . Each brick is a single file under{" "}
            <span className="font-mono text-chrome-200">
              lib/capabilities/&lt;kind&gt;/&lt;verb&gt;.ts
            </span>{" "}
            paired with a{" "}
            <span className="font-mono text-chrome-200">.PURPOSE.md</span>{" "}
            twin. State plugs map onto zustand slices at{" "}
            <span className="font-mono text-chrome-200">lib/state/</span>.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
