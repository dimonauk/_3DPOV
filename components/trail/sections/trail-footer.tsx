/**
 * components/trail/sections/trail-footer.tsx — Page footer. Static
 * content only; no nav, no links beyond the title rendering.
 */

export function TrailFooter() {
  return (
    <footer className="trail-footer">
      <div className="trail-wrap">
        <div className="trail-footer-inner">
          <div className="trail-footer-left">
            <div className="trail-footer-title">The Trail of My Passing</div>
            <div className="trail-footer-by">
              Dimona Dougherty · Kinetic understanding
            </div>
          </div>
          <div className="trail-footer-right">
            40 sandboxes · one knob each
            <br />
            no instructions · 5 acts
            <br />
            <span className="trail-footer-note">scaffold v0.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
