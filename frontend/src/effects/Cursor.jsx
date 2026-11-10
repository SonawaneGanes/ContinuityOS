// Custom cursor — a precise dot (1:1 with the mouse, so aiming is never laggy)
// plus a soft ring that trails behind and stretches with speed.
//
// It reacts to what is underneath:
//   links / buttons        → ring grows and fills
//   text fields            → becomes a text caret
//   [data-cursor="Label"]  → shows a small label next to the pointer
//
// Only mounts for mouse / trackpad users with motion enabled. Touch devices
// and reduced-motion users keep the normal system cursor.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { usePrefs } from "./prefs";

const TEXT_FIELDS = [
  "input:not([type])",
  'input[type="text"]',
  'input[type="search"]',
  'input[type="number"]',
  'input[type="email"]',
  'input[type="url"]',
  'input[type="tel"]',
  'input[type="password"]',
  "textarea",
  '[contenteditable="true"]',
  '[contenteditable=""]',
].join(",");

const CLICKABLE = [
  "a[href]",
  "button",
  "summary",
  "select",
  "label.button",
  '[role="button"]',
  '[role="tab"]',
  '[role="link"]',
  'input[type="file"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="submit"]',
  'input[type="range"]',
].join(",");

// Labels for elements we do not own the markup of (the evidence components).
const AUTO_LABELS = [[".claim-card", "Open source"]];

const DISABLED = ':disabled, [aria-disabled="true"]';

function describe(target) {
  if (!(target instanceof Element)) return ["default", ""];

  const tagged = target.closest("[data-cursor]");
  if (tagged?.dataset.cursor && !tagged.matches(DISABLED)) {
    return ["label", tagged.dataset.cursor];
  }
  for (const [selector, text] of AUTO_LABELS) {
    if (target.closest(selector)) return ["label", text];
  }
  if (target.closest(TEXT_FIELDS)) return ["text", ""];

  const clickable = target.closest(CLICKABLE);
  if (clickable && !clickable.matches(DISABLED)) return ["hover", ""];
  return ["default", ""];
}

export default function Cursor() {
  const { motion, finePointer } = usePrefs();
  const active = motion && finePointer;

  const blendRef = useRef(null);
  const plainRef = useRef(null);
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const tagRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const layers = [blendRef.current, plainRef.current];
    const ring = ringRef.current;
    const dot = dotRef.current;
    const tag = tagRef.current;
    const label = labelRef.current;
    const html = document.documentElement;

    let x = -100;
    let y = -100;
    let ringX = x;
    let ringY = y;
    let frame = 0;
    let scrollFrame = 0;
    let seeded = false;
    let visible = false;
    let state = "default";
    let text = "";

    const setAll = (key, value) => {
      layers.forEach((layer) => {
        layer.dataset[key] = value;
      });
    };

    const setState = ([nextState, nextText]) => {
      if (nextState !== state) {
        state = nextState;
        setAll("state", nextState);
      }
      if (nextText !== text) {
        text = nextText;
        if (nextText) label.textContent = nextText;
      }
    };

    const show = () => {
      if (visible) return;
      visible = true;
      setAll("visible", "true");
    };

    const hide = () => {
      if (!visible) return;
      visible = false;
      setAll("visible", "false");
    };

    const render = () => {
      const dx = x - ringX;
      const dy = y - ringY;
      const speed = Math.hypot(dx, dy);
      ringX += dx * 0.2;
      ringY += dy * 0.2;

      // Stretch the ring along its direction of travel (a little jelly).
      const stretch = state === "label" ? 0 : Math.min(speed / 170, 0.3);
      const angle = Math.atan2(dy, dx);
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.55})`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      tag.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      frame = speed > 0.05 ? requestAnimationFrame(render) : 0;
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onMove = (event) => {
      if (event.pointerType === "touch") {
        hide();
        return;
      }
      x = event.clientX;
      y = event.clientY;
      if (!seeded) {
        seeded = true;
        ringX = x;
        ringY = y;
      }
      show();
      setState(describe(event.target));
      kick();
    };

    // Scrolling moves content under a stationary pointer: re-check what's there.
    const onScroll = () => {
      if (!visible || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        setState(describe(document.elementFromPoint(x, y)));
      });
    };

    const onDown = () => setAll("pressed", "true");
    const onUp = () => setAll("pressed", "false");

    html.classList.add("has-custom-cursor");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("dragenter", hide);
    document.addEventListener("mouseleave", hide);

    return () => {
      html.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", hide);
      window.removeEventListener("dragenter", hide);
      document.removeEventListener("mouseleave", hide);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
    };
  }, [active]);

  if (!active) return null;

  return createPortal(
    <>
      {/* Blended layer: inverts whatever is beneath, so it stays visible on any colour. */}
      <div
        aria-hidden="true"
        className="cursor cursor-blend"
        data-pressed="false"
        data-state="default"
        data-visible="false"
        ref={blendRef}
      >
        <div className="cursor-mover" ref={ringRef}>
          <div className="cursor-ring" />
        </div>
        <div className="cursor-mover" ref={dotRef}>
          <div className="cursor-dot" />
        </div>
      </div>

      {/* Plain layer: the label chip keeps its real colours. */}
      <div
        aria-hidden="true"
        className="cursor cursor-plain"
        data-pressed="false"
        data-state="default"
        data-visible="false"
        ref={plainRef}
      >
        <div className="cursor-mover" ref={tagRef}>
          <div className="cursor-tag">
            <span ref={labelRef} />
            <svg aria-hidden="true" fill="none" height="10" viewBox="0 0 10 10" width="10">
              <path d="M2 8 8 2M3.5 2H8v4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
