/**
 * components/trail/sections/trail-nav.tsx — Sticky top nav for /trail.
 *
 * Receives the current sandbox number to render the progress
 * counter. The seven section anchors are hard-coded; new Acts means
 * editing this file AND adding the corresponding section module.
 */

export function TrailNav({ currentSandbox }: { currentSandbox: number }) {
  return (
    <nav className="trail-nav">
      <div className="trail-nav-inner">
        <div className="trail-nav-title">The Trail of My Passing</div>
        <ul className="trail-nav-links">
          <li><a href="#manifesto">Who</a></li>
          <li><a href="#learning">Beneath the Numbers</a></li>
          <li><a href="#act-1">Act I</a></li>
          <li><a href="#act-2">Act II</a></li>
          <li><a href="#act-3">Act III</a></li>
          <li><a href="#act-4">Act IV</a></li>
          <li><a href="#act-5">Act V</a></li>
        </ul>
        <div className="trail-nav-progress" id="progress">
          sandbox {currentSandbox} / 40
        </div>
      </div>
    </nav>
  );
}
