import { useEffect, useState } from "react";

import { getGaps } from "../api";
import LabelBadge from "./LabelBadge";

const SECTIONS = [
  ["Unowned tasks", "unowned_tasks"],
  ["Conflicting deadlines", "conflicting_deadlines"],
  ["Stale tasks", "stale_tasks"],
  ["Broken dependencies", "broken_dependencies"],
];

export default function GapPanel({ projectId, refreshKey }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    getGaps(projectId)
      .then((report) => {
        if (active) setResult({ projectId, report });
      })
      .catch((requestError) => {
        if (active) setResult({ projectId, error: requestError.message });
      });

    return () => {
      active = false;
    };
  }, [projectId, refreshKey]);

  const currentResult = result?.projectId === projectId ? result : null;
  const report = currentResult?.report;
  const error = currentResult?.error;

  if (error) return <p className="error-message">{error}</p>;
  if (!report) return <p className="empty-state">Loading gap report…</p>;

  return (
    <section className="panel" aria-labelledby="gaps-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">READINESS CHECK</p>
          <h2 id="gaps-heading">Project gaps</h2>
        </div>
        <div className="score-pill">
          <strong>{report.readiness_score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <div className="gap-grid">
        {SECTIONS.map(([title, key]) => (
          <GapSection key={key} title={title} items={report[key]} />
        ))}
      </div>
    </section>
  );
}

function GapSection({ title, items }) {
  return (
    <section className="gap-section">
      <h3>
        {title} <span className="count-pill">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="empty-state">None found.</p>
      ) : (
        <ul>
          {items.map((claim) => (
            <li key={claim.id}>
              <div>
                <strong>{claim.subject}</strong>
                {claim.due_date && (
                  <span className="claim-meta"> - {claim.due_date}</span>
                )}
              </div>
              <LabelBadge label={claim.label} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
