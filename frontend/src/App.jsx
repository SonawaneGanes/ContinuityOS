import { useCallback, useEffect, useState } from "react";

import {
  approveHandover,
  checkHealth,
  getClaims,
  getGaps,
  uploadFile,
} from "./api";
import ExportButton from "./components/ExportButton";
import GapPanel from "./components/GapPanel";
import SourceViewer from "./components/SourceViewer";
import Timeline from "./components/Timeline";
import "./App.css";

const TABS = [
  { key: "timeline", label: "Timeline" },
  { key: "source", label: "Source viewer" },
  { key: "gaps", label: "Gaps" },
];

export default function App() {
  const [projectId, setProjectId] = useState("1");
  const [claims, setClaims] = useState([]);
  const [tab, setTab] = useState("timeline");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState("checking");
  const [approvedBy, setApprovedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    checkHealth()
      .then((result) => {
        if (active) setHealth(result.status === "ok" ? "ok" : "unavailable");
      })
      .catch(() => {
        if (active) setHealth("unavailable");
      });
    return () => {
      active = false;
    };
  }, []);

  const loadClaims = useCallback(async () => {
    if (!/^[1-9]\d*$/.test(projectId)) {
      setMessage("Enter a valid project ID.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await getGaps(projectId);
      const data = await getClaims(projectId);
      setClaims(data);
      setRefreshKey((current) => current + 1);
      setMessage(`Loaded ${data.length} claims for project ${projectId}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^[1-9]\d*$/.test(projectId)) {
      setMessage("Enter a valid project ID before uploading.");
      event.target.value = "";
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await uploadFile(projectId, file);
      await getGaps(projectId);
      const data = await getClaims(projectId);
      setClaims(data);
      setRefreshKey((current) => current + 1);
      setMessage(
        `Saved ${result.claims_saved} claims and rejected ${result.claims_rejected}.`,
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function handleApproval(event) {
    event.preventDefault();
    if (!approvedBy.trim()) {
      setMessage("Enter the approver name.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const result = await approveHandover(projectId, approvedBy.trim());
      setMessage(
        `Project approved by ${result.approved_by} with readiness ${result.readiness_score}/100.`,
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="ContinuityOS home">
          <span className="brand-mark">C</span>
          <span>ContinuityOS</span>
        </a>
        <div className={`health-status health-${health}`} role="status">
          <span className="health-dot" />
          {health === "checking"
            ? "Checking backend…"
            : `Backend says: ${health}`}
        </div>
      </header>

      <section className="hero-section">
        <p className="eyebrow">EVIDENCE-FIRST PROJECT HANDOVER</p>
        <h1>Keep every decision and deadline in view.</h1>
        <p className="hero-copy">
          Bring project evidence together, surface gaps, and prepare a clear
          handover.
        </p>
      </section>

      <section className="workspace">
        <div className="toolbar">
          <label className="field-label" htmlFor="project-id">
            Project ID
          </label>
          <input
            id="project-id"
            inputMode="numeric"
            min="1"
            onChange={(event) => setProjectId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadClaims();
            }}
            type="number"
            value={projectId}
          />
          <button
            className="button button-primary"
            disabled={loading}
            onClick={() => void loadClaims()}
            type="button"
          >
            {loading ? "Working…" : "Load project"}
          </button>
          <label className="button button-secondary upload-button">
            Upload evidence
            <input
              accept=".csv,.md,.txt,.pdf,.docx"
              disabled={loading}
              onChange={handleUpload}
              type="file"
            />
          </label>
          <ExportButton claims={claims} projectId={projectId} />
        </div>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}

        <div className="tabbar" role="tablist" aria-label="Project views">
          {TABS.map((item) => (
            <button
              aria-selected={tab === item.key}
              className={`tab-button${tab === item.key ? " is-active" : ""}`}
              key={item.key}
              onClick={() => setTab(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {tab === "timeline" && <Timeline claims={claims} />}
          {tab === "source" && (
            <SourceViewer
              key={projectId}
              projectId={projectId}
              claims={claims}
            />
          )}
          {tab === "gaps" && (
            <GapPanel projectId={projectId} refreshKey={refreshKey} />
          )}
        </div>

        <form className="approval-form" onSubmit={handleApproval}>
          <div>
            <p className="eyebrow">HANDOVER</p>
            <strong>Ready to approve?</strong>
          </div>
          <input
            aria-label="Approver name"
            onChange={(event) => setApprovedBy(event.target.value)}
            placeholder="Approver name"
            value={approvedBy}
          />
          <button
            className="button button-primary"
            disabled={loading}
            type="submit"
          >
            Approve handover
          </button>
        </form>
      </section>
      <footer className="footer">
        Claims stay linked to their original source evidence.
      </footer>
    </main>
  );
}
