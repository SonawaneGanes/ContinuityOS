// Pointer-driven hooks. Each one only writes CSS custom properties — the
// actual look (glow, tilt, parallax) lives in CSS, so it is easy to restyle.
import { useEffect } from "react";
import { flushSync } from "react-dom";

import { getPrefs, usePrefs } from "./prefs";

/**
 * Spotlight: keeps --mx / --my (pointer position in px, relative to the
 * element) up to date on every element matching `selector` that is under the
 * pointer — the innermost one and any matching ancestors, so a card and the
 * panel around it are lit together. One delegated listener covers any number
 * of elements, including ones rendered later by other components.
 */
export function useSpotlight(rootRef, selector) {
  const { finePointer } = usePrefs();

  useEffect(() => {
    const root = rootRef.current;
    if (!finePointer || !root) return undefined;

    let frame = 0;
    let latest = null;

    const paint = () => {
      frame = 0;
      const chain = [];
      let node = latest.target instanceof Element ? latest.target.closest(selector) : null;
      while (node && root.contains(node)) {
        chain.push(node);
        node = node.parentElement?.closest(selector) ?? null;
      }
      const rects = chain.map((element) => element.getBoundingClientRect()); // read…
      chain.forEach((element, index) => {
        // …then write
        element.style.setProperty("--mx", `${(latest.clientX - rects[index].left).toFixed(1)}px`);
        element.style.setProperty("--my", `${(latest.clientY - rects[index].top).toFixed(1)}px`);
      });
    };

    const onMove = (event) => {
      if (event.pointerType === "touch") return;
      latest = event;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      root.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [finePointer, rootRef, selector]);
}

/**
 * Group spotlight + tilt for a small set of cards (the bento grid).
 *  • every card gets --mx / --my, so neighbours light up as the pointer nears
 *  • the hovered card also gets --tilt-x / --tilt-y (deg) and --shift-x /
 *    --shift-y (-1…1) for 3D tilt and layered parallax
 */
export function useCardField(rootRef, selector, { maxTilt = 5 } = {}) {
  const { motion, finePointer } = usePrefs();

  useEffect(() => {
    const root = rootRef.current;
    if (!finePointer || !root) return undefined;

    let frame = 0;
    let latest = null;
    let hovered = null;

    const settle = (card) => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--shift-x", "0");
      card.style.setProperty("--shift-y", "0");
      card.dataset.hovered = "false";
    };

    const paint = () => {
      frame = 0;
      const cards = Array.from(root.querySelectorAll(selector));
      const rects = cards.map((card) => card.getBoundingClientRect()); // read…
      const over = latest.target instanceof Element ? latest.target.closest(selector) : null;

      cards.forEach((card, index) => {
        // …then write
        const rect = rects[index];
        const x = latest.clientX - rect.left;
        const y = latest.clientY - rect.top;
        card.style.setProperty("--mx", `${x.toFixed(1)}px`);
        card.style.setProperty("--my", `${y.toFixed(1)}px`);

        if (card !== over || !motion) return;
        const nx = (x / rect.width) * 2 - 1;
        const ny = (y / rect.height) * 2 - 1;
        card.style.setProperty("--tilt-x", `${(-ny * maxTilt).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(nx * maxTilt).toFixed(2)}deg`);
        card.style.setProperty("--shift-x", nx.toFixed(3));
        card.style.setProperty("--shift-y", ny.toFixed(3));
        card.dataset.hovered = "true";
      });

      if (hovered && hovered !== over) settle(hovered);
      hovered = over;
    };

    const onMove = (event) => {
      if (event.pointerType === "touch") return;
      latest = event;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      root.querySelectorAll(selector).forEach((card) => {
        settle(card);
        card.style.setProperty("--mx", "-999px");
        card.style.setProperty("--my", "-999px");
      });
      hovered = null;
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [finePointer, maxTilt, motion, rootRef, selector]);
}

/**
 * Runs a state update inside a View Transition when the browser supports it
 * (and motion is on); otherwise just runs it. Returns the transition or null.
 */
export function withViewTransition(update) {
  const supported = typeof document !== "undefined" && typeof document.startViewTransition === "function";
  if (!supported || !getPrefs().motion) {
    update();
    return null;
  }
  return document.startViewTransition(() => {
    flushSync(update);
  });
}
