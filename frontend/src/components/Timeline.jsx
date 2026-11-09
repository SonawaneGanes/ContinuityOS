import LabelBadge from "./LabelBadge";

export default function Timeline({ claims }) {
  const dated = claims
    .filter((claim) => claim.due_date)
    .toSorted((left, right) => left.due_date.localeCompare(right.due_date));
  const undated = claims.filter((claim) => !claim.due_date);

  return (
    <section className="panel" aria-labelledby="timeline-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PROJECT OVERVIEW</p>
          <h2 id="timeline-heading">Timeline</h2>
        </div>
        <span className="count-pill">{claims.length} claims</span>
      </div>
      {dated.length === 0 ? (
        <p className="empty-state">No dated items yet.</p>
      ) : (
        <ol className="timeline-list">
          {dated.map((claim) => (
            <li className="timeline-item" key={claim.id}>
              <span className="timeline-date">{claim.due_date}</span>
              <div className="timeline-content">
                <strong>{claim.subject}</strong>
                <div className="claim-meta">
                  {claim.kind}
                  {claim.owner && ` - ${claim.owner}`}
                  {claim.status && ` - ${claim.status}`}
                </div>
              </div>
              <LabelBadge label={claim.label} />
            </li>
          ))}
        </ol>
      )}

      <h3 className="section-title">Undated items</h3>
      {undated.length === 0 ? (
        <p className="empty-state">All claims have a date.</p>
      ) : (
        <ul className="undated-list">
          {undated.map((claim) => (
            <li key={claim.id}>
              <div>
                <strong>{claim.subject}</strong>
                <div className="claim-meta">
                  {claim.kind}
                  {claim.owner && ` - ${claim.owner}`}
                  {claim.status && ` - ${claim.status}`}
                </div>
              </div>
              <LabelBadge label={claim.label} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
