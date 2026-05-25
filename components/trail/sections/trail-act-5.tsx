/**
 * components/trail/sections/trail-act-5.tsx — Act V: Pattern and
 * Emergence. Sandboxes 33–40. Includes sb-33 (Reaction-diffusion),
 * sb-39 (The dancer, synthesis sandbox), and sb-40 (You, terminal).
 */

export function TrailAct5() {
  return (
    <section className="trail-act trail-act-5" id="act-5">
      <div className="trail-wrap">
        <div className="trail-act-header">
          <div className="trail-act-bar"></div>
          <div className="trail-act-num">Act V</div>
          <div className="trail-act-name">Pattern and Emergence</div>
          <div className="trail-act-range">sandboxes 33–40</div>
        </div>

        <div className="trail-sandbox" id="sb-33">
          <div className="trail-sb-num">33</div>
          <div className="trail-sb-title-row">
            <div className="trail-sb-title">Reaction-diffusion</div>
            <div className="trail-sb-tech">WebGPU compute</div>
          </div>
          <div className="trail-sb-widget">
            <div className="trail-stub-desc">
              <div className="trail-stub-desc-title">
                Two chemicals. One ratio. Cheetah spots → zebra stripes.
              </div>
              <div className="trail-stub-desc-body">
                Gray-Scott reaction-diffusion on GPU compute. Feed and kill
                rates controlled by single knob.
              </div>
            </div>
          </div>
          <div className="trail-sb-knob">
            <div className="trail-knob-circle">
              <div className="trail-knob-dot"></div>
            </div>
            <div className="trail-knob-label">feed/kill ratio</div>
            <div className="trail-knob-range">spots ← → stripes</div>
          </div>
          <div className="trail-sb-whisper">
            The pattern on a cheetah. The bands on a zebrafish. Two equations
            and time.
            <div className="trail-stub-inline">// STUB: confirm prose</div>
          </div>
        </div>

        {/* SB 39 — THE DANCER */}
        <div className="trail-sandbox" id="sb-39">
          <div className="trail-sb-num">39</div>
          <div className="trail-sb-title-row">
            <div className="trail-sb-title">The dancer</div>
            <div className="trail-sb-tech">WebGPU TSL + mocap</div>
          </div>
          <div className="trail-sb-widget trail-sb-widget--tall">
            <div className="trail-stub-desc">
              <div className="trail-stub-desc-title">
                A body moving. All five acts visible at once.
              </div>
              <div className="trail-stub-desc-body">
                The most complex sandbox. A motion-captured body in kinetic
                flow — poi or free dance — rendered in void space as a
                luminous trail system.
                <br />
                <br />
                The knob scrubs time through the sequence. As the figure
                moves: overlaid annotations briefly appear naming the physics
                being enacted.
                <br />
                <br />
                This is the synthesis sandbox. Everything built across acts
                1–4 is happening simultaneously in a single body.
              </div>
            </div>
          </div>
          <div className="trail-sb-knob">
            <div className="trail-knob-circle">
              <div className="trail-knob-dot"></div>
            </div>
            <div className="trail-knob-label">time</div>
            <div className="trail-knob-range">0 – end</div>
          </div>
          <div className="trail-sb-whisper">
            You were running all of this the whole time. Under thought. Under
            language. In the body.
            <div className="trail-stub-inline">
              // STUB: this prose is definitive — do not change
            </div>
          </div>
        </div>

        {/* SB 40 — THE END */}
        <div className="trail-sandbox" id="sb-40">
          <div className="trail-sb-num">40</div>
          <div className="trail-sb-title-row">
            <div className="trail-sb-title">You</div>
            <div className="trail-sb-tech">MediaPipe + WebGPU TSL</div>
          </div>
          <div className="trail-sb-widget trail-sb-widget--tall">
            <div className="trail-stub-desc">
              <div className="trail-stub-desc-title">
                Empty canvas. Camera on. Move.
              </div>
              <div className="trail-stub-desc-body">
                No sandbox label. No knob. No instructions.
                <br />
                <br />
                A camera permission request appears when the user reaches this
                section. If granted: their body is tracked via MediaPipe Pose.
                <br />
                <br />
                If declined: a written invitation to stand up and move
                wherever they are. The canvas stays empty. Dark. Waiting.
              </div>
            </div>
          </div>
          <div className="trail-sb-knob trail-knob-disabled">
            <div className="trail-knob-circle"></div>
            <div className="trail-knob-label">—</div>
            <div className="trail-knob-range">there is no knob</div>
          </div>
          <div className="trail-sb-whisper trail-sb-whisper--hidden">
            {/* intentionally empty — no whisper on sandbox 40 */}
          </div>
        </div>
      </div>
    </section>
  );
}
