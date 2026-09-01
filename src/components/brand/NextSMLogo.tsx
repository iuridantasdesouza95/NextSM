import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

/**
 * Official NextSM mark — Proposal 3 / Premium-Tecnológica.
 * The geometry follows the approved reference: connected hexagon,
 * six connection nodes, geometric N, NextSM wordmark and Service Desk lockup.
 */
export function NextSMLogo({ compact = false, inverse = false, className = "", style, ...props }: NextSMLogoProps) {
  const textColor = inverse ? "#FFFFFF" : "#0A1025";
  const subtitleColor = inverse ? "#FFFFFF" : "#0A1025";
  const id = `nextsm-${compact ? "compact" : "full"}-${inverse ? "inverse" : "default"}`;

  return (
    <div
      className={`nextsm-logo ${inverse ? "nextsm-logo--inverse" : ""} ${className}`}
      style={{ fontFamily: "Sora, Inter, ui-sans-serif, system-ui, sans-serif", ...style }}
      {...props}
    >
      <svg
        className="nextsm-logo__art"
        viewBox={compact ? "0 0 220 220" : "0 0 720 220"}
        width={compact ? 64 : 260}
        height={compact ? 64 : 80}
        role="img"
        aria-label={compact ? "NextSM" : "NextSM — Service Desk"}
        preserveAspectRatio="xMinYMid meet"
      >
        <defs>
          <linearGradient id={`${id}-blue`} x1="28" y1="188" x2="190" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
          <linearGradient id={`${id}-n`} x1="72" y1="155" x2="158" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
          <linearGradient id={`${id}-sm`} x1="448" y1="140" x2="585" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0066FF" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
        </defs>

        <g transform="translate(12 19)">
          <path d="M110 19 L181 60 L181 141 L110 182 L39 141 L39 60 Z" fill="none" stroke={`url(#${id}-blue)`} strokeWidth="9" strokeLinejoin="round" />
          <path d="M75 143 V77 Q75 70 81 67 Q87 64 92 69 L145 116 V75 Q145 68 152 66 Q160 64 160 73 V143 Q160 151 153 154 Q147 156 141 151 L91 106 V143 Q91 151 83 153 Q75 154 75 143 Z" fill={`url(#${id}-n)`} />
          <path d="M77 78 L92 91 L145 68" fill="none" stroke="#00D4FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
          <circle cx="110" cy="19" r="10" fill="#00D4FF" />
          <circle cx="181" cy="60" r="10" fill="#00D4FF" />
          <circle cx="181" cy="141" r="10" fill="#0066FF" />
          <circle cx="110" cy="182" r="10" fill="#0066FF" />
          <circle cx="39" cy="141" r="10" fill="#0066FF" />
          <circle cx="39" cy="60" r="10" fill="#0066FF" />
        </g>

        {!compact && (
          <>
            <g fontFamily="Sora, Inter, sans-serif" fontWeight="700">
              <text x="235" y="111" fontSize="72" letterSpacing="-3.8" fill={textColor}>Next</text>
              <text x="448" y="111" fontSize="72" letterSpacing="-3.8" fill={`url(#${id}-sm)`}>SM</text>
            </g>
            <g fontFamily="Sora, Inter, sans-serif">
              <line x1="235" y1="139" x2="277" y2="139" stroke="#0066FF" strokeWidth="3" />
              <text x="291" y="144" fontSize="16" fontWeight="600" letterSpacing="6.2" fill={subtitleColor}>SERVICE DESK</text>
              <line x1="559" y1="139" x2="601" y2="139" stroke="#00D4FF" strokeWidth="3" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
