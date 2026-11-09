const COLORS = {
  VERIFIED: "#16794b",
  UNCERTAIN: "#a05a00",
  CONFLICTING: "#b42318",
  MISSING: "#6941c6",
};

export default function LabelBadge({ label = "VERIFIED" }) {
  const color = COLORS[label] || "#475467";
  return (
    <span
      className="label-badge"
      style={{ "--badge-color": color }}
      aria-label={`Evidence status: ${label}`}
    >
      {label}
    </span>
  );
}
