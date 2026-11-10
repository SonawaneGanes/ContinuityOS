// Magnetic — the wrapped element leans towards the cursor while it is hovered
// and springs back when the cursor leaves. Used on the primary actions.
//
// The outer span is the (still) hit area; only the inner span moves, so the
// target never runs away from the pointer.
import { useEffect, useRef } from "react";

import { usePrefs } from "./prefs";

export default function Magnetic({ children, className = "", strength = 0.3 }) {
  const { motion, finePointer } = usePrefs();
  const active = motion && finePointer;
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return undefined;

    const onMove = (event) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) * strength;
      const y = (event.clientY - (rect.top + rect.height / 2)) * strength;
      element.style.setProperty("--magnet-x", `${x.toFixed(1)}px`);
      element.style.setProperty("--magnet-y", `${y.toFixed(1)}px`);
      element.dataset.pulled = "true";
    };

    const release = () => {
      element.style.setProperty("--magnet-x", "0px");
      element.style.setProperty("--magnet-y", "0px");
      element.dataset.pulled = "false";
    };

    element.addEventListener("pointermove", onMove, { passive: true });
    element.addEventListener("pointerleave", release);
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", release);
      release();
    };
  }, [active, strength]);

  return (
    <span className={`magnetic ${className}`.trim()} ref={ref}>
      <span className="magnetic-inner">{children}</span>
    </span>
  );
}
