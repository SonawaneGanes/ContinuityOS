// Footer — the promise of the product, set large, plus a way back up.
import { ArrowUp } from "./Icons";

export default function Footer({ credit }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <p className="footer-promise">
          Claims stay linked to their <em>original source evidence.</em>
        </p>
        <a className="button button-secondary" href="#top">
          Back to top
          <ArrowUp size={16} />
        </a>
      </div>

      <p aria-hidden="true" className="footer-wordmark">
        ContinuityOS
      </p>

      <div className="footer-base">
        <span>ContinuityOS · Evidence-first project handover</span>
        {credit && <span>{credit}</span>}
      </div>
    </footer>
  );
}
