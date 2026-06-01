/**
 * instructable-steps.tsx — Procedure steps and figures strip.
 */
import type { InstructableFigure, InstructableStep } from "lib/tutorials/types";

export function StepsBand({ steps }: { steps: InstructableStep[] }) {
  return (
    <div className="instructable__band">
      <h2 className="instructable__band-title">Procedure</h2>
      <ol className="instructable__steps" start={1}>
        {steps.map((step, i) => <StepItem key={i} step={step} index={i} />)}
      </ol>
    </div>
  );
}

function StepItem({ step, index }: { step: InstructableStep; index: number }) {
  const flip = index % 2 === 1;
  const cls  = "instructable__step"
    + (step.image ? " instructable__step--with-image" : "")
    + (step.image && flip ? " instructable__step--flip" : "");
  const paragraphs = step.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <li className={cls}>
      <div className="instructable__step-body">
        <div className="instructable__step-number">Procedure {String(index + 1).padStart(2, "0")}</div>
        <h3 className="instructable__step-title">{step.title}</h3>
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        {step.figures && step.figures.length > 0 && <FiguresStrip figures={step.figures} />}
      </div>
      {step.image && (
        <div>
          <div className="instructable__step-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={step.image.src} alt={step.image.alt} loading="lazy" />
          </div>
          {step.image.credit && <div className="instructable__step-credit">{step.image.credit}</div>}
        </div>
      )}
    </li>
  );
}

function FiguresStrip({ figures }: { figures: InstructableFigure[] }) {
  return (
    <div className="instructable__figures">
      {figures.map((f, i) => (
        <figure key={i} className="instructable__figure">
          <div className="instructable__figure-frame" style={{ maxWidth: f.maxWidth ?? "260px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt={f.alt} loading="lazy" />
          </div>
          {(f.label || f.caption) && (
            <figcaption className="instructable__figure-caption">
              {f.label   && <span className="instructable__figure-label">{f.label}</span>}
              {f.caption && <span className="instructable__figure-text">{f.caption}</span>}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
