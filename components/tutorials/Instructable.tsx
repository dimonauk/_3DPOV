import type {
  InstructableDependency,
  InstructableFigure,
  InstructableMeta,
  InstructableSoftware,
  InstructableStep,
  InstructableSupplier,
  InstructableSupplies,
  InstructableSupply,
  InstructableTroubleshooting,
} from "lib/tutorials/types";
import { INSTRUCTABLE_STYLES } from "./instructable-styles";

const DIFFICULTY_LABELS: Record<string, string> = {
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

/**
 * Renders the Instructables-style structured layer for a tutorial.
 *
 * Voice: every chrome string lives in `docs/AURA-TEST-CHAMBER-VOICE.md`.
 * The conceit is that Aura is the proprietor of the Test Chambers —
 * Aperture-style framing wrapped around the Void Princess character.
 * Fond hostess, never punitive.
 *
 * Server-component-safe — scoped CSS via `<style dangerouslySetInnerHTML>`.
 * All sections optional; renderer skips any band whose data is absent.
 */
export function Instructable({
  meta,
  slug,
}: {
  meta: InstructableMeta;
  /** Tutorial slug — when provided, enables the "Download BOM (.csv)"
   *  action link below the supplies band. */
  slug?: string;
}) {
  const hasChips = meta.time || meta.difficulty || meta.cost;
  const hasSupplies =
    !!meta.supplies &&
    ((meta.supplies.materials && meta.supplies.materials.length > 0) ||
      (meta.supplies.tools && meta.supplies.tools.length > 0) ||
      (meta.supplies.provisions && meta.supplies.provisions.length > 0));
  const hasSoftware = !!meta.software && meta.software.length > 0;
  const hasDependencies = !!meta.dependencies && meta.dependencies.length > 0;
  const hasPrerequisites = !!meta.prerequisites && meta.prerequisites.length > 0;
  const hasSteps = !!meta.steps && meta.steps.length > 0;
  const bomDownloadHref = slug ? `/api/tutorials/${slug}/bom.csv` : undefined;
  const bomAvailable =
    !!bomDownloadHref && (hasSupplies || hasSoftware || hasDependencies);

  return (
    <section className="instructable" aria-label="Test Chamber sheet">
      <style dangerouslySetInnerHTML={{ __html: INSTRUCTABLE_STYLES }} />
      {hasChips && <ChipsRow meta={meta} />}
      {hasPrerequisites && <PrerequisitesBand items={meta.prerequisites!} />}
      {hasSupplies && (
        <SuppliesBand
          supplies={meta.supplies!}
          bomDownloadHref={bomAvailable ? bomDownloadHref : undefined}
        />
      )}
      {hasSoftware && <SoftwareBand items={meta.software!} />}
      {hasDependencies && <DependenciesBand items={meta.dependencies!} />}
      {hasSteps && <StepsBand steps={meta.steps!} />}
      {meta.finalResult && (
        <Band title="Successful Trial">
          <div className="instructable__final">{meta.finalResult}</div>
        </Band>
      )}
      {meta.variations && meta.variations.length > 0 && (
        <Band title="Where the studio sends you next">
          <ul className="instructable__variations">
            {meta.variations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </Band>
      )}
      {meta.troubleshooting && meta.troubleshooting.length > 0 && (
        <Band title="Recovery Protocols">
          <TroubleList items={meta.troubleshooting} />
        </Band>
      )}
    </section>
  );
}

function Band({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
      {meta.time && <Chip label="Time" value={meta.time} />}
      {meta.difficulty && (
        <Chip
          label="Difficulty"
          value={DIFFICULTY_LABELS[meta.difficulty] ?? meta.difficulty}
        />
      )}
      {meta.cost && <Chip label="Cost" value={meta.cost} />}
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

function PrerequisitesBand({ items }: { items: string[] }) {
  return (
    <Band title="Before the aspirant begins">
      <ul className="instructable__prerequisites">
        {items.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </Band>
  );
}

function SuppliesBand({
  supplies,
  bomDownloadHref,
}: {
  supplies: InstructableSupplies;
  bomDownloadHref?: string;
}) {
  return (
    <Band title="Approved supplies">
      <div className="instructable__supplies">
        {supplies.materials && supplies.materials.length > 0 && (
          <SupplyList title="Approved materials" items={supplies.materials} />
        )}
        {supplies.tools && supplies.tools.length > 0 && (
          <SupplyList title="Approved tools" items={supplies.tools} />
        )}
        {supplies.provisions && supplies.provisions.length > 0 && (
          <SupplyList
            title="Provisions (optional)"
            items={supplies.provisions}
          />
        )}
      </div>
      {bomDownloadHref && (
        <div className="instructable__bom">
          <a
            href={bomDownloadHref}
            className="instructable__bom-link"
            download
          >
            Download bill of materials (.csv)
          </a>
          <span className="instructable__bom-note">
            One row per supplier; materials, tools, provisions,
            software, dependencies.
          </span>
        </div>
      )}
    </Band>
  );
}

function SupplyList({
  title,
  items,
}: {
  title: string;
  items: InstructableSupply[];
}) {
  return (
    <div>
      <h3 className="instructable__supply-list-title">{title}</h3>
      <ul className="instructable__supply-list">
        {items.map((item, i) => (
          <SupplyItem key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}

function SupplyItem({ item }: { item: InstructableSupply }) {
  const nameNode = item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="instructable__supply-link"
    >
      {item.name}
    </a>
  ) : (
    <span>{item.name}</span>
  );
  const hasSuppliers = item.suppliers && item.suppliers.length > 0;
  return (
    <li className="instructable__supply">
      <span>
        {nameNode}
        {item.quantity && (
          <span className="instructable__supply-quantity">
            {" "}· {item.quantity}
          </span>
        )}
        {item.isOptional && (
          <span className="instructable__supply-optional">optional</span>
        )}
        {item.note && (
          <span className="instructable__supply-note"> — {item.note}</span>
        )}
      </span>
      {hasSuppliers && (
        <ul className="instructable__suppliers">
          {item.suppliers!.map((s, i) => (
            <SupplierRow key={i} supplier={s} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SupplierRow({ supplier }: { supplier: InstructableSupplier }) {
  return (
    <li className="instructable__supplier">
      <a
        href={supplier.url}
        target="_blank"
        rel="noopener noreferrer"
        className="instructable__supplier-link"
      >
        {supplier.name}
      </a>
      {supplier.sku && (
        <span className="instructable__supplier-sku"> · {supplier.sku}</span>
      )}
      {supplier.price && (
        <span className="instructable__supplier-price">
          {" "}· {supplier.price}
        </span>
      )}
    </li>
  );
}

function SoftwareBand({ items }: { items: InstructableSoftware[] }) {
  return (
    <Band title="Software the aspirant installs first">
      <ul className="instructable__software">
        {items.map((s, i) => (
          <SoftwareItem key={i} item={s} />
        ))}
      </ul>
    </Band>
  );
}

function SoftwareItem({ item }: { item: InstructableSoftware }) {
  return (
    <li className="instructable__software-item">
      <div className="instructable__software-head">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="instructable__software-link"
        >
          {item.name}
        </a>
        {item.version && (
          <span className="instructable__software-version">
            {" "}· {item.version}
          </span>
        )}
        {item.cost && (
          <span className="instructable__software-cost"> · {item.cost}</span>
        )}
      </div>
      {item.platforms && item.platforms.length > 0 && (
        <div className="instructable__software-platforms">
          {item.platforms.join(" / ")}
        </div>
      )}
      {item.note && (
        <p className="instructable__software-note">{item.note}</p>
      )}
    </li>
  );
}

function DependenciesBand({ items }: { items: InstructableDependency[] }) {
  return (
    <Band title="Dependencies">
      <ul className="instructable__deps">
        {items.map((d, i) => (
          <DependencyItem key={i} item={d} />
        ))}
      </ul>
    </Band>
  );
}

function DependencyItem({ item }: { item: InstructableDependency }) {
  const ref = item.registry ?? "package";
  return (
    <li className="instructable__dep">
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="instructable__dep-link"
        >
          <code>{item.name}</code>
        </a>
      ) : (
        <code>{item.name}</code>
      )}
      {item.version && (
        <span className="instructable__dep-version">
          {" "}@ <code>{item.version}</code>
        </span>
      )}
      <span className="instructable__dep-registry"> · {ref}</span>
      {item.purpose && (
        <span className="instructable__dep-purpose"> — {item.purpose}</span>
      )}
    </li>
  );
}

function StepsBand({ steps }: { steps: InstructableStep[] }) {
  return (
    <Band title="Procedure">
      <ol className="instructable__steps" start={1}>
        {steps.map((step, i) => (
          <StepItem key={i} step={step} index={i} />
        ))}
      </ol>
    </Band>
  );
}

function StepItem({ step, index }: { step: InstructableStep; index: number }) {
  const hasImage = !!step.image;
  const hasFigures = !!step.figures && step.figures.length > 0;
  const flip = index % 2 === 1; // alternate sides
  const cls =
    "instructable__step" +
    (hasImage ? " instructable__step--with-image" : "") +
    (hasImage && flip ? " instructable__step--flip" : "");
  const paragraphs = step.body
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0);
  const stepLabel = `Procedure ${String(index + 1).padStart(2, "0")}`;

  return (
    <li className={cls}>
      <div className="instructable__step-body">
        <div className="instructable__step-number">{stepLabel}</div>
        <h3 className="instructable__step-title">{step.title}</h3>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {hasFigures && <FiguresStrip figures={step.figures!} />}
      </div>
      {step.image && (
        <div>
          <div className="instructable__step-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={step.image.src} alt={step.image.alt} loading="lazy" />
          </div>
          {step.image.credit && (
            <div className="instructable__step-credit">
              {step.image.credit}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/** IKEA-style figure strip — flat-line diagrams shown horizontally
 *  inside a step. Multiple figures per step rendered as a row. */
function FiguresStrip({ figures }: { figures: InstructableFigure[] }) {
  return (
    <div className="instructable__figures">
      {figures.map((f, i) => (
        <figure key={i} className="instructable__figure">
          <div
            className="instructable__figure-frame"
            style={{ maxWidth: f.maxWidth ?? "260px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt={f.alt} loading="lazy" />
          </div>
          {(f.label || f.caption) && (
            <figcaption className="instructable__figure-caption">
              {f.label && (
                <span className="instructable__figure-label">{f.label}</span>
              )}
              {f.caption && (
                <span className="instructable__figure-text">{f.caption}</span>
              )}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function TroubleList({ items }: { items: InstructableTroubleshooting[] }) {
  return (
    <div className="instructable__trouble">
      {items.map((t, i) => (
        <div key={i} className="instructable__trouble-item">
          <div className="instructable__trouble-symptom">{t.symptom}</div>
          {t.cause && (
            <p className="instructable__trouble-cause">
              <strong>Cause.</strong> {t.cause}
            </p>
          )}
          <p className="instructable__trouble-fix">
            <strong>Recovery.</strong> {t.fix}
          </p>
        </div>
      ))}
    </div>
  );
}
