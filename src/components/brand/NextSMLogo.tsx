import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

export function NextSMLogo({ compact = false, inverse = false, className = "", ...props }: NextSMLogoProps) {
  const textColor = inverse ? "#FFFFFF" : "#0A1025";
  return (
    <div
      className={`nextsm-logo ${inverse ? "nextsm-logo--inverse" : ""} ${className}`}
      style={{ fontFamily: "Sora, Inter, ui-sans-serif, system-ui, sans-serif" }}
      {...props}
    >
      <svg
        className="nextsm-logo__art"
        viewBox={compact ? "0 0 96 96" : "0 0 420 96"}
        role="img"
        aria-label="NextSM — Service Desk"
        preserveAspectRatio="xMinYMid meet"
      >
        <defs>
          <linearGradient id="nextsm-logo-gradient" x1="8" y1="78" x2="82" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
        <g transform="translate(4 4)">
          <path d="M44 2 78 22v40L44 82 10 62V22Z" fill="#0A1025" stroke="url(#nextsm-logo-gradient)" strokeWidth="5" strokeLinejoin="round" />
          <path d="M44 15 66 28v28L44 69 22 56V28Z" fill="none" stroke="#0066FF" strokeWidth="2" opacity=".35" />
          <path d="M27 55V31l12 10 12-18 11 7v25l-11-7-12 8-12-9Z" fill="url(#nextsm-logo-gradient)" />
          <path d="M27 31v24M39 41l12-18M51 23v33" fill="none" stroke="#0A1025" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="44" cy="2" r="6" fill="#00D4FF" />
          <circle cx="78" cy="22" r="6" fill="#00D4FF" />
          <circle cx="78" cy="62" r="6" fill="#0066FF" />
          <circle cx="44" cy="82" r="6" fill="#0066FF" />
          <circle cx="10" cy="62" r="6" fill="#0066FF" />
          <circle cx="10" cy="22" r="6" fill="#0066FF" />
        </g>
        {!compact && (
          <g transform="translate(105 8)">
            <text x="0" y="47" fontSize="43" fontWeight="700" letterSpacing="-2" fill={textColor}>Next</text>
            <text x="122" y="47" fontSize="43" fontWeight="700" letterSpacing="-2" fill="url(#nextsm-logo-gradient)">SM</text>
            <line x1="0" y1="67" x2="36" y2="67" stroke="#0066FF" strokeWidth="2" />
            <text x="47" y="71" fontSize="11" fontWeight="500" letterSpacing="4" fill={inverse ? "#FFFFFF" : "#182338"}>SERVICE DESK</text>
            <line x1="190" y1="67" x2="226" y2="67" stroke="#00D4FF" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}
