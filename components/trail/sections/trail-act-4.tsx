/**
 * components/trail/sections/trail-act-4.tsx — Act IV: Waves Through
 * Everything. Sandboxes 25–32. Scaffolded with sb-25 (The wave).
 */

export function TrailAct4() {
  return (
    <>
      <section className="trail-act trail-act-4" id="act-4">
        <div className="trail-wrap">
          <div className="trail-act-header">
            <div className="trail-act-bar"></div>
            <div className="trail-act-num">Act IV</div>
            <div className="trail-act-name">Waves Through Everything</div>
            <div className="trail-act-range">sandboxes 25–32</div>
          </div>

          <div className="trail-sandbox" id="sb-25">
            <div className="trail-sb-num">25</div>
            <div className="trail-sb-title-row">
              <div className="trail-sb-title">The wave</div>
              <div className="trail-sb-tech">WebGPU TSL</div>
            </div>
            <div className="trail-sb-widget">
              <div className="trail-stub-desc">
                <div className="trail-stub-desc-title">
                  One sine. One knob. Everything.
                </div>
                <div className="trail-stub-desc-body">
                  A single sine wave in TSL. Frequency knob sweeps from
                  infrasound to ultrasound. The point: one shape, infinite
                  media.
                </div>
              </div>
            </div>
            <div className="trail-sb-knob">
              <div className="trail-knob-circle">
                <div className="trail-knob-dot"></div>
              </div>
              <div className="trail-knob-label">frequency</div>
              <div className="trail-knob-range">0.1 Hz – 10¹⁵ Hz</div>
            </div>
            <div className="trail-sb-whisper">
              This is everything. Sound, light, water, radio, probability. One
              shape, infinite media.
              <div className="trail-stub-inline">// STUB: confirm prose</div>
            </div>
          </div>
        </div>
      </section>

      <div className="trail-wrap">
        <div className="trail-act-bridge">
          <span className="trail-stub-inline">
            // STUB: Act IV → Act V bridge prose
          </span>
        </div>
      </div>
    </>
  );
}
