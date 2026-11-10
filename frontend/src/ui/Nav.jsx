// Floating top bar: brand, section links, backend status, motion + theme switches.
import { withViewTransition } from "../effects/pointer";
import { setMotion, setTheme, usePrefs } from "../effects/prefs";
import { BrandMark, Moon, Refresh, Sparkles, SparklesOff, Sun } from "./Icons";

const HEALTH_TEXT = {
  checking: "Checking backend…",
  ok: "Backend online",
  unavailable: "Backend offline",
};

export default function Nav({ health, onRecheck }) {
  const { theme, motion } = usePrefs();
  const nextTheme = theme === "dark" ? "light" : "dark";

  // The new theme grows out of the button in a circle (View Transitions API).
  // Browsers without it simply switch instantly.
  function toggleTheme(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = withViewTransition(() => setTheme(nextTheme));
    transition?.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 750,
            easing: "cubic-bezier(0.65, 0, 0.35, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
  }

  return (
    <header className="topbar">
      <div className="topbar-pill">
        <a aria-label="ContinuityOS home" className="brand" href="#top">
          <BrandMark />
          <span>ContinuityOS</span>
        </a>

        <nav aria-label="Page sections" className="topbar-links">
          <a href="#how">How it works</a>
          <a href="#workspace">Workspace</a>
        </nav>

        <div className="topbar-actions">
          <div className={`health-status health-${health}`}>
            <span className="health-dot" />
            <span role="status">{HEALTH_TEXT[health] ?? HEALTH_TEXT.unavailable}</span>
            {health === "unavailable" && (
              <button className="health-retry" onClick={onRecheck} type="button">
                <Refresh size={13} />
                Retry
              </button>
            )}
          </div>

          <button
            aria-label={motion ? "Turn motion effects off" : "Turn motion effects on"}
            aria-pressed={motion}
            className="icon-button"
            onClick={() => setMotion(!motion)}
            title={motion ? "Motion effects: on" : "Motion effects: off"}
            type="button"
          >
            {motion ? <Sparkles /> : <SparklesOff />}
          </button>

          <button
            aria-label={`Switch to ${nextTheme} theme`}
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${nextTheme} theme`}
            type="button"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
        </div>
      </div>
    </header>
  );
}
