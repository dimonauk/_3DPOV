/**
 * components/trail/sections/trail-manifesto.tsx — Four-block "position"
 * statement. Pure content; each block is one heading + one prose line.
 */

export function TrailManifesto() {
  return (
    <section className="trail-manifesto" id="manifesto">
      <div className="trail-wrap">
        <div className="trail-manifesto-label">The position</div>
        <div className="trail-manifesto-body">
          <div className="trail-manifesto-block">
            <h3>My father led men.</h3>
            <p>
              <span className="trail-sb-tech">
                STUB — leadership as transmission
              </span>
            </p>
          </div>

          <div className="trail-manifesto-block">
            <h3>My mother taught.</h3>
            <p>
              <span className="trail-sb-tech">
                STUB — teaching as clarity not simplicity
              </span>
            </p>
          </div>

          <div className="trail-manifesto-block">
            <h3>The body computes first.</h3>
            <p>
              <span className="trail-sb-tech">
                STUB — embodied cognition, rear brain compute
              </span>
            </p>
          </div>

          <div className="trail-manifesto-block">
            <h3>This site is a mirror.</h3>
            <p>
              <span className="trail-sb-tech">
                STUB — the contract. mirror not lesson.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
