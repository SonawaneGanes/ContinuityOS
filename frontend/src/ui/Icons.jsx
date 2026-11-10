// Inline icons (24px grid, 1.6 stroke). No icon library to install.

function Icon({ children, size = 18, ...rest }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Brand mark: an open ring that hands over to a dot — continuity. */
export function BrandMark({ size = 30 }) {
  return (
    <svg aria-hidden="true" className="brand-mark" focusable="false" height={size} viewBox="0 0 32 32" width={size}>
      <rect fill="var(--lime)" height="32" rx="10" width="32" />
      <path
        d="M22.2 10.2a8.6 8.6 0 1 0 1.9 8.9"
        fill="none"
        stroke="var(--on-lime)"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
      <circle cx="24.2" cy="13.6" fill="var(--on-lime)" r="2.2" />
    </svg>
  );
}

export const ArrowDown = (props) => (
  <Icon {...props}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icon>
);

export const ArrowUp = (props) => (
  <Icon {...props}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);

export const ArrowRight = (props) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const Upload = (props) => (
  <Icon {...props}>
    <path d="M12 16V4M7 9l5-5 5 5M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16" />
  </Icon>
);

export const Sun = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Icon>
);

export const Moon = (props) => (
  <Icon {...props}>
    <path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2Z" />
  </Icon>
);

export const Sparkles = (props) => (
  <Icon {...props}>
    <path d="M10 3.5 11.7 8a3 3 0 0 0 1.8 1.8L18 11.5l-4.5 1.7a3 3 0 0 0-1.8 1.8L10 19.5 8.3 15a3 3 0 0 0-1.8-1.8L2 11.5l4.5-1.7A3 3 0 0 0 8.3 8L10 3.5Z" />
    <path d="M19 3v4M17 5h4" />
  </Icon>
);

export const SparklesOff = (props) => (
  <Icon {...props}>
    <path d="M10 3.5 11.7 8a3 3 0 0 0 1.8 1.8L18 11.5l-4.5 1.7a3 3 0 0 0-1.8 1.8L10 19.5 8.3 15a3 3 0 0 0-1.8-1.8L2 11.5l4.5-1.7A3 3 0 0 0 8.3 8L10 3.5Z" opacity="0.45" />
    <path d="M4 4l16 16" />
  </Icon>
);

export const Check = (props) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const Alert = (props) => (
  <Icon {...props}>
    <path d="M12 8.5v4.5M12 16.5h.01M10.3 4.3 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
  </Icon>
);

export const Info = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.5h.01" />
  </Icon>
);

export const Close = (props) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const Refresh = (props) => (
  <Icon {...props}>
    <path d="M20 11a8 8 0 0 0-14.3-4.4L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.4L20 15.5M20 20v-4.5h-4.5" />
  </Icon>
);

export const TimelineIcon = (props) => (
  <Icon {...props}>
    <path d="M6 4v16" />
    <circle cx="6" cy="8" fill="currentColor" r="1.6" stroke="none" />
    <circle cx="6" cy="16" fill="currentColor" r="1.6" stroke="none" />
    <path d="M11 8h9M11 16h6" />
  </Icon>
);

export const SourceIcon = (props) => (
  <Icon {...props}>
    <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
    <path d="M13.5 3 19 8.5V11M13.5 3v5.5H19" />
    <circle cx="16.5" cy="16.5" r="3" />
    <path d="m19 19 2 2" />
  </Icon>
);

export const GapsIcon = (props) => (
  <Icon {...props}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10v3a2 2 0 1 0 4 0V4h3.5A2.5 2.5 0 0 1 20 6.5V10h-3a2 2 0 1 0 0 4h3v3.5a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 17.5V6.5Z" />
  </Icon>
);

export const FileIcon = (props) => (
  <Icon {...props}>
    <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L13.5 3Z" />
    <path d="M13.5 3v5.5H19" />
  </Icon>
);

export const Spinner = ({ size = 16 }) => (
  <svg aria-hidden="true" className="spinner" focusable="false" height={size} viewBox="0 0 24 24" width={size}>
    <circle cx="12" cy="12" fill="none" opacity="0.25" r="9" stroke="currentColor" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
  </svg>
);
