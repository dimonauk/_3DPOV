/**
 * Instructable.tsx — Slim orchestrator. Bands live in sibling files.
 */
import type { InstructableMeta, InstructableTroubleshooting } from "lib/tutorials/types";
import { INSTRUCTABLE_STYLES } from "./instructable-styles";
import { DependenciesBand, SoftwareBand, SuppliesBand } from "./instructable-supplies";
import { StepsBand } from "./instructable-steps";

const DIFFICULTY_LABELS: Record<string, string> = {
  novice: "Novice", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert",
};

export function Instructable({ meta, slug }: { meta: InstructableMeta; slug?: string }) {
  const hasSupplies = !!meta.supplies && (
    (meta.supplies.materials?.length ?? 0) > 0 ||
    (meta.supplies.tools?.length ?? 0)      > 0 ||
    (meta.supplies.provisions?.length ?? 0) > 0
  );
  const hasSoftware      = (meta.software?.length     ?? 0) > 0;
  const hasDependencies  = (meta.dependencies?.length ?? 0) > 0;
  const bomDownloadHref  = slug && (hasSupplies || hasSoftware || hasDependencies) ? `/api/tutorials/${slug}/bom.csv` : undefined;

  return (
    <section className="instructable" aria-label="Test Chamber sheet">
      <style dangerouslySetInnerHTML={{ __html: INSTRUCTABLE_STYLES }} />
      {(meta.time || meta.difficulty || meta.cost) && <ChipsRow meta={meta} />}
      {(meta.prerequisites?.length ?? 0) > 0 && (
        <Band title="Before the aspirant begins">
          <ul className="instructable__prerequisites">
            {meta.prerequisites!.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </Band>
      )}
      {hasSupplies    && <SuppliesBand    supplies={meta.supplies!} bomDownloadHref={bomDownloadHref} />}
      {hasSoftware    && <SoftwareBand    items={meta.software!} />}
      {hasDependencies && <DependenciesBand items={meta.dependencies!} />}
      {(meta.steps?.length ?? 0) > 0 && <StepsBand steps={meta.steps!} />}
      {meta.finalResult && (
        <Band title="Successful Trial">
          <div className="instructable__final">{meta.finalResult}</div>
        </Band>
      )}
      {(meta.variations?.length ?? 0) > 0 && (
        <Band title="Where the studio sends you next">
          <ul className="instructable__variations">
            {meta.variations!.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </Band>
      )}
      {(meta.troubleshooting?.length ?? 0) > 0 && (
        <Band title="Recovery Protocols">
          <TroubleList items={meta.troubleshooting!} />
        </Band>
      )}
    </section>
  );
}

function Band({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="instructable__band">
      <h2 className="instructable__band-title">{title}</h2>
      {children}
    </div>
  );
}

function ChipsRow({ meta }: { meta: InstructableMeta }) {
  return (
    <div className="instructable__chips" role="list">
      {meta.time       && <Chip label="Time"       value={meta.time} />}
      {meta.difficulty && <Chip label="Difficulty" value={DIFFICULTY_LABELS[meta.difficulty] ?? meta.difficulty} />}
      {meta.cost       && <Chip label="Cost"       value={meta.cost} />}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="instructable__chip" role="listitem">
      <span className="instructable__chip-label">{label}</span>
      <span className="instructable__chip-value">{value}</span>
    </div>
  );
}

function TroubleList({ items }: { items: InstructableTroubleshooting[] }) {
  return (
    <div className="instructable__trouble">
      {items.map((t, i) => (
        <div key={i} className="instructable__trouble-item">
          <div className="instructable__trouble-symptom">{t.symptom}</div>
          {t.cause && <p className="instructable__trouble-cause"><strong>Cause.</strong> {t.cause}</p>}
          <p className="instructable__trouble-fix"><strong>Recovery.</strong> {t.fix}</p>
        </div>
      ))}
    </div>
  );
}
