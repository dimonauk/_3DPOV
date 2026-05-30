/**
 * components/trail/sections/trail-act-3.tsx — Act III: Drawing in
 * Space. Sandboxes 17–24. Scaffolded with sb-17 (The throw).
 */

export function TrailAct3() {
  return (
    <>
      <section className="trail-act trail-act-3" id="act-3">
        <div className="trail-wrap">
          <div className="trail-act-header">
            <div className="trail-act-bar"></div>
            <div className="trail-act-num">Act III</div>
            <div className="trail-act-name">Drawing in Space</div>
            <div className="trail-act-range">sandboxes 17–24</div>
          </div>

          <div className="trail-sandbox" id="sb-17">
            <div className="trail-sb-num">17</div>
            <div className="trail-sb-title-row">
              <div className="trail-sb-title">The throw</div>
              <div className="trail-sb-tech">canvas 2d</div>
            </div>
            <div className="trail-sb-widget">
              <div className="trail-stub-desc">
                <div className="trail-stub-desc-title">
                  Launch angle → range
                </div>
                <div className="trail-stub-desc-body">
                  Projectile motion. One knob: launch angle. 45° is the optimum.
                  Parabolic arc traced as a fading trail.
                </div>
              </div>
            </div>
            <div className="trail-sb-knob">
              <div className="trail-knob-circle">
                <div className="trail-knob-dot"></div>
              </div>
              <div className="trail-knob-label">launch angle</div>
              <div className="trail-knob-range">0° – 90°</div>
            </div>
            <div className="trail-sb-whisper">
              Every footballer has calibrated 45° in their body without ever
              knowing the number.
              <div className="trail-stub-inline">// STUB: confirm prose</div>
            </div>
          </div>
        </div>
      </section>

      <div className="trail-wrap">
        <div className="trail-act-bridge">
          <span className="trail-stub-inline">
            // STUB: Act III → Act IV bridge prose
          </span>
        </div>
      </div>
    </>
  );
}
