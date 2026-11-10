 
import { useEffect, useRef, useState } from "react";

import {
  approveHandover,
  checkHealth,
  getClaims,
  getGaps,
  uploadFile,
} from "./api";
import folderArt from "./assets/trail/folder.webp";
import ExportButton from "./components/ExportButton";
import GapPanel from "./components/GapPanel";
import SourceViewer from "./components/SourceViewer";
import Timeline from "./components/Timeline";
import Cursor from "./effects/Cursor";
import Magnetic from "./effects/Magnetic";
import Reveal from "./effects/Reveal";
import { useSpotlight } from "./effects/pointer";
import Footer from "./ui/Footer";
import Hero from "./ui/Hero";
import HowItWorks from "./ui/HowItWorks";
import {
  Alert,
  Check,
  Close,
  GapsIcon,
  Info,
  SourceIcon,
  Spinner,
  TimelineIcon,
  Upload,
} from "./ui/Icons";
import Marquee from "./ui/Marquee";
import Nav from "./ui/Nav";
import ScoreRing from "./ui/ScoreRing";
import Tabs from "./ui/Tabs";
import "./effects/effects.css";
import "./App.css";

// Optional credit shown in the footer, e.g. "Designed by Your Name".
// Leave it empty and nothing is shown.
const CREDIT = "";

const FILE_TYPES = [".csv", ".md", ".txt", ".pdf", ".docx"];
const VALID_ID = /^[1-9]\d*$/;

const TABS = [
  { key: "timeline", label: "Timeline", icon: TimelineIcon },
  { key: "source", label: "Source viewer", icon: SourceIcon },
  { key: "gaps", label: "Gaps", icon: GapsIcon },
];

const NOTICE_ICONS = { success: Check, error: Alert, info: Info };

// The brand mark as a tab icon, so index.html needs no changes.
const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="10" fill="#dff23b"/>' +
      '<path d="M22.2 10.2a8.6 8.6 0 1 0 1.9 8.9" fill="none" stroke="#0b0e04" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="24.2" cy="13.6" r="2.2" fill="#0b0e04"/>' +
      "</svg>",
  );

// Elements that get the cursor-following light. Listed by class so the
// evidence components pick it up without being edited.
const SPOTLIGHT_TARGETS = ".workspace, .gap-section, .claim-card, .button, .blank-slate";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

const isSupported = (file) =>
  FILE_TYPES.some((type) => file.name.toLowerCase().endsWith(type));

// The gaps and approval responses both carry a readiness score. Read it
// defensively so an unexpected shape just hides the gauge.
function readScore(payload) {
  const score = payload?.readiness_score;
  return typeof score === "number" && Number.isFinite(score)
    ? Math.max(0, Math.min(100, Math.round(score)))
    : null;
}

