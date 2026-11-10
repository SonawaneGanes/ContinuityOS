// Animates a number towards `target` (ease-out). Jumps straight there when
// motion is off.
import { useEffect, useRef, useState } from "react";

import { usePrefs } from "./prefs";

export default function useCountUp(target, duration = 900) {
  const { motion } = usePrefs();
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    const to = Number.isFinite(target) ? target : 0;
    let frame = 0;

    if (!motion || from === to) {
      frame = requestAnimationFrame(() => {
        current.current = to;
        setValue(to);
      });
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      current.current = from + (to - from) * eased;
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [duration, motion, target]);

  return Math.round(value);
}
