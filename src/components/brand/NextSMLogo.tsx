import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

/**
 * Approved NextSM logo — Proposal 3 / Premium-Tecnológica.
 * Uses the original approved artwork recovered from the brand presentation.
 * The artwork is intentionally not redrawn in CSS/SVG primitives so its
 * proportions, typography, gradients and mark details remain faithful to
 * the approved reference.
 */
export function NextSMLogo({ compact = false, className = "", style, ...props }: NextSMLogoProps) {
  if (compact) {
    return (
      <div
        className={`nextsm-logo nextsm-logo--compact ${className}`}
        style={{ width: 64, height: 64, overflow: "hidden", position: "relative", flexShrink: 0, ...style }}
        {...props}
      >
        <img
          src="/brand/nextsm-logo-approved-dark.svg"
          alt="NextSM"
          style={{
            display: "block",
            width: "171.52px",
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
        src="/brand/nextsm-logo-approved-dark.svg"
        alt="NextSM — Service Desk"
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
