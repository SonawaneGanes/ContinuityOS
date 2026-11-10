// A small ring gauge for the readiness score (0–100). The number counts up
// and the ring follows it.
import useCountUp from "../effects/useCountUp";

export default function ScoreRing({ label = "Readiness", size = 44, value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const shown = useCountUp(safe);

  return (
    <span aria-label={`${label}: ${safe} out of 100`} className="score-ring" role="img">
      <svg aria-hidden="true" height={size} viewBox="0 0 44 44" width={size}>
        <circle className="score-ring-track" cx="22" cy="22" r="18" />
        <circle
          className="score-ring-value"
          cx="22"
          cy="22"
          pathLength="100"
          r="18"
          style={{ strokeDashoffset: 100 - shown }}
        />
      </svg>
      <span aria-hidden="true" className="score-ring-number">
        {shown}
      </span>
    </span>
  );
}
