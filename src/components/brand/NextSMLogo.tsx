import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

/**
 * NextSM official logo.
 * Uses the exact approved PNG brand assets uploaded to the repository,
 * preserving the original mark, typography and spacing.
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
          src="/brand/logo Next_SM.png"
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
        src="/brand/Logo_Nome_NextSM.png"
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
