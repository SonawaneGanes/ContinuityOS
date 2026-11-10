// "How it works" — four cards, one per step of a handover. Each pairs a piece
// of the hero artwork with a small live fragment of the real interface.
// Cards tilt towards the cursor and their layers shift at different depths.
import { useRef } from "react";

import magnifier from "../assets/trail/magnifier.webp";
import papers from "../assets/trail/papers.webp";
import puzzle from "../assets/trail/puzzle.webp";
import stamp from "../assets/trail/stamp.webp";
import Reveal from "../effects/Reveal";
import { useCardField } from "../effects/pointer";
import { Check, FileIcon } from "./Icons";

// Wide cards float their fragment in the open space beside the artwork;
// narrow cards lay it over the artwork instead.
function Card({ art, children, delay, fragment, step, title, wide = false }) {
  return (
    <Reveal className={`bento-cell${wide ? " is-wide" : ""}`} delay={delay}>
      <article className="bento-card">
        <div className="bento-copy">
          <span className="bento-step">{step}</span>
          {wide && (
            <div aria-hidden="true" className="bento-float">
              {fragment}
            </div>
          )}
          <h3>{title}</h3>
          {children}
        </div>
        <div aria-hidden="true" className="bento-art">
          <img alt="" decoding="async" loading="lazy" src={art} />
          {!wide && fragment}
        </div>
      </article>
    </Reveal>
  );
}

export default function HowItWorks({ fileTypes }) {
  const gridRef = useRef(null);
  useCardField(gridRef, ".bento-card");

  return (
    <section aria-labelledby="how-title" className="how" id="how">
      <Reveal className="block-head">
        <p className="eyebrow">How it works</p>
        <h2 className="block-title" id="how-title">
          From scattered evidence to a <em>clean handover</em>, in four moves.
        </h2>
      </Reveal>

      <div className="bento" ref={gridRef}>
        <Card
          art={papers}
          fragment={
            <div className="frag frag-files">
              {fileTypes.map((type, index) => (
                <span className="frag-file" key={type} style={{ "--n": index }}>
                  <FileIcon size={13} />
                  {type}
                </span>
              ))}
            </div>
          }
          step="01"
          title="Collect"
          wide
        >
          <p>
            Drop in the evidence you already have. Claims are pulled out of each file and
            checked on the way in.
          </p>
        </Card>

        <Card
          art={magnifier}
          delay={90}
          fragment={
            <div className="frag frag-source">
              <span className="frag-name">
                <FileIcon size={13} />
                source file
              </span>
              <span className="frag-bar" style={{ width: "86%" }} />
              <span className="frag-bar is-marked" style={{ width: "72%" }} />
              <span className="frag-bar" style={{ width: "54%" }} />
            </div>
          }
          step="02"
          title="Trace"
        >
          <p>
            Decisions and deadlines line up on one timeline. Open any claim to see the exact
            passage it came from, highlighted in the original.
          </p>
        </Card>

        <Card
          art={puzzle}
          fragment={
            <div className="frag frag-score">
              <svg height="46" viewBox="0 0 46 46" width="46">
                <circle className="frag-ring-track" cx="23" cy="23" r="18" />
                <circle className="frag-ring-value" cx="23" cy="23" pathLength="100" r="18" />
              </svg>
              <span>
                <strong>Readiness</strong>
                <small>score out of 100</small>
              </span>
            </div>
          }
          step="03"
          title="Close gaps"
        >
          <p>
            See what is still missing before it gets missed. Every gap rolls up into one
            readiness score.
          </p>
        </Card>

        <Card
          art={stamp}
          delay={90}
          fragment={
            <div className="frag frag-sign">
              <span className="frag-check">
                <Check size={14} />
              </span>
              <span>
                <small>Approved by</small>
                <svg className="frag-signature" height="26" viewBox="0 0 120 26" width="120">
                  <path
                    d="M3 19c7-12 12-16 14-12 2 5-7 15-4 15 4 0 9-13 13-13 3 0 0 9 3 9s5-8 9-8 1 8 5 8c5 0 6-13 11-13 4 0 0 12 4 12 3 0 6-5 9-5s3 5 8 5 12-3 21-6"
                    pathLength="100"
                  />
                </svg>
              </span>
            </div>
          }
          step="04"
          title="Hand over"
          wide
        >
          <p>
            Sign off with a name on it and export the record. Every claim stays linked to its
            original source evidence.
          </p>
        </Card>
      </div>
    </section>
  );
}
