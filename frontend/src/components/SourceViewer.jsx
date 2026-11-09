import { useEffect, useState } from "react";

import { getSource } from "../api";
import LabelBadge from "./LabelBadge";

export default function SourceViewer({ projectId, claims }) {
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    if (!selected) return undefined;
    let active = true;
    getSource(projectId, selected.id)
      .then((result) => {
        if (active) setSource({ claimId: selected.id, result });
      })
      .catch((requestError) => {
        if (active) {
          setSource({ claimId: selected.id, error: requestError.message });
        }
      });

    return () => {
      active = false;
    };
  }, [selected, projectId]);

  const selectedSource = source?.claimId === selected?.id ? source : null;
  const error = selectedSource?.error || "";

  return (
    <section className="panel" aria-labelledby="source-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">EVIDENCE</p>
          <h2 id="source-heading">Source viewer</h2>
        </div>
      </div>
      <div className="source-layout">
        <div className="claim-list" aria-label="Project claims">
          {claims.length === 0 && (
            <p className="empty-state">Load project claims to view evidence.</p>
          )}
          {claims.map((claim) => (
            <button
              className={`claim-card${selected?.id === claim.id ? " is-selected" : ""}`}
              key={claim.id}
              onClick={() => setSelected(claim)}
              type="button"
            >
              <span className="claim-card-heading">
                <strong>{claim.subject}</strong>
                <LabelBadge label={claim.label} />
              </span>
              <span className="claim-card-quote">{claim.quote}</span>
            </button>
          ))}
        </div>
        <div className="source-content" aria-live="polite">
          {error && <p className="error-message">{error}</p>}
          {!selected && (
            <p className="empty-state">Select a claim to see its source text.</p>
          )}
          {selected && !selectedSource && !error && (
            <p className="empty-state">Loading source...</p>
          )}
          {selectedSource?.result && (
            <HighlightedText source={selectedSource.result} />
          )}
        </div>
      </div>
    </section>
  );
}

function HighlightedText({ source }) {
  const start = Math.max(0, Math.min(source.start_char, source.text.length));
  const end = Math.max(start, Math.min(source.end_char, source.text.length));

  return (
    <div>
      <p className="source-filename">{source.filename}</p>
      <pre className="source-text">
        {source.text.slice(0, start)}
        <mark>{source.text.slice(start, end)}</mark>
        {source.text.slice(end)}
      </pre>
    </div>
  );
}
