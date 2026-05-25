/**
 * components/trail/sections/trail-act-1.tsx — Act I: The Body in
 * Gravity. Sandboxes 01–08. The opening sandbox (01) and the
 * centrepiece (08) are scaffolded here; the missing ones will land
 * as the page builds out.
 */

export function TrailAct1() {
  return (
    <>
      <section className="trail-act trail-act-1" id="act-1">
        <div className="trail-wrap">
          <div className="trail-act-header">
            <div className="trail-act-bar"></div>
            <div className="trail-act-num">Act I</div>
            <div className="trail-act-name">The Body in Gravity</div>
            <div className="trail-act-range">sandboxes 01–08</div>
          </div>

          {/* SB 01 */}
          <div className="trail-sandbox" id="sb-01">
            <div className="trail-sb-num">01</div>
            <div className="trail-sb-title-row">
              <div className="trail-sb-title">The drop</div>
              <div className="trail-sb-tech">canvas 2d</div>
            </div>
            <div className="trail-sb-widget">
              <div className="trail-stub-desc">
                <div className="trail-stub-desc-title">
                  A ball falls. Nothing else.
                </div>
                <div className="trail-stub-desc-body">
                  Pure canvas 2D. requestAnimationFrame. A circle released from
                  variable height, falling under constant gravity. No trail yet.
                  No colour. Just the fall and the bounce.
                  <br />
                  <br />
                  Interaction: drag the ball upward to set height. Release to
                  drop.
                </div>
              </div>
            </div>
            <div className="trail-sb-knob">
              <div className="trail-knob-circle">
                <div className="trail-knob-dot"></div>
              </div>
              <div className="trail-knob-label">height</div>
              <div className="trail-knob-range">0 – 100%</div>
            </div>
            <div className="trail-sb-whisper">
              You already knew this. Gravity doesn't care how big you are.
              <div className="trail-stub-inline">// STUB: confirm prose</div>
            </div>
          </div>

          {/* SB 08 — THE CENTREPIECE OF ACT I */}
          <div className="trail-sandbox" id="sb-08">
            <div className="trail-sb-num">08</div>
            <div className="trail-sb-title-row">
              <div className="trail-sb-title">The jump</div>
              <div className="trail-sb-tech">WebGPU TSL</div>
            </div>
            <div className="trail-sb-widget trail-sb-widget--tall">
              <div className="trail-stub-desc">
                <div className="trail-stub-desc-title">
                  Stage. Beat. Commitment. Rail.
                </div>
                <div className="trail-stub-desc-body">
                  This is the emotional centrepiece of the whole site.
                  <br />
                  <br />
                  A figure stands on a raised platform. A beat pulses — visible
                  as a waveform or gentle flash — at a fixed BPM. The knob
                  controls the moment of jump within the beat cycle. Land on the
                  beat: the figure continues dancing, trails light behind it.
                  Land off the beat: the figure stumbles, a beat is missed.
                  <br />
                  <br />
                  The figure should feel large. Not a stick man — a silhouette
                  with presence and weight. The trail on landing is luminous,
                  brief, gold.
                  <br />
                  <br />
                  Under the canvas, after the first landing: one sentence
                  appears. "Once airborne, you were on the rail."
                </div>
              </div>
            </div>
            <div className="trail-sb-knob">
              <div className="trail-knob-circle">
                <div className="trail-knob-dot"></div>
              </div>
              <div className="trail-knob-label">moment of jump</div>
              <div className="trail-knob-range">
                beat position
                <br />0 – 1 cycle
              </div>
            </div>
            <div className="trail-sb-whisper">
              Once airborne you are on the rail. Physics is driving. This is
              what it felt like.
              <div className="trail-stub-inline">
                // STUB: this prose is definitive — do not change
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="trail-wrap">
        <div className="trail-act-bridge">
          <span className="trail-stub-inline">
            // STUB: Act I → Act II bridge prose
          </span>
        </div>
      </div>
    </>
  );
}
