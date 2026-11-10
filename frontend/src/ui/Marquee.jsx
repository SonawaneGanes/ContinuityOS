// A slow, tilted ticker between sections. Decorative, so hidden from
// assistive tech; the same words already appear in the hero headline.
const WORDS = ["Every decision", "Every deadline", "Every source", "In view"];

export default function Marquee() {
  const run = (
    <span className="marquee-run">
      {WORDS.map((word) => (
        <span className="marquee-word" key={word}>
          {word}
          <svg fill="currentColor" height="22" viewBox="0 0 24 24" width="22">
            <path d="M12 1.5 14.2 9.8 22.5 12l-8.3 2.2L12 22.5l-2.2-8.3L1.5 12l8.3-2.2L12 1.5Z" />
          </svg>
        </span>
      ))}
    </span>
  );

  return (
    <div aria-hidden="true" className="marquee">
      <div className="marquee-track">
        {run}
        {run}
        {run}
      </div>
    </div>
  );
}
