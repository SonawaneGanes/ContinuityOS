// Tabs with a pill that slides to the active tab.
// Keyboard: ← → move between tabs, Home / End jump to the first / last.
import { useLayoutEffect, useRef } from "react";

export default function Tabs({ idBase, label, onChange, tabs, value }) {
  const listRef = useRef(null);
  const layoutKey = tabs.map((tab) => `${tab.key}:${tab.count ?? ""}`).join("|");

  // Position the sliding pill under the active tab. It is written straight to
  // CSS variables, so moving it never re-renders React.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const place = () => {
      const active = list.querySelector('[aria-selected="true"]');
      if (!active) return;
      list.style.setProperty("--tab-x", `${active.offsetLeft}px`);
      list.style.setProperty("--tab-w", `${active.offsetWidth}px`);
    };

    place();
    // Turn the slide animation on only after the first placement.
    const frame = requestAnimationFrame(() => {
      list.dataset.placed = "true";
    });

    if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(frame);
    const observer = new ResizeObserver(place);
    observer.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value, layoutKey]);

  function onKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.key === value);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next < 0) return;

    event.preventDefault();
    onChange(tabs[next].key);
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  }

  return (
    <div aria-label={label} className="tabbar" onKeyDown={onKeyDown} ref={listRef} role="tablist">
      <span aria-hidden="true" className="tab-indicator" />
      {tabs.map((tab) => {
        const active = tab.key === value;
        const TabIcon = tab.icon;
        return (
          <button
            aria-controls={`${idBase}-panel`}
            aria-selected={active}
            className={`tab-button${active ? " is-active" : ""}`}
            id={`${idBase}-tab-${tab.key}`}
            key={tab.key}
            onClick={() => onChange(tab.key)}
            role="tab"
            tabIndex={active ? 0 : -1}
            type="button"
          >
            {TabIcon && <TabIcon size={16} />}
            {tab.label}
            {tab.count != null && <span className="tab-count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
