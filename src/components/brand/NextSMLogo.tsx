import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

export function NextSMLogo({ compact = false, inverse = false, className = "", style, ...props }: NextSMLogoProps) {
  const textColor = inverse ? "#FFFFFF" : "#081B33";
  const subtitleColor = inverse ? "#CBD5E1" : "#0D2747";
  const id = `nextsm-${compact ? "compact" : "full"}-${inverse ? "inverse" : "default"}`;
  return (
    <div className={`nextsm-logo ${inverse ? "nextsm-logo--inverse" : ""} ${className}`} style={{ fontFamily: "Manrope, Inter, ui-sans-serif, system-ui, sans-serif", ...style }} {...props}>
      <svg className="nextsm-logo__art" viewBox={compact ? "0 0 96 96" : "0 0 520 120"} width={compact ? 64 : 260} height={compact ? 64 : 60} role="img" aria-label={compact ? "NextSM" : "NextSM — Service Desk"} preserveAspectRatio="xMinYMid meet">
        <defs>
          <linearGradient id={`${id}-gradient`} x1="8" y1="88" x2="88" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id={`${id}-n`} x1="20" y1="72" x2="70" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <g transform="translate(5 5)">
          <path d="M45 3 L79 23 L79 63 L45 83 L11 63 L11 23 Z" fill="none" stroke={`url(#${id}-gradient)`} strokeWidth="6" strokeLinejoin="round" />
          <path d="M27 60 V31 L38 42 L53 22 V58 L42 51 L27 60 Z" fill={`url(#${id}-n)`} />
          <path d="M27 31 L38 42 L53 22" fill="none" stroke="#60A5FA" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M53 22 V58" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
          <circle cx="45" cy="3" r="6.5" fill="#60A5FA" />
          <circle cx="79" cy="23" r="6.5" fill="#60A5FA" />
          <circle cx="79" cy="63" r="6.5" fill="#2563EB" />
          <circle cx="45" cy="83" r="6.5" fill="#2563EB" />
          <circle cx="11" cy="63" r="6.5" fill="#2563EB" />
          <circle cx="11" cy="23" r="6.5" fill="#2563EB" />
        </g>
        {!compact && (
          <g transform="translate(125 7)">
            <text x="0" y="55" fontSize="50" fontWeight="700" letterSpacing="-2.6" fill={textColor}>Next</text>
            <text x="145" y="55" fontSize="50" fontWeight="700" letterSpacing="-2.6" fill={`url(#${id}-gradient)`}>SM</text>
            <line x1="0" y1="78" x2="42" y2="78" stroke="#2563EB" strokeWidth="2" />
            <text x="55" y="82" fontSize="13" fontWeight="600" letterSpacing="5.2" fill={subtitleColor}>SERVICE DESK</text>
            <line x1="235" y1="78" x2="277" y2="78" stroke="#60A5FA" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}
