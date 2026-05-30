/**
 * components/trail/sections/trail-learning-header.tsx — Bridge between
 * the manifesto and the five Acts. Establishes the four principles
 * (rule, sequence, prose, scroll) the rest of the page enacts.
 */

export function TrailLearningHeader() {
  return (
    <section className="trail-learning-header" id="learning">
      <div className="trail-wrap">
        <div className="trail-learning-eyebrow">The learning</div>
        <h2 className="trail-learning-title">Beneath the Numbers</h2>
        <p className="trail-learning-sub">
          40 sandboxes · one knob each · no instructions · 5 acts
        </p>

        <div className="trail-learning-principles">
          <div className="trail-lp">
            <div className="trail-lp-label">The rule</div>
            <div className="trail-lp-text">
              One knob. One variable universe. You can't get it wrong.
            </div>
          </div>
          <div className="trail-lp">
            <div className="trail-lp-label">The sequence</div>
            <div className="trail-lp-text">
              Each sandbox hands you what you need for the next one.
            </div>
          </div>
          <div className="trail-lp">
            <div className="trail-lp-label">The prose</div>
            <div className="trail-lp-text">
              One sentence after. Names the thing you just felt.
            </div>
          </div>
          <div className="trail-lp">
            <div className="trail-lp-label">The scroll</div>
            <div className="trail-lp-text">
              Is the curriculum. You never feel taught at.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
