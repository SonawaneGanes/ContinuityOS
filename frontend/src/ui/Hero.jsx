// Hero — the headline, the two main actions, and the cursor "paper trail".
import { useEffect, useRef, useState } from "react";

import bubbles from "../assets/trail/bubbles.webp";
import calendar from "../assets/trail/calendar.webp";
import folder from "../assets/trail/folder.webp";
import highlighter from "../assets/trail/highlighter.webp";
import magnifier from "../assets/trail/magnifier.webp";
import papers from "../assets/trail/papers.webp";
import puzzle from "../assets/trail/puzzle.webp";
import rings from "../assets/trail/rings.webp";
import stamp from "../assets/trail/stamp.webp";
import stickies from "../assets/trail/stickies.webp";
import ImageTrail from "../effects/ImageTrail";
import Magnetic from "../effects/Magnetic";
import { usePrefs } from "../effects/prefs";
import { ArrowDown, Upload } from "./Icons";

// Order matters: neighbours alternate background colour so the trail reads
// as a rhythm of blue / ink / paper / lime.
const TRAIL = [
  { src: papers, caption: "kickoff-notes.md" },
  { src: highlighter, caption: "contract-v3.pdf" },
  { src: calendar, caption: "deadlines.csv" },
  { src: folder, caption: "handover-pack.docx" },
  { src: magnifier, caption: "audit-log.txt" },
  { src: stamp, caption: "sign-off.pdf" },
  { src: stickies, caption: "standup-notes.md" },
  { src: rings, caption: "dependencies.csv" },
  { src: puzzle, caption: "open-items.txt" },
  { src: bubbles, caption: "client-call.txt" },
];

// Three fixed lines on wide screens, free-flowing on small ones.
// `marked` words get the highlighter; `index` staggers the entrance.
const HEADLINE = [
  [
    { word: "Keep", index: 0 },
    { word: "every", index: 1 },
    { word: "decision", index: 2, marked: true },
  ],
  [
    { word: "and", index: 3 },
    { word: "deadline", index: 4, marked: true },
  ],
  [
    { word: "in", index: 5 },
    { word: "view.", index: 6 },
  ],
];

const HEADLINE_TEXT = HEADLINE.flat()
  .map(({ word }) => word)
  .join(" ");

export default function Hero({ fileTypes, onUploadClick }) {
  const { motion, finePointer } = usePrefs();
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Hold the headline animation until the display fonts are in, so it never
  // animates in a fallback face and then jumps.
  useEffect(() => {
    let alive = true;
    const start = () => {
      if (alive) setReady(true);
    };
    const timeout = window.setTimeout(start, 1200);
    if (document.fonts?.load) {
      Promise.all([
        document.fonts.load('600 1em "Bricolage Grotesque"'),
        document.fonts.load('italic 400 1em "Instrument Serif"'),
      ]).then(start, start);
    } else {
      start();
    }
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  // The hero is pinned while the page slides over it. If keyboard focus moves
  // back into it, bring it back into view so focus is never hidden.
  function revealOnFocus() {
    if (window.scrollY > window.innerHeight * 0.3) window.scrollTo({ top: 0 });
  }

  return (
    <section
      className="hero-section"
      data-ready={ready}
      onFocus={revealOnFocus}
      ref={hostRef}
    >
      <div aria-hidden="true" className="hero-backdrop" />
      <ImageTrail hostRef={hostRef} items={TRAIL} />

      <div className="hero-inner">
        <p className="eyebrow hero-eyebrow">
          <span className="eyebrow-dot" />
          Evidence-first project handover
        </p>

        <h1 className="hero-title">
          <span className="sr-only">{HEADLINE_TEXT}</span>
          <span aria-hidden="true">
            {HEADLINE.map((line, lineIndex) => (
              <span className="hero-line" key={lineIndex}>
                {line.map(({ word, index, marked }) => (
                  <span key={word}>
                    <span className={`hero-word${marked ? " is-marked" : ""}`} style={{ "--i": index }}>
                      {word}
                    </span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </h1>

        <div className="hero-foot">
          <p className="hero-copy">
            Bring project evidence together, surface gaps, and prepare a clear handover.
          </p>
          <div className="hero-actions">
            <Magnetic>
              <a className="button button-primary button-large" href="#workspace">
                Open workspace
                <ArrowDown size={17} />
              </a>
            </Magnetic>
            <button className="button button-secondary button-large" onClick={onUploadClick} type="button">
              <Upload size={17} />
              Upload evidence
            </button>
          </div>
        </div>
      </div>

      <div className="hero-meta">
        <ul aria-label="Supported evidence formats" className="filetypes">
          {fileTypes.map((type) => (
            <li key={type}>{type}</li>
          ))}
        </ul>
        {motion && (
          <p className="hero-hint">
            <span aria-hidden="true" className="hero-hint-mouse" />
            {finePointer ? "Move your cursor — every claim leaves a paper trail" : "Every claim leaves a paper trail"}
          </p>
        )}
      </div>
    </section>
  );
}
