import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

/**
 * NextSM official logo — Proposal 3 / Premium-Tecnológica.
 * Uses the stable SVG asset that renders natively in the browser.
 */
export function NextSMLogo({ compact = false, className = "", style, ...props }: NextSMLogoProps) {
  const logoSrc = "/brand/nextsm-logo-dark.svg";

  if (compact) {
    return (
      <div
        className={`nextsm-logo nextsm-logo--compact ${className}`}
        style={{ width: 64, height: 64, overflow: "hidden", position: "relative", flexShrink: 0, ...style }}
        {...props}
      >
        <img
          src={logoSrc}
          alt="NextSM"
          loading="eager"
          decoding="async"
          style={{
            display: "block",
            width: "209.45px",
            height: "64px",
            maxWidth: "none",
            position: "absolute",
            left: 0,
            top: 0,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`nextsm-logo ${className}`}
      style={{ lineHeight: 0, ...style }}
      {...props}
    >
      <img
        src={logoSrc}
        alt="NextSM — Service Desk"
        loading="eager"
        decoding="async"
        style={{
          display: "block",
          width: "260px",
          height: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "left center",
        }}
      />
    </div>
  );
}
