import type { HTMLAttributes } from "react";

type NextSMLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  inverse?: boolean;
};

export function NextSMLogo({ compact = false, inverse = false, className = "", ...props }: NextSMLogoProps) {
  return (
    <div className={`nextsm-logo ${inverse ? "nextsm-logo--inverse" : ""} ${className}`} {...props}>
      <span className="nextsm-logo__mark" aria-hidden="true">
        <span className="nextsm-logo__n">N</span>
        <span className="nextsm-logo__orbit nextsm-logo__orbit--one" />
        <span className="nextsm-logo__orbit nextsm-logo__orbit--two" />
        <span className="nextsm-logo__node nextsm-logo__node--one" />
        <span className="nextsm-logo__node nextsm-logo__node--two" />
      </span>
      {!compact && (
        <span className="nextsm-logo__wordmark">
          <span className="nextsm-logo__next">Next</span><span className="nextsm-logo__sm">SM</span>
        </span>
      )}
    </div>
  );
}
