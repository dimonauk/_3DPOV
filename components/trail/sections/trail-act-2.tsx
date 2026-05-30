/**
 * components/trail/sections/trail-act-2.tsx — Act II: Rhythm and Time.
 * Sandboxes 09–16. Scaffolded with sb-09 (Finding the beat) only.
 */

export function TrailAct2() {
  return (
    <>
      <section className="trail-act trail-act-2" id="act-2">
        <div className="trail-wrap">
          <div className="trail-act-header">
            <div className="trail-act-bar"></div>
            <div className="trail-act-num">Act II</div>
            <div className="trail-act-name">Rhythm and Time</div>
            <div className="trail-act-range">sandboxes 09–16</div>
          </div>

          <div className="trail-sandbox" id="sb-09">
            <div className="trail-sb-num">09</div>
            <div className="trail-sb-title-row">
              <div className="trail-sb-title">Finding the beat</div>
              <div className="trail-sb-tech">Web Audio + canvas</div>
            </div>
            <div className="trail-sb-widget">
              <div className="trail-stub-desc">
                <div className="trail-stub-desc-title">
                  Pendulum. Metronome. Make them agree.
                </div>
                <div className="trail-stub-desc-body">
                  The pendulum from sb-04, now with a quiet metronome tick
                  alongside. The metronome runs at a fixed BPM. The knob changes
                  pendulum length. When periods align: both flash
                  simultaneously, a brief resonance glow.
                </div>
              </div>
            </div>
            <div className="trail-sb-knob">
              <div className="trail-knob-circle">
                <div className="trail-knob-dot"></div>
              </div>
              <div className="trail-knob-label">string length</div>
              <div className="trail-knob-range">short – long</div>
            </div>
            <div className="trail-sb-whisper">
              Rhythm isn't imposed on physics. It emerges from it.
              <div className="trail-stub-inline">// STUB: confirm prose</div>
            </div>
          </div>
        </div>
      </section>

      <div className="trail-wrap">
        <div className="trail-act-bridge">
          <span className="trail-stub-inline">
            // STUB: Act II → Act III bridge prose
          </span>
        </div>
      </div>
    </>
  );
}
