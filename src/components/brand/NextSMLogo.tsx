import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

/**
 * NextSM official logo — Proposal 3 / Premium-Tecnológica.
 * Uses the approved brand assets so the mark, typography and spacing stay
 * identical to the approved identity guide.
 */
export function NextSMLogo({ compact = false, inverse = false, className = "", style, ...props }: NextSMLogoProps) {
  if (compact) {
    return (
      <div
        className={`nextsm-logo nextsm-logo--compact ${className}`}
        style={{ width: 64, height: 64, overflow: "hidden", position: "relative", flexShrink: 0, ...style }}
        {...props}
      >
        <img
          src="/brand/nextsm-symbol.svg"
          alt="NextSM"
          loading="eager"
          decoding="async"
          style={{ display: "block", width: "64px", height: "64px", objectFit: "contain" }}
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
        src={inverse ? "/brand/nextsm-logo-dark.svg" : "/brand/nextsm-logo-light.svg"}
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
