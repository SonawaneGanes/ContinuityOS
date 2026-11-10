// Image trail — pictures appear along the path of the cursor, glide after it,
// then settle and fade. The "paper trail" in the hero.
//
// How it moves:
//   • `mouse` is where the pointer is, `lag` chases it with easing.
//   • Every time the pointer has travelled `gap` pixels, the next picture is
//     launched from `lag` towards `mouse`, tilted by how fast it was going.
//   • When nobody is moving the mouse (or on touch screens) a slow figure-of-
//     eight "ghost" pointer keeps the hero alive.
//   • With motion switched off, three pictures stand still in a fan instead.
//
// Performance: a fixed pool of elements, animated only with transform and
// opacity through the Web Animations API. The loop stops whenever the host
// is scrolled out of view or the tab is hidden.
import { useEffect, useRef } from "react";

import { usePrefs } from "./prefs";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function Picture({ item }) {
  return (
    <figure className="trail-item">
      <img alt="" decoding="async" draggable="false" src={item.src} />
      {item.caption && (
        <figcaption>
          <span className="trail-pin" />
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function ImageTrail({
  hostRef,
  items,
  gap = 86, // px the pointer travels between pictures
  ghostGap = 170, // same, for the idle "ghost" pointer (calmer)
  idleAfter = 2600, // ms without movement before the ghost takes over
  life = 1400, // ms each picture stays alive
}) {
  const { motion } = usePrefs();
  const layerRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    if (!motion || !host || !layer) return undefined;

    const glow = layer.querySelector(".trail-glow");
    const nodes = Array.from(layer.querySelectorAll(".trail-item"));
    if (nodes.length === 0) return undefined;

    let width = host.clientWidth;
    let height = host.clientHeight;
    let itemW = nodes[0].offsetWidth;
    let itemH = nodes[0].offsetHeight;

    const mouse = { x: width * 0.62, y: height * 0.42 };
    const lag = { ...mouse };
    const last = { ...mouse };

    let frame = 0;
    let previous = 0;
    let lastSpawn = 0;
    let lastRealMove = performance.now() - idleAfter + 1500; // ghost starts ~1.5s after load
    let ghosting = false;
    let ghostClock = 0;
    let cursor = 0;
    let depth = 1;
    let onScreen = true;

    const measure = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      itemW = nodes[0].offsetWidth;
      itemH = nodes[0].offsetHeight;
    };

    const spawn = (now) => {
      const node = nodes[cursor % nodes.length];
      cursor += 1;
      last.x = mouse.x;
      last.y = mouse.y;
      lastSpawn = now;

      const img = node.querySelector("img");
      if (!img || !img.complete || img.naturalWidth === 0) return; // still loading

      const vx = mouse.x - lag.x;
      const vy = mouse.y - lag.y;
      const fromX = lag.x - itemW / 2;
      const fromY = lag.y - itemH / 2;
      const toX = mouse.x - itemW / 2;
      const toY = mouse.y - itemH / 2;
      const tilt = clamp(vx * 0.07, -13, 13) + (Math.random() - 0.5) * 7;
      const driftX = clamp(vx * 0.4, -80, 80);
      const driftY = clamp(vy * 0.4, -80, 80);

      node.style.zIndex = String((depth += 1));
      node.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());

      node.animate(
        [
          {
            opacity: 0,
            transform: `translate3d(${fromX}px, ${fromY}px, 0) rotate(${tilt * 0.3}deg) scale(0.35)`,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          },
          {
            offset: 0.3,
            opacity: 1,
            transform: `translate3d(${toX}px, ${toY}px, 0) rotate(${tilt}deg) scale(1)`,
            easing: "linear",
          },
          {
            offset: 0.62,
            opacity: 1,
            transform: `translate3d(${toX + driftX * 0.35}px, ${toY + driftY * 0.35}px, 0) rotate(${tilt}deg) scale(1)`,
            easing: "cubic-bezier(0.5, 0, 0.75, 0)",
          },
          {
            opacity: 0,
            transform: `translate3d(${toX + driftX}px, ${toY + driftY + 46}px, 0) rotate(${tilt * 1.5}deg) scale(0.62)`,
          },
        ],
        { duration: life, fill: "both" },
      );

      // Counter-zoom inside the frame so the picture "develops" as it lands.
      img.animate([{ transform: "scale(1.5)" }, { transform: "scale(1)" }], {
        duration: life * 0.6,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    };

    const tick = (now) => {
      frame = 0;
      const delta = Math.min(50, previous ? now - previous : 16.7);
      previous = now;

      const idle = now - lastRealMove > idleAfter;
      if (idle) {
        ghostClock += delta / 1000;
        mouse.x = width * (0.5 + 0.36 * Math.sin(ghostClock * 0.6));
        mouse.y = height * (0.5 + 0.26 * Math.sin(ghostClock * 0.9 + 1.2));
        if (!ghosting) {
          ghosting = true;
          lag.x = last.x = mouse.x;
          lag.y = last.y = mouse.y;
        }
      }

      const ease = 1 - Math.pow(1 - 0.13, delta / 16.7);
      lag.x += (mouse.x - lag.x) * ease;
      lag.y += (mouse.y - lag.y) * ease;

      if (glow) glow.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;

      const travelled = Math.hypot(mouse.x - last.x, mouse.y - last.y);
      if (travelled > (ghosting ? ghostGap : gap) && now - lastSpawn > 64) spawn(now);

      schedule();
    };

    // The hero is sticky, so "on screen" means: not yet covered by the page
    // that slides over it.
    const isCovered = () => window.scrollY > height * 0.92;

    function schedule() {
      if (frame || !onScreen || document.hidden || isCovered()) return;
      frame = requestAnimationFrame(tick);
    }

    const onMove = (event) => {
      if (event.pointerType === "touch") return;
      const rect = host.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      const now = performance.now();
      if (ghosting || now - lastRealMove > 900) {
        // Re-entering: start a fresh stroke instead of streaking across the hero.
        ghosting = false;
        lag.x = last.x = mouse.x;
        lag.y = last.y = mouse.y;
      }
      lastRealMove = now;
      schedule();
    };

    const wake = () => {
      previous = 0;
      schedule();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      wake();
    });
    intersectionObserver.observe(host);

    host.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("visibilitychange", wake);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", wake);
      nodes.forEach((node) => {
        node.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      });
    };
  }, [motion, hostRef, gap, ghostGap, idleAfter, life]);

  if (!motion) {
    return (
      <div aria-hidden="true" className="trail trail-still">
        {items.slice(0, 3).map((item) => (
          <Picture item={item} key={item.src} />
        ))}
      </div>
    );
  }

  // Two copies of every picture, so one can still be fading while its twin
  // is launched again on a fast sweep.
  const pool = [...items, ...items];

  return (
    <div aria-hidden="true" className="trail" ref={layerRef}>
      <div className="trail-glow" />
      {pool.map((item, index) => (
        <Picture item={item} key={`${index}-${item.src}`} />
      ))}
    </div>
  );
}