export default function App() {
  // `projectId` is what is typed in the field; `activeId` is the project whose
  // evidence is on screen. Keeping them apart means the panels, the export and
  // the approval always act on the project you are actually looking at.
  const [projectId, setProjectId] = useState("1");
  const [activeId, setActiveId] = useState(null);
  const [claims, setClaims] = useState([]);
  const [tab, setTab] = useState("timeline");
  const [notice, setNotice] = useState(null); // { id, tone, text }
  const [health, setHealth] = useState("checking");
  const [approvedBy, setApprovedBy] = useState("");
  const [busy, setBusy] = useState(null); // null | "load" | "upload" | "approve"
  const [refreshKey, setRefreshKey] = useState(0);
  const [readiness, setReadiness] = useState(null);
  const [approval, setApproval] = useState(null); // { by, score, projectId }
  const [dragging, setDragging] = useState(false);

  const shellRef = useRef(null);
  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);
  const approverRef = useRef(null);
  const noticeCount = useRef(0);
  const dragDepth = useRef(0);

  useSpotlight(shellRef, SPOTLIGHT_TARGETS);

  // Tab title and icon.
  useEffect(() => {
    document.title = "ContinuityOS — Evidence-first project handover";
    let icon = document.querySelector('link[rel~="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.append(icon);
    }
    icon.type = "image/svg+xml";
    icon.href = FAVICON;
  }, []);

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

  // A file dropped outside the page would make the browser navigate to it and
  // lose the session, so swallow stray drops.
  useEffect(() => {
    const swallow = (event) => {
      if (Array.from(event.dataTransfer?.types ?? []).includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, []);

  function say(tone, text) {
    noticeCount.current += 1;
    setNotice({ id: noticeCount.current, tone, text });
  }

  // Turns a thrown error into words a person can act on.
  function explain(error) {
    if (error instanceof TypeError) {
      setHealth("unavailable");
      return "Can't reach the backend. Start the API server, then try again.";
    }
    return error?.message || "Something went wrong. Please try again.";
  }

  async function recheckHealth() {
    setHealth("checking");
    try {
      const result = await checkHealth();
      setHealth(result.status === "ok" ? "ok" : "unavailable");
    } catch {
      setHealth("unavailable");
    }
  }

  // Shared by "Load project" and uploads: fetch gaps, then claims, then put
  // that project on screen.
  async function showProject(id) {
    const gaps = await getGaps(id);
    const data = await getClaims(id);
    setClaims(data);
    setActiveId(id);
    setReadiness(readScore(gaps));
    setApproval(null);
    setRefreshKey((current) => current + 1);
    setHealth("ok");
    return data;
  }

  async function loadProject() {
    if (busy) return;
    if (!VALID_ID.test(projectId)) {
      say("error", "Enter a valid project ID.");
      return;
    }
    setBusy("load");
    setNotice(null);
    try {
      const data = await showProject(projectId);
      say("success", `Loaded ${plural(data.length, "claim")} for project ${projectId}.`);
    } catch (error) {
      say("error", explain(error));
    } finally {
      setBusy(null);
    }
  }

  async function uploadEvidence(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0 || busy) return;
    revealWorkspace();
    if (!VALID_ID.test(projectId)) {
      say("error", "Enter a valid project ID before uploading.");
      return;
    }

    const supported = files.filter(isSupported);
    const skipped = files.length - supported.length;
    if (supported.length === 0) {
      say("error", `That file type isn't supported. Use ${FILE_TYPES.join(", ")}.`);
      return;
    }

    setBusy("upload");
    setNotice(null);
    let saved = 0;
    let rejected = 0;
    let uploaded = 0;
    try {
      for (const file of supported) {
        const result = await uploadFile(projectId, file);
        saved += Number(result?.claims_saved) || 0;
        rejected += Number(result?.claims_rejected) || 0;
        uploaded += 1;
      }
      await showProject(projectId);
      const skippedNote = skipped ? ` Skipped ${plural(skipped, "unsupported file")}.` : "";
      say("success", `Saved ${plural(saved, "claim")} and rejected ${rejected}.${skippedNote}`);
    } catch (error) {
      const reason = explain(error);
      if (uploaded > 0) {
        // Some files went through before the failure: show what the project holds now.
        await showProject(projectId).catch(() => {});
        say("error", `Uploaded ${uploaded} of ${plural(supported.length, "file")}, then stopped. ${reason}`);
      } else {
        say("error", reason);
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleApproval(event) {
    event.preventDefault();
    if (busy) return;
    if (!activeId) {
      say("error", "Load a project before approving its handover.");
      return;
    }
    const name = approvedBy.trim();
    if (!name) {
      say("error", "Enter the approver name.");
      approverRef.current?.focus();
      return;
    }
    setBusy("approve");
    setNotice(null);
    try {
      const result = await approveHandover(activeId, name);
      const by = result?.approved_by ?? name;
      const score = result?.readiness_score ?? null;
      const gauge = readScore(result);
      if (gauge !== null) setReadiness(gauge);
      setApproval({ by, score, projectId: activeId });
      setHealth("ok");
      say(
        "success",
        score === null
          ? `Project approved by ${by}.`
          : `Project approved by ${by} with readiness ${score}/100.`,
      );
    } catch (error) {
      say("error", explain(error));
    } finally {
      setBusy(null);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  // Uploads can start from the hero button or from a drop anywhere on the
  // page: bring the workspace into view so the outcome is never missed.
  function revealWorkspace() {
    const section = workspaceRef.current;
    if (!section) return;
    const { top, bottom } = section.getBoundingClientRect();
    if (top < window.innerHeight * 0.5 && bottom > 0) return; // already in view
    section.scrollIntoView({ block: "start" });
  }

  // ── Drag and drop: the whole page is a drop target ──────────────────────
  const carriesFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

  function onDragEnter(event) {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function onDragOver(event) {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = busy ? "none" : "copy";
  }

  function onDragLeave(event) {
    if (!carriesFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function onDrop(event) {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void uploadEvidence(event.dataTransfer.files);
  }

  const isBusy = Boolean(busy);
  const validId = VALID_ID.test(projectId);
  const tabs = TABS.map((item) =>
    item.key === "timeline" && activeId ? { ...item, count: claims.length } : item,
  );
  const approved = approval && approval.projectId === activeId ? approval : null;
  const NoticeIcon = notice ? NOTICE_ICONS[notice.tone] ?? Info : null;

  return (
    <div
      className="app-shell"
      id="top"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      ref={shellRef}
    >
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <Cursor />
      <Nav health={health} onRecheck={() => void recheckHealth()} />

      <main>
        <Hero fileTypes={FILE_TYPES} onUploadClick={openFilePicker} />

        <div className="sheet">
          <HowItWorks fileTypes={FILE_TYPES} />
          <Marquee />

          <section aria-labelledby="workspace-title" className="workspace-section" id="workspace" ref={workspaceRef}>
            <Reveal className="block-head">
              <p className="eyebrow">Workspace</p>
              <h2 className="block-title" id="workspace-title">
                Your project, <em>in evidence.</em>
              </h2>
            </Reveal>

            <Reveal aria-busy={isBusy} className="workspace" data-busy={busy ?? undefined}>
              <span aria-hidden="true" className="workspace-progress" />

              <div className="toolbar">
                <form
                  className="project-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void loadProject();
                  }}
                >
                  <label className="field-label" htmlFor="project-id">
                    Project ID
                  </label>
                  <span className="id-field">
                    <span aria-hidden="true">#</span>
                    <input
                      autoComplete="off"
                      id="project-id"
                      inputMode="numeric"
                      maxLength={9}
                      onChange={(event) => setProjectId(event.target.value.replace(/\D/g, ""))}
                      pattern="[0-9]*"
                      type="text"
                      value={projectId}
                    />
                  </span>
                  <button className="button button-primary" disabled={isBusy} type="submit">
                    {busy === "load" && <Spinner />}
                    {busy === "load" ? "Loading…" : "Load project"}
                  </button>
                </form>

                <div className="toolbar-actions">
                  <label className="button button-secondary upload-button" data-disabled={isBusy}>
                    {busy === "upload" ? <Spinner /> : <Upload size={16} />}
                    {busy === "upload" ? "Uploading…" : "Upload evidence"}
                    <input
                      accept={FILE_TYPES.join(",")}
                      disabled={isBusy}
                      multiple
                      onChange={(event) => {
                        void uploadEvidence(event.target.files);
                        event.target.value = "";
                      }}
                      ref={fileInputRef}
                      type="file"
                    />
                  </label>
                  <ExportButton claims={claims} projectId={activeId ?? projectId} />
                </div>
              </div>

              <div aria-live="polite" className="status-slot">
                {notice && (
                  <div
                    className={`status-message is-${notice.tone}`}
                    key={notice.id}
                    role={notice.tone === "error" ? "alert" : undefined}
                  >
                    <span className="status-icon">
                      <NoticeIcon size={16} />
                    </span>
                    <p>{notice.text}</p>
                    <button
                      aria-label="Dismiss message"
                      className="status-close"
                      onClick={() => setNotice(null)}
                      type="button"
                    >
                      <Close size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="workspace-bar">
                <Tabs idBase="views" label="Project views" onChange={setTab} tabs={tabs} value={tab} />
                {activeId && (
                  <div className="workspace-facts">
                    <span className="fact">
                      <span className="fact-label">Project</span>
                      <strong>#{activeId}</strong>
                    </span>
                    {readiness !== null && (
                      <span className="fact">
                        <span className="fact-label">Readiness</span>
                        <ScoreRing value={readiness} />
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div
                aria-labelledby={`views-tab-${tab}`}
                className="tabpanel"
                id="views-panel"
                key={tab}
                role="tabpanel"
                tabIndex={0}
              >
                {activeId === null ? (
                  <div className="blank-slate">
                    <div aria-hidden="true" className="blank-art">
                      <img alt="" src={folderArt} />
                    </div>
                    <h3>{busy === "load" ? "Opening the file…" : "Nothing on the table yet"}</h3>
                    <p>
                      Load a project by its ID, or drop evidence files anywhere on this page.
                      Decisions, deadlines and their sources will line up here.
                    </p>
                    <div className="blank-actions">
                      <button
                        className="button button-primary"
                        disabled={isBusy || !validId}
                        onClick={() => void loadProject()}
                        type="button"
                      >
                        {validId ? `Load project #${projectId}` : "Load project"}
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={isBusy}
                        onClick={openFilePicker}
                        type="button"
                      >
                        <Upload size={16} />
                        Upload evidence
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {tab === "timeline" && <Timeline claims={claims} />}
                    {tab === "source" && (
                      <SourceViewer claims={claims} key={activeId} projectId={activeId} />
                    )}
                    {tab === "gaps" && <GapPanel projectId={activeId} refreshKey={refreshKey} />}
                  </>
                )}
              </div>

              <form className={`approval-form${approved ? " is-approved" : ""}`} onSubmit={handleApproval}>
                <div className="approval-copy">
                  <p className="eyebrow">Handover</p>
                  {approved ? (
                    <strong>
                      Approved by {approved.by}
                      {approved.score !== null && ` · readiness ${approved.score}/100`}
                    </strong>
                  ) : (
                    <strong>{activeId ? `Ready to approve project #${activeId}?` : "Ready to approve?"}</strong>
                  )}
                </div>
                {approved && (
                  <span aria-hidden="true" className="stamp" key={`${approved.by}-${approved.score}`}>
                    Approved
                  </span>
                )}
                <input
                  aria-label="Approver name"
                  autoComplete="name"
                  onChange={(event) => setApprovedBy(event.target.value)}
                  placeholder="Approver name"
                  ref={approverRef}
                  value={approvedBy}
                />
                <Magnetic strength={0.22}>
                  <button className="button button-accent" disabled={isBusy} type="submit">
                    {busy === "approve" ? <Spinner /> : <Check size={16} />}
                    {busy === "approve" ? "Approving…" : "Approve handover"}
                  </button>
                </Magnetic>
              </form>
            </Reveal>
          </section>
        </div>
      </main>

      <Footer credit={CREDIT} />

      {dragging && (
        <div className="drop-overlay">
          <div className="drop-frame">
            <span className="drop-icon">
              <Upload size={30} />
            </span>
            <strong>{isBusy ? "One moment — still working" : "Drop to add evidence"}</strong>
            <span>
              {validId ? `Goes into project #${projectId}` : "Enter a project ID first"} ·{" "}
              {FILE_TYPES.join("  ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
